import {
  aboutMeFactResponseSchema, aboutMeListResponseSchema, deletedResponseSchema, peopleListResponseSchema, personResponseSchema, privatePrepResponseSchema,
  type AboutMeFact, type Person, type PersonFields,
} from "@/lib/schemas/people";
import { requestJson } from "@/lib/session/api-client";

export { SessionClientError } from "@/lib/session/api-client";
const id = (value: string) => encodeURIComponent(value);

// Bodies are rebuilt field by field so no extra client state (goal, private notes) can ride along.
export function pickPersonFields(fields: PersonFields): PersonFields {
  const { name, relationship, style, publicContext, opening, constraints, challenge, pace, traits } = fields;
  const { tone, formality, talkativeness, familiarity } = traits;
  const chips = Object.fromEntries(Object.entries({ tone, formality, talkativeness, familiarity }).filter(([, value]) => value !== undefined));
  return { name, relationship, style, publicContext, opening, constraints: [...constraints], challenge, pace, traits: chips };
}

export async function listFacts(): Promise<AboutMeFact[]> { return (await requestJson("GET", "/api/about-me", undefined, aboutMeListResponseSchema)).facts; }
export async function createFact(text: string): Promise<AboutMeFact> { return (await requestJson("POST", "/api/about-me", { text }, aboutMeFactResponseSchema)).fact; }
export async function updateFact(factId: string, text: string): Promise<AboutMeFact> { return (await requestJson("PATCH", `/api/about-me/${id(factId)}`, { text }, aboutMeFactResponseSchema)).fact; }
export async function deleteFact(factId: string): Promise<void> { await requestJson("DELETE", `/api/about-me/${id(factId)}`, undefined, deletedResponseSchema); }

export async function listPeople(): Promise<Person[]> { return (await requestJson("GET", "/api/people", undefined, peopleListResponseSchema)).people; }
export async function getPerson(personId: string): Promise<Person> { return (await requestJson("GET", `/api/people/${id(personId)}`, undefined, personResponseSchema)).person; }
export async function createPerson(fields: PersonFields): Promise<Person> { return (await requestJson("POST", "/api/people", pickPersonFields(fields), personResponseSchema)).person; }
export async function updatePerson(personId: string, fields: PersonFields, expectedVersion: number): Promise<Person> {
  return (await requestJson("PATCH", `/api/people/${id(personId)}`, { ...pickPersonFields(fields), expectedVersion }, personResponseSchema)).person;
}
export async function deletePerson(personId: string): Promise<void> { await requestJson("DELETE", `/api/people/${id(personId)}`, undefined, deletedResponseSchema); }
export async function setSharedFacts(personId: string, factIds: string[], expectedVersion: number): Promise<Person> {
  return (await requestJson("PUT", `/api/people/${id(personId)}/shared-facts`, { factIds: [...new Set(factIds)], expectedVersion }, personResponseSchema)).person;
}

// The user's own notes: only ever sent to /api/private-prep.
export async function getPrivatePrep() { return (await requestJson("GET", "/api/private-prep", undefined, privatePrepResponseSchema)).privatePrep; }
export async function savePrivatePrep(notes: string) { return (await requestJson("PUT", "/api/private-prep", { notes }, privatePrepResponseSchema)).privatePrep; }
