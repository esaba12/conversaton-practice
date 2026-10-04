import { z } from "zod";
import { mediaCredentialSchema } from "./media";
import { versionSchema } from "./people";
import { roleContextSchema } from "./role-context";
import { sessionPresetSchema, situationSchema } from "./situation";
export const sessionStatusSchema = z.enum(["connecting", "active", "ending", "ended", "interrupted", "deleted"]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export const cleanupSchema = z.enum(["not_started", "pending", "confirmed", "unresolved"]);
const durationSchema = z.union([z.literal(180), z.literal(300)]);
export { sessionPresetSchema, situationSchema, type SessionPreset, type Situation } from "./situation";
// docs/30 retry: the server resolves the role as usual, then replaces only `opening`.
const openingOverrideSchema = z.string().trim().min(1).max(300);

// The fixture preset, a user-reviewed role, or a saved person. The strict role schema rejects private fields.
// A reviewed role may also send `look` (a starter name). The server maps that name to a face and PAL. No provider id is accepted.
// A preset start sends only the id; the server loads that fixture. A saved person sends only its ID and version (and optionally a situation);
// the server loads the person and its shared facts for the signed-in owner. None of these bodies may carry the goal or hard-moment line.
export const presetStartSchema = z.object({ idempotencyKey: z.uuid(), preset: sessionPresetSchema, durationSeconds: durationSchema, openingOverride: openingOverrideSchema.optional() }).strict();
// `look` picks a stock face and premade voice for this call. It does not replace the reviewed role.
export const roleStartSchema = z.object({ idempotencyKey: z.uuid(), role: roleContextSchema, durationSeconds: durationSchema, look: sessionPresetSchema.optional() }).strict();
export const personStartSchema = z.object({ idempotencyKey: z.uuid(), personId: z.uuid(), expectedVersion: versionSchema, durationSeconds: durationSchema, openingOverride: openingOverrideSchema.optional() }).strict();
export const personSituationStartSchema = z.object({ idempotencyKey: z.uuid(), personId: z.uuid(), expectedVersion: versionSchema, situation: situationSchema, durationSeconds: durationSchema }).strict();

// W10 Show me first: the only start body that may carry the goal and hard-moment line. Built only by lib/practice/stand-in-client.ts.
const standInBase = {
  idempotencyKey: z.uuid(),
  standIn: z.literal(true),
  goal: z.string().trim().min(1).max(200),
  hardMomentLine: z.string().trim().min(1).max(200).optional(),
  durationSeconds: z.literal(180),
};
export const standInStartSchema = z.union([
  z.object({ ...standInBase, role: roleContextSchema }).strict(),
  z.object({ ...standInBase, preset: sessionPresetSchema }).strict(),
  z.object({ ...standInBase, personId: z.uuid(), expectedVersion: versionSchema, situation: situationSchema.optional() }).strict(),
]);
export type StandInStartRequest = z.infer<typeof standInStartSchema>;

export const startRequestSchema = z.union([presetStartSchema, roleStartSchema, personStartSchema, personSituationStartSchema, standInStartSchema]);
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
// Person + situation (P2, 1C): role = identity + situation, then buildRoleContext with traits and shared facts. Stand-in (W10, 1G): buildStandInContext,
// stand-in face and PAL from env, session kind 'stand_in'. Until those slices land, the server rejects these branches and openingOverride with 400.
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
