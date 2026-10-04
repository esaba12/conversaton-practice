"use client";

import { useCallback, useState, type ReactNode } from "react";
import { GoalLightToggle, GoalPill } from "@/components/practice/goal-pill";
import { HearButton, HearButtonView, hearingBubbleClass, useHearHighlight } from "@/components/practice/hear-button";
import meetStyles from "@/components/practice/meet.module.css";
import { useGoalLight } from "@/lib/goal-check/use-goal-light";
import { appendTurn, type TranscriptTurn } from "@/lib/schemas/reflection";
import styles from "../gallery.module.css";

// G1 and W3 states. Synthetic examples only: the loaders and goal checks below are local fakes, so nothing reaches
// our routes or any provider.
const NAME = "Jordan";
const GOAL = "Move the Atlas report to next sprint.";
const OPENING = "Hey, do you have a minute? I wanted to check in on the Atlas report.";
const LINES = ["Hi Jordan, thanks for making time.", "Could we push Atlas to next sprint so I can do the API work well?"];

function Capture({ galleryState, surface = "room", children }: { galleryState: string; surface?: "room" | "night"; children: ReactNode }) {
  return (
    <div data-gallery-state={galleryState} data-surface={surface} className={[styles.galleryCapture, surface === "night" ? styles.nightSurface : undefined].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

// Two seconds of 8-bit silence, so the playing state can be shown without a network clip.
function silentClip(): Blob {
  const rate = 8_000, samples = rate * 2, buffer = new ArrayBuffer(44 + samples), view = new DataView(buffer);
  const ascii = (at: number, text: string) => [...text].forEach((char, i) => view.setUint8(at + i, char.charCodeAt(0)));
  ascii(0, "RIFF"); view.setUint32(4, 36 + samples, true); ascii(8, "WAVE"); ascii(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true);
  view.setUint32(28, rate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true); ascii(36, "data"); view.setUint32(40, samples, true);
  new Uint8Array(buffer, 44).fill(128);
  return new Blob([buffer], { type: "audio/wav" });
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function GoalLightDemo() {
  const [enabled, setEnabled] = useState(false);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [checks, setChecks] = useState(0);
  // Local stand-in for the goal-check route: only the second scripted line counts as said.
  const send = useCallback(async (_sessionId: string, _goal: string, transcript: readonly TranscriptTurn[]) => {
    setChecks((count) => count + 1);
    await wait(300);
    return transcript.some((turn) => turn.speaker === "user" && turn.text === LINES[1]);
  }, []);
  const state = useGoalLight({ enabled, sessionId: "gallery-session", goal: GOAL, turns, send });
  const next = LINES[turns.filter((turn) => turn.speaker === "user").length];
  return (
    <Capture galleryState="goal-light-interactive" surface="night">
      <GoalLightToggle checked={enabled} onChange={(value) => { setEnabled(value); setTurns([]); setChecks(0); }} />
      <GoalPill goal={GOAL} state={state} />
      <p className={styles.sectionNote}>Fake checks sent: {checks}. {next ? null : "All lines said."}</p>
      {next ? <button type="button" className={styles.replay} onClick={() => setTurns((current) => appendTurn(appendTurn(current, "user", next), "counterpart", "Mm-hm, go on."))}>Say: “{next}”</button> : null}
    </Capture>
  );
}

function HearDemo() {
  const [opening, setOpening] = useState(OPENING);
  const [loads, setLoads] = useState(0);
  const highlight = useHearHighlight();
  const load = useCallback(async () => { setLoads((count) => count + 1); await wait(400); return silentClip(); }, []);
  return (
    <Capture galleryState="hear-interactive">
      <figure className={meetStyles.bubbleWrap}>
        <blockquote className={[meetStyles.bubble, highlight.bubbleClassName].filter(Boolean).join(" ")}>{opening}</blockquote>
        <div className={meetStyles.hear}><HearButton name={NAME} text={opening} presetId="manager" onPlayingChange={highlight.onPlayingChange} load={load} /></div>
      </figure>
      <p className={styles.sectionNote}>Fake clips fetched: {loads}. Press twice to replay from memory; edit the opening to fetch again.</p>
      <button type="button" className={styles.replay} onClick={() => setOpening((text) => text.endsWith("!") ? OPENING : `${text}!`)}>Edit the opening</button>
    </Capture>
  );
}

export function GoalVoiceGallery() {
  const noop = () => undefined;
  return (
    <>
      <section id="goal-light" className={styles.section} aria-labelledby="goal-light-heading">
        <h2 id="goal-light-heading" className={styles.sectionTitle}>Goal light (G1)</h2>
        <p className={styles.sectionNote}>Off by default. When on, the pill lights once after a separate model hears the user say their line.</p>
        <Capture galleryState="goal-toggle-off" surface="night"><GoalLightToggle checked={false} onChange={noop} /></Capture>
        <Capture galleryState="goal-toggle-on" surface="night"><GoalLightToggle checked onChange={noop} /></Capture>
        <Capture galleryState="goal-pill-off" surface="night"><GoalPill goal={GOAL} state="off" /></Capture>
        <Capture galleryState="goal-pill-watching" surface="night"><GoalPill goal={GOAL} state="watching" /></Capture>
        <Capture galleryState="goal-pill-reached" surface="night"><GoalPill goal={GOAL} state="reached" /></Capture>
        <GoalLightDemo />
      </section>

      <section id="hear" className={styles.section} aria-labelledby="hear-heading">
        <h2 id="hear-heading" className={styles.sectionTitle}>Hear {NAME} (W3)</h2>
        <p className={styles.sectionNote}>Plays the opening line in the call’s voice. Disabled with a reason when voice preview isn’t configured.</p>
        <Capture galleryState="hear-idle"><HearButtonView name={NAME} status="idle" onPress={noop} /></Capture>
        <Capture galleryState="hear-loading"><HearButtonView name={NAME} status="loading" /></Capture>
        <Capture galleryState="hear-playing">
          <figure className={meetStyles.bubbleWrap}>
            <blockquote className={`${meetStyles.bubble} ${hearingBubbleClass}`}>{OPENING}</blockquote>
            <div className={meetStyles.hear}><HearButtonView name={NAME} status="playing" onPress={noop} /></div>
          </figure>
        </Capture>
        <Capture galleryState="hear-unavailable"><HearButtonView name={NAME} status="unavailable" /></Capture>
        <Capture galleryState="hear-error"><HearButtonView name={NAME} status="error" onPress={noop} /></Capture>
        <HearDemo />
      </section>
    </>
  );
}
