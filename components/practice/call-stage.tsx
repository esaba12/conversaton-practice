"use client";

import { initialLiveCallState, type Interaction, type LiveCallState } from "@/lib/media/interactions";
import type { PracticePhase } from "@/lib/practice/flow";
import type { TranscriptTurn } from "@/lib/schemas/reflection";
import { CallScreen } from "./call-screen";
import { RemoteStreamVideo, StreamVideo } from "./remote-media";

// Stages `ringing`, `call` and `recap` (and their retry twins): one screen whose phase follows
// the stage. Mute is not pause; End is always the way out.
export type CallStageProps = {
  counterpartName: string;
  goal: string;
  phase: PracticePhase;
  muted: boolean;
  cameraEnabled: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  remoteStream: MediaStream | null;
  // Local preview only: never published, and the counterpart cannot see it.
  localStream: MediaStream | null;
  onMuteToggle: () => void;
  onCameraToggle: () => void;
  onEnd: () => void;
  statusMessage: string;
  testMedia: boolean;
  turns: readonly TranscriptTurn[];
  // Cancel while ringing: the same teardown as leaving the call (microphone released, session ended).
  onCancel?: () => void;
  portraitSrc?: string | null;
  cameraPending?: boolean;
  live?: LiveCallState;
  onInteraction?: (interaction: Interaction) => boolean;
};

export function CallStage({ remoteStream, localStream, statusMessage, live = initialLiveCallState, ...rest }: CallStageProps) {
  return <CallScreen {...rest} live={live} statusMessage={statusMessage || undefined}
    remoteMedia={remoteStream ? <RemoteStreamVideo stream={remoteStream} /> : null}
    localPreview={localStream ? <StreamVideo stream={localStream} muted /> : undefined} />;
}
