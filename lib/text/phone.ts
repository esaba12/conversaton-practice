const E164 = /^\+[1-9]\d{7,14}$/;

// Accept an already-international number, or a 10-digit US number.
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (E164.test(digits)) return digits;
  const bare = digits.replace(/\D/g, "");
  if (bare.length === 10) return `+1${bare}`;
  if (bare.length === 11 && bare.startsWith("1")) return `+${bare}`;
  return null;
}
