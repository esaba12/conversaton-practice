"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import type { Person } from "@/lib/schemas/people";
import { traitPhrases } from "@/lib/schemas/role-context";
import { formatUpdated } from "./people-list";
import setup from "./setup.module.css";

export type SavedPersonStartProps = {
  person: Person;
  onStart: () => void;
  onBack: () => void;
  disabled?: boolean;
  startDisabled?: boolean;
  statusMessage?: string;
  actions?: ReactNode;
  focusHeading?: boolean;
};

export function SavedPersonStart({ person, onStart, onBack, disabled = false, startDisabled = false, statusMessage, actions, focusHeading = false }: SavedPersonStartProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focusHeading) headingRef.current?.focus(); }, [focusHeading]);
  const phrases = traitPhrases(person.traits);
  const known = person.sharedFactIds.length;

  return (
    <section className={setup.setup} aria-labelledby={`${id}-title`}>
      <div className={setup.intro}>
        <p className={setup.eyebrow}>Practice with someone you saved</p>
        <h1 id={`${id}-title`} ref={headingRef} tabIndex={-1} className={setup.title}>Talk with<br /><span>{person.name}.</span></h1>
        <p className={setup.lede}>Each practice starts fresh. {person.name} uses the saved description and only what you chose to share.</p>
        <p className={setup.fine}>Practice with a fictional character. Real conversations may unfold differently.</p>
      </div>
      <div className={setup.card}>
        <div className={setup.cardTop}><p className={setup.eyebrow}>{person.relationship}</p><span className={setup.fictionalTag}>Fictional AI counterpart</span></div>
        <p className={setup.hint}>Version {person.version} · Last updated {formatUpdated(person.updatedAt)}</p>
        {phrases.length > 0 && <p className={setup.hint}>Speaks: {phrases.join(", ")}.</p>}
        <p className={setup.hint}>{known === 0 ? "Knows nothing about you yet." : `Knows ${known} ${known === 1 ? "thing" : "things"} you shared.`}</p>
        <div className={setup.startArea}>
          {actions}
          {statusMessage && <p className={setup.status} role="status">{statusMessage}</p>}
          <p className={setup.mediaNote}>Microphone needed. Camera is optional and only visible to you.</p>
          <p className={setup.mediaNote}>{person.name} can hear your tone of voice (for example, if you sound unsure) and may react to it. Nothing about your tone is saved.</p>
          <button type="button" className={setup.primaryButton} disabled={disabled || startDisabled} onClick={onStart}>Start practice</button>
          <div className={setup.linkRow}>
            <button type="button" className={setup.linkButton} onClick={onBack} disabled={disabled}>Back</button>
            <Link className={setup.linkButton} href={`/practice/people/${person.id}`} aria-label={`Edit ${person.name}`}>Edit</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
