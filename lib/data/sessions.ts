import "server-only";
import { z } from "zod";
import type { createAuthClient } from "@/lib/auth/server";
import { AppError, type ErrorCode } from "@/lib/schemas/errors";
import { cleanupSchema, sessionSchema, sessionStatusSchema, type EndReason, type PracticeSession, type SessionStatus } from "@/lib/schemas/session";

// Always the request-scoped user-JWT client from requireIdentity(); never a service-role client.
export type Db = Pick<Awaited<ReturnType<typeof createAuthClient>>, "rpc" | "from">;
export type SessionRow = { id: string; status: SessionStatus; expiresAt: string; cleanup: PracticeSession["cleanup"]; providerId: string | null };

const rowSchema = z.object({ id: z.uuid(), status: sessionStatusSchema, expires_at: z.string(), cleanup: cleanupSchema, provider_conversation_id: z.string().nullable() });
const markers: Record<string, [ErrorCode, string, number]> = {
  FORBIDDEN: ["FORBIDDEN", "This practice session is not available.", 403],
  INVALID_INPUT: ["VALIDATION_ERROR", "The request was not valid.", 400],
  IDEMPOTENCY_CONFLICT: ["VALIDATION_ERROR", "This start request was already used with different settings.", 409],
  SESSION_ACTIVE: ["SESSION_ACTIVE", "You already have a practice session in progress.", 409],
  ASSOCIATION_CONFLICT: ["PROVIDER_UNAVAILABLE", "The call could not be linked to this session.", 503],
  ASSOCIATION_REQUIRED: ["VALIDATION_ERROR", "This call is not ready yet.", 409],
  SESSION_CLOSED: ["SESSION_EXPIRED", "This practice session has already ended.", 409],
  SESSION_EXPIRED: ["SESSION_EXPIRED", "This practice session has expired.", 409],
  INVALID_TRANSITION: ["VALIDATION_ERROR", "That session change is not allowed.", 409],
};
const unavailable = () => new AppError("PROVIDER_UNAVAILABLE", "Session storage is unavailable. Try again shortly.", 503, true);
const activeStatuses = ["connecting", "active", "ending"] as const;
export const isTerminal = (status: SessionStatus) => !(activeStatuses as readonly string[]).includes(status);

function toRow(raw: unknown): SessionRow {
  const parsed = rowSchema.safeParse(raw);
  const expires = parsed.success ? new Date(parsed.data.expires_at) : null;
  if (!parsed.success || !expires || Number.isNaN(expires.getTime())) throw unavailable();
  const { id, status, cleanup, provider_conversation_id: providerId } = parsed.data;
  return { id, status, cleanup, providerId, expiresAt: expires.toISOString() };
}
export function publicSession(row: SessionRow): PracticeSession {
  return sessionSchema.parse({ id: row.id, status: row.status, expiresAt: row.expiresAt, cleanup: row.cleanup });
}
async function call(db: Db, name: string, args: Record<string, unknown>): Promise<unknown> {
  let result: { data: unknown; error: { code?: string; message?: string } | null };
  try { result = await db.rpc(name, args); } catch { throw unavailable(); }
  const { data, error } = result;
  if (!error) return data;
  const known = error.code === "P0001" && error.message ? markers[error.message] : undefined;
  throw known ? new AppError(...known) : unavailable();
}

export async function acquire(db: Db, secret: string, key: string, fingerprint: string, duration: 180 | 300) {
  const parsed = z.object({ created: z.boolean(), session: z.unknown() }).safeParse(await call(db, "practice_acquire", { p_secret: secret, p_key: key, p_fingerprint: fingerprint, p_duration: duration }));
  if (!parsed.success) throw unavailable();
  return { created: parsed.data.created, row: toRow(parsed.data.session) };
}
export const bind = async (db: Db, secret: string, id: string, providerId: string) => toRow(await call(db, "practice_bind", { p_secret: secret, p_id: id, p_provider_id: providerId }));
export const connected = async (db: Db, secret: string, id: string) => toRow(await call(db, "practice_connected", { p_secret: secret, p_id: id }));
export const end = async (db: Db, secret: string, id: string, reason: EndReason) => toRow(await call(db, "practice_end", { p_secret: secret, p_id: id, p_reason: reason }));
export const recordCleanup = async (db: Db, secret: string, id: string, cleanup: "pending" | "confirmed" | "unresolved") => toRow(await call(db, "practice_cleanup", { p_secret: secret, p_id: id, p_cleanup: cleanup }));
// Owner RLS limits this read to the caller's own rows.
export async function activeSessionId(db: Db) {
  try {
    const { data, error } = await db.from("practice_sessions").select("id").in("status", [...activeStatuses]).limit(1);
    const parsed = z.array(z.object({ id: z.uuid() })).safeParse(data);
    return !error && parsed.success ? parsed.data[0]?.id : undefined;
  } catch { return undefined; }
}
