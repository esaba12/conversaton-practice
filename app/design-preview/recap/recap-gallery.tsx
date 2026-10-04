"use client";

import { useState, type ReactNode } from "react";
import { RecapStage } from "@/components/practice/recap-stage";
import { closedAlternative, type AlternativeState } from "@/components/presentation/reflection-panel";
import { manager } from "@/fixtures/manager";
import { closedReflect, type ReflectState } from "@/lib/practice/types";
import type { Reflection, TranscriptTurn } from "@/lib/schemas/reflection";
import styles from "../gallery.module.css";

// Recap states for the screenshot gallery (docs/tasks/0E-ui-gate.md). Synthetic examples only:
// nothing here starts a call, requests a reflection, or sends anything to a provider.
const NAME = manager.name;
const SESSION = "11111111-1111-4111-8111-111111111111";
const HARD_MOMENT = "If they say the team needs me, I’ll say I get that, and I still need to drop one thing.";
const FEAR = "That I’m not committed to the team.";
const TURNS: TranscriptTurn[] = [
  { speaker: "counterpart", text: "Hey, you wanted to chat? I’ve got about ten minutes before planning." },
  { speaker: "user", text: "I want to move the Atlas report to next sprint so I can do the API work well." },
  { speaker: "counterpart", text: "The team is already stretched. Can it not wait a week?" },
  { speaker: "user", text: "I hear that. I still need to drop one thing, and Atlas is the one." },
];
const reflection: Reflection = {
  evidence: "complete",
  observedAction: "You made one request and said which project you would drop.",
  quotedLine: "I still need to drop one thing, and Atlas is the one.",
  takeaway: "That matched what you came in to say.",
  nextStep: "Name the date you would pick Atlas back up.",
  supportExit: false,
};
const supportExit: Reflection = { evidence: "complete", observedAction: null, quotedLine: null, takeaway: null, nextStep: null, supportExit: true };

const reflect = (patch: Partial<ReflectState> = {}): ReflectState => ({ ...closedReflect, sessionId: SESSION, goal: "Ask to move one project to next sprint.", ...patch });
const noop = () => undefined;

function Capture({ galleryState, children }: { galleryState: string; children: ReactNode }) {
  return <div data-gallery-state={galleryState} data-surface="room" className={styles.galleryCapture}>{children}</div>;
}

const shared = {
  origin: { kind: "role" as const, role: manager },
  saveOffer: { open: false, saving: false, saved: null, error: "" },
  people: [],
  peopleStatus: "ready" as const,
  onSave: noop,
  onDismissSave: noop,
  turns: TURNS,
  onSelfReflectionChange: noop,
  onReflect: noop,
  onReflectionDone: noop,
  canRetryCleanup: false,
  onRetryCleanup: noop,
  onBackToSetup: noop,
  backToSetupRef: null,
  counterpartName: NAME,
  role: manager,
};

export function RecapGallery() {
  const [after, setAfter] = useState<number | null>(30);
  const [alternative, setAlternative] = useState<AlternativeState>(closedAlternative);

  return (
    <section id="recap" className={styles.section} aria-labelledby="recap-heading">
      <h2 id="recap-heading" className={styles.sectionTitle}>Recap and the one retry (L1, W7, W4, Q2, A1)</h2>
      <p className={styles.sectionNote}>
        After End, in room mode. Synthetic examples; these controls change the display only. The reflection here never leaves the browser.
      </p>

      <Capture galleryState="recap-ended-plain">
        <RecapStage {...shared} ended reflect={reflect()} />
      </Capture>

      <Capture galleryState="recap-self-check">
        <RecapStage {...shared} ended reflect={reflect()} hardMomentLine={HARD_MOMENT} retryAvailable onRetry={noop} />
      </Capture>

      <Capture galleryState="recap-reflection-pending">
        <RecapStage {...shared} ended reflect={reflect({ pending: true })} />
      </Capture>

      <Capture galleryState="recap-reflection-result">
        <RecapStage {...shared} ended reflect={reflect({ reflection })} alternative={alternative}
          onAlternative={() => setAlternative({ text: "I need to hand Atlas off this sprint so the API work lands well.", pending: false, error: null, requested: true })} />
      </Capture>

      <Capture galleryState="recap-reflection-insufficient">
        <RecapStage {...shared} ended turns={[TURNS[0]]} reflect={reflect({ reflection: { ...reflection, evidence: "insufficient", observedAction: null, quotedLine: null } })} />
      </Capture>

      <Capture galleryState="recap-support-exit">
        <RecapStage {...shared} ended reflect={reflect({ reflection: supportExit })} hardMomentLine={HARD_MOMENT} retryAvailable onRetry={noop} />
      </Capture>

      <Capture galleryState="recap-arc">
        <RecapStage {...shared} ended reflect={reflect({ reflection })} prediction={FEAR} likelihoodBefore={80} likelihoodAfter={after} onLikelihoodAfterChange={setAfter} />
      </Capture>

      <Capture galleryState="recap-after-retry">
        <RecapStage {...shared} ended isRetry reflect={reflect()} hardMomentLine={HARD_MOMENT} retryAvailable={false} onRetry={noop} />
      </Capture>

      <Capture galleryState="recap-interrupted">
        <RecapStage {...shared} ended={false} reflect={reflect()} canRetryCleanup />
      </Capture>
    </section>
  );
}
