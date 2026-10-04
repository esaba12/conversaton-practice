"use client";

import { startTransition, ViewTransition, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "motion/react";
import type { FlowStage } from "@/lib/practice/flow";
import "./transitions.css";

// Card -> briefing -> green room -> ringing -> call -> recap (docs/33 Motion), built on React's <ViewTransition>.
// A ViewTransition only animates updates made inside startTransition, so stage changes go through startStage and
// startMorph. Reduced motion: no morphs, only a fade of at most 150 ms (docs/33).

/** The one shared name. Only one mounted element may carry it at a time. */
export const PORTRAIT_NAME = "practice-portrait";

export type StageGroup = "lobby" | "briefing" | "meet" | "green" | "call" | "recap";

/**
 * Which stages share a mounted screen. Ringing and call are one group because they are the same CallStage
 * and remounting it would drop the remote video; the retry twins map onto the same groups.
 */
export function stageGroup(stage: FlowStage): StageGroup {
  switch (stage) {
    case "ringing":
    case "call":
    case "retry-ringing":
    case "retry-call":
      return "call";
    case "recap":
    case "retry-recap":
      return "recap";
    default:
      return stage;
  }
}

export type TransitionClasses = {
  stageEnter: string;
  stageExit: string;
  fadeEnter: string;
  fadeExit: string;
  portraitShare: string;
};

/** The classes transitions.css animates. Reduced motion swaps every morph for the 150 ms fade or nothing. */
export function transitionClasses(reduced: boolean): TransitionClasses {
  return reduced
    ? { stageEnter: "practice-fade", stageExit: "practice-fade", fadeEnter: "practice-fade", fadeExit: "practice-fade", portraitShare: "none" }
    : { stageEnter: "practice-stage-enter", stageExit: "practice-stage-exit", fadeEnter: "practice-fade", fadeExit: "practice-fade", portraitShare: "practice-morph" };
}

/** Wrap a stage change in a transition so the wrappers below animate it. */
export function startStage(update: () => void): void {
  startTransition(update);
}

/**
 * Starts a morph from a specific element. `markSource` commits first (and synchronously) so the clicked portrait
 * carries PORTRAIT_NAME in the old frame; `update` then changes the stage inside a transition.
 */
export function startMorph(markSource: () => void, update: () => void): void {
  flushSync(markSource);
  startTransition(update);
}

/** Crossfades whole screens when the stage group changes; the children remount, so keep media outside the group boundary. */
export function StageTransition({ stage, children }: { stage: FlowStage; children: ReactNode }) {
  const classes = transitionClasses(!!useReducedMotion());
  return (
    <ViewTransition key={stageGroup(stage)} enter={classes.stageEnter} exit={classes.stageExit} default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * Marks a portrait (or video tile) as the shared element. Pass `active` only for the one portrait that is leaving
 * or arriving; every other instance keeps an anonymous, non-animating wrapper so the tree never remounts.
 */
export function PortraitTransition({ active = true, children }: { active?: boolean; children: ReactNode }) {
  const classes = transitionClasses(!!useReducedMotion());
  return (
    <ViewTransition name={active ? PORTRAIT_NAME : undefined} share={classes.portraitShare} default="none">
      {children}
    </ViewTransition>
  );
}

/** Fades a piece of a screen in or out as it mounts or unmounts, for example ringing giving way to the call bar. */
export function FadeTransition({ children }: { children: ReactNode }) {
  const classes = transitionClasses(!!useReducedMotion());
  return (
    <ViewTransition enter={classes.fadeEnter} exit={classes.fadeExit} default="none">
      {children}
    </ViewTransition>
  );
}
