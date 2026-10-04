"use client";

import { motion, useReducedMotion } from "motion/react";
import { PhoneOff } from "lucide-react";
import { Portrait } from "@/components/ui";
import { reducedFade, springs } from "@/lib/ui/motion";
import styles from "./call.module.css";

export type RingingProps = {
  name: string;
  portraitSrc?: string | null;
  // Ends the session through the same teardown as leaving the call: microphone released, session ended.
  onCancel: () => void;
};

// S3 ringing: dark surround, large portrait with a slow pulse, "Calling {name}…". It covers the provider boot and gives way
// once the counterpart's video is actually playing (Q3).
export function Ringing({ name, portraitSrc, onCancel }: RingingProps) {
  const reduced = useReducedMotion();
  return (
    <div className={styles.ringing}>
      {/* Same initial values on server and client: reduced motion is only known after hydration. */}
      <motion.div className={styles.ringingPortrait} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={reduced ? reducedFade : springs.settle} data-reduced-fade>
        <span className={styles.pulse} aria-hidden="true" />
        <span className={styles.pulse} data-delay aria-hidden="true" />
        <Portrait name={name} size={240} src={portraitSrc} />
      </motion.div>
      <p className={styles.ringingName}>{name}</p>
      <p className={styles.ringingStatus}>Calling {name}…</p>
      <button type="button" className={styles.cancelButton} onClick={onCancel}>
        <PhoneOff size={20} strokeWidth={1.75} aria-hidden="true" />
        <span>Cancel call</span>
      </button>
    </div>
  );
}
