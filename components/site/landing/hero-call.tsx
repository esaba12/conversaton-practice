"use client";

import { Captions, Lock, Mic, PhoneOff, Target, VideoOff } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./landing.module.css";
import { useReducedMotionPreference } from "./use-reduced-motion";

const script = [
  { who: "Jordan", text: "Sure, I have a few minutes. What’s up?" },
  { who: "You", text: "I’m stretched thin. Could we move the onboarding project to next month?" },
  { who: "Jordan", text: "That one has a deadline. What would you hand off instead?" },
  { who: "You", text: "The vendor report. Sam already knows that system." },
] as const;

const START_SECONDS = 168;

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Decorative, scripted hero call. No media, network, or real person behind it. */
export function HeroCall() {
  const reduced = useReducedMotionPreference();
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState<number>(script[0].text.length);
  const [seconds, setSeconds] = useState(START_SECONDS);

  useEffect(() => {
    if (reduced !== false) return;
    const full = script[line].text.length;
    const timer = chars < full
      ? setTimeout(() => setChars((count) => count + 1), 32)
      : setTimeout(() => { setLine((index) => (index + 1) % script.length); setChars(0); }, 2400);
    return () => clearTimeout(timer);
  }, [reduced, line, chars]);

  useEffect(() => {
    if (reduced !== false) return;
    const tick = setInterval(() => setSeconds((value) => (value <= 20 ? START_SECONDS : value - 1)), 1000);
    return () => clearInterval(tick);
  }, [reduced]);

  const current = script[line];
  const characterSpeaking = current.who === "Jordan";
  const moving = reduced === false;

  return (
    <div className={styles.callWrap} role="img" aria-label="Illustration of a live practice video call with Jordan, a fictional AI manager.">
      <div className={styles.call} aria-hidden="true" data-moving={moving}>
        <div className={styles.callScene}>
          <div className={styles.callTop}>
            <span className={styles.livePill}><span className={styles.liveDot} /> Live</span>
            <span className={styles.timePill}>{clock(seconds)} left</span>
          </div>

          <div className={styles.avatar} data-speaking={characterSpeaking && moving}>
            <span className={styles.ring} />
            <span className={`${styles.ring} ${styles.ringLate}`} />
            <svg viewBox="0 0 200 200" className={styles.silhouette}>
              <defs>
                <linearGradient id="hero-skin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#e9b48f" />
                  <stop offset="1" stopColor="#b9714f" />
                </linearGradient>
                <linearGradient id="hero-shirt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4d7a65" />
                  <stop offset="1" stopColor="#2a4a3c" />
                </linearGradient>
              </defs>
              <path d="M30 200c4-42 34-66 70-66s66 24 70 66z" fill="url(#hero-shirt)" />
              <path d="M86 120h28v22c0 8-28 8-28 0z" fill="#b9714f" />
              <circle cx="100" cy="84" r="40" fill="url(#hero-skin)" />
              <path d="M60 80c0-28 18-44 41-44 24 0 40 15 40 40-10-10-26-16-44-16-15 0-27 7-37 20z" fill="#3a2a22" />
            </svg>
          </div>

          <div className={styles.nameTag}>
            <strong>Jordan</strong>
            <span>Fictional manager</span>
          </div>

          <div className={styles.wave} data-active={characterSpeaking && moving}>
            {Array.from({ length: 14 }, (_, index) => <span key={index} style={{ animationDelay: `${(index * 97) % 700}ms` }} />)}
          </div>

          <p className={styles.caption}>
            <span className={styles.captionWho}>{current.who}</span>
            <span>{current.text.slice(0, chars)}<span className={styles.caret} data-on={moving && chars < current.text.length} /></span>
          </p>

          <div className={styles.selfView} data-speaking={!characterSpeaking && moving}>
            <VideoOff size={16} strokeWidth={1.8} />
            <span>You · camera off</span>
          </div>
        </div>

        <div className={styles.controls}>
          <span className={styles.control}><Mic size={18} strokeWidth={1.8} /></span>
          <span className={styles.control}><VideoOff size={18} strokeWidth={1.8} /></span>
          <span className={styles.control}><Captions size={18} strokeWidth={1.8} /></span>
          <span className={`${styles.control} ${styles.controlEnd}`}><PhoneOff size={18} strokeWidth={1.8} /></span>
        </div>
      </div>

      <span className={`${styles.floatChip} ${styles.chipGoal}`} aria-hidden="true">
        <Target size={15} strokeWidth={2} /> Goal: ask to move one project
      </span>
      <span className={`${styles.floatChip} ${styles.chipNotes}`} aria-hidden="true">
        <Lock size={15} strokeWidth={2} /> Only you see your notes
      </span>
      <span className={`${styles.floatChip} ${styles.chipAi}`} aria-hidden="true">Fictional AI character</span>
    </div>
  );
}
