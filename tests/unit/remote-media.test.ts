import { describe, expect, it, vi } from "vitest";
import { gateRemotePlayback, type GatedVideoElement } from "@/components/practice/remote-media";

type Listener = () => void;

// Minimal stand-in for HTMLVideoElement: records muted state, listeners and frame callbacks.
function fakeElement(options: { frames?: boolean } = {}) {
  const listeners = new Map<string, Set<Listener>>();
  const state = { muted: false, srcObject: null as unknown, readyState: 0, videoWidth: 0 };
  const frameCallbacks = new Map<number, () => void>();
  let nextFrame = 1;
  const mutedHistory: boolean[] = [];
  const element = {
    get muted() { return state.muted; },
    set muted(value: boolean) { state.muted = value; mutedHistory.push(value); },
    get srcObject() { return state.srcObject; },
    set srcObject(value: unknown) { state.srcObject = value; },
    get readyState() { return state.readyState; },
    get videoWidth() { return state.videoWidth; },
    addEventListener: vi.fn((name: string, listener: Listener) => { listeners.set(name, (listeners.get(name) ?? new Set()).add(listener)); }),
    removeEventListener: vi.fn((name: string, listener: Listener) => { listeners.get(name)?.delete(listener); }),
    ...(options.frames ? {
      requestVideoFrameCallback: vi.fn((callback: () => void) => { frameCallbacks.set(nextFrame, callback); return nextFrame++; }),
      cancelVideoFrameCallback: vi.fn((handle: number) => { frameCallbacks.delete(handle); }),
    } : {}),
  };
  return {
    element: element as unknown as GatedVideoElement,
    state,
    mutedHistory,
    fire(name: string) { [...(listeners.get(name) ?? [])].forEach((listener) => listener()); },
    listenerCount() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); },
    frameCallbacks,
    cancelFrame: (element as { cancelVideoFrameCallback?: ReturnType<typeof vi.fn> }).cancelVideoFrameCallback,
  };
}
const stream = (name = "stream") => ({ name }) as unknown as MediaStream;

describe("remote media video-first gate", () => {
  it("attaches the stream muted and keeps it muted until video plays", () => {
    const fake = fakeElement();
    const onPlaying = vi.fn();
    const remote = stream();
    gateRemotePlayback(fake.element, remote, onPlaying);
    expect(fake.state.srcObject).toBe(remote);
    expect(fake.state.muted).toBe(true);
    // Metadata and audio-ish events without a decoded video frame do not release audio.
    fake.state.readyState = 4;
    fake.fire("loadeddata");
    fake.fire("timeupdate");
    expect(fake.state.muted).toBe(true);
    expect(onPlaying).not.toHaveBeenCalled();
  });

  it("unmutes and reports exactly once when the element fires playing", () => {
    const fake = fakeElement();
    const onPlaying = vi.fn();
    const remote = stream();
    gateRemotePlayback(fake.element, remote, onPlaying);
    fake.fire("playing");
    fake.fire("playing");
    expect(fake.state.muted).toBe(false);
    expect(onPlaying).toHaveBeenCalledTimes(1);
    expect(onPlaying).toHaveBeenCalledWith(remote);
    expect(fake.mutedHistory).toEqual([true, false]);
  });

  it("also unmutes on a decoded frame (readyState and video size) before playing fires", () => {
    const fake = fakeElement();
    const onPlaying = vi.fn();
    gateRemotePlayback(fake.element, stream(), onPlaying);
    fake.state.readyState = 2;
    fake.fire("loadeddata");
    expect(onPlaying).not.toHaveBeenCalled();
    fake.state.videoWidth = 640;
    fake.fire("resize");
    expect(fake.state.muted).toBe(false);
    expect(onPlaying).toHaveBeenCalledTimes(1);
  });

  it("unmutes when requestVideoFrameCallback presents a frame, when available", () => {
    const fake = fakeElement({ frames: true });
    const onPlaying = vi.fn();
    gateRemotePlayback(fake.element, stream(), onPlaying);
    expect(fake.frameCallbacks.size).toBe(1);
    expect(fake.state.muted).toBe(true);
    [...fake.frameCallbacks.values()][0]();
    expect(fake.state.muted).toBe(false);
    expect(onPlaying).toHaveBeenCalledTimes(1);
    expect(fake.listenerCount()).toBe(0);
  });

  it("cancels the pending frame callback when playing wins", () => {
    const fake = fakeElement({ frames: true });
    gateRemotePlayback(fake.element, stream(), vi.fn());
    fake.fire("playing");
    expect(fake.cancelFrame).toHaveBeenCalledTimes(1);
    expect(fake.frameCallbacks.size).toBe(0);
  });

  it("a video that never plays leaves audio muted", () => {
    const fake = fakeElement({ frames: true });
    const onPlaying = vi.fn();
    gateRemotePlayback(fake.element, stream(), onPlaying);
    fake.fire("loadeddata");
    fake.fire("resize");
    fake.fire("timeupdate");
    expect(fake.mutedHistory).toEqual([true]);
    expect(onPlaying).not.toHaveBeenCalled();
  });

  it("re-gates a replaced stream: muted again, new signal, and the old one stays silent", () => {
    const fake = fakeElement();
    const onPlaying = vi.fn();
    const first = stream("first");
    const second = stream("second");
    const detachFirst = gateRemotePlayback(fake.element, first, onPlaying);
    fake.fire("playing");
    expect(fake.state.muted).toBe(false);
    // Effect cleanup, then the next effect run for the new stream.
    detachFirst();
    gateRemotePlayback(fake.element, second, onPlaying);
    expect(fake.state.srcObject).toBe(second);
    expect(fake.state.muted).toBe(true);
    expect(onPlaying).toHaveBeenCalledTimes(1);
    fake.fire("playing");
    expect(fake.state.muted).toBe(false);
    expect(onPlaying).toHaveBeenLastCalledWith(second);
    expect(onPlaying).toHaveBeenCalledTimes(2);
  });

  it("detaching before playing removes every listener and never reports or unmutes", () => {
    const fake = fakeElement({ frames: true });
    const onPlaying = vi.fn();
    const detach = gateRemotePlayback(fake.element, stream(), onPlaying);
    expect(fake.listenerCount()).toBeGreaterThan(0);
    detach();
    expect(fake.listenerCount()).toBe(0);
    expect(fake.state.srcObject).toBeNull();
    expect(fake.frameCallbacks.size).toBe(0);
    fake.fire("playing");
    expect(fake.state.muted).toBe(true);
    expect(onPlaying).not.toHaveBeenCalled();
  });

  it("detaching after playing detaches the stream and is safe to repeat", () => {
    const fake = fakeElement();
    const onPlaying = vi.fn();
    const detach = gateRemotePlayback(fake.element, stream(), onPlaying);
    fake.fire("playing");
    detach();
    detach();
    expect(fake.state.srcObject).toBeNull();
    expect(fake.listenerCount()).toBe(0);
    expect(onPlaying).toHaveBeenCalledTimes(1);
  });
});
