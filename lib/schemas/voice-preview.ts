import { z } from "zod";
import { sessionPresetSchema } from "./situation";

// W3 "Hear {name}": receives only the opening line. The server maps the preset (or the default) to a voice; no voice id reaches the browser.
export const voicePreviewRequestSchema = z.object({
  text: z.string().trim().min(1).max(300),
  presetId: sessionPresetSchema.optional(),
}).strict();
export type VoicePreviewRequest = z.infer<typeof voicePreviewRequestSchema>;
// Per signed-in user, per server process.
export const VOICE_PREVIEW_RATE_LIMIT = { max: 10, windowMs: 10 * 60_000 } as const;

// HTTP contract (1E). POST /api/voice-preview (voicePreviewRequestSchema, body ≤ 1024 chars) -> 200 audio/mpeg, Cache-Control: no-store.
// 401 UNAUTHENTICATED; 400 VALIDATION_ERROR (including an unknown preset); 429 USAGE_LIMIT; 503 PROVIDER_UNAVAILABLE / NOT_CONFIGURED.
