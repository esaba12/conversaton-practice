import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Db } from "@/lib/data/sessions";
import { AppError, type ErrorCode } from "@/lib/schemas/errors";
import { roleContextSchema, roleExtrasSchema, type RoleContext, type RoleExtras } from "@/lib/schemas/role-context";

const markers: Record<string, [ErrorCode, string, number]> = {
  FORBIDDEN: ["FORBIDDEN", "That text practice is not available.", 403],
  INVALID_INPUT: ["VALIDATION_ERROR", "The request was not valid.", 400],
  ALREADY_LINKED: ["VALIDATION_ERROR", "Remove your number before adding another.", 409],
  LIMIT_REACHED: ["USAGE_LIMIT", "Wait a bit before requesting another code.", 429],
  NOT_LINKED: ["VALIDATION_ERROR", "Add your number before texting a practice.", 409],
  NOT_FOUND: ["NOT_FOUND", "That person was not found.", 404],
  VERSION_CONFLICT: ["VERSION_CONFLICT", "This person changed. Reload and try again.", 409],
  SESSION_ACTIVE: ["SESSION_ACTIVE", "You already have a practice session in progress.", 409],
  IDEMPOTENCY_CONFLICT: ["VALIDATION_ERROR", "This start request was already used with different settings.", 409],
};
const unavailable = () => new AppError("PROVIDER_UNAVAILABLE", "Text storage is unavailable. Try again shortly.", 503, true);

export function textSecret() {
  const secret = process.env.SESSION_SERVER_SECRET;
  if (!secret || secret.length < 32) throw new AppError("NOT_CONFIGURED", "Text practice is not configured yet.", 503);
  return secret;
}

export function digest(value: string) {
  return createHash("sha256").update(`${textSecret()}:${value}`).digest("hex");
}

export function newCode() {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = randomBytes(10);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

function fail(error: { code?: string; message?: string } | null): never {
  const known = error?.code === "P0001" && error.message ? markers[error.message] : undefined;
  throw known ? new AppError(...known) : unavailable();
}

async function call(db: { rpc: SupabaseClient["rpc"] } | Db, name: string, args: Record<string, unknown>) {
  let result: { data: unknown; error: { code?: string; message?: string } | null };
  try { result = await db.rpc(name, args); } catch { throw unavailable(); }
  if (result.error) fail(result.error);
  return result.data;
}

function anon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new AppError("NOT_CONFIGURED", "Text practice is not configured yet.", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const linkStatusSchema = z.object({ linked: z.boolean(), phone_last4: z.string().length(4).optional() });
const acquiredSchema = z.object({ created: z.boolean(), session: z.object({ id: z.uuid(), status: z.string(), expires_at: z.string(), cleanup: z.string(), channel: z.literal("text").optional() }).loose() });

export async function beginLink(db: Db, phone: string, code: string) {
  const data = await call(db, "text_link_begin", { p_secret: textSecret(), p_phone: phone, p_code_hash: digest(code) });
  const expires = z.object({ expires_at: z.string() }).safeParse(data);
  if (!expires.success) throw unavailable();
  return { code, expiresAt: new Date(expires.data.expires_at).toISOString() };
}

export async function linkStatus(db: Db) {
  const parsed = linkStatusSchema.safeParse(await call(db, "text_link_status", {}));
  if (!parsed.success) throw unavailable();
  return { linked: parsed.data.linked, phoneLast4: parsed.data.phone_last4 };
}

export async function linkedPhone(db: Db) {
  const data = await call(db, "text_link_phone", { p_secret: textSecret() });
  const phone = z.string().safeParse(data);
  if (!phone.success) throw unavailable();
  return phone.data;
}

export const unlinkPhone = (db: Db) => call(db, "text_unlink", { p_secret: textSecret() });

export async function acquireText(db: Db, key: string, fingerprint: string, person: { id: string; version: number } | null, preset: string | null) {
  const parsed = acquiredSchema.safeParse(await call(db, "practice_text_acquire", {
    p_secret: textSecret(), p_key: key, p_fingerprint: fingerprint,
    p_person_id: person?.id ?? null, p_person_version: person?.version ?? null, p_preset: preset,
  }));
  if (!parsed.success) throw unavailable();
  return parsed.data;
}

export const saveTextState = (db: Db, id: string, role: RoleContext, extras: RoleExtras, opening: string) => call(db, "text_state_save", {
  p_secret: textSecret(), p_id: id, p_role: role, p_extras: extras, p_opening: opening,
});

export const markTextActive = (db: Db, id: string) => call(db, "text_mark_active", { p_secret: textSecret(), p_id: id });
export const readOpening = async (db: Db, id: string) => {
  const data = await call(db, "text_opening", { p_secret: textSecret(), p_id: id });
  const opening = z.string().safeParse(data);
  if (!opening.success) throw unavailable();
  return opening.data;
};
export const endText = (db: Db, id: string, reason: string) => call(db, "text_end", { p_secret: textSecret(), p_id: id, p_reason: reason });

const turnSchema = z.object({ speaker: z.enum(["user", "counterpart"]), text: z.string() });
export async function readTextTurns(db: Db, id: string) {
  const parsed = z.array(turnSchema).safeParse(await call(db, "text_turns_read", { p_secret: textSecret(), p_id: id }));
  if (!parsed.success) throw unavailable();
  return parsed.data;
}
export const purgeTextTurns = (db: Db, id: string) => call(db, "text_turns_purge", { p_secret: textSecret(), p_id: id });

const inboundSchema = z.object({
  action: z.enum(["duplicate", "linked", "phone_taken", "unlinked", "video_busy", "hold", "turn", "final", "capped", "end", "card", "attachment"]),
  session_id: z.uuid().optional(),
  user_turns: z.number().int().optional(),
  role: roleContextSchema.optional(),
  extras: roleExtrasSchema.optional(),
  turns: z.array(turnSchema).optional(),
}).passthrough();

export async function inbound(messageId: string, phone: string, spaceId: string, body: string, kind: "text" | "code" | "end" | "other", codeHash: string | null) {
  const parsed = inboundSchema.safeParse(await call(anon(), "text_inbound", {
    p_secret: textSecret(), p_message_id: messageId, p_phone: phone, p_space_id: spaceId, p_body: body, p_kind: kind, p_code_hash: codeHash,
  }));
  if (!parsed.success) throw unavailable();
  return parsed.data;
}

export async function turnCount(sessionId: string) {
  const data = await call(anon(), "text_turn_count", { p_secret: textSecret(), p_session_id: sessionId });
  const count = z.number().int().safeParse(data);
  if (!count.success) throw unavailable();
  return count.data;
}
export const activatePick = (sessionId: string) => call(anon(), "text_pick_activate", { p_secret: textSecret(), p_session_id: sessionId });
export const recordReply = (sessionId: string, body: string) => call(anon(), "text_record_reply", { p_secret: textSecret(), p_session_id: sessionId, p_body: body });
export const endInbound = (sessionId: string, reason: "user" | "time_limit" | "connection_failure") => call(anon(), "text_end_inbound", { p_secret: textSecret(), p_session_id: sessionId, p_reason: reason });
export const savePickToken = (tokenHash: string, phone: string, spaceId: string) => call(anon(), "text_pick_save", { p_secret: textSecret(), p_token_hash: tokenHash, p_phone: phone, p_space_id: spaceId });

const catalogPerson = z.object({
  id: z.uuid(), version: z.number().int(), name: z.string(), relationship: z.string(),
  situations: z.array(z.object({ id: z.uuid(), label: z.string() })),
});
export async function pickCatalog(tokenHash: string) {
  const data = await call(anon(), "text_pick_catalog", { p_secret: textSecret(), p_token_hash: tokenHash });
  if (data === null) return null;
  const parsed = z.array(catalogPerson).safeParse(data);
  if (!parsed.success) throw unavailable();
  return parsed.data;
}

export async function pickPerson(tokenHash: string, personId: string, version: number, situationId: string | null) {
  return call(anon(), "text_pick_person", {
    p_secret: textSecret(), p_token_hash: tokenHash, p_person_id: personId, p_version: version, p_situation_id: situationId,
  });
}

export async function pickCommit(input: {
  tokenHash: string; person: { id: string; version: number } | null; preset: string | null;
  role: RoleContext; extras: RoleExtras; opening: string; fingerprint: string;
}) {
  const data = await call(anon(), "text_pick_commit", {
    p_secret: textSecret(), p_token_hash: input.tokenHash, p_key: randomUUID(), p_fingerprint: input.fingerprint,
    p_person_id: input.person?.id ?? null, p_person_version: input.person?.version ?? null, p_preset: input.preset,
    p_role: input.role, p_extras: input.extras, p_opening: input.opening,
  });
  const parsed = z.object({ session: z.object({ id: z.uuid() }).loose(), phone: z.string() }).safeParse(data);
  if (!parsed.success) throw unavailable();
  return { sessionId: parsed.data.session.id, phone: parsed.data.phone };
}
