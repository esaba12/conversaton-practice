// Synthesized call cues (docs/32 R7): ring, connect and hang-up from Web Audio oscillators, so there are
// no audio files to license. Nothing here touches the network, the microphone or a provider. The player
// never throws into the call flow: any audio failure is silence.

export type Cue = "ring" | "connect" | "hangup";

type Note = { at: number; duration: number; freq: number; peak: number };

/** The ring is one cycle of this length repeated; every other cue plays once. */
export const RING_CYCLE_SECONDS = 2.6;
/** Safety stop so a missed stopRing() can never ring forever. */
export const RING_LIMIT_SECONDS = 60;
export const MAX_CUE_SECONDS = 1.5;
/** Gentle: the loudest note reaches 0.18 * 0.6 of full scale. */
const MASTER_GAIN = 0.18;
const FLOOR = 0.0001;
const RELEASE_SECONDS = 0.05;
const TAIL_SECONDS = 0.02;

const notes: Record<Cue, readonly Note[]> = {
  // Soft two-tone: 440 and 480 Hz together, 0.9 s on, then silence to the end of the cycle.
  ring: [
    { at: 0, duration: 0.9, freq: 440, peak: 0.5 },
    { at: 0, duration: 0.9, freq: 480, peak: 0.5 },
  ],
  // One warm chime: C5 with a quiet octave above.
  connect: [
    { at: 0, duration: 1.2, freq: 523.25, peak: 0.6 },
    { at: 0, duration: 0.7, freq: 1046.5, peak: 0.15 },
  ],
  // Two descending notes: C5 then G4.
  hangup: [
    { at: 0, duration: 0.3, freq: 523.25, peak: 0.5 },
    { at: 0.22, duration: 0.45, freq: 392, peak: 0.5 },
  ],
};

export function cueNotes(cue: Cue): readonly Note[] {
  return notes[cue];
}

/** Seconds until the last note has fully released (one cycle for the ring). */
export function cueLength(cue: Cue): number {
  return Math.max(...notes[cue].map((note) => note.at + note.duration)) + TAIL_SECONDS;
}

// The slice of the Web Audio API this file uses, so tests can stub it. The real AudioContext satisfies it.
type ParamLike = {
  setValueAtTime(value: number, time: number): unknown;
  linearRampToValueAtTime(value: number, time: number): unknown;
  exponentialRampToValueAtTime(value: number, time: number): unknown;
  cancelScheduledValues(time: number): unknown;
};
type NodeLike = { connect(destination: never): unknown; disconnect(): void };
type OscillatorLike = NodeLike & { type: OscillatorType; frequency: { value: number }; start(time?: number): void; stop(time?: number): void };
type GainLike = NodeLike & { gain: ParamLike & { value: number } };
export type AudioContextLike = {
  readonly currentTime: number;
  readonly state: string;
  readonly destination: unknown;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  resume(): Promise<void>;
  close(): Promise<void>;
};

export type SoundPlayerOptions = {
  createContext?: () => AudioContextLike | null;
  isEnabled?: () => boolean;
  // False until the person has interacted with the page, so no audio starts on a bare page load.
  hasUserGesture?: () => boolean;
};

export type SoundPlayer = {
  /** Call from a click handler to prepare audio so the ring can start later without a fresh gesture. */
  unlock(): void;
  ring(): void;
  /** Ends the ring. Safe to call when nothing is ringing. */
  stopRing(): void;
  /** Stops the ring, then one warm chime. */
  connect(): void;
  /** Stops the ring, then two descending notes. */
  hangup(): void;
  /** Stops everything and closes the AudioContext. The player can be used again afterwards. */
  dispose(): void;
};

type Voice = { osc: OscillatorLike; gain: GainLike; end: number };

const SOUNDS_KEY = "practice:sounds";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function deviceStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Sounds are on unless the person turned them off on this device. */
export function readSoundsEnabled(storage: StorageLike | null = deviceStorage()): boolean {
  try {
    return storage?.getItem(SOUNDS_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeSoundsEnabled(enabled: boolean, storage: StorageLike | null = deviceStorage()): void {
  try {
    storage?.setItem(SOUNDS_KEY, enabled ? "on" : "off");
  } catch {
    // Storage can be blocked; the choice then lasts only for this page.
  }
}

function browserContext(): AudioContextLike | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

function browserGesture(): boolean {
  if (typeof navigator === "undefined") return false;
  // Browsers without userActivation (older Safari) cannot say; the context then just stays suspended.
  return navigator.userActivation?.hasBeenActive ?? true;
}

export function createSoundPlayer(options: SoundPlayerOptions = {}): SoundPlayer {
  const createContext = options.createContext ?? browserContext;
  const isEnabled = options.isEnabled ?? (() => readSoundsEnabled());
  const hasUserGesture = options.hasUserGesture ?? browserGesture;

  let ctx: AudioContextLike | null = null;
  let master: GainLike | null = null;
  let voices: Voice[] = [];
  let ring: { bus: GainLike; timer: ReturnType<typeof setTimeout>; startedAt: number } | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  function ensure(): AudioContextLike | null {
    if (ctx) return ctx;
    if (!hasUserGesture()) return null;
    const created = createContext();
    if (!created) return null;
    const gain = created.createGain();
    gain.gain.value = MASTER_GAIN;
    gain.connect(created.destination as never);
    ctx = created;
    master = gain;
    return created;
  }

  function schedule(cue: Cue, at: number, bus: GainLike): void {
    if (!ctx) return;
    for (const note of notes[cue]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = at + note.at;
      const end = start + note.duration;
      const attack = Math.min(0.02, note.duration / 4);
      osc.type = "sine";
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(FLOOR, start);
      gain.gain.linearRampToValueAtTime(note.peak, start + attack);
      gain.gain.exponentialRampToValueAtTime(FLOOR, end);
      osc.connect(gain as never);
      gain.connect(bus as never);
      osc.start(start);
      osc.stop(end + TAIL_SECONDS);
      voices.push({ osc, gain, end: end + TAIL_SECONDS });
    }
  }

  function prune(): void {
    if (!ctx) return;
    const now = ctx.currentTime;
    voices = voices.filter((voice) => {
      if (voice.end > now) return true;
      voice.gain.disconnect();
      return false;
    });
  }

  function stopVoice(voice: Voice, at?: number): void {
    try {
      voice.osc.stop(at);
    } catch {
      // Already stopped; nothing left to silence.
    }
  }

  function cancelIdle(): void {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
  }

  // A context left open keeps the audio device awake, so close it once the last cue has played.
  function closeSoon(seconds: number): void {
    cancelIdle();
    idleTimer = setTimeout(() => {
      idleTimer = null;
      if (!ring) close();
    }, seconds * 1000 + 100);
  }

  function close(): void {
    cancelIdle();
    const closing = ctx;
    ctx = null;
    master = null;
    voices = [];
    if (closing) void closing.close().catch(() => undefined);
  }

  function ringCycle(): void {
    if (!ctx || !ring) return;
    if (ctx.currentTime - ring.startedAt >= RING_LIMIT_SECONDS) {
      stopRing();
      return;
    }
    prune();
    schedule("ring", ctx.currentTime + 0.02, ring.bus);
    ring.timer = setTimeout(ringCycle, RING_CYCLE_SECONDS * 1000);
  }

  function stopRing(): void {
    const active = ring;
    ring = null;
    if (!active) return;
    clearTimeout(active.timer);
    try {
      if (ctx) {
        const now = ctx.currentTime;
        active.bus.gain.cancelScheduledValues(now);
        active.bus.gain.setValueAtTime(1, now);
        active.bus.gain.linearRampToValueAtTime(FLOOR, now + RELEASE_SECONDS);
        for (const voice of voices) stopVoice(voice, now + RELEASE_SECONDS + TAIL_SECONDS);
      }
    } catch {
      // Already stopped; nothing left to silence.
    }
    if (!idleTimer) closeSoon(RELEASE_SECONDS + TAIL_SECONDS);
  }

  function once(cue: "connect" | "hangup"): void {
    stopRing();
    if (!isEnabled()) return;
    try {
      const context = ensure();
      if (!context || !master) return;
      cancelIdle();
      void context.resume().catch(() => undefined);
      prune();
      schedule(cue, context.currentTime + 0.02, master);
      closeSoon(cueLength(cue) + 0.02);
    } catch {
      close();
    }
  }

  return {
    unlock() {
      if (!isEnabled()) return;
      try {
        const context = ensure();
        if (context) void context.resume().catch(() => undefined);
        if (context && !ring) closeSoon(30);
      } catch {
        close();
      }
    },
    ring() {
      if (ring || !isEnabled()) return;
      try {
        const context = ensure();
        if (!context || !master) return;
        cancelIdle();
        void context.resume().catch(() => undefined);
        const bus = context.createGain();
        bus.gain.value = 1;
        bus.connect(master as never);
        ring = { bus, timer: setTimeout(ringCycle, 0), startedAt: context.currentTime };
      } catch {
        ring = null;
        close();
      }
    },
    stopRing,
    connect: () => once("connect"),
    hangup: () => once("hangup"),
    dispose() {
      const active = ring;
      ring = null;
      if (active) clearTimeout(active.timer);
      for (const voice of voices) stopVoice(voice);
      close();
    },
  };
}
