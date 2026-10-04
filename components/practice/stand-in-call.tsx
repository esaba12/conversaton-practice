"use client";

import { useId, useState, type ReactNode } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import type { PracticePhase } from "@/lib/practice/flow";
import type { TranscriptTurn } from "@/lib/schemas/reflection";
import styles from "./stand-in.module.css";

// W10 "Show me first", the call itself. The seats are swapped: a stand-in plays the user and the
// user plays {name}. So there is no goal pill and no goal light here, the pill says who is on
// screen, and the captions name both chairs. End is always the way out; mute is not pause.

export const STAND_IN_PILL = "Stand-in for you · Fictional AI";
export const standInCallTitle = (counterpartName: string) => `You’re playing ${counterpartName}`;
export const pushbackPrompt = (counterpartName: string) => `Push back the way you’re afraid ${counterpartName} will.`;

export type StandInCallProps = {
  counterpartName: string;
  phase: PracticePhase;
  muted: boolean;
  cameraEnabled: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  remoteMedia: ReactNode;
  /** Local preview only: never published, and the stand-in cannot see it. */
  localPreview?: ReactNode;
  /** What the user wrote they are afraid {name} will say. Shown back to them; never sent anywhere. */
  fear?: string;
  onMuteToggle: () => void;
  onCameraToggle: () => void;
  onEnd: () => void;
  statusMessage?: string;
  /** In-memory turns for this call only. Dropped at End and never sent to reflection. */
  turns?: readonly TranscriptTurn[];
  /** A development-only fake media controller is driving the call. */
  testMedia?: boolean;
  /** Static example, not a call (design preview). */
  isMock?: boolean;
};

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

const phaseLabels: Record<PracticePhase, string> = {
  connecting: "Connecting",
  live: "In conversation",
  interrupted: "Connection interrupted",
  ended: "Stand-in call ended",
};

export type StandInCaptionLine = { key: string; speaker: string; text: string };

// "Stand-in" and "You (as {name})": the only place the swapped seats are spelled out turn by turn.
export function standInCaptionLines(open: boolean, turns: readonly TranscriptTurn[], counterpartName: string): StandInCaptionLine[] {
  if (!open) return [];
  const name = counterpartName.trim() || "them";
  const lines: StandInCaptionLine[] = [];
  turns.forEach((turn, index) => {
    const text = turn.text.trim();
    if (!text) return;
    lines.push({ key: `${index}-${turn.speaker}`, speaker: turn.speaker === "user" ? `You (as ${name})` : "Stand-in", text });
  });
  return lines;
}

export function StandInCall({
  counterpartName, phase, muted, cameraEnabled, elapsedSeconds, durationSeconds, remoteMedia, localPreview,
  fear, onMuteToggle, onCameraToggle, onEnd, statusMessage, turns = [], testMedia = false, isMock = false,
}: StandInCallProps) {
  const id = useId();
  const [pushbackOpen, setPushbackOpen] = useState(true);
  const [captionsOpen, setCaptionsOpen] = useState(false);
  const ended = phase === "ended";
  const hasRemoteMedia = remoteMedia !== null && remoteMedia !== undefined && typeof remoteMedia !== "boolean";
  const showRemoteMedia = hasRemoteMedia && !ended;
  const hasLocalPreview = localPreview !== null && localPreview !== undefined && typeof localPreview !== "boolean";
  const lines = standInCaptionLines(captionsOpen, turns, counterpartName);

  return (
    <section className={styles.call} aria-labelledby={`${id}-title`} data-phase={phase}>
      <header className={styles.callHeader}>
        <h1 id={`${id}-title`} className={styles.callTitle}>{standInCallTitle(counterpartName)}</h1>
        <div className={styles.timer} role="timer" aria-label={`${formatTime(elapsedSeconds)} elapsed, ${formatTime(durationSeconds)} planned`}>
          <span>{formatTime(elapsedSeconds)}</span><span aria-hidden="true"> / {formatTime(durationSeconds)}</span>
        </div>
      </header>
      {isMock ? <p className={styles.notes}>UI preview — no live call</p> : null}
      {testMedia ? <p className={styles.notes}>Test media — no live call</p> : null}

      <div className={styles.stage}>
        {showRemoteMedia ? <div className={styles.remoteMedia}>{remoteMedia}</div> : null}
        <div className={styles.stageTop}>
          <span className={styles.pill}>{STAND_IN_PILL}</span>
          <span className={styles.phase} role="status">{phaseLabels[phase]}</span>
        </div>
        {!showRemoteMedia || phase !== "live" ? (
          <div className={styles.placeholder}>
            <h3>{ended ? "That’s how it can sound." : phase === "connecting" ? "Getting the stand-in ready…" : phase === "interrupted" ? "The connection was interrupted." : "Stand-in video is unavailable."}</h3>
            <p>{ended ? "Your turn is next." : "You can end this at any time."}</p>
          </div>
        ) : null}
        {!ended ? (
          <aside className={styles.selfView} aria-label="Your local camera preview">
            {cameraEnabled && hasLocalPreview ? localPreview : <span>{cameraEnabled ? "Preview unavailable" : "Camera off"}</span>}
            <span>You · only visible to you</span>
          </aside>
        ) : null}
      </div>

      {pushbackOpen && !ended ? (
        <aside className={styles.pushback} aria-labelledby={`${id}-pushback`}>
          <div className={styles.pushbackHead}>
            <h3 id={`${id}-pushback`}>{pushbackPrompt(counterpartName)}</h3>
            <button type="button" className={styles.dismiss} onClick={() => setPushbackOpen(false)}>Dismiss</button>
          </div>
          {fear?.trim() ? <blockquote>“{fear.trim()}”</blockquote> : null}
        </aside>
      ) : null}

      <div className={styles.controls} role="group" aria-label="Call controls">
        <button type="button" className={styles.control} onClick={onMuteToggle} disabled={ended} aria-label={muted ? "Unmute microphone" : "Mute microphone"}>
          {muted ? <MicOff size={20} strokeWidth={1.75} aria-hidden="true" /> : <Mic size={20} strokeWidth={1.75} aria-hidden="true" />}
          <span>{muted ? "Unmute" : "Mute"}</span>
        </button>
        <button type="button" className={styles.control} onClick={onCameraToggle} disabled={ended} aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}>
          {cameraEnabled ? <Video size={20} strokeWidth={1.75} aria-hidden="true" /> : <VideoOff size={20} strokeWidth={1.75} aria-hidden="true" />}
          <span>{cameraEnabled ? "Camera off" : "Camera on"}</span>
        </button>
        <button type="button" className={`${styles.control} ${styles.endControl}`} onClick={onEnd} disabled={ended} aria-label={ended ? "Stand-in call ended" : "End the stand-in call"}>
          <PhoneOff size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>{ended ? "Ended" : "End"}</span>
        </button>
      </div>

      <div className={styles.captions}>
        <button type="button" className={styles.captionToggle} aria-expanded={captionsOpen} aria-controls={`${id}-captions`} onClick={() => setCaptionsOpen((value) => !value)}>
          {captionsOpen ? "Hide captions" : "Show captions"}
        </button>
        {captionsOpen ? (
          <div id={`${id}-captions`}>
            {lines.length === 0 ? <p className={styles.notes}>No captions yet.</p> : (
              <ol className={styles.captionList}>
                {lines.map((line) => <li key={line.key}><span className={styles.captionSpeaker}>{line.speaker}</span><span>{line.text}</span></li>)}
              </ol>
            )}
          </div>
        ) : null}
      </div>

      <div className={styles.notes}>
        {statusMessage ? <p role="status">{statusMessage}</p> : null}
        <p>The stand-in is a fictional AI playing you, with a face and voice that are not yours. Your camera stays a local preview.</p>
        <p>Nothing from this call is kept: these turns are dropped when you end, and no reflection runs on them.</p>
        {muted && !ended ? <p>Your microphone is muted. The conversation is not paused.</p> : null}
      </div>
    </section>
  );
}
