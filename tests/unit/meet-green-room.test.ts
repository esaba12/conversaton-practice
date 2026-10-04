import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GreenRoom } from "@/components/practice/green-room";
import { MeetCard, meetStateFromProgress, meetStatusText, type MeetCardProps } from "@/components/practice/meet-card";
import {
  knowsFields, meetKnowledge, neverSees, personRole, personStartSituation, reflectionDisclosure, roleProblem, situationFromRole, toneNotice,
} from "@/components/practice/meet-knowledge";
import { manager } from "@/fixtures/manager";
import { roommate } from "@/fixtures/roommate";
import { createGreenRoomMedia, micProblem } from "@/lib/practice/devices";
import { litBars, METER_BARS, rmsLevel, startMicMeter } from "@/lib/practice/mic-meter";
import { clearPrivateState, readPrivateState, updatePrivateState } from "@/lib/practice/private-state";
import type { DraftResponse } from "@/lib/schemas/draft";
import type { Person } from "@/lib/schemas/people";
import { situationSchema } from "@/lib/schemas/situation";
import { SessionClientError, startPresetSession, startSavedPersonSession, startSession } from "@/lib/session/api-client";
import { draftStreamBody, idleDraftProgress, parseSse, reduceDraftProgress, streamDraft } from "@/lib/setup/draft-stream-client";

const GOAL = "GOAL-SENTINEL ask to move one project";
const HARD = "HARD-SENTINEL I get that, and I still need";
const FEAR = "FEAR-SENTINEL they will say I am not a team player";
const LIKELY = 87;
const NOTES = "NOTES-SENTINEL private";

afterEach(() => { clearPrivateState(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function fillPrivate() {
  updatePrivateState({ goal: GOAL, hardMomentLine: HARD, prediction: FEAR, likelihoodBefore: LIKELY });
}

// --- Fake media ---

type FakeTrack = { kind: string; stop: ReturnType<typeof vi.fn>; stopped: boolean; ended: () => void; addEventListener: (type: string, fn: () => void) => void; getSettings: () => { deviceId: string } };
function fakeTrack(kind: "audio" | "video", deviceId = "mic-1"): FakeTrack {
  const listeners: (() => void)[] = [];
  const track: FakeTrack = {
    kind, stopped: false, stop: vi.fn(() => { track.stopped = true; }),
    ended: () => { for (const fn of listeners) fn(); },
    addEventListener: (type, fn) => { if (type === "ended") listeners.push(fn); },
    getSettings: () => ({ deviceId }),
  };
  return track;
}
function fakeStream(tracks: FakeTrack[]) {
  return { getTracks: () => tracks, getAudioTracks: () => tracks.filter((t) => t.kind === "audio") } as unknown as MediaStream;
}
function tracksOf(stream: MediaStream) { return stream.getTracks() as unknown as FakeTrack[]; }

function fakeDevices(getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>) {
  const gum = vi.fn(getUserMedia);
  const devices = {
    getUserMedia: gum,
    enumerateDevices: vi.fn(async () => [
      { kind: "audioinput", deviceId: "mic-1", label: "Built-in" },
      { kind: "audioinput", deviceId: "mic-2", label: "" },
      { kind: "videoinput", deviceId: "cam-1", label: "Camera" },
    ]),
  } as unknown as MediaDevices;
  return { devices, gum };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe("mic meter", () => {
  it("maps levels to bars, lighting one bar for any audible level", () => {
    expect(litBars(0)).toBe(0);
    expect(litBars(-1)).toBe(0);
    expect(litBars(Number.NaN)).toBe(0);
    expect(litBars(0.001)).toBe(1);
    expect(litBars(0.5)).toBe(6);
    expect(litBars(2)).toBe(METER_BARS);
  });

  it("computes a 0–1 level from 8-bit samples", () => {
    expect(rmsLevel(new Uint8Array(64).fill(128))).toBe(0);
    expect(rmsLevel(new Uint8Array(64).fill(255))).toBe(1);
    expect(rmsLevel([])).toBe(0);
  });

  it("stops by closing its audio context without stopping the stream's tracks", () => {
    const track = fakeTrack("audio");
    const close = vi.fn(async () => undefined);
    const disconnect = vi.fn();
    class FakeContext {
      createMediaStreamSource() { return { connect: vi.fn(), disconnect }; }
      createAnalyser() { return { fftSize: 0, getByteTimeDomainData: (array: Uint8Array) => array.fill(200) }; }
      close = close;
    }
    let frame: (() => void) | null = null;
    const levels: number[] = [];
    const meter = startMicMeter(fakeStream([track]), (level) => levels.push(level), {
      AudioContext: FakeContext as unknown as typeof AudioContext, requestFrame: (fn) => { frame = fn; return 1; }, cancelFrame: vi.fn(),
    });
    expect(meter).not.toBeNull();
    frame!();
    expect(levels[0]).toBeGreaterThan(0);
    meter!.stop();
    meter!.stop();
    expect(close).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(levels.at(-1)).toBe(0);
    expect(track.stop).not.toHaveBeenCalled();
  });

  it("returns null when Web Audio is unavailable", () => {
    expect(startMicMeter(fakeStream([]), () => undefined, { AudioContext: undefined, requestFrame: undefined, cancelFrame: undefined })).toBeNull();
  });
});

describe("green-room media (S2)", () => {
  it("asks for nothing until the user acts, and never asks for the camera with the microphone", async () => {
    const { devices, gum } = fakeDevices(async () => fakeStream([fakeTrack("audio")]));
    const media = createGreenRoomMedia({ mediaDevices: () => devices });
    expect(gum).not.toHaveBeenCalled();
    await media.allowMic();
    expect(gum).toHaveBeenCalledTimes(1);
    expect(gum.mock.calls[0][0]).toEqual({ audio: true, video: false });
    expect(media.getState()).toMatchObject({ mic: "live", deviceId: "mic-1", camera: "off", cameraStream: null });
    expect(media.getState().devices).toEqual([{ deviceId: "mic-1", label: "Built-in" }, { deviceId: "mic-2", label: "Microphone 2" }]);
  });

  it("releases the microphone and camera on leave", async () => {
    const mic = fakeStream([fakeTrack("audio")]);
    const camera = fakeStream([fakeTrack("video")]);
    const { devices } = fakeDevices(async (c) => (c.video ? camera : mic));
    const media = createGreenRoomMedia({ mediaDevices: () => devices });
    await media.allowMic();
    await media.setCamera(true);
    expect(media.getState().camera).toBe("on");
    media.release();
    expect(tracksOf(mic).every((t) => t.stopped)).toBe(true);
    expect(tracksOf(camera).every((t) => t.stopped)).toBe(true);
    expect(media.getState()).toMatchObject({ mic: "idle", micStream: null, camera: "off", cameraStream: null });
    media.release();
  });

  it("releases everything on ready and hands over the chosen microphone id", async () => {
    const mic = fakeStream([fakeTrack("audio", "mic-2")]);
    const { devices, gum } = fakeDevices(async () => mic);
    const media = createGreenRoomMedia({ mediaDevices: () => devices });
    await media.allowMic("mic-2");
    expect(gum.mock.calls[0][0]).toEqual({ audio: { deviceId: { exact: "mic-2" } }, video: false });
    expect(media.handOff()).toEqual({ micDeviceId: "mic-2" });
    expect(tracksOf(mic)[0].stopped).toBe(true);
    expect(media.getState().micStream).toBeNull();
  });

  it("holds nothing after an error, and maps the error to a designed state", async () => {
    for (const [name, problem] of [["NotAllowedError", "denied"], ["NotFoundError", "no-device"], ["NotReadableError", "busy"], ["Weird", "failed"]] as const) {
      const { devices } = fakeDevices(async () => { throw Object.assign(new Error("x"), { name }); });
      const media = createGreenRoomMedia({ mediaDevices: () => devices });
      await media.allowMic();
      expect(media.getState()).toMatchObject({ mic: "problem", problem, micStream: null });
    }
    expect(micProblem(undefined)).toBe("failed");
    const unsupported = createGreenRoomMedia({ mediaDevices: () => null });
    await unsupported.allowMic();
    expect(unsupported.getState().problem).toBe("unsupported");
  });

  it("stops a stream whose prompt resolves after the user left", async () => {
    const pending = deferred<MediaStream>();
    const { devices } = fakeDevices(() => pending.promise);
    const media = createGreenRoomMedia({ mediaDevices: () => devices });
    const asked = media.allowMic();
    expect(media.getState().mic).toBe("requesting");
    media.release();
    const late = fakeStream([fakeTrack("audio")]);
    pending.resolve(late);
    await asked;
    expect(tracksOf(late)[0].stopped).toBe(true);
    expect(media.getState()).toMatchObject({ mic: "idle", micStream: null });
  });

  it("stops the old stream when switching microphones, and releases it if the switch fails", async () => {
    const first = fakeStream([fakeTrack("audio", "mic-1")]);
    const second = fakeStream([fakeTrack("audio", "mic-2")]);
    let next: () => Promise<MediaStream> = async () => first;
    const { devices } = fakeDevices(() => next());
    const media = createGreenRoomMedia({ mediaDevices: () => devices });
    await media.allowMic();
    next = async () => second;
    await media.allowMic("mic-2");
    expect(tracksOf(first)[0].stopped).toBe(true);
    expect(media.getState()).toMatchObject({ micStream: second, deviceId: "mic-2" });
    next = async () => { throw Object.assign(new Error("x"), { name: "NotReadableError" }); };
    await media.allowMic("mic-1");
    expect(tracksOf(second)[0].stopped).toBe(true);
    expect(media.getState()).toMatchObject({ mic: "problem", problem: "busy", micStream: null });
  });

  it("releases the microphone when its track ends, and handles a camera that can't start", async () => {
    const track = fakeTrack("audio");
    const { devices } = fakeDevices(async (c) => { if (c.video) throw Object.assign(new Error("x"), { name: "NotAllowedError" }); return fakeStream([track]); });
    const media = createGreenRoomMedia({ mediaDevices: () => devices });
    await media.allowMic();
    track.ended();
    expect(media.getState()).toMatchObject({ mic: "problem", problem: "failed", micStream: null });
    expect(track.stopped).toBe(true);
    await media.setCamera(true);
    expect(media.getState()).toMatchObject({ camera: "unavailable", cameraStream: null });
  });

  it("stops a camera stream that arrives after the toggle was turned off", async () => {
    const pending = deferred<MediaStream>();
    const { devices } = fakeDevices(() => pending.promise);
    const media = createGreenRoomMedia({ mediaDevices: () => devices });
    const on = media.setCamera(true);
    await media.setCamera(false);
    const late = fakeStream([fakeTrack("video")]);
    pending.resolve(late);
    await on;
    expect(tracksOf(late)[0].stopped).toBe(true);
    expect(media.getState().camera).toBe("off");
  });
});

// --- W11 stream client ---

const draft: DraftResponse = {
  role: manager, goal: "Ask to move one project to next sprint.", assumptions: ["You work together."],
  stanceOptions: {
    wants: [manager.wants!, "Not lose a good person", "Hear a plan"],
    holdsBackBecause: [manager.holdsBackBecause!, "Already said yes", "Thinks you can stretch"],
    softensWhen: [manager.softensWhen!, "You offer a trade", "You name a date"],
  },
};

function sse(events: [string, unknown][]) {
  return events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");
}
function streamResponse(text: string, chunk = 17) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < text.length; i += chunk) controller.enqueue(encoder.encode(text.slice(i, i + chunk)));
      controller.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/event-stream; charset=utf-8" } });
}
const requestId = "0c7a2f8e-3b9d-4e1f-8a6c-2d5e7f9b1c3a";

describe("W11 draft stream client", () => {
  it("parses events across chunk boundaries and CRLF", () => {
    const first = parseSse("event: field\r\ndata: {\"a\":1}\r\n\r\nevent: do");
    expect(first.events).toEqual([{ event: "field", data: "{\"a\":1}" }]);
    expect(parseSse(`${first.rest}ne\ndata: 2\n\n`).events).toEqual([{ event: "done", data: "2" }]);
  });

  it("asks for the stream, sends only the draft fields, emits fields in order, and returns only the validated done", async () => {
    fillPrivate();
    const fetchMock = vi.fn(async () => streamResponse(sse([
      ["field", { field: "role", value: manager }],
      ["field", { field: "goal", value: draft.goal }],
      ["field", { field: "future", value: 1 }],
      ["field", { field: "stanceOptions", value: draft.stanceOptions }],
      ["done", draft],
    ])));
    vi.stubGlobal("fetch", fetchMock);
    const fields: string[] = [];
    const result = await streamDraft({ situation: "I need to ask Jordan to move a project.", personId: "5b8f1f1e-6d2a-4c1b-9a51-0d4b9b6f2a11" }, (f) => fields.push(f.field));
    expect(result).toEqual(draft);
    expect(fields).toEqual(["role", "goal", "stanceOptions"]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/scenarios/draft");
    expect((init.headers as Record<string, string>).Accept).toBe("text/event-stream");
    const raw = init.body as string;
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(["personId", "situation"]);
    for (const secret of [GOAL, HARD, FEAR, String(LIKELY)]) expect(raw).not.toContain(secret);
  });

  it("keeps the body to the four draft fields even if extra keys are passed", () => {
    const body = draftStreamBody({ situation: "x", goal: "g", privateNotes: NOTES, ...{ prediction: FEAR, hardMomentLine: HARD } } as never);
    expect(Object.keys(body).sort()).toEqual(["goal", "privateNotes", "situation"]);
    expect(() => draftStreamBody({ situation: "" })).toThrow(SessionClientError);
  });

  it("turns an error event into a SessionClientError and never returns a partial", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => streamResponse(sse([
      ["field", { field: "role", value: manager }],
      ["error", { code: "OUT_OF_SCOPE", message: "Outside what this can practice.", retryable: false, request_id: requestId }],
    ]))));
    const error = await streamDraft({ situation: "x" }, () => undefined).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SessionClientError);
    expect(error).toMatchObject({ code: "OUT_OF_SCOPE", retryable: false });
  });

  it("rejects a stream that ends without done, or carries an invalid known field", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => streamResponse(sse([["field", { field: "role", value: manager }]]))));
    await expect(streamDraft({ situation: "x" }, () => undefined)).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
    vi.stubGlobal("fetch", vi.fn(async () => streamResponse(sse([["field", { field: "role", value: { name: "" } }], ["done", draft]]))));
    await expect(streamDraft({ situation: "x" }, () => undefined)).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });

  it("handles JSON errors before the stream and a plain JSON draft", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "USAGE_LIMIT", message: "Too many.", retryable: false, request_id: requestId }, { status: 429 })));
    await expect(streamDraft({ situation: "x" }, () => undefined)).rejects.toMatchObject({ code: "USAGE_LIMIT", status: 429 });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(draft)));
    await expect(streamDraft({ situation: "x" }, () => undefined)).resolves.toEqual(draft);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    await expect(streamDraft({ situation: "x" }, () => undefined)).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("reduces progress: reading → shaping → ready, and ignores late events", () => {
    let state = reduceDraftProgress(idleDraftProgress, { type: "sent" });
    expect(meetStateFromProgress(state, null)).toEqual({ status: "streaming", step: "reading" });
    state = reduceDraftProgress(state, { type: "field", field: { field: "goal", value: "g" } });
    expect(meetStateFromProgress(state, null)).toMatchObject({ status: "streaming", step: "reading" });
    state = reduceDraftProgress(state, { type: "field", field: { field: "role", value: manager } });
    expect(meetStateFromProgress(state, null)).toMatchObject({ status: "streaming", step: "shaping", partialRole: manager });
    expect(JSON.stringify(state)).not.toContain("\"g\"");
    state = reduceDraftProgress(state, { type: "done", draft });
    const edited = { ...manager, wants: "Not lose a good person" };
    expect(meetStateFromProgress(state, edited)).toMatchObject({ status: "ready", role: edited, streamed: true });
    expect(reduceDraftProgress(state, { type: "failed", message: "x", code: "INTERNAL_ERROR", retryable: true })).toBe(state);
    const failed = reduceDraftProgress(reduceDraftProgress(idleDraftProgress, { type: "sent" }), { type: "failed", message: "No", code: "OUT_OF_SCOPE", retryable: false });
    expect(meetStateFromProgress(failed, null)).toEqual({ status: "error", message: "No", outOfScope: true, retryable: false });
    expect(meetStatusText({ status: "streaming", step: "reading" }, "Jordan")).toBe("Reading your situation");
    expect(meetStatusText({ status: "streaming", step: "shaping" }, "Jordan")).toBe("Shaping Jordan");
    expect(meetStatusText({ status: "ready", role: manager, streamed: true }, "Jordan")).toBe("Ready");
  });
});

// --- U2 and W4 ---

const session = { id: "5b8f1f1e-6d2a-4c1b-9a51-0d4b9b6f2a11", status: "connecting", expiresAt: "2026-10-03T19:10:00.000Z", cleanup: "not_started" };
const credential = { provider: "tavus", roomUrl: "https://tavus.daily.co/room", meetingToken: "unit-token", expiresAt: "2026-10-03T19:10:00.000Z" };
function stubStart() {
  const fetchMock = vi.fn(async () => Response.json({ session, credential }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  return () => (fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string;
}
const key = "9d1c2b3a-4e5f-4a6b-8c7d-0e1f2a3b4c5d";
const at = "2026-10-03T21:20:00.000Z";
const maya: Person = {
  id: "00000000-0000-4000-8000-000000000001", version: 2, name: "Maya", relationship: "Roommate", style: "Direct.", background: "Lived together a year.",
  publicContext: "Dishes.", opening: "Hey.", constraints: [], challenge: "neutral", pace: "conversational", traits: { tone: "warm" }, sharedFactIds: [], createdAt: at, updatedAt: at,
};

describe("U2 knowledge panel", () => {
  it("Knows equals the role start body's fields by name, with and without stance chips", async () => {
    const body = stubStart();
    for (const role of [manager, roommate, { ...manager, wants: "Not lose a good person", softensWhen: undefined }]) {
      await startSession({ role, durationSeconds: 180, idempotencyKey: key });
      const sent = Object.keys(JSON.parse(body()).role).sort();
      expect(knowsFields(meetKnowledge(role, { kind: "role" })).sort()).toEqual(sent);
      expect(knowsFields(meetKnowledge(role, { kind: "role" }), "server")).toEqual([]);
    }
  });

  it("a saved person's custom scene matches the situation body; identity and shared facts come from the server", () => {
    const edited = { ...personRole(maya), opening: "Got a sec?", wants: "Keep the peace" };
    expect(personStartSituation(maya, personRole(maya))).toBe("default");
    expect(personStartSituation(maya, edited)).toBe("custom");
    const custom = meetKnowledge(edited, { kind: "person", person: maya, sharedFacts: ["I work nights"], situation: "custom" });
    const situation = situationSchema.parse(situationFromRole(edited));
    expect(knowsFields(custom, "body").sort()).toEqual(Object.keys(situation).sort());
    expect(knowsFields(custom, "server")).toEqual(["name", "role", "style", "background", "traits", "knownAboutUser"]);
    const byDefault = meetKnowledge(edited, { kind: "person", person: maya, sharedFacts: [], situation: "default" });
    expect(knowsFields(byDefault, "body")).toEqual([]);
    expect(knowsFields(byDefault)).not.toContain("wants");
    expect(byDefault.find((entry) => entry.field === "opening")?.text).toBe("Hey.");
  });

  it("a starter's Knows is the fixture the server loads", () => {
    expect(knowsFields(meetKnowledge(manager, { kind: "preset", preset: "manager" }), "server").sort()).toEqual(Object.keys(manager).sort());
  });

  it("Never sees lists only what the user filled, by label, never the text", () => {
    expect(neverSees(readPrivateState())).toEqual([]);
    updatePrivateState({ hardMomentLine: HARD, likelihoodBefore: 0 });
    expect(neverSees(readPrivateState()).map((entry) => entry.key)).toEqual(["hardMomentLine", "likelihoodBefore"]);
    fillPrivate();
    const all = neverSees(readPrivateState(), NOTES);
    expect(all.map((entry) => entry.label)).toEqual(["Your line", "When it gets hard", "Your notes", "What you’re worried about", "Your guess"]);
    expect(JSON.stringify(all)).not.toMatch(/SENTINEL/);
  });

  it("names the first invalid field for the Call reason", () => {
    expect(roleProblem(manager)).toBeNull();
    expect(roleProblem({ ...manager, opening: "" })).toMatchObject({ field: "opening" });
    expect(roleProblem({ ...manager, constraints: Array(6).fill("x") })).toMatchObject({ field: "constraints" });
  });
});

describe("W4 before: private fields never enter a start body", () => {
  it("role, preset and saved-person starts carry no goal, hard-moment line, fear or likelihood", async () => {
    fillPrivate();
    const body = stubStart();
    await startSession({ role: manager, durationSeconds: 180, idempotencyKey: key });
    const bodies = [body()];
    await startPresetSession({ preset: "manager", durationSeconds: 180, idempotencyKey: key });
    bodies.push(body());
    await startSavedPersonSession({ personId: maya.id, expectedVersion: 2, durationSeconds: 300, idempotencyKey: key });
    bodies.push(body());
    for (const raw of bodies) {
      for (const secret of [GOAL, HARD, FEAR, "likelihood", "prediction", "goal", "hardMomentLine"]) expect(raw).not.toContain(secret);
    }
    expect(readPrivateState()).toMatchObject({ prediction: FEAR, likelihoodBefore: LIKELY });
  });
});

// --- Rendering ---

function meetProps(extra: Partial<MeetCardProps>): MeetCardProps {
  return {
    identity: { name: "Jordan", relationship: "Your manager", portraitSrc: "/api/portraits/manager" }, state: { status: "streaming", step: "reading" },
    onRoleChange: () => undefined, start: { kind: "role" }, durationSeconds: 180, onDurationChange: () => undefined, onBack: () => undefined, onCall: () => undefined, ...extra,
  };
}

describe("Meet card and green room render", () => {
  it("U1: the identity renders before the draft returns, with the real step and no role fields", () => {
    const html = renderToStaticMarkup(createElement(MeetCard, meetProps({})));
    expect(html).toContain("Jordan");
    expect(html).toContain("Your manager");
    expect(html).toContain("/api/portraits/manager");
    expect(html).toContain("Reading your situation");
    expect(html).not.toContain(manager.opening);
    expect(html).toContain("Wait for Jordan to finish coming together.");
    expect(html).toContain(toneNotice("Jordan"));
  });

  it("S1: a ready card shows the character, stance chips, length, Knows fields and the Call button", () => {
    const html = renderToStaticMarkup(createElement(MeetCard, meetProps({ state: { status: "ready", role: manager, stanceOptions: draft.stanceOptions, streamed: true } })));
    for (const text of [manager.style, manager.opening, "Pushes back a little", "Not lose a good person", "3 min", "5 min", "Call Jordan", "Edit details", "Ready", toneNotice("Jordan")]) {
      expect(html).toContain(text.replace(/'/g, "&#x27;"));
    }
    const fields = [...html.matchAll(/data-knows-field="([^"]+)"/g)].map((match) => match[1]).sort();
    expect(fields).toEqual(Object.keys(manager).sort());
    expect(html).not.toContain("aria-disabled=\"true\" aria-describedby");
  });

  it("S1: an invalid role disables Call with a visible reason and opens the details", () => {
    const html = renderToStaticMarkup(createElement(MeetCard, meetProps({ state: { status: "ready", role: { ...manager, opening: "" } } })));
    expect(html).toContain("needs 1–300 characters");
    expect(html).toContain("aria-invalid=\"true\"");
  });

  it("S2: the green room renders the primer without asking for the microphone, with T1 and D2", () => {
    const gum = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: gum } });
    fillPrivate();
    const html = renderToStaticMarkup(createElement(GreenRoom, { name: "Jordan", onBack: () => undefined, onReady: () => undefined }));
    expect(gum).not.toHaveBeenCalled();
    for (const text of ["Jordan will hear you. You can mute any time.", "Allow microphone", "Show my camera to me only", "Only you will see yourself", "Allow the microphone first.", toneNotice("Jordan"), reflectionDisclosure, "Settle for 60 seconds", "What are you worried Jordan will say?", "How likely does that feel?"]) {
      expect(html).toContain(text.replace(/'/g, "&#x27;"));
    }
    expect(html).not.toContain("<video");
  });
});
