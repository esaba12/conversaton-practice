"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Portrait } from "@/components/ui";
import { FadeTransition, PortraitTransition, StageTransition, startMorph, startStage } from "@/components/practice/transitions";
import { readSoundsEnabled } from "@/lib/practice/sound";
import { useSoundCues } from "@/lib/practice/use-sound-cues";
import type { FlowStage } from "@/lib/practice/flow";
import gallery from "../gallery.module.css";
import styles from "./motion-gallery.module.css";

// Fake stages only: nothing here starts a call, touches the microphone or camera, or contacts a provider.
const NAME = "Jordan";
const steps: readonly { id: string; label: string; flow: FlowStage }[] = [
  { id: "card", label: "Lobby card", flow: "lobby" },
  { id: "briefing", label: "Briefing", flow: "briefing" },
  { id: "ringing", label: "Ringing", flow: "ringing" },
  { id: "call", label: "Call", flow: "call" },
  { id: "recap", label: "Recap", flow: "recap" },
];

function Screen({ id, night = false, children }: { id: string; night?: boolean; children: ReactNode }) {
  return <div className={styles.screen} data-surface={night ? "night" : undefined} data-gallery-state={`morph-${id}`}>{children}</div>;
}

export function MotionGallery() {
  const preference = useReducedMotion();
  // Known only after hydration, so the first render matches the server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduced = mounted && !!preference;
  const [index, setIndex] = useState(0);
  const [source, setSource] = useState(false);
  const step = steps[index];

  const go = (next: number) => startStage(() => setIndex(Math.max(0, Math.min(steps.length - 1, next))));

  return (
    <>
      <section id="morph" className={gallery.section} aria-labelledby="morph-heading">
        <h2 id="morph-heading" className={gallery.sectionTitle}>Stage morph</h2>
        <p className={gallery.sectionNote}>
          The portrait travels from the lobby card to the briefing; each screen crossfades; ringing gives way to the call bar. With reduced motion on, nothing moves and screens fade in 150 ms or less.
        </p>
        <div className={styles.controls}>
          <button type="button" className="button secondary" onClick={() => go(index - 1)} disabled={index === 0}>Back</button>
          {index === 0
            ? <button type="button" className="button" onClick={() => startMorph(() => setSource(true), () => setIndex(1))}>Open {NAME}’s briefing</button>
            : <button type="button" className="button" onClick={() => go(index + 1)} disabled={index === steps.length - 1}>Next: {steps[Math.min(index + 1, steps.length - 1)].label}</button>}
          <button type="button" className="button secondary" onClick={() => go(0)} disabled={index === 0}>Reset</button>
          <p className={styles.status} role="status" data-gallery-state="morph-status" data-reduced={reduced}>
            Stage: {step.label}. Reduced motion is {reduced ? "on" : "off"} (follows your system setting).
          </p>
        </div>

        <div className={styles.stageFrame}>
          <StageTransition stage={step.flow}>
            {step.id === "card" ? (
              <Screen id="card">
                <div className={styles.cards}>
                  {["Alex", NAME, "Sam"].map((name) => (
                    <div key={name} className={styles.card}>
                      <PortraitTransition active={name === NAME && source}><Portrait name={name} size={120} /></PortraitTransition>
                      <p className={styles.cardName}>{name}</p>
                    </div>
                  ))}
                </div>
              </Screen>
            ) : step.id === "briefing" ? (
              <Screen id="briefing">
                <div className={styles.briefing}>
                  <PortraitTransition><Portrait name={NAME} size={240} /></PortraitTransition>
                  <div><p className={styles.cardName}>What’s going on with {NAME}?</p><p className={styles.note}>The portrait kept its place while the grid faded.</p></div>
                </div>
              </Screen>
            ) : step.id === "recap" ? (
              <Screen id="recap">
                <div className={styles.recap}>
                  <PortraitTransition><Portrait name={NAME} size={64} /></PortraitTransition>
                  <p className={styles.cardName}>That was a real try.</p>
                </div>
              </Screen>
            ) : (
              <Screen id={step.id} night>
                <div className={styles.callBody}>
                  {step.id === "ringing"
                    ? <FadeTransition key="ringing"><div className={styles.ringing}><PortraitTransition><Portrait name={NAME} size={240} /></PortraitTransition><p>Calling {NAME}…</p></div></FadeTransition>
                    : <FadeTransition key="live"><div className={styles.live}><p className={styles.note}>Synthetic video slot</p><div className={styles.bar} aria-hidden="true"><span /><span /><span /></div></div></FadeTransition>}
                </div>
              </Screen>
            )}
          </StageTransition>
        </div>
      </section>
      <CueGallery />
    </>
  );
}

function CueGallery() {
  const player = useSoundCues();
  const [enabled, setEnabled] = useState(true);
  const [playing, setPlaying] = useState<string>("none");
  useEffect(() => setEnabled(readSoundsEnabled()), []);

  const play = (cue: "ring" | "connect" | "hangup") => {
    player.unlock();
    setEnabled(readSoundsEnabled());
    setPlaying(cue);
    if (cue === "ring") player.ring();
    else if (cue === "connect") player.connect();
    else player.hangup();
  };

  return (
    <section id="cues" className={gallery.section} aria-labelledby="cues-heading">
      <h2 id="cues-heading" className={gallery.sectionTitle}>Sound cues</h2>
      <p className={gallery.sectionNote}>Synthesized in your browser with oscillators; no audio files. They follow the Sounds switch on About me, so turn it on there first if these stay silent.</p>
      <div className={styles.controls} data-gallery-state={`cue-${playing}`}>
        <button type="button" className="button secondary" onClick={() => play("ring")}>Play ring</button>
        <button type="button" className="button secondary" onClick={() => { player.stopRing(); setPlaying("none"); }}>Stop ring</button>
        <button type="button" className="button secondary" onClick={() => play("connect")}>Play connect</button>
        <button type="button" className="button secondary" onClick={() => play("hangup")}>Play hang-up</button>
        <p className={styles.status} role="status">{enabled ? "Sounds are on for this device." : "Sounds are off for this device, so cues are silent."}</p>
      </div>
    </section>
  );
}
