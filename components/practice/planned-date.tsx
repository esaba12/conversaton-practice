"use client";

import { useId, useState } from "react";
import { PrimaryButton } from "@/components/ui";
import { buildPlannedInput, hasGuess, type Guess } from "@/lib/planned/input";
import { dayLabel } from "@/lib/planned/checkin";
import type { Planned } from "@/lib/schemas/planned";
import styles from "./keep.module.css";

// B1/W4: an optional day for the real conversation. Never required, never asked twice.
export type PlannedDateProps = {
  personId: string;
  personName: string;
  plan: Planned | null;
  // The user's private guess from the practice (browser memory). When present, the opt-in below is offered.
  guess?: Guess | null;
  busy?: boolean;
  errorMessage?: string;
  onSave: (input: NonNullable<ReturnType<typeof buildPlannedInput>>) => void;
  onRemove: () => void;
};

export function PlannedDate({ personId, personName, plan, guess = null, busy = false, errorMessage, onSave, onRemove }: PlannedDateProps) {
  const id = useId();
  const [day, setDay] = useState(plan?.plannedOn ?? "");
  const [label, setLabel] = useState(plan?.label ?? "");
  // Off by default. Not seeded from the saved plan, so a later save never keeps a guess without a fresh yes.
  const [keepGuess, setKeepGuess] = useState(false);
  const offerGuess = Boolean(day) && hasGuess(guess);
  const input = buildPlannedInput({ personId, day, label, keepGuess: keepGuess && offerGuess, guess });

  return (
    <section className={styles.panel} aria-labelledby={`${id}-title`} aria-busy={busy}>
      <h2 id={`${id}-title`} className={styles.title}>When will you talk for real?</h2>
      {plan && <p className={styles.note}>Day set for {personName}: {dayLabel(plan.plannedOn)}{plan.label ? ` · ${plan.label}` : ""}</p>}
      <form className={styles.stack} onSubmit={(event) => { event.preventDefault(); if (input && !busy) onSave(input); }} noValidate>
        <div className={styles.field}>
          <label htmlFor={`${id}-day`}>Day (optional)</label>
          <input id={`${id}-day`} type="date" value={day} onChange={(event) => setDay(event.target.value)} />
        </div>
        <div className={styles.field}>
          <div className={styles.row}><label htmlFor={`${id}-label`}>A few words to remember it by (optional)</label><span className={styles.count}>{label.length} / 120</span></div>
          <input id={`${id}-label`} type="text" maxLength={120} value={label} onChange={(event) => setLabel(event.target.value)} />
        </div>
        {offerGuess && (
          <label className={styles.check}>
            <input type="checkbox" checked={keepGuess} onChange={(event) => setKeepGuess(event.target.checked)} />
            <span>Keep my guess to check after the real conversation. Only you can see it, and you can delete it any time.</span>
          </label>
        )}
        {errorMessage && <p className={`${styles.message} ${styles.error}`} role="alert">{errorMessage}</p>}
        <div className={styles.row}>
          {input
            ? <PrimaryButton type="submit" label={plan ? "Update the day" : "Save the day"} loading={busy} loadingLabel="Saving…" />
            : <PrimaryButton type="submit" label="Save the day" disabled disabledReason="Pick a day to save it." />}
          {plan && <button type="button" className={styles.secondary} aria-disabled={busy || undefined} onClick={() => { if (!busy) onRemove(); }}>Remove the day</button>}
        </div>
      </form>
    </section>
  );
}
