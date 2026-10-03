"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MAX_ABOUT_ME_FACTS, type AboutMeFact } from "@/lib/schemas/people";
import styles from "./people.module.css";
import setup from "./setup.module.css";

const FACT_MAX = 120;

export type AboutMeEditorProps = {
  facts: AboutMeFact[];
  loading?: boolean;
  busy?: boolean;
  onAdd: (text: string) => Promise<boolean>;
  onEdit: (factId: string, text: string) => Promise<boolean>;
  onDelete: (factId: string) => void;
  statusMessage?: string;
  errorMessage?: string;
};

export function AboutMeEditor({ facts, loading = false, busy = false, onAdd, onEdit, onDelete, statusMessage, errorMessage }: AboutMeEditorProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const full = facts.length >= MAX_ABOUT_ME_FACTS;
  const canAdd = text.trim().length > 0 && !full && !busy && !loading;

  return <>
    <div className={styles.heading}>
      <Link className={styles.backLink} href="/practice">Back to practice</Link>
      <h1 ref={headingRef} tabIndex={-1}>About <span>me.</span></h1>
      <p className={styles.lede}>Short facts about you that you can reuse. A fact is shared only with the people you choose, on each person’s page. Keep private worries in Never shared instead.</p>
    </div>

    <section className={setup.card} aria-labelledby={`${id}-title`} aria-busy={loading || busy}>
      <div className={setup.cardTop}><h2 id={`${id}-title`} className={styles.sectionTitle}>Your facts</h2><span className={setup.count}>{facts.length} of {MAX_ABOUT_ME_FACTS}</span></div>
      <form className={styles.addRow} onSubmit={async (event) => { event.preventDefault(); if (canAdd && await onAdd(text.trim())) setText(""); }} noValidate>
        <div className={setup.field}>
          <div className={setup.labelRow}><label htmlFor={`${id}-new`}>New fact about you</label><span id={`${id}-count`} className={setup.count}>{text.length} / {FACT_MAX}</span></div>
          <input id={`${id}-new`} type="text" maxLength={FACT_MAX} value={text} disabled={busy || full} aria-describedby={`${id}-hint ${id}-count`} onChange={(event) => setText(event.target.value)} />
          <p id={`${id}-hint`} className={setup.hint}>{full ? `You’ve reached ${MAX_ABOUT_ME_FACTS} facts. Delete one to add another.` : "For example, “I joined the team in June.”"}</p>
        </div>
        <button type="submit" className={styles.smallButton} disabled={!canAdd}>Add fact</button>
      </form>
      {statusMessage && <p className={setup.status} role="status">{statusMessage}</p>}
      {errorMessage && <p className={setup.error} role="alert">{errorMessage}</p>}
      {loading ? <p className={setup.hint} role="status">Loading your facts…</p> : facts.length === 0 ? <p className={setup.hint}>No facts yet.</p> : <ul className={styles.factList}>
        {facts.map((fact) => <li key={fact.id} className={styles.factRow}>
          {editing?.id === fact.id ? <form className={`${styles.addRow} ${styles.editForm}`} onSubmit={async (event) => { event.preventDefault(); if (editing.text.trim() && await onEdit(fact.id, editing.text.trim())) setEditing(null); }} noValidate>
            <label className="sr-only" htmlFor={`${id}-edit-${fact.id}`}>Edit fact</label>
            <input id={`${id}-edit-${fact.id}`} type="text" maxLength={FACT_MAX} value={editing.text} disabled={busy} autoFocus onChange={(event) => setEditing({ id: fact.id, text: event.target.value })} />
            <button type="submit" className={styles.smallButton} disabled={busy || !editing.text.trim()}>Save fact</button>
            <button type="button" className={setup.secondaryButton} onClick={() => setEditing(null)}>Cancel</button>
          </form> : <>
            <p>{fact.text}</p>
            {confirming === fact.id ? <>
              <span className={setup.hint}>Delete? People who know it will forget it.</span>
              <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => { setConfirming(null); onDelete(fact.id); }} aria-label={`Confirm delete: ${fact.text}`}>Delete</button>
              <button type="button" className={setup.secondaryButton} onClick={() => setConfirming(null)}>Cancel</button>
            </> : <>
              <button type="button" className={setup.secondaryButton} disabled={busy} onClick={() => { setConfirming(null); setEditing({ id: fact.id, text: fact.text }); }} aria-label={`Edit: ${fact.text}`}>Edit</button>
              <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => setConfirming(fact.id)} aria-label={`Delete: ${fact.text}`}>Delete</button>
            </>}
          </>}
        </li>)}
      </ul>}
    </section>
  </>;
}
