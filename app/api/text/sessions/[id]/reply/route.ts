import { handle, json, parseId } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { textSessionResponseSchema } from "@/lib/schemas/text";
import { retryTextOpening } from "@/lib/text/start";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(textSessionResponseSchema.parse(await retryTextOpening(client, parseId((await params).id))));
  });
}
