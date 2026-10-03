import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/schemas/errors";
import { buildRoleContext, type RoleContext } from "@/lib/schemas/role-context";
import { mediaCredentialSchema } from "@/lib/schemas/media";

const createdSchema = z.object({ conversation_id: z.string().min(1), conversation_url: z.url(), meeting_token: z.string().min(1) });
function configuration() {
  const key = process.env.TAVUS_API_KEY, pal = process.env.TAVUS_PAL_ID, face = process.env.TAVUS_FACE_ID;
  if (!key || !pal || !face) throw new AppError("NOT_CONFIGURED", "Live practice is not configured yet.", 503);
  return { key, pal, face };
}
export function assertTavusConfigured() { configuration(); }
async function request(path: string, method: string, body?: unknown, timeoutMs = 25_000) {
  const { key } = configuration();
  let response: Response;
  try {
    response = await fetch(`https://tavusapi.com/v2/${path}`, { method, headers: { "x-api-key": key, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  } catch { throw new AppError("PROVIDER_UNAVAILABLE", "The call provider could not be reached.", 503, true); }
  if (!response.ok) throw new AppError("PROVIDER_UNAVAILABLE", "The call provider could not complete the request.", 503, true);
  return response;
}
export function conversationBody(role: RoleContext, durationSeconds: 180 | 300) {
  const { pal, face } = configuration();
  return { pal_id: pal, face_id: face, audio_only: false, require_auth: true, max_participants: 2, participant_tags: [], conversational_context: buildRoleContext(role), custom_greeting: role.opening,
    properties: { max_call_duration: durationSeconds, participant_left_timeout: 10, participant_absent_timeout: 120, enable_recording: false, auto_start_recording: false, enable_closed_captions: false, languages: ["en"] } };
}
export async function createConversation(role: RoleContext, durationSeconds: 180 | 300) {
  // No automatic POST retry: a timeout can have created a billable remote call.
  const requestedAt = Date.now();
  const response = await request("conversations", "POST", conversationBody(role, durationSeconds));
  const raw: unknown = await response.json();
  const parsed = createdSchema.safeParse(raw);
  if (!parsed.success) {
    const association = z.object({ conversation_id: z.string().min(1) }).safeParse(raw);
    if (association.success) await stopConversation(association.data.conversation_id);
    throw new AppError("PROVIDER_UNAVAILABLE", "The provider returned an incomplete call configuration.", 503);
  }
  const data = parsed.data;
  const credential = mediaCredentialSchema.safeParse({ provider: "tavus", roomUrl: data.conversation_url, meetingToken: data.meeting_token, expiresAt: new Date(requestedAt + 110_000).toISOString() });
  if (!credential.success) {
    await stopConversation(data.conversation_id);
    throw new AppError("PROVIDER_UNAVAILABLE", "The provider returned an unsupported call configuration.", 503);
  }
  return { providerId: data.conversation_id, credential: credential.data };
}
// Cleanup calls use short timeouts so End stays bounded. A failed End POST (e.g. already ended) still verifies status.
export async function endConversation(providerId: string, timeoutMs = 8_000) {
  await request(`conversations/${encodeURIComponent(providerId)}/end`, "POST", undefined, timeoutMs).catch(() => undefined);
  const result = await request(`conversations/${encodeURIComponent(providerId)}`, "GET", undefined, timeoutMs);
  const parsed = z.object({ status: z.string() }).safeParse(await result.json());
  return parsed.success && parsed.data.status === "ended";
}
export async function deleteConversation(providerId: string, timeoutMs = 8_000) {
  await request(`conversations/${encodeURIComponent(providerId)}?hard=true`, "DELETE", undefined, timeoutMs);
}
// True only when the remote call is verified ended and then hard-deleted.
export async function stopConversation(providerId: string) {
  try {
    if (!(await endConversation(providerId))) return false;
    await deleteConversation(providerId);
    return true;
  } catch { return false; }
}
