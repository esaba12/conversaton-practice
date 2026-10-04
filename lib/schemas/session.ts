import { z } from "zod";
import { mediaCredentialSchema } from "./media";
import { versionSchema } from "./people";
import { roleContextSchema } from "./role-context";
export const sessionStatusSchema = z.enum(["connecting", "active", "ending", "ended", "interrupted", "deleted"]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export const cleanupSchema = z.enum(["not_started", "pending", "confirmed", "unresolved"]);
const durationSchema = z.union([z.literal(180), z.literal(300)]);
// Fixture presets only. Any other string is rejected before a provider call.
export const sessionPresetSchema = z.union([z.literal("roommate"), z.literal("professor"), z.literal("decline")]);
export type SessionPreset = z.infer<typeof sessionPresetSchema>;
// The fixture preset, a user-reviewed role, or a saved person. The strict role schema rejects private fields; no other client field is forwarded.
// A preset start sends only the id; the server loads that fixture. A saved person sends only its ID and version; the server loads the person and its shared facts for the signed-in owner.
export const startRequestSchema = z.union([
  z.object({ idempotencyKey: z.uuid(), preset: sessionPresetSchema, durationSeconds: durationSchema }).strict(),
  z.object({ idempotencyKey: z.uuid(), role: roleContextSchema, durationSeconds: durationSchema }).strict(),
  z.object({ idempotencyKey: z.uuid(), personId: z.uuid(), expectedVersion: versionSchema, durationSeconds: durationSchema }).strict(),
]);
export type StartRequest = z.infer<typeof startRequestSchema>;
export const endRequestSchema = z.object({ reason: z.enum(["user", "auth_loss", "navigation", "connection_failure", "time_limit"]) }).strict();
export type EndReason = z.infer<typeof endRequestSchema>["reason"];
export const sessionSchema = z.object({ id: z.uuid(), status: sessionStatusSchema, expiresAt: z.iso.datetime(), cleanup: cleanupSchema });
export type PracticeSession = z.infer<typeof sessionSchema>;

// HTTP contract. Errors use errorSchema with the listed HTTP status.
// POST /api/sessions (startRequestSchema, body ≤ 8192 chars) -> 201 startResponseSchema. Replays/an existing lease -> 409 SESSION_ACTIVE with session_id,
// even when a replayed key's session has since ended; the client then starts with a fresh key.
// Saved-person start: 404 NOT_FOUND (missing or another owner's person), 409 VERSION_CONFLICT (stale expectedVersion), before any provider call.
// The version check precedes the lease check, so a retry after the person changed gets VERSION_CONFLICT: reload, then start with a fresh key.
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
