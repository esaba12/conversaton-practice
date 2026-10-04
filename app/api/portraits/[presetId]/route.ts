import { handle } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { starterPortrait } from "@/lib/media/presets.server";

type Context = { params: Promise<{ presetId: string }> };

// GET /api/portraits/[presetId] (signed-in) -> the starter's face still, Cache-Control: private, max-age=86400.
// 404 NOT_FOUND for an unknown preset; 503 when the provider is unavailable. No provider id or CDN URL reaches the browser.
export async function GET(request: Request, { params }: Context) {
  return handle(request, async () => {
    await requireIdentity();
    return starterPortrait((await params).presetId);
  });
}
