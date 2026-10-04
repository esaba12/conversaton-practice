import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import { buildRoleContext, type RoleContext } from "@/lib/schemas/role-context";
import { personToRole } from "@/lib/schemas/people";
import { sessionResponseSchema, startRequestSchema, startResponseSchema } from "@/lib/schemas/session";
import { decline } from "@/fixtures/decline";
import { professor } from "@/fixtures/professor";
import { roommate } from "@/fixtures/roommate";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import { POST as start } from "@/app/api/sessions/route";
import { POST as connect } from "@/app/api/sessions/[id]/connected/route";
import { POST as end } from "@/app/api/sessions/[id]/end/route";
import { startFingerprint } from "@/lib/session/server";
const SECRET = "s".repeat(40);

const id = "11111111-1111-4111-8111-111111111111", other = "22222222-2222-4222-8222-222222222222";
const key = "33333333-3333-4333-8333-333333333333";
type Rpc = (args: Record<string, unknown>) => { data?: unknown; error?: { code: string; message: string } };
let handlers: Record<string, Rpc>, rpc: ReturnType<typeof vi.fn>, active: string[];
const row = (patch: Record<string, unknown> = {}) => ({ id, owner_id: other, status: "connecting", cleanup: "not_started", provider_conversation_id: null, created_at: "2026-10-03T18:00:00.000000+00:00", expires_at: new Date(Date.now() + 180_000).toISOString().replace("Z", "+00:00"), ...patch });
const marker = (message: string) => ({ error: { code: "P0001", message } });
const post = (url: string, body?: unknown, headers: Record<string, string> = {}) => new Request(`http://127.0.0.1:3000${url}`, { method: "POST", headers, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });
const ctx = (value: string) => ({ params: Promise.resolve({ id: value }) });
const startBody = { idempotencyKey: key, preset: "roommate", durationSeconds: 180 };
const reviewed: RoleContext = {
  name: "Jordan", role: "Your fictional manager", style: "Busy but fair; asks for specifics.",
  publicContext: "You work on the same product team. A one-on-one is scheduled for Friday afternoon.",
  opening: "Thanks for grabbing time. What did you want to cover?", constraints: ["Stay in a workplace one-on-one.", "Do not give communication advice."],
  challenge: "mild_pushback", pace: "conversational",
};
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  return errorSchema.parse(await response.json());
}
function tavus(overrides: { create?: () => Promise<Response>; remove?: () => Promise<Response> } = {}) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    if (init.method === "POST" && url.endsWith("/conversations")) return overrides.create ? overrides.create() : Response.json({ conversation_id: "provider-1", conversation_url: "https://tavus.daily.co/provider-1", meeting_token: "unit-token" });
    if (init.method === "POST" && url.endsWith("/end")) return new Response(null, { status: 200 });
    if (init.method === "GET") return Response.json({ status: "ended" });
    if (init.method === "DELETE") return overrides.remove ? overrides.remove() : new Response(null, { status: 200 });
    throw new Error("unexpected provider call");
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const calls = (name: string) => rpc.mock.calls.filter(([called]) => called === name).map(([, args]) => args);

beforeEach(() => {
  vi.stubEnv("SESSION_SERVER_SECRET", SECRET);
  vi.stubEnv("TAVUS_API_KEY", "unit-secret"); vi.stubEnv("TAVUS_PAL_ID", "unit-pal"); vi.stubEnv("TAVUS_FACE_ID", "unit-face");
  handlers = {}; active = [];
  rpc = vi.fn(async (name: string, args: Record<string, unknown>) => { const result = handlers[name]?.(args) ?? { error: { code: "XX000", message: "unhandled" } }; return { data: result.data ?? null, error: result.error ?? null }; });
  const from = vi.fn(() => ({ select: () => ({ in: () => ({ limit: async () => ({ data: active.map((value) => ({ id: value })), error: null }) }) }) }));
  identity.requireIdentity.mockResolvedValue({ client: { rpc, from }, identity: { id: other, isAnonymous: false } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("session routes", () => {
  it("rejects unauthenticated callers before touching storage or the provider", async () => {
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    const fetchMock = tavus();
    expect((await errorOf(await start(post("/api/sessions", startBody)), 401)).code).toBe("UNAUTHENTICATED");
    expect((await errorOf(await end(post(`/api/sessions/${id}/end`, { reason: "user" }), ctx(id)), 401)).code).toBe("UNAUTHENTICATED");
    expect(rpc).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid ids, bodies, extra fields and cross-site origins with 400/403", async () => {
    expect((await errorOf(await end(post("/api/sessions/not-a-uuid/end", { reason: "user" }), ctx("not-a-uuid")), 400)).code).toBe("VALIDATION_ERROR");
    await errorOf(await end(post(`/api/sessions/${id}/end`, { reason: "user", providerId: "forged" }), ctx(id)), 400);
    await errorOf(await connect(post(`/api/sessions/${id}/connected`, "not json"), ctx(id)), 400);
    await errorOf(await start(post("/api/sessions", { ...startBody, durationSeconds: 60 })), 400);
    await errorOf(await start(post("/api/sessions", startBody, { origin: "https://evil.example" })), 403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed without the server capability", async () => {
    vi.stubEnv("SESSION_SERVER_SECRET", "");
    expect((await errorOf(await start(post("/api/sessions", startBody)), 503)).code).toBe("NOT_CONFIGURED");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns a credential only for a fresh, bound live session using the server fixture", async () => {
    handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
    handlers.practice_bind = (args) => ({ data: row({ provider_conversation_id: args.p_provider_id }) });
    const fetchMock = tavus();
    const response = await start(post("/api/sessions", startBody));
    expect(response.status).toBe(201);
    const body = startResponseSchema.parse(await response.json());
    expect(body.session).toMatchObject({ id, status: "connecting", cleanup: "not_started" });
    expect(calls("practice_bind")[0]).toMatchObject({ p_id: id, p_provider_id: "provider-1" });
    expect(calls("practice_acquire")[0]).toMatchObject({ p_key: key, p_duration: 180, p_person_id: null, p_person_version: null, p_fingerprint: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).conversational_context).toContain("Alex");
  });

  it("starts a fresh call with exactly the reviewed role and forwards no other field", async () => {
    handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
    handlers.practice_bind = (args) => ({ data: row({ provider_conversation_id: args.p_provider_id }) });
    const fetchMock = tavus();
    const response = await start(post("/api/sessions", { idempotencyKey: key, role: reviewed, durationSeconds: 300 }));
    expect(response.status).toBe(201);
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(sent.conversational_context).toBe(buildRoleContext(reviewed));
    expect(sent.conversational_context).toContain(reviewed.name); expect(sent.conversational_context).toContain(reviewed.publicContext);
    expect(sent.conversational_context).not.toContain("Alex");
    expect(sent.custom_greeting).toBe(reviewed.opening);
    expect(sent.properties.max_call_duration).toBe(300);
    expect(Object.keys(sent).sort()).toEqual(["audio_only", "conversational_context", "custom_greeting", "face_id", "max_participants", "pal_id", "participant_tags", "properties", "require_auth"]);
    expect(calls("practice_acquire")[0]).toMatchObject({ p_duration: 300, p_person_id: null, p_person_version: null, p_fingerprint: startFingerprint(reviewed, 300, SECRET) });
  });

  it("rejects private or unknown fields at the schema boundary before storage or the provider", async () => {
    const fetchMock = tavus();
    const leaks = [
      { idempotencyKey: key, role: { ...reviewed, privateNotes: "PRIVATE-FEAR" }, durationSeconds: 180 },
      { idempotencyKey: key, role: reviewed, goal: "PRIVATE-GOAL", durationSeconds: 180 },
      { ...startBody, role: reviewed },
    ];
    for (const body of leaks) await errorOf(await start(post("/api/sessions", body)), 400);
    expect(startRequestSchema.safeParse(leaks[0]).success).toBe(false);
    expect(rpc).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a maximal reviewed role up to the 8192-character body limit only", async () => {
    handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
    handlers.practice_bind = (args) => ({ data: row({ provider_conversation_id: args.p_provider_id }) });
    tavus();
    const long = { ...reviewed, publicContext: "p".repeat(1500), style: "s".repeat(300), constraints: Array.from({ length: 5 }, () => "c".repeat(200)) };
    const text = JSON.stringify({ idempotencyKey: key, role: long, durationSeconds: 180 });
    expect(text.length).toBeGreaterThan(2048);
    expect((await start(post("/api/sessions", text))).status).toBe(201);
    await errorOf(await start(post("/api/sessions", text + " ".repeat(8193 - text.length))), 400);
  });

  it("fingerprints the resolved role canonically", async () => {
    const reordered = Object.fromEntries(Object.entries(reviewed).reverse()) as RoleContext;
    expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(reviewed));
    expect(startFingerprint(reordered, 180, SECRET)).toBe(startFingerprint(reviewed, 180, SECRET));
    expect(startFingerprint(reviewed, 180, SECRET)).not.toBe(startFingerprint(roommate, 180, SECRET));
    expect(startFingerprint(professor, 180, SECRET)).not.toBe(startFingerprint(roommate, 180, SECRET));
    expect(startFingerprint(decline, 180, SECRET)).not.toBe(startFingerprint(roommate, 180, SECRET));
    expect(startFingerprint(professor, 180, SECRET)).not.toBe(startFingerprint(decline, 180, SECRET));
    expect(startFingerprint(reviewed, 180, SECRET)).not.toBe(startFingerprint(reviewed, 300, SECRET));
    expect(startFingerprint({ ...reviewed, constraints: [...reviewed.constraints].reverse() }, 180, SECRET)).not.toBe(startFingerprint(reviewed, 180, SECRET));
    handlers.practice_acquire = () => marker("SESSION_ACTIVE");
    await start(post("/api/sessions", startBody));
    await start(post("/api/sessions", { idempotencyKey: key, role: reordered, durationSeconds: 180 }));
    const [preset, custom] = calls("practice_acquire").map((args) => args.p_fingerprint);
    expect(preset).toBe(startFingerprint(roommate, 180, SECRET));
    expect(custom).toBe(startFingerprint(reviewed, 180, SECRET));
  });

  it("maps professor and decline to their fixtures and rejects a fourth preset", async () => {
    handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
    handlers.practice_bind = (args) => ({ data: row({ provider_conversation_id: args.p_provider_id }) });
    const fetchMock = tavus();
    for (const [preset, fixture] of [["professor", professor], ["decline", decline]] as const) {
      expect((await start(post("/api/sessions", { idempotencyKey: key, preset, durationSeconds: 180 }))).status).toBe(201);
      const sent = JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1].body));
      expect(sent.conversational_context).toBe(buildRoleContext(fixture));
      expect(sent.custom_greeting).toBe(fixture.opening);
      expect(sent.conversational_context).not.toContain("Alex");
      expect(calls("practice_acquire").at(-1)).toMatchObject({ p_fingerprint: startFingerprint(fixture, 180, SECRET) });
    }
    const providerCalls = fetchMock.mock.calls.length;
    const storageCalls = rpc.mock.calls.length;
    await errorOf(await start(post("/api/sessions", { idempotencyKey: key, preset: "manager", durationSeconds: 180 })), 400);
    await errorOf(await start(post("/api/sessions", { idempotencyKey: key, preset: "professor", privateNotes: "PRIVATE-NOTE", durationSeconds: 180 })), 400);
    expect(fetchMock.mock.calls.length).toBe(providerCalls);
    expect(rpc.mock.calls.length).toBe(storageCalls);
  });

  it("surfaces the database's fingerprint conflict when a key is replayed with a different role", async () => {
    handlers.practice_acquire = () => marker("IDEMPOTENCY_CONFLICT");
    const fetchMock = tavus();
    const error = await errorOf(await start(post("/api/sessions", { idempotencyKey: key, role: reviewed, durationSeconds: 180 })), 409);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps an idempotent replay to 409 SESSION_ACTIVE naming the caller's session, without a provider call", async () => {
    handlers.practice_acquire = () => ({ data: { created: false, session: row({ status: "active", provider_conversation_id: "provider-1" }) } });
    const fetchMock = tavus();
    const error = await errorOf(await start(post("/api/sessions", startBody)), 409);
    expect(error).toMatchObject({ code: "SESSION_ACTIVE", session_id: id });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("names the existing lease when the database reports SESSION_ACTIVE", async () => {
    handlers.practice_acquire = () => marker("SESSION_ACTIVE"); active = [other];
    expect(await errorOf(await start(post("/api/sessions", startBody)), 409)).toMatchObject({ code: "SESSION_ACTIVE", session_id: other });
  });

  it("makes exactly one create attempt on timeout, ends the lease and reports non-retryable", async () => {
    handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
    handlers.practice_end = () => ({ data: row({ status: "interrupted", cleanup: "unresolved" }) });
    const fetchMock = tavus({ create: () => Promise.reject(new DOMException("timed out", "TimeoutError")) });
    const response = await start(post("/api/sessions", startBody));
    const error = await errorOf(response, 503);
    expect(error).toMatchObject({ code: "PROVIDER_UNAVAILABLE", retryable: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calls("practice_end")).toEqual([expect.objectContaining({ p_id: id, p_reason: "connection_failure" })]);
    expect(calls("practice_bind")).toHaveLength(0);
  });

  it("cleans up the remote call and withholds the credential when End wins the race", async () => {
    handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
    handlers.practice_bind = (args) => ({ data: row({ status: "ended", cleanup: "pending", provider_conversation_id: args.p_provider_id }) });
    handlers.practice_cleanup = () => ({ data: row({ status: "ended", cleanup: "confirmed", provider_conversation_id: "provider-1" }) });
    const fetchMock = tavus();
    const response = await start(post("/api/sessions", startBody));
    const text = await response.clone().text();
    expect((await errorOf(response, 409)).code).toBe("SESSION_EXPIRED");
    expect(text).not.toContain("unit-token"); expect(text).not.toContain("daily.co");
    expect(fetchMock.mock.calls.some(([url, init]) => init.method === "DELETE" && String(url).endsWith("/conversations/provider-1?hard=true"))).toBe(true);
    expect(calls("practice_cleanup")).toEqual([expect.objectContaining({ p_id: id, p_cleanup: "confirmed" })]);
  });

  it("ends the lease and stops the remote call when binding fails", async () => {
    handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
    handlers.practice_bind = () => marker("ASSOCIATION_CONFLICT");
    handlers.practice_end = () => ({ data: row({ status: "interrupted", cleanup: "unresolved" }) });
    const fetchMock = tavus();
    expect((await errorOf(await start(post("/api/sessions", startBody)), 503)).retryable).toBe(false);
    expect(calls("practice_end")[0]).toMatchObject({ p_reason: "connection_failure" });
    expect(fetchMock.mock.calls.some(([, init]) => init.method === "DELETE")).toBe(true);
  });

  it("keeps End idempotent and retries pending remote cleanup on repeat", async () => {
    handlers.practice_end = () => ({ data: row({ status: "ended", cleanup: "pending", provider_conversation_id: "provider-1" }) });
    handlers.practice_cleanup = () => ({ data: row({ status: "ended", cleanup: "confirmed", provider_conversation_id: "provider-1" }) });
    tavus({ remove: async () => new Response("provider internal detail", { status: 500 }) });
    const first = await end(post(`/api/sessions/${id}/end`, { reason: "user" }), ctx(id));
    expect(first.status).toBe(200);
    expect(sessionResponseSchema.parse(await first.json()).session).toMatchObject({ status: "ended", cleanup: "pending" });
    expect(calls("practice_cleanup")).toHaveLength(0);
    tavus();
    const second = await end(post(`/api/sessions/${id}/end`, { reason: "user" }), ctx(id));
    expect(sessionResponseSchema.parse(await second.json()).session.cleanup).toBe("confirmed");
    expect(calls("practice_end")).toHaveLength(2);
  });

  it("skips provider calls when nothing is bound or cleanup is already confirmed", async () => {
    handlers.practice_end = () => ({ data: row({ status: "ended", cleanup: "unresolved" }) });
    const fetchMock = tavus();
    expect((await end(post(`/api/sessions/${id}/end`, { reason: "navigation" }), ctx(id))).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("acknowledges connection and maps terminal sessions to SESSION_EXPIRED", async () => {
    handlers.practice_connected = () => ({ data: row({ status: "active", provider_conversation_id: "provider-1" }) });
    const ok = await connect(post(`/api/sessions/${id}/connected`, {}), ctx(id));
    expect(sessionResponseSchema.parse(await ok.json()).session.status).toBe("active");
    handlers.practice_connected = () => marker("SESSION_CLOSED");
    expect((await errorOf(await connect(post(`/api/sessions/${id}/connected`, {}), ctx(id)), 409)).code).toBe("SESSION_EXPIRED");
  });

  describe("saved person", () => {
    const personId = "55555555-5555-4555-8555-555555555555", key2 = "44444444-4444-4444-8444-444444444444";
    const stored = {
      id: personId, version: 2, name: "Sam", relationship: "Your fictional coworker", traits: { tone: "blunt" }, style: "Direct; prefers specifics.",
      public_context: "You share a desk on the design team.", opening: "Hey, got a minute?", constraints: ["Stay at work."], challenge: "neutral", pace: "patient",
      known_about_user: ["SHARED-FACT I run on weekends"],
    };
    const personBody = { idempotencyKey: key, personId, expectedVersion: 2, durationSeconds: 180 };
    function live(data: Record<string, unknown> = stored) {
      handlers.person_context = (args) => args.p_id === personId && args.p_expected_version === data.version ? { data } : marker(args.p_id === personId ? "VERSION_CONFLICT" : "NOT_FOUND");
      // Rows the caller also owns but which must never reach the builder.
      handlers.private_prep_get = () => ({ data: { notes: "PRIVATE-PREP-MARKER" } });
      handlers.about_me_list = () => ({ data: [{ text: "SHARED-FACT I run on weekends" }, { text: "UNSHARED-FACT-MARKER" }] });
      handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
      handlers.practice_bind = (args) => ({ data: row({ provider_conversation_id: args.p_provider_id }) });
    }
    const sentBody = (fetchMock: ReturnType<typeof tavus>, index = 0) => JSON.parse(String(fetchMock.mock.calls[index][1].body));

    it("builds the context from the person and only its shared facts, loaded before the lease", async () => {
      live(); const fetchMock = tavus();
      expect((await start(post("/api/sessions", personBody))).status).toBe(201);
      expect(rpc.mock.calls.map(([name]) => name)).toEqual(["person_context", "practice_acquire", "practice_bind"]);
      const role = personToRole({ name: "Sam", relationship: "Your fictional coworker", style: stored.style, publicContext: stored.public_context, opening: stored.opening, constraints: stored.constraints, challenge: "neutral", pace: "patient", traits: { tone: "blunt" } });
      const extras = { traits: { tone: "blunt" as const }, knownAboutUser: stored.known_about_user };
      const sent = sentBody(fetchMock);
      expect(sent.conversational_context).toBe(buildRoleContext(role, extras));
      expect(sent.conversational_context).toContain("SHARED-FACT I run on weekends"); expect(sent.conversational_context).toContain("blunt and direct");
      for (const leak of ["UNSHARED-FACT-MARKER", "PRIVATE-PREP-MARKER", "Alex"]) expect(JSON.stringify(sent)).not.toContain(leak);
      expect(sent.custom_greeting).toBe(stored.opening);
      expect(Object.keys(sent).sort()).toEqual(["audio_only", "conversational_context", "custom_greeting", "face_id", "max_participants", "pal_id", "participant_tags", "properties", "require_auth"]);
      const acquired = calls("practice_acquire")[0];
      const fingerprint = acquired.p_fingerprint;
      expect(acquired).toMatchObject({ p_person_id: personId, p_person_version: 2 });
      expect(fingerprint).toBe(startFingerprint(role, 180, SECRET, { extras, personId, version: 2 }));
      expect(fingerprint).not.toBe(startFingerprint(role, 180, SECRET));
    });

    it("rejects a stale version with 409 and a missing or foreign person with 404, before the lease and provider", async () => {
      live(); const fetchMock = tavus();
      expect((await errorOf(await start(post("/api/sessions", { ...personBody, expectedVersion: 1 })), 409)).code).toBe("VERSION_CONFLICT");
      expect((await errorOf(await start(post("/api/sessions", { ...personBody, personId: other })), 404)).code).toBe("NOT_FOUND");
      expect(rpc.mock.calls.map(([name]) => name)).toEqual(["person_context", "person_context"]);
      expect(calls("practice_acquire")).toHaveLength(0); expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects client-supplied facts, roles or private prep on the person branch", async () => {
      live(); const fetchMock = tavus();
      for (const extra of [{ knownAboutUser: ["INJECTED"] }, { role: reviewed }, { privatePrep: "PRIVATE-PREP-MARKER" }, { preset: "roommate" }]) {
        expect((await errorOf(await start(post("/api/sessions", { ...personBody, ...extra })), 400)).code).toBe("VALIDATION_ERROR");
      }
      expect(rpc).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fails closed with 503 on malformed person_context output", async () => {
      live(); const fetchMock = tavus();
      handlers.person_context = () => ({ data: { ...stored, private_prep: "PRIVATE-PREP-MARKER" } });
      const text = await (await start(post("/api/sessions", personBody))).text();
      expect(errorSchema.parse(JSON.parse(text)).code).toBe("PROVIDER_UNAVAILABLE"); expect(text).not.toContain("PRIVATE-PREP");
      expect(calls("practice_acquire")).toHaveLength(0); expect(fetchMock).not.toHaveBeenCalled();
    });

    it("starts fresh each time and reflects edited traits without carrying history", async () => {
      const fetchMock = tavus();
      live(); await start(post("/api/sessions", personBody));
      live({ ...stored, version: 3, traits: { tone: "warm" } }); await start(post("/api/sessions", { ...personBody, idempotencyKey: key2, expectedVersion: 3 }));
      const [first, second] = [sentBody(fetchMock), sentBody(fetchMock, 1)];
      expect(first.conversational_context).toContain("blunt and direct"); expect(second.conversational_context).toContain("warm and friendly");
      expect(second.conversational_context).not.toContain("blunt");
      expect(Object.keys(second).sort()).toEqual(Object.keys(first).sort());
      const [a, b] = calls("practice_acquire");
      expect(a.p_fingerprint).not.toBe(b.p_fingerprint);
      expect(a).toMatchObject({ p_person_id: personId, p_person_version: 2 });
      expect(b).toMatchObject({ p_person_id: personId, p_person_version: 3 });
    });
  });

  it("never returns raw database or unexpected error messages", async () => {
    handlers.practice_end = () => ({ error: { code: "42501", message: "permission denied for schema auth" } });
    const storage = await end(post(`/api/sessions/${id}/end`, { reason: "user" }), ctx(id));
    expect(JSON.stringify(await errorOf(storage, 503))).not.toContain("permission");
    handlers.practice_end = () => marker("FORBIDDEN");
    expect((await errorOf(await end(post(`/api/sessions/${id}/end`, { reason: "user" }), ctx(id)), 403)).message).not.toContain("FORBIDDEN");
    rpc.mockRejectedValueOnce(new Error("socket hang up secret-token"));
    expect(JSON.stringify(await errorOf(await end(post(`/api/sessions/${id}/end`, { reason: "user" }), ctx(id)), 503))).not.toContain("secret-token");
    identity.requireIdentity.mockRejectedValueOnce(new Error("unexpected internal detail"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const unexpected = await errorOf(await end(post(`/api/sessions/${id}/end`, { reason: "user" }), ctx(id)), 500);
    expect(unexpected.message).not.toContain("internal detail");
    expect(String(spy.mock.calls[0])).not.toContain("internal detail");
    spy.mockRestore();
  });
});
