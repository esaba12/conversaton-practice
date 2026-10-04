import "server-only";
import { z } from "zod";
import { rpc, storageUnavailable } from "@/lib/data/rpc";
import type { Db } from "@/lib/data/sessions";
import { practiceHistoryResponseSchema } from "@/lib/schemas/people";
import { sessionPresetSchema } from "@/lib/schemas/situation";

// W10: which counterparts the owner has already finished a normal practice with. Metadata only
// (M1 `practice_history()` counts ended rows with kind = 'practice'); no content, and stand-in
// calls never count. It decides whether "Show me first" or "Call {name}" is the primary button.
const historySchema = z.object({
  person_ids: z.array(z.uuid()),
  // An unknown preset id would mean a renamed starter; ignore it rather than failing the read.
  presets: z.array(z.string()),
}).loose();

export async function practiceHistory(db: Db) {
  const parsed = historySchema.safeParse(await rpc(db, "practice_history", {}));
  if (!parsed.success) throw storageUnavailable();
  return {
    personIds: parsed.data.person_ids,
    practicedPresets: parsed.data.presets.filter((preset) => sessionPresetSchema.safeParse(preset).success),
  };
}

export async function practicedPresets(db: Db) {
  return practiceHistoryResponseSchema.parse({ practicedPresets: (await practiceHistory(db)).practicedPresets });
}

// People reads must not fail because the history read did: an unavailable history leaves
// `hasPracticed` absent (the field is optional) instead of claiming a first practice.
export async function practicedPersonIds(db: Db): Promise<Set<string> | null> {
  try {
    return new Set((await practiceHistory(db)).personIds);
  } catch {
    return null;
  }
}
