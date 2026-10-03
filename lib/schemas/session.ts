import { z } from "zod";
import { mediaCredentialSchema } from "./media";
export const sessionStatusSchema = z.enum(["connecting", "active", "ending", "ended", "interrupted", "deleted"]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export const cleanupSchema = z.enum(["not_started", "pending", "confirmed", "unresolved"]);
export const startRequestSchema = z.object({ idempotencyKey: z.uuid(), preset: z.literal("roommate"), durationSeconds: z.union([z.literal(180), z.literal(300)]) }).strict();
export const endRequestSchema = z.object({ reason: z.enum(["user", "auth_loss", "navigation", "connection_failure", "time_limit"]) }).strict();
export type EndReason = z.infer<typeof endRequestSchema>["reason"];
export const sessionSchema = z.object({ id: z.uuid(), status: sessionStatusSchema, expiresAt: z.iso.datetime(), cleanup: cleanupSchema });
export type PracticeSession = z.infer<typeof sessionSchema>;

// HTTP contract. Errors use errorSchema with the listed HTTP status.
// POST /api/sessions (startRequestSchema) -> 201 startResponseSchema. Replays/an existing lease -> 409 SESSION_ACTIVE with session_id.
// POST /api/sessions/[id]/connected ({}) -> 200 sessionResponseSchema. Terminal/expired -> 409 SESSION_EXPIRED.
// POST /api/sessions/[id]/end (endRequestSchema) -> 200 sessionResponseSchema; idempotent, retries pending remote cleanup.
export const startResponseSchema = z.object({ session: sessionSchema, credential: mediaCredentialSchema }).strict();
export const sessionResponseSchema = z.object({ session: sessionSchema }).strict();
export type StartResponse = z.infer<typeof startResponseSchema>;

const transitions: Record<SessionStatus, readonly SessionStatus[]> = {
  connecting: ["active", "ending", "ended", "interrupted", "deleted"],
  active: ["ending", "ended", "interrupted", "deleted"],
  ending: ["ended", "interrupted", "deleted"],
  ended: ["deleted"], interrupted: ["deleted"], deleted: [],
};
export function canTransition(from: SessionStatus, to: SessionStatus) { return from === to || transitions[from].includes(to); }
