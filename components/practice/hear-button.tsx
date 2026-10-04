"use client";

import { useReducedMotion } from "motion/react";
import { Square, Volume2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { SessionPreset } from "@/lib/schemas/situation";
import { fetchVoicePreview, VoicePreviewError } from "@/lib/voice-preview/client";
import styles from "./goal-voice.module.css";

export type HearStatus = "idle" | "loading" | "playing" | "unavailable" | "error";
export const HEAR_UNAVAILABLE_REASON = "Voice preview isn’t set up";

const messages: Partial<Record<string, string>> = {
  USAGE_LIMIT: "You’ve played several previews in a short time. Try again in a few minutes.",
  UNAUTHENTICATED: "Sign in again to hear the preview.",
};
const fallbackMessage = "The preview couldn’t play. Try again.";

export function HearButtonView({ name, status, message, onPress }: { name: string; status: HearStatus; message?: string; onPress?: () => void }) {
  const id = useId();
  const unavailable = status === "unavailable";
  const reason = unavailable ? HEAR_UNAVAILABLE_REASON : status === "error" ? message ?? fallbackMessage : null;
  const Icon = status === "playing" ? Square : Volume2;
  return (
    <div className={styles.hearRow} data-hear-status={status}>
      <button type="button" className={styles.hear} onClick={unavailable || status === "loading" ? undefined : onPress}
        aria-disabled={unavailable || undefined} aria-busy={status === "loading" || undefined} aria-describedby={reason ? `${id}-reason` : undefined}>
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
        {status === "playing" ? `Stop ${name}` : status === "loading" ? `Getting ${name}’s voice…` : `Hear ${name}`}
      </button>
      {reason ? <p id={`${id}-reason`} className={styles.hearReason} role={unavailable ? undefined : "status"}>{reason}</p> : null}
    </div>
  );
}

type Load = (text: string, presetId?: SessionPreset) => Promise<Blob>;

// Plays the reviewed opening once per text: later presses replay the in-memory clip; an edited opening fetches again.
export function HearButton({ name, text, presetId, onPlayingChange, load = fetchVoicePreview }: {
  name: string;
  text: string;
  presetId?: SessionPreset;
  onPlayingChange?: (playing: boolean) => void;
  load?: Load;
}) {
  const key = `${presetId ?? ""}\n${text}`;
  const [state, setState] = useState<{ key: string; status: HearStatus; message?: string }>({ key, status: "idle" });
  const [unavailable, setUnavailable] = useState(false);
  const clip = useRef<{ key: string; url: string } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const notify = useRef(onPlayingChange);
  useEffect(() => { notify.current = onPlayingChange; }, [onPlayingChange]);

  useEffect(() => () => {
    const current = audio.current;
    audio.current = null;
    if (current) { current.onended = current.onpause = null; current.pause(); notify.current?.(false); }
    if (clip.current) { URL.revokeObjectURL(clip.current.url); clip.current = null; }
  }, [key]);

  const status: HearStatus = unavailable ? "unavailable" : state.key === key ? state.status : "idle";

  async function press() {
    if (status === "playing") { audio.current?.pause(); return; }
    // Created inside the click so browsers that tie playback to a gesture still allow it after the fetch.
    const element = new Audio();
    audio.current?.pause();
    audio.current = element;
    const stopped = () => {
      if (audio.current !== element) return;
      setState({ key, status: "idle" });
      notify.current?.(false);
    };
    element.onended = element.onpause = stopped;
    try {
      if (clip.current?.key !== key) {
        setState({ key, status: "loading" });
        const blob = await load(text, presetId);
        if (audio.current !== element) return;
        if (clip.current) URL.revokeObjectURL(clip.current.url);
        clip.current = { key, url: URL.createObjectURL(blob) };
      }
      element.src = clip.current!.url;
      await element.play();
      if (audio.current !== element) return;
      setState({ key, status: "playing" });
      notify.current?.(true);
    } catch (error) {
      if (audio.current !== element) return;
      element.onended = element.onpause = null;
      audio.current = null;
      if (error instanceof VoicePreviewError && error.code === "NOT_CONFIGURED") { setUnavailable(true); return; }
      setState({ key, status: "error", message: error instanceof VoicePreviewError ? messages[error.code] ?? fallbackMessage : fallbackMessage });
    }
  }

  return <HearButtonView name={name} status={status} message={state.key === key ? state.message : undefined} onPress={() => void press()} />;
}

// Highlights the opening-line bubble while the clip plays; reduced motion gets no highlight.
export function useHearHighlight() {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const highlighted = playing && !reduced;
  return { highlighted, onPlayingChange: setPlaying, bubbleClassName: highlighted ? hearingBubbleClass : undefined };
}
export const hearingBubbleClass = styles.bubbleHearing;
