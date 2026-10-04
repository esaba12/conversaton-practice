import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { roommate } from "@/fixtures/roommate";
import { buildTextRoleContext } from "@/lib/schemas/role-context";
import { startRequestSchema } from "@/lib/schemas/session";
import { isEndCommand, isLinkCode, isSupportExit } from "@/lib/text/commands";
import { normalizePhone } from "@/lib/text/phone";
import { resolveTextRole } from "@/lib/text/start";
import { verifyPhotonWebhook } from "@/lib/text/verify";

const now = 1_700_000_000;

describe("text practice", () => {
  it("accepts a fresh Spectrum signature and rejects a stale or altered one", () => {
    const body = "{\"event\":\"messages\"}";
    const secret = "test-signing-secret";
    const signature = "v0=" + createHmac("sha256", secret).update(`v0:${now}:${body}`).digest("hex");
    expect(verifyPhotonWebhook(body, secret, signature, String(now), now)).toBe(true);
    expect(verifyPhotonWebhook(body + " ", secret, signature, String(now), now)).toBe(false);
    expect(verifyPhotonWebhook(body, secret, signature, String(now - 301), now)).toBe(false);
    expect(verifyPhotonWebhook(body, secret, signature.replace("v0=", "v1="), String(now), now)).toBe(false);
  });

  it("normalizes US numbers and leaves international numbers alone", () => {
    expect(normalizePhone("(415) 555-0134")).toBe("+14155550134");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("555")).toBeNull();
  });

  it("treats only a whole END or STOP as the end command", () => {
    expect(isEndCommand(" end ")).toBe(true);
    expect(isEndCommand("Stop")).toBe(true);
    expect(isEndCommand("end the call")).toBe(false);
    expect(isLinkCode("0123456789")).toBe(true);
    expect(isLinkCode("I am ending")).toBe(false);
  });

  it("steps out on a small set of support phrases", () => {
    expect(isSupportExit("I want to die")).toBe(true);
    expect(isSupportExit("this is a hard conversation")).toBe(false);
  });

  it("keeps background and drops the call-only lines", () => {
    const text = buildTextRoleContext(roommate, { background: "Alex shares the apartment.", knownAboutUser: ["I have a cat named Miso."] });
    expect(text).toContain("Alex shares the apartment.");
    expect(text).toContain("I have a cat named Miso.");
    expect(text).not.toContain("Let your face");
    expect(text).not.toContain("If the user goes quiet");
    expect(text).toContain("You cannot see or hear the user.");
  });

  it("rejects a stand-in start before any lease", async () => {
    const body = startRequestSchema.parse({
      idempotencyKey: "33333333-3333-4333-8333-333333333333",
      standIn: true,
      preset: "roommate",
      goal: "Ask for the dishes.",
      durationSeconds: 180,
    });
    await expect(resolveTextRole({} as never, body)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
