import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PORTRAIT_NAME, PortraitTransition, stageGroup, transitionClasses } from "@/components/practice/transitions";
import type { FlowStage } from "@/lib/practice/flow";

const css = readFileSync(fileURLToPath(new URL("../../components/practice/transitions.css", import.meta.url)), "utf8");

describe("stage groups", () => {
  it("keeps ringing and call in one group so the call screen is never remounted mid-call", () => {
    expect(stageGroup("ringing")).toBe("call");
    expect(stageGroup("call")).toBe("call");
    expect(stageGroup("retry-ringing")).toBe("call");
    expect(stageGroup("retry-call")).toBe("call");
  });

  it("morphs between setup screens and the recap, with retry twins matching their originals", () => {
    const stages: FlowStage[] = ["lobby", "briefing", "meet", "green", "ringing", "call", "recap", "retry-ringing", "retry-call", "retry-recap"];
    expect(stages.map(stageGroup)).toEqual(["lobby", "briefing", "meet", "green", "call", "call", "recap", "call", "call", "recap"]);
  });
});

describe("reduced motion branch", () => {
  it("uses morph classes normally", () => {
    expect(transitionClasses(false)).toMatchObject({ stageEnter: "practice-stage-enter", stageExit: "practice-stage-exit", portraitShare: "practice-morph" });
  });

  it("drops the morph and uses only the fade when reduced", () => {
    const reduced = transitionClasses(true);
    expect(reduced.portraitShare).toBe("none");
    for (const value of [reduced.stageEnter, reduced.stageExit, reduced.fadeEnter, reduced.fadeExit]) expect(value).toBe("practice-fade");
  });

  it("limits every reduced-motion animation in the stylesheet to 150 ms and removes the morph", () => {
    const fade = css.match(/::view-transition-(?:old|new)\(\.practice-fade\)\s*\{[^}]*\}/g) ?? [];
    expect(fade).toHaveLength(2);
    for (const rule of fade) expect(rule).toMatch(/animation:\s*150ms linear/);
    const reducedBlock = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedBlock).toMatch(/practice-morph\)[^{]*\{\s*animation: none;/);
    const durations = [...reducedBlock.matchAll(/(\d+)ms/g)].map((match) => Number(match[1]));
    expect(durations.length).toBeGreaterThan(0);
    expect(Math.max(...durations)).toBeLessThanOrEqual(150);
  });
});

describe("portrait wrapper", () => {
  it("renders its child unchanged whether or not it is the active morph source", () => {
    const child = createElement("span", { id: "face" }, "J");
    expect(renderToStaticMarkup(createElement(PortraitTransition, { active: true, children: child }))).toBe('<span id="face">J</span>');
    expect(renderToStaticMarkup(createElement(PortraitTransition, { active: false, children: child }))).toBe('<span id="face">J</span>');
    expect(PORTRAIT_NAME).toBe("practice-portrait");
  });
});
