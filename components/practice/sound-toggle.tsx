"use client";

import { useEffect, useId, useState } from "react";
import { readSoundsEnabled, writeSoundsEnabled } from "@/lib/practice/sound";
import styles from "./sound-toggle.module.css";

// R7: one device-only switch. The choice lives in this browser's localStorage and is never sent anywhere.
export function SoundToggle() {
  const id = useId();
  // On until the browser says otherwise, so the server render and the first client render match.
  const [enabled, setEnabled] = useState(true);
  useEffect(() => setEnabled(readSoundsEnabled()), []);

  return (
    <section className={styles.card} aria-labelledby={`${id}-title`} data-gallery-state={enabled ? "sounds-on" : "sounds-off"}>
      <label className={styles.switch}>
        <input type="checkbox" role="switch" checked={enabled} aria-describedby={`${id}-note`}
          onChange={(event) => { setEnabled(event.target.checked); writeSoundsEnabled(event.target.checked); }} />
        <span id={`${id}-title`}>Sounds</span>
      </label>
      <p id={`${id}-note`} className={styles.note}>Ring, connect and hang-up tones during a practice. This stays on this device only.</p>
    </section>
  );
}
