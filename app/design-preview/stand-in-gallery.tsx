"use client";

import { useState, type ReactNode } from "react";
import { StandInCall } from "@/components/practice/stand-in-call";
import { StandInOfferButtons } from "@/components/practice/stand-in-offer";
import { StandInYourTurn } from "@/components/practice/stand-in-your-turn";
import { initialStandInSitting, standInOffer } from "@/lib/practice/stand-in-sitting";
import styles from "./gallery.module.css";

// W10 states for the screenshot gallery (docs/tasks/0E-ui-gate.md). Synthetic examples only:
// nothing here starts a call, touches the microphone, or sends anything to a provider.
const NAME = "Jordan";
const GOAL = "Move the Atlas report to next sprint.";
const FEAR = "That I’m not committed.";
const TURNS = [
  { speaker: "counterpart" as const, text: "Hey, Jordan, do you have a minute?" },
  { speaker: "user" as const, text: "Honestly, it sounds like you’re not committed." },
  { speaker: "counterpart" as const, text: "I get that the team is stretched. I still need to move Atlas so I can do the API work well." },
];

function Capture({ galleryState, surface = "room", children }: { galleryState: string; surface?: "room" | "night"; children: ReactNode }) {
  return (
    <div data-gallery-state={galleryState} data-surface={surface} className={[styles.galleryCapture, surface === "night" ? styles.nightSurface : undefined].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export function StandInGallery() {
  const [goal, setGoal] = useState(GOAL);
  const [hardMomentLine, setHardMomentLine] = useState("I get that the team needs me, and I still need to drop one thing.");
  const [note, setNote] = useState("");
  const noop = () => undefined;

  return (
    <section id="stand-in" className={styles.section} aria-labelledby="stand-in-heading">
      <h2 id="stand-in-heading" className={styles.sectionTitle}>Show me first (W10)</h2>
      <p className={styles.sectionNote}>
        A stand-in plays you so you can hear your own line once, then you play {NAME}. Synthetic examples; these controls change the display only.
      </p>

      <Capture galleryState="stand-in-offer-first-time">
        <StandInOfferButtons counterpartName={NAME} offer={standInOffer({ counterpartName: NAME, goal: GOAL, hasPracticed: false, sitting: initialStandInSitting })} onShowMeFirst={noop} onSkip={noop} />
      </Capture>

      <Capture galleryState="stand-in-offer-practiced">
        <StandInOfferButtons counterpartName={NAME} offer={standInOffer({ counterpartName: NAME, goal: GOAL, hasPracticed: true, sitting: initialStandInSitting })} onShowMeFirst={noop} onSkip={noop} />
      </Capture>

      <Capture galleryState="stand-in-offer-no-goal">
        <StandInOfferButtons counterpartName={NAME} offer={standInOffer({ counterpartName: NAME, goal: "", hasPracticed: false, sitting: initialStandInSitting })} onShowMeFirst={noop} onSkip={noop} />
      </Capture>

      <Capture galleryState="stand-in-offer-used" >
        <StandInOfferButtons counterpartName={NAME} offer={standInOffer({ counterpartName: NAME, goal: GOAL, hasPracticed: false, sitting: { standInUsed: true, callsUsed: 1, retryUsed: false } })} onShowMeFirst={noop} onSkip={noop} />
      </Capture>

      <Capture galleryState="stand-in-call-connecting" surface="night">
        <StandInCall counterpartName={NAME} phase="connecting" muted={false} cameraEnabled={false} elapsedSeconds={0} durationSeconds={180} remoteMedia={null} fear={FEAR} onMuteToggle={noop} onCameraToggle={noop} onEnd={noop} isMock />
      </Capture>

      <Capture galleryState="stand-in-call-live" surface="night">
        <StandInCall counterpartName={NAME} phase="live" muted={false} cameraEnabled={false} elapsedSeconds={42} durationSeconds={180} remoteMedia={<div>Synthetic stand-in media</div>} fear={FEAR} turns={TURNS} onMuteToggle={noop} onCameraToggle={noop} onEnd={noop} isMock />
      </Capture>

      <Capture galleryState="stand-in-call-ended" surface="night">
        <StandInCall counterpartName={NAME} phase="ended" muted={false} cameraEnabled={false} elapsedSeconds={96} durationSeconds={180} remoteMedia={null} fear={FEAR} turns={TURNS} onMuteToggle={noop} onCameraToggle={noop} onEnd={noop} isMock />
      </Capture>

      <Capture galleryState="stand-in-your-turn">
        <StandInYourTurn counterpartName={NAME} goal={goal} hardMomentLine={hardMomentLine} note={note}
          onGoalChange={setGoal} onHardMomentLineChange={setHardMomentLine} onNoteChange={setNote} onCall={noop} />
      </Capture>
    </section>
  );
}
