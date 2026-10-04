import { handle, json, parseId } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { deletePlanned } from "@/lib/data/planned";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await deletePlanned(client, parseId((await params).id)));
  });
}
