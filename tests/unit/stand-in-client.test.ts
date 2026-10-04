import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { roommate } from "@/fixtures/roommate";
import { fetchPracticedPresets, standInStartBody, startStandInSession, STAND_IN_DURATION_SECONDS } from "@/lib/practice/stand-in-client";
import { startRequestSchema, standInStartSchema } from "@/lib/schemas/session";
import { startPresetSession, startSavedPersonSession, startSession } from "@/lib/session/api-client";

// W10 acceptance 2: only this client module may send the goal and hard-moment line.
const key = "33333333-3333-4333-8333-333333333333";
const personId = "55555555-5555-4555-8555-555555555555";
const GOAL = "GOAL-MARKER move the Atlas report to next sprint";
const HARD = "HARD-MARKER I still need to drop one thing";
const session = { id: personId, status: "connecting", expiresAt: "2026-10-04T05:10:00.000Z", cleanup: "not_started" };
const credential = { provider: "tavus", roomUrl: "https://tavus.daily.co/room", meetingToken: "unit-token", expiresAt: "2026-10-04T05:10:00.000Z" };
const situation = {
  publicContext: "A launch task needs to move to next sprint.", opening: "Which task do you want to move?",
  constraints: ["Keep it about this launch."], challenge: "mild_pushback" as const, pace: "conversational" as const,
};

function stubFetch(response: Response) { const fetchMock = vi.fn().mockResolvedValue(response); vi.stubGlobal("fetch", fetchMock); return fetchMock; }
afterEach(() => { vi.unstubAllGlobals(); });

describe("stand-in start body", () => {
  it("carries only the allowed fields, at 180 seconds", () => {
    const body = standInStartBody({ target: { kind: "preset", preset: "manager" }, goal: GOAL, hardMomentLine: HARD, idempotencyKey: key });
    expect(body).toEqual({ idempotencyKey: key, standIn: true, goal: GOAL, hardMomentLine: HARD, durationSeconds: 180, preset: "manager" });
    expect(STAND_IN_DURATION_SECONDS).toBe(180);
    expect(standInStartSchema.safeParse(body).success).toBe(true);
    expect(startRequestSchema.safeParse(body).success).toBe(true);
  });

  it("omits an empty hard-moment line and trims the line", () => {
    const body = standInStartBody({ target: { kind: "role", role: roommate }, goal: `  ${GOAL}  `, hardMomentLine: "   ", idempotencyKey: key });
    expect(body).not.toHaveProperty("hardMomentLine");
    expect(body).toMatchObject({ goal: GOAL, role: roommate });
  });

  it("sends a saved person by id, version and optional situation only", () => {
    const body = standInStartBody({ target: { kind: "person", person: { id: personId, version: 3 }, situation }, goal: GOAL, idempotencyKey: key });
    expect(body).toEqual({ idempotencyKey: key, standIn: true, goal: GOAL, durationSeconds: 180, personId, expectedVersion: 3, situation });
    expect(JSON.stringify(body)).not.toContain("knownAboutUser");
  });

  it("refuses a body the frozen union does not allow", () => {
    expect(() => standInStartBody({ target: { kind: "preset", preset: "boss" as never }, goal: GOAL })).toThrow();
    expect(() => standInStartBody({ target: { kind: "preset", preset: "manager" }, goal: "   " })).toThrow();
    expect(() => standInStartBody({ target: { kind: "preset", preset: "manager" }, goal: "g".repeat(201) })).toThrow();
  });

  it("posts the body to the session route and uses a fresh key each time", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ session, credential }, { status: 201 })));
    vi.stubGlobal("fetch", fetchMock);
    await expect(startStandInSession({ target: { kind: "preset", preset: "manager" }, goal: GOAL })).resolves.toEqual({ session, credential });
    await startStandInSession({ target: { kind: "preset", preset: "manager" }, goal: GOAL });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/sessions");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "same-origin" });
    const [first, second] = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).idempotencyKey);
    expect(first).not.toBe(second);
  });

  it("reads the owner's practiced starters from the history route", async () => {
    const fetchMock = stubFetch(Response.json({ practicedPresets: ["manager", "roommate"] }));
    await expect(fetchPracticedPresets()).resolves.toEqual(["manager", "roommate"]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/practice-history");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
    stubFetch(Response.json({ practicedPresets: ["boss"] }));
    await expect(fetchPracticedPresets()).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });
});

describe("every other start body still carries no goal or hard-moment line", () => {
  it("omits them from normal, preset, saved-person and retry starts", async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn().mockImplementation((_url: string, init: { body: string }) => {
      calls.push(init.body);
      return Promise.resolve(Response.json({ session, credential }, { status: 201 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    // A role carrying a goal-shaped field: the client copies the allowlisted fields only.
    await startSession({ role: { ...roommate, goal: GOAL, hardMomentLine: HARD } as never, durationSeconds: 180, idempotencyKey: key });
    await startPresetSession({ preset: "manager", durationSeconds: 180, idempotencyKey: key });
    await startSavedPersonSession({ personId, expectedVersion: 2, durationSeconds: 180, idempotencyKey: key });
    expect(calls).toHaveLength(3);
    for (const raw of calls) {
      expect(raw).not.toContain(GOAL);
      expect(raw).not.toContain(HARD);
      expect(raw).not.toContain("goal");
      expect(raw).not.toContain("hardMomentLine");
      const body = JSON.parse(raw);
      expect(body.standIn).toBeUndefined();
      expect(startRequestSchema.safeParse(body).success).toBe(true);
    }
  });

  it("has no code path in lib/session/api-client.ts that sends either field", () => {
    const source = readFileSync(fileURLToPath(new URL("../../lib/session/api-client.ts", import.meta.url)), "utf8");
    // The draft route legitimately takes the goal; the start helpers below must not.
    const startHelpers = source.slice(source.indexOf("export function startSession"));
    expect(startHelpers).not.toMatch(/\bgoal\b/);
    expect(startHelpers).not.toMatch(/hardMomentLine/);
    expect(source).not.toMatch(/standIn/);
  });
});
