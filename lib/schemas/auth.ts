import { z } from "zod";
export const identitySchema = z.object({ id: z.uuid(), isAnonymous: z.literal(false) });
export type Identity = z.infer<typeof identitySchema>;
