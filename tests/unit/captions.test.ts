import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TranscriptTurn } from "@/lib/schemas/reflection";

vi.mock("@/components/presentation/captions.module.css", () => ({
  default: new Proxy({}, { get: (_target, prop) => String(prop) }),
}));

import { Captions, captionLines } from "@/components/presentation/captions";

const fixture: TranscriptTurn = { speaker: "user", text: "fixture-caption-line" };

function markup(turns: readonly TranscriptTurn[]) {
  return renderToStaticMarkup(createElement(Captions, { turns, counterpartName: "Alex" }));
}

describe("captions disclosure", () => {
  it("is collapsed by default and renders nothing from empty turns", () => {
    const html = markup([]);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Show captions");
    expect(html).toContain("Captions off");
    expect(html).not.toContain("Hide captions");
    expect(html).not.toContain("Captions on");
    expect(html).not.toContain("<ol");
    expect(html).not.toContain("aria-live");
    expect(html).not.toContain(fixture.text);
    expect(captionLines(true, [], "Alex")).toEqual([]);
    expect(captionLines(true, [{ speaker: "counterpart", text: "   " }], "Alex")).toEqual([]);
  });

  it("keeps held turns out of the collapsed disclosure", () => {
    const html = markup([fixture, { speaker: "counterpart", text: "fixture-reply-line" }]);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain(fixture.text);
    expect(html).not.toContain("fixture-reply-line");
    expect(captionLines(false, [fixture], "Alex")).toEqual([]);
    expect(captionLines(true, [fixture], "Alex")).toEqual([{ key: "0-user", speaker: "You", text: fixture.text }]);
  });
});
