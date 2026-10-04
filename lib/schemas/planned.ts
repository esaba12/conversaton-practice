import { z } from "zod";

// B1/B2/W4 contracts (docs/32 B1, B2; docs/next/04-NEW-SPECS.md W4). One plan per saved person.
// Every route requires sign-in before reading the body and is owner-scoped; another user's person or plan ID returns 404.
// fear and likelihoods are stored only when the user turns on "Keep my guess to check after the real conversation".
const timestamp = z.iso.datetime({ offset: true });
export const MAX_PLANS = 50;

export const plannedDaySchema = z.iso.date();
export const plannedLabelSchema = z.string().trim().min(1).max(120);
export const plannedFearSchema = z.string().trim().min(1).max(200);
export const plannedNoteSchema = z.string().trim().min(1).max(200);
export const likelihoodSchema = z.number().int().min(0).max(100);
export const checkinAnswerSchema = z.enum(["not_yet", "decided_not", "yes"]);
export type CheckinAnswer = z.infer<typeof checkinAnswerSchema>;

export const plannedGuessSchema = z.object({ fear: plannedFearSchema.optional(), likelihoodBefore: likelihoodSchema.optional() }).strict()
  .refine((guess) => guess.fear !== undefined || guess.likelihoodBefore !== undefined, "Empty guess");

export const plannedSchema = z.object({
  id: z.uuid(),
  personId: z.uuid(),
  plannedOn: plannedDaySchema,
  label: plannedLabelSchema.nullable(),
  fear: plannedFearSchema.nullable(),
  likelihoodBefore: likelihoodSchema.nullable(),
  likelihoodAfter: likelihoodSchema.nullable(),
  checkin: checkinAnswerSchema.nullable(),
  checkinNote: plannedNoteSchema.nullable(),
  checkedInAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
}).strict();
export type Planned = z.infer<typeof plannedSchema>;

export const setPlannedRequestSchema = z.object({
  personId: z.uuid(),
  plannedOn: plannedDaySchema,
  label: plannedLabelSchema.optional(),
  guess: plannedGuessSchema.optional(),
}).strict();
export type SetPlannedRequest = z.infer<typeof setPlannedRequestSchema>;

export const checkinRequestSchema = z.object({
  answer: checkinAnswerSchema,
  note: plannedNoteSchema.optional(),
  likelihoodAfter: likelihoodSchema.optional(),
}).strict().refine((body) => body.note === undefined || body.answer === "yes", "A note goes with Yes only");
export type CheckinRequest = z.infer<typeof checkinRequestSchema>;

export const plannedListResponseSchema = z.object({ plans: z.array(plannedSchema).max(MAX_PLANS) }).strict();
export const plannedResponseSchema = z.object({ plan: plannedSchema }).strict();

// HTTP contract. Errors use errorSchema. 401 UNAUTHENTICATED precedes body parsing; 400 VALIDATION_ERROR.
// GET    /api/planned                    -> 200 plannedListResponseSchema (soonest day first)
// PUT    /api/planned (setPlannedRequestSchema, ≤ 2048)       -> 200 plannedResponseSchema; 404 for a person that is not the caller's.
//        Setting a day replaces the plan and clears any earlier check-in; without `guess` no fear or likelihood is stored.
// POST   /api/planned/[id]/checkin (checkinRequestSchema, ≤ 2048) -> 200 plannedResponseSchema; 404
// DELETE /api/planned/[id]               -> 200 { deleted: true }; 404
