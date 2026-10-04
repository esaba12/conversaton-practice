import "server-only";
import { createHmac } from "node:crypto";
import { decline } from "@/fixtures/decline";
import { manager } from "@/fixtures/manager";
import { professor } from "@/fixtures/professor";
import { roommate } from "@/fixtures/roommate";
import { loadPersonContext } from "@/lib/data/person-context";
import * as sessions from "@/lib/data/sessions";
import type { Db, SessionRow } from "@/lib/data/sessions";
import { assertTavusConfigured, createConversation, stopConversation, type ConversationMedia } from "@/lib/media/tavus";
import { starterMedia } from "@/lib/media/presets.server";
import { AppError } from "@/lib/schemas/errors";
import { roleContextSchema, type RoleContext, type RoleExtras } from "@/lib/schemas/role-context";
import { startResponseSchema, type EndReason, type SessionPreset, type StandInStartRequest, type StartResponse, type startRequestSchema } from "@/lib/schemas/session";
import { buildStandInContext, standInGreeting, standInMedia } from "./stand-in-context";
import type { z } from "zod";

function capability() {
  const secret = process.env.SESSION_SERVER_SECRET;
  if (!secret || secret.length < 32) throw new AppError("NOT_CONFIGURED", "Live practice is not configured yet.", 503);
  return secret;
}
const startFailed = () => new AppError("PROVIDER_UNAVAILABLE", "The call could not be started. Wait a moment before trying again.", 503, false);
const presetRoles: Record<SessionPreset, RoleContext> = { roommate, professor, decline, manager };

// Leaves cleanup pending/unresolved unless the remote call is verified ended and hard-deleted.
async function cleanUp(db: Db, secret: string, row: SessionRow) {
  if (!row.providerId || row.cleanup === "confirmed") return row;
  if (!(await stopConversation(row.providerId))) return row;
  return sessions.recordCleanup(db, secret, row.id, "confirmed").catch(() => row);
}

// Sorted object keys so equal roles always hash equally; array order stays significant.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([name, item]) => `${JSON.stringify(name)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
// Keyed so a stored fingerprint cannot confirm a guessed role. Preset/role starts omit `person`, keeping their hashes unchanged.
// A stand-in start adds its kind, so replaying one key across the two kinds is a conflict rather than a match.
export function startFingerprint(role: RoleContext, durationSeconds: 180 | 300, secret: string, person?: { extras: RoleExtras; personId: string; version: number }, kind: "practice" | "stand_in" = "practice") {
  return createHmac("sha256", secret).update(canonical({ durationSeconds, role, ...person, ...(kind === "stand_in" ? { kind } : {}) })).digest("hex");
}

export async function startSession(db: Db, input: z.output<typeof startRequestSchema>): Promise<StartResponse> {
  if ("standIn" in input) return startStandIn(db, input);
  const secret = capability();
  assertTavusConfigured();
  let role: RoleContext, extras: RoleExtras | undefined, fingerprint: string;
  let preset: SessionPreset | null = null;
  let media: ConversationMedia | undefined;
  // Preset and reviewed-role starts store no person. A saved person is copied only after person_context succeeds.
  let person: { id: string; version: number } | null = null;
  if ("personId" in input) {
    // Loaded and version-checked for the caller before any lease or provider call; the client sends only ID and version.
    const loaded = await loadPersonContext(db, input.personId, input.expectedVersion);
    ({ role, extras } = loaded);
    if ("situation" in input) {
      role = roleContextSchema.parse({
        name: role.name,
        role: role.role,
        style: role.style,
        ...input.situation,
      });
    } else if ("openingOverride" in input && input.openingOverride) {
      role = roleContextSchema.parse({ ...role, opening: input.openingOverride });
    }
    person = { id: input.personId, version: loaded.version };
    fingerprint = startFingerprint(role, input.durationSeconds, secret, { extras, personId: input.personId, version: loaded.version });
  } else {
    // Only the allowlisted role reaches the provider; a preset id is resolved here and no other client field is forwarded.
    role = roleContextSchema.parse("preset" in input ? presetRoles[input.preset] : input.role);
    if ("preset" in input) {
      preset = input.preset;
      if (input.openingOverride) role = roleContextSchema.parse({ ...role, opening: input.openingOverride });
      const starter = starterMedia(input.preset);
      if (starter) media = { palId: starter.palId, faceId: starter.faceId };
    }
    fingerprint = startFingerprint(role, input.durationSeconds, secret);
  }
  return runStart(db, secret, input.idempotencyKey, { role, durationSeconds: input.durationSeconds, extras, fingerprint, person, kind: "practice", preset, media });
}

// W10 Show me first. The stand-in plays the user: it gets the goal and hard-moment line, and
// none of the counterpart extras. A saved person's traits and shared facts are deliberately
// dropped after loading, and its reserved face and PAL come from server env only.
async function startStandIn(db: Db, input: StandInStartRequest): Promise<StartResponse> {
  const secret = capability();
  assertTavusConfigured();
  const { palId, faceId } = standInMedia();
  let role: RoleContext;
  let preset: SessionPreset | null = null;
  let person: { id: string; version: number } | null = null;
  if ("personId" in input) {
    const loaded = await loadPersonContext(db, input.personId, input.expectedVersion);
    role = input.situation
      ? roleContextSchema.parse({ name: loaded.role.name, role: loaded.role.role, style: loaded.role.style, ...input.situation })
      : loaded.role;
    person = { id: input.personId, version: loaded.version };
  } else if ("preset" in input) {
    preset = input.preset;
    role = roleContextSchema.parse(presetRoles[input.preset]);
  } else {
    role = roleContextSchema.parse(input.role);
  }
  const context = buildStandInContext({
    counterpart: { name: role.name, role: role.role, situation: role.publicContext },
    goal: input.goal,
    ...(input.hardMomentLine ? { hardMomentLine: input.hardMomentLine } : {}),
  });
  // The goal is not fingerprinted: a replayed key is already an error path, and the stored
  // fingerprint should carry nothing derived from the user's private line.
  const fingerprint = startFingerprint(role, 180, secret, person ? { extras: {}, personId: person.id, version: person.version } : undefined, "stand_in");
  return runStart(db, secret, input.idempotencyKey, {
    role, durationSeconds: 180, fingerprint, person, kind: "stand_in", preset,
    media: { palId, faceId, context, greeting: standInGreeting(role.name) },
  });
}

type StartPlan = {
  role: RoleContext;
  durationSeconds: 180 | 300;
  extras?: RoleExtras;
  fingerprint: string;
  person: { id: string; version: number } | null;
  kind: "practice" | "stand_in";
  preset: SessionPreset | null;
  media?: ConversationMedia;
};

// The lease, the provider call and their cleanup, shared by every start branch.
async function runStart(db: Db, secret: string, idempotencyKey: string, plan: StartPlan): Promise<StartResponse> {
  const { role, durationSeconds, extras, fingerprint, person, kind, preset, media } = plan;
  let acquired: Awaited<ReturnType<typeof sessions.acquire>>;
  try {
    acquired = await sessions.acquire(db, secret, idempotencyKey, fingerprint, durationSeconds, person, { kind, preset });
  }
  catch (error) {
    if (error instanceof AppError && error.code === "SESSION_ACTIVE") error.sessionId = await sessions.activeSessionId(db);
    throw error;
  }
  const { id } = acquired.row;
  // Only a fresh lease may create a provider call; replays never start a second one.
  if (!acquired.created) throw new AppError("SESSION_ACTIVE", "This start request was already handled. End that session to start another.", 409, false, id);
  let created: Awaited<ReturnType<typeof createConversation>>;
  try { created = await createConversation(role, durationSeconds, extras, media); }
  catch {
    // Without a provider ID the database records cleanup as unresolved, which is truthful after a timeout.
    await sessions.end(db, secret, id, "connection_failure").catch(() => undefined);
    throw startFailed();
  }
  let bound: SessionRow;
  try { bound = await sessions.bind(db, secret, id, created.providerId); }
  catch {
    await sessions.end(db, secret, id, "connection_failure").catch(() => undefined);
    await stopConversation(created.providerId);
    throw startFailed();
  }
  if (sessions.isTerminal(bound.status) || Date.parse(bound.expiresAt) <= Date.now()) {
    const ended = sessions.isTerminal(bound.status) ? bound : await sessions.end(db, secret, id, "time_limit").catch(() => bound);
    await cleanUp(db, secret, ended);
    throw new AppError("SESSION_EXPIRED", "This practice ended before the call was ready.", 409);
  }
  return startResponseSchema.parse({ session: sessions.publicSession(bound), credential: created.credential });
}

export async function connectSession(db: Db, id: string) {
  return { session: sessions.publicSession(await sessions.connected(db, capability(), id)) };
}

// Commits the terminal state first; repeated calls retry remote cleanup for a bound provider ID.
export async function endSession(db: Db, id: string, reason: EndReason) {
  const secret = capability();
  const row = await sessions.end(db, secret, id, reason);
  return { session: sessions.publicSession(await cleanUp(db, secret, row)) };
}
