import { afterEach, describe, expect, it, vi } from "vitest";
import { examples } from "@/fixtures/examples";
import { createFlowState, reduceFlow } from "@/lib/practice/flow";
import { roleToPersonFields } from "@/lib/schemas/people";
import { startSavedPersonSession, startSession } from "@/lib/session/api-client";

const session = { id: "11111111-1111-4111-8111-111111111111", status: "connecting", expires_at: new Date(Date.now() + 60_000).toISOString(), cleanup: "pending" };
function captureFetch() {
  const bodies: unknown[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return Response.json({ session, credential: { url: "https://example.daily.co/room", token: "t" } }, { status: 201 });
  }));
  return bodies;
}
afterEach(() => vi.unstubAllGlobals());

describe("lobby and briefing wiring", () => {
  it("keeps private state when re-entering the same subject, clears it otherwise", () => {
    const lobby = createFlowState("lobby");
    expect(reduceFlow(lobby, { type: "pickPerson" }).clearPrivate).toBe(true);
    expect(reduceFlow(lobby, { type: "pickPerson", resume: true }).clearPrivate).toBe(false);
    expect(reduceFlow(lobby, { type: "pickSomeoneNew", resume: true }).clearPrivate).toBe(false);
  });

  it("sends a reviewed role's stance chips in the role start body", async () => {
    const bodies = captureFetch();
    await startSession({ role: examples.manager.role, durationSeconds: 180 }).catch(() => undefined);
    const body = bodies[0] as { role: Record<string, unknown> };
    expect(body.role).toMatchObject({ wants: examples.manager.role.wants, holdsBackBecause: examples.manager.role.holdsBackBecause, softensWhen: examples.manager.role.softensWhen });
    expect(JSON.stringify(body)).not.toContain(examples.manager.goal);
  });

  it("sends a saved person's chosen situation, and no identity, goal or notes", async () => {
    const bodies = captureFetch();
    const situation = { publicContext: "A launch task needs to move.", opening: "Which task?", constraints: [], challenge: "neutral" as const, pace: "patient" as const, wants: "Keep launch on track" };
    await startSavedPersonSession({ personId: session.id, expectedVersion: 2, situation, durationSeconds: 180 }).catch(() => undefined);
    await startSavedPersonSession({ personId: session.id, expectedVersion: 2, durationSeconds: 180 }).catch(() => undefined);
    expect(Object.keys(bodies[0] as object).sort()).toEqual(["durationSeconds", "expectedVersion", "idempotencyKey", "personId", "situation"]);
    expect((bodies[0] as { situation: unknown }).situation).toEqual(situation);
    expect(Object.keys(bodies[1] as object).sort()).toEqual(["durationSeconds", "expectedVersion", "idempotencyKey", "personId"]);
  });

  it("saves a role that carries stance chips as a person without them", () => {
    const fields = roleToPersonFields(examples.manager.role);
    expect(fields).not.toHaveProperty("wants");
    expect(fields.name).toBe(examples.manager.role.name);
  });
});
