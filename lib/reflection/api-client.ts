import { alternativeResponseSchema, MAX_ALTERNATIVE_CHARS, reflectResponseSchema, type AlternativeRequest, type ReflectRequest, type Reflection } from "@/lib/schemas/reflection";
import { requestJson } from "@/lib/session/api-client";

// Sends only the in-memory turns plus the user's own goal, note and wording preference; never
// private notes, the hard-moment line, the fear, the likelihoods, the role, the person or About-me data.
export async function requestReflection(sessionId: string, input: ReflectRequest): Promise<Reflection> {
  const body: ReflectRequest = { turns: input.turns.map(({ speaker, text }) => ({ speaker, text })) };
  const goal = input.goal?.trim();
  if (goal) body.goal = goal;
  const selfReflection = input.selfReflection?.trim();
  if (selfReflection) body.selfReflection = selfReflection;
  if (input.feedbackStyle) body.feedbackStyle = input.feedbackStyle;
  return (await requestJson("POST", `/api/sessions/${encodeURIComponent(sessionId)}/reflect`, body, reflectResponseSchema)).reflection;
}

// A1: one phrasing of the user's own line, only when they press the button. The goal is the only content sent.
export async function requestAlternative(sessionId: string, goal: string): Promise<string | null> {
  const body: AlternativeRequest = { goal: goal.trim().slice(0, MAX_ALTERNATIVE_CHARS) };
  return (await requestJson("POST", `/api/sessions/${encodeURIComponent(sessionId)}/alternative`, body, alternativeResponseSchema)).alternative;
}
