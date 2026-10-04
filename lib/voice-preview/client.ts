import { errorSchema, type ErrorCode } from "@/lib/schemas/errors";
import type { SessionPreset } from "@/lib/schemas/situation";

export type VoicePreviewErrorCode = ErrorCode | "NETWORK" | "MALFORMED_RESPONSE";
export class VoicePreviewError extends Error {
  constructor(public code: VoicePreviewErrorCode, message: string) { super(message); this.name = "VoicePreviewError"; }
}

// Takes only the reviewed opening line and the starter id; the goal, hard-moment line and notes have no way in.
export async function fetchVoicePreview(text: string, presetId?: SessionPreset): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch("/api/voice-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(presetId ? { text, presetId } : { text }),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new VoicePreviewError("NETWORK", "The server could not be reached.");
  }
  if (!response.ok) {
    const parsed = errorSchema.safeParse(await response.json().catch(() => undefined));
    throw parsed.success ? new VoicePreviewError(parsed.data.code, parsed.data.message) : new VoicePreviewError("MALFORMED_RESPONSE", "The server returned an unexpected response.");
  }
  if (!(response.headers.get("content-type") ?? "").startsWith("audio/mpeg")) throw new VoicePreviewError("MALFORMED_RESPONSE", "The server returned an unexpected response.");
  return response.blob();
}
