import "server-only";
import { AppError } from "@/lib/schemas/errors";
import type { SessionPreset } from "@/lib/schemas/situation";
import { VOICE_PREVIEW_RATE_LIMIT } from "@/lib/schemas/voice-preview";

// The starter PALs are provisioned with this model (scripts/preflight/starter-faces.mjs); keep the two in step.
const DEFAULT_TTS_MODEL = "eleven_v4_turbo";
const TIMEOUT_MS = 15_000;

// Same env names as lib/media/presets.server.ts, so the preview uses the voice the call will use. Ids stay on the server.
export function voicePreviewConfiguration(presetId?: SessionPreset) {
  const key = process.env.ELEVENLABS_API_KEY;
  // A starter never borrows the default voice: the preview must be the voice its call uses.
  const voiceId = presetId ? process.env[`ELEVENLABS_STARTER_${presetId.toUpperCase()}_VOICE_ID`] : process.env.ELEVENLABS_VOICE_ID;
  const model = process.env.ELEVENLABS_PREVIEW_TTS_MODEL || DEFAULT_TTS_MODEL;
  if (!key || !voiceId) throw new AppError("NOT_CONFIGURED", "Voice preview isn't set up.", 503);
  return { key, voiceId, model };
}

// Per server process only: restarts and other instances each keep their own counts.
const MAX_TRACKED = 1_000;
const requests = new Map<string, number[]>();

// Sliding window, counted before the provider call and never released.
export function reserveVoicePreview(userId: string, now = Date.now()) {
  const recent = (requests.get(userId) ?? []).filter((at) => now - at < VOICE_PREVIEW_RATE_LIMIT.windowMs);
  if (recent.length >= VOICE_PREVIEW_RATE_LIMIT.max) {
    requests.set(userId, recent);
    throw new AppError("USAGE_LIMIT", "You've played several previews in a short time. Try again in a few minutes.", 429);
  }
  requests.delete(userId);
  requests.set(userId, [...recent, now]);
  while (requests.size > MAX_TRACKED) requests.delete(requests.keys().next().value!);
}

export function resetVoicePreviewLimitsForTests() { requests.clear(); }

// The text is the reviewed opening line only. The provider's audio streams straight through; nothing is kept.
export async function synthesizePreview(text: string, { key, voiceId, model }: { key: string; voiceId: string; model: string }): Promise<Response> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_128`;
  const upstream = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);
  if (!upstream?.ok || !upstream.body) throw new AppError("PROVIDER_UNAVAILABLE", "The voice preview is unavailable right now.", 503, true);
  return new Response(upstream.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
