// Green-room microphone and optional camera (docs/32 S2). Nothing is requested until the user acts.
// Every stream this module acquires is stopped on release (leave, sign-out, page hide), on hand-off
// (I'm ready: the call provider opens its own microphone) and on error. A permission prompt that
// resolves after a release is stopped at once, so a late grant can never leave the mic open.
// The camera is off unless the user opts in, and is a local preview only: it is never published.

export type MicProblem = "denied" | "no-device" | "busy" | "unsupported" | "failed";
export type MicDevice = { deviceId: string; label: string };

export type GreenRoomMediaState = {
  readonly mic: "idle" | "requesting" | "live" | "problem";
  readonly problem: MicProblem | null;
  readonly micStream: MediaStream | null;
  readonly devices: readonly MicDevice[];
  readonly deviceId: string | null;
  readonly camera: "off" | "requesting" | "on" | "unavailable";
  readonly cameraStream: MediaStream | null;
};

export const idleGreenRoomMedia: GreenRoomMediaState = {
  mic: "idle", problem: null, micStream: null, devices: [], deviceId: null, camera: "off", cameraStream: null,
};

export type MediaHandoff = { micDeviceId: string | null };

export function micProblem(error: unknown): MicProblem {
  const name = typeof error === "object" && error !== null && "name" in error ? String((error as { name: unknown }).name) : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return "denied";
    case "NotFoundError":
    case "OverconstrainedError":
    case "DevicesNotFoundError":
      return "no-device";
    case "NotReadableError":
    case "AbortError":
    case "TrackStartError":
      return "busy";
    case "TypeError":
      return "unsupported";
    default:
      return "failed";
  }
}

export function stopStream(stream: MediaStream | null | undefined) {
  if (!stream) return;
  for (const track of stream.getTracks()) track.stop();
}

export async function listMicrophones(mediaDevices: Pick<MediaDevices, "enumerateDevices">): Promise<MicDevice[]> {
  try {
    const all = await mediaDevices.enumerateDevices();
    return all
      .filter((device) => device.kind === "audioinput" && device.deviceId)
      .map((device, index) => ({ deviceId: device.deviceId, label: device.label || `Microphone ${index + 1}` }));
  } catch {
    return [];
  }
}

function micTrackDeviceId(stream: MediaStream): string | null {
  const track = stream.getAudioTracks()[0];
  const id = track?.getSettings?.().deviceId;
  return typeof id === "string" && id ? id : null;
}

export type GreenRoomMedia = {
  getState: () => GreenRoomMediaState;
  subscribe: (listener: () => void) => () => void;
  /** User action only: "Allow microphone", "Try again", or picking another microphone. */
  allowMic: (deviceId?: string) => Promise<void>;
  /** User action only: the "Show my camera to me only" toggle. */
  setCamera: (on: boolean) => Promise<void>;
  /** I'm ready: stops every local stream and returns the chosen microphone for the call provider. */
  handOff: () => MediaHandoff;
  /** Leave, sign-out, page hide, unmount: stops every local stream. Safe to call any number of times. */
  release: () => void;
};

type Options = { mediaDevices?: () => MediaDevices | null | undefined };

function defaultDevices(): MediaDevices | null {
  return typeof navigator !== "undefined" && navigator.mediaDevices ? navigator.mediaDevices : null;
}

export function createGreenRoomMedia(options: Options = {}): GreenRoomMedia {
  const resolveDevices = options.mediaDevices ?? defaultDevices;
  let state: GreenRoomMediaState = idleGreenRoomMedia;
  // Bumped on every new request and every release; a request whose token is stale stops what it got.
  let micToken = 0;
  let cameraToken = 0;
  const listeners = new Set<() => void>();

  function set(patch: Partial<GreenRoomMediaState>) {
    state = { ...state, ...patch };
    for (const listener of [...listeners]) listener();
  }

  function dropMic(problem: MicProblem | null) {
    micToken++;
    const stream = state.micStream;
    stopStream(stream);
    if (stream || state.mic !== "idle" || problem) set({ mic: problem ? "problem" : "idle", problem, micStream: null });
  }

  function dropCamera(camera: GreenRoomMediaState["camera"] = "off") {
    cameraToken++;
    const stream = state.cameraStream;
    stopStream(stream);
    if (stream || state.camera !== camera) set({ camera, cameraStream: null });
  }

  async function allowMic(deviceId?: string) {
    const devices = resolveDevices();
    if (!devices?.getUserMedia) { dropMic("unsupported"); return; }
    const token = ++micToken;
    set({ mic: state.micStream ? "live" : "requesting", problem: null });
    let stream: MediaStream;
    try {
      stream = await devices.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true, video: false });
    } catch (error) {
      if (token !== micToken) return;
      // A failed switch keeps nothing half-open: the previous stream is released too.
      dropMic(micProblem(error));
      return;
    }
    if (token !== micToken) { stopStream(stream); return; }
    if (stream.getAudioTracks().length === 0) { stopStream(stream); dropMic("no-device"); return; }
    const previous = state.micStream;
    if (previous && previous !== stream) stopStream(previous);
    for (const track of stream.getAudioTracks()) {
      track.addEventListener?.("ended", () => { if (state.micStream === stream) dropMic("failed"); });
    }
    set({ mic: "live", problem: null, micStream: stream, deviceId: deviceId ?? micTrackDeviceId(stream) });
    const list = await listMicrophones(devices);
    if (token === micToken && state.micStream === stream) set({ devices: list });
  }

  async function setCamera(on: boolean) {
    if (!on) { dropCamera(); return; }
    const devices = resolveDevices();
    if (!devices?.getUserMedia) { dropCamera("unavailable"); return; }
    const token = ++cameraToken;
    set({ camera: "requesting" });
    let stream: MediaStream;
    try {
      stream = await devices.getUserMedia({ video: true, audio: false });
    } catch {
      if (token === cameraToken) dropCamera("unavailable");
      return;
    }
    if (token !== cameraToken) { stopStream(stream); return; }
    set({ camera: "on", cameraStream: stream });
  }

  function release() {
    dropMic(null);
    dropCamera();
    if (state.devices.length || state.deviceId) set({ devices: [], deviceId: null });
  }

  function handOff(): MediaHandoff {
    const micDeviceId = state.deviceId;
    release();
    return { micDeviceId };
  }

  return {
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    allowMic,
    setCamera,
    handOff,
    release,
  };
}
