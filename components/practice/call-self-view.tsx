"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { motionTransition } from "@/lib/ui/motion";
import styles from "./call.module.css";

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// Arrow keys move the tile between corners: the keyboard alternative to dragging.
export function nextCorner(corner: Corner, key: string): Corner {
  const [vertical, horizontal] = corner.split("-") as ["top" | "bottom", "left" | "right"];
  switch (key) {
    case "ArrowLeft": return `${vertical}-left`;
    case "ArrowRight": return `${vertical}-right`;
    case "ArrowUp": return `top-${horizontal}`;
    case "ArrowDown": return `bottom-${horizontal}`;
    default: return corner;
  }
}

const cornerLabels: Record<Corner, string> = { "top-left": "top left", "top-right": "top right", "bottom-left": "bottom left", "bottom-right": "bottom right" };

// Local camera preview. Never published; the counterpart cannot see it.
export function SelfView({ children, glow, initialCorner = "top-right" }: { children: ReactNode; glow: boolean; initialCorner?: Corner }) {
  const reduced = useReducedMotion();
  const [corner, setCorner] = useState<Corner>(initialCorner);
  const ref = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextCorner(corner, event.key);
    if (next === corner) return;
    event.preventDefault();
    setCorner(next);
  }

  function onDragEnd(_event: unknown, info: PanInfo) {
    const parent = ref.current?.offsetParent?.getBoundingClientRect();
    if (!parent) return;
    const vertical = info.point.y - parent.top < parent.height / 2 ? "top" : "bottom";
    const horizontal = info.point.x - parent.left < parent.width / 2 ? "left" : "right";
    setCorner(`${vertical}-${horizontal}`);
  }

  return (
    <motion.div ref={ref} layout className={styles.selfView} data-corner={corner} data-glow={glow || undefined} tabIndex={0} role="group"
      aria-label={`Your camera preview, only you see it. In the ${cornerLabels[corner]} corner; arrow keys move it.`}
      onKeyDown={onKeyDown} drag dragMomentum={false} dragSnapToOrigin onDragEnd={onDragEnd}
      transition={motionTransition("settle", reduced)} data-reduced-fade>
      {children}
      <span className={styles.selfLabel}>You · only you</span>
    </motion.div>
  );
}
