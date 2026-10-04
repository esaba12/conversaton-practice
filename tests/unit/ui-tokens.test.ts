import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { durations, motionTransition, reducedFade, springs } from "@/lib/ui/motion";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

describe("docs/33 tokens in globals.css", () => {
  const existing = ["background", "surface", "ink", "muted", "sage", "border", "focus"];
  const added = [
    "surface-sunk", "sage-soft", "clay", "honey", "danger", "night", "night-raised", "night-ink", "night-muted", "focus-night",
    "shadow-1", "shadow-2", "shadow-3", "r-sm", "r-md", "r-lg", "r-pill", "t-quick", "t-base", "t-calm", "t-breath",
    "font-serif", "text-12", "text-14", "text-16", "text-18", "text-22", "text-28", "text-40", "text-56",
    "leading-body", "leading-display", "tracking-display",
  ];

  it.each([...existing, ...added])("defines --%s", (name) => {
    expect(css).toMatch(new RegExp(`--${name}:`));
  });

  it("keeps the documented values", () => {
    expect(css).toContain("--r-sm:10px");
    expect(css).toContain("--r-lg:28px");
    expect(css).toContain("--t-quick:150ms cubic-bezier(.2,0,0,1)");
    expect(css).toContain("--t-calm:520ms cubic-bezier(.32,.72,0,1)");
    expect(css).toContain("--shadow-2:0 12px 32px -12px rgb(52 90 73 / .22)");
  });

  it("disables transitions and animations under reduced motion, allowing only short fades", () => {
    const block = css.slice(css.indexOf("@media(prefers-reduced-motion:reduce){\n"));
    expect(block).toMatch(/transition-duration:\.01ms!important/);
    expect(block).toMatch(/animation-duration:\.01ms!important/);
    expect(block).toMatch(/\[data-reduced-fade\][^{]*\{transition-property:opacity!important;transition-duration:150ms!important\}/);
  });
});

describe("motion presets", () => {
  it("mirrors the CSS duration tokens", () => {
    expect(css).toContain(`--t-quick:${durations.quick * 1000}ms`);
    expect(css).toContain(`--t-base:${durations.base * 1000}ms`);
    expect(css).toContain(`--t-calm:${durations.calm * 1000}ms`);
  });

  it("uses springs normally and a fade of at most 150 ms under reduced motion", () => {
    for (const name of Object.keys(springs) as (keyof typeof springs)[]) {
      expect(motionTransition(name, false)).toMatchObject({ type: "spring" });
      expect(motionTransition(name, true)).toBe(reducedFade);
    }
    expect(reducedFade.duration).toBeLessThanOrEqual(0.15);
  });
});
