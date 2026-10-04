import { handle, json } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { practicedPresets } from "@/lib/data/practice-history";

// W10: the starters this owner has already finished a practice with, for the lobby's button order.
export async function GET(request: Request) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json(await practicedPresets(client));
  });
}
