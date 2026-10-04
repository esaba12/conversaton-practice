import { afterEach, describe, expect, it, vi } from "vitest";
import { requestReflection } from "@/lib/reflection/api-client";
import { reflectRequestSchema, type ReflectRequest } from "@/lib/schemas/reflection";
import { SessionClientError } from "@/lib/session/api-client";

afterEach(() => { vi.unstubAllGlobals(); });
const sessionId = "5b8f1f1e-6d2a-4c1b-9a51-0d4b9b6f2a11";
const requestId = "0c7a2f8e-3b9d-4e1f-8a6c-2d5e7f9b1c3a";
const privateNote = "PRIVATE-NOTE-I-am-scared-they-will-be-angry";
const turns = [{ speaker: "counterpart", text: "Hey, what's up?" }, { speaker: "user", text: "Can we split the dishes?" }] as const;
const reflection = { evidence: "complete", observedAction: "You asked for a specific split.", quotedLine: "Can we split the dishes?", takeaway: "Being direct helped.", nextStep: "Suggest a day for each of you.", supportExit: false };
function stubFetch(response: Response) { const fetchMock = vi.fn().mockResolvedValue(response); vi.stubGlobal("fetch", fetchMock); return fetchMock; }

describe("reflection API client", () => {
  it("posts turns, goal and self-reflection as same-origin JSON and parses the reflection", async () => {
    const fetchMock = stubFetch(Response.json({ reflection }));
    await expect(requestReflection(sessionId, { turns: [...turns], goal: " Ask for a chore split. ", selfReflection: "I stayed calm." })).resolves.toEqual(reflection);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/sessions/${sessionId}/reflect`);
    expect(init).toMatchObject({ method: "POST", credentials: "same-origin", cache: "no-store", keepalive: false, headers: { "Content-Type": "application/json" } });
    const body = JSON.parse(init.body);
    expect(body).toEqual({ turns, goal: "Ask for a chore split.", selfReflection: "I stayed calm." });
    expect(reflectRequestSchema.safeParse(body).success).toBe(true);
  });
  it("omits empty optional fields and strips anything beyond turns, goal and self-reflection", async () => {
    const fetchMock = stubFetch(Response.json({ reflection: { ...reflection, evidence: "insufficient", observedAction: null, quotedLine: null, takeaway: null, nextStep: null } }));
    const leaky = { turns: [{ speaker: "user", text: "Hi", privateNotes: privateNote }], goal: "  ", selfReflection: "", privateNotes: privateNote, role: { name: "Sam" }, aboutMe: ["fact"] } as unknown as ReflectRequest;
    await expect(requestReflection(sessionId, leaky)).resolves.toMatchObject({ evidence: "insufficient", observedAction: null });
    const raw = fetchMock.mock.calls[0][1].body as string;
    expect(raw).not.toContain(privateNote);
    expect(JSON.parse(raw)).toEqual({ turns: [{ speaker: "user", text: "Hi" }] });
  });
  it("allows an empty transcript", async () => {
    const fetchMock = stubFetch(Response.json({ reflection: { evidence: "insufficient", observedAction: null, quotedLine: null, takeaway: null, nextStep: null, supportExit: false } }));
    await requestReflection(sessionId, { turns: [] });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ turns: [] });
  });
  it("maps the error envelope to typed errors", async () => {
    stubFetch(Response.json({ code: "REFLECTION_UNAVAILABLE", message: "Try again.", retryable: true, request_id: requestId }, { status: 503 }));
    const error = await requestReflection(sessionId, { turns: [...turns] }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SessionClientError);
    expect(error).toMatchObject({ code: "REFLECTION_UNAVAILABLE", status: 503, retryable: true });
    stubFetch(Response.json({ code: "USAGE_LIMIT", message: "Limit reached.", retryable: false, request_id: requestId }, { status: 429 }));
    await expect(requestReflection(sessionId, { turns: [...turns] })).rejects.toMatchObject({ code: "USAGE_LIMIT", status: 429, retryable: false });
    stubFetch(Response.json({ code: "SESSION_ACTIVE", message: "Still active.", retryable: false, request_id: requestId }, { status: 409 }));
    await expect(requestReflection(sessionId, { turns: [...turns] })).rejects.toMatchObject({ code: "SESSION_ACTIVE", status: 409 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(requestReflection(sessionId, { turns: [...turns] })).rejects.toMatchObject({ code: "NETWORK", retryable: true });
  });
  it("rejects malformed or score-bearing responses", async () => {
    stubFetch(Response.json({ reflection: { ...reflection, score: 7 } }));
    await expect(requestReflection(sessionId, { turns: [...turns] })).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    stubFetch(Response.json({ reflection: { ...reflection, evidence: "great" } }));
    await expect(requestReflection(sessionId, { turns: [...turns] })).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    stubFetch(new Response("<html>", { status: 502 }));
    await expect(requestReflection(sessionId, { turns: [...turns] })).rejects.toMatchObject({ code: "MALFORMED_RESPONSE", status: 502 });
  });
});
