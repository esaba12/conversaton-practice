import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { startRequestSchema } from "@/lib/schemas/session";
import { textSessionResponseSchema } from "@/lib/schemas/text";
import { startTextSession } from "@/lib/text/start";

export async function POST(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const started = await startTextSession(client, await readBody(request, startRequestSchema, 8192));
    return json(textSessionResponseSchema.parse(started), 201);
  });
}
