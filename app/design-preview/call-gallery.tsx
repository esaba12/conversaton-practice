"use client";

import { useState, type ReactNode } from "react";
import { Hand, Mic, Video } from "lucide-react";
import { CallButton } from "@/components/practice/call-bar";
import { CallScreen, type CallPreview, type CallScreenProps } from "@/components/practice/call-screen";
import { Portrait } from "@/components/ui";
import { initialLiveCallState, type LiveCallState } from "@/lib/media/interactions";
import type { PracticePhase } from "@/lib/practice/flow";
import styles from "./gallery.module.css";

// Synthetic examples only: no media, no provider, nothing is sent. `onInteraction` returns true so the controls show as usable.
const noop = () => undefined;
const accept = () => true;

function SyntheticFace() {
  return <div className={styles.syntheticFace} aria-label="Synthetic counterpart video" role="img"><Portrait name="Jordan" size={240} /></div>;
}

function Capture({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <figure className={styles.callFigure}>
      <figcaption className={styles.stateLabel}>{title}</figcaption>
      <div data-gallery-state={id} data-surface="night" className={styles.callCapture}>{children}</div>
    </figure>
  );
}

type Example = { id: string; title: string; phase?: PracticePhase; live?: Partial<LiveCallState>; preview?: CallPreview; props?: Partial<CallScreenProps> };

const examples: Example[] = [
  { id: "call-ringing", title: "Ringing", phase: "connecting" },
  { id: "call-live-captions", title: "Live, Jordan speaking, streaming caption", live: { counterpartSpeaking: true, caption: { speaker: "counterpart", text: "I hear you, but the launch is in two weeks and I need everyone on it.", final: false } } },
  { id: "call-live-user", title: "Live, you speaking, camera preview on", live: { userSpeaking: true, caption: { speaker: "user", text: "I need to move the Atlas report to next sprint.", final: true } }, props: { cameraEnabled: true } },
  { id: "call-muted-weak", title: "Muted, weak connection", live: { weakNetwork: true }, props: { muted: true } },
  { id: "call-wrapping-up", title: "Wrapping up (last 30 seconds)", props: { elapsedSeconds: 158 } },
  { id: "call-waiting", title: "Asked to wait", preview: { waiting: true } },
  { id: "call-type-open", title: "Type instead", preview: { typeOpen: true, typedDraft: "Can we talk about what I can drop this sprint?" } },
  { id: "call-type-error", title: "Type instead, send failed", preview: { typeOpen: true, typedDraft: "Can we talk about it?", sendError: true } },
  { id: "call-controls-faded", title: "Controls faded after 3 s idle (still in the accessibility tree)", preview: { idle: true }, live: { caption: { speaker: "counterpart", text: "Okay. What would you drop?", final: true } } },
  { id: "call-interactions-unavailable", title: "Typing and waiting unavailable (reason shown)", props: { onInteraction: undefined } },
  { id: "call-help", title: "Help sheet", preview: { sheet: "help" } },
  { id: "call-end-confirm", title: "End confirm (Esc)", preview: { sheet: "end" } },
  { id: "call-shortcuts", title: "Keyboard shortcuts (?)", preview: { sheet: "shortcuts" } },
  { id: "call-test-media", title: "Test media label", props: { testMedia: true } },
  { id: "call-ended", title: "Ended", phase: "ended" },
];

// One unmarked, fully interactive call (shortcuts, idle fade, typing) for manual and scripted checks. Sends go nowhere.
function InteractiveCall() {
  const [muted, setMuted] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className={styles.callFigure} data-interactive-call>
      <span className={styles.stateLabel}>Interactive (not captured): try M, C, T, W, Esc and ?</span>
      <CallScreen layout="contained" counterpartName="Jordan" phase="live" muted={muted} cameraEnabled={false} elapsedSeconds={74} durationSeconds={180}
        remoteMedia={<SyntheticFace />} live={initialLiveCallState} turns={[]} onMuteToggle={() => setMuted((value) => !value)} onCameraToggle={noop} onEnd={noop}
        onInteraction={(interaction) => { setSent((list) => [...list, interaction.event_type]); return true; }} />
      <p className={styles.sectionNote} data-sent-log>{sent.length ? `Would send: ${sent.join(", ")}` : "Nothing sent yet."}</p>
    </div>
  );
}

export function CallGallery() {
  return (
    <section id="call" className={styles.section} aria-labelledby="call-heading">
      <h2 id="call-heading" className={styles.sectionTitle}>Call screen</h2>
      <p className={styles.sectionNote}>Ringing, the live call and its sheets on the night surface. Synthetic only; nothing here starts a call or sends anything.</p>
      <div className={styles.callGrid}>
        {examples.map((example) => (
          <Capture key={example.id} id={example.id} title={example.title}>
            <CallScreen layout="contained" counterpartName="Jordan" goal="Move the Atlas report to next sprint." phase={example.phase ?? "live"} muted={false} cameraEnabled={false}
              elapsedSeconds={74} durationSeconds={180} remoteMedia={<SyntheticFace />} localPreview={<div className={styles.syntheticSelf}>Synthetic self-view</div>}
              live={{ ...initialLiveCallState, ...example.live }} turns={[]} onMuteToggle={noop} onCameraToggle={noop} onEnd={noop} onCancel={noop} onInteraction={accept}
              preview={example.preview ?? {}} {...example.props} />
          </Capture>
        ))}
      </div>
      <InteractiveCall />
      <div className={styles.stateRow} role="group" aria-label="Call button states">
        <h3 className={styles.rowTitle}>Call button</h3>
        <div className={styles.stateGrid}>
          {([
            ["default", <CallButton key="d" icon={Mic} label="Mute" ariaLabel="Mute microphone" onPress={noop} />],
            ["hover", <CallButton key="h" icon={Mic} label="Mute" ariaLabel="Mute microphone" onPress={noop} previewState="hover" />],
            ["focus-visible", <CallButton key="f" icon={Mic} label="Mute" ariaLabel="Mute microphone" onPress={noop} previewState="focus" />],
            ["active", <CallButton key="a" icon={Mic} label="Mute" ariaLabel="Mute microphone" onPress={noop} previewState="active" pressed />],
            ["disabled", <CallButton key="x" icon={Hand} label="Wait" ariaLabel="Ask Jordan to wait" onPress={noop} disabledReason="Available once Jordan answers." />],
            ["loading", <CallButton key="l" icon={Video} label="Camera" ariaLabel="Show my camera preview" onPress={noop} loading />],
          ] as const).map(([state, cell]) => (
            <div key={state} className={styles.stateCell}>
              <span className={styles.stateLabel}>{state}</span>
              <div data-gallery-state={`call-button-${state}`} data-surface="night" className={`${styles.galleryCapture} ${styles.nightSurface}`}>{cell}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
