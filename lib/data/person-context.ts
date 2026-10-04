import "server-only";
import { z } from "zod";
import { rpc, storageUnavailable } from "@/lib/data/rpc";
import type { Db } from "@/lib/data/sessions";
import { MAX_ABOUT_ME_FACTS, personBackgroundSchema, personToRole, versionSchema } from "@/lib/schemas/people";
import { aboutMeFactTextSchema, roleContextSchema, traitChipsSchema, type RoleContext, type RoleExtras } from "@/lib/schemas/role-context";
import { AppError } from "@/lib/schemas/errors";

const { name, role: relationship, style, publicContext, opening, constraints, challenge, pace } = roleContextSchema.shape;
const personContextSchema = z.object({
  id: z.uuid(), version: versionSchema, name, relationship, traits: traitChipsSchema, style, public_context: publicContext,
  opening, constraints, challenge, pace, background: personBackgroundSchema,
  known_about_user: z.array(aboutMeFactTextSchema).max(MAX_ABOUT_ME_FACTS),
}).strict();
export type PersonContext = { role: RoleContext; extras: Required<Pick<RoleExtras, "background" | "traits" | "knownAboutUser">>; version: number };
const draftIdentityRowSchema = z.object({
  id: z.uuid(), name, relationship, traits: traitChipsSchema, style, background: personBackgroundSchema,
}).strict();
export type DraftPersonIdentity = z.infer<typeof draftIdentityRowSchema>;

// The only builder inputs for a saved person: its fields, chips and the text of facts shared with it, read under the caller's JWT.
export async function loadPersonContext(db: Db, personId: string, expectedVersion: number): Promise<PersonContext> {
  const parsed = personContextSchema.safeParse(await rpc(db, "person_context", { p_id: personId, p_expected_version: expectedVersion }));
  if (!parsed.success || parsed.data.id !== personId || parsed.data.version !== expectedVersion) throw storageUnavailable();
  const { id: _id, version, traits, background, public_context, known_about_user, ...fields } = parsed.data;
  return { role: personToRole({ ...fields, publicContext: public_context, traits }), extras: { background, traits, knownAboutUser: known_about_user }, version };
}

// Draft generation intentionally reads identity only: no shared facts, private prep, or default situation.
export async function loadDraftPersonIdentity(db: Db, personId: string): Promise<DraftPersonIdentity> {
  let result: { data: unknown; error: unknown };
  try {
    result = await db.from("people").select("id, name, relationship, traits, style, background").eq("id", personId).maybeSingle();
  } catch { throw storageUnavailable(); }
  if (result.error) throw storageUnavailable();
  if (result.data === null) throw new AppError("NOT_FOUND", "That person was not found.", 404);
  const parsed = draftIdentityRowSchema.safeParse(result.data);
  if (!parsed.success || parsed.data.id !== personId) throw storageUnavailable();
  return parsed.data;
}
