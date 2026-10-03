import { z } from "zod";
import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { connectSession } from "@/lib/session/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    await readBody(request, z.object({}).strict());
    return json(await connectSession(client, id));
  });
}
