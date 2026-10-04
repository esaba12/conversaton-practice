# 1A: Call screen, ringing, live interactions and call bar (S3, S4, S5, S6, W9)

Status: ready for review (mock-tested; live not verified)
Updated: October 4, 2026, 00:40 EDT
Assigned writer: 1A worker subagent (claude-opus-5-5-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1A; docs/32 S3, S4, S5, S6; docs/next/04-NEW-SPECS.md W9 (call bar), W5; docs/next/03-CONTRACTS.md §2.8; docs/33 call screens; docs/next/05-UI-UPGRADE.md §2
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/60
Pull request: https://github.com/esaba12/conversaton-practice/pull/72 (draft)
CI run: see the PR checks

## Assignment and isolation

- Base ref + full SHA: `main` `5d718ce` (Phase 0 complete).
- Branch: `agent/1a-call-screen`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1a`
- Dev port: 3101
- Owned files: `components/practice/ringing*.tsx`, `components/practice/call-*.tsx`, `components/practice/call.module.css`, `components/practice/remote-media.tsx` (keep 0D's gate intact), `lib/media/interactions.ts` (new), `lib/media/daily-controller.ts` (event parsing additions), `components/presentation/captions*` (restyle), `app/design-preview/**` (add call states), tests for these, this record.
- Not owned (propose changes in Handoff): `app/practice/practice-workspace.tsx`, `lib/practice/flow.ts`, `lib/schemas/**`, `lib/session/**`, `package.json`, lockfile, `scripts/**`, numbered docs, STATUS.md.
- Shared resources: no live calls; port 3100 is the coordinator's.
- Dependency tasks: Phase 0 merged. C1/M1 run in parallel; 1A does not depend on them.

## Scope and acceptance

From 02-BUILD-PLAN 1A:
- [x] S3, S4, S5, S6 acceptance lists (docs/32), mock-tested. Not built here: the `<ViewTransition>` morph (1F owns `transitions.tsx`), the ring sound (1F), the Daily local-audio-level user glow (the user glow uses Tavus `started_speaking` role `user` instead), and caption size settings.
- [x] W9: Help and the "Fictional AI" pill always present on the call screen (Help in the call bar while live and in the top bar while ringing; the pill sits in the top bar, outside the fading region).
- [x] Cancel during ringing tears down (mic released, session ended): controller and flow unit tests; the workspace hookup is the proposed diff below.
- [x] Controls fade but stay in the accessibility tree; 56 px call-bar targets (measured 64×58, End 72×58).
- [x] `lib/media/interactions.ts`: typed builders only for append context, `conversation.interrupt`, `conversation.respond`; fixed templates plus the reviewed name, or the user's typed turn (≤300). See the event-name note below.
- [x] Event parsing: `conversation.utterance.streaming` (captions), `conversation.started_speaking` / `stopped_speaking` with role `pal` or legacy `replica` (speaking glow). Analysis fields are stripped by the Zod schemas; inline tags (including unterminated ones) are removed.
- [x] Call states added to the dev-only `/design-preview/call` route (kept off `/design-preview` so `tests/browser/frontend-preview.spec.ts`'s page-wide locators still match only the presentation preview) with `data-gallery-state` markers and `data-surface="night"`.

## Verification evidence

All on branch `agent/1a-call-screen`, worktree `.worktrees/1a`, October 4, 2026, 00:15–00:40 EDT. No provider API was called.

**Tavus payload shapes, re-confirmed against the public docs (read October 4, 2026, ~00:05 EDT):**
- https://docs.tavus.io/sections/conversational-video-interface/interactions-protocols/overview (Daily `sendAppMessage(payload, '*')`; `conversation.respond` `{ text }`; `conversation.interrupt` with no `properties`).
- https://docs.tavus.io/sections/event-schemas/conversation-append-context: the event type is documented as **`conversation.append_llm_context`** with `properties.context`. The October 3 harness (`scripts/preflight/video.html`) sent `conversation.append_context`, and SPIKE-01 records no live result for it. The code follows the docs; the name is one constant (`APPEND_CONTEXT_EVENT` in `lib/media/interactions.ts`) for the live check.
- https://docs.tavus.io/sections/event-schemas/conversation-utterance-streaming: `properties { role: pal|user (legacy replica), speech (accumulated for the turn), content_index, final, is_interrupted?, participant_id?, participant_name? }`.
- https://docs.tavus.io/sections/event-schemas/conversation-started-stopped-speaking: role `pal` or `user`, plus a legacy duplicate with `replica`; stopped carries `duration`, `interrupted`.
- Create Conversation docs show `conversation_url = https://tavus.daily.co/{conversation_id}`; the browser credential has no conversation id, so the controller derives it from the room URL path and sends nothing if the path is not a single id segment.

**Commands (exit codes):**
- `npm run typecheck`: 0.
- `npm test`: 0; 24 files, 467 tests. New: `tests/unit/interactions.test.ts` (11: exact payloads, wait order, 300-char cap, forged/other text refused at the send boundary, room-URL id, wrap-up timing including a 250 ms tick simulation, End before T−30 sends nothing, ≤30 s calls send nothing, live-state reducer), `tests/unit/call-screen.test.ts` (17: shortcuts and their typing/modifier guards, visible shortcut list, self-view corners, caption selection and tail, call bar names, no "pause" in the call markup, faded controls still in markup with the pill outside the fading region, ringing contents, honey cue at T−30, waiting note, unavailable reason, 300 cap, Help 911/988 and End, test-media label, ringing cancel teardown through the flow reducer, forbidden words over `components/practice/call*|ringing*`). `tests/unit/daily-controller.test.ts` +6 (streaming captions for pal/user with replica dedupe and `user_audio_analysis` field and tags dropped; speaking roles pal/replica/user; network quality; send only while live, exact payloads with the derived conversation id, nothing after End; no id → nothing sent; cancel while the join is pending releases the mic, destroys the call, emits nothing after). The existing inline `<user_audio_analysis>` tag test and the 0D video-first tests are unchanged and pass.
- `npm run build`: 0. `next-env.d.ts` unchanged.
- Dev server on 3101 only (stopped afterwards). `scripts/ui/screenshots.mjs --base http://127.0.0.1:3101 --route /design-preview`: 294 screenshots, 49 gallery states (21 new `call-*`, including six `call-button-*` states), viewed at 390/900/1440. Fixed from the review: the global `h1 span` rule colored the name sage on night; the type field overflowed at 390 px; the goal pill overlapped the bar at 900 px (now container queries).
- Rerun after moving the call states to `/design-preview/call` (first CI run of PR #72 failed `test:ui` because the old spec's unscoped locators such as "End practice", "Synthetic self-view" and the "Call controls" group also matched the call gallery): `npm run typecheck` 0, `npm test` 0 (467), `npm run build` 0 (lists `/design-preview/call`); the full browser suite with a temporary uncommitted copy of `playwright.config.ts` pointed at 3101: 9 passed, 1 skipped (production-only); `screenshots.mjs --route /design-preview/call`: 126 screenshots, 21 call states; `/design-preview` now has no `call-*` states.
- Browser console on `/design-preview` (both reduced-motion settings): no page errors and no hydration warnings after making `drag` and the ringing entrance independent of reduced motion. The only failed request is 0A's intentional `design-preview-missing-face.jpg`.
- Scripted Playwright pass on the gallery's unmarked interactive call (sends go nowhere): M mutes, C hides captions, W sends interrupt then append context and shows the waiting note, T opens and focuses the input, letters typed there trigger no shortcut, Enter sends `conversation.respond` and shows the typed caption and clears waiting, Enter on empty sends nothing, the input caps at 300, Esc closes it, ? opens the shortcuts sheet and Esc closes it, Esc opens "End the call with Jordan?", controls go `data-idle` after 3.6 s with End still in the accessibility tree and the pill at opacity 1, pointer and key wake them. Bar buttons measured 64×58 px (End 72×58).
- The proposed wiring diff below was applied in a scratch copy (`/tmp`, deleted afterwards): `tsc --noEmit` clean, 467 tests pass.

**Not verified:** no live Tavus call. Wrap-up timing and wording effect, ask-to-wait behavior, typed-turn latency, streaming caption cadence, speaking-glow timing and the append event name all need the human live check. Mock browser coverage of ringing → live → ended through the workspace waits for the coordinator's hero-path spec after wiring.

## Handoff

- Changed paths and commit(s): `lib/media/interactions.ts` (new), `lib/media/daily-controller.ts`, `components/practice/{call-screen,call-bar,call-sheets,call-shortcuts,call-self-view,ringing}.tsx` (new), `components/practice/call.module.css` (new), `components/practice/call-stage.tsx`, `components/presentation/captions.tsx`, `components/presentation/captions.module.css`, `app/design-preview/{call-gallery.tsx,call/page.tsx,gallery.module.css}` (`page.tsx` unchanged from main), `tests/unit/{interactions,call-screen}.test.ts` (new), `tests/unit/daily-controller.test.ts`, this record. Implementation commit `52b666e`; PR #72 (draft).
- Behavior without wiring: `CallStage` now renders the night call screen. Until the diff below is applied it receives no live events and no `onInteraction`, so captions fall back to finished turns, there is no speaking glow, Type and Wait show "Typing and asking to wait aren't available in this call.", no wrap-up is sent (the honey cue still shows at T−30), and ringing Cancel falls back to End.
- Proposed shared-file changes (coordinator applies; verified in a scratch copy):

```diff
--- a/lib/schemas/media.ts
+++ b/lib/schemas/media.ts
@@ -1,4 +1,5 @@
 import { z } from "zod";
+import type { Interaction, LiveEvent } from "@/lib/media/interactions";
 // Frozen after the 14:54 human preflight (usable video/speech, imperfect lip sync). Never contains API keys.
 export const mediaCredentialSchema = z.object({
   provider: z.literal("tavus"),
@@ -32,5 +33,8 @@
   setCamera(enabled: boolean): Promise<boolean>;
   // Idempotent, synchronous-first local release; never awaits the application server.
   end(): Promise<void>;
+  // Live interactions (docs/next/03-CONTRACTS.md §2.8). True only when the message left for a live call. Optional so test controllers may omit it.
+  send?(interaction: Interaction): boolean;
 }
-export type CreateMediaController = (onEvent: (event: MediaEvent) => void) => MediaController;
+// `onLive` carries captions, speaking state and network quality for the screen only; never analysis fields.
+export type CreateMediaController = (onEvent: (event: MediaEvent) => void, onLive?: (event: LiveEvent) => void) => MediaController;
--- a/app/practice/practice-workspace.tsx
+++ b/app/practice/practice-workspace.tsx
@@ -12,6 +12,7 @@
 import { examples } from "@/fixtures/examples";
 import { createBrowserAuthClient } from "@/lib/auth/browser";
 import { selectMediaController } from "@/lib/media/controller-factory";
+import { initialLiveCallState, reduceLiveCall, type Interaction, type LiveCallState } from "@/lib/media/interactions";
 import { createPerson, getPerson, listPeople, updatePerson } from "@/lib/people/api-client";
 import { callPhase, createFlowState, reduceFlow, type FlowEvent, type FlowState, type Teardown } from "@/lib/practice/flow";
 import { cleanupMessage, failureMessages, reflectionError, FALLBACK_GOAL, GENERATION_FAILED } from "@/lib/practice/messages";
@@ -70,6 +71,8 @@
   const [saveOffer, setSaveOffer] = useState<SaveOffer>(closedOffer);
   // The provider transcript for the current attempt only; never logged or persisted.
   const [turns, setTurns] = useState<TranscriptTurn[]>([]);
+  // Captions, speaking glow and network quality for the call screen only; never stored.
+  const [liveCall, setLiveCall] = useState<LiveCallState>(initialLiveCallState);
   const [reflect, setReflect] = useState<ReflectState>(closedReflect);
   const reflectGenerationRef = useRef(0);
   const reflectingRef = useRef(false);
@@ -120,8 +123,14 @@
     setRemoteStream(null);
     setLocalStream(null);
     setCameraEnabled(false);
+    setLiveCall(initialLiveCallState);
   }
 
+  // Wrap-up, ask-to-wait and typed turns: fixed templates plus the reviewed name, or the user's typed turn.
+  function sendInteraction(interaction: Interaction) {
+    return controllerRef.current?.send?.(interaction) ?? false;
+  }
+
   function takeSessionId() {
     const id = sessionIdRef.current;
     sessionIdRef.current = null;
@@ -347,7 +356,10 @@
       apply({ type: "sessionAccepted" });
       const media = mediaRef.current ??= selectMediaController();
       setTestMedia(media.testMode);
-      const controller = media.create((event) => handleMediaEvent(attempt, event));
+      setLiveCall(initialLiveCallState);
+      const controller = media.create((event) => handleMediaEvent(attempt, event), (event) => {
+        if (attempt === attemptRef.current) setLiveCall((state) => reduceLiveCall(state, event));
+      });
       controllerRef.current = controller;
       joined = true;
       await controller.connect(credential);
@@ -586,7 +598,8 @@
       ) : <>
         <CallStage counterpartName={callInfo.name} goal={callInfo.goal} phase={phase} muted={muted} cameraEnabled={cameraEnabled} elapsedSeconds={elapsedSeconds} durationSeconds={plannedDurationRef.current}
           remoteStream={remoteStream} localStream={localStream}
-          onMuteToggle={toggleMute} onCameraToggle={() => void toggleCamera()} onEnd={() => finish("user")} statusMessage={statusMessage} testMedia={testMedia} turns={turns} />
+          onMuteToggle={toggleMute} onCameraToggle={() => void toggleCamera()} onEnd={() => finish("user")} statusMessage={statusMessage} testMedia={testMedia} turns={turns}
+          live={liveCall} onInteraction={sendInteraction} onCancel={backToSetup} />
         {(phase === "ended" || phase === "interrupted") && <RecapStage ended={phase === "ended"} origin={callOrigin} saveOffer={saveOffer} people={people} peopleStatus={peopleStatus}
           onSave={() => void saveFromCall()} onDismissSave={dismissSave} reflect={reflect} turns={turns}
           onSelfReflectionChange={(selfReflection) => setReflect((state) => ({ ...state, selfReflection }))} onReflect={() => void requestReflectionNow()} onReflectionDone={clearReflection}
```

- Optional W5 follow-up (not in the diff, not verified): today the workspace applies `toGreenRoom`, `ready`, `sessionAccepted` only after the start request resolves, so ringing appears on acceptance (matches S3 wording). To show ringing on click (W5 ≤300 ms), set `callInfo` and apply `toGreenRoom` + `ready` before `await request(...)`, apply `sessionAccepted` after, and apply `back` on a start failure so the Meet screen shows the error. Cancel before acceptance is already safe: `backToSetup` → `releaseMedia` bumps the attempt, and the late response ends its session with keepalive.
- Also proposed: drop the stale `components/presentation/captions.module.css` entry from `UI_RULES_ALLOW_LIST` in `tests/unit/ui-rules.test.ts` (the file is token-only now); docs/next/03-CONTRACTS.md §2.8 and docs/32 S4/S5 should name `conversation.append_llm_context` (or record the live result if the legacy name is kept); docs/33 status can say the call shell, ringing, bar, captions and glow are built (mock-tested).
- Remaining failures/risks: see "Not verified" above. Specific live risks: (1) append event name; (2) the conversation id derived from the room URL; (3) if a wrap-up send returns false, it is retried on each one-second tick until it succeeds or the call ends; (4) ringing keeps the remote video mounted at opacity 0 so the 0D gate can fire, which needs a real-browser check that `playing` still fires; (5) `onLive` events arrive only while the call is live, like utterances.
- External account action: none.
- Ready for review: yes (draft PR).
- Coordinator integration: pending.

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
