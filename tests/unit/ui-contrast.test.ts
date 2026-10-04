import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

function token(name: string): string {
  if (name.startsWith("#")) return name;
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --${name} not found as a 6-digit hex`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pairings marked "verify" in docs/33 §2, plus the pairings the 0A primitives use. min: 4.5 text, 3 large text / non-text (focus rings). */
const pairings: { fg: string; bg: string; use: string; min: number }[] = [
  { fg: "muted", bg: "background", use: "Secondary text on room background (verify)", min: 4.5 },
  { fg: "#ffffff", bg: "danger", use: "White text on End/destructive (verify; reference only, pure white is not used)", min: 4.5 },
  { fg: "surface", bg: "danger", use: "Light text on End/destructive using --surface", min: 4.5 },
  { fg: "night-ink", bg: "danger", use: "Night text on End button in call mode (verify)", min: 4.5 },
  { fg: "night-muted", bg: "night", use: "Secondary text on night (verify)", min: 4.5 },
  { fg: "focus", bg: "background", use: "Focus ring on room background (verify, non-text)", min: 3 },
  { fg: "focus", bg: "surface", use: "Focus ring on surface (verify, non-text)", min: 3 },
  { fg: "focus-night", bg: "night", use: "Focus ring on night (verify, non-text)", min: 3 },
  { fg: "focus", bg: "surface-sunk", use: "Focus ring around a disabled control or Private card (non-text)", min: 3 },
  { fg: "muted", bg: "surface", use: "Secondary text on cards", min: 4.5 },
  { fg: "muted", bg: "surface-sunk", use: "Disabled button/chip text and Private card title", min: 4.5 },
  { fg: "ink", bg: "surface-sunk", use: "Private card body", min: 4.5 },
  { fg: "surface", bg: "sage", use: "Primary button label", min: 4.5 },
  { fg: "sage", bg: "sage-soft", use: "Selected chip label", min: 4.5 },
  { fg: "night-ink", bg: "clay", use: "Portrait monogram, clay end of gradient (large text)", min: 3 },
  { fg: "night-ink", bg: "sage", use: "Portrait monogram, sage end of gradient", min: 3 },
];

describe("docs/33 contrast pairings", () => {
  const rows = pairings.map((p) => ({ ...p, ratio: contrast(token(p.fg), token(p.bg)) }));

  it("prints the measured table", () => {
    console.log(rows.map((r) => `| \`${r.fg.startsWith("#") ? r.fg : `--${r.fg}`}\` on \`--${r.bg}\` | ${r.ratio.toFixed(2)}:1 | ${r.min}:1 | ${r.ratio >= r.min ? "pass" : "FAIL"} | ${r.use} |`).join("\n"));
    expect(rows).toHaveLength(pairings.length);
  });

  it("matches the WCAG reference values", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it.each(rows)("$fg on $bg meets $min:1", ({ ratio, min }) => {
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
