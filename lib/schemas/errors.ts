import { z } from "zod";
export const errorCodeSchema = z.enum(["UNAUTHENTICATED", "FORBIDDEN", "VALIDATION_ERROR", "VERSION_CONFLICT", "SESSION_ACTIVE", "PROVIDER_UNAVAILABLE", "USAGE_LIMIT", "DELETION_PENDING", "NOT_CONFIGURED", "SESSION_EXPIRED", "OUT_OF_SCOPE", "INTERNAL_ERROR"]);
// session_id is set only on SESSION_ACTIVE, naming the caller's own active lease so it can be ended.
export const errorSchema = z.object({ code: errorCodeSchema, message: z.string(), retryable: z.boolean(), request_id: z.uuid(), session_id: z.uuid().optional() });
export type ErrorCode = z.infer<typeof errorCodeSchema>;
export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public status = 400, public retryable = false, public sessionId?: string) { super(message); }
}
