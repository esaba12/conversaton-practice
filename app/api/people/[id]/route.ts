import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { deletePerson, getPerson, updatePerson } from "@/lib/data/people";
import { updatePersonRequestSchema } from "@/lib/schemas/people";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await getPerson(client, parseId((await params).id)));
  });
}
export async function PATCH(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    const { expectedVersion, ...fields } = await readBody(request, updatePersonRequestSchema, 8192);
    return json(await updatePerson(client, id, expectedVersion, fields));
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await deletePerson(client, parseId((await params).id)));
  });
}
