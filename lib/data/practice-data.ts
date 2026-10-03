import "server-only";
import { z } from "zod";
import { rpc, storageUnavailable } from "@/lib/data/rpc";
import type { Db } from "@/lib/data/sessions";
import { AppError } from "@/lib/schemas/errors";
import { deletePracticeDataResponseSchema, MAX_LISTED_SESSIONS, sessionListResponseSchema } from "@/lib/schemas/practice-data";

// Owner RLS scopes every read. Provider ids, fingerprints and idempotency keys are never selected.
const SESSION_COLUMNS = "id, status, cleanup, created_at, ended_at";

type Row = Record<string, unknown>;
const iso = (value: unknown) => {
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : value;
};
function valid<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw storageUnavailable();
  return parsed.data;
}
async function rows(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<Row[]> {
  let result: { data: unknown; error: unknown };
  try { result = await query; } catch { throw storageUnavailable(); }
  if (result.error || !Array.isArray(result.data)) throw storageUnavailable();
  return result.data.map(r => (r && typeof r === "object" && !Array.isArray(r) ? r as Row : {}));
}

export async function listSessions(db: Db) {
  const data = await rows(db.from("practice_sessions").select(SESSION_COLUMNS).order("created_at", { ascending: false }).limit(MAX_LISTED_SESSIONS));
  return valid(sessionListResponseSchema, {
    sessions: data.map(r => ({ id: r.id, status: r.status, cleanup: r.cleanup, createdAt: iso(r.created_at), endedAt: r.ended_at === null ? null : iso(r.ended_at) })),
  });
}

const ids = async (db: Db, table: "people" | "about_me_facts") => (await rows(db.from(table).select("id"))).map(r => String(r.id));
const hasPrep = async (db: Db) => (await rows(db.from("private_prep").select("owner_id"))).length > 0;

// Counts as gone when the RPC deleted it or it was already gone; other failures are left for `remaining`.
async function remove(db: Db, name: string, args: Record<string, unknown>) {
  try { await rpc(db, name, args); return true; } catch (error) {
    if (!(error instanceof AppError)) return false;
    if (error.code === "UNAUTHENTICATED") throw error;
    return error.code === "NOT_FOUND";
  }
}

// Not one transaction: each item goes through its owner RPC, then a re-read reports what truly remains.
export async function deletePracticeData(db: Db) {
  const [personIds, factIds, prep] = await Promise.all([ids(db, "people"), ids(db, "about_me_facts"), hasPrep(db)]);
  let people = 0, aboutMeFacts = 0;
  for (const id of personIds) if (await remove(db, "person_delete", { p_id: id })) people++;
  for (const id of factIds) if (await remove(db, "about_me_delete", { p_id: id })) aboutMeFacts++;
  const prepCleared = await remove(db, "private_prep_put", { p_notes: "" });
  const [peopleLeft, factsLeft, prepLeft, sessions] = await Promise.all([
    ids(db, "people"), ids(db, "about_me_facts"), hasPrep(db), rows(db.from("practice_sessions").select("cleanup")),
  ]);
  return valid(deletePracticeDataResponseSchema, {
    deleted: { aboutMeFacts, people, privatePrep: prep && prepCleared && !prepLeft },
    remaining: { aboutMeFacts: factsLeft.length, people: peopleLeft.length, privatePrep: prepLeft },
    sessions: {
      total: sessions.length,
      cleanupConfirmed: sessions.filter(s => s.cleanup === "confirmed").length,
      cleanupOutstanding: sessions.filter(s => s.cleanup === "pending" || s.cleanup === "unresolved").length,
    },
  });
}
