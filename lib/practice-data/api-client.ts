import { deletePracticeDataResponseSchema, sessionListResponseSchema, type DeletePracticeDataResponse, type SessionSummary } from "@/lib/schemas/practice-data";
import { endSession, requestJson } from "@/lib/session/api-client";

export { SessionClientError } from "@/lib/session/api-client";

export async function listSessions(): Promise<SessionSummary[]> { return (await requestJson("GET", "/api/sessions", undefined, sessionListResponseSchema)).sessions; }
export function deletePracticeData(): Promise<DeletePracticeDataResponse> {
  return requestJson("DELETE", "/api/practice-data", { confirm: "delete my practice data" }, deletePracticeDataResponseSchema);
}
// End is idempotent and retries outstanding provider cleanup for an already-ended session.
export const retryCleanup = (id: string) => endSession(id, "user");
