import type { DailyCall, DailyParticipant } from "@daily-co/daily-js";
import { z } from "zod";
import type { MediaController, MediaCredential, MediaEvent } from "@/lib/schemas/media";
import { MAX_TURN_CHARS } from "@/lib/schemas/reflection";
import { conversationIdFromRoomUrl, toAppMessage, type Interaction, type LiveEvent } from "./interactions";

type FailureReason = Extract<MediaEvent, { type: "failed" }>["reason"];

// Tavus documents a legacy duplicate of each counterpart turn with role "replica". It is used only until a "pal" turn has been seen,
// and a repeated inference_id is dropped, so either form yields one turn. The schemas strip every other field, so analysis fields
// such as user_audio_analysis are gone at parse time.
const roleSchema = z.enum(["pal", "user", "replica"]);
const utteranceSchema = z.object({
  event_type: z.literal("conversation.utterance"),
  inference_id: z.string().optional(),
  properties: z.object({ role: roleSchema, speech: z.string() }),
});
const streamingSchema = z.object({
  event_type: z.literal("conversation.utterance.streaming"),
  properties: z.object({ role: roleSchema, speech: z.string(), final: z.boolean().optional() }),
});
const speakingSchema = z.object({
  event_type: z.enum(["conversation.started_speaking", "conversation.stopped_speaking"]),
  properties: z.object({ role: roleSchema }),
});

// Raven tone notes travel in a separate field; an inline tag, if one ever appears, is dropped too.
function spokenText(speech: string) {
  return speech.replace(/<user_(?:audio|visual)_analysis>[\s\S]*?(?:<\/user_(?:audio|visual)_analysis>|$)/g, "").trim().slice(0, MAX_TURN_CHARS).trim();
}

function liveReader() {
  let sawPal = false;
  return (data: unknown): LiveEvent | null => {
    const speaking = speakingSchema.safeParse(data);
    if (speaking.success) {
      const speaker = speaking.data.properties.role === "user" ? "user" : "counterpart";
      return { type: "speaking", speaker, speaking: speaking.data.event_type === "conversation.started_speaking" };
    }
    const parsed = streamingSchema.safeParse(data);
    if (!parsed.success) return null;
    const { role: from, speech, final = false } = parsed.data.properties;
    if (from === "replica" && sawPal) return null;
    if (from === "pal") sawPal = true;
    const text = spokenText(speech);
    if (!text) return null;
    return { type: "caption", speaker: from === "user" ? "user" : "counterpart", text, final };
  };
}

function utteranceReader() {
  let sawPal = false;
  const seen = new Set<string>();
  return (data: unknown): Extract<MediaEvent, { type: "utterance" }> | null => {
    const parsed = utteranceSchema.safeParse(data);
    if (!parsed.success) return null;
    const { role, speech } = parsed.data.properties;
    const text = spokenText(speech);
    if (!text) return null;
    if (role === "user") return { type: "utterance", speaker: "user", text };
    if (role === "replica" && sawPal) return null;
    if (role === "pal") sawPal = true;
    const id = parsed.data.inference_id;
    if (id) { if (seen.has(id)) return null; seen.add(id); }
    return { type: "utterance", speaker: "counterpart", text };
  };
}

// Video-first (Q3): counterpart audio is never allowed to lead the picture. The component that renders the remote stream holds the
// element muted until it sees video play, then calls reportRemoteVideoPlaying with that stream. The signal stays internal to the
// controller and component; it is not a MediaEvent. The controller emits "ready" (which starts the live call) only after it.
// If video does not play within VIDEO_FIRST_TIMEOUT_MS the call fails as "video_lost" instead of continuing as audio only.
export const VIDEO_FIRST_TIMEOUT_MS = 45_000;
const playingReporters = new WeakMap<object, () => void>();
export function reportRemoteVideoPlaying(stream: MediaStream) {
  playingReporters.get(stream)?.();
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function remoteParticipant(call: DailyCall): DailyParticipant | undefined {
  return Object.values(call.participants()).find((participant) => !participant.local && participant.tracks.video?.persistentTrack);
}

function isPermissionDenial(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return name === "NotAllowedError" || /permission|not ?allowed/i.test(message);
}

// The call controller plus the live interaction path (S4, S5, S6). `send` is true only when the message left for the live call.
export type LiveMediaController = MediaController & { send(interaction: Interaction): boolean };

// Browser-only: Daily is imported inside connect so server rendering can import this module safely. `onLive` carries captions,
// speaking state and network quality for the screen; it never carries analysis fields.
export const createDailyController = (onEvent: (event: MediaEvent) => void, onLive: (event: LiveEvent) => void = () => undefined): LiveMediaController => {
  let call: DailyCall | null = null;
  let conversationId: string | null = null;
  let started = false;
  let ended = false;
  let generation = 0;
  let cameraRequest = 0;
  let muted = false;
  let readyEmitted = false;
  let failure: FailureReason | null = null;
  let preview: MediaStream | null = null;
  let remoteTracks: MediaStreamTrack[] = [];
  let remoteId: string | null = null;
  let remoteStream: MediaStream | null = null;
  let videoPlaying = false;
  let watchdog: ReturnType<typeof setTimeout> | null = null;
  let destroyed: Promise<void> | null = null;

  function teardown() {
    if (destroyed) return destroyed;
    ended = true;
    generation++;
    cameraRequest++;
    const current = call;
    call = null;
    conversationId = null;
    remoteTracks = [];
    remoteStream = null;
    videoPlaying = false;
    clearWatchdog();
    onEvent({ type: "remote-stream", stream: null });
    onEvent({ type: "local-preview", stream: null });
    stopTracks(preview);
    preview = null;
    if (current) {
      try {
        current.setLocalAudio(false);
        Object.values(current.participants().local?.tracks ?? {}).forEach((track) => {
          track?.persistentTrack?.stop();
          track?.track?.stop();
        });
      } catch {}
    }
    destroyed = current ? current.destroy().catch(() => {}) : Promise.resolve();
    return destroyed;
  }

  function clearWatchdog() {
    if (watchdog) clearTimeout(watchdog);
    watchdog = null;
  }

  // Runs from join until the call is ready and the current remote stream is playing video, and again whenever the stream is replaced.
  function armWatchdog() {
    clearWatchdog();
    watchdog = setTimeout(() => { watchdog = null; fail("video_lost"); }, VIDEO_FIRST_TIMEOUT_MS);
  }

  function fail(reason: FailureReason) {
    if (ended) return;
    failure = reason;
    void teardown();
    onEvent({ type: "failed", reason });
  }

  function remoteLeft() {
    if (ended) return;
    void teardown();
    onEvent({ type: "remote-left" });
  }

  function renderRemote(instance: DailyCall, epoch: number) {
    if (ended || epoch !== generation) return;
    const participant = remoteParticipant(instance);
    if (!participant) return;
    remoteId = participant.session_id;
    const { video, audio } = participant.tracks;
    const tracks = [video?.persistentTrack, audio?.persistentTrack].filter(
      (track): track is MediaStreamTrack => !!track && track.readyState === "live",
    );
    if (!tracks.some((track) => track.kind === "video")) return;
    if (tracks.length !== remoteTracks.length || tracks.some((track) => !remoteTracks.includes(track))) {
      remoteTracks = tracks;
      const stream = new MediaStream(tracks);
      remoteStream = stream;
      videoPlaying = false;
      playingReporters.set(stream, () => {
        if (ended || epoch !== generation || remoteStream !== stream || videoPlaying) return;
        videoPlaying = true;
        renderRemote(instance, epoch);
      });
      armWatchdog();
      onEvent({ type: "remote-stream", stream });
    }
    if (!readyEmitted && videoPlaying && video?.state === "playable" && audio?.state === "playable") {
      readyEmitted = true;
      onEvent({ type: "ready" });
    }
    if (videoPlaying) clearWatchdog();
  }

  return {
    async connect(credential: MediaCredential) {
      if (started || ended) throw new Error("This media controller has already been used.");
      started = true;
      const epoch = generation;
      conversationId = conversationIdFromRoomUrl(credential.roomUrl);
      if (Date.now() >= Date.parse(credential.expiresAt)) {
        fail("credential_expired");
        throw new Error("The call credential has expired.");
      }
      try {
        const { default: Daily } = await import("@daily-co/daily-js");
        if (ended || epoch !== generation) {
          if (failure) throw new Error("The call could not start.");
          return;
        }
        const instance = Daily.createCallObject({ audioSource: true, videoSource: false });
        call = instance;
        const render = () => renderRemote(instance, epoch);
        const live = () => !ended && epoch === generation;
        instance.on("participant-joined", render);
        instance.on("participant-updated", render);
        instance.on("track-started", render);
        instance.on("track-stopped", (event) => {
          if (live() && event.participant && !event.participant.local && event.track?.kind === "video") fail("video_lost");
        });
        instance.on("participant-left", (event) => {
          if (live() && remoteId && event.participant.session_id === remoteId) remoteLeft();
        });
        instance.on("camera-error", (event) => {
          if (!live()) return;
          const error = event.error;
          if (error?.type === "permissions" && error.blockedMedia?.includes("audio")) fail("microphone_denied");
          else if (error?.type === "not-found" && error.missingMedia?.includes("audio")) fail("join");
          else if (error?.type === "mic-in-use" || error?.type === "cam-mic-in-use" || error?.type === "undefined-mediadevices") fail("join");
        });
        instance.on("error", (event) => {
          if (!live()) return;
          const type = event.error?.type;
          if (type === "exp-token" || type === "exp-room") fail("credential_expired");
          else if (type === "ejected") remoteLeft();
          else fail("provider_error");
        });
        const utterance = utteranceReader();
        const liveEvent = liveReader();
        instance.on("app-message", (event) => {
          if (!live()) return;
          const turn = utterance(event?.data);
          if (turn) { onEvent(turn); return; }
          const signal = liveEvent(event?.data);
          if (signal) onLive(signal);
        });
        instance.on("network-quality-change", (event) => {
          if (live()) onLive({ type: "network", weak: event.networkState === "bad" });
        });
        instance.on("left-meeting", () => {
          if (live()) remoteLeft();
        });
        await instance.join({ url: credential.roomUrl, token: credential.meetingToken, startVideoOff: true, startAudioOff: muted });
        if (ended || epoch !== generation) {
          if (failure) throw new Error("The call could not start.");
          return;
        }
        render();
        if (!ended && epoch === generation && !(readyEmitted && videoPlaying) && !watchdog) armWatchdog();
      } catch (error) {
        if (!ended) fail(isPermissionDenial(error) ? "microphone_denied" : "join");
        else if (!failure) return;
        throw new Error("The call could not start.");
      }
    },

    setMuted(next: boolean) {
      muted = next;
      if (ended || !call) return;
      try {
        call.setLocalAudio(!next);
      } catch {}
    },

    async setCamera(enabled: boolean) {
      const request = ++cameraRequest;
      if (!enabled || ended) {
        if (preview) {
          stopTracks(preview);
          preview = null;
          if (!ended) onEvent({ type: "local-preview", stream: null });
        }
        return false;
      }
      if (preview) return true;
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch {
        return false;
      }
      if (ended || request !== cameraRequest) {
        stopTracks(stream);
        return false;
      }
      preview = stream;
      onEvent({ type: "local-preview", stream });
      return true;
    },

    send(interaction: Interaction) {
      if (ended || !call || !readyEmitted || !conversationId) return false;
      const message = toAppMessage(interaction, conversationId);
      if (!message) return false;
      try {
        call.sendAppMessage(message, "*");
        return true;
      } catch {
        return false;
      }
    },

    end() {
      return teardown();
    },
  };
};
