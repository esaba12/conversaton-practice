"use client";

import { useState } from "react";
import type { SessionPreset } from "@/lib/schemas/situation";
import styles from "./dashboard.module.css";

function hue(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function Avatar({ name, preset, size = 56 }: { name: string; preset: SessionPreset | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const h = hue(name);
  return (
    <span className={styles.avatar} style={{ width: size, height: size, "--h": h } as React.CSSProperties} aria-hidden="true">
      <span className={styles.avatarInitial}>{name.slice(0, 1).toUpperCase()}</span>
      {preset && !failed ? (
        <img src={`/api/portraits/${preset}`} alt="" width={size} height={size} onError={() => setFailed(true)} />
      ) : null}
    </span>
  );
}
