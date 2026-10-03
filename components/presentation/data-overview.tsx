"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { DeletePracticeDataResponse, SessionSummary } from "@/lib/schemas/practice-data";
import styles from "./people.module.css";
import data from "./data.module.css";
import setup from "./setup.module.css";

export const DELETE_PHRASE = "delete my practice data";
type Load = "loading" | "ready" | "error";
export type StoredPerson = { id: string; name: string; knows: number };
export type DataInventory = { status: Load; facts: number; people: StoredPerson[]; privatePrep: boolean };

const cleanupLabels: Record<SessionSummary["cleanup"], string> = {
  confirmed: "Deleted at provider",
  pending: "Provider cleanup pending",
  unresolved: "Provider cleanup not confirmed",
  not_started: "No provider call",
};
const statusLabels: Record<SessionSummary["status"], string> = {
  connecting: "In progress", active: "In progress", ending: "In progress", ended: "Ended", interrupted: "Interrupted", deleted: "Deleted",
};
const inProgress = (s: SessionSummary) => s.status === "connecting" || s.status === "active" || s.status === "ending";
export const canRetryCleanup = (s: SessionSummary) => !inProgress(s) && (s.cleanup === "pending" || s.cleanup === "unresolved");
const when = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export type DataOverviewProps = {
  inventory: DataInventory;
  sessions: { status: Load; list: SessionSummary[] };
  retrying: string | null;
  deleting: boolean;
  result: DeletePracticeDataResponse | null;
  onRetryCleanup: (id: string) => void;
  onDeleteAll: () => Promise<boolean>;
  onReload: () => void;
  statusMessage?: string;
  errorMessage?: string;
};

export function DataOverview({ inventory, sessions, retrying, deleting, result, onRetryCleanup, onDeleteAll, onReload, statusMessage, errorMessage }: DataOverviewProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const deleteHeadingRef = useRef<HTMLHeadingElement>(null);
  const sessionsHeadingRef = useRef<HTMLHeadingElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const lastRetry = useRef<string | null>(null);
  const refocusSubmit = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [phrase, setPhrase] = useState("");
  useEffect(() => { headingRef.current?.focus(); }, []);
  // A confirmed cleanup removes its Retry button; keep focus in the sessions area instead of losing it.
  useEffect(() => {
    if (retrying) { lastRetry.current = retrying; return; }
    const done = lastRetry.current;
    lastRetry.current = null;
    if (!done || (document.activeElement && document.activeElement !== document.body)) return;
    (document.querySelector<HTMLButtonElement>(`[data-retry="${done}"]`) ?? sessionsHeadingRef.current)?.focus();
  }, [retrying]);
  useEffect(() => { if (!deleting && refocusSubmit.current) { refocusSubmit.current = false; submitRef.current?.focus(); } }, [deleting]);
  const remaining = result && (result.remaining.aboutMeFacts > 0 || result.remaining.people > 0 || result.remaining.privatePrep);
  const ready = inventory.status === "ready";

  return <>
    <div className={styles.heading}>
      <Link className={styles.backLink} href="/practice">Back to practice</Link>
      <h1 ref={headingRef} tabIndex={-1}>Your <span>data.</span></h1>
      <p className={styles.lede}>What this app keeps for your account, where your practice calls are processed, and how to delete your practice data.</p>
    </div>

    <section className={setup.card} aria-labelledby={`${id}-stored`} aria-busy={inventory.status === "loading"}>
      <h2 id={`${id}-stored`} className={styles.sectionTitle}>What is stored</h2>
      {inventory.status === "loading" ? <p className={setup.hint} role="status">Loading what’s stored…</p>
        : inventory.status === "error" ? <div className={setup.error} role="alert"><p>We couldn’t load what’s stored.</p><button type="button" className={setup.secondaryButton} onClick={onReload}>Try again</button></div>
        : <ul className={data.storedList}>
          <li className={data.storedRow}><strong>About-me facts: {inventory.facts}</strong><Link className={styles.textLink} href="/practice/about-me">Manage About me</Link></li>
          <li className={data.storedRow}>
            <strong>Saved people: {inventory.people.length}</strong>
            {inventory.people.length > 0 && <ul className={data.knowsList}>
              {inventory.people.map((person) => <li key={person.id}><Link href={`/practice/people/${encodeURIComponent(person.id)}`}>{person.name}</Link> knows {plural(person.knows, "fact")} about you</li>)}
            </ul>}
          </li>
          <li className={data.storedRow}><strong>Private prep notes: {inventory.privatePrep ? "saved" : "none"}</strong><p>Never shared with anyone you practice with. Edit them on any saved person’s page.</p></li>
          <li className={data.storedRow}><strong>Session records</strong><p>Each practice keeps only its status, times and provider cleanup state. No audio, video, transcript or reflection is stored by this app.</p></li>
        </ul>}
    </section>

    <section className={setup.card} aria-labelledby={`${id}-providers`}>
      <h2 id={`${id}-providers`} className={styles.sectionTitle}>Where calls are processed</h2>
      <ul className={data.providers}>
        <li><strong>Tavus</strong> runs the video calls. When a session shows “Deleted at provider”, this app verified the Tavus conversation ended and requested its hard deletion.</li>
        <li><strong>ElevenLabs</strong> generates the counterpart’s voice through Tavus. This app does not track or delete ElevenLabs copies.</li>
        <li><strong>OpenAI</strong> receives setup and reflection text with storage disabled for the request (<code>store: false</code>). OpenAI’s own retention policies may still apply.</li>
      </ul>
    </section>

    <section className={setup.card} aria-labelledby={`${id}-sessions`} aria-busy={sessions.status === "loading"}>
      <h2 id={`${id}-sessions`} ref={sessionsHeadingRef} tabIndex={-1} className={styles.sectionTitle}>Past sessions</h2>
      {sessions.status === "loading" ? <p className={setup.hint} role="status">Loading sessions…</p>
        : sessions.status === "error" ? <div className={setup.error} role="alert"><p>We couldn’t load your sessions.</p><button type="button" className={setup.secondaryButton} onClick={onReload}>Try again</button></div>
        : sessions.list.length === 0 ? <p className={setup.hint}>No practice sessions yet.</p>
        : <table className={data.sessionTable}>
          <thead><tr><th scope="col">Started</th><th scope="col">Status</th><th scope="col">Provider cleanup</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{sessions.list.map((session) => <tr key={session.id}>
            <td>{when(session.createdAt)}</td>
            <td>{statusLabels[session.status]}</td>
            <td><span className={data.cleanup} data-cleanup={session.cleanup}>{inProgress(session) ? "In progress" : cleanupLabels[session.cleanup]}</span></td>
            <td>{canRetryCleanup(session) && <button type="button" className={setup.secondaryButton} data-retry={session.id} disabled={retrying !== null || deleting} aria-busy={retrying === session.id}
              onClick={() => onRetryCleanup(session.id)} aria-label={`Retry cleanup for the session started ${when(session.createdAt)}`}>{retrying === session.id ? "Retrying…" : "Retry cleanup"}</button>}</td>
          </tr>)}</tbody>
        </table>}
    </section>

    <section className={setup.card} aria-labelledby={`${id}-delete`}>
      <h2 id={`${id}-delete`} ref={deleteHeadingRef} tabIndex={-1} className={styles.sectionTitle}>Delete all practice data</h2>
      <p className={setup.hint}>Deletes your About-me facts, saved people (and what each knows) and private prep notes from this app. Session records are kept so provider cleanup can be tracked and retried; they hold no practice content. Your account itself is not deleted.</p>
      {!confirming ? <button type="button" className={styles.dangerButton} disabled={deleting || !ready} onClick={() => { setConfirming(true); setPhrase(""); }}>Delete all practice data…</button>
        : <form className={data.confirmForm} noValidate onSubmit={async (event) => { event.preventDefault(); if (phrase !== DELETE_PHRASE || deleting) return; if (await onDeleteAll()) { setConfirming(false); setPhrase(""); deleteHeadingRef.current?.focus(); } else refocusSubmit.current = true; }}>
          <div className={setup.field}>
            <label htmlFor={`${id}-phrase`}>Type <strong>{DELETE_PHRASE}</strong> to confirm</label>
            <input id={`${id}-phrase`} type="text" autoComplete="off" spellCheck={false} autoFocus value={phrase} disabled={deleting} aria-describedby={`${id}-warning`} onChange={(event) => setPhrase(event.target.value)} />
          </div>
          <p id={`${id}-warning`}>This can’t be undone. It doesn’t remove anything held by Tavus, ElevenLabs or OpenAI; provider cleanup is tracked per session above.</p>
          <div className={data.confirmActions}>
            <button type="submit" ref={submitRef} className={data.dangerSolid} disabled={phrase !== DELETE_PHRASE || deleting} aria-busy={deleting}>{deleting ? "Deleting…" : "Permanently delete my practice data"}</button>
            <button type="button" className={setup.secondaryButton} disabled={deleting} onClick={() => { setConfirming(false); setPhrase(""); }}>Cancel</button>
          </div>
        </form>}
      <div aria-live="polite">{result && <div className={remaining ? setup.error : setup.status}>
        <p>{remaining ? "Deletion was incomplete." : "Your practice data was deleted from this app."}</p>
        <ul className={data.result}>
          <li>Deleted {plural(result.deleted.aboutMeFacts, "About-me fact")}, {plural(result.deleted.people, "saved person", "saved people")}{result.deleted.privatePrep ? " and your private prep notes" : ""}.</li>
          {remaining && <li>Still stored: {plural(result.remaining.aboutMeFacts, "About-me fact")}, {plural(result.remaining.people, "saved person", "saved people")}{result.remaining.privatePrep ? " and your private prep notes" : ""}.</li>}
          <li>{plural(result.sessions.total, "session record")} kept: provider cleanup confirmed for {result.sessions.cleanupConfirmed}, outstanding for {result.sessions.cleanupOutstanding}.</li>
        </ul>
        {remaining && <button type="button" className={styles.dangerButton} disabled={deleting} onClick={() => void onDeleteAll().then(() => deleteHeadingRef.current?.focus())}>Retry deletion</button>}
      </div>}</div>
    </section>

    <div aria-live="polite">{statusMessage && <p className={setup.status}>{statusMessage}</p>}</div>
    <div role="alert">{errorMessage && <p className={setup.error}>{errorMessage}</p>}</div>
  </>;
}
