// User-facing strings and the small pure helpers that pick them. Moved out of
// app/practice/practice-workspace.tsx unchanged (W1). Copy is identical.

import type { MediaEvent } from "@/lib/schemas/media";
import { SessionClientError } from "@/lib/session/api-client";
import type { Cleanup } from "./types";

export const FALLBACK_GOAL = "Say what matters to you.";
export const GENERATION_FAILED = "We couldn’t generate a setup right now.";
export const REFLECTION_FAILED = "The reflection couldn’t be generated. Your own notes still count.";

export const failureMessages: Record<Extract<MediaEvent, { type: "failed" }>["reason"], string> = {
  join: "We couldn’t join the call.",
  credential_expired: "The call link expired before it connected.",
  video_lost: "The counterpart’s video stopped, so the call was ended.",
  provider_error: "The call provider had a problem, so the call was ended.",
  microphone_denied: "Microphone access is needed to practice. Allow it in your browser settings, then start again.",
};

export function reflectionError(error: unknown, closeFailed: boolean): { message: string; retry: boolean } {
  const code = error instanceof SessionClientError ? error.code : null;
  if (code === "USAGE_LIMIT") return { message: "You’ve reached the reflection limit for this practice. Your own notes still count.", retry: false };
  if (code === "SESSION_ACTIVE") return closeFailed
    ? { message: "The practice session isn’t closed yet. Use Retry closing session, then try again.", retry: true }
    : { message: "The call is still closing. Try again in a moment.", retry: true };
  if (code === "NOT_FOUND") return { message: "This practice is no longer available to reflect on.", retry: false };
  if (code === "NOT_CONFIGURED" || code === "VALIDATION_ERROR") return { message: REFLECTION_FAILED, retry: false };
  return { message: REFLECTION_FAILED, retry: true };
}

export function cleanupMessage(cleanup: Cleanup | null) {
  if (!cleanup) return "";
  if (cleanup.state === "closing") return "Closing the practice session…";
  if (cleanup.state === "unreachable") return "We couldn’t reach the server to close the practice session.";
  if (cleanup.cleanup === "confirmed") return "The call provider confirmed the session is closed.";
  if (cleanup.cleanup === "pending") return "Closing the remote call session is still pending.";
  if (cleanup.cleanup === "unresolved") return "We couldn’t confirm the remote call session closed.";
  return "Remote call cleanup has not started yet.";
}
