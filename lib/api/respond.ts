import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError, errorSchema } from "@/lib/schemas/errors";

const invalid = () => new AppError("VALIDATION_ERROR", "The request was not valid.", 400);
export const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === request.headers.get("host"); } catch { return false; }
}
// Errors are always sanitized errorSchema JSON; unexpected failures never expose their message.
export async function handle(request: Request, run: () => Promise<Response>) {
  const requestId = randomUUID();
  try {
    if (!sameOrigin(request)) throw new AppError("FORBIDDEN", "Cross-site requests are not allowed.", 403);
    return await run();
  } catch (error) {
    const known = error instanceof AppError ? error : new AppError("INTERNAL_ERROR", "Something went wrong. Try again shortly.", 500);
    if (!(error instanceof AppError)) console.error(`session route failed request_id=${requestId}`);
    return json(errorSchema.parse({ code: known.code, message: known.message, retryable: known.retryable, request_id: requestId, session_id: known.sessionId }), known.status);
  }
}
// Reads text regardless of content type so navigator.sendBeacon bodies are accepted.
export async function readBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.output<T>> {
  const text = await request.text().catch(() => "");
  if (text.length > 2048) throw invalid();
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw invalid(); }
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw invalid();
  return parsed.data;
}
export function parseId(value: string) {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw invalid();
  return parsed.data;
}
