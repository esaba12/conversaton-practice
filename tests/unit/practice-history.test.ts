import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import { peopleListResponseSchema, personResponseSchema, practiceHistoryResponseSchema } from "@/lib/schemas/people";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import { GET as history } from "@/app/api/practice-history/route";
import { getPerson, listPeople } from "@/lib/data/people";

// W10: `hasPracticed` and `{ practicedPresets }` both come from the M1 practice_history() RPC,
// which counts only the owner's ended sessions with kind = 'practice'.
const practiced = "55555555-5555-4555-8555-555555555555";
const fresh = "66666666-6666-4666-8666-666666666666";
const owner = "22222222-2222-4222-8222-222222222222";

const personRow = (id: string, name: string) => ({
  id, version: 1, name, relationship: "Your fictional coworker", traits: {}, style: "Direct.",
  background: "A teammate.", public_context: "You share a team.", opening: "Hey, got a minute?",
  constraints: [], challenge: "neutral", pace: "patient",
  created_at: "2026-10-03T18:00:00.000+00:00", updated_at: "2026-10-03T18:00:00.000+00:00",
});

let historyResult: { data?: unknown; error?: { code: string; message: string } };
let rpc: ReturnType<typeof vi.fn>;
let people: ReturnType<typeof personRow>[];

function client() {
  rpc = vi.fn(async (name: string) => (name === "practice_history" ? { data: historyResult.data ?? null, error: historyResult.error ?? null } : { data: null, error: { code: "XX000", message: "unhandled" } }));
  const builder = (rows: unknown) => {
    const chain: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in", "order", "limit"]) chain[method] = () => chain;
    chain.maybeSingle = async () => ({ data: Array.isArray(rows) ? rows[0] ?? null : rows, error: null });
    chain.then = (resolve: (value: { data: unknown; error: null }) => unknown) => resolve({ data: rows, error: null });
    return chain;
  };
  const from = vi.fn((table: string) => builder(table === "people" ? people : []));
  return { rpc, from } as never;
}

const get = () => history(new Request("http://127.0.0.1:3000/api/practice-history"));

beforeEach(() => {
  people = [personRow(practiced, "Sam"), personRow(fresh, "Rowan")];
  historyResult = { data: { person_ids: [practiced], presets: ["manager", "roommate"] } };
  identity.requireIdentity.mockImplementation(async () => ({ client: client(), identity: { id: owner, isAnonymous: false } }));
});

describe("GET /api/practice-history", () => {
  it("returns the owner's practiced starters", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(practiceHistoryResponseSchema.parse(await response.json())).toEqual({ practicedPresets: ["manager", "roommate"] });
    expect(rpc).toHaveBeenCalledWith("practice_history", {});
  });

  it("returns an empty list when nothing has been practiced", async () => {
    historyResult = { data: { person_ids: [], presets: [] } };
    expect(await (await get()).json()).toEqual({ practicedPresets: [] });
  });

  it("drops a preset id the app does not know instead of failing the read", async () => {
    historyResult = { data: { person_ids: [], presets: ["manager", "boss"] } };
    expect(await (await get()).json()).toEqual({ practicedPresets: ["manager"] });
  });

  it("requires sign-in before touching storage", async () => {
    identity.requireIdentity.mockRejectedValueOnce(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    const response = await get();
    expect(response.status).toBe(401);
    expect(errorSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it("reports storage trouble without leaking the database message", async () => {
    historyResult = { error: { code: "42501", message: "permission denied for schema auth" } };
    const response = await get();
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("permission");
  });
});

describe("hasPracticed on a person", () => {
  it("is true only for a person with an ended practice", async () => {
    const list = peopleListResponseSchema.parse(await listPeople(client()));
    expect(list.people.map((person) => [person.id, person.hasPracticed])).toEqual([[practiced, true], [fresh, false]]);
    const one = personResponseSchema.parse(await getPerson(client(), practiced));
    expect(one.person.hasPracticed).toBe(true);
  });

  it("stays absent when the history read is unavailable, rather than claiming a first practice", async () => {
    historyResult = { error: { code: "42501", message: "permission denied" } };
    const list = peopleListResponseSchema.parse(await listPeople(client()));
    expect(list.people.every((person) => person.hasPracticed === undefined)).toBe(true);
  });
});
