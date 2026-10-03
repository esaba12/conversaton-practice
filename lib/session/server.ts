import "server-only";
import { createHash } from "node:crypto";
import { roommate } from "@/fixtures/roommate";
import * as sessions from "@/lib/data/sessions";
import type { Db, SessionRow } from "@/lib/data/sessions";
import { assertTavusConfigured, createConversation, stopConversation } from "@/lib/media/tavus";
import { AppError } from "@/lib/schemas/errors";
import { startResponseSchema, type EndReason, type StartResponse, type startRequestSchema } from "@/lib/schemas/session";
import type { z } from "zod";

function capability() {
  const secret = process.env.SESSION_SERVER_SECRET;
  if (!secret || secret.length < 32) throw new AppError("NOT_CONFIGURED", "Live practice is not configured yet.", 503);
  return secret;
}
const startFailed = () => new AppError("PROVIDER_UNAVAILABLE", "The call could not be started. Wait a moment before trying again.", 503, false);

// Leaves cleanup pending/unresolved unless the remote call is verified ended and hard-deleted.
async function cleanUp(db: Db, secret: string, row: SessionRow) {
  if (!row.providerId || row.cleanup === "confirmed") return row;
  if (!(await stopConversation(row.providerId))) return row;
  return sessions.recordCleanup(db, secret, row.id, "confirmed").catch(() => row);
}

export async function startSession(db: Db, input: z.output<typeof startRequestSchema>): Promise<StartResponse> {
  const secret = capability();
  assertTavusConfigured();
  const fingerprint = createHash("sha256").update(JSON.stringify({ preset: input.preset, durationSeconds: input.durationSeconds })).digest("hex");
  let acquired: Awaited<ReturnType<typeof sessions.acquire>>;
  try { acquired = await sessions.acquire(db, secret, input.idempotencyKey, fingerprint, input.durationSeconds); }
  catch (error) {
    if (error instanceof AppError && error.code === "SESSION_ACTIVE") error.sessionId = await sessions.activeSessionId(db);
    throw error;
  }
  const { id } = acquired.row;
  // Only a fresh lease may create a provider call; replays never start a second one.
  if (!acquired.created) throw new AppError("SESSION_ACTIVE", "This start request was already handled. End that session to start another.", 409, false, id);
  let created: Awaited<ReturnType<typeof createConversation>>;
  try { created = await createConversation(roommate, input.durationSeconds); }
  catch {
    // Without a provider ID the database records cleanup as unresolved, which is truthful after a timeout.
    await sessions.end(db, secret, id, "connection_failure").catch(() => undefined);
    throw startFailed();
  }
  let bound: SessionRow;
  try { bound = await sessions.bind(db, secret, id, created.providerId); }
  catch {
    await sessions.end(db, secret, id, "connection_failure").catch(() => undefined);
    await stopConversation(created.providerId);
    throw startFailed();
  }
  if (sessions.isTerminal(bound.status) || Date.parse(bound.expiresAt) <= Date.now()) {
    const ended = sessions.isTerminal(bound.status) ? bound : await sessions.end(db, secret, id, "time_limit").catch(() => bound);
    await cleanUp(db, secret, ended);
    throw new AppError("SESSION_EXPIRED", "This practice ended before the call was ready.", 409);
  }
  return startResponseSchema.parse({ session: sessions.publicSession(bound), credential: created.credential });
}

export async function connectSession(db: Db, id: string) {
  return { session: sessions.publicSession(await sessions.connected(db, capability(), id)) };
}

// Commits the terminal state first; repeated calls retry remote cleanup for a bound provider ID.
export async function endSession(db: Db, id: string, reason: EndReason) {
  const secret = capability();
  const row = await sessions.end(db, secret, id, reason);
  return { session: sessions.publicSession(await cleanUp(db, secret, row)) };
}
