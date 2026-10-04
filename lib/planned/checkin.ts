import type { Planned } from "@/lib/schemas/planned";

// The user's local calendar day as YYYY-MM-DD, the same shape as `plannedOn`.
export function localDay(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// B2: ask once per date. A plan with any answer is never asked again; a new day (planned_set) clears the answer.
export function checkinDue(plan: Planned | null | undefined, today: string): boolean {
  return Boolean(plan) && plan!.checkin === null && plan!.plannedOn <= today;
}

export const talkedForReal = (plan: Planned | null | undefined) => plan?.checkin === "yes";

export function planFor(plans: readonly Planned[], personId: string): Planned | null {
  return plans.find((plan) => plan.personId === personId) ?? null;
}

// First plan that needs an answer; the home banner shows one at a time.
export function nextCheckin(plans: readonly Planned[], today: string): Planned | null {
  return plans.filter((plan) => checkinDue(plan, today)).sort((a, b) => a.plannedOn.localeCompare(b.plannedOn))[0] ?? null;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-10-09" -> "Oct 9"; no time zone conversion because the value is a calendar day, not an instant.
export function dayLabel(day: string): string {
  const [, month, date] = day.split("-").map(Number);
  return month >= 1 && month <= 12 && date ? `${months[month - 1]} ${date}` : day;
}
