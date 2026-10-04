import { z } from "zod";
import { cleanupSchema, sessionStatusSchema } from "./session";

// G4 "Your data" (docs/08 deletion truthfulness). Session rows hold status, cleanup, and optional saved-person attribution, never content.
const timestamp = z.iso.datetime({ offset: true });
export const MAX_LISTED_SESSIONS = 50;

export const sessionSummarySchema = z.object({
  id: z.uuid(),
  status: sessionStatusSchema,
  cleanup: cleanupSchema,
  createdAt: timestamp,
  endedAt: timestamp.nullable(),
  // Present from DATA-01 onward. Null when the session had no saved person, or that person was deleted.
  personName: z.string().min(1).max(60).nullable().optional(),
}).strict();
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
export const sessionListResponseSchema = z.object({ sessions: z.array(sessionSummarySchema).max(MAX_LISTED_SESSIONS) }).strict();

export const deletePracticeDataRequestSchema = z.object({ confirm: z.literal("delete my practice data") }).strict();
const counts = z.object({ aboutMeFacts: z.number().int().min(0), people: z.number().int().min(0), privatePrep: z.boolean() }).strict();
// `remaining` is what still exists after the attempt; anything non-zero/true means deletion was incomplete and can be retried.
// Session records are kept: they are needed to track and retry provider cleanup and contain no practice content.
export const deletePracticeDataResponseSchema = z.object({
  deleted: counts,
  remaining: counts,
  sessions: z.object({ total: z.number().int().min(0), cleanupConfirmed: z.number().int().min(0), cleanupOutstanding: z.number().int().min(0) }).strict(),
}).strict();
export type DeletePracticeDataResponse = z.infer<typeof deletePracticeDataResponseSchema>;

// HTTP contract. Errors use errorSchema with the listed HTTP status. 401 UNAUTHENTICATED precedes body parsing.
// GET    /api/sessions                    -> 200 sessionListResponseSchema (owner's most recent first, ≤ 50).
//        Optional personName is the saved person's current name, or null if none was stored or the person was deleted.
//        The list does not include person id, transcript, role text, or private notes.
// DELETE /api/practice-data (deletePracticeDataRequestSchema, ≤ 256 chars) -> 200 deletePracticeDataResponseSchema; 400 without the exact phrase.
//        Deletes the owner's saved people (and their shared-fact links), About-me facts and private prep through the existing owner RPCs.
//        Not one transaction: a partial failure is reported in `remaining`, never hidden. Does not delete the Auth account.
// Retrying provider cleanup for an ended session reuses POST /api/sessions/[id]/end, which is idempotent and retries remote cleanup.
// cleanup "confirmed" means the Tavus conversation was verified ended and hard-deleted. ElevenLabs speech copies are not tracked by this app.
