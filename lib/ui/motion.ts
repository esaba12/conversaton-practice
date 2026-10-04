import type { Transition } from "motion/react";

/** Mirrors the CSS motion tokens in app/globals.css (`--t-quick`, `--t-base`, `--t-calm`). Keep both in step. */
export const durations = { quick: 0.15, base: 0.28, calm: 0.52 } as const;
export const easings = {
  standard: [0.2, 0, 0, 1],
  calm: [0.32, 0.72, 0, 1],
} as const;

export const springs = {
  /** Button and chip press: fast, no visible overshoot. */
  press: { type: "spring", stiffness: 700, damping: 42, mass: 0.6 },
  /** Card lift on hover and staggered reveal. */
  lift: { type: "spring", stiffness: 380, damping: 32, mass: 0.8 },
  /** Icons popping in (chip check). Small overshoot. */
  pop: { type: "spring", stiffness: 520, damping: 26, mass: 0.6 },
  /** Larger in-screen layout moves (panels, self-view drag settle). */
  settle: { type: "spring", stiffness: 220, damping: 30, mass: 1 },
} as const satisfies Record<string, Transition>;

export type SpringName = keyof typeof springs;

/** The only motion allowed under `prefers-reduced-motion: reduce`: a fade of at most 150 ms. */
export const reducedFade = { duration: durations.quick, ease: "linear" } as const satisfies Transition;

export function motionTransition(name: SpringName, reduced: boolean | null): Transition {
  return reduced ? reducedFade : springs[name];
}
