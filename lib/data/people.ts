import "server-only";
import { z } from "zod";
import { practicedPersonIds } from "@/lib/data/practice-history";
import { rpc, storageUnavailable } from "@/lib/data/rpc";
import type { Db } from "@/lib/data/sessions";
import { AppError } from "@/lib/schemas/errors";
import {
  aboutMeFactResponseSchema, aboutMeListResponseSchema, deletedResponseSchema, MAX_ABOUT_ME_FACTS, MAX_PEOPLE,
  peopleListResponseSchema, personResponseSchema, privatePrepResponseSchema, type PersonFields,
} from "@/lib/schemas/people";

// Reads use owner RLS on the request client; writes go only through the version-checked RPCs.
const FACT_COLUMNS = "id, text, created_at, updated_at";
const PERSON_COLUMNS = "id, version, name, relationship, traits, style, background, public_context, opening, constraints, challenge, pace, created_at, updated_at";
// Keeps each link query under PostgREST's default 1000-row cap (25 people × 30 facts).
const LINK_CHUNK = 25;
const notFound = () => new AppError("NOT_FOUND", "That item was not found.", 404);

type Row = Record<string, unknown>;
const asRow = (raw: unknown): Row => (raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Row : {});
const iso = (value: unknown) => {
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : value;
};
function valid<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw storageUnavailable();
  return parsed.data;
}
async function read(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<unknown> {
  let result: { data: unknown; error: unknown };
  try { result = await query; } catch { throw storageUnavailable(); }
  if (result.error) throw storageUnavailable();
  return result.data;
}
function rows(data: unknown) {
  if (!Array.isArray(data)) throw storageUnavailable();
  return data.map(asRow);
}

const fact = (r: Row) => ({ id: r.id, text: r.text, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at) });
// W10 `hasPracticed`: derived from the owner's ended normal practices, never written by a client.
// It stays absent when the history read is unavailable, so the UI falls back to the first-time order.
const person = (r: Row, sharedFactIds: unknown = r.shared_fact_ids, practiced: Set<string> | null = null) => ({
  id: r.id, version: r.version, name: r.name, relationship: r.relationship, traits: r.traits, style: r.style,
  background: r.background, publicContext: r.public_context, opening: r.opening, constraints: r.constraints, challenge: r.challenge, pace: r.pace,
  sharedFactIds, ...(practiced ? { hasPracticed: practiced.has(String(r.id)) } : {}),
  createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
});
const personArgs = (f: PersonFields) => ({
  p_name: f.name, p_relationship: f.relationship, p_traits: f.traits, p_style: f.style, p_public_context: f.publicContext,
  p_opening: f.opening, p_constraints: f.constraints, p_challenge: f.challenge, p_pace: f.pace, p_background: f.background ?? null,
});

async function sharedFactIds(db: Db, personIds: string[]) {
  const byPerson = new Map<string, string[]>(personIds.map(id => [id, []]));
  const chunks = Array.from({ length: Math.ceil(personIds.length / LINK_CHUNK) }, (_, i) => personIds.slice(i * LINK_CHUNK, (i + 1) * LINK_CHUNK));
  const results = await Promise.all(chunks.map(ids => read(db.from("person_shared_facts").select("person_id, fact_id")
    .in("person_id", ids).order("created_at", { ascending: true }).order("fact_id", { ascending: true }))));
  for (const link of results.flatMap(rows)) byPerson.get(String(link.person_id))?.push(String(link.fact_id));
  return byPerson;
}

export async function listFacts(db: Db) {
  const data = await read(db.from("about_me_facts").select(FACT_COLUMNS)
    .order("created_at", { ascending: true }).order("id", { ascending: true }).limit(MAX_ABOUT_ME_FACTS));
  return valid(aboutMeListResponseSchema, { facts: rows(data).map(fact) });
}
export const createFact = async (db: Db, text: string) =>
  valid(aboutMeFactResponseSchema, { fact: fact(asRow(await rpc(db, "about_me_create", { p_text: text }))) });
export const updateFact = async (db: Db, id: string, text: string) =>
  valid(aboutMeFactResponseSchema, { fact: fact(asRow(await rpc(db, "about_me_update", { p_id: id, p_text: text }))) });
export const deleteFact = async (db: Db, id: string) => valid(deletedResponseSchema, await rpc(db, "about_me_delete", { p_id: id }));

export async function listPeople(db: Db) {
  const people = rows(await read(db.from("people").select(PERSON_COLUMNS)
    .order("updated_at", { ascending: false }).order("id", { ascending: true }).limit(MAX_PEOPLE)));
  const [links, practiced] = await Promise.all([sharedFactIds(db, people.map(r => String(r.id))), practicedPersonIds(db)]);
  return valid(peopleListResponseSchema, { people: people.map(r => person(r, links.get(String(r.id)), practiced)) });
}
export async function getPerson(db: Db, id: string) {
  const data = await read(db.from("people").select(PERSON_COLUMNS).eq("id", id).maybeSingle());
  if (data === null) throw notFound();
  const [links, practiced] = await Promise.all([sharedFactIds(db, [id]), practicedPersonIds(db)]);
  return valid(personResponseSchema, { person: person(asRow(data), links.get(id), practiced) });
}
// A person that was just created cannot have an ended practice yet.
export const createPerson = async (db: Db, fields: PersonFields) =>
  valid(personResponseSchema, { person: person(asRow(await rpc(db, "person_create", personArgs(fields))), undefined, new Set()) });
export const updatePerson = async (db: Db, id: string, expectedVersion: number, fields: PersonFields) =>
  valid(personResponseSchema, { person: person(asRow(await rpc(db, "person_update", { p_id: id, p_expected_version: expectedVersion, ...personArgs(fields) })), undefined, await practicedPersonIds(db)) });
export const deletePerson = async (db: Db, id: string) => valid(deletedResponseSchema, await rpc(db, "person_delete", { p_id: id }));
export const setSharedFacts = async (db: Db, id: string, expectedVersion: number, factIds: string[]) =>
  valid(personResponseSchema, { person: person(asRow(await rpc(db, "person_set_shared_facts", { p_id: id, p_expected_version: expectedVersion, p_fact_ids: factIds })), undefined, await practicedPersonIds(db)) });

const prep = (r: Row | null) => ({ privatePrep: { notes: r ? r.notes : "", updatedAt: r && r.updated_at !== null ? iso(r.updated_at) : null } });
export async function getPrivatePrep(db: Db) {
  const data = await read(db.from("private_prep").select("notes, updated_at").maybeSingle());
  return valid(privatePrepResponseSchema, prep(data === null ? null : asRow(data)));
}
export const putPrivatePrep = async (db: Db, notes: string) =>
  valid(privatePrepResponseSchema, prep(asRow(await rpc(db, "private_prep_put", { p_notes: notes }))));
