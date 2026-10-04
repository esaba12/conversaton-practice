// W11 / U1 client: POST /api/scenarios/draft with `Accept: text/event-stream`. The server sends a
// `field` event per completed top-level field, then exactly one validated `done`, or one `error`
// (errorSchema shape) and no `done`. Only `done` is ever used as the role; streamed fields are for
// display. The body is built field by field from the draft request, so nothing in browser private
// state (hard-moment line, fear, likelihoods) can reach it.

import { z } from "zod";
import { draftRequestSchema, draftResponseSchema, stanceOptionsSchema, type DraftRequest, type DraftResponse, type StanceOptions } from "@/lib/schemas/draft";
import { errorSchema } from "@/lib/schemas/errors";
import { roleContextSchema, type RoleContext } from "@/lib/schemas/role-context";
import { SessionClientError } from "@/lib/session/api-client";

export type StreamedField =
  | { field: "role"; value: RoleContext }
  | { field: "goal"; value: string }
  | { field: "assumptions"; value: string[] }
  | { field: "stanceOptions"; value: StanceOptions };

const streamedFieldSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("role"), value: roleContextSchema }),
  z.object({ field: z.literal("goal"), value: draftResponseSchema.shape.goal }),
  z.object({ field: z.literal("assumptions"), value: draftResponseSchema.shape.assumptions }),
  z.object({ field: z.literal("stanceOptions"), value: stanceOptionsSchema }),
]);

const streamedFieldNames = new Set(["role", "goal", "assumptions", "stanceOptions"]);
function fieldName(json: unknown): string {
  return typeof json === "object" && json !== null && "field" in json ? String((json as { field: unknown }).field) : "";
}

export type SseEvent = { event: string; data: string };

/** Splits complete server-sent events off `buffer`; `rest` is the unfinished tail. */
export function parseSse(buffer: string): { events: SseEvent[]; rest: string } {
  const normalized = buffer.replace(/\r\n?/g, "\n");
  const blocks = normalized.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: SseEvent[] = [];
  for (const block of blocks) {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (!line || line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const key = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (key === "event") event = value;
      else if (key === "data") data.push(value);
    }
    if (data.length) events.push({ event, data: data.join("\n") });
  }
  return { events, rest };
}

const malformed = () => new SessionClientError("MALFORMED_RESPONSE", "The server returned an unexpected response.", null, true);

/** The exact draft body: only these four fields, validated. */
export function draftStreamBody(input: DraftRequest): DraftRequest {
  const body: DraftRequest = { situation: input.situation };
  if (input.goal !== undefined) body.goal = input.goal;
  if (input.privateNotes !== undefined) body.privateNotes = input.privateNotes;
  if (input.personId !== undefined) body.personId = input.personId;
  const parsed = draftRequestSchema.safeParse(body);
  if (!parsed.success) throw new SessionClientError("VALIDATION_ERROR", "Check the situation and try again.", null, false);
  return parsed.data;
}

export async function streamDraft(input: DraftRequest, onField: (field: StreamedField) => void, options: { signal?: AbortSignal } = {}): Promise<DraftResponse> {
  const body = draftStreamBody(input);
  let response: Response;
  try {
    response = await fetch("/api/scenarios/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new SessionClientError("NETWORK", "The server could not be reached.", null, true);
  }

  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.includes("text/event-stream")) {
    let json: unknown;
    try { json = await response.json(); } catch { json = undefined; }
    if (!response.ok) {
      const error = errorSchema.safeParse(json);
      if (error.success) throw new SessionClientError(error.data.code, error.data.message, response.status, error.data.retryable);
      throw new SessionClientError("MALFORMED_RESPONSE", "The server returned an unexpected response.", response.status, response.status >= 500);
    }
    // A server without streaming answers with the plain JSON draft.
    const draft = draftResponseSchema.safeParse(json);
    if (!draft.success) throw malformed();
    return draft.data;
  }

  const reader = response.body?.getReader();
  if (!reader) throw malformed();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const { events, rest } = parseSse(done ? `${buffer}\n\n` : buffer);
      buffer = rest;
      for (const { event, data } of events) {
        let json: unknown;
        try { json = JSON.parse(data); } catch { throw malformed(); }
        if (event === "field") {
          const field = streamedFieldSchema.safeParse(json);
          // An unknown field name is skipped; a known one that fails validation is a broken stream.
          if (field.success) onField(field.data as StreamedField);
          else if (streamedFieldNames.has(fieldName(json))) throw malformed();
        } else if (event === "done") {
          const draft = draftResponseSchema.safeParse(json);
          if (!draft.success) throw malformed();
          return draft.data;
        } else if (event === "error") {
          const error = errorSchema.safeParse(json);
          if (!error.success) throw malformed();
          throw new SessionClientError(error.data.code, error.data.message, response.status, error.data.retryable);
        }
      }
      if (done) break;
    }
  } finally {
    void reader.cancel().catch(() => undefined);
  }
  throw malformed();
}

// What the Meet card shows while the draft streams (U1). The goal is not kept here: it is the
// user's private reflection metadata and goes to lib/practice/private-state.ts on `done`.
export type DraftProgress =
  | { step: "idle" }
  | { step: "reading" }
  | { step: "shaping"; role?: RoleContext; stanceOptions?: StanceOptions }
  | { step: "ready"; draft: DraftResponse }
  | { step: "error"; message: string; code: string; retryable: boolean };

export type DraftProgressEvent =
  | { type: "sent" }
  | { type: "field"; field: StreamedField }
  | { type: "done"; draft: DraftResponse }
  | { type: "failed"; message: string; code: string; retryable: boolean }
  | { type: "reset" };

export const idleDraftProgress: DraftProgress = { step: "idle" };

export function reduceDraftProgress(state: DraftProgress, event: DraftProgressEvent): DraftProgress {
  switch (event.type) {
    case "reset": return idleDraftProgress;
    case "sent": return { step: "reading" };
    case "done": return state.step === "reading" || state.step === "shaping" ? { step: "ready", draft: event.draft } : state;
    case "failed": return state.step === "reading" || state.step === "shaping" ? { step: "error", message: event.message, code: event.code, retryable: event.retryable } : state;
    case "field": {
      if (state.step !== "reading" && state.step !== "shaping") return state;
      const current = state.step === "shaping" ? state : {};
      const { field } = event;
      if (field.field === "role") return { step: "shaping", ...current, role: field.value };
      if (field.field === "stanceOptions") return { step: "shaping", ...current, stanceOptions: field.value };
      // goal and assumptions are not shown on the card; they still mark that the model is writing.
      return { step: "shaping", ...current };
    }
  }
}
