"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowLeft, Mic, Phone, RotateCcw, Wind } from "lucide-react";
import { Portrait, PrimaryButton, PrivateCard } from "@/components/ui";
import { createGreenRoomMedia, idleGreenRoomMedia, type MediaHandoff, type MicProblem } from "@/lib/practice/devices";
import { litBars, METER_BARS, startMicMeter, type MicMeterFactory } from "@/lib/practice/mic-meter";
import { readPrivateState, subscribePrivateState, updatePrivateState, type PrivateState } from "@/lib/practice/private-state";
import { GOAL_MAX, HARD_MOMENT_MAX, ToneNotice } from "./meet-card";
import { reflectionDisclosure } from "./meet-knowledge";
import styles from "./green-room.module.css";

// S2 green room (docs/32, docs/33 §4.5) with W4 "before". Nothing asks for the microphone until the
// user presses "Allow microphone". The meter is Web Audio, local only. Leaving (back, unmount,
// sign-out, page hide), I'm ready (the call provider opens its own microphone) and any error release
// every local stream. The prediction and the guess stay in private state; no request carries them.

export const PREDICTION_MAX = 200;
export const SETTLE_SECONDS = 60;

export type GreenRoomProps = {
  name: string;
  relationship?: string;
  portraitSrc?: string | null;
  onBack: () => void;
  /** Called after every local stream is stopped. Starts the session request and goes to ringing. */
  onReady: (handoff: MediaHandoff) => void;
  /** The start request is in flight. */
  starting?: boolean;
  /** The last start failed; the user can allow the microphone again and retry. */
  startError?: string | null;
  disabled?: boolean;
  disabledReason?: string;
  /** Slot for 1E's goal-light toggle. */
  extras?: ReactNode;
  focusHeading?: boolean;
  /** Design gallery and tests only: fake devices instead of navigator.mediaDevices. */
  mediaDevices?: () => MediaDevices | null;
  meterFactory?: MicMeterFactory;
  /** Design gallery only, and only honoured with injected `mediaDevices`: press "Allow microphone" on mount. */
  autoAllow?: boolean;
};

const emptyPrivate: PrivateState = { goal: "", hardMomentLine: "", prediction: "", likelihoodBefore: null, likelihoodAfter: null };
const serverPrivate = () => emptyPrivate;

export const micProblemCopy: Record<MicProblem, { title: string; body: string }> = {
  denied: {
    title: "Your browser blocked the microphone.",
    body: "Open the site settings from the icon next to the address, set Microphone to Allow, then try again.",
  },
  "no-device": {
    title: "We couldn’t find a microphone.",
    body: "Plug one in or turn it on, then try again.",
  },
  busy: {
    title: "Another app is using your microphone.",
    body: "Close the other app or call, then try again.",
  },
  unsupported: {
    title: "This browser can’t use a microphone here.",
    body: "Try a current version of Chrome, Edge, Safari or Firefox.",
  },
  failed: {
    title: "The microphone stopped working.",
    body: "Check that it’s connected, then try again.",
  },
};

function MicMeterBars({ lit }: { lit: number }) {
  return (
    <span className={styles.meter} aria-hidden="true">
      {Array.from({ length: METER_BARS }, (_, i) => <span key={i} className={styles.bar} data-lit={i < lit || undefined} />)}
    </span>
  );
}

function Settle({ onDone }: { onDone: () => void }) {
  const [left, setLeft] = useState(SETTLE_SECONDS);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, SETTLE_SECONDS - Math.floor((Date.now() - started) / 1000));
      setLeft(remaining);
      if (remaining === 0) { window.clearInterval(timer); done.current(); }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className={styles.settle}>
      <span className={styles.circle} aria-hidden="true" />
      <p className={styles.settleText}>Breathe in as the circle grows, out as it shrinks. <span className={styles.count}>{left} s left</span></p>
      <button type="button" className={styles.quiet} onClick={onDone}>Skip</button>
    </div>
  );
}

export function GreenRoom({
  name, relationship, portraitSrc, onBack, onReady, starting = false, startError = null, disabled = false, disabledReason = "Please wait a moment.",
  extras, focusHeading = false, mediaDevices, meterFactory = startMicMeter, autoAllow = false,
}: GreenRoomProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [media] = useState(() => createGreenRoomMedia(mediaDevices ? { mediaDevices } : {}));
  const state = useSyncExternalStore(media.subscribe, media.getState, () => idleGreenRoomMedia);
  const privateState = useSyncExternalStore(subscribePrivateState, readPrivateState, serverPrivate);
  const [lit, setLit] = useState(0);
  const [meterMissing, setMeterMissing] = useState(false);
  const [settling, setSettling] = useState(false);
  const [handedOff, setHandedOff] = useState(false);

  useEffect(() => { if (focusHeading) headingRef.current?.focus(); }, [focusHeading]);

  // Leave and page hide release everything. Unmount covers back, sign-out and auth loss.
  useEffect(() => {
    const hide = () => media.release();
    window.addEventListener("pagehide", hide);
    return () => { window.removeEventListener("pagehide", hide); media.release(); };
  }, [media]);

  const injected = Boolean(mediaDevices);
  useEffect(() => { if (autoAllow && injected) void media.allowMic(); }, [autoAllow, injected, media]);

  useEffect(() => {
    const stream = state.micStream;
    if (!stream) return;
    const meter = meterFactory(stream, (level) => setLit(litBars(level)));
    setMeterMissing(!meter);
    return () => { meter?.stop(); setLit(0); };
  }, [state.micStream, meterFactory]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = state.cameraStream;
    return () => { video.srcObject = null; };
  }, [state.cameraStream]);

  const live = state.mic === "live";
  const calling = starting || (handedOff && !startError);
  const readyReason = disabled ? disabledReason
    : state.mic === "problem" ? `${name} needs to hear you. Fix the microphone first.`
    : "Allow the microphone first.";

  function allow(deviceId?: string) {
    setHandedOff(false);
    void media.allowMic(deviceId);
  }

  function ready() {
    if (!live || disabled || calling) return;
    const handoff = media.handOff();
    setHandedOff(true);
    setSettling(false);
    onReady(handoff);
  }

  const problem = state.problem ? micProblemCopy[state.problem] : null;
  const cameraOn = state.camera === "on" || state.camera === "requesting";

  return (
    <section className={styles.room} data-surface="night" aria-labelledby={`${id}-name`} data-mic={state.mic}>
      <div className={styles.inner}>
        <button type="button" className={styles.back} onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />Back to {name}’s card
        </button>

        <header className={styles.who}>
          <span className={styles.breathe}><Portrait name={name} size={240} src={portraitSrc} className={styles.portrait} /></span>
          <h2 id={`${id}-name`} ref={headingRef} tabIndex={-1} className={styles.name}>{name}</h2>
          {relationship ? <p className={styles.relationship}>{relationship}</p> : null}
        </header>

        <div className={styles.grid}>
          <div className={styles.column}>
            <section className={styles.panel} aria-labelledby={`${id}-mic`}>
              <h3 id={`${id}-mic`} className={styles.panelTitle}>Your microphone</h3>
              {calling ? (
                <p className={styles.line}>Handing your microphone to the call…</p>
              ) : live ? (
                <>
                  <div className={styles.meterRow}>
                    <MicMeterBars lit={lit} />
                    <p className={styles.line}>{meterMissing ? "Your microphone is on. The level meter isn’t available in this browser." : "If the bar moves, they’ll hear you."}</p>
                  </div>
                  {state.devices.length > 1 ? (
                    <div className={styles.field}>
                      <label htmlFor={`${id}-device`}>Microphone</label>
                      <select id={`${id}-device`} className={styles.input} value={state.deviceId ?? ""} onChange={(event) => allow(event.target.value)}>
                        {state.devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
                      </select>
                    </div>
                  ) : null}
                </>
              ) : problem ? (
                <div className={styles.problem} role="alert">
                  <p className={styles.problemTitle}>{problem.title}</p>
                  <p className={styles.line}>{problem.body}</p>
                  <button type="button" className={styles.secondary} onClick={() => allow()}>
                    <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />Try again
                  </button>
                </div>
              ) : (
                <>
                  <p className={styles.line}>{name} will hear you. You can mute any time.</p>
                  {state.mic === "requesting"
                    ? <PrimaryButton label="Allow microphone" icon={Mic} loading loadingLabel="Waiting for your browser…" />
                    : <PrimaryButton label="Allow microphone" icon={Mic} onClick={() => allow()} />}
                </>
              )}
              {startError && !starting ? <div className={styles.problem} role="alert"><p className={styles.problemTitle}>{startError}</p></div> : null}

              <div className={styles.cameraRow}>
                <label className={styles.switch}>
                  <input type="checkbox" role="switch" checked={cameraOn} disabled={calling || state.camera === "requesting"}
                    onChange={(event) => { void media.setCamera(event.target.checked); }} aria-describedby={`${id}-camera-note`} />
                  <span>Show my camera to me only</span>
                </label>
                <p id={`${id}-camera-note`} className={styles.small}>
                  {state.camera === "unavailable" ? "Your camera isn’t available. You can practice without it." : "Only you will see yourself. Your camera is never sent."}
                </p>
                {state.camera === "on" ? <video ref={videoRef} className={styles.selfView} autoPlay muted playsInline aria-label="Your camera, visible only to you" /> : null}
              </div>
            </section>

            {extras}
            <ToneNotice name={name} tone="night" />
            <p className={styles.small}>{reflectionDisclosure}</p>
          </div>

          <div className={styles.column}>
            <PrivateCard note={`${name} never sees this.`} className={styles.private}>
              <div className={styles.privateField}>
                <label htmlFor={`${id}-goal`}>Your line</label>
                <input id={`${id}-goal`} className={styles.privateInput} type="text" maxLength={GOAL_MAX} autoComplete="off" value={privateState.goal}
                  onChange={(event) => updatePrivateState({ goal: event.target.value })} />
              </div>
              <div className={styles.privateField}>
                <label htmlFor={`${id}-hard`}>When it gets hard, I’ll say <span className={styles.optional}>Optional</span></label>
                <input id={`${id}-hard`} className={styles.privateInput} type="text" maxLength={HARD_MOMENT_MAX} autoComplete="off" spellCheck={false} value={privateState.hardMomentLine}
                  onChange={(event) => updatePrivateState({ hardMomentLine: event.target.value })} />
              </div>
              <div className={styles.privateField}>
                <div className={styles.labelRow}>
                  <label htmlFor={`${id}-fear`}>What are you worried {name} will say? <span className={styles.optional}>Optional</span></label>
                  <span className={styles.countMuted}>{privateState.prediction.length} / {PREDICTION_MAX}</span>
                </div>
                <input id={`${id}-fear`} className={styles.privateInput} type="text" maxLength={PREDICTION_MAX} autoComplete="off" value={privateState.prediction}
                  onChange={(event) => updatePrivateState({ prediction: event.target.value })} />
              </div>
              <div className={styles.privateField}>
                <div className={styles.labelRow}>
                  <label htmlFor={`${id}-likely`}>How likely does that feel?</label>
                  <output htmlFor={`${id}-likely`} className={styles.guess}>
                    {privateState.likelihoodBefore === null ? "Your guess: not set" : `Your guess: ${privateState.likelihoodBefore}%`}
                  </output>
                </div>
                <input id={`${id}-likely`} className={styles.range} type="range" min={0} max={100} step={5} value={privateState.likelihoodBefore ?? 50}
                  data-unset={privateState.likelihoodBefore === null || undefined}
                  aria-valuetext={privateState.likelihoodBefore === null ? "Not set" : `${privateState.likelihoodBefore} percent, your guess`}
                  onChange={(event) => updatePrivateState({ likelihoodBefore: Number(event.target.value) })} />
                {privateState.likelihoodBefore !== null ? (
                  <button type="button" className={styles.quietDark} onClick={() => updatePrivateState({ likelihoodBefore: null })}>Clear my guess</button>
                ) : null}
              </div>
            </PrivateCard>
          </div>
        </div>

        {settling ? <Settle onDone={() => setSettling(false)} /> : null}

        <div className={styles.actions}>
          {!settling ? (
            <button type="button" className={styles.secondary} onClick={() => setSettling(true)} disabled={calling}>
              <Wind size={16} strokeWidth={1.75} aria-hidden="true" />Settle for 60 seconds
            </button>
          ) : null}
          {calling
            ? <PrimaryButton label="I’m ready" icon={Phone} loading loadingLabel={`Calling ${name}…`} />
            : live && !disabled
              ? <PrimaryButton label="I’m ready" icon={Phone} onClick={ready} />
              : <PrimaryButton label="I’m ready" icon={Phone} disabled disabledReason={readyReason} />}
        </div>
      </div>
    </section>
  );
}
