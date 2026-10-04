import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/schemas/errors";
import { alternativeModelOutputSchema, reflectionModelOutputSchema, type AlternativeRequest, type ReflectRequest, type Reflection, type TranscriptTurn } from "@/lib/schemas/reflection";
import { toStrictSchema } from "@/lib/setup/generate";
import { ALTERNATIVE_SYSTEM_PROMPT, buildAlternativeUserMessage, buildReflectionUserMessage, reflectionSystemPrompt } from "./prompt";

export const REFLECTION_FORMAT_NAME = "practice_reflection";
export const ALTERNATIVE_FORMAT_NAME = "practice_alternative";
const ATTEMPTS = 2;
const TIMEOUT_MS = 20_000;

type Json = Record<string, unknown>;
// Rewrites Zod's nullable `anyOf: [{type: T}, {type: "null"}]` into the `type: [T, "null"]` form OpenAI documents for strict mode.
function nullableTypes(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(nullableTypes);
  if (!node || typeof node !== "object") return node;
  const out = Object.fromEntries(Object.entries(node as Json).map(([key, value]) => [key, nullableTypes(value)])) as Json;
  const branches = out.anyOf;
  if (Array.isArray(branches) && branches.length === 2) {
    const [value, empty] = branches as Json[];
    if (empty?.type === "null" && Object.keys(empty).length === 1 && typeof value?.type === "string") {
      delete out.anyOf;
      return { ...out, ...value, type: [value.type, "null"] };
    }
  }
  return out;
}
const strictJsonSchema = (schema: z.ZodType) => nullableTypes(toStrictSchema(z.toJSONSchema(schema))) as Json;
export const reflectionJsonSchema = () => strictJsonSchema(reflectionModelOutputSchema);
export const alternativeJsonSchema = () => strictJsonSchema(alternativeModelOutputSchema);

function configuration() {
  const key = process.env.OPENAI_API_KEY, model = process.env.OPENAI_REFLECTION_MODEL || process.env.OPENAI_SETUP_MODEL;
  if (!key || !model) throw new AppError("NOT_CONFIGURED", "Reflection is not configured yet.", 503);
  return { key, model };
}

type Call = { system: string; user: string; formatName: string; schema: Json };

function requestBody(call: Call, model: string) {
  return {
    model,
    store: false,
    input: [{ role: "system", content: call.system }, { role: "user", content: call.user }],
    text: { format: { type: "json_schema", name: call.formatName, schema: call.schema, strict: true } },
  };
}

export function reflectionRequestBody(input: ReflectRequest, model: string) {
  return requestBody({
    system: reflectionSystemPrompt(input.feedbackStyle),
    user: buildReflectionUserMessage(input),
    formatName: REFLECTION_FORMAT_NAME,
    schema: reflectionJsonSchema(),
  }, model);
}

export function alternativeRequestBody(input: AlternativeRequest, model: string) {
  return requestBody({
    system: ALTERNATIVE_SYSTEM_PROMPT,
    user: buildAlternativeUserMessage(input.goal),
    formatName: ALTERNATIVE_FORMAT_NAME,
    schema: alternativeJsonSchema(),
  }, model);
}

// A quoted line must be text the user actually said. Matching tolerates spacing and casing, but the
// returned line is always the exact slice of the user's own turn, never the model's wording.
export const MIN_QUOTED_CHARS = 8;

function folded(text: string): { value: string; offsets: number[] } {
  let value = "";
  const offsets: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/\s/.test(text[i])) {
      if (value && !value.endsWith(" ")) { value += " "; offsets.push(i); }
      continue;
    }
    value += text[i].toLowerCase().length === 1 ? text[i].toLowerCase() : text[i];
    offsets.push(i);
  }
  if (value.endsWith(" ")) { value = value.slice(0, -1); offsets.pop(); }
  return { value, offsets };
}

export function verifyQuotedLine(quotedLine: string | null, turns: readonly TranscriptTurn[]): string | null {
  if (!quotedLine) return null;
  const needle = folded(quotedLine).value;
  if (needle.length < MIN_QUOTED_CHARS) return null;
  for (const turn of turns) {
    if (turn.speaker !== "user") continue;
    const hay = folded(turn.text);
    const at = hay.value.indexOf(needle);
    if (at >= 0) return turn.text.slice(hay.offsets[at], hay.offsets[at + needle.length - 1] + 1);
  }
  return null;
}

// Server backstops: a support exit carries no feedback, insufficient evidence carries no
// observation, and a quote the user did not say is dropped rather than shown.
export function enforceReflectionRules(output: Reflection, turns: readonly TranscriptTurn[] = []): Reflection {
  if (output.supportExit) return { ...output, observedAction: null, quotedLine: null, takeaway: null, nextStep: null };
  const evidence = output.evidence === "insufficient" ? { ...output, observedAction: null } : output;
  return { ...evidence, quotedLine: evidence.observedAction ? verifyQuotedLine(evidence.quotedLine, turns) : null };
}

class Invalid extends Error {}
const rawSchema = z.object({ status: z.string().optional(), output: z.array(z.unknown()) });
const messageSchema = z.object({ type: z.literal("message"), content: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()) });
function extract<T>(raw: unknown, schema: z.ZodType<T>): T {
  const parsed = rawSchema.safeParse(raw);
  if (!parsed.success || parsed.data.status === "incomplete" || parsed.data.status === "failed") throw new Invalid();
  const message = parsed.data.output.map((item) => messageSchema.safeParse(item)).find((item) => item.success)?.data;
  if (!message || message.content.some((part) => part.type === "refusal")) throw new Invalid();
  const text = message.content.find((part) => part.type === "output_text")?.text;
  if (text === undefined) throw new Invalid();
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Invalid(); }
  const output = schema.safeParse(value);
  if (!output.success) throw new Invalid();
  return output.data;
}

async function attempt<T>(body: unknown, key: string, schema: z.ZodType<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch { throw new Invalid(); }
  if (!response.ok) throw new Invalid();
  return extract(await response.json().catch(() => undefined), schema);
}

const unavailable = () => new AppError("REFLECTION_UNAVAILABLE", "The reflection could not be generated. Try again.", 503, true);

async function generate<T>(body: (model: string) => unknown, schema: z.ZodType<T>, settle: (output: T) => T): Promise<T> {
  const { key, model } = configuration();
  for (let i = 0; i < ATTEMPTS; i++) {
    try { return settle(await attempt(body(model), key, schema)); } catch (error) { if (error instanceof Invalid) continue; throw error; }
  }
  throw unavailable();
}

export async function generateReflection(input: ReflectRequest): Promise<Reflection> {
  return generate((model) => reflectionRequestBody(input, model), reflectionModelOutputSchema, (output) => enforceReflectionRules(output, input.turns));
}

export async function generateAlternative(input: AlternativeRequest): Promise<{ alternative: string | null }> {
  return generate((model) => alternativeRequestBody(input, model), alternativeModelOutputSchema, (output) => output);
}
