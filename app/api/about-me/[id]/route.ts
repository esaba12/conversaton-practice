import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { deleteFact, updateFact } from "@/lib/data/people";
import { aboutMeWriteSchema } from "@/lib/schemas/people";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    const { text } = await readBody(request, aboutMeWriteSchema, 1024);
    return json(await updateFact(client, id, text));
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await deleteFact(client, parseId((await params).id)));
  });
}
