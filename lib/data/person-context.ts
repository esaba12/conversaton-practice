import "server-only";
import { z } from "zod";
import { rpc, storageUnavailable } from "@/lib/data/rpc";
import type { Db } from "@/lib/data/sessions";
import { MAX_ABOUT_ME_FACTS, personToRole, versionSchema } from "@/lib/schemas/people";
import { aboutMeFactTextSchema, roleContextSchema, traitChipsSchema, type RoleContext, type RoleExtras } from "@/lib/schemas/role-context";

const { name, role: relationship, style, publicContext, opening, constraints, challenge, pace } = roleContextSchema.shape;
const personContextSchema = z.object({
  id: z.uuid(), version: versionSchema, name, relationship, traits: traitChipsSchema, style, public_context: publicContext,
  opening, constraints, challenge, pace, known_about_user: z.array(aboutMeFactTextSchema).max(MAX_ABOUT_ME_FACTS),
}).strict();
export type PersonContext = { role: RoleContext; extras: Required<RoleExtras>; version: number };

// The only builder inputs for a saved person: its fields, chips and the text of facts shared with it, read under the caller's JWT.
export async function loadPersonContext(db: Db, personId: string, expectedVersion: number): Promise<PersonContext> {
  const parsed = personContextSchema.safeParse(await rpc(db, "person_context", { p_id: personId, p_expected_version: expectedVersion }));
  if (!parsed.success || parsed.data.id !== personId || parsed.data.version !== expectedVersion) throw storageUnavailable();
  const { id: _id, version, traits, public_context, known_about_user, ...fields } = parsed.data;
  return { role: personToRole({ ...fields, publicContext: public_context, traits }), extras: { traits, knownAboutUser: known_about_user }, version };
}
