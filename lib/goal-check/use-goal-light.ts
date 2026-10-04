import { useEffect, useRef, useState } from "react";
import type { TranscriptTurn } from "@/lib/schemas/reflection";
import { createGoalWatcher, requestGoalCheck, type GoalLightState, type GoalWatcher } from "./client";

type Send = (sessionId: string, goal: string, transcript: readonly TranscriptTurn[]) => Promise<boolean>;

// A watcher exists only while on and not yet reached; off (toggle off, no goal or no live session) sends nothing.
export function goalLightPlan({ enabled, sessionId, goal, reachedFor }: { enabled: boolean; sessionId: string | null; goal: string; reachedFor: string | null }) {
  const on = enabled && Boolean(sessionId) && Boolean(goal.trim());
  const state: GoalLightState = !on ? "off" : reachedFor === sessionId ? "reached" : "watching";
  return { state, watch: state === "watching" };
}

export function useGoalLight({ enabled, sessionId, goal, turns, send = requestGoalCheck }: {
  enabled: boolean;
  sessionId: string | null;
  goal: string;
  turns: readonly TranscriptTurn[];
  send?: Send;
}): GoalLightState {
  const [reachedFor, setReachedFor] = useState<string | null>(null);
  const watcher = useRef<GoalWatcher | null>(null);
  const trimmed = goal.trim();
  const { state, watch } = goalLightPlan({ enabled, sessionId, goal: trimmed, reachedFor });

  useEffect(() => {
    if (!watch || !sessionId) return;
    const current = createGoalWatcher({ send: (transcript) => send(sessionId, trimmed, transcript), onReached: () => setReachedFor(sessionId) });
    watcher.current = current;
    return () => { current.dispose(); if (watcher.current === current) watcher.current = null; };
  }, [watch, sessionId, trimmed, send]);

  useEffect(() => { if (watch) watcher.current?.update(turns); }, [watch, turns]);

  return state;
}
