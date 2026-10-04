"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { monogram, portraitAlt, type PortraitSize } from "./labels";
import styles from "./portrait.module.css";

export type PortraitProps = {
  name: string;
  size?: PortraitSize;
  /** Face still. Falls back to the monogram when missing or when it fails to load. */
  src?: string | null;
  className?: string;
};

// Gradient pairs for the monogram. Every stop keeps --night-ink at 3:1 or better (large text).
const tones = [
  ["#c46a4a", "#345a49"],
  ["#3f7a68", "#22433a"],
  ["#8a4f6e", "#43304f"],
  ["#3f6f8f", "#263f5c"],
  ["#b9772f", "#6e4424"],
  ["#b65a5a", "#5e2f3d"],
  ["#5f7a3a", "#2f4a32"],
] as const;

/** Same name, same colours, on every screen, so the face reads as one person across the morph. */
export function portraitTone(name: string): readonly [string, string] {
  let hash = 0;
  for (const char of name.trim().toLocaleLowerCase()) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return tones[hash % tones.length];
}

export function Portrait({ name, size = 64, src, className }: PortraitProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const alt = portraitAlt(name);
  const showImage = Boolean(src) && failedSrc !== src;
  const classes = [styles.portrait, styles[`size${size}`], className].filter(Boolean).join(" ");

  // A server-rendered image can fail before hydration attaches onError.
  useEffect(() => {
    const image = imageRef.current;
    if (src && image?.complete && image.naturalWidth === 0) setFailedSrc(src);
  }, [src]);

  if (showImage && src) {
    return (
      <span className={classes}>
        <img ref={imageRef} className={styles.image} src={src} alt={alt} width={size} height={size} decoding="async" onError={() => setFailedSrc(src)} />
      </span>
    );
  }
  const [from, to] = portraitTone(name);
  return (
    <span className={`${classes} ${styles.fallback}`} role="img" aria-label={alt} style={{ "--tone-a": from, "--tone-b": to } as CSSProperties}>
      <span className={styles.monogram} aria-hidden="true">{monogram(name)}</span>
    </span>
  );
}
