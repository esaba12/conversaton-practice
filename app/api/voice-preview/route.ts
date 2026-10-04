import { handle, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { voicePreviewRequestSchema } from "@/lib/schemas/voice-preview";
import { reserveVoicePreview, synthesizePreview, voicePreviewConfiguration } from "@/lib/voice-preview/server";

export async function POST(request: Request) {
  return handle(request, async () => {
    const { identity } = await requireIdentity();
    const { text, presetId } = await readBody(request, voicePreviewRequestSchema, 1024);
    const configuration = voicePreviewConfiguration(presetId);
    reserveVoicePreview(identity.id);
    return synthesizePreview(text, configuration);
  });
}
