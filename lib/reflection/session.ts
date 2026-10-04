import "server-only";
import type { Db } from "@/lib/data/sessions";
import { AppError } from "@/lib/schemas/errors";
import { MAX_REFLECTIONS_PER_SESSION } from "@/lib/schemas/reflection";
import { sessionStatusSchema } from "@/lib/schemas/session";

const unavailable = () => new AppError("PROVIDER_UNAVAILABLE", "Practice storage is unavailable. Try again shortly.", 503, true);

// Request-scoped client only: owner RLS hides other owners' rows, so they read as missing.
export async function requireEndedSession(db: Db, id: string) {
  let result: { data: unknown; error: unknown };
  try { result = await db.from("practice_sessions").select("id,status,kind,channel").eq("id", id).maybeSingle(); } catch { throw unavailable(); }
  if (result.error) throw unavailable();
  if (!result.data) throw new AppError("NOT_FOUND", "That practice was not found.", 404);
  const status = sessionStatusSchema.safeParse((result.data as { status?: unknown }).status);
  if (!status.success) throw unavailable();
  if (status.data === "deleted") throw new AppError("NOT_FOUND", "That practice was not found.", 404);
  // A stand-in call shows the user's side, not the user's practice; its turns are never reflected on.
  if ((result.data as { kind?: unknown }).kind === "stand_in") throw new AppError("NOT_FOUND", "That practice was not found.", 404);
  if (status.data === "connecting" || status.data === "active" || status.data === "ending") throw new AppError("SESSION_ACTIVE", "End the practice before reflecting.", 409, false, id);
  return { channel: (result.data as { channel?: unknown }).channel === "text" ? "text" as const : "video" as const };
}

// Per server process only: restarts and other instances each keep their own counts.
const MAX_TRACKED = 1_000;
const generations = new Map<string, number>();

// Reserves one generation before the model call so concurrent requests cannot exceed the cap; release returns it on failure.
export function reserveReflection(id: string): () => void {
  const used = generations.get(id) ?? 0;
  if (used >= MAX_REFLECTIONS_PER_SESSION) throw new AppError("USAGE_LIMIT", "This practice has reached its reflection limit.", 429);
  generations.delete(id);
  generations.set(id, used + 1);
  while (generations.size > MAX_TRACKED) generations.delete(generations.keys().next().value!);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = generations.get(id);
    if (current !== undefined) generations.set(id, Math.max(0, current - 1));
  };
}
