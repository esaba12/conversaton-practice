"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import type { GoalLightState } from "@/lib/goal-check/client";
import styles from "./goal-voice.module.css";

export const GOAL_LIGHT_LABEL = "Light up my goal when I say it";
export const GOAL_LIGHT_NOTE = "During the call, what you say is checked by a separate model to see whether you said your line. The character never learns your goal.";

// The live region is always rendered so screen readers announce the change from empty to "Goal reached".
export function GoalPill({ goal, state, className }: { goal: string; state: GoalLightState; className?: string }) {
  const reached = state === "reached";
  return (
    <p className={[styles.pill, className].filter(Boolean).join(" ")} data-goal-state={state}>
      <span className={styles.pillLabel}>
        {reached ? <Check className={styles.check} size={14} strokeWidth={2.25} aria-hidden="true" /> : null}Your line
      </span>
      {goal}
      <span className="sr-only" aria-live="polite">{reached ? "Goal reached" : ""}</span>
    </p>
  );
}

// Off by default; the owner keeps the value in browser memory for this practice only.
export function GoalLightToggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className={styles.toggleRow}>
      <label className={styles.switch}>
        <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} aria-describedby={`${id}-note`} />
        <span>{GOAL_LIGHT_LABEL}</span>
      </label>
      <p id={`${id}-note`} className={styles.note}>{GOAL_LIGHT_NOTE}</p>
    </div>
  );
}
