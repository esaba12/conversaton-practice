import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorSchema } from "@/lib/schemas/errors";
import { manager } from "@/fixtures/manager";
import { buildRoleContext } from "@/lib/schemas/role-context";
import { buildStandInContext, standInGreeting } from "@/lib/session/stand-in-context";
import { startResponseSchema } from "@/lib/schemas/session";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import { POST as start } from "@/app/api/sessions/route";
import { startFingerprint } from "@/lib/session/server";

// W10 acceptance 2, 3 and 8, server side. No live provider call: fetch is stubbed.
const SECRET = "s".repeat(40);
const id = "11111111-1111-4111-8111-111111111111", owner = "22222222-2222-4222-8222-222222222222";
const key = "33333333-3333-4333-8333-333333333333";
const personId = "55555555-5555-4555-8555-555555555555";
const GOAL = "GOAL-MARKER move the Atlas report to next sprint";
const HARD = "HARD-MARKER I still need to drop one thing";

type Rpc = (args: Record<string, unknown>) => { data?: unknown; error?: { code: string; message: string } };
let handlers: Record<string, Rpc>, rpc: ReturnType<typeof vi.fn>;
const row = (patch: Record<string, unknown> = {}) => ({ id, owner_id: owner, status: "connecting", cleanup: "not_started", provider_conversation_id: null, expires_at: new Date(Date.now() + 180_000).toISOString().replace("Z", "+00:00"), ...patch });
const post = (body: unknown) => new Request("http://127.0.0.1:3000/api/sessions", { method: "POST", body: JSON.stringify(body) });
const calls = (name: string) => rpc.mock.calls.filter(([called]) => called === name).map(([, args]) => args);
const standInBody = (patch: Record<string, unknown> = {}) => ({ idempotencyKey: key, standIn: true, goal: GOAL, durationSeconds: 180, preset: "manager", ...patch });

const storedPerson = {
  id: personId, version: 2, name: "Sam", relationship: "Your fictional coworker", traits: { tone: "blunt" },
  style: "Direct; prefers specifics.", background: "BACKGROUND-MARKER Sam is a senior designer.",
  public_context: "SITUATION-MARKER you share a desk on the design team.", opening: "Hey, got a minute?",
  constraints: ["Stay at work."], challenge: "neutral", pace: "patient",
  known_about_user: ["SHARED-FACT-MARKER I run on weekends"],
};

function tavus() {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    if (init.method === "POST" && url.endsWith("/conversations")) return Response.json({ conversation_id: "provider-1", conversation_url: "https://tavus.daily.co/provider-1", meeting_token: "unit-token" });
    if (init.method === "POST") return new Response(null, { status: 200 });
    if (init.method === "GET") return Response.json({ status: "ended" });
    return new Response(null, { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const sent = (fetchMock: ReturnType<typeof tavus>, index = 0) => JSON.parse(String(fetchMock.mock.calls[index][1].body));

beforeEach(() => {
  vi.stubEnv("SESSION_SERVER_SECRET", SECRET);
  vi.stubEnv("TAVUS_API_KEY", "unit-secret"); vi.stubEnv("TAVUS_PAL_ID", "default-pal"); vi.stubEnv("TAVUS_FACE_ID", "default-face");
  vi.stubEnv("TAVUS_STANDIN_PAL_ID", "standin-pal"); vi.stubEnv("TAVUS_STANDIN_FACE_ID", "standin-face");
  handlers = {};
  rpc = vi.fn(async (name: string, args: Record<string, unknown>) => { const result = handlers[name]?.(args) ?? { error: { code: "XX000", message: "unhandled" } }; return { data: result.data ?? null, error: result.error ?? null }; });
  const from = vi.fn(() => ({ select: () => ({ in: () => ({ limit: async () => ({ data: [], error: null }) }) }) }));
  identity.requireIdentity.mockResolvedValue({ client: { rpc, from }, identity: { id: owner, isAnonymous: false } });
  handlers.practice_acquire = () => ({ data: { created: true, session: row() } });
  handlers.practice_bind = (args) => ({ data: row({ provider_conversation_id: args.p_provider_id }) });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("stand-in start branch (W10)", () => {
  it("sends the stand-in context, its reserved face and PAL, and records kind stand_in", async () => {
    const fetchMock = tavus();
    const response = await start(post(standInBody({ hardMomentLine: HARD })));
    expect(response.status).toBe(201);
    startResponseSchema.parse(await response.json());
    const body = sent(fetchMock);
    expect(body).toMatchObject({ pal_id: "standin-pal", face_id: "standin-face", custom_greeting: standInGreeting(manager.name) });
    expect(body.conversational_context).toBe(buildStandInContext({
      counterpart: { name: manager.name, role: manager.role, situation: manager.publicContext },
      goal: GOAL, hardMomentLine: HARD,
    }));
    expect(body.conversational_context).toContain(GOAL);
    expect(body.properties.max_call_duration).toBe(180);
    expect(Object.keys(body).sort()).toEqual(["audio_only", "conversational_context", "custom_greeting", "face_id", "max_participants", "pal_id", "participant_tags", "properties", "require_auth"]);
    expect(calls("practice_acquire")[0]).toMatchObject({ p_kind: "stand_in", p_preset: "manager", p_duration: 180, p_person_id: null });
  });

  it("never sends the counterpart's own instructions in place of the stand-in's", async () => {
    const fetchMock = tavus();
    await start(post(standInBody()));
    const context = sent(fetchMock).conversational_context;
    expect(context).not.toBe(buildRoleContext(manager));
    expect(context).not.toContain("You are a fictional counterpart");
    expect(sent(fetchMock).custom_greeting).not.toBe(manager.opening);
  });

  it("drops a saved person's traits, background and shared facts on the stand-in path", async () => {
    handlers.person_context = (args) => args.p_expected_version === 2 ? { data: storedPerson } : { error: { code: "P0001", message: "VERSION_CONFLICT" } };
    handlers.private_prep_get = () => ({ data: { notes: "PRIVATE-PREP-MARKER" } });
    const fetchMock = tavus();
    const response = await start(post({ idempotencyKey: key, standIn: true, goal: GOAL, durationSeconds: 180, personId, expectedVersion: 2 }));
    expect(response.status).toBe(201);
    const body = sent(fetchMock);
    const text = JSON.stringify(body);
    for (const leak of ["SHARED-FACT-MARKER", "BACKGROUND-MARKER", "PRIVATE-PREP-MARKER", "blunt and direct"]) expect(text).not.toContain(leak);
    expect(body.conversational_context).toContain("SITUATION-MARKER");
    expect(body.conversational_context).toContain("Sam");
    expect(body).toMatchObject({ pal_id: "standin-pal", face_id: "standin-face" });
    expect(calls("practice_acquire")[0]).toMatchObject({ p_kind: "stand_in", p_preset: null, p_person_id: personId, p_person_version: 2 });
  });

  it("checks the person's version before the lease and the provider, as a normal start does", async () => {
    handlers.person_context = () => ({ error: { code: "P0001", message: "VERSION_CONFLICT" } });
    const fetchMock = tavus();
    const response = await start(post({ idempotencyKey: key, standIn: true, goal: GOAL, durationSeconds: 180, personId, expectedVersion: 1 }));
    expect(errorSchema.parse(await response.json()).code).toBe("VERSION_CONFLICT");
    expect(calls("practice_acquire")).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fingerprints a stand-in apart from the normal start with the same role and key", async () => {
    tavus();
    await start(post(standInBody()));
    expect(calls("practice_acquire")[0].p_fingerprint).toBe(startFingerprint(manager, 180, SECRET, undefined, "stand_in"));
    expect(calls("practice_acquire")[0].p_fingerprint).not.toBe(startFingerprint(manager, 180, SECRET));
  });

  it("fails closed with 503 and no lease when the reserved face or PAL is missing", async () => {
    vi.stubEnv("TAVUS_STANDIN_FACE_ID", "");
    const fetchMock = tavus();
    const response = await start(post(standInBody()));
    expect(response.status).toBe(503);
    expect(errorSchema.parse(await response.json()).code).toBe("NOT_CONFIGURED");
    expect(rpc).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a stand-in body that carries anything else, a wrong duration, or a missing goal", async () => {
    const fetchMock = tavus();
    const bad = [
      standInBody({ goal: undefined }),
      standInBody({ durationSeconds: 300 }),
      standInBody({ fear: "FEAR-MARKER" }),
      standInBody({ privateNotes: "PRIVATE-NOTE-MARKER" }),
      standInBody({ knownAboutUser: ["SHARED-FACT-MARKER"] }),
      standInBody({ standIn: false }),
      standInBody({ goal: "g".repeat(201) }),
      { ...standInBody(), personId, expectedVersion: 2 },
    ];
    for (const body of bad) expect((await start(post(body))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the normal start unchanged: no goal reaches the counterpart", async () => {
    const fetchMock = tavus();
    expect((await start(post({ idempotencyKey: key, preset: "manager", durationSeconds: 180 }))).status).toBe(201);
    const body = sent(fetchMock);
    expect(body.conversational_context).toBe(buildRoleContext(manager));
    expect(body.conversational_context).not.toContain(GOAL);
    expect(body).toMatchObject({ custom_greeting: manager.opening });
    expect(body.pal_id).not.toBe("standin-pal");
    expect(body.face_id).not.toBe("standin-face");
    expect(calls("practice_acquire")[0]).toMatchObject({ p_kind: "practice" });
  });
});
