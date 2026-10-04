import type { DashboardPractice } from "@/lib/data/dashboard";

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function countsByDay(practices: readonly DashboardPractice[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const practice of practices) {
    const key = dayKey(new Date(practice.at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Consecutive days with a call, ending today or (if nothing yet today) yesterday. */
export function currentStreak(counts: Map<string, number>, today: Date): number {
  let day = counts.has(dayKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (counts.has(dayKey(day))) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function bestStreak(counts: Map<string, number>): number {
  const days = [...counts.keys()].sort();
  let best = 0, run = 0, previous: string | null = null;
  for (const key of days) {
    run = previous && dayKey(addDays(new Date(`${previous}T12:00:00`), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }
  return best;
}

/** Columns of 7 days (Sunday first), oldest week first, ending with the current week. */
export function heatmapWeeks(counts: Map<string, number>, today: Date, weeks: number): { key: string; count: number; future: boolean }[][] {
  const end = addDays(today, 6 - today.getDay());
  const start = addDays(end, -(weeks * 7 - 1));
  const todayKey = dayKey(today);
  const columns: { key: string; count: number; future: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const key = dayKey(date);
      column.push({ key, count: counts.get(key) ?? 0, future: key > todayKey });
    }
    columns.push(column);
  }
  return columns;
}

/** The current week, Sunday first, with whether each day had a call. */
export function thisWeek(counts: Map<string, number>, today: Date): { key: string; label: string; done: boolean; isToday: boolean; future: boolean }[] {
  const start = addDays(today, -today.getDay());
  const todayKey = dayKey(today);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const key = dayKey(date);
    return { key, label: date.toLocaleDateString(undefined, { weekday: "narrow" }), done: counts.has(key), isToday: key === todayKey, future: key > todayKey };
  });
}

export function relativeDay(iso: string, now: Date): string {
  const then = new Date(iso);
  const days = Math.round((new Date(dayKey(now)).getTime() - new Date(dayKey(then)).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} wk ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
