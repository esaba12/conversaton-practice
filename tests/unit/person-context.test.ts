import { describe, expect, it, vi } from "vitest";
import { loadDraftPersonIdentity, loadPersonContext } from "@/lib/data/person-context";
import type { Db } from "@/lib/data/sessions";
import { buildRoleContext } from "@/lib/schemas/role-context";

const personId = "55555555-5555-4555-8555-555555555555";
const stored = {
  id: personId, version: 3, name: "Sam", relationship: "Your fictional coworker", traits: { tone: "blunt", familiarity: "close" },
  style: "Direct; prefers specifics.", background: "Sam is a senior designer on your team.", public_context: "You share a desk on the design team.", opening: "Hey, got a minute?",
  constraints: ["Stay at work."], challenge: "neutral", pace: "patient", known_about_user: ["SHARED-FACT I run on weekends"],
};
function db(result: { data?: unknown; error?: { code: string; message: string } }) {
  const rpc = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }));
  return { client: { rpc, from: vi.fn() } as unknown as Db, rpc };
}

describe("loadPersonContext", () => {
  it("reads only person_context for the caller and maps it to a role plus shared facts", async () => {
    const { client, rpc } = db({ data: stored });
    const loaded = await loadPersonContext(client, personId, 3);
    expect(rpc.mock.calls).toEqual([["person_context", { p_id: personId, p_expected_version: 3 }]]);
    expect(loaded).toEqual({
      version: 3,
      role: { name: "Sam", role: "Your fictional coworker", style: "Direct; prefers specifics.", publicContext: "You share a desk on the design team.", opening: "Hey, got a minute?", constraints: ["Stay at work."], challenge: "neutral", pace: "patient" },
      extras: { traits: { tone: "blunt", familiarity: "close" }, knownAboutUser: ["SHARED-FACT I run on weekends"] },
    });
    const context = buildRoleContext(loaded.role, loaded.extras);
    expect(context).toContain("SHARED-FACT I run on weekends"); expect(context).toContain("blunt and direct"); expect(context).toContain("speaks familiarly with the user");
  });

  it("omits the told-you framing when nothing is shared", async () => {
    const loaded = await loadPersonContext(db({ data: { ...stored, traits: {}, known_about_user: [] } }).client, personId, 3);
    expect(buildRoleContext(loaded.role, loaded.extras)).toBe(buildRoleContext(loaded.role));
  });

  it("maps database markers to NOT_FOUND and VERSION_CONFLICT", async () => {
    await expect(loadPersonContext(db({ error: { code: "P0001", message: "NOT_FOUND" } }).client, personId, 3)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(loadPersonContext(db({ error: { code: "P0001", message: "VERSION_CONFLICT" } }).client, personId, 2)).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });
  });

  it("rejects malformed, extra-key or mismatched output as storage unavailable", async () => {
    const bad = [
      null, { ...stored, private_prep: "PRIVATE-PREP" }, { ...stored, unshared_facts: ["UNSHARED"] }, { ...stored, known_about_user: undefined },
      { ...stored, traits: { tone: "furious" } }, { ...stored, known_about_user: ["x".repeat(121)] }, { ...stored, id: "66666666-6666-4666-8666-666666666666" }, { ...stored, version: 4 },
    ];
    for (const data of bad) await expect(loadPersonContext(db({ data }).client, personId, 3)).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE", status: 503 });
  });
});

describe("loadDraftPersonIdentity", () => {
  function identityDb(data: unknown, error: unknown = null) {
    const query = {
      select: vi.fn(() => query), eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data, error })),
    };
    return { client: { from: vi.fn(() => query), rpc: vi.fn() } as unknown as Db, query };
  }

  it("selects identity only and never shared facts, prep, or default-situation fields", async () => {
    const identity = {
      id: personId, name: "Sam", relationship: "Your coworker", traits: { tone: "blunt" },
      style: "Direct.", background: "Sam is a senior designer.",
    };
    const { client, query } = identityDb(identity);
    await expect(loadDraftPersonIdentity(client, personId)).resolves.toEqual(identity);
    expect(query.select).toHaveBeenCalledWith("id, name, relationship, traits, style, background");
  });

  it("returns 404 for a missing or foreign owner row and fails closed on malformed data", async () => {
    await expect(loadDraftPersonIdentity(identityDb(null).client, personId)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(loadDraftPersonIdentity(identityDb({ id: personId, name: "Sam", private_prep: "SECRET" }).client, personId)).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE", status: 503 });
  });
});
