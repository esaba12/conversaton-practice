import { describe, expect, it } from "vitest";
import { roommate } from "@/fixtures/roommate";
import { buildRoleContext, roleContextSchema } from "@/lib/schemas/role-context";
import { canTransition, startRequestSchema } from "@/lib/schemas/session";
import { mediaCredentialSchema } from "@/lib/schemas/media";
import { draftRequestSchema, draftResponseSchema } from "@/lib/schemas/draft";

describe("context boundary", () => {
  it("rejects private notes, user profiles and previous simulated history", () => {
    for (const field of ["privateNotes", "profile", "history", "userFears"]) expect(roleContextSchema.safeParse({ ...roommate, [field]: "private" }).success).toBe(false);
    expect(buildRoleContext(roommate)).toContain("fictional counterpart");
  });
  it("limits unbounded role content before a provider call", () => {
    expect(roleContextSchema.safeParse({ ...roommate, publicContext: "x".repeat(1501) }).success).toBe(false);
  });
});
describe("draft contract", () => {
  it("bounds inputs and rejects unknown fields", () => {
    expect(draftRequestSchema.safeParse({ situation: "Ask a coworker to swap shifts." }).success).toBe(true);
    expect(draftRequestSchema.safeParse({ situation: "" }).success).toBe(false);
    expect(draftRequestSchema.safeParse({ situation: "x".repeat(1001) }).success).toBe(false);
    expect(draftRequestSchema.safeParse({ situation: "ok", privateNotes: "x".repeat(1001) }).success).toBe(false);
    expect(draftRequestSchema.safeParse({ situation: "ok", history: "previous session" }).success).toBe(false);
  });
  it("returns a strict role without private fields", () => {
    const draft = { role: roommate, goal: "Make one clear request.", assumptions: ["Talking at home."] };
    expect(draftResponseSchema.safeParse(draft).success).toBe(true);
    expect(draftResponseSchema.safeParse({ ...draft, privateNotes: "secret" }).success).toBe(false);
    expect(draftResponseSchema.safeParse({ ...draft, role: { ...roommate, privateNotes: "secret" } }).success).toBe(false);
    expect(draftResponseSchema.safeParse({ ...draft, assumptions: Array(6).fill("a") }).success).toBe(false);
  });
});
describe("session contract", () => {
  it("rejects client owner/provider overrides and unsupported duration", () => {
    const request = { idempotencyKey: crypto.randomUUID(), preset: "roommate", durationSeconds: 180 };
    expect(startRequestSchema.safeParse(request).success).toBe(true);
    for (const addition of [{ ownerId: crypto.randomUUID() }, { providerId: "arbitrary" }, { durationSeconds: 999 }]) expect(startRequestSchema.safeParse({ ...request, ...addition }).success).toBe(false);
  });
  it("accepts a reviewed role but rejects private fields, mixed preset/role and extra fields", () => {
    const request = { idempotencyKey: crypto.randomUUID(), role: roommate, durationSeconds: 180 };
    expect(startRequestSchema.safeParse(request).success).toBe(true);
    expect(startRequestSchema.safeParse({ ...request, role: { ...roommate, privateNotes: "secret" } }).success).toBe(false);
    expect(startRequestSchema.safeParse({ ...request, preset: "roommate" }).success).toBe(false);
    expect(startRequestSchema.safeParse({ ...request, goal: "private goal" }).success).toBe(false);
  });
  it("cannot reactivate ended, interrupted or deleted sessions", () => {
    for (const state of ["ended", "interrupted", "deleted"] as const) {
      expect(canTransition(state, "active")).toBe(false);
      expect(canTransition(state, "connecting")).toBe(false);
    }
    expect(canTransition("interrupted", "deleted")).toBe(true);
  });
  it("accepts only HTTPS Daily rooms without tokens in URLs", () => {
    const credential = { provider: "tavus", roomUrl: "https://example.daily.co/room", meetingToken: "test-token", expiresAt: new Date().toISOString() };
    expect(mediaCredentialSchema.safeParse(credential).success).toBe(true);
    for (const url of ["https://daily.co.evil.test/room", "http://example.daily.co/room", "https://example.daily.co/room?t=secret"]) expect(mediaCredentialSchema.safeParse({ ...credential, roomUrl: url }).success).toBe(false);
  });
});
