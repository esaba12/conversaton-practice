import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/schemas/errors";
import { draftModelOutputSchema, draftResponseSchema, type DraftModelOutput, type DraftResponse, type StanceOptions } from "@/lib/schemas/draft";
import type { RoleContext } from "@/lib/schemas/role-context";
import { buildSetupUserMessage, SETUP_SYSTEM_PROMPT, type SetupInput } from "./prompt";

export const DRAFT_FORMAT_NAME = "practice_setup_draft";
const ATTEMPTS = 2;
const TIMEOUT_MS = 20_000;
// OpenAI strict mode rejects these keywords; Zod still enforces the limits after parsing.
const UNSUPPORTED = new Set(["$schema", "minLength", "maxLength"]);

type Json = Record<string, unknown>;
export function toStrictSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toStrictSchema);
  if (!node || typeof node !== "object") return node;
  const out: Json = {};
  for (const [key, value] of Object.entries(node as Json)) {
    if (UNSUPPORTED.has(key)) continue;
    if (key === "properties" && value && typeof value === "object") {
      out[key] = Object.fromEntries(Object.entries(value as Json).map(([name, child]) => [name, toStrictSchema(child)]));
    } else out[key] = toStrictSchema(value);
  }
  if (out.type === "object") {
    out.properties ??= {};
    out.required = Object.keys(out.properties as Json);
    out.additionalProperties = false;
  }
  return out;
}
export const draftJsonSchema = () => toStrictSchema(z.toJSONSchema(draftModelOutputSchema)) as Json;

function configuration() {
  const key = process.env.OPENAI_API_KEY, model = process.env.OPENAI_SETUP_MODEL;
  if (!key || !model) throw new AppError("NOT_CONFIGURED", "Setup generation is not configured yet.", 503);
  return { key, model };
}

export function setupRequestBody(input: SetupInput, model: string, stream = false) {
  return {
    model,
    store: false,
    ...(stream ? { stream: true } : {}),
    input: [{ role: "system", content: SETUP_SYSTEM_PROMPT }, { role: "user", content: buildSetupUserMessage(input) }],
    text: { format: { type: "json_schema", name: DRAFT_FORMAT_NAME, schema: draftJsonSchema(), strict: true } },
  };
}

const STOP = new Set("i me my you the a an to and of it is that they them be will do don t s not want like just about feel really".split(" "));
const words = (text: string) => text.toLowerCase().normalize("NFKC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
function ngrams(tokens: string[], size: number): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + size <= tokens.length; i++) out.add(tokens.slice(i, i + size).join(" "));
  return out;
}
function sentenceStart(text: string, index: number): boolean {
  let i = index;
  while (i > 0 && /[\s"'“”‘’(\[{]/.test(text.charAt(i - 1))) i -= 1;
  return i === 0 || /[.!?]/.test(text.charAt(i - 1));
}
// Mid-sentence capitals skip stopwords so the pronoun "I" is not treated as a name.
function distinctive(notes: string, situation: Set<string>): Set<string> {
  const found = new Set<string>();
  for (const token of words(notes)) if (/\d/.test(token) && !situation.has(token)) found.add(token);
  const source = notes.normalize("NFKC");
  for (const match of source.matchAll(/[\p{L}\p{N}]+/gu)) {
    const raw = match[0];
    if (!/^\p{Lu}/u.test(raw) || sentenceStart(source, match.index)) continue;
    const token = words(raw)[0];
    if (!token || STOP.has(token) || situation.has(token)) continue;
    found.add(token);
  }
  return found;
}
export function leaksPrivateNotes(role: RoleContext, privateNotes: string | undefined, situation: string, stanceOptions?: StanceOptions): boolean {
  const note = words(privateNotes ?? "");
  if (note.length === 0) return false;
  const size = Math.min(3, note.length);
  const situationWords = words(situation);
  const shared = ngrams(situationWords, size);
  const leaked = new Set<string>();
  for (const window of ngrams(note, size)) {
    if (window.split(" ").every((part) => STOP.has(part)) || shared.has(window)) continue;
    leaked.add(window);
  }
  const fields = [
    role.name, role.role, role.style, role.publicContext, role.opening, ...role.constraints, role.challenge, role.pace,
    role.wants, role.holdsBackBecause, role.softensWhen,
    ...(stanceOptions ? [...stanceOptions.wants, ...stanceOptions.holdsBackBecause, ...stanceOptions.softensWhen] : []),
  ].filter((field): field is string => typeof field === "string");
  const sequences = [words(fields.join(" ")), ...fields.map((field) => words(field))];
  if (sequences.some((tokens) => [...ngrams(tokens, size)].some((window) => leaked.has(window)))) return true;
  const roleTokens = new Set(sequences[0]);
  for (const token of distinctive(privateNotes ?? "", new Set(situationWords))) if (roleTokens.has(token)) return true;
  return false;
}

class Invalid extends Error {}
const rawSchema = z.object({ status: z.string().optional(), output: z.array(z.unknown()) });
const messageSchema = z.object({ type: z.literal("message"), content: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()) });
function extract(raw: unknown): DraftModelOutput {
  const parsed = rawSchema.safeParse(raw);
  if (!parsed.success || parsed.data.status === "incomplete" || parsed.data.status === "failed") throw new Invalid();
  const message = parsed.data.output.map((item) => messageSchema.safeParse(item)).find((item) => item.success)?.data;
  if (!message || message.content.some((part) => part.type === "refusal")) throw new Invalid();
  const text = message.content.find((part) => part.type === "output_text")?.text;
  if (text === undefined) throw new Invalid();
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Invalid(); }
  const output = draftModelOutputSchema.safeParse(value);
  if (!output.success) throw new Invalid();
  return output.data;
}

function checked(output: DraftModelOutput, input: SetupInput, streamSafe = false): DraftModelOutput {
  if (input.personIdentity) {
    output = {
      ...output,
      role: {
        ...output.role,
        name: input.personIdentity.name,
        role: input.personIdentity.relationship,
        style: input.personIdentity.style,
      },
    };
  }
  const { role, stanceOptions } = output;
  if (stanceOptions.wants[0] !== role.wants
    || stanceOptions.holdsBackBecause[0] !== role.holdsBackBecause
    || stanceOptions.softensWhen[0] !== role.softensWhen) throw new Invalid();
  if (!output.outOfScope && leaksPrivateNotes(role, input.privateNotes, input.situation, stanceOptions)) throw new Invalid();
  if (streamSafe && !output.outOfScope && leaksPrivateNotes(
    { ...role, constraints: [...role.constraints, output.goal, ...output.assumptions] },
    input.privateNotes,
    input.situation,
  )) throw new Invalid();
  return output;
}

async function attempt(input: SetupInput, key: string, model: string): Promise<DraftModelOutput> {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(setupRequestBody(input, model)),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch { throw new Invalid(); }
  if (!response.ok) throw new Invalid();
  const raw: unknown = await response.json().catch(() => undefined);
  return checked(extract(raw), input);
}

function responseFrom(output: DraftModelOutput, input: SetupInput): DraftResponse {
  if (output.outOfScope) throw new AppError("OUT_OF_SCOPE", "This prototype supports everyday conversations only. Try describing an ordinary scenario, like a request, disagreement, or introduction.", 422);
  return draftResponseSchema.parse({
    role: output.role,
    goal: input.goal ?? output.goal,
    assumptions: output.assumptions,
    stanceOptions: output.stanceOptions,
  });
}

export async function generateDraft(input: SetupInput): Promise<DraftResponse> {
  const { key, model } = configuration();
  for (let i = 0; i < ATTEMPTS; i++) {
    let output: DraftModelOutput;
    try { output = await attempt(input, key, model); } catch (error) { if (error instanceof Invalid) continue; throw error; }
    return responseFrom(output, input);
  }
  throw new AppError("PROVIDER_UNAVAILABLE", "The setup could not be generated. Try again or fill in the form manually.", 503, true);
}

function completedTopLevel(text: string): Map<string, unknown> {
  const result = new Map<string, unknown>();
  let index = 0;
  const whitespace = () => { while (/\s/.test(text[index] ?? "")) index += 1; };
  whitespace();
  if (text[index++] !== "{") return result;
  for (;;) {
    whitespace();
    if (text[index] !== "\"") return result;
    const keyStart = index++;
    let escaped = false;
    while (index < text.length) {
      const char = text[index++];
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") break;
    }
    if (text[index - 1] !== "\"") return result;
    let key: unknown;
    try { key = JSON.parse(text.slice(keyStart, index)); } catch { return result; }
    whitespace();
    if (text[index++] !== ":") return result;
    whitespace();
    const valueStart = index;
    let depth = 0, inString = false;
    escaped = false;
    for (; index < text.length; index++) {
      const char = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === "\"") inString = false;
        continue;
      }
      if (char === "\"") inString = true;
      else if (char === "{" || char === "[") depth += 1;
      else if ((char === "}" || char === "]") && depth > 0) depth -= 1;
      else if ((char === "," || char === "}") && depth === 0) break;
    }
    if (index >= text.length) return result;
    try { result.set(String(key), JSON.parse(text.slice(valueStart, index))); } catch { return result; }
    if (text[index] === "}") return result;
    index += 1;
  }
}

async function streamedText(response: Response, onDelta: (text: string) => void): Promise<string> {
  if (!response.body) throw new Invalid();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let wire = "", text = "";
  for (;;) {
    const { done, value } = await reader.read();
    wire += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    let boundary: number;
    while ((boundary = wire.indexOf("\n\n")) >= 0) {
      const block = wire.slice(0, boundary);
      wire = wire.slice(boundary + 2);
      for (const line of block.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let event: unknown;
        try { event = JSON.parse(data); } catch { throw new Invalid(); }
        const parsed = z.object({ type: z.string(), delta: z.string().optional() }).loose().safeParse(event);
        if (!parsed.success) throw new Invalid();
        if (parsed.data.type === "response.output_text.delta" && parsed.data.delta) {
          text += parsed.data.delta;
          onDelta(text);
        }
        if (parsed.data.type === "response.failed" || parsed.data.type === "error") throw new Invalid();
      }
    }
    if (done) break;
  }
  return text;
}

type DraftField = keyof DraftResponse;
async function streamAttempt(
  input: SetupInput,
  key: string,
  model: string,
  onField: (field: DraftField, value: unknown) => void,
): Promise<DraftModelOutput> {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(setupRequestBody(input, model, true)),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch { throw new Invalid(); }
  if (!response.ok) throw new Invalid();
  const emitted = new Set<string>();
  let partialRole: RoleContext | undefined;
  const text = await streamedText(response, current => {
    const fields = completedTopLevel(current);
    const scope = fields.get("outOfScope");
    if (scope === true) return;
    const rawRole = fields.get("role");
    if (!emitted.has("role") && rawRole !== undefined) {
      const parsed = draftModelOutputSchema.shape.role.safeParse(rawRole);
      if (!parsed.success) throw new Invalid();
      partialRole = input.personIdentity
        ? { ...parsed.data, name: input.personIdentity.name, role: input.personIdentity.relationship, style: input.personIdentity.style }
        : parsed.data;
      if (leaksPrivateNotes(partialRole, input.privateNotes, input.situation)) throw new Invalid();
      emitted.add("role");
      onField("role", partialRole);
    }
    const rawGoal = fields.get("goal");
    if (!emitted.has("goal") && rawGoal !== undefined) {
      const parsed = draftResponseSchema.shape.goal.safeParse(input.goal ?? rawGoal);
      if (!parsed.success) throw new Invalid();
      if (partialRole && leaksPrivateNotes({ ...partialRole, constraints: [...partialRole.constraints, parsed.data] }, input.privateNotes, input.situation)) throw new Invalid();
      emitted.add("goal");
      onField("goal", parsed.data);
    }
    const rawAssumptions = fields.get("assumptions");
    if (!emitted.has("assumptions") && rawAssumptions !== undefined) {
      const parsed = draftResponseSchema.shape.assumptions.safeParse(rawAssumptions);
      if (!parsed.success) throw new Invalid();
      if (partialRole && leaksPrivateNotes({ ...partialRole, constraints: [...partialRole.constraints, ...parsed.data] }, input.privateNotes, input.situation)) throw new Invalid();
      emitted.add("assumptions");
      onField("assumptions", parsed.data);
    }
    const rawStance = fields.get("stanceOptions");
    if (!emitted.has("stanceOptions") && rawStance !== undefined && partialRole) {
      const parsed = draftResponseSchema.shape.stanceOptions.safeParse(rawStance);
      if (!parsed.success
        || parsed.data.wants[0] !== partialRole.wants
        || parsed.data.holdsBackBecause[0] !== partialRole.holdsBackBecause
        || parsed.data.softensWhen[0] !== partialRole.softensWhen
        || leaksPrivateNotes(partialRole, input.privateNotes, input.situation, parsed.data)) throw new Invalid();
      emitted.add("stanceOptions");
      onField("stanceOptions", parsed.data);
    }
  });
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Invalid(); }
  const parsed = draftModelOutputSchema.safeParse(value);
  if (!parsed.success) throw new Invalid();
  return checked(parsed.data, input, true);
}

export async function generateDraftStream(input: SetupInput, onField: (field: DraftField, value: unknown) => void): Promise<DraftResponse> {
  const { key, model } = configuration();
  for (let i = 0; i < ATTEMPTS; i++) {
    let emitted = false;
    try {
      return responseFrom(await streamAttempt(input, key, model, (field, value) => {
        emitted = true;
        onField(field, value);
      }), input);
    }
    catch (error) { if (error instanceof Invalid) continue; throw error; }
    finally {
      // Once a partial field reached the client, retrying could mix two model attempts.
      if (emitted && i + 1 < ATTEMPTS) i = ATTEMPTS;
    }
  }
  throw new AppError("PROVIDER_UNAVAILABLE", "The setup could not be generated. Try again or fill in the form manually.", 503, true);
}
