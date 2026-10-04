"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Chip, Portrait, PrimaryButton, PrivateCard } from "@/components/ui";
import { examples } from "@/fixtures/examples";
import { readPrivateState, subscribePrivateState, updatePrivateState, type PrivateState } from "@/lib/practice/private-state";
import { applySkill, skillIds, skillSituation, skillTemplates } from "@/lib/practice/skill-templates";
import type { DraftRequest } from "@/lib/schemas/draft";
import type { Person, PersonSituation } from "@/lib/schemas/people";
import type { SessionPreset, Situation } from "@/lib/schemas/situation";
import { personTraits, starterPortraitPath, starterRelationship } from "./lobby";
import styles from "./briefing.module.css";

// P3 briefing (docs/32, docs/33 §4.3). The situation text is the only thing here that can reach the
// setup model, with the goal as today. The hard-moment line lives in private state and is never sent.

export const SITUATION_MAX = 1000;
export const GOAL_MAX = 200;
export const HARD_MOMENT_MAX = 200;
export const NAME_MAX = 60;

export const relationshipOptions = ["Roommate", "Friend", "Partner", "Parent", "Sibling", "Manager", "Coworker", "Professor", "Other"] as const;

// W2 suggested hard-moment line; the suggested goals come from fixtures/examples.ts.
const starterHardMoment: Partial<Record<SessionPreset, string>> = {
  manager: "If they say the team needs me, I'll say I get that, and I still need to drop one thing.",
};

export type BriefingSubject =
  | { kind: "person"; person: Person }
  | { kind: "starter"; preset: SessionPreset }
  | { kind: "new" };

// What the user typed for one subject in this sitting. Held by the workspace so Back keeps it.
export type BriefingDraft = {
  situation: string;
  /** Someone new only. Optional; blank lets the setup pick a name. */
  name: string;
  /** Someone new only: one of relationshipOptions, or "". */
  relationship: string;
  /** Set when a saved-situation chip filled the text; any edit clears it. */
  savedSituationId: string | null;
};

export function briefingKey(subject: BriefingSubject): string {
  return subject.kind === "person" ? `person:${subject.person.id}` : subject.kind === "starter" ? `starter:${subject.preset}` : "new";
}

export function defaultSituation(subject: BriefingSubject): string {
  if (subject.kind === "person") return subject.person.publicContext;
  if (subject.kind === "starter") return examples[subject.preset].role.publicContext;
  return "";
}

// P3: the briefing opens prefilled with the default situation.
export function initialBriefingDraft(subject: BriefingSubject): BriefingDraft {
  return { situation: defaultSituation(subject), name: "", relationship: "", savedSituationId: null };
}

export function subjectName(subject: BriefingSubject, draft: BriefingDraft): string {
  if (subject.kind === "person") return subject.person.name;
  if (subject.kind === "starter") return examples[subject.preset].role.name;
  return draft.name.trim();
}

function subjectRelationship(subject: BriefingSubject, draft: BriefingDraft): string {
  if (subject.kind === "person") return subject.person.relationship;
  if (subject.kind === "starter") return starterRelationship[subject.preset];
  return draft.relationship;
}

// What "Set up the scene" does. Only `draft` calls the setup model; the others start from what is
// already reviewed on the server. No branch carries the hard-moment line, fear, likelihoods or notes.
export type BriefingPlan =
  | { kind: "preset"; preset: SessionPreset }
  | { kind: "person-default"; personId: string; expectedVersion: number }
  | { kind: "person-situation"; personId: string; expectedVersion: number; situation: Situation }
  | { kind: "draft"; request: DraftRequest };

export function briefingPlan(subject: BriefingSubject, draft: BriefingDraft, goal: string, situations: readonly PersonSituation[] = []): BriefingPlan | null {
  const text = draft.situation.trim();
  if (!text || draft.situation.length > SITUATION_MAX) return null;
  const trimmedGoal = goal.trim().slice(0, GOAL_MAX);
  const withGoal = (request: DraftRequest): DraftRequest => (trimmedGoal ? { ...request, goal: trimmedGoal } : request);

  if (subject.kind === "starter") {
    if (text === defaultSituation(subject).trim()) return { kind: "preset", preset: subject.preset };
    return { kind: "draft", request: withGoal({ situation: framed(`${examples[subject.preset].role.name} (${starterRelationship[subject.preset]})`, text) }) };
  }
  if (subject.kind === "person") {
    const { id: personId, version: expectedVersion } = subject.person;
    const saved = draft.savedSituationId ? situations.find((item) => item.id === draft.savedSituationId) : undefined;
    if (saved && text === saved.situation.publicContext.trim()) return { kind: "person-situation", personId, expectedVersion, situation: saved.situation };
    if (text === defaultSituation(subject).trim()) return { kind: "person-default", personId, expectedVersion };
    return { kind: "draft", request: withGoal({ situation: text, personId }) };
  }
  const name = draft.name.trim().slice(0, NAME_MAX);
  const who = [name, draft.relationship ? `my ${draft.relationship.toLocaleLowerCase()}` : ""].filter(Boolean).join(", ");
  return { kind: "draft", request: withGoal({ situation: who ? framed(who, text) : text }) };
}

// Prefixes who the conversation is with, keeping the request within the situation limit.
function framed(who: string, text: string): string {
  const prefix = `With ${who}: `;
  return prefix + text.slice(0, SITUATION_MAX - prefix.length);
}

// The workspace's per-sitting memory of briefing text, keyed by subject. `clear()` on sign-out,
// auth loss and page hide, alongside clearPrivateState().
export function useBriefingDrafts() {
  const [drafts, setDrafts] = useState<Record<string, BriefingDraft>>({});
  const draftFor = useCallback((subject: BriefingSubject) => drafts[briefingKey(subject)] ?? initialBriefingDraft(subject), [drafts]);
  const update = useCallback((subject: BriefingSubject, patch: Partial<BriefingDraft>) => {
    setDrafts((current) => {
      const key = briefingKey(subject);
      return { ...current, [key]: { ...(current[key] ?? initialBriefingDraft(subject)), ...patch } };
    });
  }, []);
  const clear = useCallback(() => setDrafts({}), []);
  return { draftFor, update, clear };
}

const emptyPrivate: PrivateState = { goal: "", hardMomentLine: "", prediction: "", likelihoodBefore: null, likelihoodAfter: null };
const serverPrivate = () => emptyPrivate;

function shortLabel(text: string, max = 36): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export type BriefingError = { message: string; outOfScope: boolean };

export type BriefingProps = {
  subject: BriefingSubject;
  draft: BriefingDraft;
  onDraftChange: (patch: Partial<BriefingDraft>) => void;
  /** Saved person only: GET /api/people/[id]/situations. */
  situations?: { status: "loading" | "ready" | "error"; items: readonly PersonSituation[] };
  onBack: () => void;
  /** Called with the plan for this briefing; the workspace performs it. */
  onSetUp: (plan: BriefingPlan) => void;
  generating?: boolean;
  error?: BriefingError | null;
  disabled?: boolean;
  disabledReason?: string;
  focusHeading?: boolean;
  starterPortraitSrc?: (preset: SessionPreset) => string | null;
};

export function Briefing({
  subject, draft, onDraftChange, situations, onBack, onSetUp, generating = false, error, disabled = false, disabledReason = "Please wait a moment.",
  focusHeading = false, starterPortraitSrc = starterPortraitPath,
}: BriefingProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const privateState = useSyncExternalStore(subscribePrivateState, readPrivateState, serverPrivate);
  useEffect(() => { if (focusHeading) headingRef.current?.focus(); }, [focusHeading]);

  const name = subjectName(subject, draft);
  const relationship = subjectRelationship(subject, draft);
  const displayName = name || "Someone new";
  const savedItems = situations?.status === "ready" ? situations.items : [];
  const plan = briefingPlan(subject, draft, privateState.goal, savedItems);
  const inert = disabled || generating;
  const tooLong = draft.situation.length > SITUATION_MAX;
  const reason = disabled ? disabledReason : tooLong ? `Shorten the situation to ${SITUATION_MAX} characters.` : "Say what’s going on first.";
  const portraitSrc = subject.kind === "starter" ? starterPortraitSrc(subject.preset) : null;
  const fallbackDefault = defaultSituation(subject);
  const suggestedGoal = subject.kind === "starter" ? examples[subject.preset].goal : "";
  const suggestedHardMoment = subject.kind === "starter" ? starterHardMoment[subject.preset] ?? "" : "";

  function submit(event: FormEvent) {
    event.preventDefault();
    if (inert || !plan) return;
    onSetUp(plan);
  }

  function fill(situation: string, savedSituationId: string | null = null) {
    if (inert) return;
    onDraftChange({ situation, savedSituationId });
  }

  return (
    <section className={styles.briefing} aria-labelledby={`${id}-title`} aria-busy={generating || undefined}>
      <button type="button" className={styles.back} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />All people
      </button>

      <div className={styles.columns}>
        <aside className={styles.identity} aria-label={subject.kind === "new" ? "Who this is" : `About ${displayName}`}>
          <Portrait name={displayName} size={240} src={portraitSrc} className={styles.portrait} />
          {subject.kind === "new" ? (
            <div className={styles.newFields}>
              <div className={styles.field}>
                <label htmlFor={`${id}-name`}>Name <span className={styles.optional}>Optional</span></label>
                <input id={`${id}-name`} form={`${id}-form`} type="text" maxLength={NAME_MAX} autoComplete="off" value={draft.name} disabled={inert} aria-describedby={`${id}-name-hint`}
                  onChange={(event) => onDraftChange({ name: event.target.value })} />
                <p id={`${id}-name-hint`} className={styles.hint}>Leave it blank and we’ll pick a name.</p>
              </div>
              <div className={styles.chipGroup} role="group" aria-label="Relationship">
                <span className={styles.groupLabel} aria-hidden="true">Relationship</span>
                <div className={styles.chips}>
                  {relationshipOptions.map((option) => (
                    <Chip key={option} form={`${id}-form`} label={option} selected={draft.relationship === option}
                      onSelectedChange={(on) => { if (!inert) onDraftChange({ relationship: on ? option : "" }); }} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className={styles.name}>{displayName}</p>
              <p className={styles.relationship}>{relationship}{subject.kind === "starter" ? " · Starter, fictional" : ""}</p>
              {subject.kind === "person" && personTraits(subject.person).length > 0 ? (
                <ul className={styles.traits} aria-label="Traits">
                  {personTraits(subject.person).map((trait) => <li key={trait} className={styles.trait}>{trait}</li>)}
                </ul>
              ) : null}
              {subject.kind === "person" ? (
                <Link className={styles.knows} href={`/practice/people/${encodeURIComponent(subject.person.id)}`}>
                  {subject.person.sharedFactIds.length > 0
                    ? `Knows about you: ${subject.person.sharedFactIds.length} ${subject.person.sharedFactIds.length === 1 ? "thing" : "things"}`
                    : "Knows nothing about you yet"}
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              ) : <p className={styles.knowsPlain}>Knows nothing about you.</p>}
            </>
          )}
        </aside>

        <form id={`${id}-form`} className={styles.form} onSubmit={submit} noValidate>
          <h1 id={`${id}-title`} ref={headingRef} tabIndex={-1} className={styles.title}>
            {name ? <>What’s going on with <span className={styles.serifName}>{name}</span>?</> : "What’s going on?"}
          </h1>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor={`${id}-situation`} className={styles.srOnly}>What’s going on</label>
              <span id={`${id}-situation-count`} className={styles.count} data-over={tooLong || undefined}>{draft.situation.length} / {SITUATION_MAX}</span>
            </div>
            <textarea id={`${id}-situation`} className={styles.situation} rows={5} value={draft.situation} disabled={inert}
              aria-describedby={`${id}-chips-hint ${id}-situation-count`} aria-invalid={tooLong || undefined}
              placeholder={subject.kind === "new" ? "Who is it with, and what’s going on?" : undefined}
              onChange={(event) => onDraftChange({ situation: event.target.value, savedSituationId: null })} />
          </div>

          <div className={styles.chipGroup} role="group" aria-labelledby={`${id}-chips-hint`}>
            <p id={`${id}-chips-hint`} className={styles.hint}>Quick starts fill the box. Nothing starts until you press Set up the scene.</p>
            <div className={styles.chips}>
              {fallbackDefault ? (
                <Chip label={subject.kind === "person" ? `Same as last time: ${shortLabel(fallbackDefault, 14)}` : "The starter situation"}
                  selected={draft.situation === fallbackDefault && !draft.savedSituationId} onSelectedChange={() => fill(fallbackDefault)} />
              ) : null}
              {savedItems.map((item) => (
                <Chip key={item.id} label={shortLabel(item.label, 40)} selected={draft.savedSituationId === item.id} onSelectedChange={() => fill(item.situation.publicContext, item.id)} />
              ))}
              {skillIds.map((skill) => {
                const text = skillSituation(skill, name || undefined);
                return (
                  <Chip key={skill} label={skillTemplates[skill].label} selected={draft.situation === text} data-skill={skill}
                    onSelectedChange={() => {
                      if (inert) return;
                      const filled = applySkill(skill, name || undefined, privateState.goal);
                      onDraftChange({ situation: filled.situation, savedSituationId: null });
                      if (filled.goal !== privateState.goal) updatePrivateState({ goal: filled.goal.slice(0, GOAL_MAX) });
                    }} />
                );
              })}
            </div>
            {situations?.status === "loading" ? <p className={styles.hint}>Loading saved situations…</p> : null}
            {situations?.status === "error" ? <p className={styles.hint}>Saved situations couldn’t load. You can still describe it here.</p> : null}
          </div>

          <PrivateCard note={`${name || "The character"} never sees this.`}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor={`${id}-goal`}>What do you want to do? <span className={styles.optional}>Optional</span></label>
                <span className={styles.count}>{privateState.goal.length} / {GOAL_MAX}</span>
              </div>
              <input id={`${id}-goal`} type="text" maxLength={GOAL_MAX} autoComplete="off" value={privateState.goal} disabled={inert}
                onChange={(event) => updatePrivateState({ goal: event.target.value })} />
              {suggestedGoal && !privateState.goal ? (
                <button type="button" className={styles.suggest} onClick={() => updatePrivateState({ goal: suggestedGoal })} disabled={inert}>Use a suggestion: {suggestedGoal}</button>
              ) : null}
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor={`${id}-hard`}>When it gets hard, I’ll say <span className={styles.optional}>Optional</span></label>
                <span className={styles.count}>{privateState.hardMomentLine.length} / {HARD_MOMENT_MAX}</span>
              </div>
              <input id={`${id}-hard`} type="text" maxLength={HARD_MOMENT_MAX} autoComplete="off" spellCheck={false} value={privateState.hardMomentLine} disabled={inert}
                onChange={(event) => updatePrivateState({ hardMomentLine: event.target.value })} />
              {suggestedHardMoment && !privateState.hardMomentLine ? (
                <button type="button" className={styles.suggest} onClick={() => updatePrivateState({ hardMomentLine: suggestedHardMoment })} disabled={inert}>Use a suggestion: {suggestedHardMoment}</button>
              ) : null}
            </div>
          </PrivateCard>

          {error && !generating ? (
            <div className={styles.error} role="alert">
              <p>{error.message}</p>
              <p>{error.outOfScope ? "Try an everyday conversation, like asking for help or talking about chores." : "Your text is still here. You can try again."}</p>
            </div>
          ) : null}

          <div className={styles.actions}>
            {plan && !disabled
              ? <PrimaryButton type="submit" label="Set up the scene" icon={ArrowRight} loading={generating} loadingLabel={`Setting up ${name || "the scene"}…`} />
              : <PrimaryButton type="submit" label="Set up the scene" icon={ArrowRight} disabled disabledReason={reason} />}
            {generating ? <p className={styles.hint} role="status">Reading your situation</p> : null}
          </div>
          <p className={styles.fine}>Practice with a fictional character. Real conversations may unfold differently.</p>
        </form>
      </div>
    </section>
  );
}
