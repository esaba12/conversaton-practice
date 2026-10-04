import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { deletedResponseSchema } from "@/lib/schemas/people";
import { textLinkBeginSchema, textLinkRequestSchema, textLinkStatusSchema } from "@/lib/schemas/text";
import { normalizePhone } from "@/lib/text/phone";
import { assertPhotonConfigured, photonLine } from "@/lib/text/photon";
import { beginLink, linkStatus, newCode, unlinkPhone } from "@/lib/text/store";
import { AppError } from "@/lib/schemas/errors";

export async function GET(request: Request) {
  return handle(request, async () => {
    assertPhotonConfigured();
    const { client } = await requireIdentity();
    const status = await linkStatus(client);
    return json(textLinkStatusSchema.parse({ ...status, line: photonLine() }));
  });
}

export async function POST(request: Request) {
  return handle(request, async () => {
    assertPhotonConfigured();
    const { client } = await requireIdentity();
    const { phone: raw } = await readBody(request, textLinkRequestSchema);
    const phone = normalizePhone(raw);
    if (!phone) throw new AppError("VALIDATION_ERROR", "Enter a mobile number.", 400);
    const started = await beginLink(client, phone, newCode());
    return json(textLinkBeginSchema.parse({ ...started, line: photonLine() }), 201);
  });
}

export async function DELETE(request: Request) {
  return handle(request, async () => {
    assertPhotonConfigured();
    const { client } = await requireIdentity();
    await unlinkPhone(client);
    return json(deletedResponseSchema.parse({ deleted: true }));
  });
}
