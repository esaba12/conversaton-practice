import "server-only";
import { rpc, storageUnavailable } from "@/lib/data/rpc";
import type { Db } from "@/lib/data/sessions";
import { deletedResponseSchema } from "@/lib/schemas/people";
import { plannedListResponseSchema, plannedResponseSchema, type CheckinRequest, type SetPlannedRequest } from "@/lib/schemas/planned";

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const iso = (value: unknown) => {
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : value;
};
// The owner_id column is dropped here; the row never reaches the client with it.
function plan(value: unknown) {
  const raw = row(value);
  return {
    id: raw.id, personId: raw.person_id, plannedOn: raw.planned_on, label: raw.label ?? null, fear: raw.fear ?? null,
    likelihoodBefore: raw.likelihood_before ?? null, likelihoodAfter: raw.likelihood_after ?? null,
    checkin: raw.checkin ?? null, checkinNote: raw.checkin_note ?? null,
    checkedInAt: raw.checked_in_at == null ? null : iso(raw.checked_in_at), createdAt: iso(raw.created_at), updatedAt: iso(raw.updated_at),
  };
}
function one(value: unknown) {
  const parsed = plannedResponseSchema.safeParse({ plan: plan(value) });
  if (!parsed.success) throw storageUnavailable();
  return parsed.data;
}

export async function listPlanned(db: Db, ownerId: string) {
  let result: { data: unknown; error: unknown };
  try { result = await db.from("planned_conversations").select("*").eq("owner_id", ownerId).order("planned_on", { ascending: true }); }
  catch { throw storageUnavailable(); }
  if (result.error || !Array.isArray(result.data)) throw storageUnavailable();
  const parsed = plannedListResponseSchema.safeParse({ plans: result.data.map(plan) });
  if (!parsed.success) throw storageUnavailable();
  return parsed.data;
}

// W4: fear and likelihood are passed only when the request carries the opt-in `guess`; otherwise the RPC gets nulls.
export async function setPlanned(db: Db, input: SetPlannedRequest) {
  return one(await rpc(db, "planned_set", {
    p_person_id: input.personId,
    p_planned_on: input.plannedOn,
    p_label: input.label ?? null,
    p_fear: input.guess?.fear ?? null,
    p_likelihood_before: input.guess?.likelihoodBefore ?? null,
  }));
}

export async function checkinPlanned(db: Db, id: string, input: CheckinRequest) {
  return one(await rpc(db, "planned_checkin", {
    p_id: id, p_answer: input.answer, p_note: input.note ?? null, p_likelihood_after: input.likelihoodAfter ?? null,
  }));
}

export async function deletePlanned(db: Db, id: string) {
  const parsed = deletedResponseSchema.safeParse(await rpc(db, "planned_delete", { p_id: id }));
  if (!parsed.success) throw storageUnavailable();
  return parsed.data;
}
