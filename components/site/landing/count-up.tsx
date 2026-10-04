"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { useReducedMotionPreference } from "./use-reduced-motion";

type Props = { value: number; decimals?: number; prefix?: string; suffix?: string; className?: string };

function format(value: number, decimals: number) {
  return value.toFixed(decimals);
}

/** Renders the final number on the server; counts up once on scroll into view unless motion is reduced. */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduced = useReducedMotionPreference();
  const primed = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced !== false) return;
    if (!inView) {
      if (!primed.current) { node.textContent = format(0, decimals); primed.current = true; }
      return;
    }
    const controls = animate(primed.current ? 0 : value, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => { node.textContent = format(latest, decimals); },
    });
    return () => controls.stop();
  }, [inView, reduced, value, decimals]);

  const final = `${prefix}${format(value, decimals)}${suffix}`;
  return (
    <span className={className}>
      <span className="sr-only">{final}</span>
      <span aria-hidden="true">{prefix}<span ref={ref}>{format(value, decimals)}</span>{suffix}</span>
    </span>
  );
}
