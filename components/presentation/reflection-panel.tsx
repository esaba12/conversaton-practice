"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { Reflection } from "@/lib/schemas/reflection";
import styles from "./reflection.module.css";

export const SELF_REFLECTION_MAX = 1000;
/** L1: the reflection starts on its own, but not before the user has had a moment to skip it. */
export const REFLECTION_GRACE_MS = 1500;
export const REFLECTION_WAITING = "Getting your reflection";
export const ALTERNATIVE_LABEL = "Another way to say it";
export const ALTERNATIVE_NOTE = "One option. Use your own words if you prefer.";

/** A1: requested at most once per recap, so there is no list of variants to pick from. */
export type AlternativeState = { text: string | null; pending: boolean; error: string | null; requested: boolean };
export const closedAlternative: AlternativeState = { text: null, pending: false, error: null, requested: false };

export type ReflectionPanelProps = {
  selfReflection: string;
  onSelfReflectionChange: (value: string) => void;
  onReflect: () => void;
  // Skip before a result, Done after; both discard the in-memory transcript.
  onDone: () => void;
  pending?: boolean;
  reflection?: Reflection | null;
  error?: { message: string; retry: boolean } | null;
  // No user turn was captured; the request is still allowed and the server answers "insufficient".
  noSpeech?: boolean;
  /** L1/D2: on by default on the recap. Off in galleries and when the user has already skipped. */
  autoStart?: boolean;
  graceMs?: number;
  /** A1, only when the caller can make the request. Without it the button is not shown at all. */
  alternative?: AlternativeState;
  onAlternative?: () => void;
};

// W7: the quoted line writes in a word at a time, then the underline draws. Reduced motion shows
// the finished state at once (the CSS), and the words stay selectable text either way.
function QuotedLine({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <blockquote className={styles.quote}>
      <span className={styles.quoteText}>
        {words.map((word, index) => (
          <span key={`${index}-${word}`} className={styles.word} style={{ "--word-index": index } as CSSProperties}>{index ? ` ${word}` : word}</span>
        ))}
        <span className={styles.quoteRule} style={{ "--word-count": words.length } as CSSProperties} aria-hidden="true" />
      </span>
    </blockquote>
  );
}

// Deliberately no score, grade or rating: only an observed action, a takeaway and a next step.
export function ReflectionPanel({
  selfReflection, onSelfReflectionChange, onReflect, onDone, pending = false, reflection = null, error = null, noSpeech = false,
  autoStart = false, graceMs = REFLECTION_GRACE_MS, alternative = closedAlternative, onAlternative,
}: ReflectionPanelProps) {
  const id = useId();
  const requestRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const canRequest = !reflection && (!error || error.retry);
  const [waiting, setWaiting] = useState(autoStart && canRequest && !pending);
  // The request button is disabled while pending and removed after a result, which drops focus to the page.
  const requested = useRef(false);
  useEffect(() => {
    if (pending) { requested.current = true; return; }
    if (!requested.current || (document.activeElement && document.activeElement !== document.body)) return;
    (requestRef.current ?? doneRef.current)?.focus();
  }, [pending, reflection, error]);
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => { setWaiting(false); onReflect(); }, graceMs);
    return () => window.clearTimeout(timer);
    // onReflect is a stable handler on the recap; re-running on every render would restart the grace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, graceMs]);
  // Skip inside the grace period sends nothing at all.
  function skip() {
    setWaiting(false);
    onDone();
  }
  const lines = reflection && !reflection.supportExit ? ([["What you did", reflection.observedAction], ["Takeaway", reflection.takeaway], ["Next time", reflection.nextStep]] as const).filter(([, text]) => text) : [];
  const showAlternative = !!onAlternative && !!reflection && !reflection.supportExit && !!reflection.nextStep;

  return (
    <section className={styles.panel} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>Reflect (optional)</h2>
      <p>A short reflection uses what was said in the call, as transcribed by the call provider. Nothing here is saved.</p>
      <div className={styles.field}>
        <div className={styles.labelRow}><label htmlFor={`${id}-self`}>What did you notice? (optional, not saved)</label><span id={`${id}-count`} className={styles.count}>{selfReflection.length} / {SELF_REFLECTION_MAX}</span></div>
        <textarea id={`${id}-self`} value={selfReflection} maxLength={SELF_REFLECTION_MAX} autoComplete="off" disabled={pending} aria-describedby={`${id}-count`} onChange={(event) => onSelfReflectionChange(event.target.value)} />
      </div>
      {noSpeech && !reflection && <p className={styles.hint}>No speech from you was captured in this call, so there may not be enough to reflect on.</p>}
      {(waiting || pending) && <p className={styles.status} role="status">{REFLECTION_WAITING}…</p>}
      <div aria-live="polite" className={styles.result}>
        {reflection?.supportExit && <div className={styles.support}>
          <p>Practice has stopped here. If something in this conversation is weighing on you, please reach out to someone you trust or a support line.</p>
          <p>If you’re in immediate danger, call 911. In the US you can call or text 988 to reach the Suicide &amp; Crisis Lifeline.</p>
        </div>}
        {reflection && !reflection.supportExit && reflection.evidence === "insufficient" && <p>There wasn’t enough of the conversation to reflect on. Your own notes above still count.</p>}
        {reflection && !reflection.supportExit && reflection.evidence === "partial" && <p className={styles.evidence}>Based on part of the conversation</p>}
        {reflection?.quotedLine && <QuotedLine text={reflection.quotedLine} />}
        {lines.map(([label, text]) => <div key={label}><h3>{label}</h3><p>{text}</p></div>)}
        {showAlternative && <div className={styles.alternative}>
          {alternative.text
            ? <><h3>{ALTERNATIVE_LABEL}</h3><p>{alternative.text}</p><p className={styles.hint}>{ALTERNATIVE_NOTE}</p></>
            : <button type="button" className={styles.secondary} disabled={alternative.pending} aria-busy={alternative.pending || undefined} onClick={onAlternative}>{alternative.pending ? "Finding one way…" : ALTERNATIVE_LABEL}</button>}
          {alternative.error && <p className={styles.hint}>{alternative.error}</p>}
        </div>}
      </div>
      {error && <div className={styles.error} role="alert"><p>{error.message}</p></div>}
      <div className="actions">
        {canRequest && !waiting && <button type="button" ref={requestRef} className={styles.primary} disabled={pending} aria-busy={pending} onClick={onReflect}>{pending ? "Reflecting…" : error ? "Try again" : "Get a short reflection"}</button>}
        <button type="button" ref={doneRef} className={styles.secondary} onClick={skip}>{reflection ? "Done" : "Skip"}</button>
      </div>
    </section>
  );
}
