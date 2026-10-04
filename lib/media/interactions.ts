// Live Tavus interactions (docs/next/03-CONTRACTS.md §2.8). Payload shapes follow the public Tavus Interaction docs
// (https://docs.tavus.io/sections/conversational-video-interface/interactions-protocols/overview and the event-schemas pages,
// read October 4, 2026). The counterpart only ever receives a fixed template plus the reviewed name, or the user's own typed
// turn. Nothing private (goal, notes, fears, likelihoods) can be expressed through these builders.

// The docs name this event `conversation.append_llm_context`; the October 3 harness sent `conversation.append_context`, which
// has no live result recorded. One constant so the live check can switch it.
export const APPEND_CONTEXT_EVENT = "conversation.append_llm_context";
export const INTERRUPT_EVENT = "conversation.interrupt";
export const RESPOND_EVENT = "conversation.respond";

export const MAX_TYPED_TURN_CHARS = 300;
export const WRAP_UP_LEAD_SECONDS = 30;
const MAX_NAME_CHARS = 60;

export const WAIT_CONTEXT = "The user asked for a moment. Stay quiet until they speak again. If they say something, respond normally.";
export function wrapUpContext(name: string) {
  return `About 30 seconds remain. Begin wrapping up naturally as ${name}, in character. Do not mention time limits or the app.`;
}

declare const interactionBrand: unique symbol;
type Branded<T> = T & { readonly [interactionBrand]: true };

// Only the builders below produce an Interaction, so the controller's send cannot carry arbitrary text.
export type Interaction = Branded<
  | { readonly event_type: typeof APPEND_CONTEXT_EVENT; readonly properties: { readonly context: string } }
  | { readonly event_type: typeof INTERRUPT_EVENT }
  | { readonly event_type: typeof RESPOND_EVENT; readonly properties: { readonly text: string } }
>;

function brand<T>(value: T) {
  return Object.freeze(value) as Branded<T>;
}

// The reviewed name, as one line. A name that is empty after cleanup yields nothing to send.
export function reviewedName(raw: string) {
  const name = raw.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return name && name.length <= MAX_NAME_CHARS ? name : null;
}

export function buildWrapUp(name: string): Interaction | null {
  const reviewed = reviewedName(name);
  return reviewed ? brand({ event_type: APPEND_CONTEXT_EVENT, properties: { context: wrapUpContext(reviewed) } }) : null;
}

// Interrupt first, then the fixed instruction to stay quiet. No name is needed for the instruction itself.
export function buildAskToWait(): readonly [Interaction, Interaction] {
  return [brand({ event_type: INTERRUPT_EVENT }), brand({ event_type: APPEND_CONTEXT_EVENT, properties: { context: WAIT_CONTEXT } })];
}

// The user's typed turn, sent as if they had spoken it. Empty or over-long input is refused, never truncated.
export function typedTurnText(raw: string) {
  const text = raw.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return text && text.length <= MAX_TYPED_TURN_CHARS ? text : null;
}

export function buildTypedTurn(raw: string): Interaction | null {
  const text = typedTurnText(raw);
  return text ? brand({ event_type: RESPOND_EVENT, properties: { text } }) : null;
}

const wrapUpPattern = /^About 30 seconds remain\. Begin wrapping up naturally as (.+), in character\. Do not mention time limits or the app\.$/;

// Last check before anything leaves the browser: exactly the documented fields, and append_context text that is one of the
// fixed templates. Returns null for anything else.
export function toAppMessage(interaction: Interaction, conversationId: string) {
  const value = interaction as { event_type?: unknown; properties?: { context?: unknown; text?: unknown } };
  const base = { message_type: "conversation", event_type: value.event_type, conversation_id: conversationId } as const;
  switch (value.event_type) {
    case INTERRUPT_EVENT:
      return { ...base };
    case APPEND_CONTEXT_EVENT: {
      const context = value.properties?.context;
      if (typeof context !== "string") return null;
      const match = wrapUpPattern.exec(context);
      if (context !== WAIT_CONTEXT && !(match && reviewedName(match[1]) === match[1])) return null;
      return { ...base, properties: { context } };
    }
    case RESPOND_EVENT: {
      const text = value.properties?.text;
      if (typeof text !== "string" || typedTurnText(text) !== text) return null;
      return { ...base, properties: { text } };
    }
    default:
      return null;
  }
}

// Tavus conversation URLs are `https://tavus.daily.co/{conversation_id}` (docs: Create Conversation response).
export function conversationIdFromRoomUrl(roomUrl: string) {
  try {
    const id = new URL(roomUrl).pathname.replace(/^\/+|\/+$/g, "");
    return /^[A-Za-z0-9_-]{1,128}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// Live signals from the call, kept in memory for the screen only. Analysis fields never get here.
export type Speaker = "user" | "counterpart";
export type LiveEvent =
  | { type: "caption"; speaker: Speaker; text: string; final: boolean }
  | { type: "speaking"; speaker: Speaker; speaking: boolean }
  | { type: "network"; weak: boolean };

export type LiveCaption = { speaker: Speaker; text: string; final: boolean };
export type LiveCallState = {
  readonly caption: LiveCaption | null;
  readonly counterpartSpeaking: boolean;
  readonly userSpeaking: boolean;
  readonly weakNetwork: boolean;
};
export const initialLiveCallState: LiveCallState = { caption: null, counterpartSpeaking: false, userSpeaking: false, weakNetwork: false };

export function reduceLiveCall(state: LiveCallState, event: LiveEvent): LiveCallState {
  switch (event.type) {
    case "caption":
      return { ...state, caption: { speaker: event.speaker, text: event.text, final: event.final } };
    case "speaking":
      return event.speaker === "counterpart" ? { ...state, counterpartSpeaking: event.speaking } : { ...state, userSpeaking: event.speaking };
    case "network":
      return state.weakNetwork === event.weak ? state : { ...state, weakNetwork: event.weak };
  }
}

// S4: send the wrap-up once, when the timer reaches durationSeconds − 30, only while live. A call that never had more than 30 s
// to run gets none, and nothing is sent once the call has ended.
export function wrapUpDue({ live, durationSeconds, elapsedSeconds, sent }: { live: boolean; durationSeconds: number; elapsedSeconds: number; sent: boolean }) {
  if (!live || sent || durationSeconds <= WRAP_UP_LEAD_SECONDS) return false;
  return elapsedSeconds >= durationSeconds - WRAP_UP_LEAD_SECONDS && elapsedSeconds < durationSeconds;
}

// The visible cue (honey timer and "Wrapping up") follows the clock, whether or not a message could be sent.
export function inWrapUpWindow(durationSeconds: number, elapsedSeconds: number) {
  return durationSeconds > WRAP_UP_LEAD_SECONDS && elapsedSeconds >= durationSeconds - WRAP_UP_LEAD_SECONDS;
}
