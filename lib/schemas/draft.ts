import { z } from "zod";
import { baseRoleContextSchema, roleContextSchema, stanceChipSchema } from "./role-context";

// Private notes may shape the draft only; they are never stored, returned, or sent to the call provider.
// With personId the server loads that owner's person identity (never shared facts or private prep) and drafts the situation only.
export const draftRequestSchema = z.object({
  situation: z.string().trim().min(1).max(1000),
  goal: z.string().trim().min(1).max(200).optional(),
  privateNotes: z.string().trim().min(1).max(1000).optional(),
  personId: z.uuid().optional(),
}).strict();
export type DraftRequest = z.infer<typeof draftRequestSchema>;

// Q2: three to four chips per stance field; the first chip of each list is the default and equals the role's field.
const stanceChoices = z.array(stanceChipSchema).min(3).max(4);
export const stanceOptionsSchema = z.object({
  wants: stanceChoices,
  holdsBackBecause: stanceChoices,
  softensWhen: stanceChoices,
}).strict();
export type StanceOptions = z.infer<typeof stanceOptionsSchema>;

// The goal is reflection metadata for the user; it is not part of the counterpart's role context.
// stanceOptions is optional until 1C generates it (C1 staging); 1C makes it required with the prompt change.
export const draftResponseSchema = z.object({
  role: roleContextSchema,
  goal: z.string().trim().min(1).max(200),
  assumptions: z.array(z.string().trim().min(1).max(200)).max(5),
  stanceOptions: stanceOptionsSchema.optional(),
}).strict();
export type DraftResponse = z.infer<typeof draftResponseSchema>;

// Model output: when outOfScope is true the rest is ignored and the route returns OUT_OF_SCOPE.
// Strict structured output makes every property required, so stance fields join the model output with 1C's prompt version, not before.
export const draftModelOutputSchema = z.object({
  outOfScope: z.boolean(),
  role: baseRoleContextSchema,
  goal: draftResponseSchema.shape.goal,
  assumptions: draftResponseSchema.shape.assumptions,
}).strict();
export type DraftModelOutput = z.infer<typeof draftModelOutputSchema>;

// Per signed-in user, per server process (not shared across instances or restarts). A request is counted before the model call.
export const DRAFT_RATE_LIMIT = { max: 8, windowMs: 10 * 60_000 } as const;

// HTTP contract. Errors use errorSchema with the listed HTTP status.
// POST /api/scenarios/draft (draftRequestSchema, body ≤ 4096 chars) -> 200 draftResponseSchema. No persistence.
// 401 UNAUTHENTICATED before any model call; 400 VALIDATION_ERROR; 422 OUT_OF_SCOPE (not retryable, offer an ordinary scenario);
// 404 NOT_FOUND for a missing or another owner's personId, before any model call (1C);
// 429 USAGE_LIMIT (not retryable now; more than DRAFT_RATE_LIMIT.max requests in the window, checked after auth and validation, before any model call);
// 503 PROVIDER_UNAVAILABLE retryable (network, refusal, or invalid output after one retry); 503 NOT_CONFIGURED.
// W11 (1C): with `Accept: text/event-stream` the route streams completed fields, then exactly one validated `done` event, or one `error` and no `done`.
// A JSON request is unchanged.
