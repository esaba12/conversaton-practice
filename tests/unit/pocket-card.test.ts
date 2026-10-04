import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PocketCard } from "@/components/practice/pocket-card";
import { CARD_HEIGHT, CARD_WIDTH, drawPocketCard, pocketCardFileName, pocketCardPng, wrapText, type CardCanvas, type CardContext } from "@/lib/pocket-card/export";
import { buildPocketCard, pocketCardLines } from "@/lib/pocket-card/model";

const card = buildPocketCard({ name: "Maya", openWith: "Ask Maya to split the dishes.", hardMoment: "I'll slow down and say what I need.", practicedOn: "2026-10-04" });

function recordingContext() {
  const texts: string[] = [];
  const ctx: CardContext = {
    fillStyle: "", strokeStyle: "", lineWidth: 0, font: "", textBaseline: "alphabetic",
    fillRect: () => undefined, strokeRect: () => undefined,
    fillText: (text) => { texts.push(text); },
    measureText: (text) => ({ width: text.length * 10 }),
  };
  return { ctx, texts };
}
afterEach(() => vi.unstubAllGlobals());

describe("pocket card content (L2)", () => {
  it("works with no date and says when it was practiced", () => {
    const lines = pocketCardLines(card).map((line) => line.text);
    expect(lines).toEqual(["Maya", "Open with", "Ask Maya to split the dishes.", "If it gets hard", "I'll slow down and say what I need.", "Practiced on Oct 4, 2026"]);
    expect(lines.join(" ")).not.toMatch(/talking for real/i);
  });

  it("adds the day when there is one and omits empty sections", () => {
    const dated = pocketCardLines(buildPocketCard({ name: "Maya", openWith: "", plannedOn: "2026-10-09", practicedOn: "2026-10-04" })).map((line) => line.text);
    expect(dated).toEqual(["Maya", "Talking for real on Oct 9, 2026", "Practiced on Oct 4, 2026"]);
  });

  it("trims and caps what it is given", () => {
    const long = buildPocketCard({ name: "  Maya  ", openWith: `  ${"a".repeat(500)}  `, practicedOn: "2026-10-04" });
    expect(long.name).toBe("Maya"); expect(long.openWith).toHaveLength(200);
  });

  it("renders the quiet 'Add a day (optional)' link only when there is no day", () => {
    const without = renderToStaticMarkup(createElement(PocketCard, { name: "Maya", goal: "Ask for help.", practicedOn: "2026-10-04" }));
    expect(without).toContain("Add a day (optional)");
    expect(without).toContain("Save as picture"); expect(without).toContain("Print");
    const withDay = renderToStaticMarkup(createElement(PocketCard, { name: "Maya", goal: "Ask for help.", plannedOn: "2026-10-09", practicedOn: "2026-10-04" }));
    expect(withDay).not.toContain("Add a day (optional)"); expect(withDay).toContain("Talking for real on Oct 9, 2026");
  });
});

describe("pocket card PNG export (L2)", () => {
  it("wraps long text without losing words and splits a word wider than the line", () => {
    const measure = (value: string) => value.length * 10;
    expect(wrapText("one two three four", 90, measure)).toEqual(["one two", "three", "four"]);
    expect(wrapText("one two three four", 90, measure).join(" ")).toBe("one two three four");
    expect(wrapText("abcdefghijkl", 50, measure)).toEqual(["abcde", "fghij", "kl"]);
    expect(wrapText("   ", 50, measure)).toEqual([]);
  });

  it("draws every line of the card, with the practiced-on line last", () => {
    const { ctx, texts } = recordingContext();
    drawPocketCard(ctx, card);
    expect(texts.join(" ")).toContain("Maya");
    expect(texts.join(" ")).toContain("Ask Maya");
    expect(texts[texts.length - 1]).toBe("Practiced on Oct 4, 2026");
  });

  it("makes a PNG blob without any network request", async () => {
    const fetchSpy = vi.fn(); const xhrSpy = vi.fn(); const beacon = vi.fn();
    vi.stubGlobal("fetch", fetchSpy); vi.stubGlobal("XMLHttpRequest", xhrSpy); vi.stubGlobal("navigator", { sendBeacon: beacon });
    const { ctx } = recordingContext();
    const canvas: CardCanvas = {
      width: 0, height: 0, getContext: () => ctx,
      toBlob: (callback, type) => callback(new Blob(["png"], { type })),
    };
    const blob = await pocketCardPng(card, { createCanvas: () => canvas });
    expect(blob.type).toBe("image/png");
    expect([canvas.width, canvas.height]).toEqual([CARD_WIDTH, CARD_HEIGHT]);
    expect(fetchSpy).not.toHaveBeenCalled(); expect(xhrSpy).not.toHaveBeenCalled(); expect(beacon).not.toHaveBeenCalled();
  });

  it("fails clearly when the canvas cannot produce a picture", async () => {
    const { ctx } = recordingContext();
    await expect(pocketCardPng(card, { createCanvas: () => ({ width: 0, height: 0, getContext: () => ctx, toBlob: (callback) => callback(null) }) })).rejects.toThrow();
    await expect(pocketCardPng(card, { createCanvas: () => ({ width: 0, height: 0, getContext: () => null, toBlob: () => undefined }) })).rejects.toThrow();
  });

  it("names the file from the person without odd characters", () => {
    expect(pocketCardFileName("Maya O’Neil")).toBe("pocket-card-maya-o-neil.png");
    expect(pocketCardFileName("???")).toBe("pocket-card-card.png");
  });
});
