"use client";

import type { Ref } from "react";
import { SaveAfterEnd } from "@/components/presentation/people-save";
import { ReflectionPanel } from "@/components/presentation/reflection-panel";
import { sameName, type CallOrigin, type ReflectState, type SaveOffer } from "@/lib/practice/types";
import type { Person } from "@/lib/schemas/people";
import type { TranscriptTurn } from "@/lib/schemas/reflection";

// Stage `recap`: what sits under the ended call screen. Saving a person is always explicit,
// and the reflection is a separate step the user can skip.
export type RecapStageProps = {
  // False when the call was interrupted rather than ended by the user.
  ended: boolean;
  origin: CallOrigin | null;
  saveOffer: SaveOffer;
  people: Person[];
  peopleStatus: "loading" | "ready" | "error";
  onSave: () => void;
  onDismissSave: () => void;
  reflect: ReflectState;
  turns: readonly TranscriptTurn[];
  onSelfReflectionChange: (value: string) => void;
  onReflect: () => void;
  onReflectionDone: () => void;
  canRetryCleanup: boolean;
  onRetryCleanup: () => void;
  onBackToSetup: () => void;
  backToSetupRef: Ref<HTMLButtonElement>;
};

function SaveCard({ origin, saveOffer, people, peopleStatus, onSave, onDismissSave }: Pick<RecapStageProps, "origin" | "saveOffer" | "people" | "peopleStatus" | "onSave" | "onDismissSave">) {
  if (!origin || !saveOffer.open) return null;
  if (origin.kind === "person") return <SaveAfterEnd mode="saved" name={origin.person.name} personId={origin.person.id} onSave={() => undefined} onDismiss={onDismissSave} />;
  const match = people.find((person) => sameName(person.name, origin.role.name));
  return <SaveAfterEnd mode={match && !saveOffer.saved ? "update" : "new"} name={match && !saveOffer.saved ? match.name : origin.role.name} onSave={onSave} onDismiss={onDismissSave}
    saving={saveOffer.saving} ready={peopleStatus !== "loading"} saved={saveOffer.saved} errorMessage={saveOffer.error || undefined} />;
}

export function RecapStage({
  ended, origin, saveOffer, people, peopleStatus, onSave, onDismissSave,
  reflect, turns, onSelfReflectionChange, onReflect, onReflectionDone,
  canRetryCleanup, onRetryCleanup, onBackToSetup, backToSetupRef,
}: RecapStageProps) {
  return <>
    {ended && <SaveCard origin={origin} saveOffer={saveOffer} people={people} peopleStatus={peopleStatus} onSave={onSave} onDismissSave={onDismissSave} />}
    {reflect.sessionId && <ReflectionPanel selfReflection={reflect.selfReflection}
      onSelfReflectionChange={onSelfReflectionChange} onReflect={onReflect} onDone={onReflectionDone}
      pending={reflect.pending} reflection={reflect.reflection} error={reflect.error} noSpeech={!turns.some((turn) => turn.speaker === "user")} />}
    <div className="actions">
      {canRetryCleanup && <button type="button" className="button secondary" onClick={onRetryCleanup}>Retry closing session</button>}
      {ended && <button ref={backToSetupRef} type="button" className="button" onClick={onBackToSetup}>Back to setup</button>}
    </div>
  </>;
}
