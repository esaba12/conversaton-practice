import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_CUE_SECONDS, RING_CYCLE_SECONDS, RING_LIMIT_SECONDS, createSoundPlayer, cueLength, cueNotes, readSoundsEnabled, writeSoundsEnabled,
  type AudioContextLike, type Cue,
} from "@/lib/practice/sound";

class StubParam {
  value = 0;
  events: string[] = [];
  setValueAtTime(value: number, time: number) { this.events.push(`set:${value}@${time}`); }
  linearRampToValueAtTime(value: number, time: number) { this.events.push(`lin:${value}@${time}`); }
  exponentialRampToValueAtTime(value: number, time: number) { this.events.push(`exp:${value}@${time}`); }
  cancelScheduledValues(time: number) { this.events.push(`cancel@${time}`); }
}

class StubNode {
  connections: unknown[] = [];
  disconnected = false;
  connect(destination: unknown) { this.connections.push(destination); }
  disconnect() { this.disconnected = true; }
}

class StubGain extends StubNode { gain = new StubParam(); }

class StubOscillator extends StubNode {
  type = "square";
  frequency = { value: 0 };
  startedAt: number | null = null;
  stops: (number | undefined)[] = [];
  start(time?: number) { this.startedAt = time ?? 0; }
  stop(time?: number) { this.stops.push(time); }
}

class StubContext {
  currentTime = 0;
  state = "suspended";
  destination = {};
  oscillators: StubOscillator[] = [];
  gains: StubGain[] = [];
  resumed = 0;
  closed = 0;
  createOscillator() { const osc = new StubOscillator(); this.oscillators.push(osc); return osc; }
  createGain() { const gain = new StubGain(); this.gains.push(gain); return gain; }
  async resume() { this.resumed++; this.state = "running"; }
  async close() { this.closed++; this.state = "closed"; }
}

function setup(overrides: { enabled?: boolean; gesture?: boolean } = {}) {
  const contexts: StubContext[] = [];
  const state = { enabled: overrides.enabled ?? true, gesture: overrides.gesture ?? true };
  const player = createSoundPlayer({
    createContext: () => { const ctx = new StubContext(); contexts.push(ctx); return ctx as unknown as AudioContextLike; },
    isEnabled: () => state.enabled,
    hasUserGesture: () => state.gesture,
  });
  return { player, contexts, state };
}

// Latest time at which any oscillator in the context is told to stop, relative to its start.
const oscillatorTotals = (ctx: StubContext) => ctx.oscillators.flatMap((osc) => (osc.stops.length && osc.startedAt !== null ? [(osc.stops.at(-1) ?? 0) - osc.startedAt] : []));

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("cue definitions", () => {
  it("keeps connect and hang-up within 1.5 s and the ring cycle longer than its tone", () => {
    for (const cue of ["connect", "hangup"] as const) expect(cueLength(cue)).toBeLessThanOrEqual(MAX_CUE_SECONDS);
    expect(cueLength("ring")).toBeLessThan(RING_CYCLE_SECONDS);
    for (const cue of ["ring", "connect", "hangup"] as Cue[]) expect(cueNotes(cue).length).toBeGreaterThan(0);
  });

  it("makes hang-up descend", () => {
    const [first, second] = cueNotes("hangup");
    expect(second.freq).toBeLessThan(first.freq);
    expect(second.at).toBeGreaterThan(first.at);
  });
});

describe("sound player", () => {
  it("creates nothing until a cue is requested, and keeps the master volume gentle", () => {
    const { player, contexts } = setup();
    expect(contexts).toHaveLength(0);
    player.connect();
    expect(contexts).toHaveLength(1);
    expect(contexts[0].gains[0].gain.value).toBeLessThanOrEqual(0.2);
    expect(contexts[0].resumed).toBe(1);
  });

  it("plays connect and hang-up for no longer than 1.5 s, then closes the context", async () => {
    for (const cue of ["connect", "hangup"] as const) {
      const { player, contexts } = setup();
      player[cue]();
      const ctx = contexts[0];
      expect(ctx.oscillators.length).toBeGreaterThan(0);
      for (const total of oscillatorTotals(ctx)) expect(total).toBeLessThanOrEqual(MAX_CUE_SECONDS);
      for (const osc of ctx.oscillators) expect(osc.type).toBe("sine");
      expect(ctx.closed).toBe(0);
      await vi.advanceTimersByTimeAsync(MAX_CUE_SECONDS * 1000 + 200);
      expect(ctx.closed).toBe(1);
    }
  });

  it("makes no sound and creates no context when Sounds is off", () => {
    const { player, contexts } = setup({ enabled: false });
    player.unlock();
    player.ring();
    player.connect();
    player.hangup();
    vi.advanceTimersByTime(10_000);
    expect(contexts).toHaveLength(0);
  });

  it("makes no sound and creates no context before a user gesture", () => {
    const { player, contexts, state } = setup({ gesture: false });
    player.ring();
    player.connect();
    vi.advanceTimersByTime(10_000);
    expect(contexts).toHaveLength(0);
    state.gesture = true;
    player.connect();
    expect(contexts).toHaveLength(1);
  });

  it("never throws into the call flow when audio is unavailable", () => {
    const failing = createSoundPlayer({ createContext: () => { throw new Error("no audio"); }, isEnabled: () => true, hasUserGesture: () => true });
    expect(() => { failing.unlock(); failing.ring(); failing.connect(); failing.hangup(); failing.stopRing(); failing.dispose(); }).not.toThrow();
    const missing = createSoundPlayer({ createContext: () => null, isEnabled: () => true, hasUserGesture: () => true });
    expect(() => { missing.ring(); missing.connect(); }).not.toThrow();
  });
});

describe("ring loop and teardown", () => {
  const cycles = (ctx: StubContext) => ctx.oscillators.length / cueNotes("ring").length;

  async function startRing(overrides?: { enabled?: boolean }) {
    const harness = setup(overrides);
    harness.player.ring();
    await vi.advanceTimersByTimeAsync(0);
    return { ...harness, ctx: harness.contexts[0] };
  }

  it("repeats every cycle until stopped", async () => {
    const { ctx } = await startRing();
    expect(cycles(ctx)).toBe(1);
    await vi.advanceTimersByTimeAsync(RING_CYCLE_SECONDS * 1000);
    expect(cycles(ctx)).toBe(2);
    await vi.advanceTimersByTimeAsync(RING_CYCLE_SECONDS * 1000);
    expect(cycles(ctx)).toBe(3);
  });

  it("does not start a second ring while one is playing", async () => {
    const { player, ctx } = await startRing();
    player.ring();
    await vi.advanceTimersByTimeAsync(0);
    expect(cycles(ctx)).toBe(1);
  });

  const paths: [string, (player: ReturnType<typeof setup>["player"]) => void][] = [
    ["cancel", (player) => player.stopRing()],
    ["error", (player) => player.stopRing()],
    ["accept (connect)", (player) => player.connect()],
    ["hang-up", (player) => player.hangup()],
    ["unmount (dispose)", (player) => player.dispose()],
  ];

  for (const [name, teardown] of paths) {
    it(`stops the ring on ${name}`, async () => {
      const { player, ctx } = await startRing();
      const before = ctx.oscillators.length;
      ctx.currentTime = 0.3;
      teardown(player);
      const ringVoices = ctx.oscillators.slice(0, before);
      expect(ringVoices.every((osc) => osc.stops.some((time) => time === undefined || time <= ctx.currentTime + 0.1))).toBe(true);
      const afterTeardown = ctx.oscillators.length;
      await vi.advanceTimersByTimeAsync(RING_CYCLE_SECONDS * 5000);
      // Only the connect and hang-up chimes may add voices; the ring itself never schedules again.
      const chime = name === "accept (connect)" || name === "hang-up";
      expect(ctx.oscillators.length).toBe(afterTeardown);
      expect(chime ? afterTeardown > before : afterTeardown === before).toBe(true);
      expect(ctx.closed).toBe(1);
    });
  }

  it("stops the ring on connect without adding a chime when Sounds was switched off meanwhile", async () => {
    const { player, state, ctx } = await startRing();
    const before = ctx.oscillators.length;
    state.enabled = false;
    player.connect();
    expect(ctx.oscillators.length).toBe(before);
    await vi.advanceTimersByTimeAsync(RING_CYCLE_SECONDS * 3000);
    expect(ctx.oscillators.length).toBe(before);
  });

  it("stops itself after the safety limit", async () => {
    const { ctx } = await startRing();
    ctx.currentTime = RING_LIMIT_SECONDS + 1;
    await vi.advanceTimersByTimeAsync(RING_CYCLE_SECONDS * 1000);
    const count = ctx.oscillators.length;
    await vi.advanceTimersByTimeAsync(RING_CYCLE_SECONDS * 5000);
    expect(ctx.oscillators.length).toBe(count);
    expect(ctx.closed).toBe(1);
  });

  it("can ring again after dispose with a fresh context", async () => {
    const { player, contexts } = await startRing();
    player.dispose();
    player.ring();
    await vi.advanceTimersByTimeAsync(0);
    expect(contexts).toHaveLength(2);
    expect(contexts[0].closed).toBe(1);
    player.dispose();
    expect(contexts[1].closed).toBe(1);
  });
});

describe("Sounds setting storage", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  };

  it("defaults to on, and remembers the choice per device", () => {
    const storage = memory();
    expect(readSoundsEnabled(storage)).toBe(true);
    writeSoundsEnabled(false, storage);
    expect(readSoundsEnabled(storage)).toBe(false);
    writeSoundsEnabled(true, storage);
    expect(readSoundsEnabled(storage)).toBe(true);
  });

  it("stores only an on/off word under one local key, nothing about the person or a call", () => {
    const storage = memory();
    writeSoundsEnabled(false, storage);
    expect([...storage.data.entries()]).toEqual([["practice:sounds", "off"]]);
  });

  it("falls back to on when storage is missing or blocked", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(readSoundsEnabled(null)).toBe(true);
    expect(readSoundsEnabled(blocked)).toBe(true);
    expect(() => writeSoundsEnabled(false, blocked)).not.toThrow();
    expect(() => writeSoundsEnabled(false, null)).not.toThrow();
  });

  it("drives the player: off means silent", () => {
    const storage = memory();
    const contexts: StubContext[] = [];
    const player = createSoundPlayer({
      createContext: () => { const ctx = new StubContext(); contexts.push(ctx); return ctx as unknown as AudioContextLike; },
      isEnabled: () => readSoundsEnabled(storage),
      hasUserGesture: () => true,
    });
    writeSoundsEnabled(false, storage);
    player.connect();
    expect(contexts).toHaveLength(0);
    writeSoundsEnabled(true, storage);
    player.connect();
    expect(contexts).toHaveLength(1);
  });
});
