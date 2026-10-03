import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { getPrivatePrep, putPrivatePrep } from "@/lib/data/people";
import { privatePrepWriteSchema } from "@/lib/schemas/people";

export async function GET(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await getPrivatePrep(client));
  });
}
export async function PUT(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const { notes } = await readBody(request, privatePrepWriteSchema, 2048);
    return json(await putPrivatePrep(client, notes));
  });
}
