// L3: how reflection wording should sound. Device-only (localStorage), never written to the database.
// The recap reads it with getFeedbackStyle() and sends the enum as-is; the reflect route validates it.

export const feedbackStyles = ["gentle", "direct", "list"] as const;
export type FeedbackStyle = (typeof feedbackStyles)[number];
export const defaultFeedbackStyle: FeedbackStyle = "gentle";
export const feedbackStyleKey = "practice.feedbackStyle";

export const feedbackStyleOptions: readonly { value: FeedbackStyle; label: string }[] = [
  { value: "gentle", label: "Gentle words" },
  { value: "direct", label: "Plain and direct" },
  { value: "list", label: "Short list" },
];

type Store = Pick<Storage, "getItem" | "setItem">;
export const isFeedbackStyle = (value: unknown): value is FeedbackStyle => typeof value === "string" && (feedbackStyles as readonly string[]).includes(value);

// Storage access can throw (private mode, blocked cookies) and does not exist on the server.
function deviceStore(): Store | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}

export function getFeedbackStyle(store: Store | null = deviceStore()): FeedbackStyle {
  try {
    const value = store?.getItem(feedbackStyleKey);
    return isFeedbackStyle(value) ? value : defaultFeedbackStyle;
  } catch { return defaultFeedbackStyle; }
}

export function setFeedbackStyle(style: FeedbackStyle, store: Store | null = deviceStore()): boolean {
  if (!isFeedbackStyle(style) || !store) return false;
  try { store.setItem(feedbackStyleKey, style); return true; } catch { return false; }
}
