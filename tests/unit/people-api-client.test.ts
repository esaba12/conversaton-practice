import { afterEach, describe, expect, it, vi } from "vitest";
import { roommate } from "@/fixtures/roommate";
import {
  SessionClientError, createFact, createPerson, deleteFact, deletePerson, getPerson, getPrivatePrep, listFacts, listPeople, savePrivatePrep, setSharedFacts, updateFact, updatePerson,
} from "@/lib/people/api-client";
import { aboutMeWriteSchema, createPersonRequestSchema, roleToPersonFields, sharedFactsRequestSchema, updatePersonRequestSchema, type PersonFields } from "@/lib/schemas/people";

afterEach(() => { vi.unstubAllGlobals(); });
const personId = "5b8f1f1e-6d2a-4c1b-9a51-0d4b9b6f2a11";
const factId = "0c7a2f8e-3b9d-4e1f-8a6c-2d5e7f9b1c3a";
const factId2 = "9d1c2b3a-4e5f-4a6b-8c7d-0e1f2a3b4c5d";
const requestId = "1e2d3c4b-5a69-4788-9a0b-c1d2e3f4a5b6";
const at = "2026-10-03T21:20:00.000Z";
const privateNote = "PRIVATE-NOTE-I-am-scared-they-will-be-angry";
const fields: PersonFields = roleToPersonFields(roommate, { tone: "warm", formality: "casual" });
const person = { ...fields, background: roommate.publicContext, id: personId, version: 2, sharedFactIds: [factId], createdAt: at, updatedAt: at };
const fact = { id: factId, text: "I joined in June", createdAt: at, updatedAt: at };
function stubFetch(response: Response) { const fetchMock = vi.fn().mockResolvedValue(response); vi.stubGlobal("fetch", fetchMock); return fetchMock; }
function call(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, method: init.method, body: init.body === undefined ? undefined : JSON.parse(init.body), raw: init.body as string | undefined, init };
}
const error = (code: string, status: number) => Response.json({ code, message: `${code} message`, retryable: false, request_id: requestId }, { status });

describe("about-me client", () => {
  it("lists facts with a bodiless same-origin GET", async () => {
    const fetchMock = stubFetch(Response.json({ facts: [fact] }));
    await expect(listFacts()).resolves.toEqual([fact]);
    const { url, method, body, init } = call(fetchMock);
    expect([url, method, body]).toEqual(["/api/about-me", "GET", undefined]);
    expect(init).toMatchObject({ credentials: "same-origin", cache: "no-store" });
  });
  it("creates, edits and deletes with exactly { text }", async () => {
    let fetchMock = stubFetch(Response.json({ fact }, { status: 201 }));
    await expect(createFact("I joined in June")).resolves.toEqual(fact);
    expect(call(fetchMock)).toMatchObject({ url: "/api/about-me", method: "POST", body: { text: "I joined in June" } });
    expect(aboutMeWriteSchema.safeParse(call(fetchMock).body).success).toBe(true);
    fetchMock = stubFetch(Response.json({ fact: { ...fact, text: "I joined in July" } }));
    await updateFact(factId, "I joined in July");
    expect(call(fetchMock)).toMatchObject({ url: `/api/about-me/${factId}`, method: "PATCH", body: { text: "I joined in July" } });
    fetchMock = stubFetch(Response.json({ deleted: true }));
    await expect(deleteFact(factId)).resolves.toBeUndefined();
    expect(call(fetchMock)).toMatchObject({ url: `/api/about-me/${factId}`, method: "DELETE", body: undefined });
  });
  it("surfaces 404 and the 30-fact limit as typed errors", async () => {
    stubFetch(error("NOT_FOUND", 404));
    const notFound = await updateFact(factId, "x").catch((caught: unknown) => caught);
    expect(notFound).toBeInstanceOf(SessionClientError);
    expect(notFound).toMatchObject({ code: "NOT_FOUND", status: 404 });
    stubFetch(error("USAGE_LIMIT", 409));
    await expect(createFact("x")).rejects.toMatchObject({ code: "USAGE_LIMIT", status: 409 });
  });
});

describe("people client", () => {
  it("lists and reads people, validating the response", async () => {
    let fetchMock = stubFetch(Response.json({ people: [person] }));
    await expect(listPeople()).resolves.toEqual([person]);
    expect(call(fetchMock)).toMatchObject({ url: "/api/people", method: "GET", body: undefined });
    fetchMock = stubFetch(Response.json({ person }));
    await expect(getPerson(personId)).resolves.toEqual(person);
    expect(call(fetchMock)).toMatchObject({ url: `/api/people/${personId}`, method: "GET" });
    stubFetch(Response.json({ person: { ...person, traits: { tone: 80 } } }));
    await expect(getPerson(personId)).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });
  it("creates a person with only the person fields, never goal or private notes", async () => {
    const fetchMock = stubFetch(Response.json({ person: { ...person, version: 1, sharedFactIds: [] } }, { status: 201 }));
    const leaky = { ...fields, goal: "secret goal", privateNotes: privateNote, traits: { ...fields.traits, extra: "x" } } as PersonFields;
    await createPerson(leaky);
    const { url, method, body, raw } = call(fetchMock);
    expect([url, method]).toEqual(["/api/people", "POST"]);
    expect(raw).not.toContain(privateNote);
    expect(raw).not.toContain("secret goal");
    expect(Object.keys(body).sort()).toEqual(["challenge", "constraints", "name", "opening", "pace", "publicContext", "relationship", "style", "traits"]);
    expect(body.traits).toEqual({ tone: "warm", formality: "casual" });
    expect(createPersonRequestSchema.safeParse(body).success).toBe(true);
  });
  it("patches with expectedVersion and reports a 409 conflict", async () => {
    let fetchMock = stubFetch(Response.json({ person: { ...person, version: 3 } }));
    await expect(updatePerson(personId, fields, 2)).resolves.toMatchObject({ version: 3 });
    const { url, method, body } = call(fetchMock);
    expect([url, method]).toEqual([`/api/people/${personId}`, "PATCH"]);
    expect(body).toEqual({ ...fields, expectedVersion: 2 });
    expect(updatePersonRequestSchema.safeParse(body).success).toBe(true);
    fetchMock = stubFetch(error("VERSION_CONFLICT", 409));
    await expect(updatePerson(personId, fields, 2)).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409, retryable: false });
  });
  it("deletes a person and reports a missing one as 404", async () => {
    let fetchMock = stubFetch(Response.json({ deleted: true }));
    await deletePerson(personId);
    expect(call(fetchMock)).toMatchObject({ url: `/api/people/${personId}`, method: "DELETE", body: undefined });
    fetchMock = stubFetch(error("NOT_FOUND", 404));
    await expect(deletePerson(personId)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });
  it("replaces the shared set with the full, de-duplicated fact IDs and expectedVersion", async () => {
    let fetchMock = stubFetch(Response.json({ person: { ...person, version: 3, sharedFactIds: [factId, factId2] } }));
    await expect(setSharedFacts(personId, [factId, factId2, factId], 2)).resolves.toMatchObject({ version: 3, sharedFactIds: [factId, factId2] });
    const { url, method, body } = call(fetchMock);
    expect([url, method]).toEqual([`/api/people/${personId}/shared-facts`, "PUT"]);
    expect(body).toEqual({ factIds: [factId, factId2], expectedVersion: 2 });
    expect(sharedFactsRequestSchema.safeParse(body).success).toBe(true);
    fetchMock = stubFetch(error("VERSION_CONFLICT", 409));
    await expect(setSharedFacts(personId, [], 2)).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });
  });
});

describe("private prep client", () => {
  it("reads and writes notes only through /api/private-prep", async () => {
    let fetchMock = stubFetch(Response.json({ privatePrep: { notes: "", updatedAt: null } }));
    await expect(getPrivatePrep()).resolves.toEqual({ notes: "", updatedAt: null });
    expect(call(fetchMock)).toMatchObject({ url: "/api/private-prep", method: "GET", body: undefined });
    fetchMock = stubFetch(Response.json({ privatePrep: { notes: privateNote, updatedAt: at } }));
    await savePrivatePrep(privateNote);
    expect(call(fetchMock)).toMatchObject({ url: "/api/private-prep", method: "PUT", body: { notes: privateNote } });
  });
  it("rejects malformed and non-JSON error responses", async () => {
    stubFetch(Response.json({ privatePrep: { notes: "x", updatedAt: at, sharedWith: [personId] } }));
    await expect(getPrivatePrep()).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    stubFetch(new Response("<html>", { status: 502 }));
    await expect(listPeople()).rejects.toMatchObject({ code: "MALFORMED_RESPONSE", status: 502, retryable: true });
  });
});
