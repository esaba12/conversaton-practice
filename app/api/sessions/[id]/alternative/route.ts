import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { generateAlternative } from "@/lib/reflection/generate";
import { requireEndedSession, reserveReflection } from "@/lib/reflection/session";
import { alternativeRequestSchema, alternativeResponseSchema } from "@/lib/schemas/reflection";

// A1 "Another way to say it", on request only. The body carries the user's own goal line and
// nothing else: no transcript, no role, no private notes. It shares the reflection's per-session
// generation cap, so one recap cannot spend more model calls than a reflection would.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    await requireEndedSession(client, id);
    const input = await readBody(request, alternativeRequestSchema);
    const release = reserveReflection(id);
    try {
      return json(alternativeResponseSchema.parse(await generateAlternative(input)));
    } catch (error) { release(); throw error; }
  });
}
