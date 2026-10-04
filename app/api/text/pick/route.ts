import { z } from "zod";
import { handle, json, readBody } from "@/lib/api/respond";
import { decline } from "@/fixtures/decline";
import { manager } from "@/fixtures/manager";
import { professor } from "@/fixtures/professor";
import { roommate } from "@/fixtures/roommate";
import { textPickCatalogSchema, textStartedSchema } from "@/lib/schemas/text";
import { catalogForToken, startFromPick } from "@/lib/text/inbound";
import { AppError } from "@/lib/schemas/errors";

const examples = [
  { preset: "roommate" as const, name: roommate.name, relationship: roommate.role },
  { preset: "professor" as const, name: professor.name, relationship: professor.role },
  { preset: "decline" as const, name: decline.name, relationship: decline.role },
  { preset: "manager" as const, name: manager.name, relationship: manager.role },
];

export async function GET(request: Request) {
  return handle(request, async () => {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (token.length < 20) throw new AppError("VALIDATION_ERROR", "The request was not valid.", 400);
    const people = await catalogForToken(token);
    if (!people) throw new AppError("NOT_FOUND", "That link expired. Text again to get a new one.", 404);
    return json(textPickCatalogSchema.parse({ people, examples }));
  });
}

export async function POST(request: Request) {
  return handle(request, async () => json(textStartedSchema.parse(await startFromPick(await readBody(request, z.unknown(), 8192)))));
}
