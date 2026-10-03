import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DRAFT_RATE_LIMIT } from "@/lib/schemas/draft";
import { AppError, errorSchema } from "@/lib/schemas/errors";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import { POST } from "@/app/api/scenarios/draft/route";
import { reserveDraft, resetDraftLimitsForTests } from "@/lib/setup/rate-limit";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const role = { name: "Jordan", role: "Your manager", style: "Brief and direct.", publicContext: "You manage the user's team.", opening: "Hey, you wanted to talk?", constraints: [], challenge: "neutral", pace: "conversational" };
const ok = () => Response.json({ status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify({ outOfScope: false, role, goal: "Ask for Friday off", assumptions: [] }) }] }] });
const post = (value: unknown = { situation: "I need to ask my manager for Friday off." }) => new Request("http://127.0.0.1:3000/api/scenarios/draft", { method: "POST", body: JSON.stringify(value) });
const signIn = (id: string) => identity.requireIdentity.mockResolvedValue({ client: {}, identity: { id, isAnonymous: false } });
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetDraftLimitsForTests();
  vi.useFakeTimers();
  vi.stubEnv("OPENAI_API_KEY", "unit-key"); vi.stubEnv("OPENAI_SETUP_MODEL", "unit-model");
  fetchMock = vi.fn(async () => ok());
  vi.stubGlobal("fetch", fetchMock);
  signIn(alice);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

async function fill(id = alice) {
  signIn(id);
  for (let i = 0; i < DRAFT_RATE_LIMIT.max; i++) expect((await POST(post())).status).toBe(200);
}

describe("draft rate limit", () => {
  it("returns 429 USAGE_LIMIT past the limit without calling the model", async () => {
    await fill();
    expect(fetchMock).toHaveBeenCalledTimes(DRAFT_RATE_LIMIT.max);
    const response = await POST(post());
    expect(response.status).toBe(429);
    expect(errorSchema.parse(await response.json())).toMatchObject({ code: "USAGE_LIMIT", retryable: false });
    expect(fetchMock).toHaveBeenCalledTimes(DRAFT_RATE_LIMIT.max);
  });

  it("limits each user separately", async () => {
    await fill(alice);
    signIn(bob);
    expect((await POST(post())).status).toBe(200);
    signIn(alice);
    expect((await POST(post())).status).toBe(429);
  });

  it("frees capacity as requests leave the window", async () => {
    await fill();
    vi.advanceTimersByTime(DRAFT_RATE_LIMIT.windowMs - 1);
    expect((await POST(post())).status).toBe(429);
    vi.advanceTimersByTime(1);
    await fill();
    expect((await POST(post())).status).toBe(429);
  });

  it("slides: only requests older than the window are released", () => {
    reserveDraft(alice, 0);
    for (let i = 1; i < DRAFT_RATE_LIMIT.max; i++) reserveDraft(alice, 1_000);
    expect(() => reserveDraft(alice, DRAFT_RATE_LIMIT.windowMs - 1)).toThrow(AppError);
    reserveDraft(alice, DRAFT_RATE_LIMIT.windowMs);
    expect(() => reserveDraft(alice, DRAFT_RATE_LIMIT.windowMs)).toThrow(expect.objectContaining({ code: "USAGE_LIMIT", status: 429 }));
  });

  it("does not count unauthenticated or invalid requests", async () => {
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    for (let i = 0; i < DRAFT_RATE_LIMIT.max + 2; i++) expect((await POST(post())).status).toBe(401);
    signIn(alice);
    for (let i = 0; i < DRAFT_RATE_LIMIT.max + 2; i++) expect((await POST(post({ situation: "" }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    await fill();
  });

  it("counts out-of-scope and provider failures", async () => {
    const outOfScope = () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ outOfScope: true, role, goal: "x", assumptions: [] }) }] }] });
    fetchMock.mockImplementation(async () => outOfScope());
    for (let i = 0; i < DRAFT_RATE_LIMIT.max / 2; i++) expect((await POST(post())).status).toBe(422);
    fetchMock.mockImplementation(async () => new Response("down", { status: 500 }));
    for (let i = 0; i < DRAFT_RATE_LIMIT.max / 2; i++) expect((await POST(post())).status).toBe(503);
    const calls = fetchMock.mock.calls.length;
    expect((await POST(post())).status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(calls);
  });

  it("keeps a bounded number of users", () => {
    for (let i = 0; i < DRAFT_RATE_LIMIT.max; i++) reserveDraft(alice, 0);
    for (let i = 0; i < 1_000; i++) reserveDraft(`user-${i}`, 0);
    expect(() => reserveDraft(alice, 0)).not.toThrow();
  });
});
