"use client";

import { useId, useState } from "react";
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
