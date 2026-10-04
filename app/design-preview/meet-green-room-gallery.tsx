"use client";

import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { GreenRoom } from "@/components/practice/green-room";
import { MeetCard, meetStateFromProgress, type MeetDuration, type MeetState } from "@/components/practice/meet-card";
import { personRole, personStartSituation, type MeetStart } from "@/components/practice/meet-knowledge";
import { manager } from "@/fixtures/manager";
import type { MicMeterFactory } from "@/lib/practice/mic-meter";
import type { DraftResponse, StanceOptions } from "@/lib/schemas/draft";
import type { Person } from "@/lib/schemas/people";
import type { RoleContext } from "@/lib/schemas/role-context";
import { idleDraftProgress, reduceDraftProgress } from "@/lib/setup/draft-stream-client";
import styles from "./gallery.module.css";

// Synthetic only. No request is sent, no portrait is fetched, and the microphone examples use fake
// devices and a synthetic level, except the one labeled "your microphone", which asks only on click.

const at = "2026-10-03T21:20:00.000Z";
const noop = () => undefined;

const jordanOptions: StanceOptions = {
  wants: [manager.wants!, "Not lose a good person", "Hear a plan, not a problem"],
  holdsBackBecause: [manager.holdsBackBecause!, "Already said yes upstairs", "Thinks you can stretch"],
  softensWhen: [manager.softensWhen!, "You offer a trade", "You name a date"],
};
const jordanDraft: DraftResponse = { role: manager, goal: "Ask to move one project to next sprint.", assumptions: [], stanceOptions: jordanOptions };

const maya: Person = {
  id: "00000000-0000-4000-8000-000000000001", version: 2, name: "Maya", relationship: "Roommate",
  style: "Friendly and direct. Listens, then answers in a sentence or two.", background: "We have shared an apartment for a year.",
  publicContext: "Dishes keep piling up in the sink and I want us to agree on a schedule.", opening: "Hey, what's up?",
  constraints: ["Keep it about the kitchen."], challenge: "neutral", pace: "conversational",
  traits: { tone: "warm", talkativeness: "brief", familiarity: "close" }, sharedFactIds: [], createdAt: at, updatedAt: at,
};
const mayaFacts = ["I work night shifts", "I’m vegetarian"];

const longWord = "Supercalifragilisticexpialidocious-and-then-some";
const longRole: RoleContext = {
  name: "Maximiliana Oyelaran-Featherstonehaugh",
  role: "Your department head, who also chairs the hiring committee and the budget review board",
  style: `Precise and formal. ${longWord} ${"Speaks in long, careful sentences and asks for specifics before agreeing to anything at all. ".repeat(3)}`.slice(0, 300),
  publicContext: "A long situation. ".repeat(40).trim(),
  opening: `${longWord}${longWord} — I only have a minute, so what is it you needed to talk about today, exactly?`,
  constraints: [`Stay on the topic of the budget ${longWord}.`, "Do not mention other staff."],
  challenge: "mild_pushback", pace: "patient",
  wants: "Abcdefghijklmnopqrstuvwxyzabcdefghijklmn",
  holdsBackBecause: "Worried about precedent for the whole team",
  softensWhen: "You bring numbers",
};
const longOptions: StanceOptions = {
  wants: [longRole.wants!, "Wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww", "Keep the budget flat"],
  holdsBackBecause: [longRole.holdsBackBecause!, "Has already promised the money elsewhere", "Thinks it can wait"],
  softensWhen: [longRole.softensWhen!, "You show the impact on students and staff", "You ask"],
};

function Capture({ state, title, night = false, children }: { state: string; title: string; night?: boolean; children: ReactNode }) {
  return (
    <div className={styles.stateRow}>
      <h3 className={styles.rowTitle}>{title}</h3>
      <div data-gallery-state={state} data-surface={night ? "night" : "room"} className={styles.screenCapture}>{children}</div>
    </div>
  );
}

function StaticMeet({ state, start = { kind: "role" }, identity, editable }: { state: MeetState; start?: MeetStart; identity?: { name: string; relationship: string }; editable?: "all" | "situation" }) {
  const [duration, setDuration] = useState<MeetDuration>(180);
  const [role, setRole] = useState<RoleContext | null>(state.status === "ready" ? state.role : null);
  const shown: MeetState = state.status === "ready" && role ? { ...state, role } : state;
  const name = identity ?? { name: state.status === "ready" ? state.role.name : "", relationship: state.status === "ready" ? state.role.role : "" };
  return <MeetCard identity={{ ...name, portraitSrc: null }} state={shown} onRoleChange={setRole} start={start} editable={editable}
    durationSeconds={duration} onDurationChange={setDuration} onBack={noop} onCall={noop} onRetry={noop} />;
}

// A saved person: editing the scene switches the start from "default" to "custom" (sent as `situation`).
function SavedPersonMeet() {
  const [duration, setDuration] = useState<MeetDuration>(300);
  const [role, setRole] = useState<RoleContext>(() => personRole(maya));
  const start: MeetStart = { kind: "person", person: maya, sharedFacts: mayaFacts, situation: personStartSituation(maya, role) };
  return <MeetCard identity={{ name: maya.name, relationship: maya.relationship, portraitSrc: null }} state={{ status: "ready", role }} onRoleChange={setRole}
    start={start} editable="situation" durationSeconds={duration} onDurationChange={setDuration} onBack={noop} onCall={noop} />;
}

// --- Fake devices for the green-room states. Streams come from a silent Web Audio destination. ---

function domError(name: string) {
  return new DOMException("Synthetic device error.", name);
}

function silentStream(): MediaStream {
  const context = new AudioContext();
  const stream = context.createMediaStreamDestination().stream;
  stream.getAudioTracks()[0]?.addEventListener("ended", () => { void context.close().catch(noop); });
  return stream;
}

function fakeDevices(kind: "live" | "denied" | "no-device"): () => MediaDevices {
  const devices = {
    async getUserMedia(constraints?: MediaStreamConstraints) {
      if (kind === "denied") throw domError("NotAllowedError");
      if (kind === "no-device") throw domError("NotFoundError");
      if (constraints?.video) throw domError("NotFoundError");
      return silentStream();
    },
    async enumerateDevices() {
      return [
        { kind: "audioinput", deviceId: "synthetic-1", label: "Built-in microphone (synthetic)", groupId: "a", toJSON: noop },
        { kind: "audioinput", deviceId: "synthetic-2", label: "Headset (synthetic)", groupId: "b", toJSON: noop },
      ] as MediaDeviceInfo[];
    },
  } as unknown as MediaDevices;
  return () => devices;
}

const liveDevices = fakeDevices("live");
const deniedDevices = fakeDevices("denied");
const noMicDevices = fakeDevices("no-device");

// A synthetic level, so the bars can be reviewed without a real microphone.
const syntheticMeter: MicMeterFactory = (_stream, onLevel) => {
  let t = 0;
  const timer = window.setInterval(() => { t += 1; onLevel(0.35 + 0.25 * Math.sin(t / 3)); }, 120);
  return { stop() { window.clearInterval(timer); onLevel(0); } };
};

function StaticGreen({ devices, autoAllow = false, startError = null, starting = false }: { devices?: () => MediaDevices; autoAllow?: boolean; startError?: string | null; starting?: boolean }) {
  return <GreenRoom name="Jordan" relationship="Your manager" portraitSrc={null} onBack={noop} onReady={noop} mediaDevices={devices}
    meterFactory={devices ? syntheticMeter : undefined} autoAllow={autoAllow} startError={startError} starting={starting} />;
}

// --- Interactive: a simulated stream (local timers, no request) into the Meet card, then the green room. ---

function InteractiveFlow() {
  const [progress, dispatch] = useReducer(reduceDraftProgress, idleDraftProgress);
  const [role, setRole] = useState<RoleContext | null>(null);
  const [duration, setDuration] = useState<MeetDuration>(180);
  const [stage, setStage] = useState<"meet" | "green" | "done">("meet");
  const [result, setResult] = useState("");
  const timers = useRef<number[]>([]);

  function replay() {
    for (const timer of timers.current) window.clearTimeout(timer);
    setRole(null); setStage("meet"); setResult("");
    dispatch({ type: "sent" });
    timers.current = [
      window.setTimeout(() => dispatch({ type: "field", field: { field: "role", value: manager } }), 900),
      window.setTimeout(() => dispatch({ type: "field", field: { field: "stanceOptions", value: jordanOptions } }), 1700),
      window.setTimeout(() => { dispatch({ type: "done", draft: jordanDraft }); setRole(manager); }, 2300),
    ];
  }

  useEffect(() => () => { for (const timer of timers.current) window.clearTimeout(timer); }, []);

  if (progress.step === "idle") {
    return <button type="button" className={styles.replay} onClick={replay}>Start the simulated stream</button>;
  }
  if (stage === "green") {
    return <GreenRoom name="Jordan" relationship="Your manager" portraitSrc={null} onBack={() => setStage("meet")} mediaDevices={liveDevices} meterFactory={syntheticMeter}
      onReady={(handoff) => { setStage("done"); setResult(`Preview only, nothing was sent. The microphone was released and would be handed to the call as ${handoff.micDeviceId ?? "the default device"}.`); }} />;
  }
  return <>
    {stage === "done" ? <p className={styles.sectionNote}>{result}</p> : null}
    <button type="button" className={styles.replay} onClick={replay}>Replay the simulated stream</button>
    <MeetCard identity={{ name: "Jordan", relationship: "Your manager", portraitSrc: null }} state={meetStateFromProgress(progress, role)} onRoleChange={setRole}
      start={{ kind: "role" }} durationSeconds={duration} onDurationChange={setDuration} onBack={noop} onCall={() => setStage("green")} onRetry={replay} />
  </>;
}

export function MeetGreenRoomGallery() {
  return (
    <section id="meet-green-room" className={styles.section} aria-labelledby="meet-green-room-heading">
      <h2 id="meet-green-room-heading" className={styles.sectionTitle}>Meet card and green room (1D)</h2>
      <p className={styles.sectionNote}>Synthetic roles. Portraits are off, so the monogram shows. The streaming example replays fixed events on local timers; no setup request is sent. Green-room microphones are fake devices with a synthetic level, except the last example, which asks for your real microphone only when you press Allow and never sends audio anywhere.</p>

      <Capture state="meet-interactive" title="Try it: stream, edit a stance chip, call, green room"><InteractiveFlow /></Capture>
      <Capture state="meet-streaming-reading" title="Meet, request sent (identity shows at once)">
        <StaticMeet state={{ status: "streaming", step: "reading" }} identity={{ name: "Jordan", relationship: "Your manager" }} />
      </Capture>
      <Capture state="meet-streaming-shaping" title="Meet, first fields arrived">
        <StaticMeet state={{ status: "streaming", step: "shaping", partialRole: manager }} identity={{ name: "Jordan", relationship: "Your manager" }} />
      </Capture>
      <Capture state="meet-ready" title="Meet, Jordan ready (starter)">
        <StaticMeet state={{ status: "ready", role: manager, stanceOptions: jordanOptions, streamed: true }} start={{ kind: "preset", preset: "manager" }} />
      </Capture>
      <Capture state="meet-saved-person" title="Meet, saved person with shared facts (edit the scene to send it as a situation)"><SavedPersonMeet /></Capture>
      <Capture state="meet-invalid" title="Meet, validation error (Call disabled with a reason)">
        <StaticMeet state={{ status: "ready", role: { ...manager, opening: "" }, stanceOptions: jordanOptions }} />
      </Capture>
      <Capture state="meet-out-of-scope" title="Meet, out of scope">
        <StaticMeet state={{ status: "error", message: "That’s outside what this practice can set up.", outOfScope: true, retryable: false }} identity={{ name: "", relationship: "" }} />
      </Capture>
      <Capture state="meet-unavailable" title="Meet, setup unavailable (retry)">
        <StaticMeet state={{ status: "error", message: "We couldn’t set up the scene just now.", outOfScope: false, retryable: true }} identity={{ name: "Jordan", relationship: "Your manager" }} />
      </Capture>
      <Capture state="meet-long" title="Meet, long text">
        <StaticMeet state={{ status: "ready", role: longRole, stanceOptions: longOptions }} />
      </Capture>

      <Capture state="green-primer" title="Green room, permission primer (nothing asked yet)" night><StaticGreen /></Capture>
      <Capture state="green-denied" title="Green room, microphone blocked" night><StaticGreen devices={deniedDevices} autoAllow /></Capture>
      <Capture state="green-no-mic" title="Green room, no microphone found" night><StaticGreen devices={noMicDevices} autoAllow /></Capture>
      <Capture state="green-ready" title="Green room, microphone on (synthetic level)" night><StaticGreen devices={liveDevices} autoAllow /></Capture>
      <Capture state="green-start-failed" title="Green room, the call couldn’t start" night><StaticGreen startError="Practice couldn’t start. Please try again." /></Capture>
      <Capture state="green-real-mic" title="Green room, your microphone (asks only when you press Allow)" night>
        <GreenRoom name="Jordan" relationship="Your manager" portraitSrc={null} onBack={noop} onReady={noop} />
      </Capture>
    </section>
  );
}
