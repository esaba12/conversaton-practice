"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { roleContextSchema, type RoleContext } from "@/lib/schemas/role-context";
import styles from "./setup.module.css";

export const GOAL_MAX = 200;
const MAX_CONSTRAINTS = 5;
const limits = { name: 60, role: 120, style: 300, publicContext: 1500, opening: 300, constraint: 200 } as const;

export type SetupMode = "generated" | "manual" | "example";

export const emptyRole: RoleContext = { name: "", role: "", style: "", publicContext: "", opening: "", constraints: [], challenge: "neutral", pace: "patient" };

// Blank constraint rows are dropped so an unused "add" row never blocks Start.
export function parseReviewedRole(role: RoleContext): RoleContext | null {
  const parsed = roleContextSchema.safeParse({ ...role, constraints: role.constraints.filter((item) => item.trim().length > 0) });
  return parsed.success ? parsed.data : null;
}

const requiredFields: { key: "name" | "role" | "style" | "publicContext" | "opening"; label: string }[] = [
  { key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "style", label: "How they talk" }, { key: "publicContext", label: "What this character knows" }, { key: "opening", label: "Opening line" },
];

const challengeOptions: { value: RoleContext["challenge"]; label: string }[] = [
  { value: "supportive", label: "Supportive" }, { value: "neutral", label: "Neutral" }, { value: "mild_pushback", label: "Mild pushback" },
];
const paceOptions: { value: RoleContext["pace"]; label: string }[] = [
  { value: "patient", label: "Patient" }, { value: "conversational", label: "Conversational" },
];

const modeLabels: Record<SetupMode, string> = {
  generated: "Generated draft — review and edit",
  manual: "Manual setup — not generated",
  example: "Example setup — not generated",
};

export type SetupReviewProps = {
  mode: SetupMode;
  role: RoleContext;
  goal: string;
  assumptions: string[];
  onRoleChange: (role: RoleContext) => void;
  onGoalChange: (goal: string) => void;
  onBack: () => void;
  onRegenerate?: () => void;
  onStart: () => void;
  regenerating?: boolean;
  disabled?: boolean;
  startDisabled?: boolean;
  statusMessage?: string;
  errorMessage?: string;
  actions?: ReactNode;
  focusHeading?: boolean;
};

export function SetupReview({ mode, role, goal, assumptions, onRoleChange, onGoalChange, onBack, onRegenerate, onStart, regenerating = false, disabled = false, startDisabled = false, statusMessage, errorMessage, actions, focusHeading = false }: SetupReviewProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focusHeading) headingRef.current?.focus(); }, [focusHeading]);
  const valid = parseReviewedRole(role) !== null;
  const missing = requiredFields.filter(({ key }) => role[key].trim().length === 0).map(({ label }) => label);
  const busy = disabled || regenerating;
  const canStart = valid && !busy && !startDisabled;
  const set = <K extends keyof RoleContext>(key: K, value: RoleContext[K]) => onRoleChange({ ...role, [key]: value });
  const setConstraint = (index: number, value: string) => set("constraints", role.constraints.map((item, i) => (i === index ? value : item)));

  function textField(key: "name" | "role", label: string) {
    return <div className={styles.field}>
      <div className={styles.labelRow}><label htmlFor={`${id}-${key}`}>{label}</label><span id={`${id}-${key}-count`} className={styles.count}>{role[key].length} / {limits[key]}</span></div>
      <input id={`${id}-${key}`} type="text" required maxLength={limits[key]} value={role[key]} disabled={busy} aria-describedby={`${id}-${key}-count`} onChange={(event) => set(key, event.target.value)} />
    </div>;
  }
  function areaField(key: "style" | "publicContext" | "opening", label: string, rows: number, hint?: string) {
    return <div className={styles.field}>
      <div className={styles.labelRow}><label htmlFor={`${id}-${key}`}>{label}</label><span id={`${id}-${key}-count`} className={styles.count}>{role[key].length} / {limits[key]}</span></div>
      {hint && <p id={`${id}-${key}-hint`} className={styles.hint}>{hint}</p>}
      <textarea id={`${id}-${key}`} rows={rows} required maxLength={limits[key]} value={role[key]} disabled={busy} aria-describedby={`${hint ? `${id}-${key}-hint ` : ""}${id}-${key}-count`} onChange={(event) => set(key, event.target.value)} />
    </div>;
  }

  return (
    <section className={styles.setup} aria-labelledby={`${id}-title`} aria-busy={regenerating}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Review your setup</p>
        <h1 id={`${id}-title`} ref={headingRef} tabIndex={-1} className={styles.title}>Shape the<br /><span>conversation.</span></h1>
        <p className={styles.lede}>Everything here is editable. The character only knows what’s on this card.</p>
        <p className={styles.modeTag} data-mode={mode}>{modeLabels[mode]}</p>
        {assumptions.length > 0 && <div className={styles.assumptions}>
          <h2>Assumptions to check</h2>
          <ul>{assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </div>}
      </div>

      <form className={styles.card} onSubmit={(event) => { event.preventDefault(); if (canStart) onStart(); }} noValidate>
        <div className={styles.cardTop}><p className={styles.eyebrow}>The character</p><span className={styles.fictionalTag}>Fictional AI counterpart</span></div>
        <div className={styles.pair}>{textField("name", "Name")}{textField("role", "Role")}</div>
        {areaField("style", "How they talk", 3)}
        {areaField("publicContext", "What this character knows", 4, "Shared with the character.")}
        {areaField("opening", "Opening line", 2, "The first thing the character says.")}

        <fieldset className={styles.fieldset} disabled={busy}>
          <legend>Things to keep in mind <span className={styles.optional}>Up to {MAX_CONSTRAINTS}</span></legend>
          {role.constraints.map((item, index) => <div key={index} className={styles.constraintRow}>
            <label className="sr-only" htmlFor={`${id}-constraint-${index}`}>Constraint {index + 1}</label>
            <input id={`${id}-constraint-${index}`} type="text" maxLength={limits.constraint} value={item} onChange={(event) => setConstraint(index, event.target.value)} />
            <button type="button" className={styles.removeButton} aria-label={`Remove constraint ${index + 1}`} onClick={() => set("constraints", role.constraints.filter((_, i) => i !== index))}>Remove</button>
          </div>)}
          {role.constraints.length < MAX_CONSTRAINTS && <button type="button" className={styles.linkButton} onClick={() => set("constraints", [...role.constraints, ""])}>Add constraint</button>}
        </fieldset>

        <div className={styles.pair}>
          <fieldset className={styles.fieldset} disabled={busy}>
            <legend>Challenge</legend>
            <div className={styles.choices}>{challengeOptions.map((option) => <label key={option.value} className={styles.choice}><input type="radio" name={`${id}-challenge`} value={option.value} checked={role.challenge === option.value} onChange={() => set("challenge", option.value)} />{option.label}</label>)}</div>
          </fieldset>
          <fieldset className={styles.fieldset} disabled={busy}>
            <legend>Pace</legend>
            <div className={styles.choices}>{paceOptions.map((option) => <label key={option.value} className={styles.choice}><input type="radio" name={`${id}-pace`} value={option.value} checked={role.pace === option.value} onChange={() => set("pace", option.value)} />{option.label}</label>)}</div>
          </fieldset>
        </div>

        <div className={`${styles.field} ${styles.goalField}`}>
          <div className={styles.labelRow}><label htmlFor={`${id}-goal`}>Your goal</label><span id={`${id}-goal-count`} className={styles.count}>{goal.length} / {GOAL_MAX}</span></div>
          <p id={`${id}-goal-hint`} className={styles.privateTag}>Not shared with the character</p>
          <input id={`${id}-goal`} type="text" maxLength={GOAL_MAX} value={goal} disabled={busy} aria-describedby={`${id}-goal-hint ${id}-goal-count`} onChange={(event) => onGoalChange(event.target.value)} />
        </div>

        <div className={styles.startArea}>
          {actions}
          {!valid && <p id={`${id}-missing`} className={styles.hint}>{missing.length > 0 ? `Still needed: ${missing.join(", ")}.` : "Check that every field is within its limit."}</p>}
          {regenerating && <p className={styles.status} role="status">Drafting a new setup…</p>}
          {statusMessage && !regenerating && <p className={styles.status} role="status">{statusMessage}</p>}
          {errorMessage && !regenerating && <p className={styles.error} role="alert">{errorMessage}</p>}
          <p className={styles.mediaNote}>Microphone needed. Camera is optional and only visible to you.</p>
          <p className={styles.mediaNote}>{role.name.trim() || "The character"} can hear your tone of voice (for example, if you sound unsure) and may react to it. Nothing about your tone is saved.</p>
          <button type="submit" className={styles.primaryButton} disabled={!canStart} aria-describedby={!valid ? `${id}-missing` : undefined}>Start practice</button>
          <div className={styles.linkRow}>
            <button type="button" className={styles.linkButton} onClick={onBack} disabled={busy}>Back</button>
            {onRegenerate && <button type="button" className={styles.linkButton} onClick={onRegenerate} disabled={busy} aria-busy={regenerating}>{regenerating ? "Regenerating…" : "Regenerate"}</button>}
          </div>
          <p className={styles.fine}>Practice with a fictional character. Real conversations may unfold differently.</p>
        </div>
      </form>
    </section>
  );
}
