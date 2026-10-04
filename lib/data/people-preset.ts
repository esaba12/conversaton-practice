import "server-only";
import { z } from "zod";
import { rpc, storageUnavailable } from "@/lib/data/rpc";
import type { Db } from "@/lib/data/sessions";
import { AppError } from "@/lib/schemas/errors";
import { sessionPresetSchema, type SessionPreset } from "@/lib/schemas/situation";

// B4 look-and-voice preset. Only the preset name crosses the API; the server maps it to face and PAL.
export const setPresetRequestSchema = z.strictObject({ presetId: sessionPresetSchema.nullable(), expectedVersion: z.number().int().positive() });
export const presetResponseSchema = z.strictObject({ preset: z.strictObject({ id: z.uuid(), version: z.number().int().positive(), presetId: sessionPresetSchema.nullable() }) });
export type PersonPreset = z.output<typeof presetResponseSchema>["preset"];

const notFound = () => new AppError("NOT_FOUND", "That item was not found.", 404);
function parsed(raw: unknown): PersonPreset {
  const row = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const result = presetResponseSchema.safeParse({ preset: { id: row.id, version: row.version, presetId: row.preset_id ?? null } });
  // A stored value outside the four starters is rejected rather than mapped to a default face.
  if (!result.success) throw storageUnavailable();
  return result.data.preset;
}

// Owner RLS read on the request client; person_context is strict and does not carry preset_id.
export async function getPersonPreset(db: Db, id: string): Promise<PersonPreset> {
  let result: { data: unknown; error: unknown };
  try { result = await db.from("people").select("id, version, preset_id").eq("id", id).maybeSingle(); } catch { throw storageUnavailable(); }
  if (result.error) throw storageUnavailable();
  if (!result.data) throw notFound();
  return parsed(result.data);
}

export async function setPersonPreset(db: Db, id: string, expectedVersion: number, presetId: SessionPreset | null): Promise<PersonPreset> {
  return parsed(await rpc(db, "person_set_preset", { p_id: id, p_expected_version: expectedVersion, p_preset: presetId }));
}
