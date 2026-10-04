"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { Portrait } from "@/components/ui";
import { SaveAfterEnd } from "@/components/presentation/people-save";
import { ReflectionPanel, type AlternativeState } from "@/components/presentation/reflection-panel";
import { sameName, type CallOrigin, type ReflectState, type SaveOffer } from "@/lib/practice/types";
import type { Person } from "@/lib/schemas/people";
import type { TranscriptTurn } from "@/lib/schemas/reflection";
import type { RoleContext } from "@/lib/schemas/role-context";
import { RecapArc } from "./recap-arc";
import { RecapSelfCheck, RETRY_DONE_COPY, STOP_HERE_COPY, selfCheckShown } from "./recap-retry";
import { RecapStance } from "./recap-stance";
import styles from "./recap.module.css";

export const RECAP_TITLE = "That was a real try.";
export const RECAP_SAVE_NOTE = "This call isn’t saved. Save only what you choose.";

// Stage `recap` (L1, W7): what sits under the ended call screen. Nothing on this screen judges the
// user. Saving a person is always explicit, the reflection can be skipped, and the one retry
// (docs/30) is offered at most once per sitting.
export type RecapStageProps = {
  // False when the call was interrupted rather than ended by the user.
  ended: boolean;
  origin: CallOrigin | null;
  saveOffer: SaveOffer;
  people: Person[];
  peopleStatus: "loading" | "ready" | "error";
  onSave: () => void;
  onDismissSave: () => void;
  reflect: ReflectState;
  turns: readonly TranscriptTurn[];
  onSelfReflectionChange: (value: string) => void;
  onReflect: () => void;
  onReflectionDone: () => void;
  canRetryCleanup: boolean;
  onRetryCleanup: () => void;
  onBackToSetup: () => void;
  backToSetupRef: Ref<HTMLButtonElement>;
  counterpartName?: string;
  portraitSrc?: string | null;
  /** The role the user reviewed before the call, for the Q2 dropdown. */
  role?: Pick<RoleContext, "wants" | "holdsBackBecause" | "softensWhen" | "challenge"> | null;
  /** This is the retry's recap: no second self-check, and the closing sentence instead. */
  isRetry?: boolean;
  /** docs/30: the one line the user planned for the hard moment. Empty hides the self-check. */
  hardMomentLine?: string;
  /** False once the sitting has no call left or the retry was already used. */
  retryAvailable?: boolean;
  onRetry?: (opening: string) => void;
  retryStarting?: boolean;
  /** W4: the fear and both numbers, from browser memory. */
  prediction?: string;
  likelihoodBefore?: number | null;
  likelihoodAfter?: number | null;
  onLikelihoodAfterChange?: (value: number) => void;
  /** A1: supplied only when the caller can make the request. */
  alternative?: AlternativeState;
  onAlternative?: () => void;
  /** Pocket card and the real-conversation day, shown after the save offer. */
  keep?: ReactNode;
  focusHeading?: boolean;
};

function SaveCard({ origin, saveOffer, people, peopleStatus, onSave, onDismissSave }: Pick<RecapStageProps, "origin" | "saveOffer" | "people" | "peopleStatus" | "onSave" | "onDismissSave">) {
  if (!origin || !saveOffer.open) return null;
  if (origin.kind === "person") return <SaveAfterEnd mode="saved" name={origin.person.name} personId={origin.person.id} onSave={() => undefined} onDismiss={onDismissSave} />;
  const match = people.find((person) => sameName(person.name, origin.role.name));
  return <SaveAfterEnd mode={match && !saveOffer.saved ? "update" : "new"} name={match && !saveOffer.saved ? match.name : origin.role.name} onSave={onSave} onDismiss={onDismissSave}
    saving={saveOffer.saving} ready={peopleStatus !== "loading"} saved={saveOffer.saved} errorMessage={saveOffer.error || undefined} />;
}

export function RecapStage({
  ended, origin, saveOffer, people, peopleStatus, onSave, onDismissSave,
  reflect, turns, onSelfReflectionChange, onReflect, onReflectionDone,
  canRetryCleanup, onRetryCleanup, onBackToSetup, backToSetupRef,
  counterpartName, portraitSrc = null, role = null, isRetry = false, hardMomentLine = "", retryAvailable = false,
  onRetry, retryStarting = false, prediction = "", likelihoodBefore = null, likelihoodAfter = null, onLikelihoodAfterChange,
  alternative, onAlternative, keep, focusHeading = false,
}: RecapStageProps) {
  const name = (counterpartName ?? (origin?.kind === "person" ? origin.person.name : origin?.role.name) ?? "").trim();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focusHeading) headingRef.current?.focus(); }, [focusHeading]);
  const supportExit = !!reflect.reflection?.supportExit;
  const showSelfCheck = ended && !!onRetry && selfCheckShown({ hardMomentLine, supportExit, isRetry, retryAvailable });

  return <div className={styles.recap}>
    {ended && <header className={styles.header}>
      {name && <Portrait name={name} size={64} src={portraitSrc} />}
      <h2 ref={headingRef} tabIndex={-1} className={styles.title}>{RECAP_TITLE}</h2>
    </header>}
    {showSelfCheck && onRetry && <RecapSelfCheck counterpartName={name} hardMomentLine={hardMomentLine} onRetry={onRetry} starting={retryStarting} />}
    {reflect.sessionId && <ReflectionPanel selfReflection={reflect.selfReflection}
      onSelfReflectionChange={onSelfReflectionChange} onReflect={onReflect} onDone={onReflectionDone}
      pending={reflect.pending} reflection={reflect.reflection} error={reflect.error} noSpeech={!turns.some((turn) => turn.speaker === "user")}
      autoStart={ended} alternative={alternative} onAlternative={onAlternative} />}
    {ended && onLikelihoodAfterChange && <RecapArc prediction={prediction} likelihoodBefore={likelihoodBefore} likelihoodAfter={likelihoodAfter} onLikelihoodAfterChange={onLikelihoodAfterChange} />}
    {ended && role && name && <RecapStance counterpartName={name} role={role} />}
    {ended && <SaveCard origin={origin} saveOffer={saveOffer} people={people} peopleStatus={peopleStatus} onSave={onSave} onDismissSave={onDismissSave} />}
    {ended && <p className={styles.quiet}>{RECAP_SAVE_NOTE}</p>}
    {ended && keep}
    {ended && <p className={styles.close}>{isRetry ? RETRY_DONE_COPY : STOP_HERE_COPY}</p>}
    <div className="actions">
      {canRetryCleanup && <button type="button" className="button secondary" onClick={onRetryCleanup}>Retry closing session</button>}
      {/* docs/33 calls this "Done"; the label stays "Back to setup" until the coordinator-owned hero-path spec and g5 preflight move with it. */}
      {ended && <button ref={backToSetupRef} type="button" className="button" onClick={onBackToSetup}>Back to setup</button>}
    </div>
  </div>;
}
