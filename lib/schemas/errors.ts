import { z } from "zod";
export const errorCodeSchema = z.enum(["UNAUTHENTICATED", "FORBIDDEN", "VALIDATION_ERROR", "VERSION_CONFLICT", "SESSION_ACTIVE", "PROVIDER_UNAVAILABLE", "USAGE_LIMIT", "DELETION_PENDING", "NOT_CONFIGURED", "SESSION_EXPIRED"]);
export const errorSchema = z.object({ code: errorCodeSchema, message: z.string(), retryable: z.boolean(), request_id: z.uuid() });
export type ErrorCode = z.infer<typeof errorCodeSchema>;
export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public status = 400, public retryable = false) { super(message); }
}
