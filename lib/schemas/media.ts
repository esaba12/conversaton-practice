import { z } from "zod";
// Frozen after the 14:54 human preflight (usable video/speech, imperfect lip sync). Never contains API keys.
export const mediaCredentialSchema = z.object({
  provider: z.literal("tavus"),
  roomUrl: z.url().refine((value) => { const url = new URL(value); return url.protocol === "https:" && url.hostname.endsWith(".daily.co") && !url.search && !url.hash && !url.username && !url.password; }),
  meetingToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
}).strict();
export type MediaCredential = z.infer<typeof mediaCredentialSchema>;
export type MediaState = "idle" | "connecting" | "ready" | "interrupted" | "ended";

// "ready" fires once, only when counterpart audio and video tracks are both playable.
// "failed" and "remote-left" mean the controller has already torn down local media itself.
// A provider-ended call (Daily "ejected", e.g. max duration) is "remote-left", not a failure.
export type MediaEvent =
  | { type: "remote-stream"; stream: MediaStream | null }
  | { type: "local-preview"; stream: MediaStream | null }
  | { type: "ready" }
  | { type: "remote-left" }
  // One finished turn from the provider's transcription (Tavus conversation.utterance). Emitted only while the call is live.
  // Holders keep it in memory for an optional reflection; never persist or log it.
  | { type: "utterance"; speaker: "user" | "counterpart"; text: string }
  | { type: "failed"; reason: "join" | "credential_expired" | "video_lost" | "provider_error" | "microphone_denied" };

export interface MediaController {
  // Rejects after local teardown if joining fails; never retries a join with the same credential.
  // Resolves without error if end() interrupts the join. Single use.
  connect(credential: MediaCredential): Promise<void>;
  setMuted(muted: boolean): void;
  // Local preview only: never published to the call. Resolves whether a preview is active now;
  // denial, disabling, or being superseded by a newer request resolves false.
  setCamera(enabled: boolean): Promise<boolean>;
  // Idempotent, synchronous-first local release; never awaits the application server.
  end(): Promise<void>;
}
export type CreateMediaController = (onEvent: (event: MediaEvent) => void) => MediaController;
