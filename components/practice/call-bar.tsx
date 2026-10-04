"use client";

import { useId, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Captions, CaptionsOff, Hand, Keyboard, LifeBuoy, LoaderCircle, Mic, MicOff, PhoneOff, Video, VideoOff, type LucideIcon } from "lucide-react";
import { motionTransition } from "@/lib/ui/motion";
import styles from "./call.module.css";

export type CallButtonProps = {
  icon: LucideIcon;
  label: string;
  // Accessible name when it says more than the visible label ("Ask Jordan to wait").
  ariaLabel?: string;
  onPress: () => void;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  danger?: boolean;
  glow?: boolean;
  loading?: boolean;
  disabledReason?: string;
  previewState?: "hover" | "focus" | "active";
  describedBy?: string;
};

// 56 px glass button with its label under the icon. Disabled stays focusable (aria-disabled) and points at its reason.
export function CallButton({ icon: Icon, label, ariaLabel, onPress, pressed, expanded, controls, danger, glow, loading, disabledReason, previewState, describedBy }: CallButtonProps) {
  const reduced = useReducedMotion();
  const reasonId = useId();
  const inert = Boolean(disabledReason) || Boolean(loading);
  function handle(event: MouseEvent<HTMLButtonElement>) {
    if (inert) { event.preventDefault(); return; }
    onPress();
  }
  const ShownIcon = loading ? LoaderCircle : Icon;
  return (
    <span className={styles.callButtonWrap}>
      <motion.button type="button" className={styles.callButton} data-danger={danger || undefined} data-glow={glow || undefined} data-preview-state={previewState}
        aria-label={ariaLabel} aria-pressed={pressed} aria-expanded={expanded} aria-controls={controls} aria-disabled={disabledReason ? true : undefined} aria-busy={loading || undefined}
        aria-describedby={describedBy ?? (disabledReason ? reasonId : undefined)}
        onClick={handle} whileTap={inert || reduced ? {} : { scale: 0.96, y: 0.5 }} transition={motionTransition("press", reduced)} data-reduced-fade>
        <span className={styles.callButtonIcon}><ShownIcon className={loading ? styles.spin : undefined} size={24} strokeWidth={1.75} aria-hidden="true" /></span>
        <span className={styles.callButtonLabel}>{label}</span>
      </motion.button>
      {disabledReason && !describedBy && <span id={reasonId} className={styles.buttonReason}>{disabledReason}</span>}
    </span>
  );
}

export type CallBarProps = {
  name: string;
  muted: boolean;
  cameraEnabled: boolean;
  cameraPending?: boolean;
  captionsOn: boolean;
  typeOpen: boolean;
  typeInputId: string;
  waiting: boolean;
  userSpeaking: boolean;
  // Set when typing and asking to wait can't be used in this call; shown as a visible line above the bar.
  interactionsUnavailable?: string;
  onMuteToggle: () => void;
  onCameraToggle: () => void;
  onCaptionsToggle: () => void;
  onTypeToggle: () => void;
  onAskToWait: () => void;
  onHelp: () => void;
  onEnd: () => void;
};

export function CallBar(props: CallBarProps) {
  const { name, muted, cameraEnabled, cameraPending, captionsOn, typeOpen, typeInputId, waiting, userSpeaking, interactionsUnavailable } = props;
  const unavailableId = useId();
  const unavailable = interactionsUnavailable ? unavailableId : undefined;
  return (
    <div className={styles.barWrap}>
      {interactionsUnavailable && <p id={unavailableId} className={styles.barNote}>{interactionsUnavailable}</p>}
      <div className={styles.bar} role="group" aria-label="Call controls">
        {/* Mute is not pause: the call and its timer keep going. */}
        <CallButton icon={muted ? MicOff : Mic} label={muted ? "Unmute" : "Mute"} ariaLabel={muted ? "Unmute microphone" : "Mute microphone"} pressed={muted} glow={userSpeaking && !muted} onPress={props.onMuteToggle} />
        <CallButton icon={cameraEnabled ? Video : VideoOff} label="Camera" ariaLabel={cameraEnabled ? "Hide my camera preview" : "Show my camera preview (only you see it)"} pressed={cameraEnabled} loading={cameraPending} onPress={props.onCameraToggle} />
        <CallButton icon={captionsOn ? Captions : CaptionsOff} label="Captions" ariaLabel={captionsOn ? "Hide captions" : "Show captions"} pressed={captionsOn} onPress={props.onCaptionsToggle} />
        <CallButton icon={Keyboard} label="Type" ariaLabel="Type instead of speaking" expanded={typeOpen} controls={typeOpen ? typeInputId : undefined} disabledReason={interactionsUnavailable} describedBy={unavailable} onPress={props.onTypeToggle} />
        <CallButton icon={Hand} label="Wait" ariaLabel={`Ask ${name} to wait`} pressed={waiting} disabledReason={interactionsUnavailable} describedBy={unavailable} onPress={props.onAskToWait} />
        <CallButton icon={LifeBuoy} label="Help" ariaLabel="Help and support" onPress={props.onHelp} />
        <span className={styles.barGap} aria-hidden="true" />
        <CallButton icon={PhoneOff} label="End" ariaLabel="End practice" danger onPress={props.onEnd} />
      </div>
    </div>
  );
}
