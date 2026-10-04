"use client";

import { useId, useState } from "react";
import { Phone } from "lucide-react";
import { PrimaryButton } from "@/components/ui";
import styles from "./recap.module.css";

// docs/30 "One-moment retry". The self-check is client state: the answer is never sent to the
// server, to reflection, or to any model call, and the counterpart never learns the user's plan.
export const SELF_CHECK_QUESTION = "Did you say it?";
export const NOT_SURE_COPY = "There isn’t a clear moment to redo. You can stop here.";
export const RETRY_LABEL = "Try that moment once";
export const RETRY_DONE_COPY = "You tried the line you planned. You can stop here.";
export const STOP_HERE_COPY = "You can stop here.";
export const RETRY_OPENING_LABEL = "They open with this. Change it if you like.";
/** The counterpart may sound unhappy and still stays civil (docs/08). The user can edit it. */
export const RETRY_OPENING = "I’m already stretched thin. I don’t know why this has to be a thing right now.";
/** The existing opening limit; a retry adds no new field and no new duration. */
export const RETRY_OPENING_MAX = 300;
export const RETRY_DURATION_SECONDS = 180;

export type SelfCheckAnswer = "yes" | "not-sure" | "no";
const answers: readonly (readonly [SelfCheckAnswer, string])[] = [["yes", "Yes"], ["not-sure", "Not sure"], ["no", "No"]];

/**
 * The self-check exists only to offer the one retry, so it appears only when a retry is still
 * possible: the user wrote a hard-moment line, the call did not take the support exit, this is not
 * already the retry's recap, and the sitting has a call left.
 */
export function selfCheckShown(input: { hardMomentLine: string; supportExit: boolean; isRetry: boolean; retryAvailable: boolean }): boolean {
  return input.hardMomentLine.trim() !== "" && !input.supportExit && !input.isRetry && input.retryAvailable;
}

export type RecapSelfCheckProps = {
  counterpartName: string;
  hardMomentLine: string;
  onRetry: (opening: string) => void;
  starting?: boolean;
};

export function RecapSelfCheck({ counterpartName, hardMomentLine, onRetry, starting = false }: RecapSelfCheckProps) {
  const id = useId();
  const [answer, setAnswer] = useState<SelfCheckAnswer | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [opening, setOpening] = useState(RETRY_OPENING);
  const line = opening.trim();

  return (
    <section className={styles.card} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className={styles.cardTitle}>{SELF_CHECK_QUESTION}</h3>
      <p className={styles.quiet}>You planned: “{hardMomentLine.trim()}”</p>
      <div className={styles.choices} role="group" aria-labelledby={`${id}-title`}>
        {answers.map(([value, label]) => (
          <button key={value} type="button" className={styles.choice} aria-pressed={answer === value}
            onClick={() => { setAnswer(value); setAccepted(false); }}>{label}</button>
        ))}
      </div>
      {answer === "not-sure" && <p className={styles.quiet}>{NOT_SURE_COPY}</p>}
      {answer === "no" && !accepted && (
        <div className={styles.actionsRow}>
          <button type="button" className={styles.secondary} onClick={() => setAccepted(true)}>{RETRY_LABEL}</button>
          <p className={styles.quiet}>{STOP_HERE_COPY}</p>
        </div>
      )}
      {answer === "no" && accepted && (
        <div className={styles.field}>
          <label htmlFor={`${id}-opening`}>{RETRY_OPENING_LABEL}</label>
          <textarea id={`${id}-opening`} value={opening} rows={2} maxLength={RETRY_OPENING_MAX} onChange={(event) => setOpening(event.target.value)} />
          {line
            ? <PrimaryButton label={`Call ${counterpartName}`} icon={Phone} loading={starting} loadingLabel={`Calling ${counterpartName}…`} onClick={() => onRetry(line)} />
            : <PrimaryButton label={`Call ${counterpartName}`} icon={Phone} disabled disabledReason="Write the line they open with first." />}
        </div>
      )}
    </section>
  );
}
