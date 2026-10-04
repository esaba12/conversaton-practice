import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CheckinBanner, TalkedForRealMark } from "@/components/practice/checkin-banner";
import { PlannedDate } from "@/components/practice/planned-date";
import { checkinPlanned, setPlanned } from "@/lib/planned/api-client";
import { checkinDue, dayLabel, localDay, nextCheckin, planFor, talkedForReal } from "@/lib/planned/checkin";
import { buildPlannedInput } from "@/lib/planned/input";
import { checkinRequestSchema, plannedGuessSchema, plannedSchema, setPlannedRequestSchema, type Planned } from "@/lib/schemas/planned";

const pid = "22222222-2222-4222-8222-222222222222";
const stamp = "2026-10-04T12:00:00.000Z";
const plan = (patch: Partial<Planned> = {}): Planned => ({
  id: "33333333-3333-4333-8333-333333333333", personId: pid, plannedOn: "2026-10-09", label: null, fear: null, likelihoodBefore: null, likelihoodAfter: null,
  checkin: null, checkinNote: null, checkedInAt: null, createdAt: stamp, updatedAt: stamp, ...patch,
});
const noop = async () => true;
const banner = (value: Planned | null, today: string) => renderToStaticMarkup(createElement(CheckinBanner, { plan: value, personName: "Maya", today, onAnswer: noop, onPickDay: noop }));
afterEach(() => vi.unstubAllGlobals());

describe("planned schemas (B1, B2, W4)", () => {
  it("accepts a bare day and rejects impossible days, long labels and empty guesses", () => {
    expect(setPlannedRequestSchema.safeParse({ personId: pid, plannedOn: "2026-10-09" }).success).toBe(true);
    expect(setPlannedRequestSchema.safeParse({ personId: pid, plannedOn: "2026-13-09" }).success).toBe(false);
    expect(setPlannedRequestSchema.safeParse({ personId: pid, plannedOn: "2026-10-09", label: "x".repeat(121) }).success).toBe(false);
    expect(setPlannedRequestSchema.safeParse({ personId: pid, plannedOn: "2026-10-09", label: "x".repeat(120) }).success).toBe(true);
    expect(plannedGuessSchema.safeParse({}).success).toBe(false);
    expect(plannedGuessSchema.safeParse({ likelihoodBefore: 0 }).success).toBe(true);
  });

  it("limits the note to 200 and to Yes answers", () => {
    expect(checkinRequestSchema.safeParse({ answer: "yes", note: "x".repeat(200) }).success).toBe(true);
    expect(checkinRequestSchema.safeParse({ answer: "yes", note: "x".repeat(201) }).success).toBe(false);
    expect(checkinRequestSchema.safeParse({ answer: "decided_not", note: "hi" }).success).toBe(false);
    expect(checkinRequestSchema.safeParse({ answer: "not_yet" }).success).toBe(true);
  });

  it("has no score, count or streak field on a plan", () => {
    expect(Object.keys(plannedSchema.shape).join(" ")).not.toMatch(/score|count|streak|delta/i);
  });
});

describe("check-in visibility (B2)", () => {
  it("shows only with a plan, on or after its day, and unanswered", () => {
    expect(checkinDue(null, "2026-10-09")).toBe(false);
    expect(checkinDue(plan(), "2026-10-08")).toBe(false);
    expect(checkinDue(plan(), "2026-10-09")).toBe(true);
    expect(checkinDue(plan(), "2026-11-01")).toBe(true);
    for (const answer of ["not_yet", "decided_not", "yes"] as const) expect(checkinDue(plan({ checkin: answer }), "2026-10-20")).toBe(false);
  });

  it("renders nothing before the day, nothing once answered, and the question on the day", () => {
    expect(banner(plan(), "2026-10-08")).toBe("");
    expect(banner(null, "2026-10-09")).toBe("");
    expect(banner(plan({ checkin: "yes" }), "2026-10-20")).toBe("");
    const due = banner(plan(), "2026-10-09");
    expect(due).toContain("Did you talk with Maya?");
    for (const text of ["Not yet", "I decided not to", "Yes"]) expect(due).toContain(text);
  });

  it("Yes recalls the guess only when one was kept, with an optional note up to 200", () => {
    const withFear = renderToStaticMarkup(createElement(CheckinBanner, { initialStep: "yes", plan: plan({ fear: "She will say no" }), personName: "Maya", today: "2026-10-09", onAnswer: noop, onPickDay: noop }));
    expect(withFear).toContain("You expected: “She will say no”."); expect(withFear).toContain("What actually happened?"); expect(withFear).toContain('maxLength="200"');
    const without = renderToStaticMarkup(createElement(CheckinBanner, { initialStep: "yes", plan: plan(), personName: "Maya", today: "2026-10-09", onAnswer: noop, onPickDay: noop }));
    expect(without).not.toContain("You expected"); expect(without).toContain("How did it go?");
  });

  it("Not yet offers a new day that cannot be today or earlier", () => {
    const html = renderToStaticMarkup(createElement(CheckinBanner, { initialStep: "newday", plan: plan({ checkin: "not_yet" }), personName: "Maya", today: "2026-10-09", onAnswer: noop, onPickDay: noop }));
    expect(html).toContain("Pick a new day"); expect(html).toContain('min="2026-10-10"'); expect(html).toContain("Skip");
  });

  it("marks only a Yes as Talked for real, and uses no counts or reminders", () => {
    expect(talkedForReal(plan({ checkin: "yes" }))).toBe(true);
    expect(talkedForReal(plan({ checkin: "decided_not" }))).toBe(false);
    expect(talkedForReal(null)).toBe(false);
    expect(renderToStaticMarkup(createElement(TalkedForRealMark))).toContain("Talked for real");
  });

  it("finds the person's plan and the earliest due plan; formats days without time zones", () => {
    const a = plan({ id: "a", plannedOn: "2026-10-05" }), b = plan({ id: "b", personId: "p2", plannedOn: "2026-10-03" }), c = plan({ id: "c", personId: "p3", plannedOn: "2026-10-01", checkin: "yes" });
    expect(planFor([a, b], "p2")).toBe(b); expect(planFor([a, b], "zz")).toBeNull();
    expect(nextCheckin([a, b, c], "2026-10-06")).toBe(b); expect(nextCheckin([a, b, c], "2026-10-02")).toBeNull();
    expect(dayLabel("2026-10-09")).toBe("Oct 9"); expect(localDay(new Date(2026, 9, 4, 23, 59))).toBe("2026-10-04");
  });
});

describe("W4 opt-in", () => {
  const guess = { fear: "SECRET-FEAR", likelihoodBefore: 80 };

  it("leaves the fear and likelihood out of the input when the opt-in is off", () => {
    const off = buildPlannedInput({ personId: pid, day: "2026-10-09", label: "Dishes", keepGuess: false, guess });
    expect(off).toEqual({ personId: pid, plannedOn: "2026-10-09", label: "Dishes" });
    expect(JSON.stringify(off)).not.toMatch(/SECRET-FEAR|80|fear|guess|likelihood/);
  });

  it("includes only the guess parts that exist when the opt-in is on", () => {
    expect(buildPlannedInput({ personId: pid, day: "2026-10-09", label: "", keepGuess: true, guess })).toEqual({ personId: pid, plannedOn: "2026-10-09", guess });
    expect(buildPlannedInput({ personId: pid, day: "2026-10-09", label: "", keepGuess: true, guess: { fear: " ", likelihoodBefore: 20 } })).toEqual({ personId: pid, plannedOn: "2026-10-09", guess: { likelihoodBefore: 20 } });
    expect(buildPlannedInput({ personId: pid, day: "2026-10-09", label: "", keepGuess: true, guess: { fear: "", likelihoodBefore: null } })).toEqual({ personId: pid, plannedOn: "2026-10-09" });
    expect(buildPlannedInput({ personId: pid, day: "", label: "", keepGuess: true, guess })).toBeNull();
  });

  it("the date control starts with the opt-in off and offers it only when a day and a guess exist", () => {
    const base = { personId: pid, personName: "Maya", onSave: () => undefined, onRemove: () => undefined };
    const empty = renderToStaticMarkup(createElement(PlannedDate, { ...base, plan: null, guess }));
    expect(empty).not.toContain("Keep my guess");
    const offered = renderToStaticMarkup(createElement(PlannedDate, { ...base, plan: plan(), guess }));
    expect(offered).toContain("Keep my guess to check after the real conversation"); expect(offered).not.toContain("checked");
    expect(renderToStaticMarkup(createElement(PlannedDate, { ...base, plan: plan(), guess: null }))).not.toContain("Keep my guess");
    expect(offered).not.toContain("SECRET-FEAR");
    expect(offered).toContain("When will you talk for real?");
  });

  it("the client sends no fear or likelihood unless a guess is passed, and rebuilds the body field by field", async () => {
    const fetchSpy = vi.fn(async (_path: string, _init: RequestInit) => Response.json({ plan: plan() }));
    vi.stubGlobal("fetch", fetchSpy);
    await setPlanned({ personId: pid, plannedOn: "2026-10-09" });
    await setPlanned({ personId: pid, plannedOn: "2026-10-09", label: "Dishes", guess: { fear: "She will say no", likelihoodBefore: 70 }, ...({ goal: "PRIVATE-GOAL" } as object) } as Parameters<typeof setPlanned>[0]);
    await checkinPlanned("33333333-3333-4333-8333-333333333333", "not_yet", "ignored note");
    const bodies = fetchSpy.mock.calls.map(([, init]) => JSON.parse(init.body as string));
    expect(bodies[0]).toEqual({ personId: pid, plannedOn: "2026-10-09" });
    expect(bodies[1]).toEqual({ personId: pid, plannedOn: "2026-10-09", label: "Dishes", guess: { fear: "She will say no", likelihoodBefore: 70 } });
    expect(JSON.stringify(bodies)).not.toContain("PRIVATE-GOAL");
    expect(bodies[2]).toEqual({ answer: "not_yet" });
  });
});
