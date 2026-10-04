"use client";

import { DurationChoice, type PracticeDuration } from "@/components/presentation/duration-choice";
import { SavedPersonStart } from "@/components/presentation/people-start";
import type { SetupDescribeError } from "@/components/presentation/setup-describe";
import { SetupReview, type SetupMode } from "@/components/presentation/setup-review";
import type { Person } from "@/lib/schemas/people";
import type { RoleContext } from "@/lib/schemas/role-context";

// Shared by both meet screens: the practice length and the "a previous practice is still open"
// escape hatch.
type MeetCommonProps = {
  onBack: () => void;
  onStart: () => void;
  // A start request is in flight.
  starting: boolean;
  disabled: boolean;
  startDisabled: boolean;
  focusHeading: boolean;
  statusMessage: string;
  durationSeconds: PracticeDuration;
  onDurationChange: (value: PracticeDuration) => void;
  durationDisabled: boolean;
  previousSessionId: string | null;
  endingPrevious: boolean;
  onEndPrevious: () => void;
};

// Stage `meet`. Today it is either a saved person's start screen or the reviewed setup.
export type MeetStageProps = MeetCommonProps & (
  | { kind: "person"; person: Person }
  | {
      kind: "review";
      role: RoleContext;
      goal: string;
      assumptions: string[];
      mode: SetupMode;
      onRoleChange: (role: RoleContext) => void;
      onGoalChange: (goal: string) => void;
      onRegenerate?: () => void;
      regenerating: boolean;
      error: SetupDescribeError | null;
    }
);

function MeetActions({ durationSeconds, onDurationChange, durationDisabled, previousSessionId, endingPrevious, onEndPrevious }: Pick<MeetCommonProps, "durationSeconds" | "onDurationChange" | "durationDisabled" | "previousSessionId" | "endingPrevious" | "onEndPrevious">) {
  return <>
    <DurationChoice value={durationSeconds} onChange={onDurationChange} disabled={durationDisabled} />
    {previousSessionId ? <div className="actions"><button type="button" className="button secondary" disabled={endingPrevious} onClick={onEndPrevious}>{endingPrevious ? "Ending previous practice…" : "End previous practice"}</button></div> : null}
  </>;
}

export function MeetStage(props: MeetStageProps) {
  const { onBack, onStart, starting, disabled, startDisabled, focusHeading, statusMessage } = props;
  const actions = <MeetActions durationSeconds={props.durationSeconds} onDurationChange={props.onDurationChange} durationDisabled={props.durationDisabled}
    previousSessionId={props.previousSessionId} endingPrevious={props.endingPrevious} onEndPrevious={props.onEndPrevious} />;
  const status = starting ? "Starting your practice…" : statusMessage || undefined;

  if (props.kind === "person") {
    return <SavedPersonStart person={props.person} onStart={onStart} onBack={onBack} disabled={disabled} startDisabled={startDisabled} focusHeading={focusHeading}
      statusMessage={status} actions={actions} />;
  }

  const { error } = props;
  return <SetupReview mode={props.mode} role={props.role} goal={props.goal} assumptions={props.assumptions} onRoleChange={props.onRoleChange} onGoalChange={props.onGoalChange}
    onBack={onBack} onRegenerate={props.onRegenerate} onStart={onStart} regenerating={props.regenerating}
    disabled={disabled} startDisabled={startDisabled} focusHeading={focusHeading}
    statusMessage={status}
    errorMessage={error ? (error.outOfScope ? `${error.message} Try describing an everyday conversation instead.` : `${error.message} Your current setup is unchanged.`) : undefined}
    actions={actions} />;
}
