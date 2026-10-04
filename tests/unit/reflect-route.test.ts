import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import { reflectResponseSchema } from "@/lib/schemas/reflection";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
const session = vi.hoisted(() => ({ requireEndedSession: vi.fn(), reserveReflection: vi.fn(() => () => undefined) }));
vi.mock("@/lib/reflection/session", () => session);
const generate = vi.hoisted(() => ({ generateReflection: vi.fn() }));
vi.mock("@/lib/reflection/generate", () => generate);
import { POST } from "@/app/api/sessions/[id]/reflect/route";

const owner = "11111111-1111-4111-8111-111111111111";
const id = "3f6f2a8e-1b7c-4d7e-9a51-0d7f3e9c2b11";
const turns = [
  { speaker: "counterpart" as const, text: "Hey, what's up?" },
  { speaker: "user" as const, text: "Can we talk about the dishes?" },
];
const reflection = { evidence: "complete" as const, observedAction: "You named the dishes.", quotedLine: "Can we talk about the dishes?", takeaway: "Being specific helped.", nextStep: "Propose a time next time.", supportExit: false };
let client: { from: ReturnType<typeof vi.fn> };

const posted = (value: unknown) => {
  const request = new Request(`http://127.0.0.1:3000/api/sessions/${id}/reflect`, {
    method: "POST",
    body: typeof value === "string" ? value : JSON.stringify(value),
  });
  return { request, text: vi.spyOn(request, "text") };
};
const run = (sent: ReturnType<typeof posted>) => POST(sent.request, { params: Promise.resolve({ id }) });
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  return errorSchema.parse(await response.json());
}

beforeEach(() => {
  client = { from: vi.fn() };
  identity.requireIdentity.mockResolvedValue({ client, identity: { id: owner, isAnonymous: false } });
  session.requireEndedSession.mockReset();
  session.requireEndedSession.mockResolvedValue(undefined);
  session.reserveReflection.mockClear();
  session.reserveReflection.mockReturnValue(() => undefined);
  generate.generateReflection.mockReset();
});

describe("POST /api/sessions/[id]/reflect ownership before the body", () => {
  it("returns 404 when requireEndedSession rejects NOT_FOUND and never reads the body", async () => {
    const sent = posted("not json");
    session.requireEndedSession.mockImplementation(async () => {
      expect(sent.text).not.toHaveBeenCalled();
      throw new AppError("NOT_FOUND", "That practice was not found.", 404);
    });
    const response = await POST(sent.request, { params: Promise.resolve({ id }) });
    expect((await errorOf(response, 404)).code).toBe("NOT_FOUND");
    expect(sent.text).not.toHaveBeenCalled();
    expect(sent.request.bodyUsed).toBe(false);
    expect(session.requireEndedSession).toHaveBeenCalledWith(client, id);
    expect(session.reserveReflection).not.toHaveBeenCalled();
    expect(generate.generateReflection).not.toHaveBeenCalled();
  });

  it("returns 409 for an active session even when the body is invalid", async () => {
    const sent = posted({ turns, privateNotes: "I am scared" });
    session.requireEndedSession.mockImplementation(async () => {
      expect(sent.text).not.toHaveBeenCalled();
      throw new AppError("SESSION_ACTIVE", "End the practice before reflecting.", 409, false, id);
    });
    expect(await errorOf(await run(sent), 409)).toMatchObject({ code: "SESSION_ACTIVE", retryable: false, session_id: id });
    expect(sent.text).not.toHaveBeenCalled();
    expect(sent.request.bodyUsed).toBe(false);
    expect(generate.generateReflection).not.toHaveBeenCalled();
  });

  it("returns 400 when an ended session has an invalid body", async () => {
    const sent = posted({ turns, privateNotes: "I am scared" });
    session.requireEndedSession.mockImplementation(async () => {
      expect(sent.text).not.toHaveBeenCalled();
    });
    expect((await errorOf(await run(sent), 400)).code).toBe("VALIDATION_ERROR");
    expect(sent.text).toHaveBeenCalledTimes(1);
    expect(session.reserveReflection).not.toHaveBeenCalled();
    expect(generate.generateReflection).not.toHaveBeenCalled();
  });

  it("generates a reflection after an ended session accepts a valid body", async () => {
    generate.generateReflection.mockResolvedValue(reflection);
    const sent = posted({ turns });
    const response = await run(sent);
    expect(response.status).toBe(200);
    expect(reflectResponseSchema.parse(await response.json())).toEqual({ reflection });
    expect(session.requireEndedSession).toHaveBeenCalledWith(client, id);
    expect(generate.generateReflection).toHaveBeenCalledTimes(1);
    expect(generate.generateReflection).toHaveBeenCalledWith({ turns });
    expect(session.reserveReflection).toHaveBeenCalledWith(id);
  });
});
