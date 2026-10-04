import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/schemas/errors";
import { buildTextRoleContext, roleContextSchema, roleExtrasSchema, type RoleContext, type RoleExtras } from "@/lib/schemas/role-context";

const replySchema = z.string().trim().min(1).max(600);
const rawSchema = z.object({ status: z.string().optional(), output: z.array(z.unknown()) });
const messageSchema = z.object({ type: z.literal("message"), content: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()) });

function modelId() {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_SETUP_MODEL;
  if (!key || !model) throw new AppError("NOT_CONFIGURED", "Text practice is not configured yet.", 503);
  return { key, model };
}

function readText(raw: unknown): string {
  const parsed = rawSchema.safeParse(raw);
  if (!parsed.success || parsed.data.status === "incomplete" || parsed.data.status === "failed") throw new Error("invalid");
  const message = parsed.data.output.map((item) => messageSchema.safeParse(item)).find((item) => item.success)?.data;
  if (!message || message.content.some((part) => part.type === "refusal")) throw new Error("invalid");
  const text = message.content.find((part) => part.type === "output_text")?.text;
  const reply = replySchema.safeParse(text);
  if (!reply.success) throw new Error("invalid");
  return reply.data;
}

export async function replyAsCounterpart(role: RoleContext, extras: RoleExtras, turns: { speaker: "user" | "counterpart"; text: string }[]): Promise<string> {
  const { key, model } = modelId();
  const system = buildTextRoleContext(roleContextSchema.parse(role), roleExtrasSchema.parse(extras));
  const transcript = turns.map((turn) => `${turn.speaker === "user" ? "Them" : "You"}: ${turn.text}`).join("\n");
  const body = {
    model,
    store: false,
    input: [
      { role: "system", content: system },
      { role: "user", content: `The texts so far:\n${transcript}\n\nReply with the next text only.` },
    ],
  };
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    }).catch(() => null);
    if (!response?.ok) continue;
    last = await response.json().catch(() => undefined);
    try { return readText(last); } catch { /* one retry */ }
  }
  throw new AppError("PROVIDER_UNAVAILABLE", "The reply could not be sent. Try again shortly.", 503, true);
}
