"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { RotateCcw } from "lucide-react";
import { PersonCard, PersonCardSkeleton, type PersonCardAction } from "@/components/ui/person-card";
import { examples } from "@/fixtures/examples";
import type { Person } from "@/lib/schemas/people";
import type { SessionPreset } from "@/lib/schemas/situation";
import styles from "./lobby.module.css";

// P1 lobby (docs/32, docs/33 §4.2). Jordan, the manager, leads the starters (W2).
export const starterOrder: readonly SessionPreset[] = ["manager", "roommate", "professor", "decline"];
export const starterRelationship: Record<SessionPreset, string> = {
  manager: "Manager",
  roommate: "Roommate",
  professor: "Professor",
  decline: "Classmate asking a favor",
};

export function starterPortraitPath(preset: SessionPreset): string {
  return `/api/portraits/${preset}`;
}

// "Coming up" (B1) is not built, so practiced people lead, then the rest in the server's order
// (most recently updated first). Stable, so equal people keep that order.
export function orderPeople(people: readonly Person[]): Person[] {
  return [...people.filter((person) => person.hasPracticed), ...people.filter((person) => !person.hasPracticed)];
}

export function personTraits(person: Person): string[] {
  const { tone, formality, talkativeness, familiarity } = person.traits;
  return [tone, formality, talkativeness, familiarity].filter((value): value is NonNullable<typeof value> => Boolean(value)).slice(0, 3);
}

export function knowsLine(count: number): string | undefined {
  if (count <= 0) return undefined;
  return `Knows ${count} ${count === 1 ? "thing" : "things"} about you`;
}

// First run: no saved people and Jordan not practiced yet.
export function highlightJordan(people: readonly Person[], status: LobbyStatus, practicedPresets: readonly SessionPreset[]): boolean {
  return status === "ready" && people.length === 0 && !practicedPresets.includes("manager");
}

type Rect = { left: number; top: number; width: number; height: number };
export type GridKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End";
const gridKeys: readonly string[] = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

// Where focus goes from card `index`. Up and down pick the nearest card in the next row by
// position, so it works for any column count and across the two grids.
export function gridMove(rects: readonly Rect[], index: number, key: GridKey): number {
  const last = rects.length - 1;
  if (last < 0) return -1;
  switch (key) {
    case "Home": return 0;
    case "End": return last;
    case "ArrowLeft": return Math.max(0, index - 1);
    case "ArrowRight": return Math.min(last, index + 1);
  }
  const current = rects[index];
  const centre = current.left + current.width / 2;
  const below = key === "ArrowDown";
  const candidates = rects.map((rect, i) => ({ rect, i })).filter(({ rect }) => below ? rect.top > current.top + current.height / 2 : rect.top + rect.height / 2 < current.top);
  if (candidates.length === 0) return index;
  const rowTop = below ? Math.min(...candidates.map(({ rect }) => rect.top)) : Math.max(...candidates.map(({ rect }) => rect.top));
  const row = candidates.filter(({ rect }) => Math.abs(rect.top - rowTop) < 1);
  row.sort((a, b) => Math.abs(a.rect.left + a.rect.width / 2 - centre) - Math.abs(b.rect.left + b.rect.width / 2 - centre));
  return row[0].i;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export type LobbyStatus = "loading" | "ready" | "error";

export type LobbyProps = {
  /** Already owner-scoped by GET /api/people; the lobby never lists anything else. */
  people: readonly Person[];
  status: LobbyStatus;
  /** W10 practice history; empty until GET /api/practice-history answers. */
  practicedPresets?: readonly SessionPreset[];
  onRetry: () => void;
  onPickPerson: (person: Person) => void;
  onPickStarter: (preset: SessionPreset) => void;
  onSomeoneNew: () => void;
  /** Copies a starter into the user's people. Resolves when saved. */
  onAddStarter?: (preset: SessionPreset) => Promise<void>;
  onEditPerson?: (person: Person) => void;
  /** Hard delete after an inline confirm. Resolves when deleted. */
  onDeletePerson?: (person: Person) => Promise<void>;
  /** Null shows the monogram (design preview, or before portraits exist). */
  starterPortraitSrc?: (preset: SessionPreset) => string | null;
  disabled?: boolean;
  disabledReason?: string;
  focusHeading?: boolean;
  notice?: string;
  /** The page-level N shortcut. Off where several lobbies render at once (design preview). */
  shortcuts?: boolean;
};

export function Lobby({
  people, status, practicedPresets = [], onRetry, onPickPerson, onPickStarter, onSomeoneNew, onAddStarter, onEditPerson, onDeletePerson,
  starterPortraitSrc = starterPortraitPath, disabled = false, disabledReason = "Please wait a moment.", focusHeading = false, notice, shortcuts = true,
}: LobbyProps) {
  const id = useId();
  const rootRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [confirming, setConfirming] = useState<Person | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { if (focusHeading) headingRef.current?.focus(); }, [focusHeading]);

  // Skeletons only after 200 ms, so a fast list never flashes.
  useEffect(() => {
    if (status !== "loading") { setShowSkeleton(false); return; }
    const timer = window.setTimeout(() => setShowSkeleton(true), 200);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => { if (confirming) keepRef.current?.focus(); }, [confirming]);

  // U4: N opens Someone new, never while typing in a field.
  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() !== "n" || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (disabled || confirming) return;
      event.preventDefault();
      onSomeoneNew();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcuts, disabled, confirming, onSomeoneNew]);

  function onCardKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!gridKeys.includes(event.key)) return;
    const cards = [...(rootRef.current?.querySelectorAll<HTMLButtonElement>("[data-lobby-card]") ?? [])];
    const index = cards.indexOf(event.currentTarget);
    if (index < 0) return;
    event.preventDefault();
    const next = gridMove(cards.map((card) => card.getBoundingClientRect()), index, event.key as GridKey);
    cards[next]?.focus();
  }

  async function addStarter(preset: SessionPreset) {
    if (!onAddStarter || busy) return;
    const name = examples[preset].role.name;
    setBusy(true); setMessage("");
    try {
      await onAddStarter(preset);
      setMessage(`${name} was added to your people.`);
    } catch {
      setMessage(`We couldn’t add ${name}. Please try again.`);
    } finally { setBusy(false); }
  }

  async function confirmDelete() {
    const person = confirming;
    if (!person || !onDeletePerson || busy) return;
    setBusy(true); setMessage("");
    try {
      await onDeletePerson(person);
      setConfirming(null);
      setMessage(`${person.name} was deleted.`);
      headingRef.current?.focus();
    } catch {
      setMessage(`We couldn’t delete ${person.name}. Please try again.`);
    } finally { setBusy(false); }
  }

  const ordered = orderPeople(people);
  const hasPeople = status === "ready" && ordered.length > 0;
  const highlight = highlightJordan(people, status, practicedPresets);
  const common = { disabled, disabledReason, onCardKeyDown };

  const someoneNew = (
    <li key="someone-new">
      <PersonCard variant="new" name="Someone new" meta="Name them, or we’ll pick a name." onOpen={onSomeoneNew} {...common} />
    </li>
  );

  return (
    <section ref={rootRef} className={styles.lobby} aria-labelledby={`${id}-title`} data-status={status}>
      <header className={styles.header}>
        <h1 id={`${id}-title`} ref={headingRef} tabIndex={-1} className={styles.title}>Who do you want to practice with?</h1>
        <p className={styles.lede}>
          Pick someone, then tell us what’s going on.
          {shortcuts ? <>{" "}<span className={styles.keys}>Arrow keys move between cards; N starts someone new.</span></> : null}
        </p>
      </header>

      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <p className={styles.srStatus} role="status">{message}</p>

      {confirming ? (
        <div className={styles.confirm} role="group" aria-labelledby={`${id}-confirm`}>
          <p id={`${id}-confirm`}>Delete <span className={styles.serifName}>{confirming.name}</span>? This removes them and what they know about you. It can’t be undone.</p>
          <div className={styles.confirmActions}>
            <button ref={keepRef} type="button" className={styles.secondary} onClick={() => setConfirming(null)} disabled={busy}>Keep {confirming.name}</button>
            <button type="button" className={styles.danger} onClick={() => void confirmDelete()} aria-busy={busy || undefined} disabled={busy}>{busy ? "Deleting…" : `Delete ${confirming.name}`}</button>
          </div>
        </div>
      ) : null}

      <section className={styles.group} aria-labelledby={`${id}-people`}>
        <h2 id={`${id}-people`} className={styles.groupTitle}>Your people</h2>
          {status === "error" ? (<>
            <div className={styles.error} role="alert">
              <p>We couldn’t load your people. The starters below still work.</p>
              <button type="button" className={styles.secondary} onClick={onRetry}><RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />Try again</button>
            </div>
            <ul className={styles.grid} data-lobby-grid="people">{someoneNew}</ul>
          </>) : status === "loading" ? (
            <ul className={styles.grid} aria-busy="true" aria-label="Loading your people">
              {showSkeleton ? [0, 1, 2].map((n) => <li key={n}><PersonCardSkeleton /></li>) : null}
              {someoneNew}
            </ul>
          ) : !hasPeople ? (
            <>
              <p className={styles.groupNote}>Add the people you want to practice talking to.</p>
              <ul className={styles.grid} data-lobby-grid="people">{someoneNew}</ul>
            </>
          ) : (
            <ul className={styles.grid} data-lobby-grid="people">
              {ordered.map((person) => {
                const actions: PersonCardAction[] = [];
                if (onEditPerson) actions.push({ label: "Edit details", onSelect: () => onEditPerson(person) });
                if (onDeletePerson) actions.push({ label: "Delete", tone: "danger", onSelect: () => { setMessage(""); setConfirming(person); } });
                return (
                  <li key={person.id}>
                    <PersonCard variant="saved" name={person.name} relationship={person.relationship} traits={personTraits(person)} meta={knowsLine(person.sharedFactIds.length)}
                      onOpen={() => onPickPerson(person)} actions={actions} {...common} />
                  </li>
                );
              })}
              {someoneNew}
            </ul>
          )}
        </section>

      <section className={styles.group} aria-labelledby={`${id}-starters`}>
        <h2 id={`${id}-starters`} className={styles.groupTitle}>Starter characters</h2>
        <p className={styles.groupNote}>Fictional characters with a ready situation you can change before you start.</p>
        <ul className={styles.grid} data-lobby-grid="starters">
          {starterOrder.map((preset) => {
            const { role, label } = examples[preset];
            const actions: PersonCardAction[] = onAddStarter ? [{ label: "Add to my people", onSelect: () => void addStarter(preset) }] : [];
            return (
              <li key={preset} data-preset={preset}>
                <PersonCard variant="starter" name={role.name} relationship={starterRelationship[preset]} meta={label} portraitSrc={starterPortraitSrc(preset)}
                  highlight={preset === "manager" && highlight} onOpen={() => onPickStarter(preset)} actions={actions} {...common} />
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}
