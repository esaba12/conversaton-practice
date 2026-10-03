import type { z } from "zod";
import { draftResponseSchema, type DraftRequest, type DraftResponse } from "@/lib/schemas/draft";
import { errorSchema, type ErrorCode } from "@/lib/schemas/errors";
import type { RoleContext } from "@/lib/schemas/role-context";
import { sessionResponseSchema, startResponseSchema, type EndReason, type PracticeSession, type StartResponse } from "@/lib/schemas/session";

export type SessionClientErrorCode = ErrorCode | "NETWORK" | "MALFORMED_RESPONSE";

export class SessionClientError extends Error {
  constructor(public code: SessionClientErrorCode, message: string, public status: number | null, public retryable: boolean, public sessionId?: string) { super(message); this.name = "SessionClientError"; }
}

async function post<T>(path: string, body: unknown, schema: z.ZodType<T>, init: { keepalive?: boolean } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin", cache: "no-store", keepalive: init.keepalive ?? false });
  } catch {
    throw new SessionClientError("NETWORK", "The server could not be reached.", null, true);
  }
  let json: unknown;
  try { json = await response.json(); } catch { json = undefined; }
  if (!response.ok) {
    const parsed = errorSchema.safeParse(json);
    if (parsed.success) throw new SessionClientError(parsed.data.code, parsed.data.message, response.status, parsed.data.retryable, parsed.data.session_id);
    throw new SessionClientError("MALFORMED_RESPONSE", "The server returned an unexpected response.", response.status, response.status >= 500);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new SessionClientError("MALFORMED_RESPONSE", "The server returned an unexpected response.", response.status, false);
  return parsed.data;
}

export function generateDraft(input: DraftRequest): Promise<DraftResponse> {
  const body: DraftRequest = { situation: input.situation };
  if (input.goal !== undefined) body.goal = input.goal;
  if (input.privateNotes !== undefined) body.privateNotes = input.privateNotes;
  return post("/api/scenarios/draft", body, draftResponseSchema);
}

// Only the reviewed role leaves the browser; goal and private notes never enter the start request.
export function startSession({ role, durationSeconds, idempotencyKey = crypto.randomUUID() }: { role: RoleContext; durationSeconds: 180 | 300; idempotencyKey?: string }): Promise<StartResponse> {
  const { name, role: roleText, style, publicContext, opening, constraints, challenge, pace } = role;
  return post("/api/sessions", { idempotencyKey, role: { name, role: roleText, style, publicContext, opening, constraints: [...constraints], challenge, pace }, durationSeconds }, startResponseSchema);
}

export async function markConnected(id: string): Promise<PracticeSession> {
  return (await post(`/api/sessions/${encodeURIComponent(id)}/connected`, {}, sessionResponseSchema)).session;
}

export async function endSession(id: string, reason: EndReason, options: { keepalive?: boolean } = {}): Promise<PracticeSession> {
  return (await post(`/api/sessions/${encodeURIComponent(id)}/end`, { reason }, sessionResponseSchema, options)).session;
}
