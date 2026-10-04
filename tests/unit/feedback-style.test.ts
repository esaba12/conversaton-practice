import { describe, expect, it } from "vitest";
import { defaultFeedbackStyle, feedbackStyleKey, feedbackStyleOptions, feedbackStyles, getFeedbackStyle, isFeedbackStyle, setFeedbackStyle } from "@/lib/practice/feedback-style";

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => { data[key] = value; } };
};

describe("feedback style (L3)", () => {
  it("defaults to gentle when nothing is stored or the stored value is not in the enum", () => {
    expect(defaultFeedbackStyle).toBe("gentle");
    expect(getFeedbackStyle(memory())).toBe("gentle");
    expect(getFeedbackStyle(memory({ [feedbackStyleKey]: "harsh" }))).toBe("gentle");
  });

  it("round-trips each enum value through the device store", () => {
    for (const style of feedbackStyles) {
      const store = memory();
      expect(setFeedbackStyle(style, store)).toBe(true);
      expect(store.data[feedbackStyleKey]).toBe(style);
      expect(getFeedbackStyle(store)).toBe(style);
    }
  });

  it("refuses values outside the enum and never throws when storage fails or is missing", () => {
    const store = memory();
    expect(setFeedbackStyle("shouting" as never, store)).toBe(false);
    expect(store.data).toEqual({});
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(getFeedbackStyle(broken)).toBe("gentle");
    expect(setFeedbackStyle("direct", broken)).toBe(false);
    expect(getFeedbackStyle(null)).toBe("gentle");
    expect(setFeedbackStyle("direct", null)).toBe(false);
  });

  it("is safe without a window (server render) and offers the three labelled choices", () => {
    expect(typeof window).toBe("undefined");
    expect(getFeedbackStyle()).toBe("gentle");
    expect(feedbackStyleOptions.map((option) => option.label)).toEqual(["Gentle words", "Plain and direct", "Short list"]);
    expect(feedbackStyleOptions.every((option) => isFeedbackStyle(option.value))).toBe(true);
  });
});
