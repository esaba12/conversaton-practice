import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { createPerson, listPeople } from "@/lib/data/people";
import { createPersonRequestSchema } from "@/lib/schemas/people";

export async function GET(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await listPeople(client));
  });
}
export async function POST(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await createPerson(client, await readBody(request, createPersonRequestSchema, 8192)), 201);
  });
}
