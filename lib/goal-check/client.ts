import { GOAL_CHECK_RATE_LIMIT, goalCheckResponseSchema, type GoalCheckRequest } from "@/lib/schemas/goal-check";
import type { TranscriptTurn } from "@/lib/schemas/reflection";
import { requestJson } from "@/lib/session/api-client";

export type GoalLightState = "off" | "watching" | "reached";
export const GOAL_CHECK_DEBOUNCE_MS = 1_000;
const MAX_TURNS = 6, MAX_TURN_CHARS = 500, MAX_GOAL_CHARS = 200;

// Only the user's own last six turns; counterpart turns never leave the browser on this path.
export function goalCheckBody(goal: string, transcript: readonly TranscriptTurn[]): GoalCheckRequest {
  const turns = transcript
    .filter((turn) => turn.speaker === "user")
    .map((turn) => turn.text.trim().slice(0, MAX_TURN_CHARS).trim())
    .filter(Boolean)
    .slice(-MAX_TURNS);
  return { goal: goal.trim().slice(0, MAX_GOAL_CHARS).trim(), turns };
}

export async function requestGoalCheck(sessionId: string, goal: string, transcript: readonly TranscriptTurn[]): Promise<boolean> {
  const body = goalCheckBody(goal, transcript);
  return (await requestJson("POST", `/api/sessions/${encodeURIComponent(sessionId)}/goal-check`, body, goalCheckResponseSchema)).met;
}

type Timers = { set: (run: () => void, ms: number) => unknown; clear: (handle: unknown) => void; now: () => number };
const browserTimers: Timers = { set: (run, ms) => setTimeout(run, ms), clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>), now: () => Date.now() };

export type GoalWatcher = { update: (transcript: readonly TranscriptTurn[]) => void; dispose: () => void };

// Debounces after each new user turn, keeps to the route's limits, and stops for good after the first `true`.
export function createGoalWatcher({ send, onReached, debounceMs = GOAL_CHECK_DEBOUNCE_MS, timers = browserTimers }: {
  send: (transcript: readonly TranscriptTurn[]) => Promise<boolean>;
  onReached: () => void;
  debounceMs?: number;
  timers?: Timers;
}): GoalWatcher {
  let latest: readonly TranscriptTurn[] = [];
  let seenKey = "", sentKey = "", handle: unknown, inFlight = false, pending = false, done = false, sent = 0, lastSentAt = -Infinity;
  const userKey = (transcript: readonly TranscriptTurn[]) => JSON.stringify(goalCheckBody("", transcript).turns);
  const schedule = (ms: number) => { if (handle !== undefined) timers.clear(handle); handle = timers.set(fire, ms); };

  async function fire() {
    handle = undefined;
    if (done) return;
    if (inFlight) { pending = true; return; }
    const wait = lastSentAt + GOAL_CHECK_RATE_LIMIT.minIntervalMs - timers.now();
    if (wait > 0) return schedule(wait);
    const key = userKey(latest);
    if (key === sentKey || sent >= GOAL_CHECK_RATE_LIMIT.maxPerSession) return;
    inFlight = true; sentKey = key; sent += 1; lastSentAt = timers.now();
    try {
      if (await send(latest) && !done) { done = true; onReached(); }
    } catch { /* The next finished utterance tries again. */ }
    finally {
      inFlight = false;
      if (pending && !done) { pending = false; schedule(0); }
    }
  }

  return {
    update(transcript) {
      if (done) return;
      const key = userKey(transcript);
      if (key === "[]" || key === seenKey) return;
      seenKey = key; latest = transcript;
      schedule(debounceMs);
    },
    dispose() {
      done = true;
      if (handle !== undefined) timers.clear(handle);
      handle = undefined;
    },
  };
}
