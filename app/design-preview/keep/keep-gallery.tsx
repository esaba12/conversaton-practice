"use client";

import type { ReactNode } from "react";
import { CheckinBanner, TalkedForRealMark } from "@/components/practice/checkin-banner";
import { FeedbackStyleControl } from "@/components/practice/feedback-style-control";
import { PlannedDate } from "@/components/practice/planned-date";
import { PocketCard } from "@/components/practice/pocket-card";
import type { Planned } from "@/lib/schemas/planned";
import styles from "../gallery.module.css";

// Synthetic examples only: nothing here calls a route, a provider or the microphone.
const PERSON = "11111111-1111-4111-8111-111111111111";
const stamp = "2026-10-04T12:00:00.000Z";
const plan = (patch: Partial<Planned> = {}): Planned => ({
  id: "22222222-2222-4222-8222-222222222222", personId: PERSON, plannedOn: "2026-10-09", label: "Dishes chat after dinner",
  fear: null, likelihoodBefore: null, likelihoodAfter: null, checkin: null, checkinNote: null, checkedInAt: null, createdAt: stamp, updatedAt: stamp, ...patch,
});
const GOAL = "Ask Maya to split the dishes more evenly.";
const HARD = "When she sounds annoyed, I’ll slow down and say what I need once.";
const noop = () => undefined;
const yes = async () => true;

function Capture({ galleryState, children }: { galleryState: string; children: ReactNode }) {
  return <div data-gallery-state={galleryState} className={styles.galleryCapture}>{children}</div>;
}

export function KeepGallery() {
  return (
    <section className={styles.section} aria-labelledby="keep-heading">
      <h2 id="keep-heading" className={styles.sectionTitle}>Pocket card, feedback style, planned day, check-in</h2>
      <p className={styles.sectionNote}>Synthetic examples; Save and Print on the card run in this browser only.</p>

      <Capture galleryState="pocket-card-no-date"><PocketCard name="Maya" goal={GOAL} hardMomentLine={HARD} practicedOn="2026-10-04" /></Capture>
      <Capture galleryState="pocket-card-with-date"><PocketCard name="Maya" goal={GOAL} hardMomentLine={HARD} plannedOn="2026-10-09" practicedOn="2026-10-04" /></Capture>
      <Capture galleryState="pocket-card-no-hard-moment"><PocketCard name="Maya" goal={GOAL} practicedOn="2026-10-04" /></Capture>

      <Capture galleryState="feedback-style-gentle"><FeedbackStyleControl initial="gentle" /></Capture>
      <Capture galleryState="feedback-style-list"><FeedbackStyleControl initial="list" /></Capture>

      <Capture galleryState="planned-date-empty"><PlannedDate personId={PERSON} personName="Maya" plan={null} onSave={noop} onRemove={noop} /></Capture>
      <Capture galleryState="planned-date-set"><PlannedDate personId={PERSON} personName="Maya" plan={plan()} onSave={noop} onRemove={noop} /></Capture>
      <Capture galleryState="planned-date-keep-guess-offer"><PlannedDate personId={PERSON} personName="Maya" plan={plan()} guess={{ fear: "She will say I never help.", likelihoodBefore: 80 }} onSave={noop} onRemove={noop} /></Capture>
      <Capture galleryState="planned-date-error"><PlannedDate personId={PERSON} personName="Maya" plan={plan()} errorMessage="We couldn’t save the day. Please try again." onSave={noop} onRemove={noop} /></Capture>

      <Capture galleryState="checkin-ask"><CheckinBanner plan={plan({ plannedOn: "2026-10-03" })} personName="Maya" today="2026-10-04" onAnswer={yes} onPickDay={yes} /></Capture>
      <Capture galleryState="checkin-yes-with-fear"><CheckinBanner initialStep="yes" plan={plan({ plannedOn: "2026-10-03", fear: "She will say I never help." })} personName="Maya" today="2026-10-04" onAnswer={yes} onPickDay={yes} /></Capture>
      <Capture galleryState="checkin-new-day"><CheckinBanner initialStep="newday" plan={plan({ plannedOn: "2026-10-03", checkin: "not_yet" })} personName="Maya" today="2026-10-04" onAnswer={yes} onPickDay={yes} /></Capture>
      <Capture galleryState="checkin-hidden-before-day"><CheckinBanner plan={plan({ plannedOn: "2026-10-09" })} personName="Maya" today="2026-10-04" onAnswer={yes} onPickDay={yes} /><p className={styles.sectionNote}>Nothing above: the day hasn’t come yet.</p></Capture>
      <Capture galleryState="talked-for-real-mark"><TalkedForRealMark /></Capture>
    </section>
  );
}
