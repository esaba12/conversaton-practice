import { plannedDaySchema, plannedFearSchema, plannedLabelSchema, likelihoodSchema } from "@/lib/schemas/planned";

export type Guess = { fear: string; likelihoodBefore: number | null };

// W4: the guess goes into the request only when the user turned on "Keep my guess to check after the real conversation".
// With it off, the result has no `guess` key at all, so no fear or likelihood can reach the server.
export function buildPlannedInput(input: { personId: string; day: string; label: string; keepGuess: boolean; guess?: Guess | null }) {
  const plannedOn = plannedDaySchema.safeParse(input.day);
  if (!plannedOn.success) return null;
  const label = plannedLabelSchema.safeParse(input.label);
  const base = { personId: input.personId, plannedOn: plannedOn.data, ...(label.success ? { label: label.data } : {}) };
  if (!input.keepGuess || !input.guess) return base;
  const fear = plannedFearSchema.safeParse(input.guess.fear);
  const likelihood = likelihoodSchema.safeParse(input.guess.likelihoodBefore);
  if (!fear.success && !likelihood.success) return base;
  return { ...base, guess: { ...(fear.success ? { fear: fear.data } : {}), ...(likelihood.success ? { likelihoodBefore: likelihood.data } : {}) } };
}

export const hasGuess = (guess?: Guess | null) => Boolean(guess && (guess.fear.trim() || guess.likelihoodBefore !== null));
