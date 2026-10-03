"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./setup.module.css";

export const SITUATION_MAX = 1000;
export const INTENT_MAX = 200;
export const NOTES_MAX = 1000;

export type SetupDescribeError = { message: string; outOfScope: boolean };

export type SetupDescribeProps = {
  situation: string;
  goal: string;
  privateNotes: string;
  onSituationChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onPrivateNotesChange: (value: string) => void;
  onGenerate: () => void;
  onManual: () => void;
  onUseExample?: () => void;
  generating?: boolean;
  disabled?: boolean;
  error?: SetupDescribeError | null;
  focusHeading?: boolean;
};

export function SetupDescribe({ situation, goal, privateNotes, onSituationChange, onGoalChange, onPrivateNotesChange, onGenerate, onManual, onUseExample, generating = false, disabled = false, error, focusHeading = false }: SetupDescribeProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focusHeading) headingRef.current?.focus(); }, [focusHeading]);
  const busy = generating || disabled;
  const canGenerate = situation.trim().length > 0 && situation.length <= SITUATION_MAX && !busy;

  return (
    <section className={styles.setup} aria-labelledby={`${id}-title`} aria-busy={generating}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>A little preparation</p>
        <h1 id={`${id}-title`} ref={headingRef} tabIndex={-1} className={styles.title}>What conversation<br /><span>is on your mind?</span></h1>
        <p className={styles.lede}>Describe it in your own words. We’ll draft a fictional character and an opening you can review and edit before you start.</p>
        <p className={styles.fine}>Practice with a fictional character. Real conversations may unfold differently.</p>
      </div>

      <form className={styles.card} onSubmit={(event) => { event.preventDefault(); if (canGenerate) onGenerate(); }} noValidate>
        <div className={styles.field}>
          <div className={styles.labelRow}><label htmlFor={`${id}-situation`}>The situation</label><span id={`${id}-situation-count`} className={styles.count}>{situation.length} / {SITUATION_MAX}</span></div>
          <textarea id={`${id}-situation`} rows={5} required maxLength={SITUATION_MAX} value={situation} disabled={busy} aria-describedby={`${id}-situation-hint ${id}-situation-count`} onChange={(event) => onSituationChange(event.target.value)} />
          <p id={`${id}-situation-hint`} className={styles.hint}>Who is it with, and what’s going on? For example, “My roommate keeps leaving dishes in the sink.”</p>
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}><label htmlFor={`${id}-goal`}>What do you want to say or do? <span className={styles.optional}>Optional</span></label><span id={`${id}-goal-count`} className={styles.count}>{goal.length} / {INTENT_MAX}</span></div>
          <input id={`${id}-goal`} type="text" maxLength={INTENT_MAX} value={goal} disabled={busy} aria-describedby={`${id}-goal-count`} onChange={(event) => onGoalChange(event.target.value)} />
        </div>

        <div className={`${styles.field} ${styles.privateField}`}>
          <div className={styles.labelRow}><label htmlFor={`${id}-notes`}>Private preparation notes <span className={styles.optional}>Optional</span></label><span id={`${id}-notes-count`} className={styles.count}>{privateNotes.length} / {NOTES_MAX}</span></div>
          <p id={`${id}-notes-hint`} className={styles.privateTag}>Never shared with the character</p>
          <textarea id={`${id}-notes`} rows={3} autoComplete="off" spellCheck={false} maxLength={NOTES_MAX} value={privateNotes} disabled={busy} aria-describedby={`${id}-notes-hint ${id}-notes-count`} onChange={(event) => onPrivateNotesChange(event.target.value)} />
        </div>

        {generating && <p className={styles.status} role="status">Drafting your setup…</p>}
        {error && !generating && <div className={styles.error} role="alert">
          <p>{error.message}</p>
          {error.outOfScope
            ? <p>Try describing an everyday conversation, like asking a professor for help or talking with a roommate about chores.</p>
            : <><p>Your description is still here. You can try again or fill in the setup yourself.</p><button type="button" className={styles.secondaryButton} onClick={onManual} disabled={busy}>Set up manually</button></>}
        </div>}

        <button type="submit" className={styles.primaryButton} disabled={!canGenerate} aria-busy={generating}>{generating ? "Generating…" : "Generate setup"}</button>
        <div className={styles.linkRow}>
          <button type="button" className={styles.linkButton} onClick={onManual} disabled={busy}>Enter setup manually</button>
          {onUseExample && <button type="button" className={styles.linkButton} onClick={onUseExample} disabled={busy}>Use roommate example</button>}
        </div>
      </form>
    </section>
  );
}
