import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionClientError, endSession, markConnected, startSession } from "@/lib/session/api-client";

afterEach(() => { vi.unstubAllGlobals(); });
const sessionId = "5b8f1f1e-6d2a-4c1b-9a51-0d4b9b6f2a11";
const requestId = "0c7a2f8e-3b9d-4e1f-8a6c-2d5e7f9b1c3a";
const key = "9d1c2b3a-4e5f-4a6b-8c7d-0e1f2a3b4c5d";
const session = { id: sessionId, status: "connecting", expiresAt: "2026-10-03T19:10:00.000Z", cleanup: "not_started" };
const credential = { provider: "tavus", roomUrl: "https://tavus.daily.co/room", meetingToken: "unit-token", expiresAt: "2026-10-03T19:10:00.000Z" };
function stubFetch(response: Response) { const fetchMock = vi.fn().mockResolvedValue(response); vi.stubGlobal("fetch", fetchMock); return fetchMock; }

describe("session API client", () => {
  it("parses a successful start and sends the fixed request body", async () => {
    const fetchMock = stubFetch(Response.json({ session, credential }, { status: 201 }));
    await expect(startSession(180, key)).resolves.toEqual({ session, credential });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/sessions");
    expect(init).toMatchObject({ method: "POST", credentials: "same-origin", keepalive: false });
    expect(JSON.parse(init.body)).toEqual({ idempotencyKey: key, preset: "roommate", durationSeconds: 180 });
  });
  it("throws a typed error carrying the active session id on 409", async () => {
    stubFetch(Response.json({ code: "SESSION_ACTIVE", message: "A practice is already active.", retryable: false, request_id: requestId, session_id: sessionId }, { status: 409 }));
    const error = await startSession(180, key).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SessionClientError);
    expect(error).toMatchObject({ code: "SESSION_ACTIVE", status: 409, retryable: false, sessionId });
  });
  it("rejects malformed success and error responses", async () => {
    stubFetch(Response.json({ session: { ...session, status: "paused" } }));
    await expect(markConnected(sessionId)).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    stubFetch(Response.json({ session, credential: { ...credential, apiKey: "leak" } }, { status: 201 }));
    await expect(startSession(180, key)).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    stubFetch(new Response("<html>", { status: 502 }));
    await expect(endSession(sessionId, "user")).rejects.toMatchObject({ code: "MALFORMED_RESPONSE", status: 502, retryable: true });
  });
  it("reports network failure as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(endSession(sessionId, "user")).rejects.toMatchObject({ code: "NETWORK", retryable: true });
  });
  it("passes keepalive and the reason when ending", async () => {
    const fetchMock = stubFetch(Response.json({ session: { ...session, status: "ended", cleanup: "pending" } }));
    await expect(endSession(sessionId, "navigation", { keepalive: true })).resolves.toMatchObject({ status: "ended", cleanup: "pending" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/sessions/${sessionId}/end`);
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body)).toEqual({ reason: "navigation" });
  });
});
