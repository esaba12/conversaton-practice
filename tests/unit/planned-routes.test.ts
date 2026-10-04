import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import { plannedListResponseSchema, plannedResponseSchema } from "@/lib/schemas/planned";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import * as planned from "@/app/api/planned/route";
import * as plannedItem from "@/app/api/planned/[id]/route";
import * as checkin from "@/app/api/planned/[id]/checkin/route";

const owner = "11111111-1111-4111-8111-111111111111", pid = "22222222-2222-4222-8222-222222222222", planId = "33333333-3333-4333-8333-333333333333";
const ts = "2026-10-04T05:00:00.123456+00:00";
type Result = { data?: unknown; error?: { code: string; message: string } };
let handlers: Record<string, (args: Record<string, unknown>) => Result>, table: Result, rpc: ReturnType<typeof vi.fn>, queries: [string, unknown[]][];

const marker = (message: string) => ({ error: { code: "P0001", message } });
const row = (patch: Record<string, unknown> = {}) => ({
  id: planId, owner_id: owner, person_id: pid, planned_on: "2026-10-09", label: null, fear: null, likelihood_before: null, likelihood_after: null,
  checkin: null, checkin_note: null, checked_in_at: null, created_at: ts, updated_at: ts, ...patch,
});
const req = (method: string, url: string, body?: unknown) =>
  new Request(`http://127.0.0.1:3000${url}`, { method, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const calls = (name: string) => rpc.mock.calls.filter(([called]) => called === name).map(([, args]) => args as Record<string, unknown>);
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  return errorSchema.parse(await response.json());
}

function from() {
  const builder: object = new Proxy({}, {
    get(_, prop) {
      if (prop === "then") return (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table.data ?? null, error: table.error ?? null }).then(resolve);
      return (...args: unknown[]) => { queries.push([String(prop), args]); return builder; };
    },
  });
  return builder;
}

beforeEach(() => {
  handlers = {}; table = { data: [] }; queries = [];
  rpc = vi.fn(async (name: string, args: Record<string, unknown>) => { const r = handlers[name]?.(args) ?? { error: { code: "XX000", message: "unhandled" } }; return { data: r.data ?? null, error: r.error ?? null }; });
  identity.requireIdentity.mockReset();
  identity.requireIdentity.mockResolvedValue({ client: { rpc, from: vi.fn(from) }, identity: { id: owner, isAnonymous: false } });
});

describe("planned routes", () => {
  it("returns 401 on every route before reading the body or touching storage", async () => {
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    const requests: [Request, Promise<Response>][] = [];
    const add = (request: Request, run: (r: Request) => Promise<Response>) => requests.push([request, run(request)]);
    add(req("GET", "/api/planned"), r => planned.GET(r));
    add(req("PUT", "/api/planned", "not json"), r => planned.PUT(r));
    add(req("POST", `/api/planned/${planId}/checkin`, "not json"), r => checkin.POST(r, ctx("bad-id")));
    add(req("DELETE", `/api/planned/${planId}`), r => plannedItem.DELETE(r, ctx("bad-id")));
    for (const [request, response] of requests) {
      expect((await errorOf(await response, 401)).code).toBe("UNAUTHENTICATED");
      expect(request.bodyUsed).toBe(false);
    }
    expect(rpc).not.toHaveBeenCalled(); expect(queries).toHaveLength(0);
  });

  it("lists the caller's plans through the user-JWT client, filtered by owner, without owner_id in the response", async () => {
    table = { data: [row({ label: "Dishes", fear: "SECRET-FEAR", likelihood_before: 80 })] };
    const response = await planned.GET(req("GET", "/api/planned"));
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = plannedListResponseSchema.parse(await response.json());
    expect(body.plans[0]).toMatchObject({ id: planId, personId: pid, plannedOn: "2026-10-09", label: "Dishes", fear: "SECRET-FEAR", likelihoodBefore: 80, checkin: null, createdAt: "2026-10-04T05:00:00.123Z" });
    expect(JSON.stringify(body)).not.toContain(owner);
    expect(queries).toContainEqual(["eq", ["owner_id", owner]]);
  });

  it("reports storage failure as a retryable 503 without leaking the database message", async () => {
    table = { error: { code: "XX000", message: "relation secret_detail failed" } };
    const body = await errorOf(await planned.GET(req("GET", "/api/planned")), 503);
    expect(body.code).toBe("PROVIDER_UNAVAILABLE"); expect(JSON.stringify(body)).not.toContain("secret_detail");
  });

  it("rejects unknown fields, bad days, long labels and oversized bodies before storage", async () => {
    const good = { personId: pid, plannedOn: "2026-10-09" };
    const bodies: unknown[] = [
      { ...good, ownerId: owner }, { ...good, plannedOn: "2026-02-30" }, { ...good, plannedOn: "tomorrow" }, { personId: "nope", plannedOn: "2026-10-09" },
      { ...good, label: "x".repeat(121) }, { ...good, label: "   " }, { ...good, guess: {} }, { ...good, guess: { fear: "x".repeat(201) } },
      { ...good, guess: { likelihoodBefore: 101 } }, { ...good, guess: { likelihoodBefore: 1.5 } }, { ...good, fear: "top-level fear is not allowed" },
      JSON.stringify(good) + " ".repeat(2048),
    ];
    for (const body of bodies) expect((await errorOf(await planned.PUT(req("PUT", "/api/planned", body)), 400)).code).toBe("VALIDATION_ERROR");
    for (const body of [{ answer: "maybe" }, { answer: "not_yet", note: "no notes here" }, { answer: "yes", note: "x".repeat(201) }, { answer: "yes", likelihoodAfter: 120 }, { answer: "yes", extra: 1 }]) {
      expect((await errorOf(await checkin.POST(req("POST", `/api/planned/${planId}/checkin`, body), ctx(planId)), 400)).code).toBe("VALIDATION_ERROR");
    }
    expect((await errorOf(await checkin.POST(req("POST", "/api/planned/nope/checkin", { answer: "yes" }), ctx("nope")), 400)).code).toBe("VALIDATION_ERROR");
    expect((await errorOf(await plannedItem.DELETE(req("DELETE", "/api/planned/nope"), ctx("nope")), 400)).code).toBe("VALIDATION_ERROR");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("W4: stores no fear or likelihood unless the request carries the opt-in guess", async () => {
    handlers.planned_set = () => ({ data: row({ label: "Dishes" }) });
    const off = plannedResponseSchema.parse(await (await planned.PUT(req("PUT", "/api/planned", { personId: pid, plannedOn: "2026-10-09", label: " Dishes " }))).json());
    expect(off.plan.fear).toBeNull();
    expect(calls("planned_set")[0]).toEqual({ p_person_id: pid, p_planned_on: "2026-10-09", p_label: "Dishes", p_fear: null, p_likelihood_before: null });

    handlers.planned_set = () => ({ data: row({ fear: "She will say no", likelihood_before: 70 }) });
    await planned.PUT(req("PUT", "/api/planned", { personId: pid, plannedOn: "2026-10-09", guess: { fear: " She will say no ", likelihoodBefore: 70 } }));
    expect(calls("planned_set")[1]).toEqual({ p_person_id: pid, p_planned_on: "2026-10-09", p_label: null, p_fear: "She will say no", p_likelihood_before: 70 });
  });

  it("maps another owner's person or plan to 404 NOT_FOUND on set, check-in and delete", async () => {
    handlers.planned_set = () => marker("NOT_FOUND");
    handlers.planned_checkin = () => marker("NOT_FOUND");
    handlers.planned_delete = () => marker("NOT_FOUND");
    expect((await errorOf(await planned.PUT(req("PUT", "/api/planned", { personId: pid, plannedOn: "2026-10-09" })), 404)).code).toBe("NOT_FOUND");
    expect((await errorOf(await checkin.POST(req("POST", `/api/planned/${planId}/checkin`, { answer: "yes" }), ctx(planId)), 404)).code).toBe("NOT_FOUND");
    expect((await errorOf(await plannedItem.DELETE(req("DELETE", `/api/planned/${planId}`), ctx(planId)), 404)).code).toBe("NOT_FOUND");
  });

  it("checks in with the answer, note and nothing else", async () => {
    handlers.planned_checkin = () => ({ data: row({ checkin: "yes", checkin_note: "It went fine", checked_in_at: ts }) });
    const body = plannedResponseSchema.parse(await (await checkin.POST(req("POST", `/api/planned/${planId}/checkin`, { answer: "yes", note: " It went fine " }), ctx(planId))).json());
    expect(body.plan).toMatchObject({ checkin: "yes", checkinNote: "It went fine" });
    expect(calls("planned_checkin")[0]).toEqual({ p_id: planId, p_answer: "yes", p_note: "It went fine", p_likelihood_after: null });
  });

  it("deletes and maps INVALID_INPUT from the database to 400", async () => {
    handlers.planned_delete = () => ({ data: { deleted: true } });
    expect(await (await plannedItem.DELETE(req("DELETE", `/api/planned/${planId}`), ctx(planId))).json()).toEqual({ deleted: true });
    handlers.planned_set = () => marker("INVALID_INPUT");
    expect((await errorOf(await planned.PUT(req("PUT", "/api/planned", { personId: pid, plannedOn: "2026-10-09" })), 400)).code).toBe("VALIDATION_ERROR");
  });
});
