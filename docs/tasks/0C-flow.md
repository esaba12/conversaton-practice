# 0C: Practice flow state machine refactor (W1)

Status: ready for review
Updated: October 3, 2026, 23:05 EDT
Assigned writer: 0C worker subagent (claude-opus-5-thinking-high)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 0
Requirements/tests: docs/next/04-NEW-SPECS.md W1; docs/30 step 1 (private state clear)
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/44
Pull request: https://github.com/esaba12/conversaton-practice/pull/53 (draft)
CI run: `verify` passed in 1m27s on commit `86b921c` (https://github.com/esaba12/conversaton-practice/actions/runs/37172866824)

## Assignment and isolation

- Base ref + full SHA: `main` at `9419820b4330d0ef2b74a017445c216cfd560a53` (C0 contract commit merge).
- Branch: `agent/0c-flow`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/0c`
- Dev port: 3102
- Owned files: `app/practice/practice-workspace.tsx`, `lib/practice/**` (new: `flow.ts`, `private-state.ts`, helpers), `components/practice/**` (new, one component per stage), `tests/unit/practice-flow.test.ts` (new), this record.
- Shared resources: `lib/schemas/**`, `lib/session/**`, `lib/media/**`, `components/presentation/**` are not owned; import them, do not edit them. No provider, database or port 3100.
- Dependency tasks and contract revisions: C0 contract commit.
- Unblock condition: none.

## Scope and acceptance

Outcome: `practice-workspace.tsx` (618 lines, ~40 `useState`) becomes a thin shell that wires a pure reducer, the media controller and stage components, so Phase 1 slices can work in parallel and teardown is provable.
Non-goals: any visible change, new screens, new copy, styling changes.

- [x] `lib/practice/flow.ts`: pure reducer with stages `lobby → briefing → meet → green → ringing → call → recap` plus `retry-ringing → retry-call → retry-recap`; events `pickPerson`, `pickSomeoneNew`, `draftReady`, `toGreenRoom`, `ready`, `sessionAccepted`, `videoPlaying`, `ended`, `retryAccepted`, `back`, `signOut`, `authLost`, `pageHide`. Each transition declares teardown (`releaseMic`, `endSession`) as data.
- [x] Today's screens map onto stages (describe/review/person → briefing/meet; call → ringing/call; reflection/save after End → recap). Stages with no screen yet are reachable only in reducer tests.
- [x] `lib/practice/private-state.ts`: browser-memory holder for goal, hard-moment line, prediction and likelihoods with one `clear()` called on new setup, sign-out, auth loss and page hide.
- [x] Extract the remote `<video>` rendering (today `StreamVideo` inside the workspace) into `components/practice/remote-media.tsx` with no behavior change, so 0D can own it.
- [x] Reducer unit tests cover every transition, including illegal ones (for example `ready` from `lobby` is ignored); teardown flags asserted for leave-from-green, cancel-from-ringing, end-from-call, sign-out and page hide in every stage; private state cleared on the four events.
- [x] All existing unit tests pass unchanged; `npm run typecheck` passes. (Coordinator runs `npm run build` and `npm run test:ui` at integration; do not use port 3100.)
- [x] No private field (goal, hard-moment line, notes, fear, likelihoods) is added to any request body. No request body changed at all; `lib/session/api-client.ts` is untouched and `private-state.ts` has no importer other than the workspace and its test.

Partial against the "thin shell" wording: the workspace is 595 lines, down from 618. All stage JSX, the stage machine, the shared types and the copy helpers are out of it; what remains is request orchestration (draft generation, start/launch, people, save-after-end, reflection, sign-out) plus the media-controller wiring. Further extraction is proposed in the Handoff rather than done here, because no automated test renders this component and the hard rule for this slice is identical behavior.

## Contract and documentation changes

- After 0C merges, `practice-workspace.tsx` and `lib/practice/flow.ts` become coordinator-owned integration entrypoints (02-BUILD-PLAN §0). The reducer API and the stage props are documented below.
- Shared change: none made. Two proposals in the Handoff.
- Updated specs: none edited (numbered docs are not owned). A docs/03 architecture note is proposed in the Handoff.

## Reducer API (`lib/practice/flow.ts`)

Pure, no React, no I/O.

```ts
type FlowStage = "lobby" | "briefing" | "meet" | "green" | "ringing" | "call" | "recap"
               | "retry-ringing" | "retry-call" | "retry-recap";

type FlowEvent =
  | { type: "pickPerson" } | { type: "pickSomeoneNew" } | { type: "draftReady" }
  | { type: "toGreenRoom" } | { type: "ready" } | { type: "sessionAccepted" }
  | { type: "videoPlaying" } | { type: "ended"; interrupted?: boolean }
  | { type: "retryAccepted" } | { type: "back" }
  | { type: "signOut" } | { type: "authLost" } | { type: "pageHide" };

type FlowState = {
  stage: FlowStage;
  micHeld: boolean;       // a live mic stream this app must release
  sessionActive: boolean; // a practice session on the server that must be ended
  outcome: "none" | "ended" | "interrupted";
  retryUsed: boolean;     // docs/30: at most one retry per sitting
};

type Teardown = { releaseMic: boolean; endSession: boolean };
type FlowTransition = { state: FlowState; teardown: Teardown; clearPrivate: boolean; changed: boolean };

const initialFlowState: FlowState;              // stage "lobby", nothing held
function createFlowState(stage?: FlowStage): FlowState;
function reduceFlow(state: FlowState, event: FlowEvent): FlowTransition;
function callPhase(state: FlowState): "connecting" | "live" | "interrupted" | "ended" | null;
```

Rules the reducer encodes:

- An illegal event returns the **same state object**, `changed: false`, no teardown and no clear. A legal event that leaves the state identical (sign-out at the lobby, a second `sessionAccepted`) also reports `changed: false` but still reports its teardown and clear.
- `micHeld` becomes true at `toGreenRoom` (and at `retryAccepted`). `ready` does **not** release it: the stream is handed to the call provider, so it stays held through ringing and the call and is released when the call is left.
- `sessionActive` becomes true at `sessionAccepted`, which is when the start request has returned a session id.
- Teardown on a transition is always "what the stage still holds": `{ releaseMic: micHeld, endSession: sessionActive }`. That covers leave-from-green, cancel-from-ringing, end-from-call, sign-out, auth loss and page hide in every stage.
- `clearPrivate` is true on `pickPerson`, `pickSomeoneNew`, `signOut`, `authLost` and `pageHide` — the four occasions in docs/30 step 1. It is never true on a move inside a sitting.
- `back`: briefing → lobby, meet → briefing, green → meet, ringing → meet, recap → meet, retry-ringing → recap, retry-recap → meet. Ignored from lobby, call and retry-call (End is the way out of a call).
- `ended` with `interrupted: true` is the media-failure path and is legal only during a call. `ended` without it is the user's End, and is additionally legal on a recap whose outcome is `interrupted`, which matches today's still-enabled End button after an interruption.
- `retryAccepted` is legal once, from `recap` only. `pickPerson`/`pickSomeoneNew` reset `retryUsed`, because they start a new sitting.

## Private state API (`lib/practice/private-state.ts`)

Browser memory only. Never persisted, never logged, never added to a request body; the counterpart never receives any of it.

```ts
type PrivateState = { goal: string; hardMomentLine: string; prediction: string; likelihoodBefore: number | null; likelihoodAfter: number | null };
function readPrivateState(): Readonly<PrivateState>;
function updatePrivateState(patch: Partial<PrivateState>): Readonly<PrivateState>;
function clearPrivateState(): void;
function subscribePrivateState(listener: () => void): () => void;   // for useSyncExternalStore
```

The shell calls `clearPrivateState()` whenever a transition reports `clearPrivate`, and also from `clearPrivateSetup()` (sign-out, auth loss, back/forward-cache restore).

## Stage component props (`components/practice/*`)

One component per stage that exists today. `lobby` and `green` have no screen yet; 1B and 1D add them.

| File | Stage | Replaces |
|---|---|---|
| `briefing-stage.tsx` | `lobby` + `briefing` | `SetupDescribe` + `MyPeople` |
| `meet-stage.tsx` | `meet` | `SetupReview` and `SavedPersonStart` |
| `call-stage.tsx` | `ringing`, `call`, `recap` | `PracticeCall` |
| `recap-stage.tsx` | `recap` | `SaveAfterEnd` + `ReflectionPanel` + the end actions |
| `remote-media.tsx` | — | `StreamVideo`, moved unchanged (0D owns it next) |

```ts
type BriefingStageProps = {
  situation: string; goal: string; privateNotes: string;
  onSituationChange / onGoalChange / onPrivateNotesChange: (value: string) => void;
  onGenerate: () => void; onManual: () => void; onUseExample: (preset: SessionPreset) => void;
  generating: boolean; disabled: boolean; error: SetupDescribeError | null; focusHeading: boolean;
  people: Person[]; peopleStatus: "loading" | "ready" | "error"; peopleDisabled: boolean;
  onPickPerson: (person: Person) => void; onRetryPeople: () => void;
};

// Discriminated on `kind`; the common half carries the practice length and the
// "a previous practice is still open" controls.
type MeetStageProps = {
  onBack: () => void; onStart: () => void; starting: boolean;
  disabled: boolean; startDisabled: boolean; focusHeading: boolean; statusMessage: string;
  durationSeconds: PracticeDuration; onDurationChange: (value: PracticeDuration) => void; durationDisabled: boolean;
  previousSessionId: string | null; endingPrevious: boolean; onEndPrevious: () => void;
} & (
  | { kind: "person"; person: Person }
  | { kind: "review"; role: RoleContext; goal: string; assumptions: string[]; mode: SetupMode;
      onRoleChange: (role: RoleContext) => void; onGoalChange: (goal: string) => void;
      onRegenerate?: () => void; regenerating: boolean; error: SetupDescribeError | null }
);

type CallStageProps = {
  counterpartName: string; goal: string; phase: PracticePhase;
  muted: boolean; cameraEnabled: boolean; elapsedSeconds: number; durationSeconds: number;
  remoteStream: MediaStream | null; localStream: MediaStream | null;
  onMuteToggle: () => void; onCameraToggle: () => void; onEnd: () => void;
  statusMessage: string; testMedia: boolean; turns: readonly TranscriptTurn[];
};

type RecapStageProps = {
  ended: boolean;                 // false when the call was interrupted
  origin: CallOrigin | null; saveOffer: SaveOffer; people: Person[]; peopleStatus: "loading" | "ready" | "error";
  onSave: () => void; onDismissSave: () => void;
  reflect: ReflectState; turns: readonly TranscriptTurn[];
  onSelfReflectionChange: (value: string) => void; onReflect: () => void; onReflectionDone: () => void;
  canRetryCleanup: boolean; onRetryCleanup: () => void;
  onBackToSetup: () => void; backToSetupRef: Ref<HTMLButtonElement>;
};
```

`CallOrigin`, `SaveOffer`, `ReflectState`, `Cleanup`, `CleanupTarget`, `closedOffer`, `closedReflect` and `sameName` moved unchanged to `lib/practice/types.ts`. The copy helpers `failureMessages`, `cleanupMessage`, `reflectionError`, `FALLBACK_GOAL` and `GENERATION_FAILED` moved unchanged to `lib/practice/messages.ts`. The dead constant `EXAMPLE_GOAL` was dropped.

## How the shell maps today's screens onto the stages

- The workspace starts at `briefing`, because today's first screen is the description form with the saved-people cards above it. `lobby` renders the same screen until 1B splits them.
- Choosing a saved person dispatches `pickPerson` then `draftReady`: there is no briefing screen for a saved person yet.
- `generate` / "Set up manually" / an example dispatch `draftReady`.
- Start dispatches `toGreenRoom`, `ready` and `sessionAccepted` together, **after** the start request resolves, so the call screen still appears exactly when it does today. Ringing-on-click is W5's change, in 1A.
- The media controller's `ready` event dispatches `videoPlaying`; Q3 in 0D makes that literal.
- `finish` dispatches `ended`, `interrupt` dispatches `ended` with `interrupted: true`, "Back to setup" dispatches `back`.
- The shell honors `teardown.releaseMic` by calling `releaseMedia()` and `teardown.endSession` by taking the session id and either closing it (tracked, with the existing "Retry closing session" control) or abandoning it with `keepalive`. Sign-out, auth loss and page hide call `releaseMedia()` unconditionally as before, because that also invalidates a start request still in flight.

## Verification evidence

Mode: automated, in the worktree. **No live check. Live behavior is not verified**; no provider, database or Playwright run happened here.

| Command | Exit code | Outcome |
|---|---|---|
| `npm run typecheck` | 0 | No errors. |
| `npm test` | 0 | 17 files, 322 tests passed. 16 pre-existing files unchanged; `practice-flow.test.ts` adds 152 tests. |
| `npm run build` | 0 | Next.js 16.3.8 production build compiled and type-checked; route list unchanged. |
| `npm run dev -- --port 3102` + `curl` | 0 | `GET /practice` → 307 to sign-in (signed out, as expected); `GET /design-preview` → 200. Server stopped; port 3102 free. |

Not run here: `npm run test:ui` (port 3100 is the coordinator's) and any provider, migration or signed-in browser check.

Reducer test coverage (`tests/unit/practice-flow.test.ts`, 152 tests):

- The full 10 stages × 11 stage-scoped events matrix. Every pair is asserted either against the expected transition or as ignored (same state object, `changed: false`, no teardown, no clear), including `ready` from `lobby`.
- The input state is asserted unmodified on every call, so the reducer is proven pure.
- Teardown: leave-from-green (`releaseMic` only), cancel-from-ringing with and without an accepted session, end-from-call and end-from-retry-call, and sign-out, auth loss and page hide from **each of the ten stages**, each compared against what that stage holds.
- Private state: cleared on `pickPerson`, `pickSomeoneNew`, `signOut`, `authLost`, `pageHide`; never asked for on a move inside a sitting; holder round-trip, clear and subscriber notifications.
- `callPhase` for all ten stages, including the interrupted recap.

Not covered by any automated test: the workspace component itself. The repository has no React renderer in its test setup (Vitest runs `tests/unit/**/*.test.ts` in the `node` environment) and the browser tests only cover `/`, `/auth/sign-in`, signed-out `/practice` and `/design-preview`. The claim of no visible change rests on the diff (the JSX moved with identical attributes and copy), the type checker and the build, not on a rendered comparison.

## Handoff

- Changed paths and commit(s): branch `agent/0c-flow`.
  - Modified: `app/practice/practice-workspace.tsx` (618 → 595 lines; `view`, `step`, `phase`, `phaseRef` and `connectedRef` replaced by the reducer state plus `flowRef`).
  - Added: `lib/practice/flow.ts` (210), `lib/practice/private-state.ts` (58), `lib/practice/types.ts` (22), `lib/practice/messages.ts` (39), `components/practice/briefing-stage.tsx` (40), `components/practice/meet-stage.tsx` (71), `components/practice/call-stage.tsx` (37), `components/practice/recap-stage.tsx` (55), `components/practice/remote-media.tsx` (16), `tests/unit/practice-flow.test.ts` (324).
  - Untouched: `lib/schemas/**`, `lib/session/**`, `lib/media/**`, `components/presentation/**`, `supabase/**`, `package.json`, the lockfile, `scripts/**` and every numbered doc.
- Remaining failures/risks:
  1. **No rendered verification of the workspace.** The riskiest paths are the ones only reachable while signed in: start failure messages, VERSION_CONFLICT re-open, save-after-end and sign-out. Please run `npm run test:ui` and one signed-in pass through describe → review → start → End → Back to setup at integration.
  2. **Sign-out from the call screen** keeps the call screen up until the request resolves, which is today's behavior; the stage change is committed after the request instead of before it. If a later slice wants the setup screen immediately, move the `apply({ type: "signOut" })` to the top of `signOut()`.
  3. **`back` from `ringing` lands on `meet`, not `green`.** Nothing reaches it today (there is no cancel control during connecting). 1A should confirm the destination when it builds cancel-during-ringing; it is a one-line change in the reducer.
  4. **`pickSomeoneNew` is declared but never dispatched** today, because there is no lobby control for it. 1B wires it when the lobby exists; the private-state clear on it is already tested.
  5. The `green` stage is unreachable from the shell, so a bug there would only surface once 1D lands.
- Proposed shared-file changes (not made, coordinator's call):
  1. `docs/03` architecture note: add `lib/practice/flow.ts` as the practice stage machine and `components/practice/*` as the stage layer, with the table above.
  2. Optional follow-up slice: move the reflection state (`reflect`, `turns`, `requestReflectionNow`) and the saved-people state (`people`, `saveOffer`, `saveFromCall`) into `lib/practice/use-reflection.ts` and `lib/practice/use-saved-people.ts`. That takes the workspace to roughly 490 lines. It was left out of 0C deliberately: it carries real regression risk in the auth and save paths and nothing renders this component in CI today.
- External account action: none
- Next smallest task: 0D video-first media, which now owns `components/practice/remote-media.tsx`.
- Ready for review: yes
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
