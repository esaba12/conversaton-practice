import { reflectResponseSchema, type ReflectRequest, type Reflection } from "@/lib/schemas/reflection";
import { requestJson } from "@/lib/session/api-client";

// Sends only the in-memory turns plus the user's own goal and note; never notes, role, person or About-me data.
export async function requestReflection(sessionId: string, input: ReflectRequest): Promise<Reflection> {
  const body: ReflectRequest = { turns: input.turns.map(({ speaker, text }) => ({ speaker, text })) };
  const goal = input.goal?.trim();
  if (goal) body.goal = goal;
  const selfReflection = input.selfReflection?.trim();
  if (selfReflection) body.selfReflection = selfReflection;
  return (await requestJson("POST", `/api/sessions/${encodeURIComponent(sessionId)}/reflect`, body, reflectResponseSchema)).reflection;
}
