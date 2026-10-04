// U2 knowledge panel (docs/next/05-UI-UPGRADE.md): what the counterpart is given, and what it
// never sees. "Knows" is derived from the same role the start body is built from, by field name;
// "Never sees" lists only private fields the user actually filled.

import { examples } from "@/fixtures/examples";
import { personTraits } from "@/components/practice/lobby";
import type { PrivateState } from "@/lib/practice/private-state";
import type { Person } from "@/lib/schemas/people";
import { roleContextSchema, type RoleContext } from "@/lib/schemas/role-context";
import type { SessionPreset, Situation } from "@/lib/schemas/situation";

export const challengeLabel: Record<RoleContext["challenge"], string> = {
  supportive: "Takes it well",
  neutral: "Hard to read",
  mild_pushback: "Pushes back a little",
};

export const paceLabel: Record<RoleContext["pace"], string> = {
  patient: "Patient, gives you time",
  conversational: "Conversational",
};

/** T1: on the Meet card and in the green room. */
export function toneNotice(name: string): string {
  return `${name} can hear your tone of voice (for example, if you sound unsure) and may react to it. Nothing about your tone is saved.`;
}

/** D2: in the green room. */
export const reflectionDisclosure = "After the call, what was said is sent once to make your reflection. It isn’t stored.";

export type KnowsField = keyof RoleContext | "background" | "traits" | "knownAboutUser";

export const knowsLabel: Record<KnowsField, string> = {
  name: "Their name",
  role: "Who they are to you",
  style: "How they talk",
  background: "Background",
  publicContext: "The situation",
  opening: "Their opening line",
  constraints: "Ground rules",
  challenge: "How they react",
  pace: "Pace",
  wants: "Wants",
  holdsBackBecause: "Holds back because",
  softensWhen: "Softens when",
  traits: "Speaking style",
  knownAboutUser: "What you told them",
};

/**
 * Where an item reaches the counterpart from. "body": the field is in the start request body.
 * "server": the server loads it by id (a starter fixture, or a saved person's identity and shared facts).
 */
export type KnowsSource = "body" | "server";
export type KnowsItem = { field: KnowsField; label: string; source: KnowsSource; text?: string; chips?: readonly string[] };

/** What the start request will carry for this Meet card. */
export type MeetStart =
  | { kind: "role" }
  | { kind: "preset"; preset: SessionPreset }
  | { kind: "person"; person: Person; sharedFacts: readonly string[]; situation: "default" | "custom" };

const situationKeys = ["publicContext", "opening", "constraints", "challenge", "pace", "wants", "holdsBackBecause", "softensWhen"] as const;

/** A saved person's custom situation: the scenario and stance fields of the reviewed role, nothing else. */
export function situationFromRole(role: RoleContext): Situation {
  const situation: Record<string, unknown> = {};
  for (const key of situationKeys) if (role[key] !== undefined) situation[key] = role[key];
  return situation as Situation;
}

function item(field: KnowsField, role: RoleContext, source: KnowsSource): KnowsItem | null {
  const label = knowsLabel[field];
  switch (field) {
    case "constraints": return { field, label, source, chips: role.constraints, text: role.constraints.length ? undefined : "None" };
    case "challenge": return { field, label, source, chips: [challengeLabel[role.challenge]] };
    case "pace": return { field, label, source, chips: [paceLabel[role.pace]] };
    case "wants":
    case "holdsBackBecause":
    case "softensWhen": {
      const value = role[field];
      return value ? { field, label, source, chips: [value] } : null;
    }
    case "background":
    case "traits":
    case "knownAboutUser":
      return null;
    default: {
      const value = role[field];
      return typeof value === "string" && value ? { field, label, source, text: value } : null;
    }
  }
}

const roleOrder: readonly (keyof RoleContext)[] = ["name", "role", "style", "publicContext", "opening", "wants", "holdsBackBecause", "softensWhen", "challenge", "pace", "constraints"];

/** The "Knows" column for the reviewed role and how it will be started. */
export function meetKnowledge(role: RoleContext, start: MeetStart): KnowsItem[] {
  if (start.kind === "role") {
    // Only fields the strict role schema keeps can be in the body.
    const parsed = roleContextSchema.safeParse(role);
    const sent = parsed.success ? parsed.data : role;
    return roleOrder.flatMap((field) => (field in sent && sent[field] !== undefined ? [item(field, sent, "body")] : [])).filter((entry): entry is KnowsItem => entry !== null);
  }
  if (start.kind === "preset") {
    const fixture = examples[start.preset].role;
    return roleOrder.flatMap((field) => (fixture[field] !== undefined ? [item(field, fixture, "server")] : [])).filter((entry): entry is KnowsItem => entry !== null);
  }
  const { person, sharedFacts } = start;
  const identity: KnowsItem[] = [
    { field: "name", label: knowsLabel.name, source: "server", text: person.name },
    { field: "role", label: knowsLabel.role, source: "server", text: person.relationship },
    { field: "style", label: knowsLabel.style, source: "server", text: person.style },
  ];
  if (person.background) identity.push({ field: "background", label: knowsLabel.background, source: "server", text: person.background });
  const traits = personTraits(person);
  if (traits.length) identity.push({ field: "traits", label: knowsLabel.traits, source: "server", chips: traits });
  if (sharedFacts.length) identity.push({ field: "knownAboutUser", label: knowsLabel.knownAboutUser, source: "server", chips: sharedFacts });
  const source: KnowsSource = start.situation === "custom" ? "body" : "server";
  // The default start sends no situation: the server uses the person's stored one, which has no stance chips.
  const situation = start.situation === "custom" ? situationFromRole(role) : personDefault(person);
  const scene = roleOrder
    .filter((field): field is (typeof situationKeys)[number] => (situationKeys as readonly string[]).includes(field) && field in situation)
    .map((field) => item(field, { ...role, ...situation }, source))
    .filter((entry): entry is KnowsItem => entry !== null);
  return [...identity, ...scene];
}

function personDefault(person: Person): Situation {
  const { publicContext, opening, constraints, challenge, pace } = person;
  return { publicContext, opening, constraints, challenge, pace };
}

/** A saved person's role as the Meet card starts it: identity from the person, situation as the user left it. */
export function personRole(person: Person, situation: Situation = personDefault(person)): RoleContext {
  return { name: person.name, role: person.relationship, style: person.style, ...situation };
}

/** Default when the scene is the person's stored one; custom (sent as `situation`) once the user changed anything in it. */
export function personStartSituation(person: Person, role: RoleContext): "default" | "custom" {
  return JSON.stringify(situationFromRole(role)) === JSON.stringify(situationFromRole(personRole(person))) ? "default" : "custom";
}

/** Field names, in order, for comparing with a start body. */
export function knowsFields(items: readonly KnowsItem[], source?: KnowsSource): KnowsField[] {
  return items.filter((entry) => !source || entry.source === source).map((entry) => entry.field);
}

export type NeverSeesKey = "goal" | "hardMomentLine" | "privateNotes" | "prediction" | "likelihoodBefore";
export type NeverSeesItem = { key: NeverSeesKey; label: string };

export const neverSeesLabel: Record<NeverSeesKey, string> = {
  goal: "Your line",
  hardMomentLine: "When it gets hard",
  privateNotes: "Your notes",
  prediction: "What you’re worried about",
  likelihoodBefore: "Your guess",
};

/** Only what the user wrote. Labels, never the text, so the panel itself repeats nothing private. */
export function neverSees(privateState: Readonly<PrivateState>, privateNotes = ""): NeverSeesItem[] {
  const filled: Record<NeverSeesKey, boolean> = {
    goal: Boolean(privateState.goal.trim()),
    hardMomentLine: Boolean(privateState.hardMomentLine.trim()),
    privateNotes: Boolean(privateNotes.trim()),
    prediction: Boolean(privateState.prediction.trim()),
    likelihoodBefore: privateState.likelihoodBefore !== null,
  };
  return (Object.keys(neverSeesLabel) as NeverSeesKey[]).filter((key) => filled[key]).map((key) => ({ key, label: neverSeesLabel[key] }));
}

/** The first problem with a reviewed role, in words, for the Call button's reason line. */
export function roleProblem(role: RoleContext): { field: keyof RoleContext; reason: string } | null {
  const parsed = roleContextSchema.safeParse(role);
  if (parsed.success) return null;
  const issue = parsed.error.issues[0];
  const field = (issue.path[0] ?? "name") as keyof RoleContext;
  const label = knowsLabel[field] ?? "A detail";
  const limits: Partial<Record<keyof RoleContext, number>> = { name: 60, role: 120, style: 300, publicContext: 1500, opening: 300, wants: 40, holdsBackBecause: 40, softensWhen: 40 };
  if (field === "constraints") return { field, reason: "Ground rules: up to 5, each 1–200 characters. Fix them in Edit details." };
  const max = limits[field];
  return { field, reason: max ? `“${label}” needs 1–${max} characters. Fix it in Edit details.` : `Check “${label}” in Edit details.` };
}
