"use client";

import Link from "next/link";
import { useId } from "react";
import type { Person } from "@/lib/schemas/people";
import styles from "./people.module.css";

export function formatUpdated(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function PeopleHeader() {
  return <header className="site-header"><Link className="wordmark" href="/">Conversation practice<span className="mark" aria-hidden="true">↗</span></Link><Link className="button secondary" href="/practice">Practice</Link></header>;
}

export type MyPeopleProps = {
  people: Person[];
  status: "loading" | "ready" | "error";
  onPractice: (person: Person) => void;
  onRetry: () => void;
  disabled?: boolean;
};

export function MyPeople({ people, status, onPractice, onRetry, disabled = false }: MyPeopleProps) {
  const id = useId();
  return (
    <section className={styles.home} aria-labelledby={`${id}-title`} aria-busy={status === "loading"}>
      <div className={styles.homeHead}>
        <h2 id={`${id}-title`} className={styles.sectionTitle}>My people</h2>
        <div className={styles.homeLinks}>
          <Link className={styles.textLink} href="/practice/about-me">About me</Link>
          <Link className={styles.textLink} href="/practice/people/new">Add a person</Link>
        </div>
      </div>
      {status === "loading" && people.length === 0 && <p className={styles.empty} role="status">Loading your people…</p>}
      {status === "error" && <p className={styles.empty} role="alert">We couldn’t load your people. <button type="button" className={styles.textLink} onClick={onRetry}>Try again</button></p>}
      {status === "ready" && people.length === 0 && <p className={styles.empty}>No saved people yet. Practice a new conversation below and save the person when it ends, or add one yourself.</p>}
      {people.length > 0 && <ul className={styles.peopleGrid}>
        {people.map((person) => <li key={person.id} className={styles.personCard}>
          <h3>{person.name}</h3>
          <p>{person.relationship}</p>
          <p>Updated {formatUpdated(person.updatedAt)}</p>
          <div className={styles.cardActions}>
            <button type="button" className={styles.smallButton} disabled={disabled} onClick={() => onPractice(person)}>Practice with {person.name}</button>
            <Link className={styles.textLink} href={`/practice/people/${person.id}`} aria-label={`Edit ${person.name}`}>Edit</Link>
          </div>
        </li>)}
      </ul>}
    </section>
  );
}
