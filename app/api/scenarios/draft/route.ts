import { handle, json, readBody } from "@/lib/api/respond";
import { requireIdentity } from "@/lib/auth/server";
import { loadDraftPersonIdentity } from "@/lib/data/person-context";
import { AppError } from "@/lib/schemas/errors";
import { draftRequestSchema } from "@/lib/schemas/draft";
import { generateDraft, generateDraftStream } from "@/lib/setup/generate";
import { reserveDraft } from "@/lib/setup/rate-limit";

export async function POST(request: Request) {
  return handle(request, async () => {
    const { client, identity } = await requireIdentity();
    const input = await readBody(request, draftRequestSchema, 4096);
    reserveDraft(identity.id);
    const personIdentity = input.personId ? await loadDraftPersonIdentity(client, input.personId) : undefined;
    const setupInput = { ...input, personIdentity };
    if (!request.headers.get("accept")?.toLowerCase().includes("text/event-stream")) {
      return json(await generateDraft(setupInput));
    }
    const encoder = new TextEncoder();
    const event = (name: string, value: unknown) => encoder.encode(`event: ${name}\ndata: ${JSON.stringify(value)}\n\n`);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const draft = await generateDraftStream(setupInput, (field, value) => controller.enqueue(event("field", { field, value })));
          controller.enqueue(event("done", draft));
        } catch (error) {
          const known = error instanceof AppError ? error : new AppError("INTERNAL_ERROR", "Something went wrong. Try again shortly.", 500);
          controller.enqueue(event("error", { code: known.code, message: known.message, retryable: known.retryable }));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", Connection: "keep-alive" } });
  });
}
