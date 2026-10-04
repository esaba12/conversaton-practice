import { handle, json, parseId, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { getPersonPreset, setPersonPreset, setPresetRequestSchema } from "@/lib/data/people-preset";

type Context = { params: Promise<{ id: string }> };

// GET -> { preset: { id, version, presetId } }. PUT { presetId: starter | null, expectedVersion } bumps the person version.
export async function GET(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    return json({ preset: await getPersonPreset(client, parseId((await params).id)) });
  });
}
export async function PUT(request: Request, { params }: Context) {
  return handle(request, async () => {
    const { client } = await requireIdentity();
    const id = parseId((await params).id);
    const { presetId, expectedVersion } = await readBody(request, setPresetRequestSchema, 512);
    return json({ preset: await setPersonPreset(client, id, expectedVersion, presetId) });
  });
}
