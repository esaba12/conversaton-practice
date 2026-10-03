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

// The goal is the user's own reflection metadata; private notes, About-me facts and the role are never part of this request.
export const reflectRequestSchema = z.object({
  turns: transcriptSchema,
  goal: z.string().trim().min(1).max(200).optional(),
  selfReflection: z.string().trim().min(1).max(1000).optional(),
}).strict();
export type ReflectRequest = z.infer<typeof reflectRequestSchema>;

const line = z.string().trim().min(1).max(300).nullable();
// No score, grade, diagnosis, personality label or prediction about a real person.
// supportExit true means every feedback field is null and the UI shows real-world support instead.
export const reflectionSchema = z.object({
  evidence: z.enum(["complete", "partial", "insufficient"]),
  observedAction: line,
  takeaway: line,
  nextStep: line,
  supportExit: z.boolean(),
}).strict();
export type Reflection = z.infer<typeof reflectionSchema>;
export const reflectionModelOutputSchema = reflectionSchema;
export const reflectResponseSchema = z.object({ reflection: reflectionSchema }).strict();

// HTTP contract. Errors use errorSchema with the listed HTTP status.
// POST /api/sessions/[id]/reflect (reflectRequestSchema, body ≤ 96000 chars; the schema bounds content, the cap allows JSON escaping) -> 200 reflectResponseSchema. No persistence, no logging.
// 401 UNAUTHENTICATED before params/body; 400 VALIDATION_ERROR; 404 NOT_FOUND when the session is missing, another owner's, or deleted;
// 409 SESSION_ACTIVE while the session is connecting/active/ending (reflection only after End);
// 429 USAGE_LIMIT after MAX_REFLECTIONS_PER_SESSION generations for one session (per server process);
// 503 REFLECTION_UNAVAILABLE retryable (network, refusal, or invalid output after one retry); 503 NOT_CONFIGURED.
// A transcript with no user turn returns evidence "insufficient" with null fields and makes no model call.
// Model: OPENAI_REFLECTION_MODEL, falling back to OPENAI_SETUP_MODEL; OpenAI Responses API, strict JSON schema, store: false.
