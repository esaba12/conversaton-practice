"use client";

import { useId, type ReactNode } from "react";
import styles from "./practice.module.css";

export type PracticeSetupProps = {
  counterpartName: string;
  role: string;
  publicContext: string;
  goal: string;
  onStart: () => void;
  disabled?: boolean;
  statusMessage?: string;
};

export type PracticeCallProps = {
  counterpartName: string;
  goal: string;
  phase: "connecting" | "live" | "interrupted" | "ended";
  muted: boolean;
  cameraEnabled: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  remoteMedia: ReactNode;
  localPreview?: ReactNode;
  onMuteToggle: () => void;
  onCameraToggle: () => void;
  onEnd: () => void;
  statusMessage?: string;
  isMock?: boolean;
  // A development-only fake media controller is driving the call.
  testMedia?: boolean;
};

type IconName = "arrow" | "video" | "videoOff" | "mic" | "micOff" | "end" | "person" | "check";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    video: <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3" /></>,
    videoOff: <><path d="m3 3 18 18M10 6h3a2 2 0 0 1 2 2v2l6-3v10l-3-1.5M15 15v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1" /></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" /></>,
    micOff: <><path d="m3 3 18 18M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 1v3M5 10v2a7 7 0 0 0 12 5M19 10v2M12 19v3M8 22h8" /></>,
    end: <path d="M3 14v3h5v-4a12 12 0 0 1 8 0v4h5v-3c0-6-18-6-18 0Z" />,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function PracticeSetup({ counterpartName, role, publicContext, goal, onStart, disabled = false, statusMessage }: PracticeSetupProps) {
  const id = useId();
  return (
    <section className={styles.setup} aria-labelledby={`${id}-title`}>
      <div className={styles.setupIntro}>
        <p className={styles.eyebrow}>A little preparation</p>
        <h1 id={`${id}-title`} className={styles.title}>Make room for<br /><span>the conversation.</span></h1>
        <p className={styles.lede}>Take a moment to review your setup. You don’t need the perfect words to begin.</p>
        <div className={styles.preparationNote}><span className={styles.smallIcon}><Icon name="video" /></span><p>A conversation, at your pace.<br /><span>You can end practice at any time.</span></p></div>
      </div>

      <div className={styles.setupCard}>
        <div className={styles.cardTop}><p className={styles.eyebrow}>Your practice setup</p><span className={styles.fictionalTag}>Fictional AI counterpart</span></div>
        <div className={styles.identity}><span className={styles.avatar} aria-hidden="true"><Icon name="person" /></span><div><h2>{counterpartName}</h2><p>{role}</p></div></div>
        <div className={styles.context}><h3>What the character knows</h3><p>{publicContext}</p></div>
        <div className={styles.goal}><span className={styles.goalMarker} aria-hidden="true">↗</span><div><h3>Your practice goal</h3><p>{goal}</p></div></div>
        <div className={styles.startArea}>
          <p className={styles.mediaNote}><Icon name="mic" /><span>Microphone needed. Camera is optional and only visible to you.</span></p>
          {statusMessage && <p id={`${id}-status`} className={styles.setupStatus} role="status">{statusMessage}</p>}
          <button type="button" className={styles.startButton} onClick={onStart} disabled={disabled} aria-describedby={statusMessage ? `${id}-status` : undefined}>Start practice<Icon name="arrow" /></button>
          <p className={styles.disclosure}>Practice with a fictional character. Real conversations may unfold differently.</p>
        </div>
      </div>
    </section>
  );
}

function formatTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

const phaseLabels = { connecting: "Connecting", live: "In conversation", interrupted: "Connection interrupted", ended: "Practice ended" };

export function PracticeCall({ counterpartName, goal, phase, muted, cameraEnabled, elapsedSeconds, durationSeconds, remoteMedia, localPreview, onMuteToggle, onCameraToggle, onEnd, statusMessage, isMock = false, testMedia = false }: PracticeCallProps) {
  const id = useId();
  const ended = phase === "ended";
  const hasRemoteMedia = remoteMedia !== null && remoteMedia !== undefined && typeof remoteMedia !== "boolean";
  const showRemoteMedia = hasRemoteMedia && !ended;
  const hasLocalPreview = localPreview !== null && localPreview !== undefined && typeof localPreview !== "boolean";
  const label = phase === "live" && !hasRemoteMedia ? "Video unavailable" : phaseLabels[phase];
  const placeholderTitle = ended ? "A moment to take a breath." : phase === "connecting" ? "Getting your conversation ready…" : phase === "interrupted" ? "The connection was interrupted." : "Counterpart video is unavailable.";
  const placeholderBody = ended ? "This practice has ended." : phase === "connecting" ? "Your conversation hasn’t started yet." : "You can end practice at any time.";

  return (
    <section className={styles.call} aria-labelledby={`${id}-title`}>
      <header className={styles.callHeader}><h1 id={`${id}-title`}>In conversation with <span>{counterpartName}</span></h1><div className={styles.timer} role="timer" aria-label={`${formatTime(elapsedSeconds)} elapsed, ${formatTime(durationSeconds)} planned`}><span>{formatTime(elapsedSeconds)}</span><span aria-hidden="true"> / {formatTime(durationSeconds)}</span></div></header>
      {isMock && <p className={styles.mockBanner}>UI preview — no live call</p>}
      {testMedia && <p className={styles.mockBanner}>Test media — no live call</p>}
      <div className={styles.videoStage}>
        {showRemoteMedia && <div className={styles.remoteMedia}>{remoteMedia}</div>}
        <div className={styles.stageTop}><span className={styles.stageTag}>Fictional AI counterpart</span><span className={styles.phase} data-phase={phase} role="status"><span className={styles.phaseDot} aria-hidden="true" />{label}</span></div>
        {(!showRemoteMedia || phase !== "live") && <div className={styles.stagePlaceholder} data-overlay={showRemoteMedia || undefined}><span className={styles.placeholderIcon}><Icon name={ended ? "check" : "videoOff"} /></span><h2>{placeholderTitle}</h2><p>{placeholderBody}</p></div>}
        <div className={styles.stageName}><strong>{counterpartName}</strong><span>Conversation practice</span></div>
        {!ended && <aside className={styles.selfView} aria-label="Your local camera preview">{cameraEnabled && hasLocalPreview ? <div className={styles.localMedia}>{localPreview}</div> : <div className={styles.cameraPlaceholder}><Icon name="videoOff" /><span>{cameraEnabled ? "Preview unavailable" : "Camera off"}</span></div>}<span className={styles.selfLabel}>You · only visible to you</span></aside>}
      </div>
      <div className={styles.callBottom}>
        <div className={styles.callGoal}><p className={styles.eyebrow}>Your intention</p><p>{goal}</p></div>
        <div className={styles.controls} role="group" aria-label="Call controls">
          <button type="button" className={styles.control} onClick={onMuteToggle} disabled={ended} aria-label={muted ? "Unmute microphone" : "Mute microphone"} data-active={muted}><Icon name={muted ? "micOff" : "mic"} /><span>{muted ? "Unmute" : "Mute"}</span></button>
          <button type="button" className={styles.control} onClick={onCameraToggle} disabled={ended} aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"} data-active={cameraEnabled}><Icon name={cameraEnabled ? "video" : "videoOff"} /><span>{cameraEnabled ? "Camera off" : "Camera on"}</span></button>
          <button type="button" className={`${styles.control} ${styles.endControl}`} onClick={onEnd} disabled={ended} aria-label={ended ? "Practice ended" : "End practice"}><Icon name="end" /><span>{ended ? "Ended" : "End"}</span></button>
        </div>
      </div>
      <div className={styles.callNotes}><p className={styles.callStatus} role="status">{statusMessage}</p><p>Your camera is a local preview. The counterpart responds to your voice and cannot see you.</p>{muted && !ended && <p className={styles.mutedNote}>Your microphone is muted. The conversation is not paused.</p>}</div>
    </section>
  );
}
