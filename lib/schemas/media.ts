import { z } from "zod";
// Provisional until the live provider preflight passes. Never contains API keys.
export const mediaCredentialSchema = z.object({
  provider: z.literal("tavus"),
  roomUrl: z.url().refine((value) => { const url = new URL(value); return url.protocol === "https:" && url.hostname.endsWith(".daily.co") && !url.search && !url.hash && !url.username && !url.password; }),
  meetingToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
}).strict();
export type MediaCredential = z.infer<typeof mediaCredentialSchema>;
export type MediaState = "idle" | "connecting" | "ready" | "interrupted" | "ended";
export interface MediaController {
  connect(credential: MediaCredential): Promise<void>;
  setMuted(muted: boolean): void;
  setCamera(enabled: boolean): Promise<void>;
  end(): Promise<void>;
}
