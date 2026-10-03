import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { draftRequestSchema } from "@/lib/schemas/draft";
import { generateDraft } from "@/lib/setup/generate";
import { reserveDraft } from "@/lib/setup/rate-limit";

export async function POST(request: Request) {
  return handle(request, async () => {
    const { identity } = await requireIdentity();
    const input = await readBody(request, draftRequestSchema, 4096);
    reserveDraft(identity.id);
    return json(await generateDraft(input));
  });
}
