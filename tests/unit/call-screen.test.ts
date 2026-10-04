import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const cssProxy = vi.hoisted(() => ({ default: new Proxy({}, { get: (_target, prop) => String(prop) }) }));
vi.mock("@/components/practice/call.module.css", () => cssProxy);
vi.mock("@/components/presentation/captions.module.css", () => cssProxy);
vi.mock("@/components/ui/portrait.module.css", () => cssProxy);

import { captionTail, currentCaption } from "@/components/presentation/captions";
import { CallScreen, type CallScreenProps } from "@/components/practice/call-screen";
import { nextCorner } from "@/components/practice/call-self-view";
import { callShortcuts, shortcutFor } from "@/components/practice/call-shortcuts";
import { initialLiveCallState } from "@/lib/media/interactions";
import { createFlowState, reduceFlow } from "@/lib/practice/flow";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const noop = () => undefined;

function render(overrides: Partial<CallScreenProps> = {}) {
  const props: CallScreenProps = {
    counterpartName: "Jordan", phase: "live", muted: false, cameraEnabled: false, elapsedSeconds: 10, durationSeconds: 180,
    remoteMedia: null, live: initialLiveCallState, turns: [], onMuteToggle: noop, onCameraToggle: noop, onEnd: noop, onInteraction: () => true, layout: "contained", ...overrides,
  };
  return renderToStaticMarkup(createElement(CallScreen, props));
}

describe("call keyboard shortcuts (U4)", () => {
  const key = (k: string, extra: Record<string, unknown> = {}) => shortcutFor({ key: k, ...extra });
  it("maps M, C, T, W, Esc and ?", () => {
    expect([key("m"), key("M"), key("c"), key("t"), key("w"), key("Escape"), key("?")]).toEqual(["mute", "mute", "captions", "type", "wait", "end", "shortcuts"]);
    expect(key("x")).toBeNull();
    expect(key("Enter")).toBeNull();
  });

  it("never fires while typing, composing, or with a modifier", () => {
    expect(key("m", { target: { tagName: "INPUT" } })).toBeNull();
    expect(key("m", { target: { tagName: "textarea" } })).toBeNull();
    expect(key("m", { target: { tagName: "SELECT" } })).toBeNull();
    expect(key("m", { target: { tagName: "DIV", isContentEditable: true } })).toBeNull();
    expect(key("m", { isComposing: true })).toBeNull();
    expect(key("m", { metaKey: true })).toBeNull();
    expect(key("c", { ctrlKey: true })).toBeNull();
    expect(key("w", { altKey: true })).toBeNull();
    expect(key("m", { defaultPrevented: true })).toBeNull();
    expect(key("m", { target: { tagName: "BUTTON" } })).toBe("mute");
  });

  it("lists every shortcut it handles, and the list is visible on the call screen", () => {
    expect(callShortcuts.map((shortcut) => shortcut.action)).toEqual(["mute", "captions", "type", "wait", "end", "shortcuts"]);
    const sheet = render({ preview: { sheet: "shortcuts" } });
    for (const shortcut of callShortcuts) expect(sheet).toContain(shortcut.label);
    expect(render()).toContain("Keyboard shortcuts");
  });
});

describe("self-view corners", () => {
  it("moves between corners with the arrow keys", () => {
    expect(nextCorner("top-right", "ArrowLeft")).toBe("top-left");
    expect(nextCorner("top-left", "ArrowDown")).toBe("bottom-left");
    expect(nextCorner("bottom-left", "ArrowRight")).toBe("bottom-right");
    expect(nextCorner("bottom-right", "ArrowUp")).toBe("top-right");
    expect(nextCorner("top-right", "ArrowRight")).toBe("top-right");
    expect(nextCorner("top-right", "Enter")).toBe("top-right");
  });
});

describe("caption overlay", () => {
  it("prefers the typed line, then the streaming caption, then the last finished turn", () => {
    const turns = [{ speaker: "counterpart" as const, text: "Earlier line." }];
    expect(currentCaption(null, null, [])).toBeNull();
    expect(currentCaption(null, null, turns)).toEqual({ speaker: "counterpart", text: "Earlier line.", streaming: false });
    expect(currentCaption(null, { speaker: "counterpart", text: "Partial", final: false }, turns)).toEqual({ speaker: "counterpart", text: "Partial", streaming: true });
    expect(currentCaption("Typed it", { speaker: "counterpart", text: "Partial", final: false }, turns)).toEqual({ speaker: "user", text: "Typed it", streaming: false });
  });

  it("keeps the newest words of a long caption", () => {
    const long = Array.from({ length: 60 }, (_, index) => `word${index}`).join(" ");
    const tail = captionTail(long);
    expect(tail.startsWith("…")).toBe(true);
    expect(tail.endsWith("word59")).toBe(true);
    expect(tail.length).toBeLessThanOrEqual(141);
    expect(captionTail("  short   line ")).toBe("short line");
  });

  it("renders the streaming caption with the speaker name on the live screen", () => {
    const html = render({ live: { ...initialLiveCallState, caption: { speaker: "counterpart", text: "streaming-fixture", final: false }, counterpartSpeaking: true } });
    expect(html).toContain("streaming-fixture");
    expect(html).toContain('data-speaking="true"');
    expect(render({ live: { ...initialLiveCallState, caption: { speaker: "counterpart", text: "streaming-fixture", final: false } }, preview: { captionsOff: true } })).not.toContain("streaming-fixture");
  });
});

describe("call screen", () => {
  it("live: the call bar has Mute, Camera, Captions, Type, Wait, Help and End, and never says pause", () => {
    const html = render();
    for (const name of ["Mute microphone", "Show my camera preview (only you see it)", "Hide captions", "Type instead of speaking", "Ask Jordan to wait", "Help and support", "End practice"]) {
      expect(html).toContain(`aria-label="${name}"`);
    }
    expect(html).toContain('aria-label="Call controls"');
    expect(html).toContain("Fictional AI");
    expect(html.toLowerCase()).not.toContain("pause");
    expect(render({ muted: true })).toContain("Muted. The call keeps going.");
  });

  it("faded controls stay in the markup and the accessibility tree; the Fictional AI pill is outside the fading region", () => {
    const html = render({ preview: { idle: true } });
    expect(html).toContain('data-idle="true"');
    expect(html).toContain('aria-label="End practice"');
    expect(html).toContain('aria-label="Help and support"');
    expect(html).not.toContain("aria-hidden=\"true\" class=\"fadeable");
    const pill = html.indexOf("Fictional AI");
    const fadeable = html.indexOf('class="fadeable"');
    expect(pill).toBeGreaterThan(-1);
    expect(pill).toBeLessThan(fadeable);
  });

  it("ringing: portrait, Calling…, Cancel, Help and the Fictional AI pill; no call bar yet", () => {
    const html = render({ phase: "connecting" });
    expect(html).toContain("Calling Jordan…");
    expect(html).toContain("Cancel call");
    expect(html).toContain("Help");
    expect(html).toContain("Fictional AI");
    expect(html).toContain("Jordan, fictional AI character");
    expect(html).not.toContain('aria-label="Call controls"');
  });

  it("shows the honey wrap-up cue in the last 30 seconds and the waiting note when asked to wait", () => {
    expect(render({ elapsedSeconds: 149 })).not.toContain("Wrapping up");
    const wrapping = render({ elapsedSeconds: 150 });
    expect(wrapping).toContain("Wrapping up");
    expect(wrapping).toContain('data-wrapping="true"');
    expect(render({ preview: { waiting: true } })).toContain("Jordan is waiting. The timer is still running.");
  });

  it("explains why typing and waiting are unavailable without a live interaction path", () => {
    const html = render({ onInteraction: undefined });
    expect(html).toContain("Typing and asking to wait aren’t available in this call.");
    expect(html).toContain('aria-disabled="true"');
  });

  it("caps the typed turn at 300 characters", () => {
    const html = render({ preview: { typeOpen: true, typedDraft: "hello" } });
    expect(html).toContain('maxLength="300"');
    expect(html).toContain("5/300");
  });

  it("Help offers the support exit and an End path", () => {
    const html = render({ preview: { sheet: "help" } });
    expect(html).toContain("911");
    expect(html).toContain("988");
    expect(html).toContain("End practice now");
  });

  it("labels test media visibly", () => {
    expect(render({ testMedia: true })).toContain("Test media — no live call");
  });
});

describe("ringing cancel teardown", () => {
  it("cancel (back) from ringing releases the microphone and ends the accepted session", () => {
    let state = createFlowState("green");
    state = { ...state, micHeld: true };
    state = reduceFlow(state, { type: "ready" }).state;
    const beforeAccept = reduceFlow(state, { type: "back" });
    expect(beforeAccept.teardown).toEqual({ releaseMic: true, endSession: false });
    state = reduceFlow(state, { type: "sessionAccepted" }).state;
    const cancel = reduceFlow(state, { type: "back" });
    expect(cancel.teardown).toEqual({ releaseMic: true, endSession: true });
    expect(cancel.state).toMatchObject({ stage: "meet", micHeld: false, sessionActive: false });
  });
});

describe("call copy", () => {
  it("never uses forbidden words in the call components", () => {
    const dir = join(ROOT, "components/practice");
    const files = readdirSync(dir).filter((name) => /^(call|ringing)/.test(name) && name.endsWith(".tsx"));
    expect(files.length).toBeGreaterThan(4);
    for (const file of files) {
      const text = readFileSync(join(dir, file), "utf8").toLowerCase();
      for (const word of ["therapy", "therapist", "anxiety", "treatment", "predicts", "score", "streak"]) expect(text, `${file}: ${word}`).not.toContain(word);
    }
  });
});
