import { z } from "zod";

// G1 goal light. The goal and the user's own recent turns go only to our route, never to Tavus. Counterpart turns are not sent.
export const goalCheckRequestSchema = z.object({
  goal: z.string().trim().min(1).max(200),
  turns: z.array(z.string().trim().min(1).max(500)).min(1).max(6),
}).strict();
export type GoalCheckRequest = z.infer<typeof goalCheckRequestSchema>;
export const goalCheckResponseSchema = z.object({ met: z.boolean() }).strict();
export type GoalCheckResponse = z.infer<typeof goalCheckResponseSchema>;
// Model output (strict structured output); nothing is stored or logged.
export const goalCheckModelOutputSchema = goalCheckResponseSchema;
// Per session, per server process.
export const GOAL_CHECK_RATE_LIMIT = { minIntervalMs: 3_000, maxPerSession: 40 } as const;

// HTTP contract (1E). Errors use errorSchema with the listed HTTP status.
// POST /api/sessions/[id]/goal-check (goalCheckRequestSchema, body ≤ 4096 chars) -> 200 goalCheckResponseSchema.
// 401 UNAUTHENTICATED; 400 VALIDATION_ERROR; 404 NOT_FOUND unless the caller owns the session; 409 SESSION_EXPIRED unless it is active;
// 429 USAGE_LIMIT (faster than one per 3 s or more than 40 per session); 503 PROVIDER_UNAVAILABLE / NOT_CONFIGURED.
// Model: OPENAI_GOAL_CHECK_MODEL, falling back to OPENAI_SETUP_MODEL; `store: false`.
