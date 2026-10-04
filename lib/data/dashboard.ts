import "server-only";
import { z } from "zod";
import type { Db } from "@/lib/data/sessions";
import { sessionPresetSchema, type SessionPreset } from "@/lib/schemas/situation";

// Owner RLS scopes every read. Metadata only: no role text, transcripts, private prep or provider ids.
const MAX_SESSIONS = 500;
const MAX_CALL_MINUTES = 10;

const sessionRow = z.object({
  id: z.string(),
  status: z.string(),
  created_at: z.string(),
  connected_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  person_id: z.string().nullable(),
  kind: z.string(),
  preset: z.string().nullable(),
});
const personRow = z.object({ id: z.string(), name: z.string(), relationship: z.string(), preset_id: z.string().nullable() });
const plannedRow = z.object({
  id: z.string(),
  person_id: z.string(),
  planned_on: z.string(),
  label: z.string().nullable(),
  likelihood_before: z.number().nullable(),
  likelihood_after: z.number().nullable(),
  checkin: z.string().nullable(),
});

export const starterNames: Record<SessionPreset, { name: string; relationship: string }> = {
  manager: { name: "Jordan", relationship: "Manager" },
  roommate: { name: "Alex", relationship: "Roommate" },
  professor: { name: "Ellis", relationship: "Professor" },
  decline: { name: "Sam", relationship: "Classmate asking a favor" },
};

export type Counterpart = {
  key: string;
  name: string;
  relationship: string;
  href: string;
  portraitPreset: SessionPreset | null;
  saved: boolean;
  practices: number;
  lastAt: string | null;
};

export type DashboardPractice = { at: string; minutes: number; kind: "practice" | "stand_in" };

export type DashboardData = {
  available: boolean;
  practices: DashboardPractice[];
  recent: { id: string; at: string; minutes: number; name: string; kind: "practice" | "stand_in" }[];
  tryAgain: Counterpart[];
  starters: Counterpart[];
  peopleCount: number;
  factsCount: number;
  planned: { id: string; personName: string; href: string; plannedOn: string; label: string | null; before: number | null; after: number | null; checkin: string | null }[];
};

async function select<T extends z.ZodType>(query: PromiseLike<{ data: unknown; error: unknown }>, row: T): Promise<z.output<T>[]> {
  const { data, error } = await query;
  if (error || !Array.isArray(data)) throw new Error("dashboard read failed");
  return data.flatMap((item) => {
    const parsed = row.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function minutesOf(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.min(MAX_CALL_MINUTES, ms / 60_000);
}

const presetOf = (value: string | null): SessionPreset | null => {
  const parsed = sessionPresetSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

function starterCounterpart(preset: SessionPreset, practices = 0, lastAt: string | null = null): Counterpart {
  return { key: `preset:${preset}`, ...starterNames[preset], href: `/practice?preset=${preset}`, portraitPreset: preset, saved: false, practices, lastAt };
}

const empty: DashboardData = { available: false, practices: [], recent: [], tryAgain: [], starters: [], peopleCount: 0, factsCount: 0, planned: [] };

export async function loadDashboard(db: Db): Promise<DashboardData> {
  try {
    const [sessions, people, facts, planned] = await Promise.all([
      select(db.from("practice_sessions").select("id, status, created_at, connected_at, ended_at, person_id, kind, preset").order("created_at", { ascending: false }).limit(MAX_SESSIONS), sessionRow),
      select(db.from("people").select("id, name, relationship, preset_id").order("updated_at", { ascending: false }), personRow),
      select(db.from("about_me_facts").select("id"), z.object({ id: z.string() })),
      select(db.from("planned_conversations").select("id, person_id, planned_on, label, likelihood_before, likelihood_after, checkin").order("planned_on", { ascending: true }), plannedRow),
    ]);
    const peopleById = new Map(people.map((person) => [person.id, person]));
    const connected = sessions.filter((s) => s.connected_at !== null);

    const nameOf = (s: (typeof sessions)[number]) => {
      const person = s.person_id ? peopleById.get(s.person_id) : undefined;
      if (person) return person.name;
      const preset = presetOf(s.preset);
      return preset ? starterNames[preset].name : "Someone new";
    };
    const kindOf = (s: (typeof sessions)[number]) => (s.kind === "stand_in" ? "stand_in" as const : "practice" as const);

    const counterparts = new Map<string, Counterpart>();
    for (const s of connected) {
      if (s.kind !== "practice") continue;
      const person = s.person_id ? peopleById.get(s.person_id) : undefined;
      const preset = presetOf(s.preset);
      let entry: Counterpart | null = null;
      if (person) {
        const existing = counterparts.get(person.id);
        entry = existing ?? { key: person.id, name: person.name, relationship: person.relationship, href: `/practice?person=${encodeURIComponent(person.id)}`, portraitPreset: presetOf(person.preset_id), saved: true, practices: 0, lastAt: s.created_at };
        counterparts.set(person.id, entry);
      } else if (preset && !s.person_id) {
        const key = `preset:${preset}`;
        entry = counterparts.get(key) ?? starterCounterpart(preset, 0, s.created_at);
        counterparts.set(key, entry);
      }
      if (entry) entry.practices += 1;
    }
    const tryAgain = [...counterparts.values()].slice(0, 4);
    const used = new Set(tryAgain.flatMap((c) => (c.portraitPreset ? [c.key, `preset:${c.portraitPreset}`] : [c.key])));
    const starters = (["manager", "roommate", "professor", "decline"] as const).filter((p) => !used.has(`preset:${p}`)).map((p) => starterCounterpart(p));

    return {
      available: true,
      practices: connected.map((s) => ({ at: s.connected_at ?? s.created_at, minutes: minutesOf(s.connected_at, s.ended_at), kind: kindOf(s) })),
      recent: connected.slice(0, 6).map((s) => ({ id: s.id, at: s.connected_at ?? s.created_at, minutes: minutesOf(s.connected_at, s.ended_at), name: nameOf(s), kind: kindOf(s) })),
      tryAgain,
      starters,
      peopleCount: people.length,
      factsCount: facts.length,
      planned: planned.flatMap((plan) => {
        const person = peopleById.get(plan.person_id);
        if (!person) return [];
        return [{ id: plan.id, personName: person.name, href: `/practice?person=${encodeURIComponent(person.id)}`, plannedOn: plan.planned_on, label: plan.label, before: plan.likelihood_before, after: plan.likelihood_after, checkin: plan.checkin }];
      }),
    };
  } catch {
    return { ...empty, starters: (["manager", "roommate", "professor", "decline"] as const).map((p) => starterCounterpart(p)) };
  }
}
