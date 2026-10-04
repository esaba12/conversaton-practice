"use client";

import { useCallback, useEffect, useId, useReducer, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, Ear, Lock, Pencil, Phone, RotateCcw } from "lucide-react";
import { Chip, Portrait, PrimaryButton, PrivateCard } from "@/components/ui";
import { readPrivateState, subscribePrivateState, updatePrivateState, type PrivateState } from "@/lib/practice/private-state";
import type { DraftRequest, DraftResponse, StanceOptions } from "@/lib/schemas/draft";
import { stanceFields, type RoleContext } from "@/lib/schemas/role-context";
import { SessionClientError } from "@/lib/session/api-client";
import { idleDraftProgress, reduceDraftProgress, streamDraft, type DraftProgress } from "@/lib/setup/draft-stream-client";
import {
  challengeLabel, knowsLabel, meetKnowledge, neverSees, paceLabel, roleProblem, toneNotice, type KnowsItem, type MeetStart,
} from "./meet-knowledge";
import styles from "./meet.module.css";

// S1 Meet card (docs/32, docs/33 §4.4) with U1 streaming and the U2 knowledge panel. The character is
// a card, not a form: the form lives behind "Edit details". Only a validated role (state "ready") can
// be called; a streamed partial is display only. Goal and hard-moment line are private state.

export const GOAL_MAX = 200;
export const HARD_MOMENT_MAX = 200;
export const STANCE_MAX = 40;

export type MeetState =
  /** The draft request is out. `step` names the real step: request sent, or a first field arrived. */
  | { status: "streaming"; step: "reading" | "shaping"; partialRole?: RoleContext; stanceOptions?: StanceOptions }
  /** A validated role. `streamed` shows the "Ready" status line. */
  | { status: "ready"; role: RoleContext; stanceOptions?: StanceOptions; streamed?: boolean }
  | { status: "error"; message: string; outOfScope: boolean; retryable: boolean };

export type MeetDuration = 180 | 300;

export type MeetCardProps = {
  /** Known before the draft returns (U1): the portrait and name render at once. */
  identity: { name: string; relationship: string; portraitSrc?: string | null };
  state: MeetState;
  /** Edits to the reviewed role (stance chips, Edit details). Only called in state "ready". */
  onRoleChange: (role: RoleContext) => void;
  /** "all" for a drafted or starter role; "situation" for a saved person (identity is edited on their page). */
  editable?: "all" | "situation";
  /** How the start request will be built, for the U2 "Knows" column. */
  start: MeetStart;
  /** Private notes sent only to the setup model, for "Never sees". */
  privateNotes?: string;
  durationSeconds: MeetDuration;
  onDurationChange: (value: MeetDuration) => void;
  onBack: () => void;
  /** Goes to the green room. Never sends a request itself. */
  onCall: () => void;
  onRetry?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  /** Slot for 1E's "Hear {name}" button next to the opening line. */
  hear?: ReactNode;
  /** Added to the opening-line bubble while "Hear {name}" plays (useHearHighlight gives none under reduced motion). */
  bubbleClassName?: string;
  /** Slot under the knowledge panel, e.g. 1G's "The stand-in gets: your line." */
  extras?: ReactNode;
  /** Replaces the Call button when it returns content, e.g. 1G's "Show me first" offer. Gets whether a call may start and why not. */
  actions?: (call: { enabled: boolean; reason: string }) => ReactNode;
  /** Sits beside Call. Text practice; it does not open the green room or the call. */
  textAction?: ReactNode;
  focusHeading?: boolean;
};

const emptyPrivate: PrivateState = { goal: "", hardMomentLine: "", prediction: "", likelihoodBefore: null, likelihoodAfter: null };
const serverPrivate = () => emptyPrivate;

const stanceLabel: Record<(typeof stanceFields)[number], string> = {
  wants: "Wants",
  holdsBackBecause: "Holds back because",
  softensWhen: "Softens when",
};

/** Maps the stream reducer to the card. `reviewed` is the workspace's editable copy of the validated role. */
export function meetStateFromProgress(progress: DraftProgress, reviewed: RoleContext | null): MeetState {
  switch (progress.step) {
    case "idle":
    case "reading":
      return { status: "streaming", step: "reading" };
    case "shaping":
      return { status: "streaming", step: progress.role ? "shaping" : "reading", partialRole: progress.role, stanceOptions: progress.stanceOptions };
    case "ready":
      return { status: "ready", role: reviewed ?? progress.draft.role, stanceOptions: progress.draft.stanceOptions, streamed: true };
    case "error":
      return { status: "error", message: progress.message, outOfScope: progress.code === "OUT_OF_SCOPE", retryable: progress.retryable };
  }
}

export function meetStatusText(state: MeetState, name: string): string {
  if (state.status === "streaming") return state.step === "reading" ? "Reading your situation" : `Shaping ${name}`;
  if (state.status === "ready") return state.streamed ? "Ready" : "";
  return "";
}

/**
 * U1: streams one draft for the Meet card. `start` is called on "Set up the scene" with the briefing's
 * draft request; the card shows at once. `onDone` receives the validated draft (the only thing that
 * may become the role); the suggested goal fills private state only when the user left it blank.
 */
export function useStreamedDraft({ onDone, onError }: { onDone?: (draft: DraftResponse) => void; onError?: (error: SessionClientError) => void } = {}) {
  const [progress, dispatch] = useReducer(reduceDraftProgress, idleDraftProgress);
  const abortRef = useRef<AbortController | null>(null);
  const handlers = useRef({ onDone, onError });
  useEffect(() => { handlers.current = { onDone, onError }; });

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "reset" });
  }, []);

  const start = useCallback((request: DraftRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "sent" });
    streamDraft(request, (field) => { if (!controller.signal.aborted) dispatch({ type: "field", field }); }, { signal: controller.signal }).then(
      (draft) => {
        if (controller.signal.aborted) return;
        if (!readPrivateState().goal.trim()) updatePrivateState({ goal: draft.goal });
        dispatch({ type: "done", draft });
        handlers.current.onDone?.(draft);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const known = error instanceof SessionClientError ? error : new SessionClientError("MALFORMED_RESPONSE", "Something went wrong.", null, true);
        const message = known.code === "OUT_OF_SCOPE" || known.code === "USAGE_LIMIT" ? known.message : "We couldn’t set up the scene just now.";
        dispatch({ type: "failed", message, code: known.code, retryable: known.retryable || known.code === "NETWORK" || known.code === "MALFORMED_RESPONSE" });
        handlers.current.onError?.(known);
      },
    );
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);
  return { progress, start, cancel };
}

function Skeleton({ lines = 1, wide = false }: { lines?: number; wide?: boolean }) {
  return (
    <span className={styles.skeletonGroup} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => <span key={i} className={styles.skeleton} data-wide={wide || i < lines - 1 || undefined} />)}
    </span>
  );
}

function StanceRow({ field, value, options, onChange, inert }: { field: (typeof stanceFields)[number]; value: string | undefined; options: readonly string[]; onChange: (value: string) => void; inert: boolean }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const chips = value && !options.includes(value) ? [value, ...options] : options.length ? options : value ? [value] : [];
  const label = stanceLabel[field];

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function close() {
    setEditing(false);
    editRef.current?.focus();
  }

  function save() {
    const clean = text.trim().replace(/\s+/g, " ").slice(0, STANCE_MAX);
    if (clean) onChange(clean);
    setEditing(false);
  }

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") { event.preventDefault(); save(); }
    if (event.key === "Escape") { event.preventDefault(); close(); }
  }

  return (
    <div className={styles.stanceRow} role="group" aria-labelledby={`${id}-label`} data-stance={field}>
      <span id={`${id}-label`} className={styles.stanceLabel}>{label}</span>
      <div className={styles.chips}>
        {chips.map((chip) => (
          <Chip key={chip} label={chip} title={chip} selected={chip === value}
            onSelectedChange={() => { if (!inert && chip !== value) onChange(chip); }} />
        ))}
        {!editing ? (
          <button ref={editRef} type="button" className={styles.linkButton} disabled={inert} onClick={() => { setText(value ?? ""); setEditing(true); }}
            aria-label={`Write your own: ${label}`}>
            <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />Your own
          </button>
        ) : null}
      </div>
      {editing ? (
        <div className={styles.customRow}>
          <label className={styles.srOnly} htmlFor={`${id}-custom`}>{label}, your own words (up to {STANCE_MAX} characters)</label>
          <input ref={inputRef} id={`${id}-custom`} className={styles.input} type="text" maxLength={STANCE_MAX} autoComplete="off" value={text}
            onChange={(event) => setText(event.target.value)} onKeyDown={onKey} />
          <button type="button" className={styles.smallButton} onClick={save} disabled={!text.trim()}>Use this</button>
          <button type="button" className={styles.linkButton} onClick={close}>Cancel</button>
        </div>
      ) : null}
    </div>
  );
}

function DetailsForm({ role, onRoleChange, editable, invalidField }: { role: RoleContext; onRoleChange: (role: RoleContext) => void; editable: "all" | "situation"; invalidField: keyof RoleContext | null }) {
  const id = useId();
  const [constraintsText, setConstraintsText] = useState(() => role.constraints.join("\n"));
  const set = <K extends keyof RoleContext>(key: K, value: RoleContext[K]) => onRoleChange({ ...role, [key]: value });
  const invalid = (key: keyof RoleContext) => (invalidField === key ? true : undefined);

  function text(key: "name" | "role" | "style" | "opening", max: number, label: string) {
    return (
      <div className={styles.field}>
        <label htmlFor={`${id}-${key}`}>{label}</label>
        <input id={`${id}-${key}`} className={styles.input} type="text" maxLength={max} autoComplete="off" value={role[key]} aria-invalid={invalid(key)}
          onChange={(event) => set(key, event.target.value)} />
      </div>
    );
  }

  return (
    <div className={styles.details}>
      {editable === "all" ? <>
        {text("name", 60, knowsLabel.name)}
        {text("role", 120, knowsLabel.role)}
        {text("style", 300, knowsLabel.style)}
      </> : <p className={styles.hint}>Change who {role.name} is on their page. These details are for this practice.</p>}
      <div className={styles.field}>
        <label htmlFor={`${id}-context`}>{knowsLabel.publicContext}</label>
        <textarea id={`${id}-context`} className={styles.input} rows={4} maxLength={1500} value={role.publicContext} aria-invalid={invalid("publicContext")}
          onChange={(event) => set("publicContext", event.target.value)} />
      </div>
      {text("opening", 300, knowsLabel.opening)}
      <div className={styles.field}>
        <label htmlFor={`${id}-constraints`}>{knowsLabel.constraints} <span className={styles.optional}>One per line, up to 5</span></label>
        <textarea id={`${id}-constraints`} className={styles.input} rows={3} value={constraintsText} aria-invalid={invalid("constraints")}
          onChange={(event) => {
            setConstraintsText(event.target.value);
            set("constraints", event.target.value.split("\n").map((line) => line.trim()).filter(Boolean));
          }} />
      </div>
      <div className={styles.fieldPair}>
        <div className={styles.field}>
          <label htmlFor={`${id}-challenge`}>{knowsLabel.challenge}</label>
          <select id={`${id}-challenge`} className={styles.input} value={role.challenge} onChange={(event) => set("challenge", event.target.value as RoleContext["challenge"])}>
            {(Object.keys(challengeLabel) as RoleContext["challenge"][]).map((key) => <option key={key} value={key}>{challengeLabel[key]}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-pace`}>{knowsLabel.pace}</label>
          <select id={`${id}-pace`} className={styles.input} value={role.pace} onChange={(event) => set("pace", event.target.value as RoleContext["pace"])}>
            {(Object.keys(paceLabel) as RoleContext["pace"][]).map((key) => <option key={key} value={key}>{paceLabel[key]}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function KnowsList({ items }: { items: readonly KnowsItem[] }) {
  return (
    <ul className={styles.knowsList}>
      {items.map((entry) => (
        <li key={entry.field} className={styles.knowsItem} data-knows-field={entry.field} data-source={entry.source}>
          <span className={styles.knowsLabel}>{entry.label}</span>
          {entry.text ? <span className={styles.knowsText}>{entry.text}</span> : null}
          {entry.chips?.length ? (
            <span className={styles.knowsChips}>{entry.chips.map((chip) => <span key={chip} className={styles.tag}>{chip}</span>)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function KnowledgePanel({ name, items, never }: { name: string; items: readonly KnowsItem[]; never: ReturnType<typeof neverSees> }) {
  const id = useId();
  return (
    <section className={styles.knowledge} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className={styles.sectionTitle}>What {name} knows</h3>
      <div className={styles.knowledgeColumns}>
        <div className={styles.knowledgeColumn}>
          <h4 className={styles.columnTitle}>Knows</h4>
          {items.length ? <KnowsList items={items} /> : <p className={styles.hint}>Filling in as {name} comes together.</p>}
        </div>
        <div className={styles.knowledgeColumn} data-never>
          <h4 className={styles.columnTitle}>Never sees</h4>
          {never.length ? (
            <ul className={styles.neverList}>
              {never.map((entry) => (
                <li key={entry.key} className={styles.lockChip} data-never-key={entry.key}>
                  <Lock size={16} strokeWidth={1.75} aria-hidden="true" />{entry.label}
                </li>
              ))}
            </ul>
          ) : <p className={styles.hint}>Anything you write for yourself stays here.</p>}
        </div>
      </div>
    </section>
  );
}

export function ToneNotice({ name, tone = "room" }: { name: string; tone?: "room" | "night" }) {
  return (
    <p className={styles.notice} data-tone={tone}>
      <Ear size={20} strokeWidth={1.75} aria-hidden="true" className={styles.noticeIcon} />
      <span>{toneNotice(name)}</span>
    </p>
  );
}

export function MeetCard({
  identity, state, onRoleChange, editable = "all", start, privateNotes = "", durationSeconds, onDurationChange, onBack, onCall, onRetry,
  disabled = false, disabledReason = "Please wait a moment.", hear, bubbleClassName, extras, actions, textAction, focusHeading = false,
}: MeetCardProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const privateState = useSyncExternalStore(subscribePrivateState, readPrivateState, serverPrivate);
  useEffect(() => { if (focusHeading) headingRef.current?.focus(); }, [focusHeading]);

  const role = state.status === "ready" ? state.role : state.status === "streaming" ? state.partialRole : undefined;
  const stanceOptions = state.status === "error" ? undefined : state.stanceOptions;
  const name = (state.status === "ready" ? state.role.name.trim() : "") || role?.name.trim() || identity.name.trim() || "Someone new";
  const relationship = role?.role || identity.relationship;
  const ready = state.status === "ready";
  const problem = ready ? roleProblem(state.role) : null;
  const status = meetStatusText(state, name);
  const knows = ready ? meetKnowledge(state.role, start) : role ? meetKnowledge(role, start) : [];
  const never = neverSees(privateState, privateNotes);

  const reason = disabled ? disabledReason
    : state.status === "streaming" ? `Wait for ${name} to finish coming together.`
    : state.status === "error" ? "The scene couldn’t be set up. Try again, or change the briefing."
    : problem?.reason ?? "";
  const canCall = ready && !problem && !disabled;

  return (
    <section className={styles.meet} aria-labelledby={`${id}-name`} aria-busy={state.status === "streaming" || undefined} data-meet-status={state.status}>
      <button type="button" className={styles.back} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />Back to the briefing
      </button>

      <div className={styles.columns}>
        <div className={styles.left}>
          <article className={styles.character} aria-labelledby={`${id}-name`}>
            <div className={styles.identity}>
              <Portrait name={name} size={120} src={identity.portraitSrc} className={styles.portrait} />
              <div className={styles.identityText}>
                <h2 id={`${id}-name`} ref={headingRef} tabIndex={-1} className={styles.name}>{name}</h2>
                {relationship ? <p className={styles.relationship}>{relationship}</p> : null}
                {status ? <p className={styles.status} aria-live="polite" data-step={state.status === "streaming" ? state.step : "ready"}>{status}</p> : null}
              </div>
            </div>

            {state.status === "error" ? (
              <div className={styles.error} role="alert">
                <p className={styles.errorTitle}>{state.message}</p>
                <p>{state.outOfScope ? "Try an everyday conversation, like asking for help or talking about chores." : "Your briefing is kept. You can try again."}</p>
                <div className={styles.actions}>
                  {state.retryable && onRetry ? (
                    <button type="button" className={styles.smallButton} onClick={onRetry}>
                      <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />Try again
                    </button>
                  ) : null}
                  <button type="button" className={styles.linkButton} onClick={onBack}>Change the briefing</button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.trait}>
                  <span className={styles.traitLabel}>How they talk</span>
                  {role ? <p className={styles.traitText}>{role.style}</p> : <Skeleton lines={2} />}
                </div>
                <div className={styles.trait}>
                  {role?.wants ? <p className={styles.wants}><span className={styles.traitLabel}>Wants</span> {role.wants}</p> : role ? null : <Skeleton />}
                  {role ? <span className={styles.reaction}>{challengeLabel[role.challenge]}</span> : null}
                </div>
                <figure className={styles.bubbleWrap}>
                  <figcaption className={styles.srOnly}>{name}’s opening line</figcaption>
                  {role ? <blockquote className={[styles.bubble, bubbleClassName].filter(Boolean).join(" ")}>{role.opening}</blockquote> : <span className={styles.bubble} aria-hidden="true"><Skeleton lines={2} /></span>}
                  {ready && hear ? <div className={styles.hear}>{hear}</div> : null}
                </figure>
              </>
            )}
          </article>

          {state.status !== "error" ? (
            <section className={styles.stance} aria-labelledby={`${id}-stance`}>
              <h3 id={`${id}-stance`} className={styles.sectionTitle}>Where {name} stands</h3>
              {role ? stanceFields.map((field) => (
                <StanceRow key={field} field={field} value={role[field]} options={stanceOptions?.[field] ?? []} inert={!ready || disabled}
                  onChange={(value) => { if (ready) onRoleChange({ ...state.role, [field]: value }); }} />
              )) : <Skeleton lines={3} wide />}
              {role ? <p className={styles.hint}>Tap another chip to change how {name} plays it. {name} sees these.</p> : null}
            </section>
          ) : null}

          <ToneNotice name={name} />

          {ready ? (
            <div className={styles.detailsWrap}>
              <button type="button" className={styles.detailsToggle} aria-expanded={detailsOpen || Boolean(problem)} aria-controls={`${id}-details`}
                onClick={() => setDetailsOpen((open) => !open)}>
                <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />Edit details
              </button>
              {detailsOpen || problem ? (
                <div id={`${id}-details`}>
                  <DetailsForm role={state.role} onRoleChange={onRoleChange} editable={editable} invalidField={problem?.field ?? null} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={styles.right}>
          <h3 className={styles.beforeTitle}>Before you call</h3>
          <PrivateCard note={`${name} never sees this.`}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor={`${id}-goal`}>Your line <span className={styles.optional}>What you want to say</span></label>
                <span className={styles.count}>{privateState.goal.length} / {GOAL_MAX}</span>
              </div>
              <input id={`${id}-goal`} className={styles.input} type="text" maxLength={GOAL_MAX} autoComplete="off" value={privateState.goal} disabled={disabled}
                onChange={(event) => updatePrivateState({ goal: event.target.value })} />
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor={`${id}-hard`}>When it gets hard, I’ll say <span className={styles.optional}>Optional</span></label>
                <span className={styles.count}>{privateState.hardMomentLine.length} / {HARD_MOMENT_MAX}</span>
              </div>
              <input id={`${id}-hard`} className={styles.input} type="text" maxLength={HARD_MOMENT_MAX} autoComplete="off" spellCheck={false} value={privateState.hardMomentLine} disabled={disabled}
                onChange={(event) => updatePrivateState({ hardMomentLine: event.target.value })} />
            </div>
          </PrivateCard>

          <div className={styles.length} role="group" aria-labelledby={`${id}-length`}>
            <span id={`${id}-length`} className={styles.stanceLabel}>Length</span>
            <div className={styles.chips}>
              {([180, 300] as const).map((value) => (
                <Chip key={value} label={`${value / 60} min`} selected={durationSeconds === value} onSelectedChange={() => { if (!disabled) onDurationChange(value); }} />
              ))}
            </div>
          </div>

          <KnowledgePanel name={name} items={knows} never={never} />
          {extras}

          <div className={styles.cta}>
            {actions?.({ enabled: canCall, reason: reason || "Please wait a moment." }) ?? (canCall
              ? <PrimaryButton label={`Call ${name}`} icon={Phone} onClick={onCall} />
              : <PrimaryButton label={`Call ${name}`} icon={Phone} disabled disabledReason={reason || "Please wait a moment."} />)}
            {textAction}
          </div>
          <p className={styles.fine}>A fictional AI character for practice. Real people may react differently.</p>
        </div>
      </div>
    </section>
  );
}