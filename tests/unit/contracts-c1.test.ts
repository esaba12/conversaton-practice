import { describe, expect, it } from "vitest";
import { manager } from "@/fixtures/manager";
import { roommate } from "@/fixtures/roommate";
import { draftModelOutputSchema, draftRequestSchema, draftResponseSchema, stanceOptionsSchema } from "@/lib/schemas/draft";
import { goalCheckRequestSchema } from "@/lib/schemas/goal-check";
import { createPersonSituationRequestSchema, personFieldsSchema, personSchema, practiceHistoryResponseSchema } from "@/lib/schemas/people";
import { buildRoleContext, DELIVERY_LINE, FREEZE_LINE, roleContextSchema, STANCE_LINE } from "@/lib/schemas/role-context";
import { standInStartSchema, startRequestSchema } from "@/lib/schemas/session";
import { voicePreviewRequestSchema } from "@/lib/schemas/voice-preview";

const key = "00000000-0000-4000-8000-000000000001";
const personId = "00000000-0000-4000-8000-000000000002";
const situation = { publicContext: "Planning week.", opening: "Hey, got a minute?", constraints: [], challenge: "neutral", pace: "patient" } as const;
const privateFields = { goal: "Ask for one thing.", hardMomentLine: "I get that, and I still need it.", privateNotes: "PRIVATE", fear: "They say no", likelihoodBefore: 70 };

describe("C1 role context", () => {
  it("adds the freeze and delivery lines always, and the stance line only with a stance field", () => {
    const plain = buildRoleContext(roommate);
    expect(plain).toContain(FREEZE_LINE);
    expect(plain).toContain(DELIVERY_LINE);
    expect(plain).not.toContain(STANCE_LINE);
    const withStance = buildRoleContext(manager);
    expect(withStance).toContain(STANCE_LINE);
    expect(withStance).toContain("Keep the launch on track");
    expect(DELIVERY_LINE).toContain("never name or diagnose the user's emotions");
  });
  it("Jordan validates and his context carries no goal or hard-moment line", () => {
    expect(roleContextSchema.parse(manager)).toEqual(manager);
    const context = buildRoleContext(manager);
    expect(context).not.toMatch(/next sprint|still need to drop one thing/);
  });
  it("rejects stance chips over 40 characters and private fields in a role", () => {
    expect(roleContextSchema.safeParse({ ...manager, wants: "x".repeat(41) }).success).toBe(false);
    expect(roleContextSchema.safeParse({ ...manager, goal: "x" }).success).toBe(false);
  });
});

describe("C1 draft", () => {
  it("accepts an optional personId and keeps stance out of the model output until 1C", () => {
    expect(draftRequestSchema.safeParse({ situation: "x", personId }).success).toBe(true);
    expect(draftRequestSchema.safeParse({ situation: "x", personId: "nope" }).success).toBe(false);
    expect(Object.keys(draftModelOutputSchema.shape.role.shape)).not.toContain("wants");
  });
  it("stance options need three or four chips per field", () => {
    const three = ["a", "b", "c"];
    expect(stanceOptionsSchema.safeParse({ wants: three, holdsBackBecause: three, softensWhen: three }).success).toBe(true);
    expect(stanceOptionsSchema.safeParse({ wants: ["a", "b"], holdsBackBecause: three, softensWhen: three }).success).toBe(false);
    expect(draftResponseSchema.safeParse({ role: manager, goal: "g", assumptions: [], stanceOptions: { wants: three, holdsBackBecause: three, softensWhen: three } }).success).toBe(true);
  });
});

describe("C1 start branches", () => {
  it("accepts the new branches", () => {
    expect(startRequestSchema.safeParse({ idempotencyKey: key, preset: "manager", durationSeconds: 180, openingOverride: "Hey." }).success).toBe(true);
    expect(startRequestSchema.safeParse({ idempotencyKey: key, personId, expectedVersion: 2, situation, durationSeconds: 300 }).success).toBe(true);
    expect(startRequestSchema.safeParse({ idempotencyKey: key, personId, expectedVersion: 2, durationSeconds: 300, openingOverride: "Hey." }).success).toBe(true);
  });
  it("only the stand-in branch may carry the goal and hard-moment line", () => {
    const normal = [
      { idempotencyKey: key, preset: "manager", durationSeconds: 180 },
      { idempotencyKey: key, role: roommate, durationSeconds: 180 },
      { idempotencyKey: key, personId, expectedVersion: 1, durationSeconds: 180 },
      { idempotencyKey: key, personId, expectedVersion: 1, situation, durationSeconds: 180 },
    ];
    for (const body of normal) {
      expect(startRequestSchema.safeParse(body).success).toBe(true);
      for (const [field, value] of Object.entries(privateFields)) expect(startRequestSchema.safeParse({ ...body, [field]: value }).success).toBe(false);
    }
    const standIn = { idempotencyKey: key, standIn: true, goal: privateFields.goal, hardMomentLine: privateFields.hardMomentLine, durationSeconds: 180 };
    for (const target of [{ preset: "manager" }, { role: roommate }, { personId, expectedVersion: 1 }, { personId, expectedVersion: 1, situation }]) {
      expect(standInStartSchema.safeParse({ ...standIn, ...target }).success).toBe(true);
      expect(startRequestSchema.safeParse({ ...standIn, ...target }).success).toBe(true);
    }
    for (const extra of [{ privateNotes: "PRIVATE" }, { fear: "x" }, { likelihoodBefore: 50 }, { durationSeconds: 300 }]) {
      expect(startRequestSchema.safeParse({ ...standIn, preset: "manager", ...extra }).success).toBe(false);
    }
    expect(startRequestSchema.safeParse({ ...standIn, preset: "manager", goal: undefined }).success).toBe(false);
  });
  it("a situation cannot carry identity or private fields", () => {
    expect(startRequestSchema.safeParse({ idempotencyKey: key, personId, expectedVersion: 1, situation: { ...situation, name: "Jordan" }, durationSeconds: 180 }).success).toBe(false);
    expect(startRequestSchema.safeParse({ idempotencyKey: key, personId, expectedVersion: 1, situation: { ...situation, goal: "x" }, durationSeconds: 180 }).success).toBe(false);
  });
});

describe("C1 people, history, goal check and voice preview", () => {
  const fields = { name: "Jordan", relationship: "Manager", style: "Busy.", publicContext: "Launch week.", opening: "Hi.", constraints: [], challenge: "neutral", pace: "patient", traits: {} } as const;
  it("background is optional on writes, bounded, and stance chips are not person fields", () => {
    expect(personFieldsSchema.safeParse(fields).success).toBe(true);
    expect(personFieldsSchema.safeParse({ ...fields, background: "Runs the launch." }).success).toBe(true);
    expect(personFieldsSchema.safeParse({ ...fields, background: "x".repeat(601) }).success).toBe(false);
    expect(personFieldsSchema.safeParse({ ...fields, wants: "x" }).success).toBe(false);
    expect(personSchema.shape.hasPracticed.safeParse(true).success).toBe(true);
  });
  it("situation requests and history are strict", () => {
    expect(createPersonSituationRequestSchema.safeParse({ label: "Launch week", situation }).success).toBe(true);
    expect(createPersonSituationRequestSchema.safeParse({ label: "x".repeat(61), situation }).success).toBe(false);
    expect(practiceHistoryResponseSchema.safeParse({ practicedPresets: ["manager"] }).success).toBe(true);
    expect(practiceHistoryResponseSchema.safeParse({ practicedPresets: ["boss"] }).success).toBe(false);
  });
  it("goal check takes the goal and up to six user turns only", () => {
    expect(goalCheckRequestSchema.safeParse({ goal: "g", turns: ["one"] }).success).toBe(true);
    expect(goalCheckRequestSchema.safeParse({ goal: "g", turns: [] }).success).toBe(false);
    expect(goalCheckRequestSchema.safeParse({ goal: "g", turns: Array(7).fill("t") }).success).toBe(false);
    expect(goalCheckRequestSchema.safeParse({ goal: "g", turns: ["t"], counterpartTurns: ["c"] }).success).toBe(false);
  });
  it("voice preview takes text and an optional known preset, never a voice id", () => {
    expect(voicePreviewRequestSchema.safeParse({ text: "Hey.", presetId: "manager" }).success).toBe(true);
    expect(voicePreviewRequestSchema.safeParse({ text: "Hey.", presetId: "boss" }).success).toBe(false);
    expect(voicePreviewRequestSchema.safeParse({ text: "Hey.", voiceId: "abc" }).success).toBe(false);
    expect(voicePreviewRequestSchema.safeParse({ text: "x".repeat(301) }).success).toBe(false);
  });
});
