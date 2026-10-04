import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Briefing, briefingKey, briefingPlan, initialBriefingDraft, type BriefingDraft, type BriefingSubject } from "@/components/practice/briefing";
import { Lobby, gridMove, highlightJordan, knowsLine, orderPeople, personTraits, starterOrder, type LobbyProps } from "@/components/practice/lobby";
import { examples } from "@/fixtures/examples";
import { manager } from "@/fixtures/manager";
import { getPracticeHistory, listPersonSituations, SessionClientError } from "@/lib/people/api-client";
import { clearPrivateState, readPrivateState, updatePrivateState } from "@/lib/practice/private-state";
import { applySkill, skillIds, skillSituation, skillTemplates } from "@/lib/practice/skill-templates";
import { draftRequestSchema } from "@/lib/schemas/draft";
import type { Person, PersonSituation } from "@/lib/schemas/people";

const at = "2026-10-03T21:20:00.000Z";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
function person(n: number, extra: Partial<Person> = {}): Person {
  return {
    id: uuid(n + 1), version: 3, name: `Person ${n}`, relationship: "Friend", style: "Direct.", background: `Background ${n}.`, publicContext: `Default situation ${n}.`, opening: "Hi.",
    constraints: [], challenge: "neutral", pace: "conversational", traits: { tone: "warm", formality: "casual", talkativeness: "brief", familiarity: "close" },
    sharedFactIds: [], createdAt: at, updatedAt: at, ...extra,
  };
}
const situation: PersonSituation = {
  id: uuid(500), label: "Dishes", createdAt: at, updatedAt: at,
  situation: { publicContext: "Dishes again.", opening: "Hey.", constraints: [], challenge: "neutral", pace: "patient" },
};
const HARD = "HARD-MOMENT-SENTINEL if they push I will hold";
const noop = () => undefined;

afterEach(() => { clearPrivateState(); vi.unstubAllGlobals(); });

describe("R1 skill templates", () => {
  it("fill a template naming the person and suggest a goal only when there is none", () => {
    for (const id of skillIds) {
      const filled = applySkill(id, "Jordan", "");
      expect(filled.situation).toContain("Jordan");
      expect(filled.goal).toBe(skillTemplates[id].goal("Jordan"));
      expect(applySkill(id, "Jordan", "My own goal").goal).toBe("My own goal");
    }
  });
  it("uses a neutral stand-in for someone new and keeps the sentence capitalized", () => {
    expect(skillSituation("ask", undefined)).toBe("I want to ask them for ___ because ___.");
    expect(skillSituation("repair", "  ")).toMatch(/^Them and I argued/);
  });
  it("chips are plain buttons; the only submit is Set up the scene", () => {
    const html = render({ kind: "starter", preset: "manager" });
    const submits = html.match(/type="submit"/g) ?? [];
    expect(submits).toHaveLength(1);
    for (const id of skillIds) expect(html.match(new RegExp(`<button[^>]*data-skill="${id}"[^>]*>`))?.[0]).toContain('type="button"');
  });
});

function render(subject: BriefingSubject, draft: BriefingDraft = initialBriefingDraft(subject), extra: Partial<Parameters<typeof Briefing>[0]> = {}) {
  return renderToStaticMarkup(createElement(Briefing, { subject, draft, onDraftChange: noop, onBack: noop, onSetUp: noop, starterPortraitSrc: () => null, ...extra }));
}

describe("P3 briefing", () => {
  it("prefills from the default situation", () => {
    expect(initialBriefingDraft({ kind: "starter", preset: "manager" }).situation).toBe(manager.publicContext);
    expect(initialBriefingDraft({ kind: "person", person: person(1) }).situation).toBe("Default situation 1.");
    expect(initialBriefingDraft({ kind: "new" }).situation).toBe("");
    expect(briefingKey({ kind: "person", person: person(1) })).not.toBe(briefingKey({ kind: "person", person: person(2) }));
  });

  it("renders the person, the question and the quick starts", () => {
    const subject: BriefingSubject = { kind: "person", person: person(1, { sharedFactIds: [uuid(90), uuid(91)] }) };
    const html = render(subject, initialBriefingDraft(subject), { situations: { status: "ready", items: [situation] } });
    expect(html).toContain("Person 1");
    expect(html).toContain("What’s going on with");
    expect(html).toContain("Same as last time");
    expect(html).toContain("Dishes");
    expect(html).toContain("Knows about you: 2 things");
    expect(html).toContain("Only you see this");
    expect(html).toContain("All people");
  });

  it("someone new offers an optional name and the relationship chips", () => {
    const html = render({ kind: "new" });
    expect(html).toContain("Leave it blank and we’ll pick a name.");
    for (const option of ["Roommate", "Manager", "Professor", "Other"]) expect(html).toContain(`>${option}<`);
    expect(html).toContain("Say what’s going on first.");
    const formId = html.match(/<form id="([^"]+)"/)?.[1];
    expect(formId).toBeTruthy();
    expect(html.match(/<input[^>]*id="[^"]*-name"[^>]*>/)?.[0]).toContain(`form="${formId}"`);
    expect(html.match(/<button[^>]*form="[^"]*"[^>]*>(?:<[^>]+>)*Roommate/)?.[0]).toContain(`form="${formId}"`);
  });

  it("plans a preset start when a starter's situation is untouched, and a draft when edited", () => {
    const subject: BriefingSubject = { kind: "starter", preset: "manager" };
    expect(briefingPlan(subject, initialBriefingDraft(subject), "")).toEqual({ kind: "preset", preset: "manager" });
    const edited = briefingPlan(subject, { ...initialBriefingDraft(subject), situation: "Ask Jordan for Friday off." }, "Get Friday off");
    expect(edited).toEqual({ kind: "draft", request: { situation: "With Jordan (Manager): Ask Jordan for Friday off.", goal: "Get Friday off" } });
  });

  it("plans saved-person starts without a setup call when nothing changed", () => {
    const p = person(4);
    const subject: BriefingSubject = { kind: "person", person: p };
    expect(briefingPlan(subject, initialBriefingDraft(subject), "")).toEqual({ kind: "person-default", personId: p.id, expectedVersion: 3 });
    const chosen = { ...initialBriefingDraft(subject), situation: "Dishes again.", savedSituationId: situation.id };
    expect(briefingPlan(subject, chosen, "", [situation])).toEqual({ kind: "person-situation", personId: p.id, expectedVersion: 3, situation: situation.situation });
    expect(briefingPlan(subject, { ...chosen, situation: "Dishes again, and the trash." }, "", [situation])).toEqual({ kind: "draft", request: { situation: "Dishes again, and the trash.", personId: p.id } });
  });

  it("frames someone new with the typed name and relationship", () => {
    const draft: BriefingDraft = { situation: "I want to ask for my sweater back.", name: "Rae", relationship: "Sibling", savedSituationId: null };
    expect(briefingPlan({ kind: "new" }, draft, "")).toEqual({ kind: "draft", request: { situation: "With Rae, my sibling: I want to ask for my sweater back." } });
    expect(briefingPlan({ kind: "new" }, { ...draft, name: "", relationship: "" }, "")).toEqual({ kind: "draft", request: { situation: "I want to ask for my sweater back." } });
  });

  it("returns no plan for empty or over-long text", () => {
    const subject: BriefingSubject = { kind: "new" };
    expect(briefingPlan(subject, initialBriefingDraft(subject), "")).toBeNull();
    expect(briefingPlan(subject, { ...initialBriefingDraft(subject), situation: "x".repeat(1001) }, "")).toBeNull();
  });

  it("never puts the hard-moment line or other private fields into any plan, and draft bodies validate", () => {
    updatePrivateState({ goal: "Ask for one thing", hardMomentLine: HARD, prediction: "FEAR-SENTINEL", likelihoodBefore: 70 });
    const goal = readPrivateState().goal;
    const subjects: BriefingSubject[] = [{ kind: "starter", preset: "manager" }, { kind: "person", person: person(1) }, { kind: "new" }];
    for (const subject of subjects) {
      for (const text of [initialBriefingDraft(subject).situation || "Something new.", "Edited text."]) {
        const plan = briefingPlan(subject, { ...initialBriefingDraft(subject), situation: text, name: "Rae" }, goal, [situation]);
        const body = JSON.stringify(plan);
        expect(body).not.toContain("HARD-MOMENT");
        expect(body).not.toContain("FEAR-SENTINEL");
        expect(body).not.toMatch(/hardMoment|prediction|likelihood|privateNotes/);
        if (plan?.kind === "draft") {
          expect(draftRequestSchema.safeParse(plan.request).success).toBe(true);
          expect(plan.request.goal).toBe("Ask for one thing");
        }
      }
    }
  });
});

describe("P1 lobby", () => {
  const base: LobbyProps = { people: [], status: "ready", onRetry: noop, onPickPerson: noop, onPickStarter: noop, onSomeoneNew: noop, shortcuts: false };
  const cards = (html: string) => (html.match(/data-lobby-card/g) ?? []).length;
  const lobby = (props: Partial<LobbyProps>) => renderToStaticMarkup(createElement(Lobby, { ...base, ...props }));

  it("puts Jordan first among the starters", () => {
    expect(starterOrder[0]).toBe("manager");
    const html = lobby({});
    const order = starterOrder.map((preset) => html.indexOf(`aria-label="Practice with ${examples[preset].role.name},`));
    expect(order.every((index) => index > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("renders cards for 0, 1 and 12 people, plus starters and Someone new", () => {
    expect(cards(lobby({}))).toBe(5);
    expect(lobby({})).toContain("Add the people you want to practice talking to.");
    expect(cards(lobby({ people: [person(0)] }))).toBe(6);
    const twelve = Array.from({ length: 12 }, (_, n) => person(n));
    expect(cards(lobby({ people: twelve }))).toBe(17);
    expect((lobby({ people: twelve }).match(/Practice with someone new/g) ?? [])).toHaveLength(1);
  });

  it("lists exactly the people it is given (the route is owner-scoped; nothing else is listed)", () => {
    const html = lobby({ people: [person(7)] });
    expect(html).toContain("Practice with Person 7, Friend");
    expect(html).not.toContain("Person 8");
  });

  it("highlights Jordan as Start here only on the first run", () => {
    expect(lobby({})).toContain("Start here");
    expect(highlightJordan([], "ready", ["manager"])).toBe(false);
    expect(highlightJordan([person(0)], "ready", [])).toBe(false);
    expect(highlightJordan([], "loading", [])).toBe(false);
  });

  it("loads portraits from the portrait route and falls back to the monogram", () => {
    const html = renderToStaticMarkup(createElement(Lobby, { ...base, starterPortraitSrc: undefined }));
    expect(html).toContain('src="/api/portraits/manager"');
    const fallback = lobby({ starterPortraitSrc: () => null });
    expect(fallback).not.toContain("/api/portraits/");
    expect(fallback).toContain('aria-label="Jordan, fictional AI character"');
  });

  it("puts Someone new under Your people on the first run, not under the starters", () => {
    const html = lobby({});
    const people = html.indexOf(">Your people<");
    const starters = html.indexOf(">Starter characters<");
    const someoneNew = html.indexOf("Practice with someone new");
    expect(people).toBeGreaterThan(0);
    expect(someoneNew).toBeGreaterThan(people);
    expect(someoneNew).toBeLessThan(starters);
  });

  it("disables the More button with the card", () => {
    const html = lobby({ people: [person(0)], onEditPerson: noop, disabled: true, disabledReason: "Signing you out…" });
    const more = html.match(/<button[^>]*aria-label="More for Person 0"[^>]*>/)?.[0] ?? "";
    expect(more).toContain("disabled");
    expect(more).toContain('aria-disabled="true"');
  });

  it("shows an inline retry on error and keeps the starters", () => {
    const html = lobby({ status: "error" });
    expect(html).toContain("We couldn’t load your people.");
    expect(html).toContain("Try again");
    expect(cards(html)).toBe(5);
  });

  it("orders practiced people first, keeping the server order otherwise", () => {
    const list = [person(0), person(1, { hasPracticed: true }), person(2), person(3, { hasPracticed: true })];
    expect(orderPeople(list).map((p) => p.name)).toEqual(["Person 1", "Person 3", "Person 0", "Person 2"]);
    expect(personTraits(person(0))).toEqual(["warm", "casual", "brief"]);
    expect(knowsLine(0)).toBeUndefined();
    expect(knowsLine(1)).toBe("Knows 1 thing about you");
    expect(knowsLine(2)).toBe("Knows 2 things about you");
  });

  it("moves focus through the grid with arrows, Home and End", () => {
    // Two grids: three cards in a row, then a second row of two, then a starter row below.
    const r = (left: number, top: number) => ({ left, top, width: 100, height: 120 });
    const rects = [r(0, 0), r(120, 0), r(240, 0), r(0, 140), r(120, 140), r(0, 400), r(120, 400), r(240, 400)];
    expect(gridMove(rects, 0, "ArrowRight")).toBe(1);
    expect(gridMove(rects, 0, "ArrowLeft")).toBe(0);
    expect(gridMove(rects, 2, "ArrowDown")).toBe(4);
    expect(gridMove(rects, 4, "ArrowDown")).toBe(6);
    expect(gridMove(rects, 7, "ArrowUp")).toBe(4);
    expect(gridMove(rects, 1, "ArrowUp")).toBe(1);
    expect(gridMove(rects, 3, "End")).toBe(7);
    expect(gridMove(rects, 5, "Home")).toBe(0);
    expect(gridMove([], 0, "End")).toBe(-1);
  });
});

describe("read-only people client additions", () => {
  function stubFetch(response: Response) { const fetchMock = vi.fn().mockResolvedValue(response); vi.stubGlobal("fetch", fetchMock); return fetchMock; }
  const personId = uuid(1);

  it("lists a person's saved situations with a bodiless GET", async () => {
    const fetchMock = stubFetch(Response.json({ situations: [situation] }));
    await expect(listPersonSituations(personId)).resolves.toEqual([situation]);
    const [url, init] = fetchMock.mock.calls[0];
    expect([url, init.method, init.body]).toEqual([`/api/people/${personId}/situations`, "GET", undefined]);
  });

  it("surfaces another owner's person as NOT_FOUND", async () => {
    stubFetch(Response.json({ code: "NOT_FOUND", message: "Not found.", retryable: false, request_id: uuid(9) }, { status: 404 }));
    const error = await listPersonSituations(personId).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SessionClientError);
    expect(error).toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("reads practice history and rejects unknown presets", async () => {
    let fetchMock = stubFetch(Response.json({ practicedPresets: ["manager"] }));
    await expect(getPracticeHistory()).resolves.toEqual(["manager"]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/practice-history");
    fetchMock = stubFetch(Response.json({ practicedPresets: ["villain"] }));
    await expect(getPracticeHistory()).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });
});
