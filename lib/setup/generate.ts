import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/schemas/errors";
import { draftModelOutputSchema, draftResponseSchema, type DraftModelOutput, type DraftRequest, type DraftResponse } from "@/lib/schemas/draft";
import type { RoleContext } from "@/lib/schemas/role-context";
import { buildSetupUserMessage, SETUP_SYSTEM_PROMPT } from "./prompt";

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

export function setupRequestBody(input: DraftRequest, model: string) {
  return {
    model,
    store: false,
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
export function leaksPrivateNotes(role: RoleContext, privateNotes: string | undefined, situation: string): boolean {
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
  const fields = [role.name, role.role, role.style, role.publicContext, role.opening, ...role.constraints];
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

async function attempt(input: DraftRequest, key: string, model: string): Promise<DraftModelOutput> {
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
  const output = extract(raw);
  if (!output.outOfScope && leaksPrivateNotes(output.role, input.privateNotes, input.situation)) throw new Invalid();
  return output;
}

export async function generateDraft(input: DraftRequest): Promise<DraftResponse> {
  const { key, model } = configuration();
  for (let i = 0; i < ATTEMPTS; i++) {
    let output: DraftModelOutput;
    try { output = await attempt(input, key, model); } catch (error) { if (error instanceof Invalid) continue; throw error; }
    if (output.outOfScope) throw new AppError("OUT_OF_SCOPE", "This prototype supports everyday conversations only. Try describing an ordinary scenario, like a request, disagreement, or introduction.", 422);
    return draftResponseSchema.parse({ role: output.role, goal: input.goal ?? output.goal, assumptions: output.assumptions });
  }
  throw new AppError("PROVIDER_UNAVAILABLE", "The setup could not be generated. Try again or fill in the form manually.", 503, true);
}
