// W10 "Show me first": when the offer appears, how prominent it is, and the bounded sitting
// (docs/next/01-THE-WOW §2: at most one stand-in, then the user's call, then at most one retry).
// Pure data, no React and no I/O, so the rules can be tested without a call.

import type { TranscriptTurn } from "@/lib/schemas/reflection";

export const MAX_CALLS_PER_SITTING = 3;
export const STAND_IN_LABEL = "Show me first";
export const STAND_IN_HELPER = "See it once, then it’s your turn.";
export const STAND_IN_NO_GOAL_REASON = "Add what you want to say first.";
export const STAND_IN_SKIP_LABEL = "Skip to my turn";
/** The optional "What did you notice?" note on the Your-turn card. Browser memory only. */
export const STAND_IN_NOTE_MAX = 200;

export const standInPrivacyNote = (counterpartName: string) =>
  `To play you, the stand-in gets your line. ${counterpartName} never does.`;
export const yourTurnTitle = (counterpartName: string) =>
  `Your turn. Now you’re you, and ${counterpartName} is ${counterpartName}.`;

export type StandInSitting = {
  /** The stand-in call has been started once this sitting; it is never offered again. */
  readonly standInUsed: boolean;
  /** Stand-in, the user's call and a retry all count against MAX_CALLS_PER_SITTING. */
  readonly callsUsed: number;
  readonly retryUsed: boolean;
};

export const initialStandInSitting: StandInSitting = { standInUsed: false, callsUsed: 0, retryUsed: false };

export type StandInOffer = {
  /** False once the sitting has moved past its first call: this is a "before you try it" step. */
  readonly shown: boolean;
  /** Primary the first time with this counterpart; secondary after an ended practice. */
  readonly emphasis: "primary" | "secondary";
  readonly label: string;
  /** The line under the primary button. Empty when the offer is secondary. */
  readonly helper: string;
  readonly disabled: boolean;
  /** Why it is disabled, in the user's words. Empty when it is enabled. */
  readonly reason: string;
  readonly privacyNote: string;
  readonly skipLabel: string;
};

export function standInOffer(input: {
  counterpartName: string;
  /** The user's goal line. Empty means they have not written one yet. */
  goal: string;
  /** Derived server-side: an ended normal practice with this person or starter already exists. */
  hasPracticed: boolean;
  sitting: StandInSitting;
  /** Set when the server cannot run a stand-in call, e.g. its face and voice are not configured. */
  unavailableReason?: string;
}): StandInOffer {
  const { counterpartName, goal, hasPracticed, sitting, unavailableReason } = input;
  const emphasis = hasPracticed ? "secondary" : "primary";
  const reason = unavailableReason?.trim() || (goal.trim() ? "" : STAND_IN_NO_GOAL_REASON);
  return {
    shown: !sitting.standInUsed && sitting.callsUsed === 0,
    emphasis,
    label: STAND_IN_LABEL,
    helper: emphasis === "primary" ? STAND_IN_HELPER : "",
    disabled: reason !== "",
    reason,
    privacyNote: standInPrivacyNote(counterpartName),
    skipLabel: hasPracticed ? `Call ${counterpartName}` : STAND_IN_SKIP_LABEL,
  };
}

export const canStartCall = (sitting: StandInSitting) => sitting.callsUsed < MAX_CALLS_PER_SITTING;
export const canRetry = (sitting: StandInSitting) => !sitting.retryUsed && sitting.callsUsed > 0 && canStartCall(sitting);

export function beginStandIn(sitting: StandInSitting): StandInSitting {
  if (sitting.standInUsed || sitting.callsUsed !== 0) return sitting;
  return { ...sitting, standInUsed: true, callsUsed: sitting.callsUsed + 1 };
}
export function beginCall(sitting: StandInSitting): StandInSitting {
  if (!canStartCall(sitting)) return sitting;
  return { ...sitting, callsUsed: sitting.callsUsed + 1 };
}
export function beginRetry(sitting: StandInSitting): StandInSitting {
  if (!canRetry(sitting)) return sitting;
  return { ...sitting, callsUsed: sitting.callsUsed + 1, retryUsed: true };
}

// End of the stand-in call. Its turns are dropped here and no reflection is ever requested for
// it: the stand-in was playing the user, so there is nothing about the user's own try to reflect on.
export function endStandIn(sitting: StandInSitting): {
  sitting: StandInSitting;
  turns: readonly TranscriptTurn[];
  runReflection: false;
} {
  return { sitting, turns: [], runReflection: false };
}
