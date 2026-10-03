"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import styles from "./people.module.css";
import setup from "./setup.module.css";

export type SaveAfterEndProps = {
  name: string;
  // "new": generated/manual role; "update": a saved person has the same name; "saved": the call used a saved person.
  mode: "new" | "update" | "saved";
  personId?: string;
  onSave: () => void;
  onDismiss: () => void;
  saving?: boolean;
  // False while the saved-people list is loading, so "Save" cannot duplicate a same-named person.
  ready?: boolean;
  saved?: { id: string; name: string; updated: boolean } | null;
  errorMessage?: string;
};

export function SaveAfterEnd({ name, mode, personId, onSave, onDismiss, saving = false, ready = true, saved, errorMessage }: SaveAfterEndProps) {
  const id = useId();
  const dismissRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { dismissRef.current?.focus(); }, []);
  const title = mode === "saved" ? `Change how ${name} talks next time?` : "Keep this person for next time?";

  return (
    <section className={styles.savePanel} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {mode === "new" && <p>Save {name} with the setup you used in this call. Nothing is saved unless you choose to.</p>}
      {mode === "update" && <p>You already saved someone named {name}. Updating keeps their trait chips and what they know about you, and replaces the rest with this call’s setup.</p>}
      {mode === "saved" && <p>Edits apply to future practices. This call is not saved.</p>}
      {saving && <p role="status">Saving…</p>}
      {saved && <p role="status">{saved.updated ? `Updated ${saved.name}.` : `Saved ${saved.name}.`} <Link className={styles.textLink} href={`/practice/people/${saved.id}`}>Open {saved.name}</Link></p>}
      {errorMessage && <p className={setup.error} role="alert">{errorMessage}</p>}
      <div className="actions">
        <button ref={dismissRef} type="button" className={setup.secondaryButton} onClick={onDismiss}>Dismiss</button>
        {mode === "saved" && personId && <Link className={styles.smallButton} href={`/practice/people/${personId}`}>Edit {name}</Link>}
        {mode !== "saved" && !saved && <button type="button" className={styles.smallButton} disabled={saving || !ready} onClick={onSave}>{mode === "update" ? `Update ${name}` : "Save this person"}</button>}
      </div>
    </section>
  );
}
