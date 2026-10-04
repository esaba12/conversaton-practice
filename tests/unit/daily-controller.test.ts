import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MediaCredential, MediaEvent } from "@/lib/schemas/media";
import type { Interaction, LiveEvent } from "@/lib/media/interactions";

type Handler = (event: unknown) => void;
type FakeTrack = { kind: "audio" | "video"; readyState: "live" | "ended"; stop: ReturnType<typeof vi.fn> };

function fakeTrack(kind: FakeTrack["kind"]): FakeTrack {
  const track: FakeTrack = { kind, readyState: "live", stop: vi.fn(() => { track.readyState = "ended"; }) };
  return track;
}

class FakeMediaStream {
  constructor(private tracks: unknown[] = []) {}
  getTracks() { return this.tracks; }
}

const daily = vi.hoisted(() => ({ calls: [] as FakeCall[], joinImpl: null as null | (() => Promise<unknown>) }));
type FakeCall = ReturnType<typeof makeCall>;

function makeCall(options: unknown) {
  const handlers = new Map<string, Handler[]>();
  const localMic = fakeTrack("audio");
  const participants: Record<string, unknown> = { local: { local: true, session_id: "me", tracks: { audio: { state: "playable", persistentTrack: localMic, track: localMic }, video: { state: "off" } } } };
  const call = {
    options,
    handlers,
    localMic,
    participants: vi.fn(() => participants),
    setRemote(remote: unknown) { participants.remote = remote; },
    emit(name: string, event: unknown = {}) { handlers.get(name)?.forEach((handler) => handler(event)); },
    on: vi.fn((name: string, handler: Handler) => { handlers.set(name, [...(handlers.get(name) ?? []), handler]); return call; }),
    join: vi.fn((..._args: unknown[]) => (daily.joinImpl ? daily.joinImpl() : Promise.resolve())),
    setLocalAudio: vi.fn((..._args: unknown[]) => call),
    sendAppMessage: vi.fn((..._args: unknown[]) => call),
    destroy: vi.fn(() => Promise.resolve()),
  };
  return call;
}

vi.mock("@daily-co/daily-js", () => ({
  default: { createCallObject: vi.fn((options: unknown) => { const call = makeCall(options); daily.calls.push(call); return call; }) },
}));

const { createDailyController, reportRemoteVideoPlaying, VIDEO_FIRST_TIMEOUT_MS } = await import("@/lib/media/daily-controller");
const { buildAskToWait, buildTypedTurn, buildWrapUp } = await import("@/lib/media/interactions");

const credential: MediaCredential = { provider: "tavus", roomUrl: "https://tavus.daily.co/room", meetingToken: "unit-token", expiresAt: new Date(Date.now() + 600_000).toISOString() };

function remote(videoState: string, audioState: string) {
  const video = fakeTrack("video");
  const audio = fakeTrack("audio");
  return { participant: { local: false, session_id: "replica", tracks: { video: { state: videoState, persistentTrack: video }, audio: { state: audioState, persistentTrack: audio } } }, video, audio };
}

function lastStream(events: MediaEvent[]) {
  const stream = [...events].reverse().find((event) => event.type === "remote-stream" && event.stream);
  return (stream as { stream: MediaStream }).stream;
}

const controllers: Array<{ end(): Promise<void> }> = [];
function setup() {
  const events: MediaEvent[] = [];
  const controller = createDailyController((event) => events.push(event));
  controllers.push(controller);
  return { events, controller };
}

let getUserMedia: ReturnType<typeof vi.fn>;
beforeEach(() => {
  daily.calls.length = 0;
  daily.joinImpl = null;
  vi.stubGlobal("MediaStream", FakeMediaStream);
  getUserMedia = vi.fn(async () => new FakeMediaStream([fakeTrack("video")]));
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
});
afterEach(async () => {
  await Promise.all(controllers.splice(0).map((controller) => controller.end()));
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Daily media controller", () => {
  it("joins with microphone on, camera never published, and video off", async () => {
    const { controller } = setup();
    await controller.connect(credential);
    const call = daily.calls[0];
    expect(call.options).toEqual({ audioSource: true, videoSource: false });
    expect(call.join).toHaveBeenCalledWith({ url: credential.roomUrl, token: credential.meetingToken, startVideoOff: true, startAudioOff: false });
  });

  it("emits ready exactly once, only when remote video and audio are both playable", async () => {
    const { events, controller } = setup();
    await controller.connect(credential);
    const call = daily.calls[0];
    const loading = remote("playable", "loading");
    call.setRemote(loading.participant);
    call.emit("track-started");
    expect(events.filter((event) => event.type === "ready")).toHaveLength(0);
    expect(events.at(-1)).toMatchObject({ type: "remote-stream" });
    (loading.participant.tracks.audio as { state: string }).state = "playable";
    call.emit("participant-updated");
    call.emit("participant-updated");
    call.emit("track-started");
    expect(events.filter((event) => event.type === "ready")).toHaveLength(0);
    reportRemoteVideoPlaying(lastStream(events));
    call.emit("participant-updated");
    call.emit("track-started");
    expect(events.filter((event) => event.type === "ready")).toHaveLength(1);
    expect(events.filter((event) => event.type === "remote-stream")).toHaveLength(1);
  });

  it("end is idempotent and releases the microphone and local preview", async () => {
    const { events, controller } = setup();
    await controller.connect(credential);
    expect(await controller.setCamera(true)).toBe(true);
    const preview = events.find((event) => event.type === "local-preview")!;
    const previewTrack = (preview as unknown as { stream: FakeMediaStream }).stream.getTracks()[0] as FakeTrack;
    const call = daily.calls[0];
    const first = controller.end();
    expect(call.setLocalAudio).toHaveBeenCalledWith(false);
    expect(call.localMic.stop).toHaveBeenCalled();
    expect(previewTrack.stop).toHaveBeenCalled();
    expect(events.slice(-2)).toEqual([{ type: "remote-stream", stream: null }, { type: "local-preview", stream: null }]);
    await Promise.all([first, controller.end()]);
    expect(call.destroy).toHaveBeenCalledTimes(1);
    expect(events.filter((event) => "stream" in event && event.stream === null)).toHaveLength(2);
  });

  it("ignores Daily events after end", async () => {
    const { events, controller } = setup();
    await controller.connect(credential);
    const call = daily.calls[0];
    await controller.end();
    const count = events.length;
    call.setRemote(remote("playable", "playable").participant);
    call.emit("track-started");
    call.emit("error", { error: { type: "connection-error" } });
    call.emit("left-meeting");
    call.emit("track-stopped", { participant: { local: false }, track: { kind: "video" } });
    expect(events).toHaveLength(count);
  });

  it("stops a camera stream acquired after end", async () => {
    const { events, controller } = setup();
    const track = fakeTrack("video");
    let grant!: (stream: unknown) => void;
    getUserMedia.mockImplementationOnce(() => new Promise((resolve) => { grant = resolve; }));
    const pending = controller.setCamera(true);
    await controller.end();
    grant(new FakeMediaStream([track]));
    expect(await pending).toBe(false);
    expect(track.stop).toHaveBeenCalled();
    expect(events.filter((event) => event.type === "local-preview" && event.stream)).toHaveLength(0);
  });

  it("resolves false without events when camera permission is denied", async () => {
    const { events, controller } = setup();
    getUserMedia.mockRejectedValueOnce(Object.assign(new Error("denied"), { name: "NotAllowedError" }));
    expect(await controller.setCamera(true)).toBe(false);
    expect(events).toEqual([]);
  });

  it("tears down and rejects a failed join without retrying", async () => {
    const { events, controller } = setup();
    daily.joinImpl = () => Promise.reject(new Error("boom"));
    await expect(controller.connect(credential)).rejects.toThrow();
    const call = daily.calls[0];
    expect(call.join).toHaveBeenCalledTimes(1);
    expect(call.destroy).toHaveBeenCalledTimes(1);
    expect(call.localMic.stop).toHaveBeenCalled();
    expect(events.at(-1)).toEqual({ type: "failed", reason: "join" });
    await expect(controller.connect(credential)).rejects.toThrow();
    expect(daily.calls).toHaveLength(1);
  });

  it("reports microphone denial and expired credentials", async () => {
    const denied = setup();
    daily.joinImpl = () => Promise.reject(Object.assign(new Error("Permission denied"), { name: "NotAllowedError" }));
    await expect(denied.controller.connect(credential)).rejects.toThrow();
    expect(denied.events.at(-1)).toEqual({ type: "failed", reason: "microphone_denied" });

    const expired = setup();
    await expect(expired.controller.connect({ ...credential, expiresAt: new Date(Date.now() - 1000).toISOString() })).rejects.toThrow();
    expect(expired.events.at(-1)).toEqual({ type: "failed", reason: "credential_expired" });
    expect(daily.calls).toHaveLength(1);
  });

  it("maps a Daily microphone permission error during join to microphone_denied", async () => {
    const { events, controller } = setup();
    daily.joinImpl = () => { daily.calls[0].emit("camera-error", { error: { type: "permissions", blockedBy: "user", blockedMedia: ["audio"] } }); return Promise.resolve(); };
    await expect(controller.connect(credential)).rejects.toThrow();
    expect(events.filter((event) => event.type === "failed")).toEqual([{ type: "failed", reason: "microphone_denied" }]);
    expect(daily.calls[0].destroy).toHaveBeenCalledTimes(1);
  });

  it("maps remote video loss, provider errors, and leaving", async () => {
    const lost = setup();
    await lost.controller.connect(credential);
    daily.calls[0].emit("track-stopped", { participant: { local: false }, track: { kind: "video" } });
    expect(lost.events.at(-1)).toEqual({ type: "failed", reason: "video_lost" });
    expect(daily.calls[0].destroy).toHaveBeenCalled();

    const errored = setup();
    await errored.controller.connect(credential);
    daily.calls[1].emit("error", { errorMsg: "x", error: { type: "connection-error" } });
    expect(errored.events.at(-1)).toEqual({ type: "failed", reason: "provider_error" });

    const left = setup();
    await left.controller.connect(credential);
    daily.calls[2].emit("left-meeting");
    daily.calls[2].emit("error", { error: { type: "connection-error" } });
    expect(left.events.filter((event) => event.type === "remote-left" || event.type === "failed")).toEqual([{ type: "remote-left" }]);
  });

  it("mutes without pausing and never passes the camera stream to Daily", async () => {
    const { events, controller } = setup();
    await controller.connect(credential);
    const call = daily.calls[0];
    controller.setMuted(true);
    expect(call.setLocalAudio).toHaveBeenLastCalledWith(false);
    controller.setMuted(false);
    expect(call.setLocalAudio).toHaveBeenLastCalledWith(true);
    await controller.setCamera(true);
    const stream = (events.find((event) => event.type === "local-preview" && event.stream) as unknown as { stream: FakeMediaStream }).stream;
    const cameraTrack = stream.getTracks()[0];
    const dailyArgs = [call.options, ...call.join.mock.calls.flat(), ...call.setLocalAudio.mock.calls.flat(), ...call.on.mock.calls.flat()];
    for (const arg of dailyArgs) {
      expect(arg).not.toBe(stream);
      expect(arg).not.toBe(cameraTrack);
      if (arg && typeof arg === "object") expect(Object.values(arg)).not.toContain(cameraTrack);
    }
    expect(await controller.setCamera(false)).toBe(false);
    expect((cameraTrack as FakeTrack).stop).toHaveBeenCalled();
  });

  it("emits finished user and counterpart utterances only while live, ignoring legacy duplicates and analysis", async () => {
    const { events, controller } = setup();
    await controller.connect(credential);
    const call = daily.calls[0];
    const message = (role: string, speech: unknown, extra: Record<string, unknown> = {}) =>
      call.emit("app-message", { fromId: "replica", data: { message_type: "conversation", event_type: "conversation.utterance", properties: { role, speech, ...extra } } });
    message("pal", "  Hey, got a minute?  ", { user_audio_analysis: "sounds nervous" });
    message("replica", "Hey, got a minute?");
    message("user", "<user_audio_analysis>The user sounded hesitant</user_audio_analysis>Sure, about the kitchen.");
    message("user", "   ");
    message("user", "<user_audio_analysis>tone only</user_audio_analysis>");
    message("user", 42);
    call.emit("app-message", { data: { event_type: "conversation.utterance.streaming", properties: { role: "pal", speech: "partial" } } });
    call.emit("app-message", { data: "not an object" });
    call.emit("app-message", {});
    message("pal", "x".repeat(2_500));
    const turns = events.filter((event) => event.type === "utterance");
    expect(turns.slice(0, 2)).toEqual([
      { type: "utterance", speaker: "counterpart", text: "Hey, got a minute?" },
      { type: "utterance", speaker: "user", text: "Sure, about the kitchen." },
    ]);
    expect(turns).toHaveLength(3);
    expect((turns[2] as { text: string }).text).toHaveLength(2_000);
    expect(JSON.stringify(turns)).not.toContain("nervous");
    expect(JSON.stringify(turns)).not.toMatch(/hesitant|tone only|analysis/);
    await controller.end();
    message("user", "after end");
    expect(events.filter((event) => event.type === "utterance")).toHaveLength(3);
  });

  it("keeps counterpart turns when only legacy replica utterances arrive, and drops a repeated inference", async () => {
    const { events, controller } = setup();
    await controller.connect(credential);
    const call = daily.calls[0];
    const message = (role: string, speech: string, inference_id?: string) =>
      call.emit("app-message", { data: { event_type: "conversation.utterance", inference_id, properties: { role, speech } } });
    message("replica", "First line.", "i1");
    message("pal", "First line.", "i1");
    message("user", "Okay.");
    message("pal", "Second line.", "i2");
    message("replica", "Second line.", "i2");
    message("replica", "Third line, legacy only.");
    expect(events.filter((event) => event.type === "utterance").map((event) => (event as { speaker: string; text: string }).speaker + ":" + (event as { text: string }).text))
      .toEqual(["counterpart:First line.", "user:Okay.", "counterpart:Second line."]);
  });

  describe("video-first gating", () => {
    const readyCount = (events: MediaEvent[]) => events.filter((event) => event.type === "ready").length;
    const streamEvents = (events: MediaEvent[]) => events.filter((event) => event.type === "remote-stream" && event.stream);

    async function connected() {
      const harness = setup();
      await harness.controller.connect(credential);
      return { ...harness, call: daily.calls.at(-1)! };
    }

    it("does not go live before the remote video plays, even when both tracks are playable", async () => {
      const { events, call } = await connected();
      call.setRemote(remote("playable", "playable").participant);
      call.emit("track-started");
      call.emit("participant-updated");
      expect(streamEvents(events)).toHaveLength(1);
      expect(readyCount(events)).toBe(0);
    });

    it("goes live once, only after the video playing signal, and ignores repeats", async () => {
      const { events, call } = await connected();
      call.setRemote(remote("playable", "playable").participant);
      call.emit("track-started");
      const stream = lastStream(events);
      reportRemoteVideoPlaying(stream);
      expect(readyCount(events)).toBe(1);
      reportRemoteVideoPlaying(stream);
      call.emit("participant-updated");
      expect(readyCount(events)).toBe(1);
      expect(events.some((event) => event.type === "failed")).toBe(false);
    });

    it("waits for the audio track to be playable even after video plays", async () => {
      const { events, call } = await connected();
      const pair = remote("playable", "loading");
      call.setRemote(pair.participant);
      call.emit("track-started");
      reportRemoteVideoPlaying(lastStream(events));
      expect(readyCount(events)).toBe(0);
      (pair.participant.tracks.audio as { state: string }).state = "playable";
      call.emit("participant-updated");
      expect(readyCount(events)).toBe(1);
    });

    it("fails with video_lost and never goes live when video never plays within the timeout", async () => {
      vi.useFakeTimers();
      const { events, call } = await connected();
      call.setRemote(remote("playable", "playable").participant);
      call.emit("track-started");
      vi.advanceTimersByTime(VIDEO_FIRST_TIMEOUT_MS - 1);
      expect(events.some((event) => event.type === "failed")).toBe(false);
      vi.advanceTimersByTime(1);
      expect(events.filter((event) => event.type === "failed")).toEqual([{ type: "failed", reason: "video_lost" }]);
      expect(readyCount(events)).toBe(0);
      expect(call.destroy).toHaveBeenCalledTimes(1);
      expect(call.localMic.stop).toHaveBeenCalled();
      expect(events.at(-1)).toEqual({ type: "failed", reason: "video_lost" });
      const stream = streamEvents(events)[0] as { stream: MediaStream };
      reportRemoteVideoPlaying(stream.stream);
      expect(readyCount(events)).toBe(0);
    });

    it("fails the same way when no remote video ever arrives after joining", async () => {
      vi.useFakeTimers();
      const { events, call } = await connected();
      vi.advanceTimersByTime(VIDEO_FIRST_TIMEOUT_MS);
      expect(events.at(-1)).toEqual({ type: "failed", reason: "video_lost" });
      expect(readyCount(events)).toBe(0);
      expect(call.destroy).toHaveBeenCalledTimes(1);
    });

    it("does not time out once video is playing and the call is live", async () => {
      vi.useFakeTimers();
      const { events, call } = await connected();
      call.setRemote(remote("playable", "playable").participant);
      call.emit("track-started");
      vi.advanceTimersByTime(VIDEO_FIRST_TIMEOUT_MS - 1000);
      reportRemoteVideoPlaying(lastStream(events));
      vi.advanceTimersByTime(VIDEO_FIRST_TIMEOUT_MS * 3);
      expect(readyCount(events)).toBe(1);
      expect(events.some((event) => event.type === "failed")).toBe(false);
    });

    it("re-gates a replaced stream: the old stream's signal is ignored and the new one must play", async () => {
      vi.useFakeTimers();
      const { events, call } = await connected();
      const first = remote("playable", "playable");
      call.setRemote(first.participant);
      call.emit("track-started");
      const firstStream = lastStream(events);
      reportRemoteVideoPlaying(firstStream);
      expect(readyCount(events)).toBe(1);
      // Re-subscribe: Daily hands over fresh tracks.
      const second = remote("playable", "playable");
      call.setRemote(second.participant);
      call.emit("track-started");
      expect(streamEvents(events)).toHaveLength(2);
      const secondStream = lastStream(events);
      expect(secondStream).not.toBe(firstStream);
      // A late signal from the replaced stream must not release the new one: the new watchdog is still armed.
      reportRemoteVideoPlaying(firstStream);
      vi.advanceTimersByTime(VIDEO_FIRST_TIMEOUT_MS);
      expect(events.at(-1)).toEqual({ type: "failed", reason: "video_lost" });
      expect(readyCount(events)).toBe(1);
    });

    it("lets a replaced stream that does play keep the call live without a second ready", async () => {
      vi.useFakeTimers();
      const { events, call } = await connected();
      call.setRemote(remote("playable", "playable").participant);
      call.emit("track-started");
      reportRemoteVideoPlaying(lastStream(events));
      call.setRemote(remote("playable", "playable").participant);
      call.emit("track-started");
      reportRemoteVideoPlaying(lastStream(events));
      vi.advanceTimersByTime(VIDEO_FIRST_TIMEOUT_MS * 2);
      expect(readyCount(events)).toBe(1);
      expect(events.some((event) => event.type === "failed")).toBe(false);
    });

    it("end after gating stops local tracks, detaches the remote stream, cancels the timeout and ignores late signals", async () => {
      vi.useFakeTimers();
      const { events, controller, call } = await connected();
      expect(await controller.setCamera(true)).toBe(true);
      const preview = (events.find((event) => event.type === "local-preview" && event.stream) as unknown as { stream: FakeMediaStream }).stream;
      const previewTrack = preview.getTracks()[0] as FakeTrack;
      call.setRemote(remote("playable", "playable").participant);
      call.emit("track-started");
      const stream = lastStream(events);
      reportRemoteVideoPlaying(stream);
      await controller.end();
      expect(call.setLocalAudio).toHaveBeenCalledWith(false);
      expect(call.localMic.stop).toHaveBeenCalled();
      expect(previewTrack.stop).toHaveBeenCalled();
      expect(call.destroy).toHaveBeenCalledTimes(1);
      expect(events.slice(-2)).toEqual([{ type: "remote-stream", stream: null }, { type: "local-preview", stream: null }]);
      const count = events.length;
      reportRemoteVideoPlaying(stream);
      call.emit("track-started");
      vi.advanceTimersByTime(VIDEO_FIRST_TIMEOUT_MS * 3);
      expect(events).toHaveLength(count);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("end while still gated cancels the timeout so no failure fires afterwards", async () => {
      vi.useFakeTimers();
      const { events, controller, call } = await connected();
      call.setRemote(remote("playable", "playable").participant);
      call.emit("track-started");
      await controller.end();
      vi.advanceTimersByTime(VIDEO_FIRST_TIMEOUT_MS * 2);
      expect(events.some((event) => event.type === "failed" || event.type === "ready")).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

describe("Daily media controller: live interactions (1A)", () => {
  const tavusCredential: MediaCredential = { ...credential, roomUrl: "https://tavus.daily.co/c123456" };

  function liveSetup(cred = tavusCredential) {
    const events: MediaEvent[] = [];
    const live: LiveEvent[] = [];
    const controller = createDailyController((event) => events.push(event), (event) => live.push(event));
    controllers.push(controller);
    return { events, live, controller, connect: async () => { await controller.connect(cred); return daily.calls.at(-1)!; } };
  }

  function goLive(call: FakeCall, events: MediaEvent[]) {
    call.setRemote(remote("playable", "playable").participant);
    call.emit("track-started");
    reportRemoteVideoPlaying(lastStream(events));
    expect(events.some((event) => event.type === "ready")).toBe(true);
  }

  const app = (call: FakeCall, data: unknown) => call.emit("app-message", { fromId: "pal", data });

  it("emits streaming captions for pal and user, drops legacy duplicates once pal is seen, and drops analysis", async () => {
    const { events, live, connect } = liveSetup();
    const call = await connect();
    const streaming = (role: string, speech: unknown, extra: Record<string, unknown> = {}) =>
      app(call, { message_type: "conversation", event_type: "conversation.utterance.streaming", inference_id: "i1", properties: { role, speech, content_index: 1, ...extra } });
    streaming("replica", "Hey");
    streaming("pal", "Hey, got", { final: false, user_audio_analysis: "sounds nervous" });
    streaming("replica", "Hey, got");
    streaming("pal", "Hey, got a minute?", { final: true, is_interrupted: false });
    streaming("user", "<user_audio_analysis>hesitant</user_audio_analysis>Sure", { final: false });
    streaming("user", "<user_audio_analysis>unterminated tone note");
    streaming("user", 42);
    expect(live).toEqual([
      { type: "caption", speaker: "counterpart", text: "Hey", final: false },
      { type: "caption", speaker: "counterpart", text: "Hey, got", final: false },
      { type: "caption", speaker: "counterpart", text: "Hey, got a minute?", final: true },
      { type: "caption", speaker: "user", text: "Sure", final: false },
    ]);
    expect(JSON.stringify(live)).not.toMatch(/nervous|hesitant|tone note|analysis|inference|content_index/);
    expect(events.filter((event) => event.type === "utterance")).toHaveLength(0);
  });

  it("maps started/stopped speaking for pal, legacy replica and user", async () => {
    const { live, connect } = liveSetup();
    const call = await connect();
    const speak = (event_type: string, role: string) => app(call, { message_type: "conversation", event_type, properties: { role, duration: 1.2, interrupted: false } });
    speak("conversation.started_speaking", "pal");
    speak("conversation.stopped_speaking", "replica");
    speak("conversation.started_speaking", "user");
    speak("conversation.stopped_speaking", "user");
    speak("conversation.started_speaking", "someone");
    expect(live).toEqual([
      { type: "speaking", speaker: "counterpart", speaking: true },
      { type: "speaking", speaker: "counterpart", speaking: false },
      { type: "speaking", speaker: "user", speaking: true },
      { type: "speaking", speaker: "user", speaking: false },
    ]);
  });

  it("reports a weak connection only for Daily's bad network state", async () => {
    const { live, connect } = liveSetup();
    const call = await connect();
    call.emit("network-quality-change", { networkState: "warning" });
    call.emit("network-quality-change", { networkState: "bad" });
    call.emit("network-quality-change", { networkState: "good" });
    expect(live).toEqual([{ type: "network", weak: false }, { type: "network", weak: true }, { type: "network", weak: false }]);
  });

  it("sends interactions only while live, with the conversation id from the room URL, and never after End", async () => {
    const { events, controller, connect } = liveSetup();
    const call = await connect();
    const wrap = buildWrapUp("Jordan")!;
    expect(controller.send(wrap)).toBe(false);
    goLive(call, events);
    expect(controller.send(wrap)).toBe(true);
    const [interrupt, context] = buildAskToWait();
    expect(controller.send(interrupt)).toBe(true);
    expect(controller.send(context)).toBe(true);
    expect(controller.send(buildTypedTurn("Can we move Atlas?")!)).toBe(true);
    expect(controller.send({ event_type: "conversation.append_llm_context", properties: { context: "goal: move Atlas" } } as unknown as Interaction)).toBe(false);
    expect(call.sendAppMessage.mock.calls).toEqual([
      [{ message_type: "conversation", event_type: "conversation.append_llm_context", conversation_id: "c123456", properties: { context: "About 30 seconds remain. Begin wrapping up naturally as Jordan, in character. Do not mention time limits or the app." } }, "*"],
      [{ message_type: "conversation", event_type: "conversation.interrupt", conversation_id: "c123456" }, "*"],
      [{ message_type: "conversation", event_type: "conversation.append_llm_context", conversation_id: "c123456", properties: { context: "The user asked for a moment. Stay quiet until they speak again. If they say something, respond normally." } }, "*"],
      [{ message_type: "conversation", event_type: "conversation.respond", conversation_id: "c123456", properties: { text: "Can we move Atlas?" } }, "*"],
    ]);
    await controller.end();
    expect(controller.send(wrap)).toBe(false);
    expect(call.sendAppMessage).toHaveBeenCalledTimes(4);
  });

  it("does not join a room URL with no conversation id", async () => {
    const { events, connect } = liveSetup({ ...tavusCredential, roomUrl: "https://tavus.daily.co/" });
    await expect(connect()).rejects.toThrow(/could not start/);
    expect(daily.calls).toHaveLength(0);
    expect(events).toContainEqual({ type: "failed", reason: "join" });
  });

  it("cancel while ringing (join still pending) releases the microphone, destroys the call and emits nothing after", async () => {
    let resolveJoin: () => void = () => undefined;
    daily.joinImpl = () => new Promise<void>((resolve) => { resolveJoin = resolve; });
    const { events, live, controller } = liveSetup();
    const connecting = controller.connect(tavusCredential);
    await vi.waitFor(() => expect(daily.calls).toHaveLength(1));
    const call = daily.calls[0];
    await controller.end();
    expect(call.setLocalAudio).toHaveBeenCalledWith(false);
    expect(call.localMic.stop).toHaveBeenCalled();
    expect(call.destroy).toHaveBeenCalledTimes(1);
    resolveJoin();
    await expect(connecting).resolves.toBeUndefined();
    const before = events.length;
    call.setRemote(remote("playable", "playable").participant);
    call.emit("track-started");
    app(call, { event_type: "conversation.started_speaking", properties: { role: "pal" } });
    expect(events).toHaveLength(before);
    expect(live).toEqual([]);
    expect(events.some((event) => event.type === "ready" || event.type === "failed")).toBe(false);
  });
});
