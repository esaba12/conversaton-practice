import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { generateReflection } from "@/lib/reflection/generate";
import { requireEndedSession, reserveReflection } from "@/lib/reflection/session";
import { reflectRequestSchema, reflectResponseSchema, type Reflection } from "@/lib/schemas/reflection";

const insufficient: Reflection = { evidence: "insufficient", observedAction: null, takeaway: null, nextStep: null, supportExit: false };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    const input = await readBody(request, reflectRequestSchema, 96000);
    await requireEndedSession(client, id);
    if (!input.turns.some((turn) => turn.speaker === "user")) return json(reflectResponseSchema.parse({ reflection: insufficient }));
    const release = reserveReflection(id);
    try {
      return json(reflectResponseSchema.parse({ reflection: await generateReflection(input) }));
    } catch (error) { release(); throw error; }
  });
}
