import { describe, expect, it } from "vitest";
import type { Db } from "@/lib/data/sessions";
import { requireEndedSession } from "@/lib/reflection/session";

const id = "3f6f2a8e-1b7c-4d7e-9a51-0d7f3e9c2b11";
function db(row: Record<string, unknown> | null) {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: row, error: null }) };
  return { from: () => query } as unknown as Db;
}

describe("requireEndedSession", () => {
  it("accepts an ended practice", async () => {
    await expect(requireEndedSession(db({ id, status: "ended", kind: "practice" }), id)).resolves.toBeUndefined();
  });

  it("treats an ended stand-in call as not found, so it is never reflected on", async () => {
    await expect(requireEndedSession(db({ id, status: "ended", kind: "stand_in" }), id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });
});
