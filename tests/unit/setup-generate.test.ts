import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import { draftResponseSchema } from "@/lib/schemas/draft";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import { POST } from "@/app/api/scenarios/draft/route";
import { DRAFT_FORMAT_NAME, draftJsonSchema, generateDraft, leaksPrivateNotes } from "@/lib/setup/generate";
import { SETUP_SYSTEM_PROMPT } from "@/lib/setup/prompt";
import { resetDraftLimitsForTests } from "@/lib/setup/rate-limit";

const role = { name: "Jordan", role: "Your manager", style: "Brief and direct.", publicContext: "You manage the user's team and have a busy week.", opening: "Hey, you wanted to talk?", constraints: ["Has ten minutes before a meeting"], challenge: "neutral", pace: "conversational" };
const output = (patch: Record<string, unknown> = {}) => ({ outOfScope: false, role, goal: "Ask for Friday off and offer coverage", assumptions: ["The meeting is in person"], ...patch });
const raw = (content: unknown[], status = "completed") => Response.json({ status, output: [{ type: "reasoning", summary: [] }, { type: "message", role: "assistant", content }] });
const ok = (value: unknown) => raw([{ type: "output_text", text: typeof value === "string" ? value : JSON.stringify(value) }]);
const body = { situation: "I need to ask my manager for Friday off.", privateNotes: "I always freeze when my voice starts shaking badly" };
const post = (value: unknown) => new Request("http://127.0.0.1:3000/api/scenarios/draft", { method: "POST", body: JSON.stringify(value) });
function provider(...responses: Array<() => Promise<Response> | Response>) {
  const fetchMock = vi.fn(async () => { const next = responses.shift(); if (!next) throw new Error("unexpected provider call"); return next(); });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  return errorSchema.parse(await response.json());
}

beforeEach(() => {
  resetDraftLimitsForTests();
  vi.stubEnv("OPENAI_API_KEY", "unit-key"); vi.stubEnv("OPENAI_SETUP_MODEL", "unit-model");
  identity.requireIdentity.mockResolvedValue({ client: {}, identity: { id: "11111111-1111-4111-8111-111111111111", isAnonymous: false } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("strict draft schema", () => {
  it("requires every property, forbids extras, and drops unsupported keywords", () => {
    const schema = draftJsonSchema();
    const text = JSON.stringify(schema);
    expect(text).not.toMatch(/"(minLength|maxLength|\$schema)"/);
    expect(schema).toMatchObject({ type: "object", additionalProperties: false, required: ["outOfScope", "role", "goal", "assumptions"] });
    const props = schema.properties as Record<string, Record<string, unknown>>;
    const roleSchema = props.role as { required: string[]; additionalProperties: boolean; properties: Record<string, Record<string, unknown>> };
    expect(roleSchema.additionalProperties).toBe(false);
    expect(roleSchema.required).toEqual(Object.keys(role));
    expect(roleSchema.properties.challenge.enum).toEqual(["supportive", "neutral", "mild_pushback"]);
    expect(roleSchema.properties.constraints).toMatchObject({ type: "array", maxItems: 5 });
    expect(props.assumptions).toMatchObject({ type: "array", maxItems: 5 });
    expect(schema.anyOf).toBeUndefined();
  });
});

describe("POST /api/scenarios/draft", () => {
  it("returns an editable draft and strips outOfScope", async () => {
    const fetchMock = provider(() => ok(output()));
    const response = await POST(post(body));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).not.toHaveProperty("outOfScope");
    expect(draftResponseSchema.parse(json)).toEqual({ role, goal: "Ask for Friday off and offer coverage", assumptions: ["The meeting is in person"] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends a strict, unstored Responses request with notes only in the delimited user message", async () => {
    const fetchMock = provider(() => ok(output()));
    await POST(post(body));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer unit-key");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const sent = JSON.parse(String(init.body));
    expect(sent).toMatchObject({ model: "unit-model", store: false, text: { format: { type: "json_schema", name: DRAFT_FORMAT_NAME, strict: true } } });
    expect(sent.input.map((m: { role: string }) => m.role)).toEqual(["system", "user"]);
    expect(sent.input[0].content).toBe(SETUP_SYSTEM_PROMPT);
    expect(sent.input[0].content).not.toContain("voice starts shaking");
    expect(sent.input[1].content).toMatch(/<untrusted_input>[\s\S]*voice starts shaking[\s\S]*<\/untrusted_input>/);
  });

  it("keeps a supplied goal unchanged", async () => {
    provider(() => ok(output({ goal: "Something the model rewrote" })));
    const json = await (await POST(post({ ...body, goal: "Ask clearly for Friday off" }))).json();
    expect(json.goal).toBe("Ask clearly for Friday off");
  });

  it("rejects unauthenticated callers before reading the body or calling the model", async () => {
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    const fetchMock = provider(() => ok(output()));
    const request = post(body);
    expect((await errorOf(await POST(request), 401)).code).toBe("UNAUTHENTICATED");
    expect(request.bodyUsed).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates the body", async () => {
    const fetchMock = provider();
    await errorOf(await POST(post({ situation: "" })), 400);
    await errorOf(await POST(post({ ...body, preset: "roommate" })), 400);
    await errorOf(await POST(post({ situation: "x".repeat(5000) })), 400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns NOT_CONFIGURED without a key or model", async () => {
    const fetchMock = provider();
    vi.stubEnv("OPENAI_API_KEY", "");
    expect((await errorOf(await POST(post(body)), 503)).code).toBe("NOT_CONFIGURED");
    vi.stubEnv("OPENAI_API_KEY", "unit-key"); vi.stubEnv("OPENAI_SETUP_MODEL", "");
    expect((await errorOf(await POST(post(body)), 503)).code).toBe("NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries a refusal once, then returns retryable PROVIDER_UNAVAILABLE", async () => {
    const refusal = () => raw([{ type: "refusal", refusal: "I can't help with that." }]);
    const fetchMock = provider(refusal, refusal);
    expect(await errorOf(await POST(post(body)), 503)).toMatchObject({ code: "PROVIDER_UNAVAILABLE", retryable: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recovers from invalid JSON on the single retry", async () => {
    const fetchMock = provider(() => ok("{not json"), () => ok(output()));
    expect((await POST(post(body))).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats incomplete, non-2xx, network and schema-invalid responses as retryable failures", async () => {
    let fetchMock = provider(() => raw([{ type: "output_text", text: JSON.stringify(output()) }], "incomplete"), () => new Response("upstream detail", { status: 500 }));
    const failure = await errorOf(await POST(post(body)), 503);
    expect(failure.message).not.toContain("upstream detail");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock = provider(() => Promise.reject(new DOMException("timed out", "TimeoutError")), () => ok(output({ role: { ...role, challenge: "hostile" } })));
    expect((await errorOf(await POST(post(body)), 503)).retryable).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps outOfScope to 422 OUT_OF_SCOPE without retrying", async () => {
    const fetchMock = provider(() => ok(output({ outOfScope: true })));
    expect(await errorOf(await POST(post({ situation: "Reenact my abuser yelling at me." })), 422)).toMatchObject({ code: "OUT_OF_SCOPE", retryable: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never returns a role that echoes private notes", async () => {
    const leaked = output({ role: { ...role, publicContext: "You know they ALWAYS freeze, when my voice starts shaking." } });
    const fetchMock = provider(() => ok(leaked), () => ok(leaked));
    const response = await POST(post(body));
    const text = await response.clone().text();
    await errorOf(response, 503);
    expect(text.toLowerCase()).not.toContain("voice starts shaking");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns the clean retry after a leaked first attempt", async () => {
    const leaked = output({ role: { ...role, constraints: ["Knows the user will freeze when my voice starts shaking badly"] } });
    provider(() => ok(leaked), () => ok(output()));
    const json = await (await POST(post(body))).json();
    expect(JSON.stringify(json)).not.toContain("shaking");
  });

  it("never returns a distinctive private-note marker when the model behaves, with or without a goal", async () => {
    const marker = "ZEBRA-QUARTZ-7731";
    const notes = { ...body, privateNotes: `Reminder ${marker}: breathe before answering` };
    const fetchMock = provider(() => ok(output()), () => ok(output()));
    for (const request of [notes, { ...notes, goal: "Ask clearly for Friday off" }]) {
      const response = await POST(post(request));
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).not.toContain(marker);
      expect(JSON.parse(text).goal).not.toContain("breathe");
    }
    for (const [, init] of fetchMock.mock.calls as unknown as Array<[string, RequestInit]>) {
      const sent = JSON.parse(String(init.body));
      expect(sent.input[0].content).not.toContain(marker);
      expect(sent.input[1].content).toContain(marker);
    }
  });
});

describe("private-note leak check", () => {
  const situation = "I need to ask my manager for Friday off.";

  it("still flags a five-word copy and a whole three-word note", () => {
    const notes = "I always freeze when my voice starts shaking";
    expect(leaksPrivateNotes({ ...role, style: "When... my VOICE starts shaking." } as never, notes, situation)).toBe(true);
    expect(leaksPrivateNotes({ ...role, constraints: ["fear of rejection"] } as never, "Fear of rejection", situation)).toBe(true);
    expect(leaksPrivateNotes({ ...role, constraints: ["fear of rejections"] } as never, "Fear of rejection", situation)).toBe(false);
  });

  it("flags a three-word excerpt from a thirty-word note", () => {
    const notes = "The hallway light flickered while I practiced asking for a quieter desk near the window because the copy machine keeps humming through every sentence I try to finish before lunch";
    expect(notes.split(/\s+/)).toHaveLength(30);
    expect(leaksPrivateNotes({ ...role, publicContext: "The copy machine keeps running downstairs." } as never, notes, situation)).toBe(true);
  });

  it("flags a copy split across the end of style and the start of publicContext", () => {
    const notes = "Please do not mention the cedar closet key during this practice at all";
    const quiet = "I want to ask for a quieter morning.";
    expect(leaksPrivateNotes({ ...role, style: "Sounds tired and keeps saying cedar closet" } as never, notes, quiet)).toBe(false);
    expect(leaksPrivateNotes({ ...role, style: "Sounds tired and keeps saying cedar closet", publicContext: "key stays off the table today." } as never, notes, quiet)).toBe(true);
  });

  it("flags a name or a number that appears only in the notes", () => {
    expect(leaksPrivateNotes({ ...role, name: "Priya" } as never, "I still owe Priya for the borrowed scanner", "I need to return a scanner to a classmate.")).toBe(true);
    expect(leaksPrivateNotes({ ...role, name: "Priya" } as never, "I still owe Priya for the borrowed scanner", "Priya is my classmate.")).toBe(false);
    expect(leaksPrivateNotes({ ...role, constraints: ["Replacement budget is $400"] } as never, "The spare key costs $400 to replace if it is lost", "I need to ask about a spare key.")).toBe(true);
    expect(leaksPrivateNotes({ ...role, constraints: ["Replacement budget is $400"] } as never, "The spare key costs $400 to replace if it is lost", "The spare key costs $400.")).toBe(false);
  });

  it("does not flag words shared with the situation", () => {
    const dishes = "My roommate never does the dishes";
    expect(leaksPrivateNotes({ ...role, publicContext: "You never do the dishes." } as never, "Honestly the dishes thing makes me feel invisible", dishes)).toBe(false);
    expect(leaksPrivateNotes({ ...role, publicContext: "You are the roommate who never does the dishes." } as never, "It bothers me that my roommate never does the dishes and I stay quiet", dishes)).toBe(false);
  });

  it("does not flag a stopword-only window", () => {
    expect(leaksPrivateNotes({ ...role, style: "I don't want to drag this out." } as never, "I don't want to", situation)).toBe(false);
  });

  it("never flags when there are no notes", () => {
    expect(leaksPrivateNotes(role as never, undefined, situation)).toBe(false);
    expect(leaksPrivateNotes(role as never, "", situation)).toBe(false);
  });
});

describe("generateDraft private-note retry", () => {
  it("returns PROVIDER_UNAVAILABLE when both attempts leak", async () => {
    const leaked = output({ role: { ...role, opening: "So your voice starts shaking again?" } });
    const fetchMock = provider(() => ok(leaked), () => ok(leaked));
    await expect(generateDraft(body)).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE", retryable: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns the clean role when the first attempt leaks and the retry does not", async () => {
    const leaked = output({ role: { ...role, style: "When my voice starts shaking." } });
    const fetchMock = provider(() => ok(leaked), () => ok(output()));
    await expect(generateDraft(body)).resolves.toMatchObject({ role });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not probe a private name that appears only in the goal or assumptions", async () => {
    provider(() => ok(output({ goal: "Ask Priya about the scanner", assumptions: ["Priya already knows the time"] })));
    const result = await generateDraft({ situation: "I need to return a scanner.", privateNotes: "I still owe Priya for the borrowed scanner" });
    expect(result.goal).toBe("Ask Priya about the scanner");
    expect(result.assumptions).toEqual(["Priya already knows the time"]);
  });
});
