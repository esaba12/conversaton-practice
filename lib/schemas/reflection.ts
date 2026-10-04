import { z } from "zod";

// G4 reflection (docs/05, docs/07). The transcript exists only in browser memory during and right after a call.
// It is sent once per request to the reflection model with storage disabled, and is never persisted or logged.
export const MAX_TRANSCRIPT_TURNS = 100;
export const MAX_TRANSCRIPT_CHARS = 40_000;
export const MAX_TURN_CHARS = 2_000;
export const MAX_REFLECTIONS_PER_SESSION = 3;

export const transcriptTurnSchema = z.object({
  speaker: z.enum(["user", "counterpart"]),
  text: z.string().trim().min(1).max(MAX_TURN_CHARS),
}).strict();
export type TranscriptTurn = z.infer<typeof transcriptTurnSchema>;

export const transcriptSchema = z.array(transcriptTurnSchema).max(MAX_TRANSCRIPT_TURNS)
  .refine((turns) => turns.reduce((total, turn) => total + turn.text.length, 0) <= MAX_TRANSCRIPT_CHARS, "Transcript too long");

// Keeps the most recent turns within the request limits. Pure; callers hold the result in memory only.
export function appendTurn(turns: readonly TranscriptTurn[], speaker: TranscriptTurn["speaker"], raw: string): TranscriptTurn[] {
  const text = raw.trim().slice(0, MAX_TURN_CHARS).trim();
  if (!text) return [...turns];
  const next = [...turns, { speaker, text }];
  let total = next.reduce((sum, turn) => sum + turn.text.length, 0);
  while (next.length > MAX_TRANSCRIPT_TURNS || total > MAX_TRANSCRIPT_CHARS) total -= next.shift()!.text.length;
  return next;
}

// L3 feedback style: how the reflection is worded. It never changes what the reflection may say,
// so there is still no score and at most one next step in every style.
export const feedbackStyleSchema = z.enum(["gentle", "direct", "list"]);
export type FeedbackStyle = z.infer<typeof feedbackStyleSchema>;
export const DEFAULT_FEEDBACK_STYLE: FeedbackStyle = "gentle";

// The goal is the user's own reflection metadata; private notes, About-me facts and the role are never part of this request.
// The feedback style is a device preference (L3); the fear, likelihoods and hard-moment line never travel here.
export const reflectRequestSchema = z.object({
  turns: transcriptSchema,
  goal: z.string().trim().min(1).max(200).optional(),
  selfReflection: z.string().trim().min(1).max(1000).optional(),
  feedbackStyle: feedbackStyleSchema.optional(),
}).strict();
export type ReflectRequest = z.infer<typeof reflectRequestSchema>;

const line = z.string().trim().min(1).max(300).nullable();
// L1: the user's own words, copied from one of their turns. The server verifies it against the
// transcript and returns null when it does not match, so counterpart text can never appear here.
export const MAX_QUOTED_LINE_CHARS = 200;
const quoted = z.string().trim().min(1).max(MAX_QUOTED_LINE_CHARS).nullable();
// No score, grade, diagnosis, personality label or prediction about a real person.
// supportExit true means every feedback field is null and the UI shows real-world support instead.
export const reflectionSchema = z.object({
  evidence: z.enum(["complete", "partial", "insufficient"]),
  observedAction: line,
  quotedLine: quoted,
  takeaway: line,
  nextStep: line,
  supportExit: z.boolean(),
}).strict();
export type Reflection = z.infer<typeof reflectionSchema>;
export const reflectionModelOutputSchema = reflectionSchema;
export const reflectResponseSchema = z.object({ reflection: reflectionSchema }).strict();

// A1 "Another way to say it": one phrasing of the user's own goal line, only when they ask for it.
// The request carries the goal alone: no transcript, no role, no private notes.
export const MAX_ALTERNATIVE_CHARS = 200;
export const alternativeRequestSchema = z.object({
  goal: z.string().trim().min(1).max(200),
  feedbackStyle: feedbackStyleSchema.optional(),
}).strict();
export type AlternativeRequest = z.infer<typeof alternativeRequestSchema>;
export const alternativeModelOutputSchema = z.object({
  alternative: z.string().trim().min(1).max(MAX_ALTERNATIVE_CHARS).nullable(),
}).strict();
export const alternativeResponseSchema = alternativeModelOutputSchema;
export type AlternativeResponse = z.infer<typeof alternativeResponseSchema>;

// HTTP contract. Errors use errorSchema with the listed HTTP status.
// POST /api/sessions/[id]/reflect (reflectRequestSchema, body ≤ 96000 chars; the schema bounds content, the cap allows JSON escaping) -> 200 reflectResponseSchema. No persistence, no logging.
// 401 UNAUTHENTICATED before params/body. 404 NOT_FOUND (missing, another owner's, or deleted) and 409 SESSION_ACTIVE (connecting/active/ending) are decided before the body is read.
// 400 VALIDATION_ERROR for a bad id or an invalid body. Reflection only after End.
// 429 USAGE_LIMIT after MAX_REFLECTIONS_PER_SESSION generations for one session (per server process);
// 503 REFLECTION_UNAVAILABLE retryable (network, refusal, or invalid output after one retry); 503 NOT_CONFIGURED.
// A transcript with no user turn returns evidence "insufficient" with null fields and makes no model call.
// POST /api/sessions/[id]/alternative (alternativeRequestSchema, body ≤ 2048) -> 200 alternativeResponseSchema, same statuses.
// It shares the per-session generation cap, so a recap cannot spend more than MAX_REFLECTIONS_PER_SESSION model calls.
// Model: OPENAI_REFLECTION_MODEL, falling back to OPENAI_SETUP_MODEL; OpenAI Responses API, strict JSON schema, store: false.
