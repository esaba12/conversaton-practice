import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Chip } from "@/components/ui/chip";
import { disabledReasonText, fallbackDisabledReason, monogram, portraitAlt } from "@/components/ui/labels";
import { Portrait } from "@/components/ui/portrait";
import { PrimaryButton } from "@/components/ui/primary-button";
import { PrivateCard } from "@/components/ui/private-card";

describe("monogram", () => {
  it.each([
    ["Jordan", "J"],
    ["  alex rivera ", "AR"],
    ["Mary Ann Ellis", "ME"],
    ["Ólafur", "Ó"],
    ["", "?"],
    ["   ", "?"],
  ])("%j → %s", (name, expected) => {
    expect(monogram(name)).toBe(expected);
  });

  it("keeps astral characters whole", () => {
    expect(monogram("𝒜da Byron")).toBe("𝒜B");
  });
});

describe("portraitAlt", () => {
  it("names the person as a fictional AI character", () => {
    expect(portraitAlt("Jordan")).toBe("Jordan, fictional AI character");
    expect(portraitAlt(" ")).toBe("Unnamed, fictional AI character");
  });
});

describe("disabledReasonText", () => {
  it("is empty unless disabled, and never blank when disabled", () => {
    expect(disabledReasonText(false, "why")).toBeUndefined();
    expect(disabledReasonText(true, "  Allow the microphone first. ")).toBe("Allow the microphone first.");
    expect(disabledReasonText(true, "   ")).toBe(fallbackDisabledReason);
  });
});

describe("Portrait markup", () => {
  it("renders the monogram fallback as one labelled image", () => {
    const html = renderToStaticMarkup(createElement(Portrait, { name: "Jordan", size: 120 }));
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Jordan, fictional AI character"');
    expect(html).toMatch(/aria-hidden="true"[^>]*>J</);
  });

  it("uses the image with the same alt text when a source is given", () => {
    const html = renderToStaticMarkup(createElement(Portrait, { name: "Alex", size: 40, src: "/face.jpg" }));
    expect(html).toContain('alt="Alex, fictional AI character"');
    expect(html).toContain('width="40"');
    expect(html).not.toContain('role="img"');
  });
});

describe("PrimaryButton markup", () => {
  it("names the action and has no reason when enabled", () => {
    const html = renderToStaticMarkup(createElement(PrimaryButton, { label: "Call Jordan" }));
    expect(html).toContain(">Call Jordan<");
    expect(html).not.toContain("aria-disabled");
    expect(html).not.toContain("aria-describedby");
  });

  it("stays focusable when disabled and points at a visible reason", () => {
    const html = renderToStaticMarkup(createElement(PrimaryButton, { id: "call", label: "Call Jordan", disabled: true, disabledReason: "Allow the microphone first." }));
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/\sdisabled(=|\s|>)/);
    expect(html).toContain('aria-describedby="call-reason"');
    expect(html).toContain('id="call-reason"');
    expect(html).toContain("Allow the microphone first.");
  });

  it("marks loading as busy and shows the loading label", () => {
    const html = renderToStaticMarkup(createElement(PrimaryButton, { label: "Call Jordan", loading: true, loadingLabel: "Calling Jordan…" }));
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Calling Jordan…");
  });
});

describe("Chip markup", () => {
  it("is a toggle button reporting its pressed state", () => {
    const off = renderToStaticMarkup(createElement(Chip, { label: "Stay calm", selected: false }));
    const on = renderToStaticMarkup(createElement(Chip, { label: "Stay calm", selected: true }));
    expect(off).toContain('type="button"');
    expect(off).toContain('aria-pressed="false"');
    expect(on).toContain('aria-pressed="true"');
    expect(on).toContain("lucide-check");
    expect(off).not.toContain("lucide-check");
  });

  it("shows a reason when disabled", () => {
    const html = renderToStaticMarkup(createElement(Chip, { id: "calm", label: "Stay calm", selected: false, disabled: true, disabledReason: "Pick up to two skills." }));
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-describedby="calm-reason"');
    expect(html).toContain("Pick up to two skills.");
  });
});

describe("PrivateCard markup", () => {
  it("is a labelled region titled for the owner only", () => {
    const html = renderToStaticMarkup(createElement(PrivateCard, { note: "Jordan never sees this.", children: "Goal" }));
    expect(html).toMatch(/<section[^>]*aria-labelledby="([^"]+)"/);
    const id = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(html).toContain(`id="${id}"`);
    expect(html).toContain("Only you see this");
    expect(html).toContain("lucide-lock");
  });
});
