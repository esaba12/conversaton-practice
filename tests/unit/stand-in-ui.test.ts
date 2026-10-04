import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { initialStandInSitting, standInOffer } from "@/lib/practice/stand-in-sitting";

const classNames = vi.hoisted(() => ({ default: new Proxy({}, { get: (_target: object, prop: string | symbol) => String(prop) }) }));
vi.mock("@/components/practice/stand-in.module.css", () => classNames);
vi.mock("@/components/ui/primary-button.module.css", () => classNames);
vi.mock("@/components/ui/private-card.module.css", () => classNames);

import { StandInCall, standInCaptionLines } from "@/components/practice/stand-in-call";
import { StandInOfferButtons } from "@/components/practice/stand-in-offer";
import { StandInYourTurn } from "@/components/practice/stand-in-your-turn";

const NAME = "Jordan";
const GOAL = "GOAL-MARKER move the Atlas report to next sprint";
const FEAR = "FEAR-MARKER that I am not committed";
const noop = () => undefined;
const forbidden = ["therapy", "therapist", "Therapy", "Therapist"];

function offerMarkup(options: { goal?: string; hasPracticed?: boolean }) {
  const offer = standInOffer({ counterpartName: NAME, goal: options.goal ?? GOAL, hasPracticed: options.hasPracticed ?? false, sitting: initialStandInSitting });
  return renderToStaticMarkup(createElement(StandInOfferButtons, { counterpartName: NAME, offer, onShowMeFirst: noop, onSkip: noop }));
}

describe("the offer on the Meet card", () => {
  it("shows both choices and says where the line goes", () => {
    const html = offerMarkup({});
    expect(html).toContain("Show me first");
    expect(html).toContain("Skip to my turn");
    expect(html).toContain("See it once, then it’s your turn.");
    expect(html).toContain("To play you, the stand-in gets your line. Jordan never does.");
  });

  it("disables the stand-in with its reason when no line is written", () => {
    const html = offerMarkup({ goal: "" });
    expect(html).toContain("Add what you want to say first.");
    expect(html).toContain('aria-disabled="true"');
  });

  it("leads with the call once Jordan has an ended practice", () => {
    const html = offerMarkup({ hasPracticed: true });
    expect(html.indexOf("Call Jordan")).toBeLessThan(html.indexOf("Show me first"));
    expect(html).not.toContain("See it once");
  });
});

describe("the stand-in call", () => {
  const html = renderToStaticMarkup(createElement(StandInCall, {
    counterpartName: NAME, phase: "live", muted: false, cameraEnabled: false, elapsedSeconds: 42, durationSeconds: 180,
    remoteMedia: null, fear: FEAR, onMuteToggle: noop, onCameraToggle: noop, onEnd: noop,
    turns: [{ speaker: "counterpart", text: "stand-in line" }, { speaker: "user", text: "pushback line" }],
  }));

  it("says who is playing whom and labels the stand-in", () => {
    expect(html).toContain("You’re playing Jordan");
    expect(html).toContain("Stand-in for you · Fictional AI");
    expect(html).toContain("Push back the way you’re afraid Jordan will.");
    expect(html).toContain(FEAR);
  });

  it("shows no goal pill, no goal light and no score", () => {
    expect(html).not.toContain(GOAL);
    expect(html).not.toContain("Your intention");
    expect(html).not.toContain("goal");
    expect(html).not.toMatch(/score|grade|confidence meter/i);
  });

  it("keeps End reachable and says its turns are not kept", () => {
    expect(html).toContain("End the stand-in call");
    expect(html).toContain("these turns are dropped when you end, and no reflection runs on them");
  });

  it("labels both chairs in the captions", () => {
    expect(standInCaptionLines(true, [{ speaker: "counterpart", text: "a" }, { speaker: "user", text: "b" }], NAME)).toEqual([
      { key: "0-counterpart", speaker: "Stand-in", text: "a" },
      { key: "1-user", speaker: "You (as Jordan)", text: "b" },
    ]);
    expect(standInCaptionLines(false, [{ speaker: "user", text: "b" }], NAME)).toEqual([]);
    expect(standInCaptionLines(true, [{ speaker: "user", text: "   " }], NAME)).toEqual([]);
    // Collapsed by default: nothing said is on screen until the user opens it.
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("pushback line");
  });

  it("holds no media of its own when the call has ended", () => {
    const ended = renderToStaticMarkup(createElement(StandInCall, {
      counterpartName: NAME, phase: "ended", muted: false, cameraEnabled: true, elapsedSeconds: 96, durationSeconds: 180,
      remoteMedia: createElement("video"), localPreview: createElement("video"), onMuteToggle: noop, onCameraToggle: noop, onEnd: noop,
    }));
    expect(ended).not.toContain("<video");
    expect(ended).toContain("Ended");
  });
});

describe("the Your-turn card", () => {
  const html = renderToStaticMarkup(createElement(StandInYourTurn, {
    counterpartName: NAME, goal: GOAL, hardMomentLine: "", note: "",
    onGoalChange: noop, onHardMomentLineChange: noop, onNoteChange: noop, onCall: noop,
  }));

  it("swaps the seats back and offers the edit and the note", () => {
    expect(html).toContain("Your turn. Now you’re you, and Jordan is Jordan.");
    expect(html).toContain("Want to change your line?");
    expect(html).toContain("What did you notice?");
    expect(html).toContain("0/200");
    expect(html).toContain("Call Jordan");
  });

  it("holds no microphone, camera or media and says the line stays private", () => {
    expect(html).not.toContain("<video");
    expect(html).toContain("Your microphone and camera are released until you start the call.");
    expect(html).toContain("Only you see this");
    expect(html).toContain("Jordan never does.");
  });
});

describe("copy rules", () => {
  it("never calls this therapy", () => {
    const markup = [
      offerMarkup({}),
      renderToStaticMarkup(createElement(StandInCall, { counterpartName: NAME, phase: "live", muted: true, cameraEnabled: false, elapsedSeconds: 1, durationSeconds: 180, remoteMedia: null, onMuteToggle: noop, onCameraToggle: noop, onEnd: noop })),
      renderToStaticMarkup(createElement(StandInYourTurn, { counterpartName: NAME, goal: GOAL, hardMomentLine: "", note: "", onGoalChange: noop, onHardMomentLineChange: noop, onNoteChange: noop, onCall: noop })),
    ].join(" ");
    for (const word of forbidden) expect(markup).not.toContain(word);
    expect(markup).not.toMatch(/\bpause\b/i);
  });
});
