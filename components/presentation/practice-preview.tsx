"use client";

import { useState } from "react";
import { PracticeCall, PracticeSetup, type PracticeCallProps } from "./practice";
import styles from "./preview.module.css";

export function PracticePreview() {
  const [screen, setScreen] = useState<"setup" | "call">("setup");
  const [phase, setPhase] = useState<PracticeCallProps["phase"]>("connecting");
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [setupDisabled, setSetupDisabled] = useState(false);
  const [longContent, setLongContent] = useState(false);
  const counterpartName = longContent ? "Alex, your fictional roommate for this practice conversation" : "Alex";
  const goal = longContent ? "Make a clear, specific request to agree on a shared cleaning routine, explain what would help, and leave room to hear a different point of view without losing track of your request." : "Ask for a fairer way to share the cleaning.";

  return (
    <div className={styles.preview}>
      <header className={styles.header}><span className={styles.wordmark}>SpeakEasy<span aria-hidden="true"> ↗</span></span><span className={styles.previewBadge}>Design preview</span></header>
      <main id="main">
        <div className={styles.previewNotice}><strong>UI preview — no live call</strong><span>Synthetic examples only. These controls change the display; they do not start a call or access your microphone or camera.</span></div>
        <div className={styles.toolbar} role="group" aria-label="Preview controls">
          <button type="button" aria-pressed={screen === "setup"} onClick={() => setScreen("setup")}>Setup view</button>
          <button type="button" aria-pressed={screen === "call"} onClick={() => setScreen("call")}>Call view</button>
          {screen === "call" ? <><label>Call state<select value={phase} onChange={(event) => setPhase(event.target.value as PracticeCallProps["phase"])}><option value="connecting">Connecting</option><option value="live">Live</option><option value="interrupted">Interrupted</option><option value="ended">Ended</option></select></label><label><input type="checkbox" checked={showMedia} onChange={(event) => setShowMedia(event.target.checked)} />Show synthetic media slot</label></> : <label><input type="checkbox" checked={setupDisabled} onChange={(event) => setSetupDisabled(event.target.checked)} />Disable start</label>}
          <label><input type="checkbox" checked={longContent} onChange={(event) => setLongContent(event.target.checked)} />Long example text</label>
        </div>
        {screen === "setup" ? <PracticeSetup counterpartName={counterpartName} role="Your roommate · friendly, a little distracted" publicContext="You share an apartment. The cleaning has been uneven lately, and you’ve found a quiet moment at home to talk about it." goal={goal} onStart={() => { setPhase("connecting"); setMuted(false); setCameraEnabled(false); setScreen("call"); }} disabled={setupDisabled} statusMessage={setupDisabled ? "Practice is unavailable in this example state." : undefined} /> : <PracticeCall counterpartName={counterpartName} goal={goal} phase={phase} muted={muted} cameraEnabled={cameraEnabled} elapsedSeconds={phase === "connecting" ? 0 : 42} durationSeconds={180} remoteMedia={showMedia ? <div className={styles.syntheticMedia}><span>Supplied counterpart media</span><small>Synthetic placeholder · no video or audio</small></div> : null} localPreview={showMedia ? <div className={styles.syntheticLocal}>Synthetic self-view</div> : undefined} onMuteToggle={() => setMuted((value) => !value)} onCameraToggle={() => setCameraEnabled((value) => !value)} onEnd={() => setPhase("ended")} statusMessage={phase === "interrupted" ? "Example interruption: the connection was lost. You can end practice." : undefined} isMock />}
      </main>
      <footer className={styles.footer}>A little practice for the conversations that matter.</footer>
    </div>
  );
}
