"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import type { AboutMeFact } from "@/lib/schemas/people";
import styles from "./people.module.css";
import setup from "./setup.module.css";

// A custom type only: text fields (including the private notes) never accept a dragged fact as text.
const DRAG_TYPE = "application/x-about-me-fact";
const NOTES_MAX = 1000;

export type KnowsAboutYouProps = {
  personName: string;
  facts: AboutMeFact[];
  sharedIds: string[];
  onToggle: (factId: string, share: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
  announcement: string;
};

export function KnowsAboutYou({ personName, facts, sharedIds, onToggle, disabled = false, disabledReason, announcement }: KnowsAboutYouProps) {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const focusAfterMove = useRef<string | null>(null);
  const [over, setOver] = useState<"about" | "knows" | null>(null);
  const shared = new Set(sharedIds);
  const sharedKey = sharedIds.join(",");

  // A toggled chip remounts in the other column; keep keyboard focus on it.
  useEffect(() => {
    const factId = focusAfterMove.current;
    if (!factId) return;
    focusAfterMove.current = null;
    listRef.current?.querySelector<HTMLButtonElement>(`[data-fact-id="${factId}"]`)?.focus();
  }, [sharedKey]);

  function toggle(factId: string, share: boolean) {
    if (disabled) return;
    focusAfterMove.current = factId;
    onToggle(factId, share);
  }
  function dragOver(event: DragEvent, target: "about" | "knows") {
    if (disabled || !event.dataTransfer.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOver(target);
  }
  function drop(event: DragEvent, target: "about" | "knows") {
    setOver(null);
    const factId = event.dataTransfer.getData(DRAG_TYPE);
    if (disabled || !factId || !facts.some((fact) => fact.id === factId)) return;
    event.preventDefault();
    if (target === "knows" && !shared.has(factId)) toggle(factId, true);
    if (target === "about" && shared.has(factId)) toggle(factId, false);
  }

  function zone(target: "about" | "knows", title: string, items: AboutMeFact[], empty: string) {
    const isShared = target === "knows";
    return <section className={styles.zone} data-target={target} data-over={over === target} aria-labelledby={`${id}-${target}`}
      onDragOver={(event) => dragOver(event, target)} onDragLeave={() => setOver(null)} onDrop={(event) => drop(event, target)}>
      <h3 id={`${id}-${target}`}>{title}</h3>
      {items.length === 0 ? <p className={setup.hint}>{empty}</p> : <ul className={styles.zoneList}>
        {items.map((fact) => <li key={fact.id}>
          <button type="button" className={styles.factChip} data-fact-id={fact.id} draggable={!disabled} disabled={disabled}
            aria-label={`${isShared ? "Stop sharing with" : "Share with"} ${personName}: ${fact.text}`} aria-describedby={disabledReason ? `${id}-hint ${id}-reason` : `${id}-hint`}
            onClick={() => toggle(fact.id, !isShared)}
            onDragStart={(event) => { event.dataTransfer.setData(DRAG_TYPE, fact.id); event.dataTransfer.effectAllowed = "move"; }}
            onDragEnd={() => setOver(null)}>
            {fact.text}<span aria-hidden="true">{isShared ? "←" : "→"}</span>
          </button>
        </li>)}
      </ul>}
    </section>;
  }

  return (
    <section className={setup.card} aria-labelledby={`${id}-title`}>
      <div className={setup.cardTop}><h2 id={`${id}-title`} className={styles.sectionTitle}>What {personName} knows about you</h2><Link className={styles.textLink} href="/practice/about-me">Edit About me</Link></div>
      <p id={`${id}-hint`} className={setup.hint}>Nothing is shared by default. Click a fact to move it to the other column, or drag it there. Shared facts are sent to the video call provider as part of this character’s setup when you practice.</p>
      {disabledReason && <p id={`${id}-reason`} className={setup.status}>{disabledReason}</p>}
      <div ref={listRef} className={styles.shareGrid}>
        {zone("about", "About me", facts.filter((fact) => !shared.has(fact.id)), facts.length === 0 ? "You haven’t added any facts yet." : "Everything is shared.")}
        {zone("knows", `Knows about ${personName}`, facts.filter((fact) => shared.has(fact.id)), "Nothing shared yet.")}
      </div>
      <p className={styles.announce} role="status" aria-live="polite">{announcement}</p>
    </section>
  );
}

export type NeverSharedProps = {
  notes: string;
  onChange: (notes: string) => void;
  onSave: () => void;
  saving?: boolean;
  dirty: boolean;
  statusMessage?: string;
  errorMessage?: string;
};

export function NeverShared({ notes, onChange, onSave, saving = false, dirty, statusMessage, errorMessage }: NeverSharedProps) {
  const id = useId();
  return (
    <section className={styles.neverShared} aria-labelledby={`${id}-title`}>
      <p className={styles.neverTag} aria-hidden="true">Private</p>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>Never shared</h2>
      <p id={`${id}-hint`} className={setup.hint}>For your own reference. These notes are never given to any person, cannot be moved into what someone knows, and are never sent to a practice.</p>
      <div className={setup.field}>
        <div className={setup.labelRow}><label htmlFor={`${id}-notes`}>Private preparation notes</label><span id={`${id}-count`} className={setup.count}>{notes.length} / {NOTES_MAX}</span></div>
        <textarea id={`${id}-notes`} rows={4} autoComplete="off" spellCheck={false} maxLength={NOTES_MAX} value={notes} disabled={saving} aria-describedby={`${id}-hint ${id}-count`} onChange={(event) => onChange(event.target.value)} />
      </div>
      {statusMessage && <p className={setup.status} role="status">{statusMessage}</p>}
      {errorMessage && <p className={setup.error} role="alert">{errorMessage}</p>}
      <button type="button" className={setup.secondaryButton} disabled={saving || !dirty} onClick={onSave}>{saving ? "Saving…" : "Save private notes"}</button>
    </section>
  );
}
