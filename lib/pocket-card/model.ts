// L2: what goes on a pocket card. Built in the browser from things the user already wrote; never sent anywhere.
export const OPEN_WITH_MAX = 200;
export const HARD_MOMENT_MAX = 200;
export const NAME_MAX = 60;

export type PocketCardContent = {
  name: string;
  openWith: string;
  // The one line the user planned for the hard moment; empty when they skipped it.
  hardMoment: string;
  // The real conversation's day (B1), YYYY-MM-DD; absent when the user did not set one.
  plannedOn?: string;
  // When this practice happened, YYYY-MM-DD.
  practicedOn: string;
};

const clip = (value: string, max: number) => value.trim().replace(/\s+/g, " ").slice(0, max);

export function buildPocketCard(input: { name: string; openWith: string; hardMoment?: string; plannedOn?: string | null; practicedOn: string }): PocketCardContent {
  return {
    name: clip(input.name, NAME_MAX) || "Someone",
    openWith: clip(input.openWith, OPEN_WITH_MAX),
    hardMoment: clip(input.hardMoment ?? "", HARD_MOMENT_MAX),
    ...(input.plannedOn ? { plannedOn: input.plannedOn } : {}),
    practicedOn: input.practicedOn,
  };
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function cardDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return month >= 1 && month <= 12 && date ? `${months[month - 1]} ${date}, ${year}` : day;
}

// Lines in reading order, shared by the on-screen card, the PNG and the tests. Each section is omitted when empty.
export type PocketCardLine = { kind: "name" | "label" | "body" | "small"; text: string };
export function pocketCardLines(card: PocketCardContent): PocketCardLine[] {
  const lines: PocketCardLine[] = [{ kind: "name", text: card.name }];
  if (card.plannedOn) lines.push({ kind: "small", text: `Talking for real on ${cardDay(card.plannedOn)}` });
  if (card.openWith) lines.push({ kind: "label", text: "Open with" }, { kind: "body", text: card.openWith });
  if (card.hardMoment) lines.push({ kind: "label", text: "If it gets hard" }, { kind: "body", text: card.hardMoment });
  lines.push({ kind: "small", text: `Practiced on ${cardDay(card.practicedOn)}` });
  return lines;
}
