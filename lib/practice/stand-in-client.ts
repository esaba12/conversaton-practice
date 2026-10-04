import { requestJson } from "@/lib/session/api-client";
import type { Person } from "@/lib/schemas/people";
import { standInStartSchema, startResponseSchema, type SessionPreset, type Situation, type StandInStartRequest, type StartResponse } from "@/lib/schemas/session";
import type { RoleContext } from "@/lib/schemas/role-context";
import { practiceHistoryResponseSchema } from "@/lib/schemas/people";

// W10 "Show me first". This is the only client module that may put the goal or the hard-moment
// line in a request body, and only on this one start branch. Everything in lib/session/api-client.ts
// stays as it is: a normal, preset, saved-person or retry start still carries neither.
//
// The user's fear, likelihood numbers, private prep and notes-to-self never leave the browser here.

export const STAND_IN_DURATION_SECONDS = 180 as const;

// Who the user will be playing. Resolved server-side exactly as a normal start resolves it.
export type StandInTarget =
  | { kind: "role"; role: RoleContext }
  | { kind: "preset"; preset: SessionPreset }
  | { kind: "person"; person: Pick<Person, "id" | "version">; situation?: Situation };

export type StandInStartInput = {
  target: StandInTarget;
  /** The user's own line. Sent to the stand-in only; the counterpart never receives it. */
  goal: string;
  /** docs/30: the line the user plans for the hard moment. Optional. */
  hardMomentLine?: string;
  idempotencyKey?: string;
};

// Built field by field so no caller object can widen the body.
export function standInStartBody({ target, goal, hardMomentLine, idempotencyKey = crypto.randomUUID() }: StandInStartInput): StandInStartRequest {
  const base = {
    idempotencyKey,
    standIn: true as const,
    goal: goal.trim(),
    ...(hardMomentLine?.trim() ? { hardMomentLine: hardMomentLine.trim() } : {}),
    durationSeconds: STAND_IN_DURATION_SECONDS,
  };
  const body = target.kind === "role"
    ? { ...base, role: target.role }
    : target.kind === "preset"
      ? { ...base, preset: target.preset }
      : { ...base, personId: target.person.id, expectedVersion: target.person.version, ...(target.situation ? { situation: target.situation } : {}) };
  // The frozen union is the boundary: an unexpected field fails here, in the browser.
  return standInStartSchema.parse(body);
}

export function startStandInSession(input: StandInStartInput): Promise<StartResponse> {
  return requestJson("POST", "/api/sessions", standInStartBody(input), startResponseSchema);
}

// Which starters this owner has already practiced with (W10 button order). Metadata only.
export async function fetchPracticedPresets(): Promise<SessionPreset[]> {
  return (await requestJson("GET", "/api/practice-history", undefined, practiceHistoryResponseSchema)).practicedPresets;
}
