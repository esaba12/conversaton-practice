"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState, useSyncExternalStore } from "react";
import { motionTransition } from "@/lib/ui/motion";
import styles from "./meet-card-demo.module.css";

// Scripted and local: no portrait, audio or fetch, so interacting with it makes no network request.
const stages = ["Before", "Call", "After"] as const;
type Stage = (typeof stages)[number];
const replies = [
  { you: "Can we split the dishes by day?", alex: "Honestly, I hadn’t noticed it was piling up. Which days were you thinking?" },
  { you: "It bugs me when they sit overnight.", alex: "Okay, fair. I get home late, though. Can mornings count?" },
] as const;

// The server renders the moving card; a subscription (unlike a first-render read) updates it after hydration.
const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function MeetCardDemo() {
  const id = useId();
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCE).matches, () => false);
  const [stage, setStage] = useState<Stage>("Call");
  const [picked, setPicked] = useState<number | null>(null);
  const transition = motionTransition("settle", reduced);
  const line = picked === null ? "Hey, got a minute? I wanted to talk about the kitchen." : replies[picked].alex;

  return (
    <aside className={styles.card} aria-label="Illustration of a practice call" data-still={reduced ? "true" : "false"}>
      <div className={styles.top}>
        <p className={styles.kicker}>Practice call</p>
        <span className={styles.tag}>Fictional AI</span>
      </div>
      <div role="tablist" aria-label="Practice steps" className={styles.tabs}>
        {stages.map((item) => (
          <button key={item} type="button" role="tab" id={`${id}-${item}`} aria-selected={stage === item} aria-controls={`${id}-panel`}
            className={styles.tab} onClick={() => setStage(item)}>{item}</button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${stage}`} className={styles.panel}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={stage} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={transition}>
            {stage === "Before" && <div className={styles.stack}>
              <p className={styles.label}>What’s going on with Alex?</p>
              <p className={styles.quote}>The dishes keep piling up and I want to ask for a plan without a fight.</p>
              <p className={styles.private}><span>Only you see this</span> I tend to back down when someone sounds annoyed.</p>
            </div>}
            {stage === "Call" && <div className={styles.stack}>
              <div className={styles.tile}>
                <span className={styles.face} aria-hidden="true" data-speaking={!reduced}>A</span>
                <p className={styles.name}>Alex <span>Fictional roommate</span></p>
              </div>
              <p className={styles.caption} aria-live="polite">“{line}”</p>
              <div className={styles.replies} role="group" aria-label="Try a reply">
                {replies.map((reply, index) => (
                  <button key={reply.you} type="button" className={styles.reply} aria-pressed={picked === index} onClick={() => setPicked(index)}>{reply.you}</button>
                ))}
              </div>
            </div>}
            {stage === "After" && <div className={styles.stack}>
              <p className={styles.label}>A short reflection, if you want one</p>
              <p className={styles.quote}>You named the dishes plainly and asked for a plan. Next time, try saying what you need first.</p>
              <p className={styles.note}>Your notes stay with you. Save Alex only if you choose.</p>
            </div>}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className={styles.note}>Illustration only. A real practice uses a live video call after you sign in.</p>
    </aside>
  );
}
