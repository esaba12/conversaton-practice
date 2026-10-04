"use client";

import { useId } from "react";
import { Phone } from "lucide-react";
import { PrimaryButton, PrivateCard } from "@/components/ui";
import { STAND_IN_NOTE_MAX, yourTurnTitle } from "@/lib/practice/stand-in-sitting";
import styles from "./stand-in.module.css";

// W10, after the stand-in call ends: the seats swap back. The line and the hard-moment line are
// editable here, and the note to self stays in browser memory only — it is never sent with a
// start body, never stored, and never reaches the counterpart.
export type StandInYourTurnProps = {
  counterpartName: string;
  goal: string;
  hardMomentLine: string;
  note: string;
  onGoalChange: (value: string) => void;
  onHardMomentLineChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onCall: () => void;
  starting?: boolean;
  /** Blocks the call, e.g. a previous practice is still open. */
  callDisabledReason?: string;
};

export function StandInYourTurn({
  counterpartName, goal, hardMomentLine, note,
  onGoalChange, onHardMomentLineChange, onNoteChange, onCall, starting = false, callDisabledReason,
}: StandInYourTurnProps) {
  const id = useId();
  const blocked = callDisabledReason?.trim() ?? "";

  return (
    <section className={styles.yourTurn} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.yourTurnTitle}>{yourTurnTitle(counterpartName)}</h2>

      <PrivateCard note={`${counterpartName} never sees this.`}>
        <div className={styles.field}>
          <label htmlFor={`${id}-goal`}>Want to change your line?</label>
          <textarea id={`${id}-goal`} value={goal} rows={2} maxLength={200} onChange={(event) => onGoalChange(event.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-hard`}>When it gets hard, I’ll say…</label>
          <textarea id={`${id}-hard`} value={hardMomentLine} rows={2} maxLength={200} onChange={(event) => onHardMomentLineChange(event.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-note`}>What did you notice? (optional)</label>
          <textarea id={`${id}-note`} value={note} rows={2} maxLength={STAND_IN_NOTE_MAX} onChange={(event) => onNoteChange(event.target.value)} />
          <span className={styles.count}>{note.length}/{STAND_IN_NOTE_MAX} · stays on this device, for this sitting only</span>
        </div>
      </PrivateCard>

      <p className={styles.mediaNote}>Your microphone and camera are released until you start the call.</p>

      {blocked
        ? <PrimaryButton label={`Call ${counterpartName}`} icon={Phone} disabled disabledReason={blocked} />
        : <PrimaryButton label={`Call ${counterpartName}`} icon={Phone} loading={starting} loadingLabel={`Calling ${counterpartName}…`} onClick={onCall} />}
    </section>
  );
}
