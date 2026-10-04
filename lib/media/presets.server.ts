import "server-only";
import { AppError } from "@/lib/schemas/errors";
import { sessionPresetSchema, type SessionPreset } from "@/lib/schemas/situation";

// Starter faces (03-CONTRACTS §2.9). Ids live only in server env; none reaches the browser.
// Starters sharing a voice share a PAL. Missing env falls back to the default PAL, face and voice.
export type StarterMedia = { palId: string; faceId: string; voiceId: string };

function envFor(preset: SessionPreset) {
  const key = preset.toUpperCase();
  return { pal: `TAVUS_STARTER_${key}_PAL_ID`, face: `TAVUS_STARTER_${key}_FACE_ID`, voice: `ELEVENLABS_STARTER_${key}_VOICE_ID` };
}

export function starterMedia(preset: SessionPreset): StarterMedia | null {
  const names = envFor(preset);
  const palId = process.env[names.pal] || process.env.TAVUS_PAL_ID;
  const faceId = process.env[names.face] || process.env.TAVUS_FACE_ID;
  const voiceId = process.env[names.voice] || process.env.ELEVENLABS_VOICE_ID;
  return palId && faceId && voiceId ? { palId, faceId, voiceId } : null;
}

const portraitCache = new Map<string, { url: string; expires: number }>();
const PORTRAIT_URL_TTL_MS = 6 * 60 * 60_000;
// SPIKE-01: face stills are served from this host. Anything else is refused, including redirects.
const PORTRAIT_CDN_HOST = "cdn.replica.tavus.io";

export function allowedPortraitUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== PORTRAIT_CDN_HOST || url.port !== "" || url.username || url.password) return null;
    return url.toString();
  } catch { return null; }
}

// Resolves the starter's face still from Tavus. The CDN URL stays on the server; the route streams the image.
export async function starterPortrait(presetId: string): Promise<Response> {
  const parsed = sessionPresetSchema.safeParse(presetId);
  if (!parsed.success) throw new AppError("NOT_FOUND", "That portrait was not found.", 404);
  const media = starterMedia(parsed.data);
  const key = process.env.TAVUS_API_KEY;
  if (!media || !key) throw new AppError("NOT_CONFIGURED", "Portraits are not configured yet.", 503);
  let cached = portraitCache.get(media.faceId);
  if (!cached || cached.expires < Date.now()) {
    const face = await fetch(`https://tavusapi.com/v2/faces/${encodeURIComponent(media.faceId)}`, { headers: { "x-api-key": key }, redirect: "error", signal: AbortSignal.timeout(8_000) }).catch(() => null);
    const url = face?.ok ? allowedPortraitUrl(((await face.json()) as { thumbnail_image_url?: unknown }).thumbnail_image_url) : null;
    if (!url) throw new AppError("PROVIDER_UNAVAILABLE", "The portrait is unavailable right now.", 503);
    cached = { url, expires: Date.now() + PORTRAIT_URL_TTL_MS };
    portraitCache.set(media.faceId, cached);
  }
  const image = await fetch(cached.url, { redirect: "error", signal: AbortSignal.timeout(8_000) }).catch(() => null);
  const type = imageType(image?.headers.get("content-type") ?? "", cached.url);
  if (!image?.ok || !image.body || !type) throw new AppError("PROVIDER_UNAVAILABLE", "The portrait is unavailable right now.", 503);
  return new Response(image.body, { headers: { "Content-Type": type, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" } });
}

// The CDN labels some stills binary/octet-stream; fall back to a known image extension only.
const extensionTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
function imageType(header: string, url: string): string | null {
  const declared = header.split(";")[0].trim().toLowerCase();
  if (/^image\/(jpeg|png|webp)$/.test(declared)) return declared;
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase() ?? "";
  return extensionTypes[extension] ?? null;
}
