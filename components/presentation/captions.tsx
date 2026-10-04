"use client";

import { useId, useState } from "react";
import type { LiveCaption, Speaker } from "@/lib/media/interactions";
import type { TranscriptTurn } from "@/lib/schemas/reflection";
import styles from "./captions.module.css";

export type CaptionLine = { key: string; speaker: string; text: string };

// Finished turns already held for this attempt. Closed, or no usable text, yields no lines.
export function captionLines(open: boolean, turns: readonly TranscriptTurn[], counterpartName: string): CaptionLine[] {
  if (!open) return [];
  const name = counterpartName.trim() || "Counterpart";
  const lines: CaptionLine[] = [];
  turns.forEach((turn, index) => {
    const text = turn.text.trim();
    if (!text) return;
    lines.push({ key: `${index}-${turn.speaker}`, speaker: turn.speaker === "user" ? "You" : name, text });
  });
  return lines;
}

// Optional captions for the current attempt. Collapsed until opened. The on/off status is the only live announcement.
export function Captions({ turns, counterpartName }: { turns: readonly TranscriptTurn[]; counterpartName: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const lines = captionLines(open, turns, counterpartName);

  return (
    <div className={styles.captions}>
      <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
        {open ? "Hide captions" : "Show captions"}
      </button>
      <p className="sr-only" role="status">{open ? "Captions on" : "Captions off"}</p>
      {open && (
        <div id={panelId} className={styles.panel}>
          {lines.length === 0 ? <p className={styles.empty}>No captions yet for this practice.</p> : (
            <ol className={styles.list}>
              {lines.map((line) => (
                <li key={line.key}><span className={styles.speaker}>{line.speaker}</span><span className={styles.text}>{line.text}</span></li>
              ))}
            </ol>
          )}
          <p className={styles.note}>Only for this practice. Not saved.</p>
        </div>
      )}
    </div>
  );
}

export type OverlayCaption = { speaker: Speaker; text: string; streaming: boolean };

const CAPTION_TAIL_CHARS = 140;

// Two lines at most: keep the newest words of a long turn, cut at a word boundary.
export function captionTail(text: string, max = CAPTION_TAIL_CHARS) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const tail = clean.slice(clean.length - max);
  const space = tail.indexOf(" ");
  return `…${space > 0 && space < 24 ? tail.slice(space + 1) : tail}`;
}

// What the overlay shows: the user's just-typed turn, else the streaming caption (S3), else the last finished turn.
export function currentCaption(typed: string | null, live: LiveCaption | null, turns: readonly TranscriptTurn[]): OverlayCaption | null {
  if (typed?.trim()) return { speaker: "user", text: typed.trim(), streaming: false };
  if (live?.text.trim()) return { speaker: live.speaker, text: live.text.trim(), streaming: !live.final };
  const last = turns[turns.length - 1];
  return last?.text.trim() ? { speaker: last.speaker, text: last.text.trim(), streaming: false } : null;
}

// In-call captions over the video, on a scrim. Not a live region: the voice is the announcement, and streaming text would
// repeat for screen readers on every word.
export function CaptionOverlay({ caption, counterpartName }: { caption: OverlayCaption | null; counterpartName: string }) {
  if (!caption) return null;
  const speaker = caption.speaker === "user" ? "You" : counterpartName.trim() || "Counterpart";
  return (
    <div className={styles.overlay} data-speaker={caption.speaker} data-streaming={caption.streaming || undefined}>
      <span className={styles.overlaySpeaker}>{speaker}</span>
      <p className={styles.overlayText}>{captionTail(caption.text)}</p>
    </div>
  );
}
