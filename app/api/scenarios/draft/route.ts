import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { draftRequestSchema } from "@/lib/schemas/draft";
import { generateDraft } from "@/lib/setup/generate";

export async function POST(request: Request) {
  return handle(request, async () => {
    await requireIdentity();
    return json(await generateDraft(await readBody(request, draftRequestSchema, 4096)));
  });
}
