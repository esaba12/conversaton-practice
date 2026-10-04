import { describe, expect, it } from "vitest";
import { createFlowState, reduceFlow, type FlowState } from "@/lib/practice/flow";
import {
  MAX_CALLS_PER_SITTING, STAND_IN_NO_GOAL_REASON, beginCall, beginRetry, beginStandIn, canRetry, canStartCall,
  endStandIn, initialStandInSitting, standInOffer, yourTurnTitle,
} from "@/lib/practice/stand-in-sitting";

// W10 acceptance 1, 5, 6 and 7.
const base = { counterpartName: "Jordan", goal: "Move the Atlas report to next sprint.", sitting: initialStandInSitting };

describe("the offer (acceptance 1)", () => {
  it("is the primary button the first time with this counterpart", () => {
    const offer = standInOffer({ ...base, hasPracticed: false });
    expect(offer).toMatchObject({ shown: true, emphasis: "primary", disabled: false, reason: "", skipLabel: "Skip to my turn" });
    expect(offer.helper).toBe("See it once, then it’s your turn.");
    expect(offer.privacyNote).toBe("To play you, the stand-in gets your line. Jordan never does.");
  });

  it("becomes secondary once that counterpart has an ended practice", () => {
    const offer = standInOffer({ ...base, hasPracticed: true });
    expect(offer).toMatchObject({ shown: true, emphasis: "secondary", helper: "", skipLabel: "Call Jordan" });
  });

  it("is disabled with its reason when there is no line yet", () => {
    for (const goal of ["", "   "]) {
      expect(standInOffer({ ...base, goal, hasPracticed: false })).toMatchObject({ disabled: true, reason: STAND_IN_NO_GOAL_REASON });
    }
    expect(standInOffer({ ...base, hasPracticed: false, unavailableReason: "Show me first is not available yet." }))
      .toMatchObject({ disabled: true, reason: "Show me first is not available yet." });
  });

  it("is offered once per sitting (acceptance 6)", () => {
    const after = beginStandIn(initialStandInSitting);
    expect(after).toMatchObject({ standInUsed: true, callsUsed: 1 });
    expect(standInOffer({ ...base, hasPracticed: false, sitting: after }).shown).toBe(false);
    // Re-entering is a no-op, and a sitting that already made a call never gets the offer.
    expect(beginStandIn(after)).toBe(after);
    expect(standInOffer({ ...base, hasPracticed: false, sitting: beginCall(initialStandInSitting) }).shown).toBe(false);
  });
});

describe("the bounded sitting (acceptance 6)", () => {
  it("allows stand-in, the user's call and at most one retry", () => {
    const standIn = beginStandIn(initialStandInSitting);
    const yourTurn = beginCall(standIn);
    expect(canRetry(yourTurn)).toBe(true);
    const retry = beginRetry(yourTurn);
    expect(retry).toMatchObject({ standInUsed: true, callsUsed: MAX_CALLS_PER_SITTING, retryUsed: true });
    expect(canRetry(retry)).toBe(false);
    expect(beginRetry(retry)).toBe(retry);
    expect(canStartCall(retry)).toBe(false);
    expect(beginCall(retry)).toBe(retry);
  });

  it("still caps a skipped sitting at three calls and one retry", () => {
    const yourTurn = beginCall(initialStandInSitting);
    const retry = beginRetry(yourTurn);
    expect(retry.callsUsed).toBe(2);
    expect(canRetry(retry)).toBe(false);
    expect(beginCall(retry).callsUsed).toBe(3);
    expect(canStartCall(beginCall(retry))).toBe(false);
  });

  it("names the Your-turn card without a goal pill or a score", () => {
    expect(yourTurnTitle("Jordan")).toBe("Your turn. Now you’re you, and Jordan is Jordan.");
  });
});

describe("ending the stand-in call (acceptance 5)", () => {
  it("drops its turns and never runs reflection on them", () => {
    const sitting = beginStandIn(initialStandInSitting);
    const result = endStandIn(sitting);
    expect(result.turns).toEqual([]);
    expect(result.runReflection).toBe(false);
    expect(result.sitting).toBe(sitting);
  });
});

describe("teardown from the stand-in call (acceptance 7)", () => {
  // The stand-in reuses the existing ringing/call stages, so the same reducer owns its teardown.
  const live: FlowState = { ...createFlowState("call"), micHeld: true, sessionActive: true };

  it("releases the microphone, camera and session on End, sign-out and page hide", () => {
    for (const event of [{ type: "ended" } as const, { type: "signOut" } as const, { type: "pageHide" } as const, { type: "authLost" } as const]) {
      const transition = reduceFlow(live, event);
      expect(transition.teardown).toEqual({ releaseMic: true, endSession: true });
      expect(transition.state.micHeld).toBe(false);
      expect(transition.state.sessionActive).toBe(false);
    }
  });

  it("holds no microphone or session on the Your-turn card, so leaving it releases nothing", () => {
    const yourTurn = reduceFlow(live, { type: "ended" }).state;
    expect(yourTurn).toMatchObject({ stage: "recap", micHeld: false, sessionActive: false });
    for (const event of [{ type: "signOut" } as const, { type: "pageHide" } as const]) {
      expect(reduceFlow(yourTurn, event).teardown).toEqual({ releaseMic: false, endSession: false });
    }
  });

  it("clears the user's private state on sign-out and page hide", () => {
    expect(reduceFlow(live, { type: "signOut" }).clearPrivate).toBe(true);
    expect(reduceFlow(live, { type: "pageHide" }).clearPrivate).toBe(true);
  });
});
