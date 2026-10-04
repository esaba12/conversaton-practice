"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { PrimaryButton } from "@/components/ui";
import { checkinDue } from "@/lib/planned/checkin";
import type { CheckinAnswer, Planned } from "@/lib/schemas/planned";
import styles from "./keep.module.css";

export function TalkedForRealMark() {
  return <span className={styles.mark}><Check size={16} strokeWidth={1.75} aria-hidden="true" />Talked for real</span>;
}

// B2: asked once per date, in the app only. Shows nothing unless the plan exists, its day has come, and it is unanswered.
export type CheckinBannerProps = {
  plan: Planned | null;
  personName: string;
  // YYYY-MM-DD in the user's calendar; a prop so the rule is testable and the gallery can pin a day.
  today: string;
  busy?: boolean;
  errorMessage?: string;
  // Resolve true when the answer was saved.
  onAnswer: (answer: CheckinAnswer, note?: string) => Promise<boolean>;
  onPickDay: (day: string) => Promise<boolean>;
  // For the design gallery only.
  initialStep?: Step;
};

export type Step = "ask" | "yes" | "newday" | "done";
const tomorrow = (today: string) => {
  const [y, m, d] = today.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
};

export function CheckinBanner({ plan, personName, today, busy = false, errorMessage, onAnswer, onPickDay, initialStep = "ask" }: CheckinBannerProps) {
  const id = useId();
  const [step, setStep] = useState<Step>(initialStep);
  const [note, setNote] = useState("");
  const [day, setDay] = useState("");
  const [thanks, setThanks] = useState(false);

  // After "Not yet" or "Yes" the plan is answered and no longer due, but this banner still has a next step to show.
  if (step === "done") return thanks ? <TalkedForRealMark /> : null;
  if (step === "ask" && !checkinDue(plan, today)) return null;

  async function answer(value: CheckinAnswer, text?: string) {
    if (busy) return;
    if (!(await onAnswer(value, text))) return;
    if (value === "not_yet") setStep("newday");
    else { setThanks(value === "yes"); setStep("done"); }
  }
  async function pickDay() {
    if (busy || !day) return;
    if (await onPickDay(day)) setStep("done");
  }

  return (
    <section className={styles.banner} aria-labelledby={`${id}-q`} aria-busy={busy}>
      {step === "ask" && <>
        <h2 id={`${id}-q`} className={styles.question}>Did you talk with {personName}?</h2>
        <div className={styles.row}>
          <button type="button" className={styles.secondary} aria-disabled={busy || undefined} onClick={() => void answer("not_yet")}>Not yet</button>
          <button type="button" className={styles.secondary} aria-disabled={busy || undefined} onClick={() => void answer("decided_not")}>I decided not to</button>
          <button type="button" className={styles.secondary} aria-disabled={busy || undefined} onClick={() => setStep("yes")}>Yes</button>
        </div>
      </>}
      {step === "yes" && <form className={styles.stack} onSubmit={(event) => { event.preventDefault(); void answer("yes", note.trim() || undefined); }}>
        <h2 id={`${id}-q`} className={styles.question}>{plan?.fear ? "What actually happened?" : "How did it go?"}</h2>
        {plan?.fear && <p className={styles.recall}>You expected: “{plan.fear}”.</p>}
        <div className={styles.field}>
          <div className={styles.row}><label htmlFor={`${id}-note`}>One line, if you want (optional)</label><span className={styles.count}>{note.length} / 200</span></div>
          <input id={`${id}-note`} type="text" maxLength={200} value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <div className={styles.row}><PrimaryButton type="submit" label="Save" loading={busy} loadingLabel="Saving…" /></div>
      </form>}
      {step === "newday" && <form className={styles.stack} onSubmit={(event) => { event.preventDefault(); void pickDay(); }}>
        <h2 id={`${id}-q`} className={styles.question}>That’s okay. Pick a new day if you like.</h2>
        <div className={styles.field}>
          <label htmlFor={`${id}-day`}>New day (optional)</label>
          <input id={`${id}-day`} type="date" min={tomorrow(today)} value={day} onChange={(event) => setDay(event.target.value)} />
        </div>
        <div className={styles.row}>
          {day ? <PrimaryButton type="submit" label="Use this day" loading={busy} loadingLabel="Saving…" /> : <PrimaryButton type="submit" label="Use this day" disabled disabledReason="Pick a day first, or skip." />}
          <button type="button" className={styles.secondary} onClick={() => setStep("done")}>Skip</button>
        </div>
      </form>}
      {errorMessage && <p className={`${styles.message} ${styles.error}`} role="alert">{errorMessage}</p>}
    </section>
  );
}
