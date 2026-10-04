import { handle, json, parseId } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { deletePersonSituation } from "@/lib/data/person-situations";

type Context = { params: Promise<{ id: string; situationId: string }> };

export async function DELETE(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const values = await params;
    parseId(values.id);
    return json(await deletePersonSituation(client, parseId(values.situationId)));
  });
}
