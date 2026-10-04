import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { decline } from "@/fixtures/decline";
import { manager } from "@/fixtures/manager";
import { professor } from "@/fixtures/professor";
import { roommate } from "@/fixtures/roommate";
import { AppError } from "@/lib/schemas/errors";
import { roleContextSchema, traitChipsSchema, type RoleContext, type RoleExtras } from "@/lib/schemas/role-context";
import { situationSchema } from "@/lib/schemas/situation";
import { CLOSING_LINE, isEndCommand, isLinkCode, isSupportExit, LINKED_LINE, PHONE_TAKEN_LINE, SUPPORT_EXIT_LINE, TEXT_ONLY_LINE, UNLINKED_LINE, VIDEO_BUSY_LINE } from "./commands";
import { normalizePhone } from "./phone";
import { sendImessage } from "./photon";
import { replyAsCounterpart } from "./reply";
import { roleFromPick } from "./start";
import { activatePick, digest, endInbound, inbound, newToken, pickCatalog, pickCommit, pickPerson, recordReply, savePickToken, textSecret, turnCount } from "./store";
import { verifyPhotonWebhook } from "./verify";

const payloadSchema = z.object({
  event: z.string(),
  space: z.object({ id: z.string(), type: z.string().optional() }).loose(),
  message: z.object({
    id: z.string(),
    direction: z.string().optional(),
    sender: z.object({ id: z.string() }).optional(),
    content: z.object({ type: z.string(), text: z.string().optional() }).loose(),
  }).loose(),
}).loose();

const presets = { roommate, professor, decline, manager } as const;

function origin() {
  return process.env.PHOTON_PUBLIC_ORIGIN?.replace(/\/$/, "") ?? "";
}

async function sendCard(phone: string, spaceId: string) {
  const token = newToken();
  await savePickToken(digest(token), phone, spaceId);
  const base = origin();
  if (!base) {
    await sendImessage(phone, "Text practice is unlocked. Start it from the website.");
    return;
  }
  await sendImessage(phone, "Pick who you're practicing with.");
  await sendImessage(phone, { cardUrl: `${base}/text/pick?token=${encodeURIComponent(token)}` });
}

async function answerTurn(sessionId: string, role: RoleContext, extras: RoleExtras, turns: { speaker: "user" | "counterpart"; text: string }[], phone: string, userTurns: number, finalTurn: boolean) {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  if (await turnCount(sessionId) !== userTurns) return;
  const latest = turns.filter((turn) => turn.speaker === "user").at(-1)?.text ?? "";
  if (isSupportExit(latest)) {
    await sendImessage(phone, SUPPORT_EXIT_LINE);
    await recordReply(sessionId, SUPPORT_EXIT_LINE);
    await endInbound(sessionId, "user");
    return;
  }
  const reply = await replyAsCounterpart(role, extras, turns);
  const body = finalTurn ? `${reply}\n${CLOSING_LINE}` : reply;
  await sendImessage(phone, body);
  await recordReply(sessionId, body.slice(0, 600));
  if (finalTurn) await endInbound(sessionId, "time_limit");
}

export async function handlePhotonWebhook(rawBody: string, headers: Headers): Promise<Response> {
  const secret = process.env.SPECTRUM_WEBHOOK_SECRET;
  const signature = headers.get("x-spectrum-signature") ?? "";
  const timestamp = headers.get("x-spectrum-timestamp") ?? "";
  if (!secret || !verifyPhotonWebhook(rawBody, secret, signature, timestamp)) return new Response("unauthorized", { status: 401 });
  let payload: z.infer<typeof payloadSchema>;
  try { payload = payloadSchema.parse(JSON.parse(rawBody)); } catch { return new Response("ok"); }
  if (payload.event !== "messages") return new Response("ok");
  if (payload.message.direction && payload.message.direction !== "inbound") return new Response("ok");
  if (payload.space.type && payload.space.type !== "dm") return new Response("ok");
  const phone = normalizePhone(payload.message.sender?.id ?? "");
  if (!phone) return new Response("ok");
  const text = payload.message.content.type === "text" ? (payload.message.content.text ?? "").trim() : "";
  const kind = payload.message.content.type !== "text" ? "other" : isEndCommand(text) ? "end" : isLinkCode(text) ? "code" : "text";
  let decision: Awaited<ReturnType<typeof inbound>>;
  try { decision = await inbound(payload.message.id, phone, payload.space.id, text, kind, kind === "code" ? digest(text) : null); }
  catch { return new Response("ok", { status: 200 }); }
  try {
    if (decision.action === "linked") await sendImessage(phone, LINKED_LINE);
    else if (decision.action === "phone_taken") await sendImessage(phone, PHONE_TAKEN_LINE);
    else if (decision.action === "unlinked") await sendImessage(phone, UNLINKED_LINE);
    else if (decision.action === "video_busy") await sendImessage(phone, VIDEO_BUSY_LINE);
    else if (decision.action === "card") await sendCard(phone, payload.space.id);
    else if (decision.action === "attachment" && decision.session_id) await sendImessage(phone, TEXT_ONLY_LINE);
    else if (decision.action === "end" && decision.session_id) {
      await sendImessage(phone, CLOSING_LINE);
      await endInbound(decision.session_id, "user");
    } else if (decision.action === "capped" && decision.session_id) {
      await sendImessage(phone, CLOSING_LINE);
      await endInbound(decision.session_id, "time_limit");
    } else if ((decision.action === "turn" || decision.action === "final") && decision.session_id && decision.role && decision.turns && decision.user_turns) {
      await answerTurn(decision.session_id, decision.role, decision.extras ?? {}, decision.turns, phone, decision.user_turns, decision.action === "final");
    }
  } catch {
    return new Response("ok");
  }
  return new Response("ok");
}

const pickBody = z.union([
  z.object({ token: z.string().min(20), personId: z.uuid(), expectedVersion: z.number().int().min(1), situationId: z.uuid().optional() }).strict(),
  z.object({ token: z.string().min(20), preset: z.enum(["roommate", "professor", "decline", "manager"]) }).strict(),
]);

const loadedPerson = z.object({
  person: z.object({
    name: z.string(), relationship: z.string(), traits: traitChipsSchema.optional(), style: z.string(),
    public_context: z.string(), opening: z.string(), constraints: z.array(z.string()),
    challenge: z.enum(["supportive", "neutral", "mild_pushback"]),
    pace: z.enum(["patient", "conversational"]), background: z.string(),
  }),
  known: z.array(z.string()),
  situation: z.unknown().nullable(),
  phone: z.string(),
});

export async function catalogForToken(token: string) {
  return pickCatalog(digest(token));
}

async function openPractice(phone: string, sessionId: string, opening: string) {
  await sendImessage(phone, opening);
  await activatePick(sessionId);
}

export async function startFromPick(raw: unknown) {
  const input = pickBody.safeParse(raw);
  if (!input.success) throw new AppError("VALIDATION_ERROR", "The request was not valid.", 400);
  const tokenHash = digest(input.data.token);
  if ("preset" in input.data) {
    const role = roleContextSchema.parse(presets[input.data.preset]);
    const fingerprint = createHmac("sha256", textSecret()).update(JSON.stringify({ channel: "text", preset: input.data.preset })).digest("hex");
    const started = await pickCommit({ tokenHash, person: null, preset: input.data.preset, role, extras: {}, opening: role.opening, fingerprint });
    await openPractice(started.phone, started.sessionId, role.opening);
    return { started: true as const };
  }
  const loaded = loadedPerson.parse(await pickPerson(tokenHash, input.data.personId, input.data.expectedVersion, input.data.situationId ?? null));
  const situation = loaded.situation === null ? undefined : situationSchema.parse(loaded.situation);
  const { role, extras } = roleFromPick(loaded.person, loaded.known, situation);
  const fingerprint = createHmac("sha256", textSecret()).update(JSON.stringify({ channel: "text", person: input.data.personId, version: input.data.expectedVersion, situation: input.data.situationId ?? null })).digest("hex");
  const started = await pickCommit({
    tokenHash, person: { id: input.data.personId, version: input.data.expectedVersion }, preset: null,
    role, extras, opening: role.opening, fingerprint,
  });
  await openPractice(started.phone, started.sessionId, role.opening);
  return { started: true as const };
}
