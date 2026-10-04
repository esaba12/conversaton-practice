"use client";

import { useEffect, useRef } from "react";

// Extracted unchanged from app/practice/practice-workspace.tsx (W1). Slice 0D owns the
// video-first behavior (Q3) next; this file only moves the element.
export function StreamVideo({ stream, muted = false }: { stream: MediaStream; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.srcObject = stream;
    return () => { element.srcObject = null; };
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} />;
}
