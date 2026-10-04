import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SEC = 5 * 60;

// Stable Spectrum verifier (https://photon.codes/docs/webhooks/verifying-signatures).
// The signature covers the raw body and the timestamp. Compare the full `v0=` header.
export function verifyPhotonWebhook(rawBody: string, signingSecret: string, signature: string, timestamp: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!rawBody || !signingSecret || !signature || !timestamp) return false;
  const stamped = Number(timestamp);
  if (!Number.isFinite(stamped) || Math.abs(nowSeconds - stamped) > TOLERANCE_SEC) return false;
  const expected = "v0=" + createHmac("sha256", signingSecret).update(`v0:${timestamp}:${rawBody}`).digest("hex");
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
