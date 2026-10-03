"use client";

import { useId } from "react";
import type { Reflection } from "@/lib/schemas/reflection";
import styles from "./reflection.module.css";

export const SELF_REFLECTION_MAX = 1000;

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
};

// Deliberately no score, grade or rating: only an observed action, a takeaway and a next step.
export function ReflectionPanel({ selfReflection, onSelfReflectionChange, onReflect, onDone, pending = false, reflection = null, error = null, noSpeech = false }: ReflectionPanelProps) {
  const id = useId();
  const canRequest = !reflection && (!error || error.retry);
  const lines = reflection && !reflection.supportExit ? ([["What you did", reflection.observedAction], ["Takeaway", reflection.takeaway], ["Next time", reflection.nextStep]] as const).filter(([, text]) => text) : [];

  return (
    <section className={styles.panel} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>Reflect (optional)</h2>
      <p>Did you get to say what mattered? A short reflection uses what was said in the call, as transcribed by the call provider. Nothing here is saved.</p>
      <div className={styles.field}>
        <div className={styles.labelRow}><label htmlFor={`${id}-self`}>What did you notice? (optional, not saved)</label><span id={`${id}-count`} className={styles.count}>{selfReflection.length} / {SELF_REFLECTION_MAX}</span></div>
        <textarea id={`${id}-self`} value={selfReflection} maxLength={SELF_REFLECTION_MAX} autoComplete="off" disabled={pending} aria-describedby={`${id}-count`} onChange={(event) => onSelfReflectionChange(event.target.value)} />
      </div>
      {noSpeech && !reflection && <p className={styles.hint}>No speech from you was captured in this call, so there may not be enough to reflect on.</p>}
      <div aria-live="polite" className={styles.result}>
        {reflection?.supportExit && <div className={styles.support}>
          <p>Practice has stopped here. If something in this conversation is weighing on you, please reach out to someone you trust or a support line.</p>
          <p>If you’re in immediate danger, call 911. In the US you can call or text 988 to reach the Suicide &amp; Crisis Lifeline.</p>
        </div>}
        {reflection && !reflection.supportExit && reflection.evidence === "insufficient" && <p>There wasn’t enough of the conversation to reflect on. Your own notes above still count.</p>}
        {reflection && !reflection.supportExit && reflection.evidence === "partial" && <p className={styles.evidence}>Based on part of the conversation</p>}
        {lines.map(([label, text]) => <div key={label}><h3>{label}</h3><p>{text}</p></div>)}
      </div>
      {error && <div className={styles.error} role="alert"><p>{error.message}</p></div>}
      <div className="actions">
        {canRequest && <button type="button" className={styles.primary} disabled={pending} aria-busy={pending} onClick={onReflect}>{pending ? "Reflecting…" : error ? "Try again" : "Get a short reflection"}</button>}
        <button type="button" className={styles.secondary} onClick={onDone}>{reflection ? "Done" : "Skip"}</button>
      </div>
    </section>
  );
}
