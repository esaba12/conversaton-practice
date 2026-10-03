import "server-only";
import { AppError, type ErrorCode } from "@/lib/schemas/errors";
import type { Db } from "@/lib/data/sessions";

// P0001 markers raised by the G3 people/sharing RPCs (supabase/migrations/20261003211000_people_sharing.sql).
const markers: Record<string, [ErrorCode, string, number]> = {
  FORBIDDEN: ["UNAUTHENTICATED", "Sign in to continue.", 401],
  NOT_FOUND: ["NOT_FOUND", "That item was not found.", 404],
  INVALID_INPUT: ["VALIDATION_ERROR", "The request was not valid.", 400],
  VERSION_CONFLICT: ["VERSION_CONFLICT", "This was changed elsewhere. Reload to see the latest version.", 409],
  LIMIT_REACHED: ["USAGE_LIMIT", "You have reached the limit for saved items.", 409],
};
export const storageUnavailable = () => new AppError("PROVIDER_UNAVAILABLE", "Storage is unavailable. Try again shortly.", 503, true);

// Always the request-scoped user-JWT client; raw database errors never leave this function.
export async function rpc(db: Db, name: string, args: Record<string, unknown>): Promise<unknown> {
  let result: { data: unknown; error: { code?: string; message?: string } | null };
  try { result = await db.rpc(name, args); } catch { throw storageUnavailable(); }
  const { data, error } = result;
  if (!error) return data;
  const known = error.code === "P0001" && error.message ? markers[error.message] : undefined;
  throw known ? new AppError(...known) : storageUnavailable();
}
