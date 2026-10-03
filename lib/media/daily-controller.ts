import type { DailyCall, DailyParticipant } from "@daily-co/daily-js";
import { z } from "zod";
import type { CreateMediaController, MediaCredential, MediaEvent } from "@/lib/schemas/media";
import { MAX_TURN_CHARS } from "@/lib/schemas/reflection";

type FailureReason = Extract<MediaEvent, { type: "failed" }>["reason"];

// Tavus also sends a legacy duplicate of each counterpart turn with role "replica"; it is ignored. Analysis fields are never read.
const utteranceSchema = z.object({
  event_type: z.literal("conversation.utterance"),
  properties: z.object({ role: z.enum(["pal", "user", "replica"]), speech: z.string() }).loose(),
}).loose();
function utterance(data: unknown): Extract<MediaEvent, { type: "utterance" }> | null {
  const parsed = utteranceSchema.safeParse(data);
  if (!parsed.success || parsed.data.properties.role === "replica") return null;
  const text = parsed.data.properties.speech.trim().slice(0, MAX_TURN_CHARS).trim();
  return text ? { type: "utterance", speaker: parsed.data.properties.role === "pal" ? "counterpart" : "user", text } : null;
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

// Browser-only: Daily is imported inside connect so server rendering can import this module safely.
export const createDailyController: CreateMediaController = (onEvent) => {
  let call: DailyCall | null = null;
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
  let destroyed: Promise<void> | null = null;

  function teardown() {
    if (destroyed) return destroyed;
    ended = true;
    generation++;
    cameraRequest++;
    const current = call;
    call = null;
    remoteTracks = [];
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
      onEvent({ type: "remote-stream", stream: new MediaStream(tracks) });
    }
    if (!readyEmitted && video?.state === "playable" && audio?.state === "playable") {
      readyEmitted = true;
      onEvent({ type: "ready" });
    }
  }

  return {
    async connect(credential: MediaCredential) {
      if (started || ended) throw new Error("This media controller has already been used.");
      started = true;
      const epoch = generation;
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
        instance.on("app-message", (event) => {
          if (!live()) return;
          const turn = utterance(event?.data);
          if (turn) onEvent(turn);
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

    end() {
      return teardown();
    },
  };
};
