import { deletedResponseSchema } from "@/lib/schemas/people";
import {
  plannedListResponseSchema, plannedResponseSchema,
  type CheckinAnswer, type Planned, type SetPlannedRequest,
} from "@/lib/schemas/planned";
import { requestJson } from "@/lib/session/api-client";

export { SessionClientError } from "@/lib/session/api-client";

export async function listPlanned(): Promise<Planned[]> { return (await requestJson("GET", "/api/planned", undefined, plannedListResponseSchema)).plans; }

// W4: the guess (fear, likelihood) leaves the browser only when `guess` is passed, i.e. the opt-in is on.
// The body is rebuilt field by field so no other private state can ride along.
export async function setPlanned(input: { personId: string; plannedOn: string; label?: string; guess?: { fear?: string; likelihoodBefore?: number } }): Promise<Planned> {
  const body: SetPlannedRequest = { personId: input.personId, plannedOn: input.plannedOn };
  if (input.label) body.label = input.label;
  if (input.guess) body.guess = { ...(input.guess.fear ? { fear: input.guess.fear } : {}), ...(input.guess.likelihoodBefore !== undefined ? { likelihoodBefore: input.guess.likelihoodBefore } : {}) };
  return (await requestJson("PUT", "/api/planned", body, plannedResponseSchema)).plan;
}

export async function checkinPlanned(id: string, answer: CheckinAnswer, note?: string, likelihoodAfter?: number): Promise<Planned> {
  const body = { answer, ...(answer === "yes" && note ? { note } : {}), ...(likelihoodAfter !== undefined ? { likelihoodAfter } : {}) };
  return (await requestJson("POST", `/api/planned/${encodeURIComponent(id)}/checkin`, body, plannedResponseSchema)).plan;
}

export async function deletePlanned(id: string): Promise<void> { await requestJson("DELETE", `/api/planned/${encodeURIComponent(id)}`, undefined, deletedResponseSchema); }
