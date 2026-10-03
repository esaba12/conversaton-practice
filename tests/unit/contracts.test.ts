import { describe, expect, it } from "vitest";
import { roommate } from "@/fixtures/roommate";
import { buildRoleContext, roleContextSchema, traitPhrases } from "@/lib/schemas/role-context";
import { aboutMeWriteSchema, personFieldsSchema, personToRole, roleToPersonFields, sharedFactsRequestSchema, updatePersonRequestSchema } from "@/lib/schemas/people";
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
describe("G3 people contracts", () => {
  const fields = roleToPersonFields(roommate, { tone: "warm", formality: "formal" });
  it("round-trips a role through person fields and rejects unknown chips or private fields", () => {
    expect(personToRole(fields)).toEqual(roommate);
    expect(personFieldsSchema.safeParse({ ...fields, traits: { tone: "furious" } }).success).toBe(false);
    expect(personFieldsSchema.safeParse({ ...fields, traits: { confidence: 90 } }).success).toBe(false);
    expect(personFieldsSchema.safeParse({ ...fields, privateNotes: "secret" }).success).toBe(false);
    expect(updatePersonRequestSchema.safeParse({ ...fields, expectedVersion: 0 }).success).toBe(false);
    expect(aboutMeWriteSchema.safeParse({ text: "x".repeat(121) }).success).toBe(false);
  });
  it("rejects duplicate or oversized shared-fact sets", () => {
    const id = crypto.randomUUID();
    expect(sharedFactsRequestSchema.safeParse({ factIds: [id], expectedVersion: 1 }).success).toBe(true);
    expect(sharedFactsRequestSchema.safeParse({ factIds: [id, id], expectedVersion: 1 }).success).toBe(false);
    expect(sharedFactsRequestSchema.safeParse({ factIds: Array.from({ length: 31 }, () => crypto.randomUUID()), expectedVersion: 1 }).success).toBe(false);
  });
  it("saved-person start carries only an ID and version", () => {
    const request = { idempotencyKey: crypto.randomUUID(), personId: crypto.randomUUID(), expectedVersion: 2, durationSeconds: 180 };
    expect(startRequestSchema.safeParse(request).success).toBe(true);
    for (const addition of [{ knownAboutUser: ["fact"] }, { role: roommate }, { privatePrep: "secret" }, { expectedVersion: 0 }]) expect(startRequestSchema.safeParse({ ...request, ...addition }).success).toBe(false);
  });
  it("buildRoleContext adds only given traits and shared facts; unchanged without extras", () => {
    const plain = buildRoleContext(roommate);
    expect(buildRoleContext(roommate, {})).toBe(plain);
    const context = buildRoleContext(roommate, { traits: { formality: "casual" }, knownAboutUser: ["I joined in June."] });
    expect(context).toContain("I joined in June.");
    expect(context).toContain("casual, everyday language");
    expect(plain).not.toContain("whatTheUserHasToldYou");
    expect(() => buildRoleContext(roommate, { knownAboutUser: ["x".repeat(121)] })).toThrow();
    expect(() => buildRoleContext(roommate, { privatePrep: "secret" } as never)).toThrow();
    expect(traitPhrases({ tone: "blunt", talkativeness: "brief" })).toEqual(["blunt and direct", "keeps replies short"]);
  });
});
