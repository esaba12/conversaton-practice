"use client";

import { useEffect, useRef } from "react";
import { reportRemoteVideoPlaying } from "@/lib/media/daily-controller";

// Local preview: shown muted, never published.
export function StreamVideo({ stream, muted = false }: { stream: MediaStream; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.srcObject = stream;
    return () => { element.srcObject = null; };
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} />;
}

// The subset of HTMLVideoElement the gate uses, so tests can drive it without a DOM.
export type GatedVideoElement = Pick<HTMLVideoElement, "muted" | "srcObject" | "readyState" | "videoWidth" | "addEventListener" | "removeEventListener"> & {
  paused?: boolean;
  play?: () => Promise<void>;
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

const HAVE_CURRENT_DATA = 2;
const frameEvents = ["loadeddata", "resize", "timeupdate"] as const;

// Video-first (Q3): the counterpart's audio stays muted until the picture is actually playing. The element is muted before the stream
// is attached; it unmutes on `playing`, or when it holds a decoded frame (readyState >= HAVE_CURRENT_DATA with a nonzero video size,
// or requestVideoFrameCallback firing). It then reports to the controller, which only then lets the call go live. The returned
// function detaches the stream and removes every listener. Muting here is not pausing: playback continues while audio is gated.
export function gateRemotePlayback(element: GatedVideoElement, stream: MediaStream, onPlaying: (stream: MediaStream) => void = reportRemoteVideoPlaying,
  gestureTarget: Pick<EventTarget, "addEventListener" | "removeEventListener"> | null = typeof document === "undefined" ? null : document) {
  let done = false;
  let detached = false;
  const gestures = ["pointerdown", "keydown"] as const;
  // Browsers may pause an element that unmutes without fresh user activation. Keep the picture going muted and unmute on the next gesture.
  const resumeWithSound = () => {
    if (detached) return;
    gestures.forEach((name) => gestureTarget?.removeEventListener(name, resumeWithSound));
    element.muted = false;
    void element.play?.().catch(() => undefined);
  };
  const keepPlaying = () => {
    if (detached || !element.play) return;
    element.play().catch(() => {
      if (detached) return;
      element.muted = true;
      void element.play?.().catch(() => undefined);
      gestures.forEach((name) => gestureTarget?.addEventListener(name, resumeWithSound));
    });
  };
  let frame: number | undefined;
  const removeListeners = () => {
    element.removeEventListener("playing", release);
    frameEvents.forEach((name) => element.removeEventListener(name, check));
    if (frame !== undefined) element.cancelVideoFrameCallback?.(frame);
    frame = undefined;
  };
  function release() {
    if (done) return;
    done = true;
    removeListeners();
    element.muted = false;
    element.addEventListener("pause", keepPlaying);
    keepPlaying();
    onPlaying(stream);
  }
  function check() {
    if (element.readyState >= HAVE_CURRENT_DATA && element.videoWidth > 0 && !element.paused) release();
  }
  element.muted = true;
  element.addEventListener("playing", release);
  frameEvents.forEach((name) => element.addEventListener(name, check));
  element.srcObject = stream;
  frame = element.requestVideoFrameCallback?.(() => { frame = undefined; release(); });
  check();
  return () => {
    done = true;
    detached = true;
    removeListeners();
    element.removeEventListener("pause", keepPlaying);
    gestures.forEach((name) => gestureTarget?.removeEventListener(name, resumeWithSound));
    element.srcObject = null;
  };
}

// Counterpart media: starts muted, unmutes only once video is playing (see gateRemotePlayback). A replaced stream re-gates.
export function RemoteStreamVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    return element ? gateRemotePlayback(element, stream) : undefined;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted />;
}
