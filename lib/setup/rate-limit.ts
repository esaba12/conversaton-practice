import "server-only";
import { DRAFT_RATE_LIMIT } from "@/lib/schemas/draft";
import { AppError } from "@/lib/schemas/errors";

// Per server process only: restarts and other instances each keep their own counts.
const MAX_TRACKED = 1_000;
const requests = new Map<string, number[]>();

// Sliding window. Counted before the model call, and never released: failed and out-of-scope drafts still cost a call.
export function reserveDraft(userId: string, now = Date.now()) {
  const recent = (requests.get(userId) ?? []).filter((at) => now - at < DRAFT_RATE_LIMIT.windowMs);
  if (recent.length >= DRAFT_RATE_LIMIT.max) {
    requests.set(userId, recent);
    throw new AppError("USAGE_LIMIT", "You've drafted several setups in a short time. Wait a few minutes, or fill in the form manually.", 429);
  }
  requests.delete(userId);
  requests.set(userId, [...recent, now]);
  while (requests.size > MAX_TRACKED) requests.delete(requests.keys().next().value!);
}

export function resetDraftLimitsForTests() { requests.clear(); }
