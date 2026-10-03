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
export type MediaEvent =
  | { type: "remote-stream"; stream: MediaStream | null }
  | { type: "local-preview"; stream: MediaStream | null }
  | { type: "ready" }
  | { type: "remote-left" }
  | { type: "failed"; reason: "join" | "credential_expired" | "video_lost" | "provider_error" | "microphone_denied" };

export interface MediaController {
  // Rejects after local teardown if joining fails; never retries a join with the same credential.
  connect(credential: MediaCredential): Promise<void>;
  setMuted(muted: boolean): void;
  // Local preview only: never published to the call. Denial emits nothing and resolves false.
  setCamera(enabled: boolean): Promise<boolean>;
  // Idempotent, synchronous-first local release; never awaits the application server.
  end(): Promise<void>;
}
export type CreateMediaController = (onEvent: (event: MediaEvent) => void) => MediaController;
