"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** null during server render and hydration, so markup matches; the real preference right after. */
export function useReducedMotionPreference(): boolean | null {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => null);
}
