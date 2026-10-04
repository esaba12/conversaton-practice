"use client";

import { useEffect, useRef, useState } from "react";
import { monogram, portraitAlt, type PortraitSize } from "./labels";
import styles from "./portrait.module.css";

export type PortraitProps = {
  name: string;
  size?: PortraitSize;
  /** Face still. Falls back to the monogram when missing or when it fails to load. */
  src?: string | null;
  className?: string;
};

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
  return (
    <span className={`${classes} ${styles.fallback}`} role="img" aria-label={alt}>
      <span className={styles.monogram} aria-hidden="true">{monogram(name)}</span>
    </span>
  );
}
