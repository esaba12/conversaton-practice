import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import { alternativeRequestSchema, alternativeResponseSchema, MAX_REFLECTIONS_PER_SESSION } from "@/lib/schemas/reflection";
import { ALTERNATIVE_PROMPT_VERSION, ALTERNATIVE_SYSTEM_PROMPT } from "@/lib/reflection/prompt";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import { POST } from "@/app/api/sessions/[id]/alternative/route";
import { ALTERNATIVE_FORMAT_NAME, alternativeJsonSchema } from "@/lib/reflection/generate";

// A1 "Another way to say it": one phrasing of the user's own line, only when they press the button.
const owner = "11111111-1111-4111-8111-111111111111";
const GOAL = "Ask to move the Atlas report to next sprint.";
const body = { goal: GOAL };
const option = "I need to move the Atlas report to next sprint.";
const raw = (content: unknown[], status = "completed") => Response.json({ status, output: [{ type: "message", role: "assistant", content }] });
const ok = (value: unknown) => raw([{ type: "output_text", text: typeof value === "string" ? value : JSON.stringify(value) }]);
function provider(...responses: Array<() => Promise<Response> | Response>) {
  const fetchMock = vi.fn(async () => { const next = responses.shift(); if (!next) throw new Error("unexpected provider call"); return next(); });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  return errorSchema.parse(await response.json());
}

let id: string, row: { data: unknown; error: unknown };
const from = vi.fn(() => {
  const builder = { select: () => builder, eq: () => builder, maybeSingle: async () => row };
  return builder;
});
const post = (value: unknown, sessionId = id) => new Request(`http://127.0.0.1:3000/api/sessions/${sessionId}/alternative`, { method: "POST", body: typeof value === "string" ? value : JSON.stringify(value) });
const ask = (value: unknown = body, sessionId = id) => POST(post(value, sessionId), { params: Promise.resolve({ id: sessionId }) });

beforeEach(() => {
  id = randomUUID(); row = { data: { id, status: "ended" }, error: null }; from.mockClear();
  vi.stubEnv("OPENAI_API_KEY", "unit-key"); vi.stubEnv("OPENAI_REFLECTION_MODEL", "reflect-model");
  identity.requireIdentity.mockReset();
  identity.requireIdentity.mockResolvedValue({ client: { from }, identity: { id: owner, isAnonymous: false } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("the alternative contract", () => {
  it("takes the goal line alone and returns one option or null", () => {
    expect(alternativeRequestSchema.safeParse(body).success).toBe(true);
    expect(alternativeRequestSchema.safeParse({ ...body, feedbackStyle: "direct" }).success).toBe(true);
    for (const field of ["turns", "selfReflection", "privateNotes", "role", "hardMomentLine", "prediction"]) {
      expect(alternativeRequestSchema.safeParse({ ...body, [field]: "x" }).success).toBe(false);
    }
    expect(alternativeRequestSchema.safeParse({ goal: "" }).success).toBe(false);
    expect(alternativeRequestSchema.safeParse({ goal: "g".repeat(201) }).success).toBe(false);
    expect(alternativeResponseSchema.safeParse({ alternative: null }).success).toBe(true);
    expect(alternativeResponseSchema.safeParse({ alternative: "a".repeat(201) }).success).toBe(false);
    expect(alternativeResponseSchema.safeParse({ alternative: option, score: 3 }).success).toBe(false);
    expect(ALTERNATIVE_PROMPT_VERSION).toBe("alternative-2026-10-04.1");
    expect(ALTERNATIVE_SYSTEM_PROMPT).toMatch(/Keep their meaning and keep the request/);
    expect(ALTERNATIVE_SYSTEM_PROMPT).toMatch(/Do not comment on the user/);
  });
});

describe("POST /api/sessions/[id]/alternative", () => {
  it("returns exactly one phrasing and sends only the goal, unstored", async () => {
    const fetchMock = provider(() => ok({ alternative: option }));
    const response = await ask();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(alternativeResponseSchema.parse(await response.json())).toEqual({ alternative: option });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    const sent = JSON.parse(String(init.body));
    expect(sent).toMatchObject({ model: "reflect-model", store: false, text: { format: { type: "json_schema", name: ALTERNATIVE_FORMAT_NAME, strict: true, schema: alternativeJsonSchema() } } });
    expect(sent.input[0].content).toBe(ALTERNATIVE_SYSTEM_PROMPT);
    expect(sent.input[1].content).toContain(GOAL);
    // The transcript, the hard-moment line and the session id never travel with it.
    expect(String(init.body)).not.toContain(id);
    expect(String(init.body)).not.toMatch(/Atlas report to next sprint\?/);
  });

  it("accepts a null option and keeps the user's request intact in the prompt", async () => {
    provider(() => ok({ alternative: null }));
    expect(alternativeResponseSchema.parse(await (await ask()).json())).toEqual({ alternative: null });
    for (const forbidden of [/thank/i, /apolog/i, /deadline/i]) expect(ALTERNATIVE_SYSTEM_PROMPT).toMatch(forbidden);
  });

  it("rejects an unauthenticated caller, a bad id, a bad body and a live or missing session before the model", async () => {
    const fetchMock = provider();
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    expect((await errorOf(await ask(), 401)).code).toBe("UNAUTHENTICATED");
    identity.requireIdentity.mockResolvedValue({ client: { from }, identity: { id: owner, isAnonymous: false } });
    expect((await errorOf(await ask(body, "nope"), 400)).code).toBe("VALIDATION_ERROR");
    expect((await errorOf(await ask({ goal: "" }), 400)).code).toBe("VALIDATION_ERROR");
    expect((await errorOf(await ask("not json"), 400)).code).toBe("VALIDATION_ERROR");
    row = { data: null, error: null };
    expect((await errorOf(await ask(), 404)).code).toBe("NOT_FOUND");
    row = { data: { id, status: "active" }, error: null };
    expect((await errorOf(await ask(), 409)).code).toBe("SESSION_ACTIVE");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries once, then fails without provider detail, and shares the per-session cap", async () => {
    const failing = provider(() => new Response("upstream detail", { status: 500 }), () => ok("{not json"));
    const failure = await errorOf(await ask(), 503);
    expect(failure).toMatchObject({ code: "REFLECTION_UNAVAILABLE", retryable: true });
    expect(failure.message).not.toContain("upstream detail");
    expect(failing).toHaveBeenCalledTimes(2);
    for (let i = 0; i < MAX_REFLECTIONS_PER_SESSION; i++) {
      provider(() => ok({ alternative: option }));
      expect((await ask()).status).toBe(200);
    }
    const capped = provider();
    expect(await errorOf(await ask(), 429)).toMatchObject({ code: "USAGE_LIMIT", retryable: false });
    expect(capped).not.toHaveBeenCalled();
  });
});
