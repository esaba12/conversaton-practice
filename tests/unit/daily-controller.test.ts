import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MediaCredential, MediaEvent } from "@/lib/schemas/media";

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
    destroy: vi.fn(() => Promise.resolve()),
  };
  return call;
}

vi.mock("@daily-co/daily-js", () => ({
  default: { createCallObject: vi.fn((options: unknown) => { const call = makeCall(options); daily.calls.push(call); return call; }) },
}));

const { createDailyController } = await import("@/lib/media/daily-controller");

const credential: MediaCredential = { provider: "tavus", roomUrl: "https://example.daily.co/room", meetingToken: "unit-token", expiresAt: new Date(Date.now() + 600_000).toISOString() };

function remote(videoState: string, audioState: string) {
  const video = fakeTrack("video");
  const audio = fakeTrack("audio");
  return { participant: { local: false, session_id: "replica", tracks: { video: { state: videoState, persistentTrack: video }, audio: { state: audioState, persistentTrack: audio } } }, video, audio };
}

function setup() {
  const events: MediaEvent[] = [];
  const controller = createDailyController((event) => events.push(event));
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
afterEach(() => { vi.unstubAllGlobals(); });

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
    message("user", "Sure, about the kitchen.");
    message("user", "   ");
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
});
