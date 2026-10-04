import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GOAL_LIGHT_LABEL, GOAL_LIGHT_NOTE, GoalLightToggle, GoalPill } from "@/components/practice/goal-pill";
import { createGoalWatcher, GOAL_CHECK_DEBOUNCE_MS, goalCheckBody, requestGoalCheck } from "@/lib/goal-check/client";
import { goalLightPlan } from "@/lib/goal-check/use-goal-light";
import { GOAL_CHECK_RATE_LIMIT, goalCheckRequestSchema } from "@/lib/schemas/goal-check";
import type { TranscriptTurn } from "@/lib/schemas/reflection";

const GOAL = "Move the Atlas report to next sprint.";
const SESSION = "3f6f2a8e-1b7c-4d7e-9a51-0d7f3e9c2b11";
const user = (text: string): TranscriptTurn => ({ speaker: "user", text });
const them = (text: string): TranscriptTurn => ({ speaker: "counterpart", text });

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("goalCheckBody and requestGoalCheck", () => {
  it("keeps only the last six user turns, trimmed to the route limits", () => {
    const transcript = [them("COUNTERPART-SENTINEL hi"), ...Array.from({ length: 8 }, (_, i) => user(`line ${i}`)), them("COUNTERPART-SENTINEL ok"), user("x".repeat(600))];
    const body = goalCheckBody(` ${"g".repeat(250)} `, transcript);
    expect(body.turns).toEqual(["line 3", "line 4", "line 5", "line 6", "line 7", "x".repeat(500)]);
    expect(body.goal).toBe("g".repeat(200));
    expect(JSON.stringify(body)).not.toContain("COUNTERPART-SENTINEL");
    expect(goalCheckRequestSchema.parse(body)).toEqual(body);
  });

  it("posts only { goal, turns } with user turns to the session's goal-check route", async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) => Response.json({ met: true }));
    vi.stubGlobal("fetch", fetchMock);
    const met = await requestGoalCheck(SESSION, GOAL, [them("COUNTERPART-SENTINEL what's up?"), user("Can we move Atlas?")]);
    expect(met).toBe(true);
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe(`/api/sessions/${SESSION}/goal-check`);
    expect(init?.method).toBe("POST");
    const sent = JSON.parse(String(init?.body));
    expect(Object.keys(sent).sort()).toEqual(["goal", "turns"]);
    expect(sent).toEqual({ goal: GOAL, turns: ["Can we move Atlas?"] });
  });

  it("the client module has no path to the call provider or interactions", () => {
    for (const file of ["lib/goal-check/client.ts", "lib/goal-check/use-goal-light.ts", "components/practice/goal-pill.tsx"]) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/interactions|append_|daily|tavus|sendAppMessage/i);
    }
  });
});

function fakeTimers() {
  vi.useFakeTimers({ now: new Date("2026-10-04T10:00:00Z") });
  return { set: (run: () => void, ms: number) => setTimeout(run, ms), clear: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>), now: () => Date.now() };
}

describe("createGoalWatcher", () => {
  it("debounces 1 s after each new user turn and sends one check for a burst", async () => {
    const timers = fakeTimers();
    const send = vi.fn(async () => false);
    const watcher = createGoalWatcher({ send, onReached: vi.fn(), timers });
    watcher.update([user("Hi")]);
    await vi.advanceTimersByTimeAsync(GOAL_CHECK_DEBOUNCE_MS - 1);
    watcher.update([user("Hi"), user("Could we talk")]);
    await vi.advanceTimersByTimeAsync(GOAL_CHECK_DEBOUNCE_MS - 1);
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith([user("Hi"), user("Could we talk")]);
  });

  it("ignores counterpart turns and unchanged user turns", async () => {
    const timers = fakeTimers();
    const send = vi.fn(async () => false);
    const watcher = createGoalWatcher({ send, onReached: vi.fn(), timers });
    watcher.update([them("Hey")]);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(send).not.toHaveBeenCalled();
    watcher.update([them("Hey"), user("Hi")]);
    await vi.advanceTimersByTimeAsync(5_000);
    watcher.update([them("Hey"), user("Hi"), them("What's up?")]);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("keeps at least 3 s between checks", async () => {
    const timers = fakeTimers();
    const sentAt: number[] = [];
    const send = vi.fn(async () => { sentAt.push(Date.now()); return false; });
    const watcher = createGoalWatcher({ send, onReached: vi.fn(), timers });
    watcher.update([user("one")]);
    await vi.advanceTimersByTimeAsync(GOAL_CHECK_DEBOUNCE_MS);
    watcher.update([user("one"), user("two")]);
    await vi.advanceTimersByTimeAsync(GOAL_CHECK_DEBOUNCE_MS);
    expect(send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(GOAL_CHECK_RATE_LIMIT.minIntervalMs);
    expect(send).toHaveBeenCalledTimes(2);
    expect(sentAt[1] - sentAt[0]).toBeGreaterThanOrEqual(GOAL_CHECK_RATE_LIMIT.minIntervalMs);
  });

  it("lights once on the first true and sends nothing more", async () => {
    const timers = fakeTimers();
    const onReached = vi.fn();
    const send = vi.fn(async () => true);
    const watcher = createGoalWatcher({ send, onReached, timers });
    watcher.update([user("Can we move Atlas to next sprint?")]);
    await vi.advanceTimersByTimeAsync(GOAL_CHECK_DEBOUNCE_MS);
    expect(onReached).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 5; i++) {
      watcher.update([user("Can we move Atlas to next sprint?"), user(`more ${i}`)]);
      await vi.advanceTimersByTimeAsync(10_000);
    }
    expect(send).toHaveBeenCalledTimes(1);
    expect(onReached).toHaveBeenCalledTimes(1);
  });

  it("survives a failed check and tries again after the next user turn", async () => {
    const timers = fakeTimers();
    const onReached = vi.fn();
    const send = vi.fn().mockRejectedValueOnce(new Error("429")).mockResolvedValueOnce(true);
    const watcher = createGoalWatcher({ send, onReached, timers });
    watcher.update([user("one")]);
    await vi.advanceTimersByTimeAsync(GOAL_CHECK_DEBOUNCE_MS);
    watcher.update([user("one"), user("two")]);
    await vi.advanceTimersByTimeAsync(GOAL_CHECK_RATE_LIMIT.minIntervalMs);
    expect(send).toHaveBeenCalledTimes(2);
    expect(onReached).toHaveBeenCalledTimes(1);
  });

  it("stops at 40 checks, and dispose cancels a pending check", async () => {
    const timers = fakeTimers();
    const send = vi.fn(async () => false);
    const watcher = createGoalWatcher({ send, onReached: vi.fn(), timers });
    for (let i = 0; i < GOAL_CHECK_RATE_LIMIT.maxPerSession + 3; i++) {
      watcher.update([user(`line ${i}`)]);
      await vi.advanceTimersByTimeAsync(GOAL_CHECK_RATE_LIMIT.minIntervalMs + GOAL_CHECK_DEBOUNCE_MS);
    }
    expect(send).toHaveBeenCalledTimes(GOAL_CHECK_RATE_LIMIT.maxPerSession);

    const second = vi.fn(async () => false);
    const disposed = createGoalWatcher({ send: second, onReached: vi.fn(), timers });
    disposed.update([user("hello")]);
    disposed.dispose();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(second).not.toHaveBeenCalled();
  });
});

describe("goalLightPlan (useGoalLight)", () => {
  const base = { enabled: true, sessionId: SESSION, goal: GOAL, reachedFor: null };
  it("is off, with no watcher, when the toggle is off, the goal is empty or there is no live session", () => {
    expect(goalLightPlan({ ...base, enabled: false })).toEqual({ state: "off", watch: false });
    expect(goalLightPlan({ ...base, goal: "   " })).toEqual({ state: "off", watch: false });
    expect(goalLightPlan({ ...base, sessionId: null })).toEqual({ state: "off", watch: false });
    expect(goalLightPlan({ ...base, enabled: false, reachedFor: SESSION })).toEqual({ state: "off", watch: false });
  });
  it("watches when on, and stays reached without a watcher after the first true", () => {
    expect(goalLightPlan(base)).toEqual({ state: "watching", watch: true });
    expect(goalLightPlan({ ...base, reachedFor: SESSION })).toEqual({ state: "reached", watch: false });
    expect(goalLightPlan({ ...base, reachedFor: "an-earlier-session" })).toEqual({ state: "watching", watch: true });
  });
});

describe("GoalPill and GoalLightToggle", () => {
  it("renders the outline pill with an empty polite live region until reached", () => {
    const html = renderToStaticMarkup(createElement(GoalPill, { goal: GOAL, state: "watching" }));
    expect(html).toContain('data-goal-state="watching"');
    expect(html).toContain(GOAL);
    expect(html).toMatch(/<span class="sr-only" aria-live="polite"><\/span>/);
    expect(html).not.toContain("<svg");
  });
  it("announces 'Goal reached' with a check when reached", () => {
    const html = renderToStaticMarkup(createElement(GoalPill, { goal: GOAL, state: "reached" }));
    expect(html).toContain('data-goal-state="reached"');
    expect(html).toMatch(/aria-live="polite">Goal reached<\/span>/);
    expect(html).toContain("<svg");
  });
  it("renders the toggle off by default with the exact label and note", () => {
    expect(GOAL_LIGHT_LABEL).toBe("Light up my goal when I say it");
    expect(GOAL_LIGHT_NOTE).toBe("During the call, what you say is checked by a separate model to see whether you said your line. The character never learns your goal.");
    const html = renderToStaticMarkup(createElement(GoalLightToggle, { checked: false, onChange: () => undefined }));
    expect(html).toContain('role="switch"');
    expect(html).not.toMatch(/checked=""/);
    expect(html).toContain(GOAL_LIGHT_LABEL);
    expect(html).toContain(GOAL_LIGHT_NOTE);
    expect(html).toMatch(/aria-describedby="([^"]+)-note"/);
  });
});
