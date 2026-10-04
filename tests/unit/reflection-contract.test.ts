import { describe, expect, it } from "vitest";
import { appendTurn, MAX_TRANSCRIPT_CHARS, MAX_TRANSCRIPT_TURNS, reflectionSchema, reflectRequestSchema, type TranscriptTurn } from "@/lib/schemas/reflection";
import { deletePracticeDataRequestSchema, sessionSummarySchema } from "@/lib/schemas/practice-data";

describe("reflection contract", () => {
  it("accepts a bounded transcript with optional goal and self-reflection, and rejects private or unknown fields", () => {
    const turns = [{ speaker: "counterpart", text: "Hi." }, { speaker: "user", text: "Can we talk about the dishes?" }];
    expect(reflectRequestSchema.safeParse({ turns }).success).toBe(true);
    expect(reflectRequestSchema.safeParse({ turns, goal: "Ask once.", selfReflection: "I rushed." }).success).toBe(true);
    for (const field of ["privateNotes", "role", "aboutMe", "sessionId"]) expect(reflectRequestSchema.safeParse({ turns, [field]: "x" }).success).toBe(false);
    expect(reflectRequestSchema.safeParse({ turns: [{ speaker: "pal", text: "Hi." }] }).success).toBe(false);
    expect(reflectRequestSchema.safeParse({ turns: [{ speaker: "user", text: "x".repeat(2001) }] }).success).toBe(false);
    expect(reflectRequestSchema.safeParse({ turns: Array.from({ length: 101 }, () => ({ speaker: "user", text: "a" })) }).success).toBe(false);
    expect(reflectRequestSchema.safeParse({ turns: Array.from({ length: 21 }, () => ({ speaker: "user", text: "x".repeat(2000) })) }).success).toBe(false);
  });

  it("keeps only the most recent turns within the turn and character limits", () => {
    let turns: TranscriptTurn[] = [];
    turns = appendTurn(turns, "user", "   ");
    expect(turns).toEqual([]);
    for (let i = 0; i < MAX_TRANSCRIPT_TURNS + 5; i++) turns = appendTurn(turns, i % 2 ? "user" : "counterpart", `turn ${i}`);
    expect(turns).toHaveLength(MAX_TRANSCRIPT_TURNS);
    expect(turns.at(-1)?.text).toBe(`turn ${MAX_TRANSCRIPT_TURNS + 4}`);
    let long: TranscriptTurn[] = [];
    for (let i = 0; i < 25; i++) long = appendTurn(long, "user", "y".repeat(3000));
    expect(long.reduce((sum, turn) => sum + turn.text.length, 0)).toBeLessThanOrEqual(MAX_TRANSCRIPT_CHARS);
    expect(long.every((turn) => turn.text.length === 2000)).toBe(true);
    expect(reflectRequestSchema.safeParse({ turns: long }).success).toBe(true);
  });

  it("has no score field and bounds each line", () => {
    const ok = { evidence: "partial", observedAction: "You asked one direct question.", takeaway: null, nextStep: null, supportExit: false };
    expect(reflectionSchema.safeParse(ok).success).toBe(true);
    expect(reflectionSchema.safeParse({ ...ok, score: 7 }).success).toBe(false);
    expect(reflectionSchema.safeParse({ ...ok, takeaway: "x".repeat(301) }).success).toBe(false);
  });
});

describe("practice data contract", () => {
  it("requires the exact confirmation phrase", () => {
    expect(deletePracticeDataRequestSchema.safeParse({ confirm: "delete my practice data" }).success).toBe(true);
    expect(deletePracticeDataRequestSchema.safeParse({ confirm: "yes" }).success).toBe(false);
    expect(deletePracticeDataRequestSchema.safeParse({}).success).toBe(false);
  });
  it("summarizes a session with metadata only", () => {
    const row = { id: "3f6f2a8e-1b7c-4d7e-9a51-0d7f3e9c2b11", status: "ended", cleanup: "confirmed", createdAt: "2026-10-03T21:00:00.000Z", endedAt: null };
    expect(sessionSummarySchema.safeParse(row).success).toBe(true);
    expect(sessionSummarySchema.safeParse({ ...row, personName: "Sam" }).success).toBe(true);
    expect(sessionSummarySchema.safeParse({ ...row, personName: null }).success).toBe(true);
    expect(sessionSummarySchema.safeParse({ ...row, personName: "" }).success).toBe(false);
    expect(sessionSummarySchema.safeParse({ ...row, providerConversationId: "c123" }).success).toBe(false);
    expect(sessionSummarySchema.safeParse({ ...row, personId: row.id }).success).toBe(false);
    expect(sessionSummarySchema.safeParse({ ...row, transcript: "hello" }).success).toBe(false);
    expect(sessionSummarySchema.safeParse({ ...row, role: "manager" }).success).toBe(false);
  });
});
