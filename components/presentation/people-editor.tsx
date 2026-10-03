"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { personFieldsSchema, type PersonFields } from "@/lib/schemas/people";
import { traitOptions, type TraitChips } from "@/lib/schemas/role-context";
import { formatUpdated } from "./people-list";
import styles from "./people.module.css";
import setup from "./setup.module.css";

const MAX_CONSTRAINTS = 5;
const limits = { name: 60, relationship: 120, style: 300, publicContext: 1500, opening: 300, constraint: 200 } as const;
type TraitKey = keyof typeof traitOptions;
const traitLabels: Record<TraitKey, string> = { tone: "Tone", formality: "Formality", talkativeness: "Talkativeness", familiarity: "Familiarity" };
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const challengeOptions: { value: PersonFields["challenge"]; label: string }[] = [{ value: "supportive", label: "Supportive" }, { value: "neutral", label: "Neutral" }, { value: "mild_pushback", label: "Mild pushback" }];
const paceOptions: { value: PersonFields["pace"]; label: string }[] = [{ value: "patient", label: "Patient" }, { value: "conversational", label: "Conversational" }];
const requiredFields: { key: "name" | "relationship" | "style" | "publicContext" | "opening"; label: string }[] = [
  { key: "name", label: "Name" }, { key: "relationship", label: "Relationship" }, { key: "style", label: "How they talk" }, { key: "publicContext", label: "What they know about the situation" }, { key: "opening", label: "Opening line" },
];

export const emptyPerson: PersonFields = { name: "", relationship: "", style: "", publicContext: "", opening: "", constraints: [], challenge: "neutral", pace: "patient", traits: {} };

export function parsePersonDraft(fields: PersonFields): PersonFields | null {
  const parsed = personFieldsSchema.safeParse({ ...fields, constraints: fields.constraints.filter((item) => item.trim().length > 0) });
  return parsed.success ? parsed.data : null;
}

export type PersonEditorProps = {
  fields: PersonFields;
  onChange: (fields: PersonFields) => void;
  isNew: boolean;
  savedName?: string;
  version?: number;
  updatedAt?: string;
  dirty: boolean;
  busy?: boolean;
  saving?: boolean;
  onSave: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  conflict?: boolean;
  onReload?: () => void;
  statusMessage?: string;
  errorMessage?: string;
  practiceHref?: string;
};

export function PersonEditor({ fields, onChange, isNew, savedName, version, updatedAt, dirty, busy = false, saving = false, onSave, onDelete, deleting = false, conflict = false, onReload, statusMessage, errorMessage, practiceHref }: PersonEditorProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const valid = parsePersonDraft(fields) !== null;
  const missing = requiredFields.filter(({ key }) => fields[key].trim().length === 0).map(({ label }) => label);
  const disabled = busy || saving || deleting;
  const set = <K extends keyof PersonFields>(key: K, value: PersonFields[K]) => onChange({ ...fields, [key]: value });
  const setTrait = (key: TraitKey, value: string) => {
    const traits: TraitChips = { ...fields.traits };
    if (traits[key] === value) delete traits[key]; else (traits as Record<string, string>)[key] = value;
    set("traits", traits);
  };
  const setConstraint = (index: number, value: string) => set("constraints", fields.constraints.map((item, i) => (i === index ? value : item)));
  const displayName = savedName || "New person";

  function textField(key: "name" | "relationship", label: string) {
    return <div className={setup.field}>
      <div className={setup.labelRow}><label htmlFor={`${id}-${key}`}>{label}</label><span id={`${id}-${key}-count`} className={setup.count}>{fields[key].length} / {limits[key]}</span></div>
      <input id={`${id}-${key}`} type="text" required maxLength={limits[key]} value={fields[key]} disabled={disabled} aria-describedby={`${id}-${key}-count`} onChange={(event) => set(key, event.target.value)} />
    </div>;
  }
  function areaField(key: "style" | "publicContext" | "opening", label: string, rows: number, hint?: string) {
    return <div className={setup.field}>
      <div className={setup.labelRow}><label htmlFor={`${id}-${key}`}>{label}</label><span id={`${id}-${key}-count`} className={setup.count}>{fields[key].length} / {limits[key]}</span></div>
      {hint && <p id={`${id}-${key}-hint`} className={setup.hint}>{hint}</p>}
      <textarea id={`${id}-${key}`} rows={rows} required maxLength={limits[key]} value={fields[key]} disabled={disabled} aria-describedby={`${hint ? `${id}-${key}-hint ` : ""}${id}-${key}-count`} onChange={(event) => set(key, event.target.value)} />
    </div>;
  }

  return <>
    <div className={styles.heading}>
      <Link className={styles.backLink} href="/practice">Back to practice</Link>
      <h1 ref={headingRef} tabIndex={-1}>{isNew ? <>Add a <span>person.</span></> : <>{displayName}</>}</h1>
      {!isNew && version !== undefined && updatedAt && <p className={styles.meta}>Version {version} · Last updated {formatUpdated(updatedAt)}</p>}
      <p className={styles.lede}>A fictional counterpart shaped by your choices. It never claims to be, or predict, the real person.</p>
    </div>

    <form className={setup.card} aria-label={isNew ? "New person" : `${displayName} details`} onSubmit={(event) => { event.preventDefault(); if (valid && !disabled) onSave(); }} noValidate>
      <div className={setup.cardTop}><p className={setup.eyebrow}>The character</p><span className={setup.fictionalTag}>Fictional AI counterpart</span></div>
      <div className={setup.pair}>{textField("name", "Name")}{textField("relationship", "Relationship")}</div>

      <div className={setup.fieldset}>
        <p className={styles.traitLabel}>How they come across <span className={setup.optional}>Choose one per row, or none</span></p>
        {(Object.keys(traitOptions) as TraitKey[]).map((key) => <div key={key} className={styles.traitRow}>
          <span id={`${id}-trait-${key}`} className={styles.traitLabel}>{traitLabels[key]}</span>
          <div className={styles.chipGroup} role="group" aria-labelledby={`${id}-trait-${key}`}>
            {traitOptions[key].map((option) => <button key={option} type="button" className={styles.chip} aria-pressed={fields.traits[key] === option} disabled={disabled} onClick={() => setTrait(key, option)}>{capitalize(option)}</button>)}
          </div>
        </div>)}
      </div>

      <div className={setup.pair}>
        <fieldset className={setup.fieldset} disabled={disabled}>
          <legend>Challenge</legend>
          <div className={setup.choices}>{challengeOptions.map((option) => <label key={option.value} className={setup.choice}><input type="radio" name={`${id}-challenge`} value={option.value} checked={fields.challenge === option.value} onChange={() => set("challenge", option.value)} />{option.label}</label>)}</div>
        </fieldset>
        <fieldset className={setup.fieldset} disabled={disabled}>
          <legend>Pace</legend>
          <div className={setup.choices}>{paceOptions.map((option) => <label key={option.value} className={setup.choice}><input type="radio" name={`${id}-pace`} value={option.value} checked={fields.pace === option.value} onChange={() => set("pace", option.value)} />{option.label}</label>)}</div>
        </fieldset>
      </div>

      {areaField("style", "How they talk", 3)}
      {areaField("publicContext", "What they know about the situation", 4, "Shared with the character.")}
      {areaField("opening", "Opening line", 2, "The first thing they say.")}

      <fieldset className={setup.fieldset} disabled={disabled}>
        <legend>Things to keep in mind <span className={setup.optional}>Up to {MAX_CONSTRAINTS}</span></legend>
        {fields.constraints.map((item, index) => <div key={index} className={setup.constraintRow}>
          <label className="sr-only" htmlFor={`${id}-constraint-${index}`}>Constraint {index + 1}</label>
          <input id={`${id}-constraint-${index}`} type="text" maxLength={limits.constraint} value={item} onChange={(event) => setConstraint(index, event.target.value)} />
          <button type="button" className={setup.removeButton} aria-label={`Remove constraint ${index + 1}`} onClick={() => set("constraints", fields.constraints.filter((_, i) => i !== index))}>Remove</button>
        </div>)}
        {fields.constraints.length < MAX_CONSTRAINTS && <button type="button" className={setup.linkButton} onClick={() => set("constraints", [...fields.constraints, ""])}>Add constraint</button>}
      </fieldset>

      <div className={setup.startArea}>
        {!valid && <p id={`${id}-missing`} className={setup.hint}>{missing.length > 0 ? `Still needed: ${missing.join(", ")}.` : "Check that every field is within its limit."}</p>}
        {statusMessage && <p className={setup.status} role="status">{statusMessage}</p>}
        {errorMessage && <div className={setup.error} role="alert"><p>{errorMessage}</p>{conflict && onReload && <button type="button" className={setup.secondaryButton} onClick={onReload}>Load latest version</button>}</div>}
        <button type="submit" className={setup.primaryButton} disabled={!valid || disabled || (!dirty && !isNew)} aria-busy={saving} aria-describedby={!valid ? `${id}-missing` : undefined}>{saving ? "Saving…" : isNew ? "Save person" : "Save"}</button>
        {practiceHref && <>
          <Link className={setup.secondaryButton} href={practiceHref}>Practice with {displayName}</Link>
          {dirty && <p className={setup.hint}>Practice uses the last saved version. Save your edits first to use them.</p>}
        </>}
        {onDelete && <div className={styles.dangerZone}>
          {!confirmDelete
            ? <button type="button" ref={deleteRef} className={styles.dangerButton} disabled={disabled} onClick={() => setConfirmDelete(true)}>Delete {displayName}</button>
            : <>
              <p id={`${id}-confirm`} className={setup.hint}>Delete {displayName} permanently? What they know about you is removed too. Your About-me facts stay.</p>
              <div className="actions">
                <button type="button" className={styles.dangerButton} disabled={disabled} aria-describedby={`${id}-confirm`} onClick={onDelete}>{deleting ? "Deleting…" : "Yes, delete"}</button>
                <button type="button" className={setup.secondaryButton} disabled={deleting} autoFocus aria-describedby={`${id}-confirm`} onClick={() => { flushSync(() => setConfirmDelete(false)); deleteRef.current?.focus(); }}>Cancel</button>
              </div>
            </>}
        </div>}
      </div>
    </form>
  </>;
}
