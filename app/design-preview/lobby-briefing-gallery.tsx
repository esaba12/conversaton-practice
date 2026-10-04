"use client";

import { useState, type ReactNode } from "react";
import { Briefing, useBriefingDrafts, type BriefingPlan, type BriefingSubject } from "@/components/practice/briefing";
import { Lobby } from "@/components/practice/lobby";
import type { Person, PersonSituation } from "@/lib/schemas/people";
import styles from "./gallery.module.css";

// Synthetic people only. Nothing here sends a request: portraits are off, and every action is local.
const at = "2026-10-03T21:20:00.000Z";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
const names = ["Maya", "Prof. Okafor", "Dad", "Priya", "Sam Rivera", "Lena", "Coach Diaz", "Theo", "Aunt Rosa", "Kenji", "Mira", "Jules"];
const relationships = ["Roommate", "Professor", "Parent", "Coworker", "Friend", "Sibling", "Manager", "Friend", "Parent", "Coworker", "Partner", "Friend"];
const tones = ["warm", "neutral", "blunt"] as const;

function person(n: number, extra: Partial<Person> = {}): Person {
  return {
    id: uuid(n + 1), version: 1, name: names[n], relationship: relationships[n],
    style: "Friendly and direct. Listens, then answers in a sentence or two.",
    background: "Someone you know well and talk with most weeks.",
    publicContext: n === 0 ? "Dishes keep piling up in the sink and I want us to agree on a schedule." : "We need to talk about something that has been bothering me.",
    opening: "Hey, what's up?", constraints: [], challenge: "neutral", pace: "conversational",
    traits: { tone: tones[n % 3], talkativeness: n % 2 ? "brief" : "chatty", familiarity: "close" },
    sharedFactIds: Array.from({ length: n % 4 }, (_, i) => uuid(100 + i)),
    hasPracticed: n % 5 === 2, createdAt: at, updatedAt: at, ...extra,
  };
}

const twelve = names.map((_, n) => person(n));
const maya = twelve[0];
const mayaSituations: PersonSituation[] = [{
  id: uuid(200), label: "Dishes", createdAt: at, updatedAt: at,
  situation: { publicContext: "Dishes keep piling up in the sink and I want us to agree on a schedule.", opening: "Hey, what's up?", constraints: [], challenge: "neutral", pace: "conversational" },
}, {
  id: uuid(201), label: "Guests on weeknights", createdAt: at, updatedAt: at,
  situation: { publicContext: "Maya keeps having friends over late on weeknights and I can't sleep before work.", opening: "Oh hey, you're up?", constraints: [], challenge: "mild_pushback", pace: "conversational" },
}];
const noPortrait = () => null;
const noop = () => undefined;
const later = () => new Promise<void>((resolve) => window.setTimeout(resolve, 400));

function Capture({ state, title, children }: { state: string; title: string; children: ReactNode }) {
  return (
    <div className={styles.stateRow}>
      <h3 className={styles.rowTitle}>{title}</h3>
      <div data-gallery-state={state} data-surface="room" className={styles.galleryCapture}>{children}</div>
    </div>
  );
}

function StaticBriefing({ subject, generating = false, error = null, situations }: { subject: BriefingSubject; generating?: boolean; error?: { message: string; outOfScope: boolean } | null; situations?: Parameters<typeof Briefing>[0]["situations"] }) {
  const drafts = useBriefingDrafts();
  return <Briefing subject={subject} draft={drafts.draftFor(subject)} onDraftChange={(patch) => drafts.update(subject, patch)} situations={situations}
    onBack={noop} onSetUp={noop} generating={generating} error={error} starterPortraitSrc={noPortrait} />;
}

function planText(plan: BriefingPlan): string {
  switch (plan.kind) {
    case "preset": return `Start the ${plan.preset} starter as written (no setup call).`;
    case "person-default": return "Start with this person’s default situation (no setup call).";
    case "person-situation": return "Start with the chosen saved situation (no setup call).";
    case "draft": return `Draft request fields: ${Object.keys(plan.request).join(", ")}.`;
  }
}

// The whole lobby → briefing → back loop with local state, so Back keeping the text can be tried.
function InteractiveFlow() {
  const drafts = useBriefingDrafts();
  const [people, setPeople] = useState<Person[]>([maya, twelve[1]]);
  const [subject, setSubject] = useState<BriefingSubject | null>(null);
  const [result, setResult] = useState("");
  if (!subject) {
    return <>
      <Lobby people={people} status="ready" onRetry={noop} onPickPerson={(p) => setSubject({ kind: "person", person: p })} onPickStarter={(preset) => setSubject({ kind: "starter", preset })}
        onSomeoneNew={() => setSubject({ kind: "new" })} onAddStarter={later} onEditPerson={noop}
        onDeletePerson={async (p) => { await later(); setPeople((list) => list.filter((item) => item.id !== p.id)); }} starterPortraitSrc={noPortrait} />
      {result ? <p className={styles.sectionNote} role="status">Preview only, nothing was sent. {result}</p> : null}
    </>;
  }
  return <Briefing subject={subject} draft={drafts.draftFor(subject)} onDraftChange={(patch) => drafts.update(subject, patch)}
    situations={subject.kind === "person" && subject.person.id === maya.id ? { status: "ready", items: mayaSituations } : subject.kind === "person" ? { status: "ready", items: [] } : undefined}
    onBack={() => setSubject(null)} onSetUp={(plan) => { setResult(planText(plan)); setSubject(null); }} starterPortraitSrc={noPortrait} />;
}

export function LobbyBriefingGallery() {
  return (
    <section id="lobby-briefing" className={styles.section} aria-labelledby="lobby-briefing-heading">
      <h2 id="lobby-briefing-heading" className={styles.sectionTitle}>Lobby and briefing (1B)</h2>
      <p className={styles.sectionNote}>Synthetic people. Portraits are off here, so starters show their monogram fallback. The private fields share one in-memory store across these examples. Nothing here sends a request or starts a call.</p>

      <Capture state="lobby-interactive" title="Try it: pick, type, go back (text stays)"><InteractiveFlow /></Capture>
      <Capture state="lobby-empty" title="Lobby, first run (no saved people)">
        <Lobby people={[]} status="ready" onRetry={noop} onPickPerson={noop} onPickStarter={noop} onSomeoneNew={noop} starterPortraitSrc={noPortrait} shortcuts={false} />
      </Capture>
      <Capture state="lobby-one" title="Lobby, one saved person">
        <Lobby people={[maya]} status="ready" practicedPresets={["manager"]} onRetry={noop} onPickPerson={noop} onPickStarter={noop} onSomeoneNew={noop} onAddStarter={later} onEditPerson={noop} onDeletePerson={later} starterPortraitSrc={noPortrait} shortcuts={false} />
      </Capture>
      <Capture state="lobby-twelve" title="Lobby, twelve saved people (practiced first)">
        <Lobby people={twelve} status="ready" onRetry={noop} onPickPerson={noop} onPickStarter={noop} onSomeoneNew={noop} onEditPerson={noop} onDeletePerson={later} starterPortraitSrc={noPortrait} shortcuts={false} />
      </Capture>
      <Capture state="lobby-loading" title="Lobby, loading (skeletons after 200 ms)">
        <Lobby people={[]} status="loading" onRetry={noop} onPickPerson={noop} onPickStarter={noop} onSomeoneNew={noop} starterPortraitSrc={noPortrait} shortcuts={false} />
      </Capture>
      <Capture state="lobby-error" title="Lobby, people failed to load">
        <Lobby people={[]} status="error" onRetry={noop} onPickPerson={noop} onPickStarter={noop} onSomeoneNew={noop} starterPortraitSrc={noPortrait} shortcuts={false} />
      </Capture>
      <Capture state="lobby-disabled" title="Lobby, disabled with a reason">
        <Lobby people={[maya]} status="ready" onRetry={noop} onPickPerson={noop} onPickStarter={noop} onSomeoneNew={noop} starterPortraitSrc={noPortrait} shortcuts={false} disabled disabledReason="Signing you out…" />
      </Capture>

      <Capture state="briefing-starter-jordan" title="Briefing, Jordan (starter, default situation)"><StaticBriefing subject={{ kind: "starter", preset: "manager" }} /></Capture>
      <Capture state="briefing-person" title="Briefing, saved person with saved situations"><StaticBriefing subject={{ kind: "person", person: maya }} situations={{ status: "ready", items: mayaSituations }} /></Capture>
      <Capture state="briefing-person-loading" title="Briefing, saved situations loading"><StaticBriefing subject={{ kind: "person", person: twelve[1] }} situations={{ status: "loading", items: [] }} /></Capture>
      <Capture state="briefing-someone-new" title="Briefing, someone new"><StaticBriefing subject={{ kind: "new" }} /></Capture>
      <Capture state="briefing-generating" title="Briefing, setting up"><StaticBriefing subject={{ kind: "starter", preset: "roommate" }} generating /></Capture>
      <Capture state="briefing-error" title="Briefing, setup failed"><StaticBriefing subject={{ kind: "starter", preset: "professor" }} error={{ message: "We couldn’t set up the scene just now.", outOfScope: false }} /></Capture>
    </section>
  );
}
