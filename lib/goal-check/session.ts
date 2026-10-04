import "server-only";
import type { Db } from "@/lib/data/sessions";
import { AppError } from "@/lib/schemas/errors";
import { GOAL_CHECK_RATE_LIMIT } from "@/lib/schemas/goal-check";
import { sessionStatusSchema } from "@/lib/schemas/session";

const unavailable = () => new AppError("PROVIDER_UNAVAILABLE", "Practice storage is unavailable. Try again shortly.", 503, true);
const missing = () => new AppError("NOT_FOUND", "That practice was not found.", 404);

// Request-scoped client only: owner RLS hides other owners' rows, so they read as missing.
export async function requireLiveSession(db: Db, id: string) {
  let result: { data: unknown; error: unknown };
  try { result = await db.from("practice_sessions").select("id,status,kind").eq("id", id).maybeSingle(); } catch { throw unavailable(); }
  if (result.error) throw unavailable();
  if (!result.data) throw missing();
  const status = sessionStatusSchema.safeParse((result.data as { status?: unknown }).status);
  if (!status.success) throw unavailable();
  if (status.data === "deleted") throw missing();
  // In a stand-in call the user plays the counterpart, so there is no goal line of theirs to light.
  if ((result.data as { kind?: unknown }).kind === "stand_in") throw missing();
  if (status.data !== "active") throw new AppError("SESSION_EXPIRED", "This practice is not live.", 409);
}

// Per server process only: restarts and other instances each keep their own counts.
const MAX_TRACKED = 1_000;
const checks = new Map<string, { count: number; lastAt: number }>();

// Counted before the model call and never released: a failed check still cost a call.
export function reserveGoalCheck(id: string, now = Date.now()) {
  const used = checks.get(id);
  if (used && (used.count >= GOAL_CHECK_RATE_LIMIT.maxPerSession || now - used.lastAt < GOAL_CHECK_RATE_LIMIT.minIntervalMs)) {
    throw new AppError("USAGE_LIMIT", "The goal light is checking too often. It will try again after your next line.", 429);
  }
  checks.delete(id);
  checks.set(id, { count: (used?.count ?? 0) + 1, lastAt: now });
  while (checks.size > MAX_TRACKED) checks.delete(checks.keys().next().value!);
}

export function resetGoalCheckLimitsForTests() { checks.clear(); }
