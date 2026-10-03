import { afterEach, describe, expect, it, vi } from "vitest";
import { roommate } from "@/fixtures/roommate";
import type { RoleContext } from "@/lib/schemas/role-context";
import { startRequestSchema } from "@/lib/schemas/session";
import { SessionClientError, endSession, generateDraft, markConnected, startSavedPersonSession, startSession } from "@/lib/session/api-client";

afterEach(() => { vi.unstubAllGlobals(); });
const sessionId = "5b8f1f1e-6d2a-4c1b-9a51-0d4b9b6f2a11";
const requestId = "0c7a2f8e-3b9d-4e1f-8a6c-2d5e7f9b1c3a";
const key = "9d1c2b3a-4e5f-4a6b-8c7d-0e1f2a3b4c5d";
const session = { id: sessionId, status: "connecting", expiresAt: "2026-10-03T19:10:00.000Z", cleanup: "not_started" };
const credential = { provider: "tavus", roomUrl: "https://tavus.daily.co/room", meetingToken: "unit-token", expiresAt: "2026-10-03T19:10:00.000Z" };
const privateNote = "PRIVATE-NOTE-I-am-scared-they-will-be-angry";
const draft = { role: roommate, goal: "Make a clear request about sharing kitchen chores.", assumptions: ["You live together."] };
function stubFetch(response: Response) { const fetchMock = vi.fn().mockResolvedValue(response); vi.stubGlobal("fetch", fetchMock); return fetchMock; }

describe("session API client", () => {
  it("parses a successful start and sends exactly the key, reviewed role, and duration", async () => {
    const fetchMock = stubFetch(Response.json({ session, credential }, { status: 201 }));
    await expect(startSession({ role: roommate, durationSeconds: 180, idempotencyKey: key })).resolves.toEqual({ session, credential });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/sessions");
    expect(init).toMatchObject({ method: "POST", credentials: "same-origin", keepalive: false });
    const body = JSON.parse(init.body);
    expect(Object.keys(body).sort()).toEqual(["durationSeconds", "idempotencyKey", "role"]);
    expect(body).toEqual({ idempotencyKey: key, role: roommate, durationSeconds: 180 });
    expect(startRequestSchema.safeParse(body).success).toBe(true);
  });
  it("never forwards goal, private notes, or other extra fields in the start body", async () => {
    const fetchMock = stubFetch(Response.json({ session, credential }, { status: 201 }));
    const leaky = { ...roommate, goal: "secret goal", privateNotes: privateNote } as RoleContext;
    await startSession({ role: leaky, durationSeconds: 300, idempotencyKey: key });
    const raw = fetchMock.mock.calls[0][1].body as string;
    expect(raw).not.toContain(privateNote);
    expect(raw).not.toContain("secret goal");
    const body = JSON.parse(raw);
    expect(Object.keys(body.role).sort()).toEqual(["challenge", "constraints", "name", "opening", "pace", "publicContext", "role", "style"]);
    expect(startRequestSchema.safeParse(body).success).toBe(true);
  });
  it("uses a fresh idempotency key for each start when none is supplied", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ session, credential }, { status: 201 })));
    vi.stubGlobal("fetch", fetchMock);
    await startSession({ role: roommate, durationSeconds: 180 });
    await startSession({ role: roommate, durationSeconds: 180 });
    const [first, second] = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).idempotencyKey);
    expect(first).not.toBe(second);
  });
  it("throws a typed error carrying the active session id on 409", async () => {
    stubFetch(Response.json({ code: "SESSION_ACTIVE", message: "A practice is already active.", retryable: false, request_id: requestId, session_id: sessionId }, { status: 409 }));
    const error = await startSession({ role: roommate, durationSeconds: 180, idempotencyKey: key }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SessionClientError);
    expect(error).toMatchObject({ code: "SESSION_ACTIVE", status: 409, retryable: false, sessionId });
  });
  it("rejects malformed success and error responses", async () => {
    stubFetch(Response.json({ session: { ...session, status: "paused" } }));
    await expect(markConnected(sessionId)).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    stubFetch(Response.json({ session, credential: { ...credential, apiKey: "leak" } }, { status: 201 }));
    await expect(startSession({ role: roommate, durationSeconds: 180, idempotencyKey: key })).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    stubFetch(new Response("<html>", { status: 502 }));
    await expect(endSession(sessionId, "user")).rejects.toMatchObject({ code: "MALFORMED_RESPONSE", status: 502, retryable: true });
  });
  it("reports network failure as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(endSession(sessionId, "user")).rejects.toMatchObject({ code: "NETWORK", retryable: true });
  });
  it("starts a saved person with only the key, person ID, version, and duration", async () => {
    const fetchMock = stubFetch(Response.json({ session, credential }, { status: 201 }));
    await expect(startSavedPersonSession({ personId: requestId, expectedVersion: 4, durationSeconds: 180, idempotencyKey: key })).resolves.toEqual({ session, credential });
    const [url, init] = fetchMock.mock.calls[0];
    expect([url, init.method]).toEqual(["/api/sessions", "POST"]);
    const body = JSON.parse(init.body);
    expect(body).toEqual({ idempotencyKey: key, personId: requestId, expectedVersion: 4, durationSeconds: 180 });
    expect(startRequestSchema.safeParse(body).success).toBe(true);
  });
  it("surfaces saved-person 404 and stale-version 409 as typed errors", async () => {
    stubFetch(Response.json({ code: "NOT_FOUND", message: "Not found.", retryable: false, request_id: requestId }, { status: 404 }));
    await expect(startSavedPersonSession({ personId: requestId, expectedVersion: 1, durationSeconds: 180 })).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    stubFetch(Response.json({ code: "VERSION_CONFLICT", message: "Changed.", retryable: false, request_id: requestId }, { status: 409 }));
    await expect(startSavedPersonSession({ personId: requestId, expectedVersion: 1, durationSeconds: 180 })).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });
  });
  it("passes keepalive and the reason when ending", async () => {
    const fetchMock = stubFetch(Response.json({ session: { ...session, status: "ended", cleanup: "pending" } }));
    await expect(endSession(sessionId, "navigation", { keepalive: true })).resolves.toMatchObject({ status: "ended", cleanup: "pending" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/sessions/${sessionId}/end`);
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body)).toEqual({ reason: "navigation" });
  });
  it("rejects a keepalive end with a typed NETWORK error when the server is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    const error = await endSession(sessionId, "navigation", { keepalive: true }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SessionClientError);
    expect(error).toMatchObject({ code: "NETWORK", retryable: true });
    expect(fetchMock.mock.calls[0][1].keepalive).toBe(true);
  });
});

describe("draft API client", () => {
  it("posts the situation, goal, and private notes only to the draft route and parses the draft", async () => {
    const fetchMock = stubFetch(Response.json(draft));
    await expect(generateDraft({ situation: "My roommate leaves dishes.", goal: "Ask for a chore split.", privateNotes: privateNote })).resolves.toEqual(draft);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/scenarios/draft");
    expect(init).toMatchObject({ method: "POST", credentials: "same-origin", cache: "no-store" });
    expect(JSON.parse(init.body)).toEqual({ situation: "My roommate leaves dishes.", goal: "Ask for a chore split.", privateNotes: privateNote });
  });
  it("omits optional fields that were not provided", async () => {
    const fetchMock = stubFetch(Response.json(draft));
    await generateDraft({ situation: "My roommate leaves dishes." });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ situation: "My roommate leaves dishes." });
  });
  it("rejects a draft whose role carries extra fields", async () => {
    stubFetch(Response.json({ ...draft, role: { ...roommate, privateNotes: privateNote } }));
    await expect(generateDraft({ situation: "x" })).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });
  it("surfaces OUT_OF_SCOPE and provider errors with their codes", async () => {
    stubFetch(Response.json({ code: "OUT_OF_SCOPE", message: "This tool is for everyday conversations.", retryable: false, request_id: requestId }, { status: 422 }));
    await expect(generateDraft({ situation: "x" })).rejects.toMatchObject({ code: "OUT_OF_SCOPE", status: 422, retryable: false, message: "This tool is for everyday conversations." });
    stubFetch(Response.json({ code: "PROVIDER_UNAVAILABLE", message: "Try again.", retryable: true, request_id: requestId }, { status: 503 }));
    await expect(generateDraft({ situation: "x" })).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE", status: 503, retryable: true });
  });
});
