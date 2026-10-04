import { describe, expect, it } from "vitest";
import { bestStreak, countsByDay, currentStreak, dayKey, heatmapWeeks, relativeDay, thisWeek } from "@/components/site/dashboard/stats";

const at = (day: string, time = "15:00:00") => ({ at: new Date(`${day}T${time}`).toISOString(), minutes: 3, kind: "practice" as const });
const today = new Date("2026-10-04T10:00:00");

describe("dashboard stats", () => {
  it("buckets calls by local day", () => {
    const counts = countsByDay([at("2026-10-04"), at("2026-10-04", "09:00:00"), at("2026-10-02")]);
    expect(counts.get("2026-10-04")).toBe(2);
    expect(counts.get("2026-10-02")).toBe(1);
  });

  it("counts a streak ending today or yesterday, and none after a gap", () => {
    expect(currentStreak(countsByDay([at("2026-10-04"), at("2026-10-03"), at("2026-10-02")]), today)).toBe(3);
    expect(currentStreak(countsByDay([at("2026-10-03"), at("2026-10-02")]), today)).toBe(2);
    expect(currentStreak(countsByDay([at("2026-10-01")]), today)).toBe(0);
  });

  it("finds the best streak across month boundaries", () => {
    expect(bestStreak(countsByDay([at("2026-09-29"), at("2026-09-30"), at("2026-10-01"), at("2026-10-04")]))).toBe(3);
    expect(bestStreak(new Map())).toBe(0);
  });

  it("builds week columns ending this week, marking future days", () => {
    const weeks = heatmapWeeks(countsByDay([at("2026-10-04")]), today, 4);
    expect(weeks).toHaveLength(4);
    expect(weeks.every((column) => column.length === 7)).toBe(true);
    const last = weeks[3];
    expect(last[0].key).toBe("2026-10-04");
    expect(last[0].count).toBe(1);
    expect(last[1].future).toBe(true);
  });

  it("lays out the current week Sunday first", () => {
    const week = thisWeek(countsByDay([at("2026-10-04")]), today);
    expect(week[0]).toMatchObject({ key: "2026-10-04", done: true, isToday: true });
    expect(week[6].future).toBe(true);
  });

  it("describes recent days in words", () => {
    expect(relativeDay(new Date("2026-10-04T08:00:00").toISOString(), today)).toBe("today");
    expect(relativeDay(new Date("2026-10-03T20:00:00").toISOString(), today)).toBe("yesterday");
    expect(relativeDay(new Date("2026-09-30T20:00:00").toISOString(), today)).toBe("4 days ago");
    expect(dayKey(today)).toBe("2026-10-04");
  });
});
