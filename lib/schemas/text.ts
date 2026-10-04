import { z } from "zod";
import { sessionSchema } from "./session";

export const textLinkStatusSchema = z.object({
  linked: z.boolean(),
  phoneLast4: z.string().length(4).optional(),
  line: z.string(),
}).strict();

export const textLinkBeginSchema = z.object({
  code: z.string().length(10),
  expiresAt: z.iso.datetime(),
  line: z.string(),
}).strict();

export const textLinkRequestSchema = z.object({ phone: z.string().trim().min(7).max(20) }).strict();
export const textSessionResponseSchema = z.object({ session: sessionSchema }).strict();
export const textPickCatalogSchema = z.object({
  people: z.array(z.object({
    id: z.uuid(),
    version: z.number().int(),
    name: z.string(),
    relationship: z.string(),
    situations: z.array(z.object({ id: z.uuid(), label: z.string() })),
  })),
  examples: z.array(z.object({ preset: z.enum(["roommate", "professor", "decline", "manager"]), name: z.string(), relationship: z.string() })),
}).strict();
export const textStartedSchema = z.object({ started: z.literal(true) }).strict();
