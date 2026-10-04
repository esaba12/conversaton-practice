// Green-room mic meter (docs/32 S2 step 2). Web Audio, local only: the level never leaves the
// browser, is never stored, and the meter never stops the stream it reads (lib/practice/devices.ts
// owns the tracks).

export const METER_BARS = 12;

/** How many of `bars` light up for a 0–1 level. Any audible level lights at least one bar. */
export function litBars(level: number, bars = METER_BARS): number {
  if (!Number.isFinite(level) || level <= 0) return 0;
  return Math.min(bars, Math.max(1, Math.round(Math.min(1, level) * bars)));
}

/** RMS of 8-bit time-domain samples (128 is silence), scaled so ordinary speech reaches the top half. */
export function rmsLevel(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const centred = (samples[i] - 128) / 128;
    sum += centred * centred;
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 5);
}

export type MicMeter = { stop: () => void };
export type MicMeterFactory = (stream: MediaStream, onLevel: (level: number) => void) => MicMeter | null;

type MeterDeps = {
  AudioContext?: typeof AudioContext;
  requestFrame?: (callback: () => void) => number;
  cancelFrame?: (handle: number) => void;
};

/** Starts a meter on `stream`. Returns null when Web Audio is unavailable; the microphone still works. */
export function startMicMeter(stream: MediaStream, onLevel: (level: number) => void, deps: MeterDeps = {}): MicMeter | null {
  const Context = deps.AudioContext ?? globalThis.AudioContext;
  const requestFrame = deps.requestFrame ?? globalThis.requestAnimationFrame?.bind(globalThis);
  const cancelFrame = deps.cancelFrame ?? globalThis.cancelAnimationFrame?.bind(globalThis);
  if (!Context || !requestFrame || !cancelFrame) return null;
  let context: AudioContext;
  let source: MediaStreamAudioSourceNode;
  let analyser: AnalyserNode;
  try {
    context = new Context();
    source = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
  } catch {
    return null;
  }
  const samples = new Uint8Array(analyser.fftSize);
  let stopped = false;
  let frame = 0;
  const tick = () => {
    if (stopped) return;
    analyser.getByteTimeDomainData(samples);
    onLevel(rmsLevel(samples));
    frame = requestFrame(tick);
  };
  frame = requestFrame(tick);
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      cancelFrame(frame);
      try { source.disconnect(); } catch { /* already disconnected */ }
      void context.close().catch(() => undefined);
      onLevel(0);
    },
  };
}
