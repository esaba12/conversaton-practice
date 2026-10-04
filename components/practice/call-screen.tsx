"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ear, LifeBuoy, Send, WifiLow } from "lucide-react";
import { CaptionOverlay, currentCaption } from "@/components/presentation/captions";
import { Portrait } from "@/components/ui";
import { buildAskToWait, buildTypedTurn, buildWrapUp, inWrapUpWindow, MAX_TYPED_TURN_CHARS, typedTurnText, wrapUpDue, type Interaction, type LiveCallState } from "@/lib/media/interactions";
import type { PracticePhase } from "@/lib/practice/flow";
import type { TranscriptTurn } from "@/lib/schemas/reflection";
import { motionTransition } from "@/lib/ui/motion";
import { CallBar } from "./call-bar";
import { SelfView } from "./call-self-view";
import { EndConfirmSheet, HelpSheet, ShortcutsSheet } from "./call-sheets";
import { shortcutFor } from "./call-shortcuts";
import { Ringing } from "./ringing";
import styles from "./call.module.css";

export const CONTROLS_IDLE_MS = 3_000;

type Sheet = "help" | "end" | "shortcuts" | null;

// Forced UI state for the design gallery only. A real call never sets it.
export type CallPreview = { sheet?: Exclude<Sheet, null>; typeOpen?: boolean; typedDraft?: string; waiting?: boolean; idle?: boolean; captionsOff?: boolean; sendError?: boolean };

export type CallScreenProps = {
  counterpartName: string;
  portraitSrc?: string | null;
  goal?: string;
  phase: PracticePhase;
  muted: boolean;
  cameraEnabled: boolean;
  cameraPending?: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  remoteMedia: ReactNode;
  // Local preview only: never published, and the counterpart cannot see it.
  localPreview?: ReactNode;
  live: LiveCallState;
  turns: readonly TranscriptTurn[];
  statusMessage?: string;
  testMedia?: boolean;
  onMuteToggle: () => void;
  onCameraToggle: () => void;
  onEnd: () => void;
  // Cancel while ringing. Falls back to onEnd.
  onCancel?: () => void;
  // Sends one live interaction; true when it left for the call. Without it, typing and asking to wait are unavailable.
  onInteraction?: (interaction: Interaction) => boolean;
  layout?: "fullscreen" | "contained";
  preview?: CallPreview;
  // W10 stand-in call: the AI plays the user and the user plays the counterpart. Replaces the heading, the AI pill and the line pill.
  standIn?: { title: string; pill: string; prompt?: string };
};

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function present(node: ReactNode) {
  return node !== null && node !== undefined && typeof node !== "boolean";
}

// Controls fade after 3 s without pointer or key activity. They stay in the accessibility tree, and keyboard focus inside the
// screen keeps them shown.
function useIdle(enabled: boolean, root: React.RefObject<HTMLElement | null>) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const active = document.activeElement;
        if (active && active !== document.body && root.current?.contains(active) && active.matches(":focus-visible")) { arm(); return; }
        setIdle(true);
      }, CONTROLS_IDLE_MS);
    };
    const wake = () => { setIdle(false); arm(); };
    const events = ["pointermove", "pointerdown", "keydown", "focusin", "touchstart"] as const;
    events.forEach((name) => document.addEventListener(name, wake, { passive: true }));
    arm();
    return () => {
      clearTimeout(timer);
      events.forEach((name) => document.removeEventListener(name, wake));
    };
  }, [enabled, root]);
  return enabled && idle;
}

export function CallScreen(props: CallScreenProps) {
  const { counterpartName: name, portraitSrc, goal, phase, muted, cameraEnabled, cameraPending, elapsedSeconds, durationSeconds, remoteMedia, localPreview, live,
    turns, statusMessage, testMedia, onMuteToggle, onCameraToggle, onEnd, onCancel, onInteraction, layout = "fullscreen", preview, standIn } = props;
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const typeInputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const typeInputId = useId();
  const typeCountId = useId();
  const typeErrorId = useId();
  const modal = layout === "fullscreen";
  const isLive = phase === "live";
  const ringing = phase === "connecting";

  const [sheet, setSheet] = useState<Sheet>(preview?.sheet ?? null);
  const [captionsOn, setCaptionsOn] = useState(!preview?.captionsOff);
  const [typeOpen, setTypeOpen] = useState(Boolean(preview?.typeOpen));
  const [draft, setDraft] = useState(preview?.typedDraft ?? "");
  const [sendError, setSendError] = useState(Boolean(preview?.sendError));
  const [typed, setTyped] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(Boolean(preview?.waiting));
  const wrapSent = useRef(false);

  const idleDetected = useIdle(isLive && !preview && sheet === null && !typeOpen, rootRef);
  const idle = preview?.idle ?? idleDetected;

  // A new call starts with nothing sent and nothing pending.
  useEffect(() => {
    if (phase !== "connecting") return;
    wrapSent.current = false;
    setWaiting(false); setTyped(null); setTypeOpen(false); setDraft(""); setSendError(false);
  }, [phase]);

  // S4: once, at durationSeconds − 30, while live. Never after End; never for calls with 30 s or less.
  useEffect(() => {
    if (!onInteraction || !wrapUpDue({ live: isLive, durationSeconds, elapsedSeconds, sent: wrapSent.current })) return;
    const interaction = buildWrapUp(name);
    wrapSent.current = interaction ? onInteraction(interaction) : true;
  }, [onInteraction, isLive, durationSeconds, elapsedSeconds, name]);

  // Waiting ends when the user speaks again.
  useEffect(() => { if (live.userSpeaking && !preview?.waiting) setWaiting(false); }, [live.userSpeaking, preview?.waiting]);
  // A typed line shows until the call's own caption or turn for it arrives.
  useEffect(() => { setTyped(null); }, [live.caption, turns.length]);

  useEffect(() => {
    if (typeOpen && !preview) typeInputRef.current?.focus();
  }, [typeOpen, preview]);

  function askToWait() {
    if (!onInteraction || !isLive) return;
    const [interrupt, context] = buildAskToWait();
    if (onInteraction(interrupt) && onInteraction(context)) setWaiting(true);
  }

  function sendTyped(event?: FormEvent) {
    event?.preventDefault();
    if (!onInteraction || !isLive) return;
    const interaction = buildTypedTurn(draft);
    if (!interaction) return;
    if (!onInteraction(interaction)) { setSendError(true); return; }
    setTyped(typedTurnText(draft));
    setDraft(""); setSendError(false); setWaiting(false);
  }

  function toggleType() {
    if (!onInteraction) return;
    setTypeOpen((open) => !open);
  }

  // U4 shortcuts, live calls only. Sheets handle their own keys.
  useEffect(() => {
    if (!isLive || preview) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (sheet) return;
      const action = shortcutFor(event);
      if (!action) return;
      event.preventDefault();
      switch (action) {
        case "mute": onMuteToggle(); return;
        case "captions": setCaptionsOn((on) => !on); return;
        case "type": if (onInteraction) setTypeOpen(true); return;
        case "wait": askToWait(); return;
        case "end": setSheet("end"); return;
        case "shortcuts": setSheet("shortcuts"); return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const ended = phase === "ended" || phase === "interrupted";
  if (ended) {
    return (
      <section className={styles.endedCard} data-surface="night" aria-labelledby={headingId}>
        <Portrait name={name} size={64} src={portraitSrc} />
        <div>
          <h1 id={headingId} className={styles.endedTitle} tabIndex={-1}>{phase === "ended" ? <>Call with <span className={styles.serifName}>{name}</span> ended</> : <>The call with <span className={styles.serifName}>{name}</span> was interrupted</>}</h1>
          <p className={styles.endedNote} role="status">{statusMessage || (phase === "ended" ? "Your microphone and camera are off." : "Your microphone and camera are off. You can start again.")}</p>
        </div>
      </section>
    );
  }

  const wrapping = isLive && inWrapUpWindow(durationSeconds, elapsedSeconds);
  const progress = durationSeconds > 0 ? Math.min(1, Math.max(0, elapsedSeconds / durationSeconds)) : 0;
  const caption = captionsOn && isLive ? currentCaption(typed, live.caption, turns) : null;
  const unavailable = onInteraction ? undefined : "Typing and asking to wait aren’t available in this call.";
  const typedValid = typedTurnText(draft) !== null;
  const announcement = ringing ? `Calling ${name}` : waiting ? `${name} is waiting. The timer is still running.` : wrapping ? "Wrapping up" : `In the call with ${name}`;
  const fade = motionTransition("lift", reduced);

  return (
    <section ref={rootRef} className={styles.screen} data-layout={layout} data-idle={idle || undefined} data-phase={phase} data-surface="night" aria-labelledby={headingId}>
      <div className={styles.stage} data-speaking={live.counterpartSpeaking || undefined} data-hidden={ringing || undefined}>
        {present(remoteMedia) ? <div className={styles.remoteMedia}>{remoteMedia}</div> : isLive && <div className={styles.noVideo}><Portrait name={name} size={120} src={portraitSrc} /><p>Video is unavailable right now.</p></div>}
      </div>

      <header className={styles.topBar} data-ringing={ringing || undefined}>
        <div className={styles.identity}>
          {!ringing && <span className={styles.arc} data-wrapping={wrapping || undefined} style={{ "--progress": progress } as React.CSSProperties} aria-hidden="true"><Portrait name={name} size={40} src={portraitSrc} /></span>}
          <div className={styles.identityText}>
            <h1 id={headingId} className={styles.callName} tabIndex={-1}>{standIn ? <span className={styles.serifName}>{standIn.title}</span> : <><span className="sr-only">Call with </span><span className={styles.serifName}>{name}</span></>}</h1>
            {!ringing && <span className={styles.time} role="timer" aria-label={`${formatTime(elapsedSeconds)} elapsed of ${formatTime(durationSeconds)}`}>{formatTime(elapsedSeconds)}<span aria-hidden="true"> / {formatTime(durationSeconds)}</span></span>}
          </div>
          <span className={styles.aiPill}>{standIn?.pill ?? "Fictional AI"}</span>
          {testMedia && <span className={styles.testPill}>Test media — no live call</span>}
        </div>
        <div className={styles.chips}>
          {isLive && <span className={styles.chip} title="They can hear your tone of voice and may react to it. Nothing about your tone is saved."><Ear size={16} strokeWidth={1.75} aria-hidden="true" /><span className="sr-only">They can hear your tone of voice and may react to it. Nothing about your tone is saved.</span></span>}
          {live.weakNetwork && isLive && <span className={styles.chip}><WifiLow size={16} strokeWidth={1.75} aria-hidden="true" />Connection is weak</span>}
          {muted && isLive && <span className={styles.chip}>Muted. The call keeps going.</span>}
          {wrapping && <span className={styles.chip} data-tone="honey"><span className={styles.honeyDot} aria-hidden="true" />Wrapping up</span>}
          {waiting && isLive && <span className={styles.chip}>{name} is waiting. The timer is still running.</span>}
          {ringing && <button type="button" className={styles.topHelp} onClick={() => setSheet("help")}><LifeBuoy size={18} strokeWidth={1.75} aria-hidden="true" />Help</button>}
        </div>
      </header>
      <p className="sr-only" aria-live="polite">{announcement}</p>

      {ringing && <Ringing name={name} portraitSrc={portraitSrc} onCancel={onCancel ?? onEnd} />}

      {isLive && cameraEnabled && (
        <SelfView glow={live.userSpeaking && !muted}>{present(localPreview) ? <div className={styles.localMedia}>{localPreview}</div> : <span className={styles.selfEmpty}>Preview unavailable</span>}</SelfView>
      )}

      {isLive && (
        <div className={styles.bottom}>
          {statusMessage && <p className={styles.statusLine} role="status">{statusMessage}</p>}
          <CaptionOverlay caption={caption} counterpartName={standIn ? "Stand-in" : name} />
          <div className={styles.fadeable}>
            <AnimatePresence initial={false}>
              {typeOpen && (
                <motion.form key="type" className={styles.typeForm} onSubmit={sendTyped} initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 8 }} transition={fade} data-reduced-fade>
                  <label htmlFor={typeInputId} className="sr-only">Type what you want to say to {name}</label>
                  <input ref={typeInputRef} id={typeInputId} className={styles.typeInput} value={draft} maxLength={MAX_TYPED_TURN_CHARS} placeholder={`Say it to ${name} in writing`} autoComplete="off" spellCheck
                    aria-describedby={sendError ? `${typeErrorId} ${typeCountId}` : typeCountId} onChange={(event) => { setDraft(event.target.value); setSendError(false); }}
                    onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setTypeOpen(false); } }} />
                  {sendError && <p id={typeErrorId} className={styles.typeError} role="alert">That didn’t send. Try again, or say it out loud.</p>}
                  <span id={typeCountId} className={styles.typeCount}>{`${draft.length}/${MAX_TYPED_TURN_CHARS}`}</span>
                  <button type="submit" className={styles.typeSend} aria-disabled={!typedValid || undefined} aria-label={typedValid ? `Send to ${name}` : `Send to ${name}. Type something first.`}><Send size={20} strokeWidth={1.75} aria-hidden="true" /></button>
                </motion.form>
              )}
            </AnimatePresence>
            <CallBar name={name} muted={muted} cameraEnabled={cameraEnabled} cameraPending={cameraPending} captionsOn={captionsOn} typeOpen={typeOpen} typeInputId={typeInputId}
              waiting={waiting} userSpeaking={live.userSpeaking} interactionsUnavailable={unavailable} onMuteToggle={onMuteToggle} onCameraToggle={onCameraToggle}
              onCaptionsToggle={() => setCaptionsOn((on) => !on)} onTypeToggle={toggleType} onAskToWait={askToWait} onHelp={() => setSheet("help")} onEnd={onEnd} />
            <button type="button" className={styles.shortcutsLink} onClick={() => setSheet("shortcuts")}>Keyboard shortcuts <kbd className={styles.kbd}>?</kbd></button>
          </div>
          {standIn ? standIn.prompt && <p className={`${styles.goalPill} ${styles.fadeable}`}><span className={styles.goalLabel}>Your part</span>{standIn.prompt}</p>
            : goal?.trim() && <p className={`${styles.goalPill} ${styles.fadeable}`}><span className={styles.goalLabel}>Your line</span>{goal}</p>}
        </div>
      )}

      {sheet === "help" && <HelpSheet modal={modal} onClose={() => setSheet(null)} onEnd={() => { setSheet(null); (ringing ? onCancel ?? onEnd : onEnd)(); }} />}
      {sheet === "end" && <EndConfirmSheet modal={modal} name={name} onClose={() => setSheet(null)} onEnd={() => { setSheet(null); onEnd(); }} />}
      {sheet === "shortcuts" && <ShortcutsSheet modal={modal} onClose={() => setSheet(null)} />}
    </section>
  );
}
