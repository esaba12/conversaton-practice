# 1D: Meet card and green room (S1, S2, W4 before, U1 streaming UI, U2 knowledge panel, T1 and D2 notices)

Status: ready for review (mock-tested; live not verified)
Updated: October 4, 2026, 01:20 EDT
Assigned writer: 1D worker subagent (claude-opus-5-5-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1D; docs/32 S1, S2, T1 (and the U1/U2/D2 sections in docs/32 or docs/next/04-NEW-SPECS.md); docs/next/04-NEW-SPECS.md W4 (before), W11 (streamed draft events); docs/next/03-CONTRACTS.md §2; docs/33 Meet/green-room screens; docs/next/05-UI-UPGRADE.md
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/63
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `50beba5` (C1, M1, 1C and 1B merged; 1B screens not yet wired into the workspace).
- Branch: `agent/1d-meet-green-room`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1d`
- Dev port: 3102
- Owned files: `components/practice/meet*.tsx`, `components/practice/green-room*.tsx` (+ CSS modules), `lib/practice/mic-meter.ts`, `lib/practice/devices.ts`, a client helper for the W11 event-stream draft if needed (`lib/setup/draft-stream-client.ts`), `app/design-preview/**` (add Meet/green-room states), tests, this record.
- Not owned (propose in Handoff): `app/practice/practice-workspace.tsx`, `lib/practice/flow.ts`, `lib/practice/private-state.ts` (use its API), `lib/schemas/**`, `lib/setup/generate.ts` and the draft route (1C, merged), `lib/media/**` and call components (1A in progress), lobby/briefing (1B, merged), stand-in components (1G in progress), `package.json`, lockfile, numbered docs, STATUS.md.
- Shared resources: no live calls, no provider calls, no migrations; port 3100 is the coordinator's. The green-room mic meter must use `getUserMedia` only after user action and release the stream on leave, on ready (handed to Daily) and on error.

## Scope and acceptance

From 02-BUILD-PLAN 1D:
- [x] S1 and S2 acceptance lists.
- [x] Mic stream released on leave, on ready (handed to Daily) and on error; camera stays off unless opted in (local preview only).
- [x] Tone notice (T1) on both screens; reflection disclosure line present (D2).
- [x] U1: the identity renders before the draft returns and fields fill as they stream (consume 1C's `text/event-stream` draft: `field` events, then one `done`; `error` event shape is `errorSchema`).
- [x] U2: the "Knows" list matches the start body's role fields by name; "Never sees" lists only fields the user filled.
- [x] W4 (before): the user's guess is private state only (`lib/practice/private-state.ts`), never in any request body.
- [x] Stance chips are counterpart context the user sees and edits; prediction, fear and likelihood stay private.
- [x] Starter portraits via `GET /api/portraits/[presetId]` with the initials fallback (reuse `components/ui/person-card` portrait logic if exported).
- [x] Meet/green-room states in `/design-preview` with `data-gallery-state` markers; no horizontal overflow at 320/390 px (use `grid-template-columns: minmax(0, 1fr)` on grid columns that hold nowrap chips).

## What was built

- `components/practice/meet-card.tsx` (+ `meet.module.css`): `MeetCard` (S1, U1, U2, T1) and `useStreamedDraft()`, `meetStateFromProgress()`. The card shows portrait, serif name and relationship from `identity` at once; "Reading your situation" (request sent), "Shaping {name}" (first role field), "Ready" (validated `done`) is the only status line, and skeletons (after 200 ms, static under reduced motion) fill the gaps. Only `state.status === "ready"` enables "Call {name}"; a partial is display only. Stance rows show the selected chip plus alternatives and a "Your own" custom chip (≤40, Enter saves, Escape cancels). "Edit details" holds the form; an invalid role opens it, marks the field and puts the reason under the disabled Call button. Length pills 3 / 5 min. The private card (goal as "Your line", hard-moment line) edits `lib/practice/private-state.ts`. Slots: `hear` (1E) and `extras` (1G).
- `components/practice/meet-knowledge.ts`: U2 derivation (`meetKnowledge`, `knowsFields`, `neverSees`), `situationFromRole`, `personRole`, `personStartSituation` (default vs custom scene for saved people), `roleProblem`, copy for T1 (`toneNotice`) and D2 (`reflectionDisclosure`), friendly challenge labels. "Never sees" shows labels only, never the private text.
- `components/practice/green-room.tsx` (+ `green-room.module.css`): `GreenRoom` (S2, W4 before, T1, D2) on the night surface. Primer → "Allow microphone" → browser prompt; meter (12 bars) + "If the bar moves, they'll hear you."; picker when more than one mic; designed denied / no mic / busy / unsupported / failed states with Try again; "Show my camera to me only" switch (off by default, local `<video muted>` preview, never published); private card with goal, hard-moment line, "What are you worried {name} will say?" (≤200) and the "How likely does that feel?" slider labeled "Your guess" (null until moved, clearable); optional "Settle for 60 seconds" (skippable, static ring under reduced motion); "I'm ready" disabled with a reason until the mic is live. Slot `extras` for 1E's goal light.
- `lib/practice/devices.ts`: `createGreenRoomMedia()` owns every local stream. `allowMic`/`setCamera` only run from user actions; `release()` (leave, unmount, page hide) and `handOff()` (I'm ready; returns `{ micDeviceId }`) stop all tracks; errors leave nothing held; a prompt that resolves after release is stopped at once; a failed device switch releases the old stream; an ended track becomes the "failed" state.
- `lib/practice/mic-meter.ts`: Web Audio analyser meter (`startMicMeter`, `litBars`, `rmsLevel`); stopping closes the audio context and never stops the stream.
- `lib/setup/draft-stream-client.ts`: `streamDraft()` (POST with `Accept: text/event-stream`, explicit four-field body, Zod-validated `field` / `done` / `error` events, JSON fallback, network and malformed errors as `SessionClientError`) and the pure `reduceDraftProgress()`; the streamed goal is never kept in card state, and on `done` the suggested goal fills private state only when the user left it blank.
- `/design-preview`: section "Meet card and green room (1D)" with `data-gallery-state` markers `meet-interactive` (simulated stream on local timers → stance edit → Call → green room with fake devices → I'm ready), `meet-streaming-reading`, `meet-streaming-shaping`, `meet-ready`, `meet-saved-person`, `meet-invalid`, `meet-out-of-scope`, `meet-unavailable`, `meet-long`, `green-primer`, `green-denied`, `green-no-mic`, `green-ready` (synthetic level), `green-start-failed`, `green-real-mic` (asks only on click). Status lines use `aria-live` without `role="status"`; errors use `role="alert"`.

## Verification evidence

All mock or local; **live not verified** (no provider call, no real call, no human mic check).

- `npm run typecheck`: pass.
- `npm test`: 26 files, 513 tests pass, including the new `tests/unit/meet-green-room.test.ts` (29 tests): meter math and teardown; green-room media asks for nothing until acted on, never requests video with the mic, releases mic and camera on leave and on hand-off, holds nothing after each error kind, stops late grants (mic and camera), switch and switch-failure release, ended track; SSE parsing across chunks and CRLF; `streamDraft` header, exact body keys (`situation`, `personId`) with private-state sentinels absent, field order, unknown-field skip, invalid-field and missing-`done` rejection, `error` event → `SessionClientError`, JSON error, JSON fallback, network error; progress reducer and status text; **U2**: Knows field names equal `Object.keys(body.role)` from a stubbed `startSession` for Jordan (with stance), Alex (without) and a partial-stance role; a saved person's custom scene equals `situationSchema` keys, identity and shared facts marked server-loaded; default scene has no stance; Never sees lists only filled fields and no text; **W4**: role, preset and saved-person start bodies contain no goal, hard-moment line, fear or likelihood with all of them set; rendering: identity and "Reading your situation" before any role text, ready card fields and Knows markers, invalid role reason, green room renders the primer without calling `getUserMedia` and contains T1, D2, camera and W4 copy.
- `npm run build`: pass (dev server stopped first).
- Playwright (installed Chromium, `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright`) against `next dev` on 3102, `/design-preview`, with "Edit details" open on the long card: `document.documentElement.scrollWidth === innerWidth` and no element of any `meet-*` / `green-*` capture outside the viewport at **320, 390 and 1440 px**, both normally and with `* { font-family: "Courier New" !important; letter-spacing: .04em !important }`. The first run found the long "Call {name}" button overflowing left at 320/390; fixed by letting CTA buttons wrap. Only console error: the 0A primitives gallery's intentional missing-face 404.
- Playwright interaction script (390 px): simulated stream shows identity, then "Shaping Jordan", then "Ready"; tapping an alternative stance chip and a custom chip updates `aria-pressed` and the Knows list; clearing the opening line shows the reason and restoring it round-trips; "When it gets hard" appears in Never sees only after typing; green room "I'm ready" is disabled until Allow; meter appears; worry text and the slider (keyboard) show "Your guess: 55%"; Settle opens and Skip closes; I'm ready reports the released mic hand-off.
- `tests/browser/frontend-preview.spec.ts` run against 3102 with a local config (not `npm run test:ui`): 6 passed, 1 skipped (production-only).
- Screenshots reviewed (not committed): Meet ready 1440, streaming 390, long 320 with fallback font, green room 1440 and 320.

## Handoff

- Changed paths and commits: `e62545f` (devices, mic meter, stream client, `lib/session/api-client.ts` stance), `c630745` (Meet card, knowledge, green room, unit tests), `472d2fb` (`app/design-preview/page.tsx`, `meet-green-room-gallery.tsx`, `gallery.module.css`), plus this record.
- Shared-file change made (required for U2 acceptance, minimal): `lib/session/api-client.ts` `startSession` now forwards `wants`, `holdsBackBecause`, `softensWhen` when present. Before, the edited stance chips were silently dropped from the role start body, so the counterpart never got them and "Knows" could not match the body. `roleContextSchema` already allows them and the server already uses them; the existing api-client tests still pass (their fixture has no stance).
- File naming note: the pure U2 module is `components/practice/meet-knowledge.ts` (inside the `meet*` family, no JSX). The existing `components/practice/meet-stage.tsx` is untouched.
- Remaining risks:
  - Not wired into `/practice` (coordinator-owned). Until it is, the hero path still uses today's review form.
  - The green room releases its meter stream on I'm ready; Daily opens its own microphone. Passing `micDeviceId` to Daily needs 1A's controller (below). Without it the call uses the browser default mic, which may differ from the one picked.
  - `GreenRoom` releases on `pagehide` and unmount; the workspace must still apply the flow's teardown (it already does for `pageHide`).
  - `lib/session/api-client.ts generateDraft` (JSON) still drops `personId`; `streamDraft` sends it. Once the workspace uses `streamDraft`, the JSON path is only the fallback.
  - Long stance chips (40 chars) truncate with an ellipsis inside the chip (Chip primitive is nowrap); the full text is in `title` and in the Knows list.
  - Live mic, meter and camera behavior on real devices and browsers is not verified.
- Proposed wiring (coordinator applies in `app/practice/practice-workspace.tsx` after the 1B lobby/briefing wiring; names match today's shell):

```diff
+import { GreenRoom } from "@/components/practice/green-room";
+import { MeetCard, meetStateFromProgress, useStreamedDraft, type MeetState } from "@/components/practice/meet-card";
+import { personRole, personStartSituation, situationFromRole, type MeetStart } from "@/components/practice/meet-knowledge";
+import { starterPortraitPath } from "@/components/practice/lobby";
+import type { DraftRequest, StanceOptions } from "@/lib/schemas/draft";
+import type { MediaHandoff } from "@/lib/practice/devices";
 …
+  const [stanceOptions, setStanceOptions] = useState<StanceOptions | undefined>();
+  const [lastDraftRequest, setLastDraftRequest] = useState<DraftRequest | null>(null);
+  const [sharedFactTexts, setSharedFactTexts] = useState<string[]>([]); // from the person page's shared-facts read, for U2 only
+  const micHandoffRef = useRef<MediaHandoff | null>(null);
+  const draftStream = useStreamedDraft({
+    onDone: (draft) => { setReviewRole(draft.role); setStanceOptions(draft.stanceOptions); setAssumptions(draft.assumptions); setSetupMode("generated"); setExamplePreset(null); },
+    onError: (error) => { if (error.code === "UNAUTHENTICATED") handleAuthLoss(); },
+  });
 …
   // BriefingPlan "draft" (U1): show the card at once, fields fill as they stream.
-  const draft = await generateDraft(request); … showStage({ type: "draftReady" });
+  setLastDraftRequest(plan.request); setReviewRole(emptyRole); setStanceOptions(undefined);
+  draftStream.start(plan.request);
+  showStage({ type: "draftReady" });
   // BriefingPlan "preset": setReviewRole(examples[preset].role); setStanceOptions(undefined); setExamplePreset(preset); showStage({ type: "draftReady" });
   // BriefingPlan "person-default" / "person-situation": setSavedPerson(person); setReviewRole(personRole(person, plan.kind === "person-situation" ? plan.situation : undefined)); showStage({ type: "draftReady" });
 …
+  const meetStart: MeetStart = savedPerson
+    ? { kind: "person", person: savedPerson, sharedFacts: sharedFactTexts, situation: personStartSituation(savedPerson, reviewRole) }
+    : examplePreset && JSON.stringify(roleContextSchema.parse(reviewRole)) === JSON.stringify(roleContextSchema.parse(examples[examplePreset].role)) ? { kind: "preset", preset: examplePreset } : { kind: "role" };
+  const meetState: MeetState = setupMode === "generated" && draftStream.progress.step !== "idle"
+    ? meetStateFromProgress(draftStream.progress, draftStream.progress.step === "ready" ? reviewRole : null)
+    : { status: "ready", role: reviewRole, stanceOptions };
+  const portraitSrc = meetStart.kind === "preset" ? starterPortraitPath(meetStart.preset) : null;
 …
-  {flow.stage === "meet" ? <MeetStage … /> : …}
+  {flow.stage === "meet" ? (
+    <MeetCard identity={{ name: savedPerson?.name ?? reviewRole.name, relationship: savedPerson?.relationship ?? reviewRole.role, portraitSrc }}
+      state={meetState} onRoleChange={setReviewRole} editable={savedPerson ? "situation" : "all"} start={meetStart} privateNotes={privateNotes}
+      durationSeconds={durationSeconds} onDurationChange={setDurationSeconds}
+      onBack={() => { draftStream.cancel(); savedPerson ? leavePerson() : backToDescribe(); }}
+      onCall={() => showStage({ type: "toGreenRoom" })}
+      onRetry={lastDraftRequest ? () => draftStream.start(lastDraftRequest) : undefined}
+      disabled={signingOut} disabledReason="Signing you out…" focusHeading={moveFocus} />
+  ) : flow.stage === "green" ? (
+    <GreenRoom name={meetState.status === "ready" ? meetState.role.name : reviewRole.name} relationship={reviewRole.role} portraitSrc={portraitSrc}
+      onBack={() => { const { teardown } = apply({ type: "back" }); if (teardown.releaseMic) releaseMedia(); endForTeardown(teardown, "user", "close"); setMoveFocus(true); }}
+      onReady={(handoff) => { micHandoffRef.current = handoff; savedPerson ? startPerson() : start(); }}
+      starting={starting} startError={setupMessage || null} disabled={signingOut} disabledReason="Signing you out…" focusHeading={moveFocus} />
+  ) : …}
 …
   // launch(): the green room already moved the flow; replace the three stacked events.
-      apply({ type: "toGreenRoom" });
-      apply({ type: "ready" });
-      apply({ type: "sessionAccepted" });
+      apply({ type: "sessionAccepted" });
   // and call apply({ type: "ready" }) before `await request(...)`, so ringing shows while the start request runs (1A's ringing screen).
   // startPerson(): for a custom scene send the situation (1C's person+situation branch):
-  startSavedPersonSession({ personId, expectedVersion, durationSeconds, idempotencyKey })
+  meetStart.kind === "person" && meetStart.situation === "custom"
+    ? startPersonSituationSession({ personId, expectedVersion, situation: situationFromRole(reviewRole), durationSeconds, idempotencyKey }) // new api-client helper, coordinator
+    : startSavedPersonSession({ personId, expectedVersion, durationSeconds, idempotencyKey })
   // 1A: media.create(...).connect(credential, { audioDeviceId: micHandoffRef.current?.micDeviceId ?? undefined }) once the Daily controller accepts a device id.
   // clearPrivateSetup(): also draftStream.cancel(); setStanceOptions(undefined); setLastDraftRequest(null);
```

- Also proposed (not done, not owned): `lib/practice/flow.ts` needs no change (green ↔ meet back, ready → ringing, and pageHide already match). A small `startPersonSituationSession` helper in `lib/session/api-client.ts` mirroring the schema's `personSituationStartSchema`. The hero-path browser test can drive the real components through the same `data-gallery-state`-free selectors used in the interaction script (`data-meet-status`, `data-mic`, `data-knows-field`, `data-never-key`).
- External account action: none.
- Ready for review: yes (draft PR).
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
