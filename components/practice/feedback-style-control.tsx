"use client";

import { useEffect, useId, useState } from "react";
import { defaultFeedbackStyle, feedbackStyleOptions, getFeedbackStyle, setFeedbackStyle, type FeedbackStyle } from "@/lib/practice/feedback-style";
import styles from "./keep.module.css";

// L3: wording only. Stored on this device; the recap sends the chosen value with the reflection request.
export function FeedbackStyleControl({ initial }: { initial?: FeedbackStyle }) {
  const id = useId();
  // Starts at the default so server and first client render match; the stored choice loads after mount.
  const [value, setValue] = useState<FeedbackStyle>(initial ?? defaultFeedbackStyle);
  useEffect(() => { if (!initial) setValue(getFeedbackStyle()); }, [initial]);

  return (
    <fieldset className={`${styles.panel} ${styles.fieldset}`}>
      <legend className={`${styles.title} ${styles.legendReset}`}>How should feedback sound?</legend>
      <p className={styles.note}>This changes the wording of your reflection, not what it covers. It stays on this device.</p>
      {feedbackStyleOptions.map((option) => (
        <label key={option.value} className={styles.check} htmlFor={`${id}-${option.value}`}>
          <input id={`${id}-${option.value}`} type="radio" name={`${id}-feedback-style`} value={option.value} checked={value === option.value}
            onChange={() => { setValue(option.value); setFeedbackStyle(option.value); }} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
