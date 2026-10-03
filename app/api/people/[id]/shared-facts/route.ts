import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { setSharedFacts } from "@/lib/data/people";
import { sharedFactsRequestSchema } from "@/lib/schemas/people";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    const { factIds, expectedVersion } = await readBody(request, sharedFactsRequestSchema, 2048);
    return json(await setSharedFacts(client, id, expectedVersion, factIds));
  });
}
