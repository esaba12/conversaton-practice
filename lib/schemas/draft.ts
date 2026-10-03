import { z } from "zod";
import { roleContextSchema } from "./role-context";

// Private notes may shape the draft only; they are never stored, returned, or sent to the call provider.
export const draftRequestSchema = z.object({
  situation: z.string().trim().min(1).max(1000),
  goal: z.string().trim().min(1).max(200).optional(),
  privateNotes: z.string().trim().min(1).max(1000).optional(),
}).strict();
export type DraftRequest = z.infer<typeof draftRequestSchema>;

// The goal is reflection metadata for the user; it is not part of the counterpart's role context.
export const draftResponseSchema = z.object({
  role: roleContextSchema,
  goal: z.string().trim().min(1).max(200),
  assumptions: z.array(z.string().trim().min(1).max(200)).max(5),
}).strict();
export type DraftResponse = z.infer<typeof draftResponseSchema>;

// Model output: when outOfScope is true the rest is ignored and the route returns OUT_OF_SCOPE.
export const draftModelOutputSchema = z.object({ outOfScope: z.boolean(), ...draftResponseSchema.shape }).strict();
export type DraftModelOutput = z.infer<typeof draftModelOutputSchema>;

// Per signed-in user, per server process (not shared across instances or restarts). A request is counted before the model call.
export const DRAFT_RATE_LIMIT = { max: 8, windowMs: 10 * 60_000 } as const;

// HTTP contract. Errors use errorSchema with the listed HTTP status.
// POST /api/scenarios/draft (draftRequestSchema, body ≤ 4096 chars) -> 200 draftResponseSchema. No persistence.
// 401 UNAUTHENTICATED before any model call; 400 VALIDATION_ERROR; 422 OUT_OF_SCOPE (not retryable, offer an ordinary scenario);
// 429 USAGE_LIMIT (not retryable now; more than DRAFT_RATE_LIMIT.max requests in the window, checked after auth and validation, before any model call);
// 503 PROVIDER_UNAVAILABLE retryable (network, refusal, or invalid output after one retry); 503 NOT_CONFIGURED.
