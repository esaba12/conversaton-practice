"use client";

import { useId, type MouseEvent } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { motionTransition } from "@/lib/ui/motion";
import { disabledReasonText, reasonId } from "./labels";
import styles from "./primary-button.module.css";

type PrimaryButtonBaseProps = Omit<HTMLMotionProps<"button">, "children" | "disabled"> & {
  /** Says what happens ("Call Jordan", not "Continue"). */
  label: string;
  icon?: LucideIcon;
  loading?: boolean;
  /** Shown while loading, e.g. "Calling Jordan…". Defaults to the label. */
  loadingLabel?: string;
};

export type PrimaryButtonProps = PrimaryButtonBaseProps & ({ disabled?: false; disabledReason?: never } | { disabled: true; disabledReason: string });

export function PrimaryButton({ label, icon: Icon, loading = false, loadingLabel, disabled, disabledReason, className, id, onClick, type = "button", ...rest }: PrimaryButtonProps) {
  const reduced = useReducedMotion();
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const reason = disabledReasonText(disabled, disabledReason);
  const inert = Boolean(disabled) || loading;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (inert) { event.preventDefault(); return; }
    onClick?.(event);
  }

  // whileTap stays an object in every state: Motion adds tabindex when it is set, and reduced motion is only known on the client.
  const button = (
    <motion.button
      {...rest}
      id={baseId}
      type={type}
      className={[styles.button, className].filter(Boolean).join(" ")}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      aria-describedby={reason ? reasonId(baseId) : rest["aria-describedby"]}
      data-reduced-fade
      onClick={handleClick}
      whileTap={inert || reduced ? {} : { scale: 0.98, y: 0.5 }}
      transition={motionTransition("press", reduced)}
    >
      {loading ? <LoaderCircle className={styles.spin} size={20} strokeWidth={1.75} aria-hidden="true" /> : Icon ? <Icon size={20} strokeWidth={1.75} aria-hidden="true" /> : null}
      <span>{loading ? loadingLabel ?? label : label}</span>
    </motion.button>
  );

  if (!reason) return button;
  return (
    <span className={styles.withReason}>
      {button}
      <span id={reasonId(baseId)} className={styles.reason}>{reason}</span>
    </span>
  );
}
