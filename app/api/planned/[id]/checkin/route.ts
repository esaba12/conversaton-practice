import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { checkinPlanned } from "@/lib/data/planned";
import { checkinRequestSchema } from "@/lib/schemas/planned";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    return json(await checkinPlanned(client, id, await readBody(request, checkinRequestSchema, 2048)));
  });
}
