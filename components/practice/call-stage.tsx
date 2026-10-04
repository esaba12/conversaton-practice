"use client";

import { PracticeCall } from "@/components/presentation/practice";
import type { PracticePhase } from "@/lib/practice/flow";
import type { TranscriptTurn } from "@/lib/schemas/reflection";
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
};

export function CallStage({
  counterpartName, goal, phase, muted, cameraEnabled, elapsedSeconds, durationSeconds,
  remoteStream, localStream, onMuteToggle, onCameraToggle, onEnd, statusMessage, testMedia, turns,
}: CallStageProps) {
  return <PracticeCall counterpartName={counterpartName} goal={goal} phase={phase} muted={muted} cameraEnabled={cameraEnabled} elapsedSeconds={elapsedSeconds} durationSeconds={durationSeconds}
    remoteMedia={remoteStream ? <RemoteStreamVideo stream={remoteStream} /> : null}
    localPreview={localStream ? <StreamVideo stream={localStream} muted /> : undefined}
    onMuteToggle={onMuteToggle} onCameraToggle={onCameraToggle} onEnd={onEnd} statusMessage={statusMessage || undefined} testMedia={testMedia} turns={turns} />;
}
