"use client";

import { useId, useState } from "react";
import styles from "./recap.module.css";

// W4 "Confidence arc", the after half. The fear and both numbers live in browser memory only
// (lib/practice/private-state.ts): they never reach the counterpart, the reflection request or the
// goal-check request, and nothing here is stored unless the user opts in on a planned date (B1).
export const ARC_NOTE = "Your numbers, not a score.";
export const ARC_QUESTION = "Did that happen?";
export const ARC_SLIDER_LABEL = "How likely does it feel for the real conversation now?";

export type Outcome = "happened" | "partly" | "didnt";
const outcomes: readonly (readonly [Outcome, string])[] = [["happened", "Happened"], ["partly", "Partly"], ["didnt", "Didn’t happen"]];

/** Both numbers, or no arc. There is no delta and no derived number anywhere. */
export function arcShown(before: number | null, after: number | null): boolean {
  return before !== null && after !== null;
}

export type RecapArcProps = {
  prediction: string;
  likelihoodBefore: number | null;
  likelihoodAfter: number | null;
  onLikelihoodAfterChange: (value: number) => void;
};

export function RecapArc({ prediction, likelihoodBefore, likelihoodAfter, onLikelihoodAfterChange }: RecapArcProps) {
  const id = useId();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const fear = prediction.trim();
  if (!fear) return null;

  return (
    <section className={styles.card} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className={styles.cardTitle}>What you expected</h3>
      <p className={styles.expected}>You expected: “{fear}”.</p>
      <p className={styles.quiet} id={`${id}-question`}>{ARC_QUESTION}</p>
      <div className={styles.choices} role="group" aria-labelledby={`${id}-question`}>
        {outcomes.map(([value, label]) => (
          <button key={value} type="button" className={styles.choice} aria-pressed={outcome === value} onClick={() => setOutcome(value)}>{label}</button>
        ))}
      </div>
      {likelihoodBefore !== null && <div className={styles.field}>
        <label htmlFor={`${id}-after`}>{ARC_SLIDER_LABEL}</label>
        <input id={`${id}-after`} type="range" min={0} max={100} step={1} value={likelihoodAfter ?? likelihoodBefore}
          onChange={(event) => onLikelihoodAfterChange(Number(event.target.value))} />
      </div>}
      {arcShown(likelihoodBefore, likelihoodAfter) && <div className={styles.arc}>
        <span className={styles.arcNumber}>{likelihoodBefore}%</span>
        <span className="sr-only">, then </span>
        <span className={styles.arcLine} aria-hidden="true" />
        <span className={styles.arcNumber}>{likelihoodAfter}%</span>
      </div>}
      {arcShown(likelihoodBefore, likelihoodAfter) && <p className={styles.quiet}>{ARC_NOTE}</p>}
    </section>
  );
}
