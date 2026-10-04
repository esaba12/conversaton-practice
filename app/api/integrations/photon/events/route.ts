import { handlePhotonWebhook } from "@/lib/text/inbound";

// Spectrum posts from its own origin. Do not use handle(): same-origin rejection would answer 403 before the signature check.
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 100_000) return new Response("ok");
  return handlePhotonWebhook(raw, request.headers);
}
