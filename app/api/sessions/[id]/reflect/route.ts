import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { generateReflection } from "@/lib/reflection/generate";
import { requireEndedSession, reserveReflection } from "@/lib/reflection/session";
import { reflectRequestSchema, reflectResponseSchema, type Reflection } from "@/lib/schemas/reflection";
import { purgeTextTurns, readTextTurns } from "@/lib/text/store";

const insufficient: Reflection = { evidence: "insufficient", observedAction: null, quotedLine: null, takeaway: null, nextStep: null, supportExit: false };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    const ended = await requireEndedSession(client, id);
    const input = await readBody(request, reflectRequestSchema, 96000);
    const text = ended?.channel === "text";
    const turns = text ? await readTextTurns(client, id) : input.turns;
    if (!turns.some((turn) => turn.speaker === "user")) {
      if (text) await purgeTextTurns(client, id).catch(() => undefined);
      return json(reflectResponseSchema.parse({ reflection: insufficient }));
    }
    const release = reserveReflection(id);
    try {
      const reflection = await generateReflection({ ...input, turns });
      if (text) await purgeTextTurns(client, id);
      return json(reflectResponseSchema.parse({ reflection }));
    } catch (error) { release(); throw error; }
  });
}
