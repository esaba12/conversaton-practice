"use client";

import { useEffect, useState } from "react";
import { createSoundPlayer, type SoundPlayer } from "./sound";

/** One player per mounted screen. Unmounting stops the ring and closes the AudioContext. */
export function useSoundCues(): SoundPlayer {
  const [player] = useState(() => createSoundPlayer());
  useEffect(() => () => player.dispose(), [player]);
  return player;
}
