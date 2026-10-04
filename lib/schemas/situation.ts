import { z } from "zod";
import { roleContextSchema, stanceChipSchema } from "./role-context";

// Fixture presets only. Any other string is rejected before a provider call. "manager" is Jordan (W2).
export const sessionPresetSchema = z.union([z.literal("roommate"), z.literal("professor"), z.literal("decline"), z.literal("manager")]);
export type SessionPreset = z.infer<typeof sessionPresetSchema>;

// A situation for a saved person (P2): the role's scenario fields plus optional stance chips, same limits as roleContextSchema.
const { publicContext, opening, constraints, challenge, pace } = roleContextSchema.shape;
export const situationSchema = z.object({
  publicContext, opening, constraints, challenge, pace,
  wants: stanceChipSchema.optional(),
  holdsBackBecause: stanceChipSchema.optional(),
  softensWhen: stanceChipSchema.optional(),
}).strict();
export type Situation = z.infer<typeof situationSchema>;
