import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/schemas/errors";
import { reflectionModelOutputSchema, type ReflectRequest, type Reflection } from "@/lib/schemas/reflection";
import { toStrictSchema } from "@/lib/setup/generate";
import { buildReflectionUserMessage, REFLECTION_SYSTEM_PROMPT } from "./prompt";

export const REFLECTION_FORMAT_NAME = "practice_reflection";
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
export const reflectionJsonSchema = () => nullableTypes(toStrictSchema(z.toJSONSchema(reflectionModelOutputSchema))) as Json;

function configuration() {
  const key = process.env.OPENAI_API_KEY, model = process.env.OPENAI_REFLECTION_MODEL || process.env.OPENAI_SETUP_MODEL;
  if (!key || !model) throw new AppError("NOT_CONFIGURED", "Reflection is not configured yet.", 503);
  return { key, model };
}

export function reflectionRequestBody(input: ReflectRequest, model: string) {
  return {
    model,
    store: false,
    input: [{ role: "system", content: REFLECTION_SYSTEM_PROMPT }, { role: "user", content: buildReflectionUserMessage(input) }],
    text: { format: { type: "json_schema", name: REFLECTION_FORMAT_NAME, schema: reflectionJsonSchema(), strict: true } },
  };
}

// Server backstops: a support exit carries no feedback, and insufficient evidence carries no observation.
export function enforceReflectionRules(output: Reflection): Reflection {
  if (output.supportExit) return { ...output, observedAction: null, takeaway: null, nextStep: null };
  if (output.evidence === "insufficient") return { ...output, observedAction: null };
  return output;
}

class Invalid extends Error {}
const rawSchema = z.object({ status: z.string().optional(), output: z.array(z.unknown()) });
const messageSchema = z.object({ type: z.literal("message"), content: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()) });
function extract(raw: unknown): Reflection {
  const parsed = rawSchema.safeParse(raw);
  if (!parsed.success || parsed.data.status === "incomplete" || parsed.data.status === "failed") throw new Invalid();
  const message = parsed.data.output.map((item) => messageSchema.safeParse(item)).find((item) => item.success)?.data;
  if (!message || message.content.some((part) => part.type === "refusal")) throw new Invalid();
  const text = message.content.find((part) => part.type === "output_text")?.text;
  if (text === undefined) throw new Invalid();
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Invalid(); }
  const output = reflectionModelOutputSchema.safeParse(value);
  if (!output.success) throw new Invalid();
  return output.data;
}

async function attempt(input: ReflectRequest, key: string, model: string): Promise<Reflection> {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(reflectionRequestBody(input, model)),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch { throw new Invalid(); }
  if (!response.ok) throw new Invalid();
  return extract(await response.json().catch(() => undefined));
}

export async function generateReflection(input: ReflectRequest): Promise<Reflection> {
  const { key, model } = configuration();
  for (let i = 0; i < ATTEMPTS; i++) {
    try { return enforceReflectionRules(await attempt(input, key, model)); } catch (error) { if (error instanceof Invalid) continue; throw error; }
  }
  throw new AppError("REFLECTION_UNAVAILABLE", "The reflection could not be generated. Try again.", 503, true);
}
