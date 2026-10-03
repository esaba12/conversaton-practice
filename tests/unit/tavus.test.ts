import { afterEach, describe, expect, it, vi } from "vitest";
import { conversationBody, createConversation, endConversation } from "@/lib/media/tavus";
import { roommate } from "@/fixtures/roommate";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function configured() { vi.stubEnv("TAVUS_API_KEY", "unit-secret"); vi.stubEnv("TAVUS_PAL_ID", "unit-pal"); vi.stubEnv("TAVUS_FACE_ID", "unit-face"); }
describe("Tavus server boundary", () => {
  it("requires private stateless video and recording off", () => {
    configured(); const body = conversationBody(roommate, 180);
    expect(body).toMatchObject({ require_auth: true, audio_only: false, participant_tags: [], properties: { enable_recording: false, auto_start_recording: false, max_call_duration: 180 } });
    expect(JSON.stringify(body)).not.toContain("unit-secret");
  });
  it("never retries ambiguous creation and sanitizes provider failures", async () => {
    configured(); const fetchMock = vi.fn().mockRejectedValue(new Error("sensitive provider response")); vi.stubGlobal("fetch", fetchMock);
    await expect(createConversation(roommate, 180)).rejects.toThrow("The call provider could not be reached.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("rejects missing private-room tokens", async () => {
    configured(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ conversation_id: "test", conversation_url: "https://tavus.daily.co/test" })));
    await expect(createConversation(roommate, 180)).rejects.toThrow("incomplete call configuration");
  });
  it("does not parse empty End response as JSON and separately verifies termination", async () => {
    configured(); const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 200 })).mockResolvedValueOnce(Response.json({ status: "ended" })); vi.stubGlobal("fetch", fetchMock);
    expect(await endConversation("trusted-id")).toBe(true);
    expect(fetchMock.mock.calls[1][0]).not.toContain("verbose");
  });
});
