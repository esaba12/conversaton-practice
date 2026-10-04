export const portraitSizes = [40, 64, 120, 240] as const;
export type PortraitSize = (typeof portraitSizes)[number];

export function portraitAlt(name: string): string {
  const trimmed = name.trim();
  return `${trimmed || "Unnamed"}, fictional AI character`;
}

/** Up to two initials: first letter of the first and last word. */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
  return (first + last).toLocaleUpperCase();
}

export function reasonId(baseId: string): string {
  return `${baseId}-reason`;
}

export const fallbackDisabledReason = "This isn't available right now.";

/** A disabled control always says why; the prop types require a reason, this covers an empty string. */
export function disabledReasonText(disabled: boolean | undefined, reason: string | undefined): string | undefined {
  if (!disabled) return undefined;
  return reason?.trim() || fallbackDisabledReason;
}

export const privateCardTitle = "Only you see this";
