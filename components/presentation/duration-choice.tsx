"use client";

import { useId } from "react";
import styles from "./setup.module.css";

export const PRACTICE_DURATIONS = [
  { seconds: 180, label: "3 minutes" },
  { seconds: 300, label: "5 minutes" },
] as const;

export type PracticeDuration = (typeof PRACTICE_DURATIONS)[number]["seconds"];

export function DurationChoice({ value, onChange, disabled = false }: { value: PracticeDuration; onChange: (value: PracticeDuration) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend>Practice length</legend>
      <div className={styles.choices}>
        {PRACTICE_DURATIONS.map((option) => (
          <label key={option.seconds} className={styles.choice}>
            <input type="radio" name={`${id}-duration`} value={option.seconds} checked={value === option.seconds} onChange={() => onChange(option.seconds)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
