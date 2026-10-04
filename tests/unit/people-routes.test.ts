import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import {
  aboutMeFactResponseSchema, aboutMeListResponseSchema, deletedResponseSchema, peopleListResponseSchema,
  personResponseSchema, personSituationResponseSchema, personSituationsResponseSchema, privatePrepResponseSchema,
} from "@/lib/schemas/people";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import * as aboutMe from "@/app/api/about-me/route";
import * as aboutMeItem from "@/app/api/about-me/[id]/route";
import * as people from "@/app/api/people/route";
import * as personItem from "@/app/api/people/[id]/route";
import * as sharedFacts from "@/app/api/people/[id]/shared-facts/route";
import * as situations from "@/app/api/people/[id]/situations/route";
import * as situationItem from "@/app/api/people/[id]/situations/[situationId]/route";
import * as privatePrep from "@/app/api/private-prep/route";

const owner = "11111111-1111-4111-8111-111111111111", pid = "22222222-2222-4222-8222-222222222222", pid2 = "55555555-5555-4555-8555-555555555555";
const f1 = "33333333-3333-4333-8333-333333333333", f2 = "44444444-4444-4444-8444-444444444444";
const sid = "66666666-6666-4666-8666-666666666666";
const ts = "2026-10-03T21:00:00.123456+00:00", iso = "2026-10-03T21:00:00.123Z";
type Result = { data?: unknown; error?: { code: string; message: string } };
let handlers: Record<string, (args: Record<string, unknown>) => Result>, tables: Record<string, Result>;
let rpc: ReturnType<typeof vi.fn>, queries: { table: string; calls: [string, unknown[]][] }[];

const marker = (message: string) => ({ error: { code: "P0001", message } });
const factRow = (patch: Record<string, unknown> = {}) => ({ id: f1, owner_id: owner, text: "I joined in June", created_at: ts, updated_at: ts, ...patch });
const personRow = (patch: Record<string, unknown> = {}) => ({
  id: pid, owner_id: owner, version: 1, name: "Dana", relationship: "My manager", traits: { tone: "warm", formality: "professional" },
  style: "Busy but fair.", background: "Dana manages the product team.", public_context: "We work on the same team.", opening: "What did you want to cover?",
  constraints: ["Stay in a workplace one-on-one."], challenge: "neutral", pace: "conversational", created_at: ts, updated_at: ts, ...patch,
});
const fields = {
  name: "  Dana ", relationship: " My manager ", traits: { tone: "blunt", familiarity: "close" }, style: " Busy but fair. ",
  background: " Dana manages the product team. ",
  publicContext: " We work on the same team. ", opening: " What did you want to cover? ", constraints: [" Stay in a workplace one-on-one. "],
  challenge: "mild_pushback", pace: "patient",
};
const req = (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://127.0.0.1:3000${url}`, { method, headers, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });
const ctx = (value: string) => ({ params: Promise.resolve({ id: value }) });
const calls = (name: string) => rpc.mock.calls.filter(([called]) => called === name).map(([, args]) => args as Record<string, unknown>);
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  return errorSchema.parse(await response.json());
}
async function ok<T>(response: Response, schema: { parse: (value: unknown) => T }, status = 200) {
  expect(response.status).toBe(status);
  return schema.parse(await response.json());
}

// Chainable PostgREST-style builder: records every call; awaits to the table's configured result.
function from(table: string) {
  const query = { table, calls: [] as [string, unknown[]][] };
  queries.push(query);
  const result = () => ({ data: tables[table]?.data ?? null, error: tables[table] ? tables[table].error ?? null : { code: "XX000", message: "unhandled" } });
  const builder: object = new Proxy({}, {
    get(_, prop) {
      if (prop === "then") return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject);
      if (prop === "maybeSingle") return async () => { const r = result(); return { ...r, data: Array.isArray(r.data) ? r.data[0] ?? null : r.data }; };
      return (...args: unknown[]) => { query.calls.push([String(prop), args]); return builder; };
    },
  });
  return builder;
}

beforeEach(() => {
  handlers = {}; tables = {}; queries = [];
  rpc = vi.fn(async (name: string, args: Record<string, unknown>) => { const r = handlers[name]?.(args) ?? { error: { code: "XX000", message: "unhandled" } }; return { data: r.data ?? null, error: r.error ?? null }; });
  identity.requireIdentity.mockReset();
  identity.requireIdentity.mockResolvedValue({ client: { rpc, from: vi.fn(from) }, identity: { id: owner, isAnonymous: false } });
});

describe("people, about-me and private-prep routes", () => {
  it("returns 401 on every route before reading the body or touching storage", async () => {
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    const requests: [Request, () => Promise<Response>][] = [];
    const add = (request: Request, run: (r: Request) => Promise<Response>) => requests.push([request, () => run(request)]);
    add(req("GET", "/api/about-me"), r => aboutMe.GET(r));
    add(req("POST", "/api/about-me", "not json"), r => aboutMe.POST(r));
    add(req("PATCH", `/api/about-me/${f1}`, "not json"), r => aboutMeItem.PATCH(r, ctx("bad-id")));
    add(req("DELETE", `/api/about-me/${f1}`), r => aboutMeItem.DELETE(r, ctx("bad-id")));
    add(req("GET", "/api/people"), r => people.GET(r));
    add(req("POST", "/api/people", "not json"), r => people.POST(r));
    add(req("GET", `/api/people/${pid}`), r => personItem.GET(r, ctx("bad-id")));
    add(req("PATCH", `/api/people/${pid}`, "not json"), r => personItem.PATCH(r, ctx("bad-id")));
    add(req("DELETE", `/api/people/${pid}`), r => personItem.DELETE(r, ctx("bad-id")));
    add(req("PUT", `/api/people/${pid}/shared-facts`, "not json"), r => sharedFacts.PUT(r, ctx("bad-id")));
    add(req("GET", `/api/people/${pid}/situations`), r => situations.GET(r, ctx("bad-id")));
    add(req("POST", `/api/people/${pid}/situations`, "not json"), r => situations.POST(r, ctx("bad-id")));
    add(req("DELETE", `/api/people/${pid}/situations/${sid}`), r => situationItem.DELETE(r, { params: Promise.resolve({ id: "bad-id", situationId: "bad-id" }) }));
    add(req("GET", "/api/private-prep"), r => privatePrep.GET(r));
    add(req("PUT", "/api/private-prep", "not json"), r => privatePrep.PUT(r));
    for (const [request, run] of requests) {
      expect((await errorOf(await run(), 401)).code).toBe("UNAUTHENTICATED");
      expect(request.bodyUsed).toBe(false);
    }
    expect(identity.requireIdentity).toHaveBeenCalledTimes(requests.length);
    expect(rpc).not.toHaveBeenCalled(); expect(queries).toHaveLength(0);
  });

  it("rejects extra fields, unknown chips, bad ids and oversized bodies before storage", async () => {
    const rejected = [
      aboutMe.POST(req("POST", "/api/about-me", { text: "I'm vegetarian", ownerId: owner })),
      aboutMe.POST(req("POST", "/api/about-me", { text: "x".repeat(121) })),
      aboutMe.POST(req("POST", "/api/about-me", JSON.stringify({ text: "ok" }) + " ".repeat(1024))),
      aboutMeItem.PATCH(req("PATCH", "/api/about-me/nope", { text: "ok" }), ctx("nope")),
      people.POST(req("POST", "/api/people", { ...fields, privateNotes: "PRIVATE-FEAR" })),
      people.POST(req("POST", "/api/people", { ...fields, ownerId: owner })),
      people.POST(req("POST", "/api/people", { ...fields, traits: { tone: "angry" } })),
      people.POST(req("POST", "/api/people", { ...fields, traits: { mood: "warm" } })),
      people.POST(req("POST", "/api/people", { ...fields, traits: { tone: 70 } })),
      people.POST(req("POST", "/api/people", { ...fields, constraints: Array(6).fill("c") })),
      people.POST(req("POST", "/api/people", { ...fields, expectedVersion: 1 })),
      personItem.PATCH(req("PATCH", `/api/people/${pid}`, fields), ctx(pid)),
      personItem.PATCH(req("PATCH", `/api/people/${pid}`, { ...fields, expectedVersion: 0 }), ctx(pid)),
      personItem.PATCH(req("PATCH", `/api/people/${pid}`, { ...fields, expectedVersion: 1, sharedFactIds: [f1] }), ctx(pid)),
      personItem.GET(req("GET", "/api/people/nope"), ctx("nope")),
      sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: [f1], expectedVersion: 1, privateNotes: "PRIVATE" }), ctx(pid)),
      sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: ["private-prep"], expectedVersion: 1 }), ctx(pid)),
      sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: [f1, f1], expectedVersion: 1 }), ctx(pid)),
      sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: [{ text: "I joined in June" }], expectedVersion: 1 }), ctx(pid)),
      sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: [f1] }), ctx(pid)),
      privatePrep.PUT(req("PUT", "/api/private-prep", { notes: "nervous", personId: pid })),
      privatePrep.PUT(req("PUT", "/api/private-prep", { notes: "n".repeat(1001) })),
      situations.POST(req("POST", `/api/people/${pid}/situations`, { label: "x", situation: { publicContext: "x", opening: "Hi.", constraints: [], challenge: "neutral", pace: "patient" }, privateNotes: "PRIVATE" }), ctx(pid)),
    ];
    for (const response of await Promise.all(rejected)) expect((await errorOf(response, 400)).code).toBe("VALIDATION_ERROR");
    expect((await errorOf(await people.POST(req("POST", "/api/people", fields, { origin: "https://evil.example" })), 403)).code).toBe("FORBIDDEN");
    expect(rpc).not.toHaveBeenCalled(); expect(queries).toHaveLength(0);
  });

  it("creates, edits and deletes About-me facts through the RPCs with trimmed text", async () => {
    handlers.about_me_create = (args) => ({ data: factRow({ text: args.p_text }) });
    handlers.about_me_update = (args) => ({ data: factRow({ id: args.p_id, text: args.p_text }) });
    handlers.about_me_delete = () => ({ data: { deleted: true } });
    const created = await ok(await aboutMe.POST(req("POST", "/api/about-me", { text: "  I'm vegetarian  " })), aboutMeFactResponseSchema, 201);
    expect(created.fact).toEqual({ id: f1, text: "I'm vegetarian", createdAt: iso, updatedAt: iso });
    expect(calls("about_me_create")).toEqual([{ p_text: "I'm vegetarian" }]);
    await ok(await aboutMeItem.PATCH(req("PATCH", `/api/about-me/${f1}`, { text: " I joined in May " }), ctx(f1)), aboutMeFactResponseSchema);
    expect(calls("about_me_update")).toEqual([{ p_id: f1, p_text: "I joined in May" }]);
    expect(await ok(await aboutMeItem.DELETE(req("DELETE", `/api/about-me/${f1}`), ctx(f1)), deletedResponseSchema)).toEqual({ deleted: true });
    expect(calls("about_me_delete")).toEqual([{ p_id: f1 }]);
  });

  it("lists facts oldest first from the owner-RLS table with an explicit column list", async () => {
    tables.about_me_facts = { data: [factRow(), factRow({ id: f2, text: "I'm a junior engineer" })] };
    const body = await ok(await aboutMe.GET(req("GET", "/api/about-me")), aboutMeListResponseSchema);
    expect(body.facts.map(f => f.id)).toEqual([f1, f2]);
    expect(JSON.stringify(body)).not.toContain("owner");
    const [query] = queries;
    expect(query.table).toBe("about_me_facts");
    expect(query.calls).toContainEqual(["select", ["id, text, created_at, updated_at"]]);
    expect(query.calls).toContainEqual(["order", ["created_at", { ascending: true }]]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sends trimmed person fields, traits as an object and constraints as an array", async () => {
    handlers.person_create = () => ({ data: { ...personRow(), shared_fact_ids: [] } });
    handlers.person_update = (args) => ({ data: { ...personRow({ version: Number(args.p_expected_version) + 1 }), shared_fact_ids: [f1] } });
    const created = await ok(await people.POST(req("POST", "/api/people", fields)), personResponseSchema, 201);
    expect(created.person).toMatchObject({ id: pid, version: 1, sharedFactIds: [], publicContext: "We work on the same team.", createdAt: iso });
    const expected = {
      p_name: "Dana", p_relationship: "My manager", p_traits: { tone: "blunt", familiarity: "close" }, p_style: "Busy but fair.",
      p_public_context: "We work on the same team.", p_opening: "What did you want to cover?", p_constraints: ["Stay in a workplace one-on-one."],
      p_challenge: "mild_pushback", p_pace: "patient", p_background: "Dana manages the product team.",
    };
    expect(calls("person_create")).toEqual([expected]);
    const updated = await ok(await personItem.PATCH(req("PATCH", `/api/people/${pid}`, { ...fields, expectedVersion: 3 }), ctx(pid)), personResponseSchema);
    expect(updated.person).toMatchObject({ version: 4, sharedFactIds: [f1] });
    expect(calls("person_update")).toEqual([{ p_id: pid, p_expected_version: 3, ...expected }]);
  });

  it("replaces shared facts with only fact ids and returns the bumped person", async () => {
    handlers.person_set_shared_facts = (args) => ({ data: { ...personRow({ version: 3 }), shared_fact_ids: args.p_fact_ids } });
    const body = await ok(await sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: [f2, f1], expectedVersion: 2 }), ctx(pid)), personResponseSchema);
    expect(body.person).toMatchObject({ version: 3, sharedFactIds: [f2, f1] });
    expect(calls("person_set_shared_facts")).toEqual([{ p_id: pid, p_expected_version: 2, p_fact_ids: [f2, f1] }]);
    handlers.person_set_shared_facts = () => ({ data: { ...personRow({ version: 4 }), shared_fact_ids: [] } });
    await ok(await sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: [], expectedVersion: 3 }), ctx(pid)), personResponseSchema);
  });

  it("reads a person and its links in creation order; another owner's person is 404", async () => {
    tables.people = { data: [personRow({ version: 2 })] };
    tables.person_shared_facts = { data: [{ person_id: pid, fact_id: f2 }, { person_id: pid, fact_id: f1 }] };
    const body = await ok(await personItem.GET(req("GET", `/api/people/${pid}`), ctx(pid)), personResponseSchema);
    expect(body.person).toMatchObject({ id: pid, version: 2, sharedFactIds: [f2, f1], traits: { tone: "warm", formality: "professional" } });
    expect(queries[0].calls).toContainEqual(["eq", ["id", pid]]);
    expect(queries[1]).toMatchObject({ table: "person_shared_facts" });
    expect(queries[1].calls).toContainEqual(["order", ["created_at", { ascending: true }]]);
    tables.people = { data: [] };
    expect((await errorOf(await personItem.GET(req("GET", `/api/people/${pid}`), ctx(pid)), 404)).code).toBe("NOT_FOUND");
  });

  it("lists people most recently updated first with each person's shared fact ids", async () => {
    tables.people = { data: [personRow({ id: pid2, name: "Sam" }), personRow()] };
    tables.person_shared_facts = { data: [{ person_id: pid, fact_id: f1 }, { person_id: pid2, fact_id: f2 }, { person_id: pid, fact_id: f2 }] };
    const body = await ok(await people.GET(req("GET", "/api/people")), peopleListResponseSchema);
    expect(body.people.map(p => [p.id, p.sharedFactIds])).toEqual([[pid2, [f2]], [pid, [f1, f2]]]);
    expect(queries[0].calls).toContainEqual(["order", ["updated_at", { ascending: false }]]);
    expect(queries[1].calls).toContainEqual(["in", ["person_id", [pid2, pid]]]);
    tables.people = { data: [] };
    expect(await ok(await people.GET(req("GET", "/api/people")), peopleListResponseSchema)).toEqual({ people: [] });
  });

  it("maps RPC markers to the contract statuses", async () => {
    handlers.about_me_update = () => marker("NOT_FOUND");
    expect((await errorOf(await aboutMeItem.PATCH(req("PATCH", `/api/about-me/${f1}`, { text: "ok" }), ctx(f1)), 404)).code).toBe("NOT_FOUND");
    handlers.person_delete = () => marker("NOT_FOUND");
    expect((await errorOf(await personItem.DELETE(req("DELETE", `/api/people/${pid}`), ctx(pid)), 404)).code).toBe("NOT_FOUND");
    handlers.person_update = () => marker("VERSION_CONFLICT");
    expect((await errorOf(await personItem.PATCH(req("PATCH", `/api/people/${pid}`, { ...fields, expectedVersion: 1 }), ctx(pid)), 409)).code).toBe("VERSION_CONFLICT");
    handlers.person_set_shared_facts = () => marker("VERSION_CONFLICT");
    expect((await errorOf(await sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: [f1], expectedVersion: 1 }), ctx(pid)), 409)).code).toBe("VERSION_CONFLICT");
    handlers.about_me_create = () => marker("LIMIT_REACHED");
    expect((await errorOf(await aboutMe.POST(req("POST", "/api/about-me", { text: "one more" })), 409)).code).toBe("USAGE_LIMIT");
    handlers.person_create = () => marker("LIMIT_REACHED");
    expect((await errorOf(await people.POST(req("POST", "/api/people", fields)), 409)).code).toBe("USAGE_LIMIT");
    handlers.person_set_shared_facts = () => marker("INVALID_INPUT");
    expect((await errorOf(await sharedFacts.PUT(req("PUT", `/api/people/${pid}/shared-facts`, { factIds: [f2], expectedVersion: 1 }), ctx(pid)), 400)).code).toBe("VALIDATION_ERROR");
  });

  it("lists, creates and deletes owner-scoped saved situations through M1 RPCs", async () => {
    const value = {
      publicContext: "A launch task needs to move.", opening: "Which task?", constraints: ["Stay on this launch."],
      challenge: "mild_pushback", pace: "conversational", wants: "Keep launch on track",
      holdsBackBecause: "The team is short staffed", softensWhen: "You name what to drop",
    };
    const stored = { id: sid, person_id: pid, label: "Launch workload", situation: value, created_at: ts, updated_at: ts };
    handlers.person_situation_list = () => ({ data: [stored] });
    handlers.person_situation_create = (args) => ({ data: { ...stored, label: args.p_label, situation: args.p_situation } });
    handlers.person_situation_delete = () => ({ data: { deleted: true } });
    const listed = await ok(await situations.GET(req("GET", `/api/people/${pid}/situations`), ctx(pid)), personSituationsResponseSchema);
    expect(listed.situations[0]).toMatchObject({ id: sid, label: "Launch workload", situation: value });
    const created = await ok(await situations.POST(req("POST", `/api/people/${pid}/situations`, { label: " Launch workload ", situation: value }), ctx(pid)), personSituationResponseSchema, 201);
    expect(created.situation.label).toBe("Launch workload");
    expect(calls("person_situation_create")).toEqual([{ p_person_id: pid, p_label: "Launch workload", p_situation: value }]);
    const deleted = await situationItem.DELETE(req("DELETE", `/api/people/${pid}/situations/${sid}`), { params: Promise.resolve({ id: pid, situationId: sid }) });
    expect(await ok(deleted, deletedResponseSchema)).toEqual({ deleted: true });
    expect(calls("person_situation_delete")).toEqual([{ p_id: sid }]);
  });

  it("deletes a situation only through its own person's URL", async () => {
    handlers.person_situation_list = () => ({ data: [] });
    handlers.person_situation_delete = () => ({ data: { deleted: true } });
    const response = await situationItem.DELETE(req("DELETE", `/api/people/${pid}/situations/${sid}`), { params: Promise.resolve({ id: pid, situationId: sid }) });
    expect((await errorOf(response, 404)).code).toBe("NOT_FOUND");
    expect(calls("person_situation_delete")).toEqual([]);
  });

  it("maps saved-situation owner isolation and cap markers", async () => {
    handlers.person_situation_list = () => marker("NOT_FOUND");
    expect((await errorOf(await situations.GET(req("GET", `/api/people/${pid}/situations`), ctx(pid)), 404)).code).toBe("NOT_FOUND");
    handlers.person_situation_create = () => marker("LIMIT_REACHED");
    const value = { publicContext: "x", opening: "Hi.", constraints: [], challenge: "neutral", pace: "patient" };
    expect((await errorOf(await situations.POST(req("POST", `/api/people/${pid}/situations`, { label: "One", situation: value }), ctx(pid)), 409)).code).toBe("USAGE_LIMIT");
    handlers.person_situation_delete = () => marker("NOT_FOUND");
    expect((await errorOf(await situationItem.DELETE(req("DELETE", `/api/people/${pid}/situations/${sid}`), { params: Promise.resolve({ id: pid, situationId: sid }) }), 404)).code).toBe("NOT_FOUND");
  });

  it("turns malformed rows and raw database errors into a sanitized 503", async () => {
    handlers.person_create = () => ({ data: { ...personRow({ traits: { tone: "furious" } }), shared_fact_ids: [] } });
    const malformed = JSON.stringify(await errorOf(await people.POST(req("POST", "/api/people", fields)), 503));
    expect(malformed).not.toContain("furious");
    handlers.about_me_create = () => ({ data: factRow({ created_at: "not a date" }) });
    expect((await errorOf(await aboutMe.POST(req("POST", "/api/about-me", { text: "ok" })), 503)).code).toBe("PROVIDER_UNAVAILABLE");
    handlers.about_me_delete = () => ({ data: { deleted: false } });
    await errorOf(await aboutMeItem.DELETE(req("DELETE", `/api/about-me/${f1}`), ctx(f1)), 503);
    tables.about_me_facts = { error: { code: "42501", message: "permission denied for table about_me_facts" } };
    expect(JSON.stringify(await errorOf(await aboutMe.GET(req("GET", "/api/about-me")), 503))).not.toContain("permission");
    tables.people = { data: [personRow()] };
    tables.person_shared_facts = { data: [{ person_id: pid, fact_id: "not-a-uuid" }] };
    await errorOf(await personItem.GET(req("GET", `/api/people/${pid}`), ctx(pid)), 503);
    rpc.mockRejectedValueOnce(new Error("socket hang up secret-token"));
    expect(JSON.stringify(await errorOf(await personItem.DELETE(req("DELETE", `/api/people/${pid}`), ctx(pid)), 503))).not.toContain("secret-token");
  });

  it("keeps private prep standalone: notes only, never linked to a person", async () => {
    tables.private_prep = { data: null };
    const empty = await ok(await privatePrep.GET(req("GET", "/api/private-prep")), privatePrepResponseSchema);
    expect(empty).toEqual({ privatePrep: { notes: "", updatedAt: null } });
    expect(queries[0]).toMatchObject({ table: "private_prep" });
    expect(queries[0].calls).toContainEqual(["select", ["notes, updated_at"]]);
    handlers.private_prep_put = (args) => ({ data: { notes: args.p_notes, updated_at: ts } });
    const saved = await ok(await privatePrep.PUT(req("PUT", "/api/private-prep", { notes: "  I get nervous asking for things.  " })), privatePrepResponseSchema);
    expect(saved).toEqual({ privatePrep: { notes: "I get nervous asking for things.", updatedAt: iso } });
    expect(calls("private_prep_put")).toEqual([{ p_notes: "I get nervous asking for things." }]);
    handlers.private_prep_put = () => ({ data: { notes: "", updated_at: null } });
    expect(await ok(await privatePrep.PUT(req("PUT", "/api/private-prep", { notes: "   " })), privatePrepResponseSchema)).toEqual({ privatePrep: { notes: "", updatedAt: null } });
    expect(rpc.mock.calls.every(([name]) => name === "private_prep_put")).toBe(true);
    expect(queries.every(q => q.table === "private_prep")).toBe(true);
    expect(JSON.stringify(rpc.mock.calls)).not.toMatch(/person|people|fact/i);
  });
});
