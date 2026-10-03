import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { listSessions } from "@/lib/data/practice-data";
import { startRequestSchema } from "@/lib/schemas/session";
import { startSession } from "@/lib/session/server";

export async function GET(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await listSessions(client));
  });
}
export async function POST(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await startSession(client, await readBody(request, startRequestSchema, 8192)), 201);
  });
}
