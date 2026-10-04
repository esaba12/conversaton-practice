import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/schemas/errors";
import { goalCheckModelOutputSchema, type GoalCheckRequest } from "@/lib/schemas/goal-check";
import { toStrictSchema } from "@/lib/setup/generate";
import { buildGoalCheckUserMessage, GOAL_CHECK_SYSTEM_PROMPT } from "./prompt";

export const GOAL_CHECK_FORMAT_NAME = "goal_check";
// One attempt: the next finished utterance asks again, so a slow retry would only arrive late.
const TIMEOUT_MS = 8_000;

type Json = Record<string, unknown>;
export const goalCheckJsonSchema = () => toStrictSchema(z.toJSONSchema(goalCheckModelOutputSchema)) as Json;

export function goalCheckConfiguration() {
  const key = process.env.OPENAI_API_KEY, model = process.env.OPENAI_GOAL_CHECK_MODEL || process.env.OPENAI_SETUP_MODEL;
  if (!key || !model) throw new AppError("NOT_CONFIGURED", "The goal light is not configured yet.", 503);
  return { key, model };
}

export function goalCheckRequestBody(input: GoalCheckRequest, model: string) {
  return {
    model,
    store: false,
    input: [{ role: "system", content: GOAL_CHECK_SYSTEM_PROMPT }, { role: "user", content: buildGoalCheckUserMessage(input) }],
    text: { format: { type: "json_schema", name: GOAL_CHECK_FORMAT_NAME, schema: goalCheckJsonSchema(), strict: true } },
  };
}

const unavailable = () => new AppError("PROVIDER_UNAVAILABLE", "The goal light is unavailable right now.", 503, true);
const rawSchema = z.object({ status: z.string().optional(), output: z.array(z.unknown()) });
const messageSchema = z.object({ type: z.literal("message"), content: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()) });

// A refusal, an incomplete response or malformed output is never read as met.
function extract(raw: unknown): boolean {
  const parsed = rawSchema.safeParse(raw);
  if (!parsed.success || parsed.data.status === "incomplete" || parsed.data.status === "failed") throw unavailable();
  const message = parsed.data.output.map((item) => messageSchema.safeParse(item)).find((item) => item.success)?.data;
  if (!message || message.content.some((part) => part.type === "refusal")) throw unavailable();
  const text = message.content.find((part) => part.type === "output_text")?.text;
  if (text === undefined) throw unavailable();
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw unavailable(); }
  const output = goalCheckModelOutputSchema.safeParse(value);
  if (!output.success) throw unavailable();
  return output.data.met;
}

export async function checkGoal(input: GoalCheckRequest, { key, model }: { key: string; model: string }): Promise<boolean> {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(goalCheckRequestBody(input, model)),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch { throw unavailable(); }
  if (!response.ok) throw unavailable();
  return extract(await response.json().catch(() => undefined));
}
