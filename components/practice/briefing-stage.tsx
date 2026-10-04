"use client";

import { MyPeople } from "@/components/presentation/people-list";
import { SetupDescribe, type SetupDescribeError } from "@/components/presentation/setup-describe";
import type { Person } from "@/lib/schemas/people";
import type { SessionPreset } from "@/lib/schemas/session";

// Stages `lobby` and `briefing`. Today one screen does both: the saved-people cards are the
// lobby, the description form is the briefing. Slice 1B splits them.
export type BriefingStageProps = {
  situation: string;
  // The user's typed intent. Private: it reaches the setup model only, never the counterpart.
  goal: string;
  privateNotes: string;
  onSituationChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onPrivateNotesChange: (value: string) => void;
  onGenerate: () => void;
  onManual: () => void;
  onUseExample: (preset: SessionPreset) => void;
  generating: boolean;
  disabled: boolean;
  error: SetupDescribeError | null;
  focusHeading: boolean;
  people: Person[];
  peopleStatus: "loading" | "ready" | "error";
  peopleDisabled: boolean;
  onPickPerson: (person: Person) => void;
  onRetryPeople: () => void;
};

export function BriefingStage({
  situation, goal, privateNotes, onSituationChange, onGoalChange, onPrivateNotesChange,
  onGenerate, onManual, onUseExample, generating, disabled, error, focusHeading,
  people, peopleStatus, peopleDisabled, onPickPerson, onRetryPeople,
}: BriefingStageProps) {
  return <SetupDescribe situation={situation} goal={goal} privateNotes={privateNotes} onSituationChange={onSituationChange} onGoalChange={onGoalChange} onPrivateNotesChange={onPrivateNotesChange}
    onGenerate={onGenerate} onManual={onManual} onUseExample={onUseExample} generating={generating} disabled={disabled} error={error} focusHeading={focusHeading}
    people={<MyPeople people={people} status={peopleStatus} onPractice={onPickPerson} onRetry={onRetryPeople} disabled={peopleDisabled} />} />;
}
