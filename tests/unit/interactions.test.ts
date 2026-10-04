import { describe, expect, it } from "vitest";
import {
  APPEND_CONTEXT_EVENT, INTERRUPT_EVENT, MAX_TYPED_TURN_CHARS, RESPOND_EVENT, WAIT_CONTEXT, buildAskToWait, buildTypedTurn, buildWrapUp,
  conversationIdFromRoomUrl, inWrapUpWindow, initialLiveCallState, reduceLiveCall, toAppMessage, wrapUpContext, wrapUpDue, type Interaction,
} from "@/lib/media/interactions";

const id = "c123456";

describe("live interaction builders", () => {
  it("builds the S4 wrap-up as a fixed template plus the reviewed name, with the exact Tavus payload", () => {
    const interaction = buildWrapUp("  Jordan \n Lee ");
    expect(interaction).not.toBeNull();
    expect(toAppMessage(interaction!, id)).toEqual({
      message_type: "conversation",
      event_type: APPEND_CONTEXT_EVENT,
      conversation_id: id,
      properties: { context: "About 30 seconds remain. Begin wrapping up naturally as Jordan Lee, in character. Do not mention time limits or the app." },
    });
    expect(APPEND_CONTEXT_EVENT).toBe("conversation.append_llm_context");
    expect(buildWrapUp("   ")).toBeNull();
    expect(buildWrapUp("x".repeat(61))).toBeNull();
  });

  it("builds S5 ask-to-wait as interrupt then the fixed stay-quiet context, never mentioning pause", () => {
    const [first, second] = buildAskToWait();
    expect(toAppMessage(first, id)).toEqual({ message_type: "conversation", event_type: INTERRUPT_EVENT, conversation_id: id });
    expect(toAppMessage(second, id)).toEqual({ message_type: "conversation", event_type: APPEND_CONTEXT_EVENT, conversation_id: id, properties: { context: WAIT_CONTEXT } });
    expect(WAIT_CONTEXT).toBe("The user asked for a moment. Stay quiet until they speak again. If they say something, respond normally.");
    expect(WAIT_CONTEXT.toLowerCase()).not.toContain("pause");
  });

  it("builds S6 typed turns as conversation.respond with the user's text, refusing empty and over-long input", () => {
    expect(toAppMessage(buildTypedTurn("  Can we move Atlas?  ")!, id)).toEqual({ message_type: "conversation", event_type: RESPOND_EVENT, conversation_id: id, properties: { text: "Can we move Atlas?" } });
    expect(buildTypedTurn("")).toBeNull();
    expect(buildTypedTurn(" \n\t ")).toBeNull();
    expect(buildTypedTurn("a".repeat(MAX_TYPED_TURN_CHARS))).not.toBeNull();
    expect(buildTypedTurn("a".repeat(MAX_TYPED_TURN_CHARS + 1))).toBeNull();
    expect(toAppMessage(buildTypedTurn("line one\nline two")!, id)).toMatchObject({ properties: { text: "line one line two" } });
  });

  it("refuses anything that is not a builder output at the send boundary", () => {
    const forged = (value: unknown) => toAppMessage(value as Interaction, id);
    expect(forged({ event_type: APPEND_CONTEXT_EVENT, properties: { context: "The user's goal is to move Atlas." } })).toBeNull();
    expect(forged({ event_type: APPEND_CONTEXT_EVENT, properties: { context: wrapUpContext("x".repeat(61)) } })).toBeNull();
    expect(forged({ event_type: RESPOND_EVENT, properties: { text: "a".repeat(301) } })).toBeNull();
    expect(forged({ event_type: RESPOND_EVENT, properties: { text: "  padded  " } })).toBeNull();
    expect(forged({ event_type: "conversation.overwrite_llm_context", properties: { context: WAIT_CONTEXT } })).toBeNull();
    expect(forged({ event_type: "conversation.echo", properties: { text: "hi" } })).toBeNull();
    // Extra fields never travel.
    expect(forged({ event_type: INTERRUPT_EVENT, properties: { goal: "private" } })).toEqual({ message_type: "conversation", event_type: INTERRUPT_EVENT, conversation_id: id });
  });

  it("builder outputs are frozen", () => {
    const interaction = buildTypedTurn("hello")!;
    expect(Object.isFrozen(interaction)).toBe(true);
  });

  it("derives the conversation id from the Tavus room URL", () => {
    expect(conversationIdFromRoomUrl("https://tavus.daily.co/c123456")).toBe("c123456");
    expect(conversationIdFromRoomUrl("https://tavus.daily.co/")).toBeNull();
    expect(conversationIdFromRoomUrl("https://tavus.daily.co/a/b")).toBeNull();
    expect(conversationIdFromRoomUrl("not a url")).toBeNull();
  });
});

describe("wrap-up timing (S4)", () => {
  const base = { live: true, durationSeconds: 180, sent: false };
  it("is due from durationSeconds − 30 until the end, once, only while live", () => {
    expect(wrapUpDue({ ...base, elapsedSeconds: 149 })).toBe(false);
    expect(wrapUpDue({ ...base, elapsedSeconds: 150 })).toBe(true);
    expect(wrapUpDue({ ...base, elapsedSeconds: 179 })).toBe(true);
    expect(wrapUpDue({ ...base, elapsedSeconds: 180 })).toBe(false);
    expect(wrapUpDue({ ...base, elapsedSeconds: 160, sent: true })).toBe(false);
    expect(wrapUpDue({ ...base, elapsedSeconds: 160, live: false })).toBe(false);
  });

  it("never fires for calls with 30 seconds or less", () => {
    expect(wrapUpDue({ ...base, durationSeconds: 30, elapsedSeconds: 0 })).toBe(false);
    expect(wrapUpDue({ ...base, durationSeconds: 20, elapsedSeconds: 5 })).toBe(false);
    expect(inWrapUpWindow(30, 10)).toBe(false);
  });

  it("sends exactly one message over a simulated call ticking every 250 ms, and none when End comes first", () => {
    const run = (durationSeconds: number, endAt: number) => {
      const sentAt: number[] = [];
      for (let ms = 0; ms <= durationSeconds * 1000; ms += 250) {
        const elapsedSeconds = Math.floor(ms / 1000);
        if (wrapUpDue({ live: elapsedSeconds < endAt, durationSeconds, elapsedSeconds, sent: sentAt.length > 0 })) sentAt.push(elapsedSeconds);
      }
      return sentAt;
    };
    expect(run(180, 180)).toEqual([150]);
    expect(run(300, 300)).toEqual([270]);
    expect(run(300, 200)).toEqual([]);
  });

  it("shows the honey cue from the same moment", () => {
    expect(inWrapUpWindow(180, 149)).toBe(false);
    expect(inWrapUpWindow(180, 150)).toBe(true);
  });
});

describe("live call state", () => {
  it("tracks captions, speaking and network quality", () => {
    let state = reduceLiveCall(initialLiveCallState, { type: "caption", speaker: "counterpart", text: "Hi", final: false });
    expect(state.caption).toEqual({ speaker: "counterpart", text: "Hi", final: false });
    state = reduceLiveCall(state, { type: "speaking", speaker: "counterpart", speaking: true });
    state = reduceLiveCall(state, { type: "speaking", speaker: "user", speaking: true });
    expect(state).toMatchObject({ counterpartSpeaking: true, userSpeaking: true });
    state = reduceLiveCall(state, { type: "speaking", speaker: "counterpart", speaking: false });
    expect(state.counterpartSpeaking).toBe(false);
    const weak = reduceLiveCall(state, { type: "network", weak: true });
    expect(weak.weakNetwork).toBe(true);
    expect(reduceLiveCall(weak, { type: "network", weak: true })).toBe(weak);
  });
});
