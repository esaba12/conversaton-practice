import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { createPersonSituation, listPersonSituations } from "@/lib/data/person-situations";
import { createPersonSituationRequestSchema } from "@/lib/schemas/people";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await listPersonSituations(client, parseId((await params).id)));
  });
}

export async function POST(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const personId = parseId((await params).id);
    const input = await readBody(request, createPersonSituationRequestSchema, 8192);
    return json(await createPersonSituation(client, personId, input.label, input.situation), 201);
  });
}
