import { z } from "zod";
import { aboutMeFactTextSchema, roleContextSchema, traitChipsSchema, type RoleContext, type TraitChips } from "./role-context";

// G3 contracts (docs/26). Every route requires sign-in before reading the body and is owner-scoped;
// another user's IDs return 404 NOT_FOUND without revealing whether they exist.
const timestamp = z.iso.datetime({ offset: true });
export const versionSchema = z.number().int().min(1);
export const MAX_ABOUT_ME_FACTS = 30;
export const MAX_PEOPLE = 50;

export const aboutMeFactSchema = z.object({ id: z.uuid(), text: aboutMeFactTextSchema, createdAt: timestamp, updatedAt: timestamp }).strict();
export type AboutMeFact = z.infer<typeof aboutMeFactSchema>;
export const aboutMeWriteSchema = z.object({ text: aboutMeFactTextSchema }).strict();
export const aboutMeListResponseSchema = z.object({ facts: z.array(aboutMeFactSchema).max(MAX_ABOUT_ME_FACTS) }).strict();
export const aboutMeFactResponseSchema = z.object({ fact: aboutMeFactSchema }).strict();

// A saved person is a role plus trait chips; `relationship` maps to RoleContext.role.
const { role: relationship, ...roleFields } = roleContextSchema.shape;
export const personFieldsSchema = z.object({ ...roleFields, relationship, traits: traitChipsSchema }).strict();
export type PersonFields = z.infer<typeof personFieldsSchema>;
export const personSchema = z.object({
  ...personFieldsSchema.shape,
  id: z.uuid(),
  version: versionSchema,
  sharedFactIds: z.array(z.uuid()).max(MAX_ABOUT_ME_FACTS),
  createdAt: timestamp,
  updatedAt: timestamp,
}).strict();
export type Person = z.infer<typeof personSchema>;
export const createPersonRequestSchema = personFieldsSchema;
export const updatePersonRequestSchema = z.object({ ...personFieldsSchema.shape, expectedVersion: versionSchema }).strict();
export const sharedFactsRequestSchema = z.object({
  factIds: z.array(z.uuid()).max(MAX_ABOUT_ME_FACTS).refine(ids => new Set(ids).size === ids.length, "Duplicate fact"),
  expectedVersion: versionSchema,
}).strict();
export const peopleListResponseSchema = z.object({ people: z.array(personSchema).max(MAX_PEOPLE) }).strict();
export const personResponseSchema = z.object({ person: personSchema }).strict();
export const deletedResponseSchema = z.object({ deleted: z.literal(true) }).strict();

// For the user's own reference only. Never joined to people, never shareable, never read by the context builder.
export const privatePrepSchema = z.object({ notes: z.string().max(1000), updatedAt: timestamp.nullable() }).strict();
export const privatePrepWriteSchema = z.object({ notes: z.string().trim().max(1000) }).strict();
export const privatePrepResponseSchema = z.object({ privatePrep: privatePrepSchema }).strict();

export function personToRole(person: PersonFields): RoleContext {
  const { relationship: role, traits: _traits, ...rest } = person;
  return roleContextSchema.parse({ ...rest, role });
}
export function roleToPersonFields(role: RoleContext, traits: TraitChips = {}): PersonFields {
  const { role: relationship, ...rest } = roleContextSchema.parse(role);
  return personFieldsSchema.parse({ ...rest, relationship, traits });
}

// HTTP contract. Errors use errorSchema with the listed HTTP status. 401 UNAUTHENTICATED precedes body parsing; 400 VALIDATION_ERROR.
// GET    /api/about-me                         -> 200 aboutMeListResponseSchema (oldest first)
// POST   /api/about-me (aboutMeWriteSchema, ≤ 1024 chars)       -> 201 aboutMeFactResponseSchema; 409 USAGE_LIMIT at 30 facts
// PATCH  /api/about-me/[id] (aboutMeWriteSchema, ≤ 1024 chars) -> 200 aboutMeFactResponseSchema; 404 NOT_FOUND
// DELETE /api/about-me/[id]                    -> 200 deletedResponseSchema; 404. Removes its links and bumps linked people's versions.
// GET    /api/people                           -> 200 peopleListResponseSchema (most recently updated first)
// POST   /api/people (createPersonRequestSchema, ≤ 8192 chars) -> 201 personResponseSchema (version 1, no shared facts); 409 USAGE_LIMIT at 50
// GET    /api/people/[id]                      -> 200 personResponseSchema; 404
// PATCH  /api/people/[id] (updatePersonRequestSchema, ≤ 8192)  -> 200 personResponseSchema (version + 1); 404; 409 VERSION_CONFLICT, nothing written
// DELETE /api/people/[id]                      -> 200 deletedResponseSchema; 404. Hard delete; removes its links.
// PUT    /api/people/[id]/shared-facts (sharedFactsRequestSchema, ≤ 2048) -> 200 personResponseSchema (version + 1);
//        404 person; 400 VALIDATION_ERROR for an unknown/foreign fact ID; 409 VERSION_CONFLICT. All-or-nothing.
// GET    /api/private-prep                     -> 200 privatePrepResponseSchema (empty notes, updatedAt null when none)
// PUT    /api/private-prep (privatePrepWriteSchema, ≤ 2048)     -> 200 privatePrepResponseSchema; empty notes delete the row
