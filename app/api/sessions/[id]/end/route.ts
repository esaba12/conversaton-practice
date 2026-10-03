import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { endRequestSchema } from "@/lib/schemas/session";
import { endSession } from "@/lib/session/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    const { reason } = await readBody(request, endRequestSchema);
    return json(await endSession(client, id, reason));
  });
}
