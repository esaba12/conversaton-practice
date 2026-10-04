import "server-only";
import { createHmac } from "node:crypto";
import { decline } from "@/fixtures/decline";
import { manager } from "@/fixtures/manager";
import { professor } from "@/fixtures/professor";
import { roommate } from "@/fixtures/roommate";
import { loadPersonContext } from "@/lib/data/person-context";
import type { Db } from "@/lib/data/sessions";
import { AppError } from "@/lib/schemas/errors";
import { personToRole } from "@/lib/schemas/people";
import { roleContextSchema, roleExtrasSchema, type RoleContext, type RoleExtras } from "@/lib/schemas/role-context";
import { sessionSchema, type SessionPreset, type StartRequest } from "@/lib/schemas/session";
import { situationSchema } from "@/lib/schemas/situation";
import { assertPhotonConfigured, sendImessage } from "./photon";
import { acquireText, linkedPhone, markTextActive, readOpening, saveTextState, textSecret } from "./store";

const presets: Record<SessionPreset, RoleContext> = { roommate, professor, decline, manager };

function fingerprint(role: RoleContext, extras: RoleExtras, person?: { id: string; version: number }, preset?: SessionPreset) {
  return createHmac("sha256", textSecret()).update(JSON.stringify({ channel: "text", role, extras, person, preset })).digest("hex");
}

function asSession(row: { id: string; status: string; expires_at: string; cleanup: string }) {
  return sessionSchema.parse({
    id: row.id,
    status: row.status,
    expiresAt: new Date(row.expires_at).toISOString(),
    cleanup: row.cleanup,
  });
}

export async function resolveTextRole(db: Db, input: StartRequest): Promise<{ role: RoleContext; extras: RoleExtras; person: { id: string; version: number } | null; preset: SessionPreset | null }> {
  if ("standIn" in input) throw new AppError("VALIDATION_ERROR", "A stand-in practice is a call.", 400);
  if ("personId" in input) {
    const loaded = await loadPersonContext(db, input.personId, input.expectedVersion);
    const role = "situation" in input
      ? roleContextSchema.parse({ name: loaded.role.name, role: loaded.role.role, style: loaded.role.style, ...input.situation })
      : loaded.role;
    return { role, extras: loaded.extras, person: { id: input.personId, version: loaded.version }, preset: null };
  }
  if ("preset" in input) return { role: roleContextSchema.parse(presets[input.preset]), extras: {}, person: null, preset: input.preset };
  return { role: roleContextSchema.parse(input.role), extras: {}, person: null, preset: null };
}

async function deliverOpening(db: Db, id: string, phone: string, opening: string) {
  await sendImessage(phone, opening);
  await markTextActive(db, id);
}

export async function startTextSession(db: Db, input: StartRequest) {
  assertPhotonConfigured();
  const resolved = await resolveTextRole(db, input);
  const phone = await linkedPhone(db);
  const acquired = await acquireText(db, input.idempotencyKey, fingerprint(resolved.role, resolved.extras, resolved.person ?? undefined, resolved.preset ?? undefined), resolved.person, resolved.preset);
  if (!acquired.created) {
    if (acquired.session.status === "ended" || acquired.session.status === "interrupted" || acquired.session.status === "deleted") {
      throw new AppError("SESSION_ACTIVE", "This start request was already handled. End that session to start another.", 409, false, acquired.session.id);
    }
    return { session: asSession(acquired.session) };
  }
  await saveTextState(db, acquired.session.id, resolved.role, resolved.extras, resolved.role.opening);
  try { await deliverOpening(db, acquired.session.id, phone, resolved.role.opening); }
  catch { return { session: asSession({ ...acquired.session, status: "connecting" }) }; }
  return { session: asSession({ ...acquired.session, status: "active" }) };
}

export async function retryTextOpening(db: Db, id: string) {
  assertPhotonConfigured();
  const opening = await readOpening(db, id);
  await deliverOpening(db, id, await linkedPhone(db), opening);
  return { session: sessionSchema.parse({ id, status: "active", expiresAt: new Date(Date.now() + 600_000).toISOString(), cleanup: "not_started" }) };
}

export function roleFromPick(person: {
  name: string; relationship: string; traits?: RoleExtras["traits"]; style: string; public_context: string; opening: string;
  constraints: string[]; challenge: RoleContext["challenge"]; pace: RoleContext["pace"]; background: string;
}, known: string[], situation: unknown) {
  const base = personToRole({
    name: person.name, relationship: person.relationship, traits: person.traits ?? {}, style: person.style,
    publicContext: person.public_context, opening: person.opening, constraints: person.constraints,
    challenge: person.challenge, pace: person.pace, background: person.background,
  });
  const role = situation ? roleContextSchema.parse({ name: base.name, role: base.role, style: base.style, ...situationSchema.parse(situation) }) : base;
  const extras = roleExtrasSchema.parse({ background: person.background, traits: person.traits ?? {}, knownAboutUser: known });
  return { role, extras };
}
