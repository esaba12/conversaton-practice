// Pure practice flow reducer (docs/next/04-NEW-SPECS.md W1). No React, no I/O, no provider calls.
// Every transition returns its teardown as data so tests can assert that leaving a stage
// releases the microphone and ends the practice session.

export type FlowStage =
  | "lobby"
  | "briefing"
  | "meet"
  | "green"
  | "ringing"
  | "call"
  | "recap"
  | "retry-ringing"
  | "retry-call"
  | "retry-recap";

export type FlowEvent =
  // `resume`: re-entering the same subject in this sitting keeps the goal and hard-moment line.
  | { type: "pickPerson"; resume?: boolean }
  | { type: "pickSomeoneNew"; resume?: boolean }
  | { type: "draftReady" }
  | { type: "toGreenRoom" }
  | { type: "ready" }
  | { type: "sessionAccepted" }
  | { type: "videoPlaying" }
  // `interrupted` marks a call that stopped on its own (join failure, counterpart left, expiry)
  // instead of the user pressing End.
  | { type: "ended"; interrupted?: boolean }
  | { type: "retryAccepted" }
  | { type: "back" }
  | { type: "signOut" }
  | { type: "authLost" }
  | { type: "pageHide" };

export type FlowEventType = FlowEvent["type"];

// How the last call finished. Decides the recap variant; "none" before any call.
export type CallOutcome = "none" | "ended" | "interrupted";

export type FlowState = {
  readonly stage: FlowStage;
  // A live microphone stream exists that this app must release on teardown. Acquired in the
  // green room and handed to the call provider on `ready`, so it stays held through the call.
  readonly micHeld: boolean;
  // A practice session exists on the server and must be ended on teardown.
  readonly sessionActive: boolean;
  readonly outcome: CallOutcome;
  // docs/30: at most one retry per sitting.
  readonly retryUsed: boolean;
};

export type Teardown = {
  readonly releaseMic: boolean;
  readonly endSession: boolean;
};

export type FlowTransition = {
  readonly state: FlowState;
  readonly teardown: Teardown;
  // docs/30 step 1: drop the goal, hard-moment line, prediction and likelihoods.
  readonly clearPrivate: boolean;
  // False when the event was illegal for this stage, or legal but left the state identical.
  readonly changed: boolean;
};

export const initialFlowState: FlowState = {
  stage: "lobby",
  micHeld: false,
  sessionActive: false,
  outcome: "none",
  retryUsed: false,
};

export function createFlowState(stage: FlowStage = "lobby"): FlowState {
  return { ...initialFlowState, stage };
}

const noTeardown: Teardown = { releaseMic: false, endSession: false };

// What this state still holds, which is what leaving it has to release.
function release(state: FlowState): Teardown {
  return { releaseMic: state.micHeld, endSession: state.sessionActive };
}

function settle(state: FlowState, next: FlowState, teardown: Teardown, clearPrivate: boolean): FlowTransition {
  const same =
    next.stage === state.stage &&
    next.micHeld === state.micHeld &&
    next.sessionActive === state.sessionActive &&
    next.outcome === state.outcome &&
    next.retryUsed === state.retryUsed;
  return { state: same ? state : next, teardown, clearPrivate, changed: !same };
}

function ignore(state: FlowState): FlowTransition {
  return { state, teardown: noTeardown, clearPrivate: false, changed: false };
}

// Leaving a call for a setup screen: release whatever is held and forget the call.
function leaveCall(state: FlowState, stage: FlowStage, outcome: CallOutcome): FlowTransition {
  return settle(state, { ...state, stage, outcome, micHeld: false, sessionActive: false }, release(state), false);
}

const liveStages: readonly FlowStage[] = ["ringing", "call", "retry-ringing", "retry-call"];
const retryStages: readonly FlowStage[] = ["retry-ringing", "retry-call", "retry-recap"];

export function reduceFlow(state: FlowState, event: FlowEvent): FlowTransition {
  switch (event.type) {
    // Sign-out and auth loss are legal everywhere: they drop the sitting and release everything.
    case "signOut":
    case "authLost":
      return settle(state, initialFlowState, release(state), true);

    // The page is going away. Only a live call changes stage, which matches today's workspace:
    // a recap holds nothing, so nothing moves.
    case "pageHide": {
      const stage = state.stage === "ringing" || state.stage === "call" ? "recap"
        : state.stage === "retry-ringing" || state.stage === "retry-call" ? "retry-recap"
        : state.stage;
      const outcome = stage === state.stage ? state.outcome : "ended";
      return settle(state, { ...state, stage, outcome, micHeld: false, sessionActive: false }, release(state), true);
    }

    // Starting a setup, with a saved person or with someone new. Both are a new sitting.
    case "pickPerson":
    case "pickSomeoneNew":
      if (state.stage !== "lobby" && state.stage !== "briefing") return ignore(state);
      return settle(state, { ...createFlowState("briefing") }, noTeardown, !event.resume);

    case "draftReady":
      if (state.stage !== "briefing") return ignore(state);
      return settle(state, { ...state, stage: "meet" }, noTeardown, false);

    case "toGreenRoom":
      if (state.stage !== "meet") return ignore(state);
      return settle(state, { ...state, stage: "green", micHeld: true }, noTeardown, false);

    // The microphone is handed to the call provider here, not released.
    case "ready":
      if (state.stage !== "green") return ignore(state);
      return settle(state, { ...state, stage: "ringing" }, noTeardown, false);

    case "sessionAccepted":
      if (state.stage !== "ringing" && state.stage !== "retry-ringing") return ignore(state);
      return settle(state, { ...state, sessionActive: true }, noTeardown, false);

    case "videoPlaying":
      if (state.stage === "ringing") return settle(state, { ...state, stage: "call" }, noTeardown, false);
      if (state.stage === "retry-ringing") return settle(state, { ...state, stage: "retry-call" }, noTeardown, false);
      return ignore(state);

    case "ended": {
      if (liveStages.includes(state.stage)) {
        const stage = retryStages.includes(state.stage) ? "retry-recap" : "recap";
        const outcome = event.interrupted ? "interrupted" : "ended";
        return settle(state, { ...state, stage, outcome, micHeld: false, sessionActive: false }, release(state), false);
      }
      // End after an interruption: the recap stops saying the call was interrupted.
      if (!event.interrupted && (state.stage === "recap" || state.stage === "retry-recap") && state.outcome === "interrupted") {
        return settle(state, { ...state, outcome: "ended", micHeld: false, sessionActive: false }, release(state), false);
      }
      return ignore(state);
    }

    case "retryAccepted":
      if (state.stage !== "recap" || state.retryUsed) return ignore(state);
      return settle(state, { ...state, stage: "retry-ringing", outcome: "none", micHeld: true, retryUsed: true }, noTeardown, false);

    case "back":
      switch (state.stage) {
        case "lobby":
        case "call":
        case "retry-call":
          return ignore(state);
        case "briefing":
          return settle(state, { ...state, stage: "lobby" }, noTeardown, false);
        case "meet":
          return settle(state, { ...state, stage: "briefing" }, noTeardown, false);
        // Leaving the green room or cancelling the ring: release the mic and end any session
        // that was already created for this call.
        case "green":
        case "ringing":
          return leaveCall(state, "meet", "none");
        case "recap":
        case "retry-recap":
          return leaveCall(state, "meet", "none");
        case "retry-ringing":
          return leaveCall(state, "recap", "ended");
      }
  }
}

export type PracticePhase = "connecting" | "live" | "interrupted" | "ended";

// The call screen's phase, or null on a setup stage. Keeps the stage list the single source
// of truth for what the workspace renders.
export function callPhase(state: FlowState): PracticePhase | null {
  switch (state.stage) {
    case "ringing":
    case "retry-ringing":
      return "connecting";
    case "call":
    case "retry-call":
      return "live";
    case "recap":
    case "retry-recap":
      return state.outcome === "interrupted" ? "interrupted" : "ended";
    default:
      return null;
  }
}
