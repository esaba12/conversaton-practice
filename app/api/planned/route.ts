import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { listPlanned, setPlanned } from "@/lib/data/planned";
import { setPlannedRequestSchema } from "@/lib/schemas/planned";

export async function GET(request: Request) {
  return handle(request, async () => {
    const { client, identity } = await requireIdentity();
    return json(await listPlanned(client, identity.id));
  });
}

export async function PUT(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await setPlanned(client, await readBody(request, setPlannedRequestSchema, 2048)));
  });
}
