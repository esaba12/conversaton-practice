import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { checkGoal, goalCheckConfiguration } from "@/lib/goal-check/generate";
import { requireLiveSession, reserveGoalCheck } from "@/lib/goal-check/session";
import { goalCheckRequestSchema, goalCheckResponseSchema } from "@/lib/schemas/goal-check";

// The goal and turns are passed to the model only; they are never stored, logged or sent to the call provider.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    await requireLiveSession(client, id);
    const input = await readBody(request, goalCheckRequestSchema, 4096);
    const configuration = goalCheckConfiguration();
    reserveGoalCheck(id);
    return json(goalCheckResponseSchema.parse({ met: await checkGoal(input, configuration) }));
  });
}
