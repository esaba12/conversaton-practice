import { beforeEach, describe, expect, it } from "vitest";
import {
  callPhase,
  createFlowState,
  initialFlowState,
  reduceFlow,
  type FlowEvent,
  type FlowEventType,
  type FlowStage,
  type FlowState,
} from "@/lib/practice/flow";
import { clearPrivateState, readPrivateState, subscribePrivateState, updatePrivateState } from "@/lib/practice/private-state";

const stages: FlowStage[] = ["lobby", "briefing", "meet", "green", "ringing", "call", "recap", "retry-ringing", "retry-call", "retry-recap"];

// Events that only apply on some stages. Sign-out, auth loss and page hide are legal everywhere
// and are checked stage by stage further down.
const stageEvents: FlowEvent[] = [
  { type: "pickPerson" },
  { type: "pickSomeoneNew" },
  { type: "draftReady" },
  { type: "toGreenRoom" },
  { type: "ready" },
  { type: "sessionAccepted" },
  { type: "videoPlaying" },
  { type: "ended" },
  { type: "ended", interrupted: true },
  { type: "retryAccepted" },
  { type: "back" },
];

const key = (event: FlowEvent) => (event.type === "ended" && event.interrupted ? "interrupted" : event.type);

function walk(state: FlowState, ...events: FlowEvent[]) {
  return events.reduce((current, event) => reduceFlow(current, event).state, state);
}

// A representative state for each stage, reached the way the workspace reaches it.
const path: Record<FlowStage, () => FlowState> = {
  lobby: (): FlowState => initialFlowState,
  briefing: (): FlowState => walk(initialFlowState, { type: "pickPerson" }),
  meet: (): FlowState => walk(path.briefing(), { type: "draftReady" }),
  green: (): FlowState => walk(path.meet(), { type: "toGreenRoom" }),
  // The ring, with the session the start request accepted.
  ringing: (): FlowState => walk(path.green(), { type: "ready" }, { type: "sessionAccepted" }),
  call: (): FlowState => walk(path.ringing(), { type: "videoPlaying" }),
  recap: (): FlowState => walk(path.call(), { type: "ended" }),
  "retry-ringing": (): FlowState => walk(path.recap(), { type: "retryAccepted" }, { type: "sessionAccepted" }),
  "retry-call": (): FlowState => walk(path["retry-ringing"](), { type: "videoPlaying" }),
  "retry-recap": (): FlowState => walk(path["retry-call"](), { type: "ended" }),
};

type Expected = {
  stage: FlowStage;
  changed?: boolean;
  micHeld?: boolean;
  sessionActive?: boolean;
  outcome?: FlowState["outcome"];
  retryUsed?: boolean;
  releaseMic?: boolean;
  endSession?: boolean;
  clearPrivate?: boolean;
};

// Every legal transition. Any stage/event pair missing here must leave the state untouched.
const legal: Record<FlowStage, Partial<Record<string, Expected>>> = {
  lobby: {
    pickPerson: { stage: "briefing", clearPrivate: true },
    pickSomeoneNew: { stage: "briefing", clearPrivate: true },
  },
  briefing: {
    // Re-picking on the same screen is legal; it clears private state but moves nothing.
    pickPerson: { stage: "briefing", changed: false, clearPrivate: true },
    pickSomeoneNew: { stage: "briefing", changed: false, clearPrivate: true },
    draftReady: { stage: "meet" },
    back: { stage: "lobby" },
  },
  meet: {
    toGreenRoom: { stage: "green", micHeld: true },
    back: { stage: "briefing" },
  },
  green: {
    // The microphone is handed to the call provider, not released.
    ready: { stage: "ringing", micHeld: true },
    back: { stage: "meet", micHeld: false, releaseMic: true },
  },
  ringing: {
    sessionAccepted: { stage: "ringing", changed: false, sessionActive: true },
    videoPlaying: { stage: "call", micHeld: true, sessionActive: true },
    ended: { stage: "recap", outcome: "ended", micHeld: false, sessionActive: false, releaseMic: true, endSession: true },
    interrupted: { stage: "recap", outcome: "interrupted", releaseMic: true, endSession: true },
    back: { stage: "meet", outcome: "none", micHeld: false, sessionActive: false, releaseMic: true, endSession: true },
  },
  call: {
    ended: { stage: "recap", outcome: "ended", micHeld: false, sessionActive: false, releaseMic: true, endSession: true },
    interrupted: { stage: "recap", outcome: "interrupted", releaseMic: true, endSession: true },
  },
  recap: {
    retryAccepted: { stage: "retry-ringing", outcome: "none", micHeld: true, retryUsed: true },
    back: { stage: "meet", outcome: "none" },
  },
  "retry-ringing": {
    sessionAccepted: { stage: "retry-ringing", changed: false, sessionActive: true },
    videoPlaying: { stage: "retry-call" },
    ended: { stage: "retry-recap", outcome: "ended", releaseMic: true, endSession: true },
    interrupted: { stage: "retry-recap", outcome: "interrupted", releaseMic: true, endSession: true },
    back: { stage: "recap", outcome: "ended", releaseMic: true, endSession: true },
  },
  "retry-call": {
    ended: { stage: "retry-recap", outcome: "ended", releaseMic: true, endSession: true },
    interrupted: { stage: "retry-recap", outcome: "interrupted", releaseMic: true, endSession: true },
  },
  "retry-recap": {
    back: { stage: "meet", outcome: "none" },
  },
};

describe("practice flow stages", () => {
  it("walks the hero path from the lobby to the recap", () => {
    expect(path.lobby().stage).toBe("lobby");
    expect(path.briefing().stage).toBe("briefing");
    expect(path.meet().stage).toBe("meet");
    expect(path.green()).toMatchObject({ stage: "green", micHeld: true, sessionActive: false });
    expect(path.ringing()).toMatchObject({ stage: "ringing", micHeld: true, sessionActive: true });
    expect(path.call()).toMatchObject({ stage: "call", micHeld: true, sessionActive: true });
    expect(path.recap()).toMatchObject({ stage: "recap", outcome: "ended", micHeld: false, sessionActive: false });
  });

  it("walks the retry path and offers it only once", () => {
    expect(path["retry-ringing"]()).toMatchObject({ stage: "retry-ringing", micHeld: true, retryUsed: true });
    expect(path["retry-call"]().stage).toBe("retry-call");
    expect(path["retry-recap"]()).toMatchObject({ stage: "retry-recap", outcome: "ended", retryUsed: true });
    const again = reduceFlow(path["retry-recap"](), { type: "retryAccepted" });
    expect(again.changed).toBe(false);
  });

  for (const stage of stages) {
    describe(`from ${stage}`, () => {
      for (const event of stageEvents) {
        const expected = legal[stage][key(event)];
        it(`${expected ? "handles" : "ignores"} ${key(event)}`, () => {
          const before = path[stage]();
          const snapshot = { ...before };
          const result = reduceFlow(before, event);
          expect(before).toEqual(snapshot);
          if (!expected) {
            expect(result.state).toBe(before);
            expect(result.changed).toBe(false);
            expect(result.teardown).toEqual({ releaseMic: false, endSession: false });
            expect(result.clearPrivate).toBe(false);
            return;
          }
          expect(result.state.stage).toBe(expected.stage);
          expect(result.changed).toBe(expected.changed ?? true);
          expect(result.teardown).toEqual({ releaseMic: expected.releaseMic ?? false, endSession: expected.endSession ?? false });
          expect(result.clearPrivate).toBe(expected.clearPrivate ?? false);
          if (expected.micHeld !== undefined) expect(result.state.micHeld).toBe(expected.micHeld);
          if (expected.sessionActive !== undefined) expect(result.state.sessionActive).toBe(expected.sessionActive);
          if (expected.outcome !== undefined) expect(result.state.outcome).toBe(expected.outcome);
          if (expected.retryUsed !== undefined) expect(result.state.retryUsed).toBe(expected.retryUsed);
        });
      }
    });
  }

  it("ignores ready from the lobby", () => {
    const result = reduceFlow(initialFlowState, { type: "ready" });
    expect(result.state).toBe(initialFlowState);
    expect(result.changed).toBe(false);
  });

  it("ends the ring that has no session yet without an end request", () => {
    const ringingWithoutSession = walk(path.green(), { type: "ready" });
    expect(ringingWithoutSession.sessionActive).toBe(false);
    const cancelled = reduceFlow(ringingWithoutSession, { type: "back" });
    expect(cancelled.teardown).toEqual({ releaseMic: true, endSession: false });
    expect(cancelled.state.stage).toBe("meet");
  });

  it("stops calling a recap interrupted once the user ends it", () => {
    const interrupted = walk(path.call(), { type: "ended", interrupted: true });
    expect(interrupted.outcome).toBe("interrupted");
    const ended = reduceFlow(interrupted, { type: "ended" });
    expect(ended.changed).toBe(true);
    expect(ended.state).toMatchObject({ stage: "recap", outcome: "ended" });
    // A second End does nothing.
    expect(reduceFlow(ended.state, { type: "ended" }).changed).toBe(false);
    // An interruption cannot re-open a recap.
    expect(reduceFlow(ended.state, { type: "ended", interrupted: true }).changed).toBe(false);
  });

  it("starts a new sitting when the user picks someone again", () => {
    const used = walk(path["retry-recap"](), { type: "back" }, { type: "back" }, { type: "back" });
    expect(used.stage).toBe("lobby");
    expect(used.retryUsed).toBe(true);
    const fresh = reduceFlow(used, { type: "pickSomeoneNew" });
    expect(fresh.state).toMatchObject({ stage: "briefing", retryUsed: false, outcome: "none" });
  });
});

describe("teardown", () => {
  it("releases the microphone when the user leaves the green room", () => {
    expect(reduceFlow(path.green(), { type: "back" }).teardown).toEqual({ releaseMic: true, endSession: false });
  });

  it("releases the microphone and ends the session when the ring is cancelled", () => {
    expect(reduceFlow(path.ringing(), { type: "back" }).teardown).toEqual({ releaseMic: true, endSession: true });
  });

  it("releases the microphone and ends the session when the call ends", () => {
    expect(reduceFlow(path.call(), { type: "ended" }).teardown).toEqual({ releaseMic: true, endSession: true });
    expect(reduceFlow(path["retry-call"](), { type: "ended" }).teardown).toEqual({ releaseMic: true, endSession: true });
  });

  for (const stage of stages) {
    it(`releases what ${stage} holds on sign-out and on auth loss`, () => {
      const before = path[stage]();
      for (const type of ["signOut", "authLost"] as const) {
        const result = reduceFlow(before, { type });
        expect(result.state).toEqual(initialFlowState);
        expect(result.teardown).toEqual({ releaseMic: before.micHeld, endSession: before.sessionActive });
        expect(result.clearPrivate).toBe(true);
      }
    });

    it(`releases what ${stage} holds on page hide`, () => {
      const before = path[stage]();
      const result = reduceFlow(before, { type: "pageHide" });
      expect(result.teardown).toEqual({ releaseMic: before.micHeld, endSession: before.sessionActive });
      expect(result.clearPrivate).toBe(true);
      expect(result.state.micHeld).toBe(false);
      expect(result.state.sessionActive).toBe(false);
    });
  }

  it("leaves a live call on the recap when the page hides", () => {
    expect(reduceFlow(path.ringing(), { type: "pageHide" }).state).toMatchObject({ stage: "recap", outcome: "ended" });
    expect(reduceFlow(path.call(), { type: "pageHide" }).state).toMatchObject({ stage: "recap", outcome: "ended" });
    expect(reduceFlow(path["retry-call"](), { type: "pageHide" }).state).toMatchObject({ stage: "retry-recap", outcome: "ended" });
  });

  it("leaves a setup stage where it is when the page hides", () => {
    for (const stage of ["lobby", "briefing", "meet", "recap", "retry-recap"] as const) {
      expect(reduceFlow(path[stage](), { type: "pageHide" }).state.stage).toBe(stage);
    }
  });
});

describe("call phase", () => {
  it("maps stages to the call screen's phase", () => {
    expect(callPhase(path.lobby())).toBeNull();
    expect(callPhase(path.briefing())).toBeNull();
    expect(callPhase(path.meet())).toBeNull();
    expect(callPhase(path.green())).toBeNull();
    expect(callPhase(path.ringing())).toBe("connecting");
    expect(callPhase(path.call())).toBe("live");
    expect(callPhase(path.recap())).toBe("ended");
    expect(callPhase(walk(path.call(), { type: "ended", interrupted: true }))).toBe("interrupted");
    expect(callPhase(path["retry-ringing"]())).toBe("connecting");
    expect(callPhase(path["retry-call"]())).toBe("live");
    expect(callPhase(path["retry-recap"]())).toBe("ended");
  });

  it("starts the workspace on a setup stage", () => {
    expect(callPhase(createFlowState("briefing"))).toBeNull();
  });
});

describe("private state", () => {
  const filled = { goal: "Ask to move one project", hardMomentLine: "I still need to drop one thing", prediction: "That I'm not committed", likelihoodBefore: 80, likelihoodAfter: 30 };

  beforeEach(() => { clearPrivateState(); });

  it("holds the goal, the hard-moment line, the prediction and both likelihoods", () => {
    updatePrivateState(filled);
    expect(readPrivateState()).toEqual(filled);
  });

  it("clears every field at once", () => {
    updatePrivateState(filled);
    clearPrivateState();
    expect(readPrivateState()).toEqual({ goal: "", hardMomentLine: "", prediction: "", likelihoodBefore: null, likelihoodAfter: null });
  });

  it("tells subscribers when it changes and when it clears", () => {
    let changes = 0;
    const stop = subscribePrivateState(() => { changes += 1; });
    updatePrivateState({ goal: "Ask to move one project" });
    updatePrivateState({ goal: "Ask to move one project" });
    clearPrivateState();
    clearPrivateState();
    stop();
    updatePrivateState({ goal: "ignored" });
    expect(changes).toBe(2);
  });

  // docs/30 step 1: a new setup, sign-out, auth loss and page hide all drop it.
  const clearing: FlowEventType[] = ["pickPerson", "pickSomeoneNew", "signOut", "authLost", "pageHide"];

  for (const type of clearing) {
    it(`is cleared on ${type}`, () => {
      // Every stage the event is legal on asks for the clear.
      const asked = stages.filter((stage) => reduceFlow(path[stage](), { type } as FlowEvent).clearPrivate);
      expect(asked.length).toBeGreaterThan(0);
      for (const stage of asked) {
        updatePrivateState(filled);
        const transition = reduceFlow(path[stage](), { type } as FlowEvent);
        expect(transition.clearPrivate).toBe(true);
        // The reducer stays pure: the holder only empties when the shell honors the flag.
        expect(readPrivateState().goal).toBe(filled.goal);
        clearPrivateState();
        expect(readPrivateState().goal).toBe("");
      }
    });
  }

  it("is never asked to clear on a stage move inside a sitting", () => {
    for (const event of [{ type: "draftReady" }, { type: "toGreenRoom" }, { type: "ready" }, { type: "sessionAccepted" }, { type: "videoPlaying" }, { type: "ended" }, { type: "retryAccepted" }, { type: "back" }] as FlowEvent[]) {
      for (const stage of stages) {
        expect(reduceFlow(path[stage](), event).clearPrivate).toBe(false);
      }
    }
  });
});
