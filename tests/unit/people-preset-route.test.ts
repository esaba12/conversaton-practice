import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import { GET, PUT } from "@/app/api/people/[id]/preset/route";
import { presetResponseSchema } from "@/lib/data/people-preset";

const pid = "22222222-2222-4222-8222-222222222222";
type Result = { data?: unknown; error?: { code: string; message: string } | null };
let rpcResult: (args: Record<string, unknown>) => Result, readResult: Result;
let rpc: ReturnType<typeof vi.fn>, from: ReturnType<typeof vi.fn>;
const marker = (message: string) => ({ error: { code: "P0001", message } });
const ctx = (value: string) => ({ params: Promise.resolve({ id: value }) });
const req = (method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://127.0.0.1:3000/api/people/${pid}/preset`, { method, headers, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  return errorSchema.parse(await response.json());
}

beforeEach(() => {
  rpcResult = (args) => ({ data: { id: args.p_id, version: Number(args.p_expected_version) + 1, preset_id: args.p_preset } });
  readResult = { data: { id: pid, version: 3, preset_id: "roommate" } };
  rpc = vi.fn(async (_: string, args: Record<string, unknown>) => { const r = rpcResult(args); return { data: r.data ?? null, error: r.error ?? null }; });
  from = vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: readResult.data ?? null, error: readResult.error ?? null }) }) }) }));
  identity.requireIdentity.mockResolvedValue({ client: { rpc, from }, identity: { id: "11111111-1111-4111-8111-111111111111", isAnonymous: false } });
});

describe("person preset route", () => {
  it("requires sign-in before touching storage", async () => {
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    await errorOf(await GET(req("GET"), ctx(pid)), 401);
    await errorOf(await PUT(req("PUT", { presetId: "roommate", expectedVersion: 1 }), ctx(pid)), 401);
    expect(rpc).not.toHaveBeenCalled(); expect(from).not.toHaveBeenCalled();
  });

  it("sets a starter preset or clears it with the expected version, returning the bumped version", async () => {
    const set = presetResponseSchema.parse(await (await PUT(req("PUT", { presetId: "professor", expectedVersion: 4 }), ctx(pid))).json());
    expect(set.preset).toEqual({ id: pid, version: 5, presetId: "professor" });
    expect(rpc).toHaveBeenCalledWith("person_set_preset", { p_id: pid, p_expected_version: 4, p_preset: "professor" });
    const cleared = presetResponseSchema.parse(await (await PUT(req("PUT", { presetId: null, expectedVersion: 5 }), ctx(pid))).json());
    expect(cleared.preset.presetId).toBeNull();
  });

  it("rejects unknown presets, provider ids, missing versions and bad ids with 400 before the RPC", async () => {
    for (const body of [{ presetId: "boss", expectedVersion: 1 }, { presetId: "roommate" }, { presetId: "roommate", expectedVersion: 1, faceId: "f123" },
      { faceId: "f123", expectedVersion: 1 }, { presetId: "roommate", expectedVersion: 0 }, "not json"]) {
      expect((await errorOf(await PUT(req("PUT", body), ctx(pid)), 400)).code).toBe("VALIDATION_ERROR");
    }
    await errorOf(await PUT(req("PUT", { presetId: "roommate", expectedVersion: 1 }), ctx("nope")), 400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps RPC markers to 404, 409 and 400 and hides raw errors", async () => {
    const body = { presetId: "decline", expectedVersion: 1 };
    rpcResult = () => marker("NOT_FOUND");
    expect((await errorOf(await PUT(req("PUT", body), ctx(pid)), 404)).code).toBe("NOT_FOUND");
    rpcResult = () => marker("VERSION_CONFLICT");
    expect((await errorOf(await PUT(req("PUT", body), ctx(pid)), 409)).code).toBe("VERSION_CONFLICT");
    rpcResult = () => marker("INVALID_INPUT");
    expect((await errorOf(await PUT(req("PUT", body), ctx(pid)), 400)).code).toBe("VALIDATION_ERROR");
    rpcResult = () => ({ error: { code: "42501", message: "permission denied for table people" } });
    expect(JSON.stringify(await errorOf(await PUT(req("PUT", body), ctx(pid)), 503))).not.toContain("permission");
  });

  it("rejects cross-site writes", async () => {
    await errorOf(await PUT(req("PUT", { presetId: "roommate", expectedVersion: 1 }, { origin: "https://evil.example" }), ctx(pid)), 403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reads the preset by owner RLS, 404s a missing or foreign person, and returns no provider ids", async () => {
    vi.stubEnv("TAVUS_STARTER_ROOMMATE_FACE_ID", "unit-roommate-face"); vi.stubEnv("TAVUS_STARTER_ROOMMATE_PAL_ID", "unit-roommate-pal");
    const response = await GET(req("GET"), ctx(pid));
    const text = await response.text();
    expect(presetResponseSchema.parse(JSON.parse(text)).preset).toEqual({ id: pid, version: 3, presetId: "roommate" });
    expect(text).not.toContain("unit-roommate");
    expect(response.headers.get("cache-control")).toBe("no-store");
    readResult = { data: null };
    expect((await errorOf(await GET(req("GET"), ctx(pid)), 404)).code).toBe("NOT_FOUND");
    readResult = { data: { id: pid, version: 3, preset_id: "boss" } };
    await errorOf(await GET(req("GET"), ctx(pid)), 503);
    vi.unstubAllEnvs();
  });
});
