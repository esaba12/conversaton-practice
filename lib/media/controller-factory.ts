import { createDailyController } from "@/lib/media/daily-controller";
import type { CreateMediaController } from "@/lib/schemas/media";

// Automated browser checks may install a fake controller before the page loads. Development builds only:
// production builds compile this branch away, so they always use Daily. The workspace must label test mode visibly.
export const TEST_MEDIA_GLOBAL = "__practiceTestMediaController";

export function selectMediaController(): { create: CreateMediaController; testMode: boolean } {
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    const override = (window as unknown as Record<string, unknown>)[TEST_MEDIA_GLOBAL];
    if (typeof override === "function") return { create: override as CreateMediaController, testMode: true };
  }
  return { create: createDailyController, testMode: false };
}
