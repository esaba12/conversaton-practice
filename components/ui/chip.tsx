"use client";

import { useId, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { Check, LoaderCircle } from "lucide-react";
import { motionTransition } from "@/lib/ui/motion";
import { disabledReasonText, reasonId } from "./labels";
import styles from "./chip.module.css";

type ChipBaseProps = Omit<HTMLMotionProps<"button">, "children" | "disabled" | "aria-pressed" | "onClick"> & {
  label: string;
  selected: boolean;
  onSelectedChange?: (selected: boolean) => void;
  loading?: boolean;
};

export type ChipProps = ChipBaseProps & ({ disabled?: false; disabledReason?: never } | { disabled: true; disabledReason: string });

export function Chip({ label, selected, onSelectedChange, loading = false, disabled, disabledReason, className, id, ...rest }: ChipProps) {
  const reduced = useReducedMotion();
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const reason = disabledReasonText(disabled, disabledReason);
  const inert = Boolean(disabled) || loading;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (inert) { event.preventDefault(); return; }
    onSelectedChange?.(!selected);
  }

  // whileTap stays an object in every state: Motion adds tabindex when it is set, and reduced motion is only known on the client.
  const chip = (
    <motion.button
      {...rest}
      id={baseId}
      type="button"
      className={[styles.chip, className].filter(Boolean).join(" ")}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      aria-describedby={reason ? reasonId(baseId) : rest["aria-describedby"]}
      data-selected={selected || undefined}
      data-reduced-fade
      onClick={handleClick}
      whileTap={inert || reduced ? {} : { scale: 0.96 }}
      transition={motionTransition("press", reduced)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {loading ? (
          <motion.span key="loading" className={styles.icon} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionTransition("pop", reduced)}>
            <LoaderCircle className={styles.spin} size={16} strokeWidth={1.75} aria-hidden="true" />
          </motion.span>
        ) : selected ? (
          <motion.span key="check" className={styles.icon} initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4 }} transition={motionTransition("pop", reduced)}>
            <Check size={16} strokeWidth={1.75} aria-hidden="true" />
          </motion.span>
        ) : null}
      </AnimatePresence>
      <span>{label}</span>
    </motion.button>
  );

  if (!reason) return chip;
  return (
    <span className={styles.withReason}>
      {chip}
      <span id={reasonId(baseId)} className={styles.reason}>{reason}</span>
    </span>
  );
}
