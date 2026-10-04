import "server-only";
import { rpc, storageUnavailable } from "@/lib/data/rpc";
import type { Db } from "@/lib/data/sessions";
import {
  deletedResponseSchema,
  personSituationResponseSchema,
  personSituationsResponseSchema,
  type PersonSituation,
} from "@/lib/schemas/people";
import type { Situation } from "@/lib/schemas/situation";

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const iso = (value: unknown) => {
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : value;
};
function situation(value: unknown): PersonSituation {
  const raw = row(value);
  const parsed = personSituationResponseSchema.safeParse({ situation: {
    id: raw.id, label: raw.label, situation: raw.situation,
    createdAt: iso(raw.created_at), updatedAt: iso(raw.updated_at),
  } });
  if (!parsed.success) throw storageUnavailable();
  return parsed.data.situation;
}

export async function listPersonSituations(db: Db, personId: string) {
  const raw = await rpc(db, "person_situation_list", { p_person_id: personId });
  if (!Array.isArray(raw)) throw storageUnavailable();
  const parsed = personSituationsResponseSchema.safeParse({ situations: raw.map(situation) });
  if (!parsed.success) throw storageUnavailable();
  return parsed.data;
}

export async function createPersonSituation(db: Db, personId: string, label: string, value: Situation) {
  const parsed = personSituationResponseSchema.safeParse({
    situation: situation(await rpc(db, "person_situation_create", {
      p_person_id: personId, p_label: label, p_situation: value,
    })),
  });
  if (!parsed.success) throw storageUnavailable();
  return parsed.data;
}

export async function deletePersonSituation(db: Db, id: string) {
  const parsed = deletedResponseSchema.safeParse(await rpc(db, "person_situation_delete", { p_id: id }));
  if (!parsed.success) throw storageUnavailable();
  return parsed.data;
}
