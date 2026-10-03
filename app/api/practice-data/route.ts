import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { deletePracticeData } from "@/lib/data/practice-data";
import { deletePracticeDataRequestSchema } from "@/lib/schemas/practice-data";

export async function DELETE(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    await readBody(request, deletePracticeDataRequestSchema, 256);
    return json(await deletePracticeData(client));
  });
}
