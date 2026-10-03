import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import { deletePracticeDataRequestSchema, deletePracticeDataResponseSchema, sessionListResponseSchema } from "@/lib/schemas/practice-data";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import * as sessions from "@/app/api/sessions/route";
import * as practiceData from "@/app/api/practice-data/route";
import { deletePracticeData, listSessions, retryCleanup } from "@/lib/practice-data/api-client";

const owner = "11111111-1111-4111-8111-111111111111", s1 = "22222222-2222-4222-8222-222222222222", s2 = "33333333-3333-4333-8333-333333333333";
const p1 = "44444444-4444-4444-8444-444444444444", p2 = "55555555-5555-4555-8555-555555555555";
const f1 = "66666666-6666-4666-8666-666666666666", f2 = "77777777-7777-4777-8777-777777777777";
const ts = "2026-10-03T21:00:00.123456+00:00", iso = "2026-10-03T21:00:00.123Z";
const confirm = { confirm: "delete my practice data" };
type Result = { data?: unknown; error?: { code: string; message: string } };
let handlers: Record<string, (args: Record<string, unknown>) => Result>, tables: Record<string, Result | (() => Result)>;
let rpc: ReturnType<typeof vi.fn>, queries: { table: string; calls: [string, unknown[]][] }[];

const marker = (message: string) => ({ error: { code: "P0001", message } });
const req = (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://127.0.0.1:3000${url}`, { method, headers, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });
const calls = (name: string) => rpc.mock.calls.filter(([called]) => called === name).map(([, args]) => args as Record<string, unknown>);
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  return errorSchema.parse(await response.json());
}

function from(table: string) {
  const query = { table, calls: [] as [string, unknown[]][] };
  queries.push(query);
  const result = () => {
    const configured = tables[table];
    const r = typeof configured === "function" ? configured() : configured;
    return { data: r?.data ?? null, error: r ? r.error ?? null : { code: "XX000", message: "unhandled" } };
  };
  const builder: object = new Proxy({}, {
    get(_, prop) {
      if (prop === "then") return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject);
      return (...args: unknown[]) => { query.calls.push([String(prop), args]); return builder; };
    },
  });
  return builder;
}

// Rows disappear when their delete RPC succeeds, so the re-read reflects what each RPC did.
function store(people: string[], facts: string[], prep: boolean) {
  const state = { people: [...people], facts: [...facts], prep };
  tables.people = () => ({ data: state.people.map(id => ({ id })) });
  tables.about_me_facts = () => ({ data: state.facts.map(id => ({ id })) });
  tables.private_prep = () => ({ data: state.prep ? [{ owner_id: owner }] : [] });
  handlers.person_delete = ({ p_id }) => { state.people = state.people.filter(id => id !== p_id); return { data: { deleted: true } }; };
  handlers.about_me_delete = ({ p_id }) => { state.facts = state.facts.filter(id => id !== p_id); return { data: { deleted: true } }; };
  handlers.private_prep_put = () => { state.prep = false; return { data: { notes: "", updated_at: null } }; };
  return state;
}

beforeEach(() => {
  handlers = {}; tables = {}; queries = [];
  rpc = vi.fn(async (name: string, args: Record<string, unknown>) => { const r = handlers[name]?.(args) ?? { error: { code: "XX000", message: "unhandled" } }; return { data: r.data ?? null, error: r.error ?? null }; });
  identity.requireIdentity.mockReset();
  identity.requireIdentity.mockResolvedValue({ client: { rpc, from: vi.fn(from) }, identity: { id: owner, isAnonymous: false } });
});

describe("GET /api/sessions and DELETE /api/practice-data", () => {
  it("returns 401 before reading the body or touching storage, and 403 cross-origin", async () => {
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    const del = req("DELETE", "/api/practice-data", "not json");
    expect((await errorOf(await sessions.GET(req("GET", "/api/sessions")), 401)).code).toBe("UNAUTHENTICATED");
    expect((await errorOf(await practiceData.DELETE(del), 401)).code).toBe("UNAUTHENTICATED");
    expect(del.bodyUsed).toBe(false);
    identity.requireIdentity.mockReset();
    const evil = { origin: "https://evil.example" };
    expect((await errorOf(await sessions.GET(req("GET", "/api/sessions", undefined, evil)), 403)).code).toBe("FORBIDDEN");
    expect((await errorOf(await practiceData.DELETE(req("DELETE", "/api/practice-data", confirm, evil)), 403)).code).toBe("FORBIDDEN");
    expect(identity.requireIdentity).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled(); expect(queries).toHaveLength(0);
  });

  it("lists sessions with only status and cleanup columns, newest first, at most 50", async () => {
    tables.practice_sessions = { data: [
      { id: s2, status: "active", cleanup: "not_started", created_at: ts, ended_at: null },
      { id: s1, status: "ended", cleanup: "unresolved", created_at: "2026-10-03T20:00:00+00:00", ended_at: ts },
    ] };
    const response = await sessions.GET(req("GET", "/api/sessions"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = sessionListResponseSchema.parse(await response.json());
    expect(body.sessions).toEqual([
      { id: s2, status: "active", cleanup: "not_started", createdAt: iso, endedAt: null },
      { id: s1, status: "ended", cleanup: "unresolved", createdAt: "2026-10-03T20:00:00.000Z", endedAt: iso },
    ]);
    const [query] = queries;
    expect(query.table).toBe("practice_sessions");
    expect(query.calls).toEqual([["select", ["id, status, cleanup, created_at, ended_at"]], ["order", ["created_at", { ascending: false }]], ["limit", [50]]]);
    expect(JSON.stringify(query.calls)).not.toMatch(/provider_conversation_id|request_fingerprint|idempotency_key/);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("never echoes extra row fields and turns malformed or failed reads into a sanitized 503", async () => {
    tables.practice_sessions = { data: [{ id: s1, status: "ended", cleanup: "confirmed", created_at: ts, ended_at: ts, provider_conversation_id: "c-secret" }] };
    const body = await (await sessions.GET(req("GET", "/api/sessions"))).json();
    expect(JSON.stringify(body)).not.toContain("c-secret");
    tables.practice_sessions = { data: [{ id: s1, status: "paused", cleanup: "confirmed", created_at: ts, ended_at: null }] };
    expect(JSON.stringify(await errorOf(await sessions.GET(req("GET", "/api/sessions")), 503))).not.toContain("paused");
    tables.practice_sessions = { error: { code: "42501", message: "permission denied for table practice_sessions" } };
    expect(JSON.stringify(await errorOf(await sessions.GET(req("GET", "/api/sessions")), 503))).not.toContain("permission");
  });

  it("rejects a missing, wrong, padded or oversized confirmation before storage", async () => {
    const bodies: unknown[] = [undefined, {}, { confirm: "delete" }, { confirm: "Delete my practice data" }, { confirm: " delete my practice data" }, { ...confirm, all: true }, JSON.stringify(confirm) + " ".repeat(256)];
    for (const body of bodies) expect((await errorOf(await practiceData.DELETE(req("DELETE", "/api/practice-data", body)), 400)).code).toBe("VALIDATION_ERROR");
    expect(rpc).not.toHaveBeenCalled(); expect(queries).toHaveLength(0);
  });

  it("deletes every person, fact and private prep through the owner RPCs and reports session counts", async () => {
    store([p1, p2], [f1, f2], true);
    tables.practice_sessions = { data: [{ cleanup: "confirmed" }, { cleanup: "pending" }, { cleanup: "unresolved" }, { cleanup: "not_started" }] };
    const response = await practiceData.DELETE(req("DELETE", "/api/practice-data", confirm));
    expect(response.status).toBe(200);
    expect(deletePracticeDataResponseSchema.parse(await response.json())).toEqual({
      deleted: { aboutMeFacts: 2, people: 2, privatePrep: true },
      remaining: { aboutMeFacts: 0, people: 0, privatePrep: false },
      sessions: { total: 4, cleanupConfirmed: 1, cleanupOutstanding: 2 },
    });
    expect(calls("person_delete")).toEqual([{ p_id: p1 }, { p_id: p2 }]);
    expect(calls("about_me_delete")).toEqual([{ p_id: f1 }, { p_id: f2 }]);
    expect(calls("private_prep_put")).toEqual([{ p_notes: "" }]);
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(["person_delete", "person_delete", "about_me_delete", "about_me_delete", "private_prep_put"]);
    const allCalls = queries.flatMap(q => q.calls.map(([method]) => method));
    expect(allCalls.every(method => method === "select")).toBe(true);
    expect(queries.find(q => q.table === "practice_sessions")?.calls).toEqual([["select", ["cleanup"]]]);
  });

  it("does not count an already-gone (NOT_FOUND) item as deleted, continues past a failure and reports what remains", async () => {
    const state = store([p1, p2], [f1, f2], true);
    handlers.person_delete = ({ p_id }) => {
      if (p_id !== p1) return { error: { code: "57014", message: "statement timeout" } };
      state.people = state.people.filter(id => id !== p1);
      return marker("NOT_FOUND");
    };
    const factDelete = handlers.about_me_delete;
    handlers.about_me_delete = (args) => (args.p_id === f1 ? marker("VERSION_CONFLICT") : factDelete(args));
    tables.practice_sessions = { data: [] };
    const body = deletePracticeDataResponseSchema.parse(await (await practiceData.DELETE(req("DELETE", "/api/practice-data", confirm))).json());
    expect(body).toEqual({
      deleted: { aboutMeFacts: 1, people: 0, privatePrep: true },
      remaining: { aboutMeFacts: 1, people: 1, privatePrep: false },
      sessions: { total: 0, cleanupConfirmed: 0, cleanupOutstanding: 0 },
    });
    expect(calls("about_me_delete")).toEqual([{ p_id: f1 }, { p_id: f2 }]);
    expect(calls("private_prep_put")).toHaveLength(1);
  });

  it("reports private prep as remaining when clearing it fails, and nothing deleted when none existed", async () => {
    store([], [], true);
    handlers.private_prep_put = () => ({ error: { code: "XX000", message: "boom" } });
    tables.practice_sessions = { data: [] };
    let body = deletePracticeDataResponseSchema.parse(await (await practiceData.DELETE(req("DELETE", "/api/practice-data", confirm))).json());
    expect(body.deleted.privatePrep).toBe(false); expect(body.remaining.privatePrep).toBe(true);
    store([], [], false);
    body = deletePracticeDataResponseSchema.parse(await (await practiceData.DELETE(req("DELETE", "/api/practice-data", confirm))).json());
    expect(body.deleted).toEqual({ aboutMeFacts: 0, people: 0, privatePrep: false });
    expect(body.remaining).toEqual({ aboutMeFacts: 0, people: 0, privatePrep: false });
  });

  it("stops with 401 when the session is lost mid-deletion and 503 when the inventory cannot be read", async () => {
    store([p1, p2], [f1], false);
    handlers.person_delete = () => marker("FORBIDDEN");
    expect((await errorOf(await practiceData.DELETE(req("DELETE", "/api/practice-data", confirm)), 401)).code).toBe("UNAUTHENTICATED");
    expect(calls("person_delete")).toHaveLength(1); expect(calls("about_me_delete")).toHaveLength(0);
    rpc.mockClear();
    tables.people = { error: { code: "42501", message: "permission denied for table people" } };
    expect(JSON.stringify(await errorOf(await practiceData.DELETE(req("DELETE", "/api/practice-data", confirm)), 503))).not.toContain("permission");
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("practice-data client", () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  function stubFetch(response: Response) { const fetchMock = vi.fn().mockResolvedValue(response); vi.stubGlobal("fetch", fetchMock); return fetchMock; }
  const sent = (fetchMock: ReturnType<typeof vi.fn>) => { const [url, init] = fetchMock.mock.calls[0]; return { url, method: init.method, body: init.body === undefined ? undefined : JSON.parse(init.body), init }; };
  const summary = { id: s1, status: "ended", cleanup: "pending", createdAt: iso, endedAt: iso };

  it("lists sessions with a bodiless same-origin GET", async () => {
    const fetchMock = stubFetch(Response.json({ sessions: [summary] }));
    await expect(listSessions()).resolves.toEqual([summary]);
    const { url, method, body, init } = sent(fetchMock);
    expect([url, method, body]).toEqual(["/api/sessions", "GET", undefined]);
    expect(init).toMatchObject({ credentials: "same-origin", cache: "no-store" });
  });
  it("deletes with exactly the confirmation phrase", async () => {
    const result = { deleted: { aboutMeFacts: 1, people: 0, privatePrep: false }, remaining: { aboutMeFacts: 0, people: 0, privatePrep: false }, sessions: { total: 1, cleanupConfirmed: 1, cleanupOutstanding: 0 } };
    const fetchMock = stubFetch(Response.json(result));
    await expect(deletePracticeData()).resolves.toEqual(result);
    const { url, method, body } = sent(fetchMock);
    expect([url, method, body]).toEqual(["/api/practice-data", "DELETE", confirm]);
    expect(deletePracticeDataRequestSchema.safeParse(body).success).toBe(true);
  });
  it("retries cleanup through the idempotent end route with reason user", async () => {
    const fetchMock = stubFetch(Response.json({ session: { id: s1, status: "ended", expiresAt: iso, cleanup: "confirmed" } }));
    await expect(retryCleanup(s1)).resolves.toMatchObject({ id: s1, cleanup: "confirmed" });
    expect(sent(fetchMock)).toMatchObject({ url: `/api/sessions/${s1}/end`, method: "POST", body: { reason: "user" } });
  });
  it("rejects malformed responses and surfaces typed errors", async () => {
    stubFetch(Response.json({ sessions: [{ ...summary, providerConversationId: "c-1" }] }));
    await expect(listSessions()).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    stubFetch(Response.json({ code: "UNAUTHENTICATED", message: "Sign in to continue.", retryable: false, request_id: s2 }, { status: 401 }));
    await expect(deletePracticeData()).rejects.toMatchObject({ code: "UNAUTHENTICATED", status: 401 });
  });
});
