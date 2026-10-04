# 1F: Motion and synthesized sound (docs/33 morph, R7)

Status: draft PR open; mock/automated checked, live not verified
Updated: October 4, 2026
Assigned writer: 1F worker subagent
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1 (after the hero-path checkpoint)
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1F; docs/33 (motion, reduced motion, morphs); R7 in docs/next/04-NEW-SPECS.md or docs/32; node_modules/next/dist/docs/01-app/02-guides/view-transitions.md
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/65
Pull request: see GitHub (draft, base `main`), title "1F: Motion and synthesized sound"
CI run: not run (local checks only, below)

## Assignment and isolation

- Base ref: `main` `a6a1a9a`.
- Branch: `agent/1f-motion-sound`; worktree `/Users/ethansaba/code/therapist/.worktrees/1f`; dev port 3105.
- Owned: `components/practice/transitions.tsx`, `lib/practice/sound.ts`, `components/practice/sound-toggle.tsx`, a one-line mount of the toggle in `app/practice/about-me/about-me-workspace.tsx`, a design-preview route `app/design-preview/motion/page.tsx`, tests, this record.
- Not owned (propose exact diffs in Handoff): `app/practice/practice-workspace.tsx` (stage wrappers and sound cues), `next.config.*` (if a ViewTransition flag is needed), `lib/ui/motion.ts`, call/meet/lobby components, `package.json`/lockfile, numbered docs, STATUS.md.
- Shared resources: no provider calls, no live calls, no migrations, no dependency changes, no pushes to main.

## Scope and acceptance

- [x] card → briefing → ringing → call → recap morphs with React `<ViewTransition>` (check the installed Next/React docs and types; do not assume an API). Built and exercised in the gallery only; wiring into the practice workspace is the Handoff diff below.
- [x] Reduced motion: no morphs; fades ≤150 ms.
- [x] Ring, connect and hang-up synthesized with Web Audio oscillators and envelopes (no audio files); each ≤1.5 s except ring; ring stops on accept, cancel, error and unmount; the AudioContext is created only after a user gesture and closed on teardown.
- [x] "Sounds" toggle on About me, stored in `localStorage` (device only, no migration); no sound when off or on errors.
- [x] Unit tests for the sound scheduler (stubbed AudioContext) and toggle storage; gallery states for the morphs.

## What was built

- `components/practice/transitions.tsx` (+ `transitions.css`, a new global stylesheet it imports; no existing CSS was edited). `StageTransition` (keyed crossfade by stage group), `PortraitTransition` (shared name `practice-portrait`, `active` selects the one element that carries it), `FadeTransition` (enter/exit fade for pieces inside a screen), `startStage` (a `startTransition`), `startMorph` (commits the morph source with `flushSync`, then transitions the stage change), and the pure `stageGroup` and `transitionClasses(reduced)`.
- Ringing, call and live-call stages and their retry twins map to one group (`call`), because remounting `CallStage` would drop the remote video. Recap is its own group.
- `lib/practice/sound.ts`: `createSoundPlayer` with `unlock`, `ring`, `stopRing`, `connect`, `hangup`, `dispose`; `readSoundsEnabled`/`writeSoundsEnabled` (localStorage key `practice:sounds`, default on). Oscillators and gain envelopes only, master gain 0.18. Ring is a two-tone 440+480 Hz, 0.9 s on in a 2.6 s cycle, with a 60 s safety stop. Connect is a 1.2 s chime; hang-up is two descending notes, 0.67 s. The context is created lazily, only after `navigator.userActivation.hasBeenActive` (or where that API is missing), closed 100 ms after the last cue ends and on `dispose`. Any audio error is silence.
- `lib/practice/use-sound-cues.ts`: one player per mounted screen, `dispose` on unmount.
- `components/practice/sound-toggle.tsx` (+ module CSS): "Sounds" switch with the note "This stays on this device only." Mounted in `app/practice/about-me/about-me-workspace.tsx` (one import and one JSX line).
- `app/design-preview/motion/page.tsx` (+ `motion-gallery.tsx`, module CSS): fake stages Lobby card → Briefing → Ringing → Call → Recap with Back/Next/Reset, cue buttons, and `data-gallery-state` markers (`morph-card`, `morph-briefing`, `morph-ringing`, `morph-call`, `morph-recap`, `morph-status` with `data-reduced`, `cue-none|ring|connect|hangup`, `sounds-on|off` on the toggle). Development only, like the other previews.
- Tests: `tests/unit/sound.test.ts` (stubbed AudioContext) and `tests/unit/transitions.test.ts`.

## Verification (actually run in the worktree)

- `npm run typecheck`: pass. `npm test`: 39 files, 639 tests pass (27 new). `npm run build`: pass; `/design-preview/motion` is built as a route.
- Dev server on port 3105, Cursor browser at `/design-preview/motion`, with `document.startViewTransition` instrumented:
  - Normal motion, Lobby card → Briefing: a `practice-portrait` group/image-pair animates 520 ms (the morph), the old screen fades out in 150 ms and the new one in over 280 ms.
  - `prefers-reduced-motion: reduce` emulated, stepping Lobby → Briefing → Ringing → Call → Recap: every pseudo-element animation was 150 ms, no `practice-portrait` group existed, so there was no morph. (This run also caught a hydration mismatch in the gallery caused by reading the preference during render; fixed by reading it after mount.)
  - Web Audio (with `navigator.userActivation` forced true, because tool-driven clicks are not user activations; the same clicks without it created no AudioContext, which shows the gesture gate): ring produced 4 oscillators in 3 s (two cycles), Stop ring ended it with no more oscillators and the context `closed`; connect created 2 oscillators and hang-up 2, each context `closed` after its cue.
- Not run: the About me page in a signed-in browser (needs Auth), any live call, any real speaker output. Nothing was listened to; envelope loudness and taste are unreviewed. Live not verified.

## Handoff

Nothing below is applied; all of it is outside the owned paths. Apply it in one workspace task, then run the mock hero-path browser test.

### 1. `next.config.ts`: no change

Next 16 documents that view transitions work in the App Router with no configuration, and the gallery morphs in dev without any flag.

### 2. Shared CSS: no change

All view-transition rules live in the new `components/practice/transitions.css`. `app/globals.css` is untouched.

### 3. `app/practice/practice-workspace.tsx`: stage wrapping and sound cues

Imports:

```diff
+import { StageTransition, startMorph, startStage } from "@/components/practice/transitions";
+import { useSoundCues } from "@/lib/practice/use-sound-cues";
```

Once, with the other hooks near the top of the component:

```diff
+  const sound = useSoundCues();
```

`apply` (a ViewTransition only animates updates made inside a transition; teardown-driven events stay immediate so nothing private lingers for a frame):

```diff
-    setFlow(transition.state);
+    if (event.type === "authLost" || event.type === "signOut" || event.type === "pageHide") setFlow(transition.state);
+    else startStage(() => setFlow(transition.state));
```

Wrap the stage output:

```diff
       {headerMessage && <p role="status" className="notice">{headerMessage}</p>}
-      {phase === null ? (flow.stage === "meet"
+      <StageTransition stage={flow.stage}>
+      {phase === null ? (flow.stage === "meet"
 ...
       ) : <>
 ...
       </>}
+      </StageTransition>
     </main></>;
```

Sound cues (every ring stop is already covered by `releaseMedia`, which runs on cancel, error/interrupt, auth loss, page hide and unmount):

```diff
 function releaseMedia() {
+    sound.stopRing();
     attemptRef.current++;
```

```diff
-              onBack={leaveGreenRoom} onReady={(handoff) => { micHandoffRef.current = handoff; if (standInChosenRef.current) startStandIn(); else start(); }}
+              onBack={leaveGreenRoom} onReady={(handoff) => { sound.unlock(); micHandoffRef.current = handoff; if (standInChosenRef.current) startStandIn(); else start(); }}
```

```diff
       apply({ type: "ready" });
       apply({ type: "sessionAccepted" });
+      sound.ring();
```

```diff
       case "ready": {
         if (!apply({ type: "videoPlaying" }).changed) return;
+        sound.connect();
```

```diff
     const { teardown, changed } = apply({ type: "ended" });
     if (!changed) return;
     if (teardown.releaseMic) releaseMedia();
+    sound.hangup();
```

No cue is added to `interrupt()` (an error: `releaseMedia` stops the ring and nothing plays) or to `backToSetup()` (cancel while ringing: `releaseMedia` stops it, silence). `connect()` and `hangup()` both call `stopRing()` first.

Lobby card → briefing morph (only the picked card may carry the name, so mark it before the transition):

```diff
+  const [morphSource, setMorphSource] = useState<string | null>(null);
 ...
-              onPickPerson={(person) => openBriefing({ kind: "person", person })} onPickStarter={(preset) => openBriefing({ kind: "starter", preset })}
+              morphSource={morphSource}
+              onPickPerson={(person) => startMorph(() => setMorphSource(person.id), () => openBriefing({ kind: "person", person }))}
+              onPickStarter={(preset) => startMorph(() => setMorphSource(preset), () => openBriefing({ kind: "starter", preset }))}
```

### 4. Components that carry the shared portrait (all import `PortraitTransition` from `./transitions`)

- `components/ui/person-card.tsx` and `components/practice/lobby.tsx`: add `morphing?: boolean` to `PersonCard` (true when `morphSource` equals the person id or starter preset) and render `<PortraitTransition active={morphing}><Portrait … /></PortraitTransition>`; `Lobby` takes `morphSource?: string | null` and passes it down.
- `components/practice/briefing.tsx:196`, `components/practice/meet-card.tsx:341`: `<PortraitTransition><Portrait … /></PortraitTransition>`.
- `components/practice/green-room.tsx:172`: wrap the `<span className={styles.breathe}>…</span>`.
- `components/practice/ringing.tsx`: wrap the `motion.div` portrait block.
- `components/practice/call-screen.tsx:187` (ended card portrait): `<PortraitTransition><Portrait name={name} size={64} src={portraitSrc} /></PortraitTransition>`.
- Ringing giving way to the live bar inside `CallScreen`: wrap `{ringing && <Ringing … />}` as `{ringing && <FadeTransition><Ringing … /></FadeTransition>}` and the `isLive && (<div className={styles.bottom}>…)` block in `<FadeTransition>`.

Exactly one element may carry `practice-portrait` at a time, which holds because each stage renders one portrait and the lobby marks one card.

### 5. Risks and open points

- Wrapping `apply` in `startTransition` delays rendering the new stage by a frame or more; refs stay authoritative, so teardown does not wait for rendering. Check with the mock hero-path test that End still releases the mic immediately.
- The call → recap change remounts `CallStage` (separate groups), which resets in-screen state such as captions and the typed draft. Ringing → call does not remount.
- `StageTransition` children are a conditional with fragments; if a multi-root child snapshots oddly, wrap the stage in a single `div`.
- R7 says the toggle "respects device mute where detectable". Browsers expose no reliable device-mute signal, so this is not implemented; a muted device is simply silent.
- Autoplay: `ring()` runs after an awaited session request. Chrome and Safari allow audio after any earlier user activation on the page, and `unlock()` in the Ready click creates the context inside the gesture. Not tested live.
- Safari and Firefox support for view-transition classes is newer; without it the app works with no animation.
- `::view-transition-old(root)` is set to 150 ms under reduced motion for any page that has loaded `transitions.css`.
- Gain is gentle by calculation (peak 0.18 × 0.6), not by ear. A human should listen once at normal volume.

### Coordinator integration (October 4, ~02:10 EDT)

- Rebased onto `945ac92`. Wired in `app/practice/practice-workspace.tsx`: stage output wrapped in `<StageTransition>`; user-driven stage changes (`showStage`) and End (`finish`) commit inside `startStage`; other flow changes (start acceptance, video playing, sign-out, auth loss, page hide) stay immediate. Sound: `unlock` on I'm ready, `ring` after acceptance, `stopRing` + `connect` when video plays, `stopRing` in `releaseMedia` (every teardown path), `hangup` after End.
- Not wired (time): per-portrait morphs (`PortraitTransition` in seven components) and the call-screen `FadeTransition`s; screens crossfade by stage group instead.
- Evidence: typecheck clean; 639 unit tests; build; Playwright 10 passed / 1 skipped including `hero-path.spec.ts` (real Auth/database, test media) with the transitions in place. UI screenshot review skipped: the change is motion, which stills don't show. Nobody has listened to the cues. Live not verified.
