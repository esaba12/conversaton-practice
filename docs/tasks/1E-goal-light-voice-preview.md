# 1E: Goal light and voice preview (G1, W3)

Status: ready for review (mock-tested; live not verified; not wired into the practice flow yet, see Handoff)
Updated: October 4, 2026, ~02:20 EDT
Assigned writer: 1E worker subagent
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1 (after the hero-path checkpoint)
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1E; docs/32-FEATURE-SPECS.md G1; docs/next/04-NEW-SPECS.md W3; docs/next/03-CONTRACTS.md
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/64
Pull request: https://github.com/esaba12/conversaton-practice/pull/85 (draft)
CI run: not checked by the worker

## Assignment and isolation

- Base ref: `main` `a6a1a9a` (Phase 1 slices 1A–1D, 1G and the hero-path spec merged).
- Branch: `agent/1e-goal-voice`; worktree `/Users/ethansaba/code/therapist/.worktrees/1e`; dev port 3104.
- Owned: `app/api/sessions/[id]/goal-check/route.ts`, `lib/goal-check/**`, `app/api/voice-preview/route.ts`, `lib/voice-preview/**`, `components/practice/goal-pill.tsx`, `components/practice/hear-button.tsx` (+ a CSS module), a design-preview route `app/design-preview/goal-voice/page.tsx`, tests, this record.
- Not owned (propose exact diffs in Handoff): `app/practice/practice-workspace.tsx`, `components/practice/meet-card.tsx` (has a `hear` slot), `components/practice/green-room.tsx` (has an `extras` slot), `components/practice/call-screen.tsx` (goal pill placement), `lib/schemas/**`, `.env.example`, `package.json`/lockfile, numbered docs (docs/08 privacy line), STATUS.md.
- Shared resources: no provider calls (mock OpenAI and ElevenLabs with `fetch` stubs), no live calls, no migrations, no dependency changes, no pushes to main.

## Scope and acceptance

- [x] G1 route: owner of a live session only; Zod body `{ goal ≤200, turns: string[≤6] each ≤500 }` → `{ met }`; non-owner/missing → 404, ended → 409; rate limit 1 per 3 s and 40 per session (per process); model id from configuration (`OPENAI_GOAL_CHECK_MODEL`, falling back to `OPENAI_SETUP_MODEL`); `store:false`; nothing logged or stored. (unit)
- [x] G1 client: off sends nothing; only user turns are sent (debounced 1 s after a finished user utterance); the first `true` lights the pill once (clay, check, `aria-live` "Goal reached") and no further checks are sent. Goal and turns never go to Tavus or any interaction. (unit + gallery with fake checks)
- [x] G1 green-room toggle "Light up my goal when I say it" with the spec note, off by default. (unit; placement is a Handoff diff)
- [x] W3 route `POST /api/voice-preview` `{ text ≤300, presetId? }` → `audio/mpeg`; 401 signed out, 400 over 300 or unknown preset, 429 after 10 per 10 minutes per user, 503 unconfigured; `Cache-Control: no-store`; voice id and TTS model server-side only; nothing stored or logged. (unit, `fetch` stubbed)
- [x] W3 button: "Hear {name}", replays from memory, refetches when the opening changes, disabled with "Voice preview isn't set up" when unconfigured; the client function takes only the opening string and presetId; no voice ids in the source of client modules or in the built bundle. (unit + gallery with a fake loader)
- [x] Fixtures for the goal check prompt (paraphrase counts; refusal or question does not) as unit tests against a stubbed model.
- [ ] Wired into the practice flow (Meet card, green room, call screen): coordinator applies the Handoff diffs.
- [ ] Live: goal-light false-positive rate in five calls (docs/32 G1); the preview clip sounds like the call (W3 spike).

## What was built

**G1 goal light**
- `app/api/sessions/[id]/goal-check/route.ts`: order is auth (401) → session id (400) → `requireLiveSession` (404/409, before the body is read) → body (400, ≤4096 chars) → configuration (503 `NOT_CONFIGURED`) → `reserveGoalCheck` (429) → model. A rejected request does not spend a check.
- `lib/goal-check/session.ts`: request-scoped owner read of `practice_sessions` (`id,status,kind`); missing, deleted or `stand_in` → 404 (in a stand-in call the user plays the counterpart, so there is no line of theirs to light); any status other than `active` → 409 `SESSION_EXPIRED`. Per-process limiter keyed by session id: 1 per 3 s, 40 per session, counted before the model call and never released.
- `lib/goal-check/generate.ts` + `prompt.ts`: OpenAI Responses API, `store: false`, strict `json_schema` `{ met: boolean }`, one attempt with an 8 s timeout. A refusal, incomplete/failed status, malformed or extra-key output → 503 `PROVIDER_UNAVAILABLE` (never read as met). Prompt version `goal-check-v1`; the user message is `JSON.stringify({ goal, userTurns })`, framed as quoted data.
- `lib/goal-check/client.ts`: `goalCheckBody` keeps only `speaker === "user"` turns, the last 6, each ≤500, goal ≤200; `requestGoalCheck(sessionId, goal, transcript)` posts exactly `{ goal, turns }`. `createGoalWatcher` debounces 1 s after each change in the user-turn list (counterpart turns never trigger), keeps ≥3 s between sends, never resends identical turns, stops at 40, and stops for good after the first `true`. Errors are swallowed; the next user turn tries again.
- `lib/goal-check/use-goal-light.ts`: `useGoalLight({ enabled, sessionId, goal, turns })` → `"off" | "watching" | "reached"`. `goalLightPlan` (pure, unit-tested) creates no watcher when the toggle is off, the goal is empty or there is no live session id.
- `components/practice/goal-pill.tsx`: `GoalPill` (outline; reached adds a clay border and a one-time glow animation, a check icon, and an always-present `aria-live="polite"` region that changes to "Goal reached"; reduced motion: static) and `GoalLightToggle` (switch, exact label and note, `aria-describedby`).

**W3 Hear {name}**
- `app/api/voice-preview/route.ts`: auth (401) → body (400, ≤1024 chars; unknown preset and extra fields such as a client `voiceId` are rejected by the strict schema) → configuration (503 `NOT_CONFIGURED`, does not spend the limit) → `reserveVoicePreview` (429; 10 per 10 minutes per user, per process, sliding window) → stream.
- `lib/voice-preview/server.ts` (`server-only`): voice from `ELEVENLABS_STARTER_<PRESET>_VOICE_ID` (same names as `lib/media/presets.server.ts`), falling back to `ELEVENLABS_VOICE_ID`; key `ELEVENLABS_API_KEY`; model `ELEVENLABS_PREVIEW_TTS_MODEL`, default `eleven_v4_turbo` (the model `scripts/preflight/starter-faces.mjs` provisions on the starter PALs). Calls `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream?output_format=mp3_44100_128` with `xi-api-key` and `{ text, model_id }` (verified against the ElevenLabs "Stream speech" API reference, fetched October 4, ~01:50 EDT), and pipes the body through as `audio/mpeg`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`. Provider errors → 503 `PROVIDER_UNAVAILABLE` with no provider text.
- `lib/voice-preview/client.ts`: `fetchVoicePreview(text, presetId?)` sends `{ text }` or `{ text, presetId }` only; rejects non-`audio/mpeg` responses.
- `components/practice/hear-button.tsx`: `HearButton` (stateful) and `HearButtonView` (presentational). The `Audio` element is created inside the click; the clip is kept as an object URL keyed by `presetId + text`, replayed on the next press, and revoked when the text or preset changes and on unmount. Pressing while playing stops. `NOT_CONFIGURED` switches the button to `aria-disabled` (still focusable) with the visible reason "Voice preview isn’t set up". `useHearHighlight()` returns `{ highlighted, onPlayingChange, bubbleClassName }`; under reduced motion it never highlights.
- `components/practice/goal-voice.module.css`: styles for both.

**Gallery** `app/design-preview/goal-voice/` (development only; `notFound()` otherwise): `data-gallery-state` captures `goal-toggle-off`, `goal-toggle-on`, `goal-pill-off`, `goal-pill-watching`, `goal-pill-reached`, `goal-light-interactive`, `hear-idle`, `hear-loading`, `hear-playing`, `hear-unavailable`, `hear-error`, `hear-interactive`. The interactive captures use a local fake goal check and a generated silent WAV; nothing reaches our routes or a provider. The gallery's client component is `app/design-preview/goal-voice/gallery.tsx`, in the same route directory as the owned page.

## Verification (actually run, October 4, ~02:00–02:15 EDT, worktree)

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm test` | 40 files, 686 tests pass (new: `goal-check-route` 37, `goal-check-client` 17, `voice-preview` 20 + bundle checks) |
| `npm run build` | pass; `/api/sessions/[id]/goal-check`, `/api/voice-preview`, `/design-preview/goal-voice` listed |
| Bundle grep after build | `voice-preview.test.ts` bundle half re-run against `.next/static`: no ElevenLabs/OpenAI env names; `grep` for `ELEVENLABS_`, `eleven_v4_turbo`, `api.elevenlabs.io`, `OPENAI_GOAL`: no hits. This worktree's `.env.local` has no ElevenLabs/OpenAI values, so the value grep had nothing to compare (0 values) |
| Gallery (dev server on 3104, Cursor browser) | Toggle off + a user line: 0 fake checks. Toggle on: first line → watching, 1 check; matching line → reached, 2 checks, live region "Goal reached", clay border `rgb(196, 106, 74)`; no further checks. Hear: press → playing with the bubble highlighted → idle at clip end; second press replayed with still 1 fetch; edit opening → press → 2 fetches |
| Handoff diffs 2–5 | Applied to a throwaway copy outside the repo (`/tmp`, deleted afterwards): `tsc --noEmit` pass, `vitest run` 686 pass. Not built or browser-tested in that form |
| Provider calls | none (all `fetch` stubbed in tests; gallery fakes) |

Not run: live calls, real OpenAI or ElevenLabs requests, a two-user real-Auth check of the goal-check route (owner isolation relies on the same request-scoped RLS read as the reflect route), Playwright.

## Handoff

### Proposed env names

- `OPENAI_GOAL_CHECK_MODEL` (optional; falls back to `OPENAI_SETUP_MODEL`). Already named in `lib/schemas/goal-check.ts` and 03-CONTRACTS §2.6.
- `ELEVENLABS_PREVIEW_TTS_MODEL` (optional; default `eleven_v4_turbo`). New.
- Reused, unchanged: `OPENAI_API_KEY`, `OPENAI_SETUP_MODEL`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_STARTER_<PRESET>_VOICE_ID`.

### Proposed diffs for non-owned files (coordinator applies)

**1. `.env.example`**

```diff
 # Optional reflection model ID (Responses API, structured outputs). Falls back to OPENAI_SETUP_MODEL when empty.
 OPENAI_REFLECTION_MODEL=
+# Optional goal-light model ID (G1; Responses API, structured outputs). Falls back to OPENAI_SETUP_MODEL when empty.
+OPENAI_GOAL_CHECK_MODEL=
 # Coordinator provisions these after the provider configuration smoke check.
 TAVUS_PAL_ID=
 TAVUS_FACE_ID=
 ELEVENLABS_VOICE_ID=
+# Optional TTS model for "Hear {name}" (W3). Defaults to eleven_v4_turbo, the starter PALs' model; match the call PAL's model if it differs.
+ELEVENLABS_PREVIEW_TTS_MODEL=
```

**2. `components/practice/meet-card.tsx`** (bubble highlight while the preview plays)

```diff
   /** Slot for 1E's "Hear {name}" button next to the opening line. */
   hear?: ReactNode;
+  /** Added to the opening-line bubble while "Hear {name}" plays (useHearHighlight gives none under reduced motion). */
+  bubbleClassName?: string;
@@
-  disabled = false, disabledReason = "Please wait a moment.", hear, extras, actions, focusHeading = false,
+  disabled = false, disabledReason = "Please wait a moment.", hear, bubbleClassName, extras, actions, focusHeading = false,
@@
-                  {role ? <blockquote className={styles.bubble}>{role.opening}</blockquote> : <span className={styles.bubble} aria-hidden="true"><Skeleton lines={2} /></span>}
+                  {role ? <blockquote className={[styles.bubble, bubbleClassName].filter(Boolean).join(" ")}>{role.opening}</blockquote> : <span className={styles.bubble} aria-hidden="true"><Skeleton lines={2} /></span>}
```

**3. `components/practice/call-screen.tsx`** (goal pill placement)

```diff
+import type { GoalLightState } from "@/lib/goal-check/client";
 import { CallBar } from "./call-bar";
 import { SelfView } from "./call-self-view";
 import { EndConfirmSheet, HelpSheet, ShortcutsSheet } from "./call-sheets";
 import { shortcutFor } from "./call-shortcuts";
+import { GoalPill } from "./goal-pill";
 import { Ringing } from "./ringing";
@@ export type CallScreenProps = {
   goal?: string;
+  // G1. "off" keeps the plain pill. The goal light never reaches the call provider.
+  goalLight?: GoalLightState;
@@ export function CallScreen(props: CallScreenProps) {
-    turns, statusMessage, testMedia, onMuteToggle, onCameraToggle, onEnd, onCancel, onInteraction, layout = "fullscreen", preview, standIn } = props;
+    turns, statusMessage, testMedia, onMuteToggle, onCameraToggle, onEnd, onCancel, onInteraction, layout = "fullscreen", preview, standIn, goalLight = "off" } = props;
@@
           {standIn ? standIn.prompt && <p className={`${styles.goalPill} ${styles.fadeable}`}><span className={styles.goalLabel}>Your part</span>{standIn.prompt}</p>
-            : goal?.trim() && <p className={`${styles.goalPill} ${styles.fadeable}`}><span className={styles.goalLabel}>Your line</span>{goal}</p>}
+            : goal?.trim() && (goalLight === "off"
+              ? <p className={`${styles.goalPill} ${styles.fadeable}`}><span className={styles.goalLabel}>Your line</span>{goal}</p>
+              : <GoalPill goal={goal} state={goalLight} className={`${styles.goalPill} ${styles.fadeable}`} />)}
```

**4. `components/practice/call-stage.tsx`** (type only; `...rest` already forwards it)

```diff
+import type { GoalLightState } from "@/lib/goal-check/client";
@@ export type CallStageProps = {
   goal: string;
+  goalLight?: GoalLightState;
```

**5. `app/practice/practice-workspace.tsx`**

```diff
 import { GreenRoom } from "@/components/practice/green-room";
+import { GoalLightToggle } from "@/components/practice/goal-pill";
+import { HearButton, useHearHighlight } from "@/components/practice/hear-button";
 import { Lobby, starterPortraitPath } from "@/components/practice/lobby";
@@
+import { useGoalLight } from "@/lib/goal-check/use-goal-light";
 import { selectMediaController } from "@/lib/media/controller-factory";
@@
   const [turns, setTurns] = useState<TranscriptTurn[]>([]);
+  // G1 goal light: off by default; browser memory only.
+  const [goalLightOn, setGoalLightOn] = useState(false);
+  const hearHighlight = useHearHighlight();
@@
   const phase = callPhase(flow);
+  // Only the user's own call; reflect.sessionId is set for practice starts and never for the stand-in.
+  const goalLight = useGoalLight({ enabled: goalLightOn && !standInLive, sessionId: phase === "live" ? reflect.sessionId : null, goal: callInfo.goal, turns });
@@ <MeetCard
         ? <MeetCard identity={{ name: meetName, relationship: meetRelationship, portraitSrc }} state={meetState} onRoleChange={setReviewRole}
+            hear={meetState.status === "ready" && meetState.role.opening.trim()
+              ? <HearButton name={meetName} text={meetState.role.opening} presetId={meetStart.kind === "preset" ? meetStart.preset : undefined} onPlayingChange={hearHighlight.onPlayingChange} />
+              : undefined}
+            bubbleClassName={hearHighlight.bubbleClassName}
@@ <GreenRoom extras
               extras={<>
                 {standInChosen && <p className="notice">First, a stand-in plays you. You play {meetName}.</p>}
+                <GoalLightToggle checked={goalLightOn} onChange={setGoalLightOn} />
                 {previousSessionId && <button type="button" className="button secondary" onClick={() => void endPrevious()} disabled={endingPrevious}>{endingPrevious ? "Ending the previous practice…" : "End the previous practice"}</button>}
@@ <CallStage
             <CallStage counterpartName={callInfo.name} goal={callInfo.goal} phase={phase} muted={muted} cameraEnabled={cameraEnabled} elapsedSeconds={elapsedSeconds} durationSeconds={plannedDurationRef.current}
+              goalLight={goalLight}
```

`presetId` is passed only when the Meet card is an unchanged starter (`meetStart.kind === "preset"`), which is exactly when the start uses that starter's PAL. Role and saved-person starts use `TAVUS_PAL_ID`, so the preview falls back to `ELEVENLABS_VOICE_ID`. `components/practice/green-room.tsx` needs no change (the toggle goes in the existing `extras` slot).

**6. `docs/08-SAFETY-AND-PRIVACY.md` privacy line** (line 43). The W10 sentence is left as it is for the coordinator (1G owns that status); the G1 and W3 sentences move to their own as-built paragraph.

```diff
-Planned in C1 (October 4; routes not built yet): **Show me first (W10)** sends the user's goal and optional hard-moment line to Tavus for that one stand-in call only, as stand-in context; the app does not store them, and the counterpart never receives them. The UI says so beside the button: "To play you, the stand-in gets your line. {name} never does." **Goal light (G1)** sends the goal and up to six of the user's own recent turns to the configured OpenAI model (`store: false`) during a call, from our route only; counterpart turns and anything private are not sent, and nothing is stored or logged. **Hear {name} (W3)** sends only the opening line to ElevenLabs text-to-speech.
+Planned in C1 (October 4; routes not built yet): **Show me first (W10)** sends the user's goal and optional hard-moment line to Tavus for that one stand-in call only, as stand-in context; the app does not store them, and the counterpart never receives them. The UI says so beside the button: "To play you, the stand-in gets your line. {name} never does."
+
+**Goal light (G1, built October 4; live not verified)** is off by default. When the user turns it on in the green room, the browser sends the goal and up to six of the user's own most recent turns to our goal-check route after each finished utterance, and the route sends them to the configured OpenAI model (`store: false`). Counterpart turns, notes, fears and About-me facts are not sent; the goal and turns never go to Tavus; nothing is stored or logged. Checks stop after the goal is first met. **Hear {name} (W3, built October 4; live not verified)** sends only the reviewed opening line to ElevenLabs text-to-speech through our server; the voice id stays on the server and the audio is not stored. ElevenLabs request logging (`enable_logging`) stays at its default because zero-retention mode is enterprise-only.
```

Also for the coordinator: docs/05 entries for both routes (the shapes match `lib/schemas/goal-check.ts` and `lib/schemas/voice-preview.ts` unchanged). Optional: add `ELEVENLABS_VOICE_ID` and `ELEVENLABS_STARTER_*_VOICE_ID` to `scripts/check-standin-bundle.mjs` so the value grep runs where those values are set; `tests/unit/voice-preview.test.ts` already greps names and any configured values when a build exists.

### Remaining risks

- Live not verified. Goal-light judgment quality (false positives) is untested against a real model; the fixtures only prove what reaches the stub and that the route returns its verdict.
- Model id default: the default PAL (`TAVUS_PAL_ID`, docs/06) uses `eleven_flash_v2_5`, while the preview defaults to `eleven_v4_turbo` (starter and quality PALs). Role and saved-person previews may sound slightly different from the call until `TAVUS_PAL_ID` switches or `ELEVENLABS_PREVIEW_TTS_MODEL` is set. W3's spike (does direct TTS match the PAL voice) is still open; if it doesn't, relabel the button "Hear a sample of {name}'s voice".
- Autoplay: the `Audio` element is created in the click, but some browsers (Safari) may still block `play()` after the fetch await; the button would then show "The preview couldn’t play. Try again." and the second press (from memory) should play.
- The call pill is `display: none` under the 700 px container query, so on narrow screens the "Goal reached" live region inside it is not announced.
- Limits are per server process (like the draft limit): multiple Vercel instances each count separately.
- A session reported `active` by the browser before `markConnected` lands gets 409 from the route; the watcher swallows it and retries after the next user turn.
- Owner isolation was tested with a mocked request-scoped client (RLS behavior assumed as in the reflect route), not with two real users.
