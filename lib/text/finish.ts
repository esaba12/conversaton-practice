import "server-only";
import { z } from "zod";
import type { Db } from "@/lib/data/sessions";
import { AppError } from "@/lib/schemas/errors";
import { cleanupSchema, sessionSchema, sessionStatusSchema } from "@/lib/schemas/session";
import { CLOSING_LINE } from "./commands";
import { sendImessage } from "./photon";
import { endText, linkedPhone } from "./store";

const ended = z.object({
  id: z.uuid(),
  status: sessionStatusSchema,
  expires_at: z.string(),
  cleanup: cleanupSchema,
});

// Ends a text lease without the video cleanup path. Turns stay until reflection.
export async function finishTextSession(db: Db, id: string, reason: "user" | "auth_loss" | "navigation" | "connection_failure" | "time_limit") {
  const parsed = ended.safeParse(await endText(db, id, reason));
  if (!parsed.success) throw new AppError("PROVIDER_UNAVAILABLE", "Text storage is unavailable. Try again shortly.", 503, true);
  if (reason === "user") {
    try { await sendImessage(await linkedPhone(db), CLOSING_LINE); } catch { /* the lease is already ended */ }
  }
  const expires = new Date(parsed.data.expires_at);
  return {
    session: sessionSchema.parse({
      id: parsed.data.id,
      status: parsed.data.status,
      expiresAt: Number.isNaN(expires.getTime()) ? new Date().toISOString() : expires.toISOString(),
      cleanup: parsed.data.cleanup,
    }),
  };
}
