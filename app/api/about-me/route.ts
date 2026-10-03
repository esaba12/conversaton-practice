import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { createFact, listFacts } from "@/lib/data/people";
import { aboutMeWriteSchema } from "@/lib/schemas/people";

export async function GET(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await listFacts(client));
  });
}
export async function POST(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const { text } = await readBody(request, aboutMeWriteSchema, 1024);
    return json(await createFact(client, text), 201);
  });
}
