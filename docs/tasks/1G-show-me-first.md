# 1G: Show me first (W10), practice history and hasPracticed

Status: implemented, mock-tested, live not verified (worker finished October 4, ~01:05 EDT)
Updated: October 4, 2026, 01:05 EDT
Assigned writer: 1G worker subagent (claude-opus-5-thinking-high)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1 (part of the hero-path checkpoint)
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1G; docs/next/04-NEW-SPECS.md W10 (acceptance 1–8); docs/next/03-CONTRACTS.md §2 (stand-in start branch in `lib/schemas/session.ts`), §2.7 (`buildStandInContext`), §2.5 (M1 `kind`, `practice_history()`); docs/07, docs/08, docs/32 A1 (stand-in exception)
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/66
Pull request: https://github.com/esaba12/conversaton-practice/pull/74 (draft)
CI run: not checked by the worker; see the PR checks

## Assignment and isolation

- Base ref + full SHA: `main` `6a378b3` (C1, M1 applied, 1C merged).
- Branch: `agent/1g-show-me-first`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1g`
- Dev port: 3103
- Owned files: `components/practice/stand-in*.tsx` (+ CSS module), `lib/practice/stand-in-client.ts` (the only client function that may send the goal), `lib/session/stand-in-context.ts` (server-only `buildStandInContext`), the stand-in branch in `lib/session/server.ts` (remove only the `standIn` part of the 400 guard), `app/api/practice-history/route.ts`, the `hasPracticed` derivation in `lib/data/people.ts`, a new `lib/data/practice-history.ts` if useful, `app/design-preview/**` (add stand-in/Your-turn states), tests, this record.
- Not owned (propose in Handoff): `app/practice/practice-workspace.tsx`, `lib/practice/flow.ts`, `lib/practice/private-state.ts` (use its API), `lib/schemas/**`, `lib/media/**` (1A is editing `daily-controller.ts`; reuse the existing call shell/components read-only), `components/practice/call-*`/`ringing*`/`remote-media.tsx` (1A), lobby/briefing components (1B), `package.json`, lockfile, migrations, numbered docs, STATUS.md.
- Shared resources: no live calls, no provider calls (mock Tavus in tests), no migrations, no real-Auth scripts.
- Stand-in media: server env `TAVUS_STANDIN_PAL_ID`, `TAVUS_STANDIN_FACE_ID` (reserved face; never a person preset). Use the optional media override already on `createConversation` in `lib/media/tavus.ts`. Session row `kind: 'stand_in'` via `acquire(..., { kind: 'stand_in', preset })` in `lib/data/sessions.ts`.

## Scope and acceptance

W10 list 1–8 (docs/next/04-NEW-SPECS.md), in short:
- [x] 1. No goal: Show me first disabled with its reason. First practice with a person: primary button; after an ended practice: secondary. "Skip to my turn" goes straight to the normal call. *(`standInOffer` + `StandInOfferButtons`; `stand-in-sitting.test.ts`, `stand-in-ui.test.ts`. The wiring that renders them on the Meet card is proposed, not applied.)*
- [x] 2. Stand-in start body contains only the allowed fields; normal, preset, saved-person and retry bodies still carry no goal or hard-moment line (unit). *(`stand-in-client.test.ts`, `stand-in-server.test.ts`)*
- [x] 3. `buildStandInContext` snapshot: goal, hard-moment line, counterpart's name and situation; no notes, fear, likelihoods, About-me facts, traits or stance chips. *(`stand-in-context.test.ts`; the saved-person drop is asserted in `stand-in-server.test.ts`.)*
- [x] 4. `buildRoleContext` for the following Your-turn call contains no goal (regression). *(`stand-in-context.test.ts`, plus the unchanged preset start in `stand-in-server.test.ts`.)*
- [x] 5. Stand-in call turns are cleared at End and never sent to reflection. *(`endStandIn` returns no turns and `runReflection: false`; the call screen says so on screen. The workspace call site is proposed below.)*
- [x] 6. Offered once per sitting; cap of three calls holds; retry still at most once. *(`stand-in-sitting.test.ts`)*
- [x] 7. End, sign-out and page hide release mic and camera from the stand-in call and the Your-turn card. *(`stand-in-sitting.test.ts` drives the real `reduceFlow`; the Your-turn card renders no media element.)*
- [x] 8. Stand-in face and voice ids never reach the browser. *(source rule in `stand-in-bundle.test.ts` plus `scripts/check-standin-bundle.mjs` over `.next/static`.)*
- [x] `GET /api/practice-history` (signed-in) returns `practiceHistoryResponseSchema` from `practice_history()`; `hasPracticed` on person reads derived from it. *(`practice-history.test.ts`)*

## Verification evidence

Run in the 1G worktree on October 4, ~01:00 EDT. No provider call, no migration, no real-Auth script, no dependency change; Tavus is stubbed in every test.

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | exit 0 |
| Unit | `npm test` | exit 0; **31 files, 517 tests passed** (7 new files: `stand-in-context`, `stand-in-server`, `stand-in-client`, `stand-in-sitting`, `stand-in-ui`, `stand-in-bundle`, `practice-history`) |
| Build | `npm run build` | exit 0; `/api/practice-history` listed as a dynamic route |
| Bundle grep | build with marker ids, then `node scripts/check-standin-bundle.mjs` | exit 0; 35 files in `.next/static` scanned for 3 env names and 3 configured values; no match |
| Gallery | `curl http://127.0.0.1:3103/design-preview` (dev server stopped afterwards) | HTTP 200; all 8 `data-gallery-state="stand-in-*"` markers present |

**Not verified live.** No real Tavus conversation and no human call. `TAVUS_STANDIN_PAL_ID` and `TAVUS_STANDIN_FACE_ID` are still empty in `.env.local`, so the branch answers 503 `NOT_CONFIGURED` until 0B provisions the stand-in PAL and face. The live checks in W10 (the line said nearly verbatim, one kind hold under pushback, never coaching, and the face swap reading as "now it's you") are all outstanding. The Cursor browser tool could not reach the local dev server, so there is no screenshot; the gallery evidence is the served markup.

**Coordinator correction and privacy review (October 4, ~01:05 EDT).** The stand-in PAL, face and voice were provisioned in SPIKE-01 and are set in the main checkout's `.env.local`; the worktree copy holds public values only, which is why they read empty here. The configured stand-in face matches neither the default face nor any starter face (checked by comparison, values not printed). Privacy review: claude-opus-5-5-medium (gpt-5.6-sol-medium was unavailable; Fable needs an owner policy acknowledgment), verdict approve with fixes, no must-fix. Applied by the coordinator:
- `requireEndedSession` reads `kind` and answers 404 for a stand-in session, so the server never reflects on one (`tests/unit/reflection-session.test.ts`).
- `standInMedia()` fails closed when the reserved face equals `TAVUS_FACE_ID` or any `TAVUS_STARTER_*_FACE_ID`.
- `npm run check:standin-bundle` added and run in CI after the build.

After the fixes: typecheck exit 0; `npm test` 520 passed; `npm run build` exit 0; `npm run check:standin-bundle` pass (35 files). Not taken: skipping the history read after person writes, and documenting the goal-free fingerprint (both nits).

## Handoff

### Changed paths and commits

Branch `agent/1g-show-me-first`, five commits on top of `abfa75a`:

| Commit | Paths |
|---|---|
| `02046e9` server-only stand-in context and the start branch | `lib/session/stand-in-context.ts` (new), `lib/session/server.ts`, `lib/media/tavus.ts`, `tests/unit/stand-in-context.test.ts`, `tests/unit/stand-in-server.test.ts`, `tests/unit/session-server.test.ts` |
| `c6cc7b3` practice history and derived `hasPracticed` | `lib/data/practice-history.ts` (new), `app/api/practice-history/route.ts` (new), `lib/data/people.ts`, `tests/unit/practice-history.test.ts` |
| `9ba5972` stand-in start client and sitting rules | `lib/practice/stand-in-client.ts` (new), `lib/practice/stand-in-sitting.ts` (new), `tests/unit/stand-in-client.test.ts`, `tests/unit/stand-in-sitting.test.ts` |
| `88cfc9c` UI | `components/practice/stand-in-offer.tsx`, `stand-in-call.tsx`, `stand-in-your-turn.tsx`, `stand-in.module.css` (all new), `app/design-preview/stand-in-gallery.tsx` (new), `app/design-preview/page.tsx`, `tests/unit/stand-in-ui.test.ts` |
| `88f2d31` bundle check | `scripts/check-standin-bundle.mjs` (new), `tests/unit/stand-in-bundle.test.ts` |

`lib/practice/stand-in-sitting.ts` is a new file in a directory 1G only partly owns; it holds pure rules (no React, no I/O) and nothing else in `lib/practice/` imports it yet.

### Proposed wiring (not applied: 1A and 1B own these files)

**`lib/practice/flow.ts`: no change needed.** The stand-in reuses the existing `green → ringing → call → recap` stages, so teardown is already correct, and the Your-turn card leaves `recap` through `back` (which releases nothing, because a recap holds nothing) rather than through `retryAccepted`. The retry therefore stays unused, which is what keeps acceptance 6 true.

**`app/practice/practice-workspace.tsx`**, the diff in full:

1. Imports:

```ts
import { StandInCall } from "@/components/practice/stand-in-call";
import { StandInOfferButtons } from "@/components/practice/stand-in-offer";
import { StandInYourTurn } from "@/components/practice/stand-in-your-turn";
import { startStandInSession } from "@/lib/practice/stand-in-client";
import { beginCall, beginStandIn, endStandIn, initialStandInSitting, standInOffer, type StandInSitting } from "@/lib/practice/stand-in-sitting";
import { readPrivateState, updatePrivateState } from "@/lib/practice/private-state";
```

2. State, beside the existing call state:

```ts
const [sitting, setSitting] = useState<StandInSitting>(initialStandInSitting);
const [standInLive, setStandInLive] = useState(false);
const [noteToSelf, setNoteToSelf] = useState("");          // browser memory only, never sent
const standInRef = useRef(false);                           // authoritative for media callbacks
const [practicedPresets, setPracticedPresets] = useState<SessionPreset[]>([]);
```

3. Start it, beside `start()` and `startPerson()`. `launch` gains one option so the stand-in call
   never opens a reflection:

```ts
function startStandIn() {
  const { goal, hardMomentLine } = readPrivateState();
  if (!goal.trim() || !canStartCall(sitting)) return;
  const role = savedPerson ? null : parseReviewedRole(reviewRole);
  if (!savedPerson && !role) return;
  const target = savedPerson
    ? { kind: "person" as const, person: { id: savedPerson.id, version: savedPerson.version } }
    : examplePreset && setupMode === "example"
      ? { kind: "preset" as const, preset: examplePreset }
      : { kind: "role" as const, role: role! };
  const origin: CallOrigin = savedPerson ? { kind: "person", person: savedPerson } : { kind: "role", role: role! };
  standInRef.current = true;
  setStandInLive(true);
  setSitting(beginStandIn(sitting));
  // The empty goal argument keeps the goal out of callInfo: the stand-in screen shows no goal.
  void launch(origin, "", (idempotencyKey) => startStandInSession({ target, goal, hardMomentLine, idempotencyKey }), { standIn: true });
}
```

   In `launch`, guard the two reflection lines with the new option:

```ts
async function launch(origin: CallOrigin, goal: string, request: (key: string) => Promise<StartResponse>, options: { standIn?: boolean } = {}) {
  ...
  if (!options.standIn) setReflect({ ...closedReflect, sessionId: session.id, goal: reflectGoal });
  if (!options.standIn) setSaveOffer({ ...closedOffer, open: true });
```

4. End of the stand-in call, in `finish()` after the existing `apply({ type: "ended" })`:

```ts
if (standInRef.current) {
  const { turns: cleared } = endStandIn(sitting);
  clearReflection();            // drops the held turns and cancels any pending request
  setTurns([...cleared]);       // acceptance 5: nothing from this call survives End
  setSitting(beginCall(sitting)); // the user's own call is the next one against the cap
}
```

5. "Call {name}" from the Your-turn card. It leaves `recap` without spending the retry:

```ts
function callAfterStandIn() {
  standInRef.current = false;
  setStandInLive(false);
  setNoteToSelf("");
  const { teardown } = apply({ type: "back" });        // recap -> meet; holds nothing, releases nothing
  endForTeardown(teardown, "user", "close");
  setCallMessage(""); setCleanup(null); setCleanupTarget(null); setSetupMessage("");
  if (savedPerson) startPerson(); else void start();
}
```

6. Render. Two swaps inside the existing `phase === null ? ... : ...` branch:

```tsx
{standInLive
  ? <StandInCall counterpartName={callInfo.name} phase={phase} muted={muted} cameraEnabled={cameraEnabled}
      elapsedSeconds={elapsedSeconds} durationSeconds={plannedDurationRef.current}
      remoteMedia={remoteStream ? <RemoteStreamVideo stream={remoteStream} /> : null}
      localPreview={localStream ? <StreamVideo stream={localStream} muted /> : undefined}
      fear={readPrivateState().prediction}
      onMuteToggle={toggleMute} onCameraToggle={() => void toggleCamera()} onEnd={() => finish("user")}
      statusMessage={statusMessage} testMedia={testMedia} turns={turns} />
  : <CallStage ... />}

{standInLive && phase === "ended"
  ? <StandInYourTurn counterpartName={callInfo.name} goal={readPrivateState().goal} hardMomentLine={readPrivateState().hardMomentLine}
      note={noteToSelf} onGoalChange={(goal) => updatePrivateState({ goal })}
      onHardMomentLineChange={(hardMomentLine) => updatePrivateState({ hardMomentLine })} onNoteChange={setNoteToSelf}
      onCall={callAfterStandIn} starting={starting} />
  : (phase === "ended" || phase === "interrupted") && <RecapStage ... />}
```

7. Meet card. Pass the offer through `MeetStage`'s existing `actions` slot:

```tsx
<StandInOfferButtons counterpartName={savedPerson?.name ?? reviewRole.name}
  offer={standInOffer({
    counterpartName: savedPerson?.name ?? reviewRole.name,
    goal: readPrivateState().goal,
    hasPracticed: savedPerson?.hasPracticed ?? (examplePreset ? practicedPresets.includes(examplePreset) : false),
    sitting,
  })}
  onShowMeFirst={startStandIn} onSkip={savedPerson ? startPerson : () => void start()}
  starting={starting} callDisabledReason={previousSessionId ? "End the previous practice first." : undefined} />
```

   `practicedPresets` comes from `fetchPracticedPresets()` in the same effect that loads people.

### Proposed shared-file changes

Already made, minimally, because acceptance needs them:

- `lib/media/tavus.ts` — exported `ConversationMedia` with optional `context` and `greeting`; `conversationBody` uses them in place of `buildRoleContext(role, extras)` and `role.opening`. Existing callers pass the same `{ palId, faceId }` and behave identically. Without this the stand-in could not replace the counterpart context.
- `lib/session/server.ts` — the staged 400 guard is replaced by the stand-in branch, and the lease/provider/cleanup tail moved into a shared `runStart` so both branches get identical cleanup instead of a duplicated copy. `startFingerprint` takes an optional `kind`, appended only for a stand-in, so existing fingerprints are unchanged.
- `lib/data/people.ts` — `hasPracticed` only.
- `tests/unit/session-server.test.ts` — the C1 staging assertion for the stand-in body now expects 503 (fails closed without its face and PAL) instead of 400 (branch unavailable).

Still needed from their owners:

- `components/practice/meet-stage.tsx` (1D) — an optional `extraActions?: ReactNode` rendered inside `MeetActions`, so the offer can sit on both the saved-person and review Meet cards without the workspace reaching past `MeetStage`.
- `app/practice/practice-workspace.tsx` and the green room (1B/1D) — the diff above, plus the green-room line "First, a stand-in plays you. You play {name}."

### Remaining failures and risks

- **Blocker for a live run:** `TAVUS_STANDIN_PAL_ID` and `TAVUS_STANDIN_FACE_ID` are empty, so the branch returns 503. It fails closed deliberately: borrowing the default or a starter face would put the counterpart's face on the stand-in and lose the "switch seats" moment. 0B owns provisioning; the coordinator's hero-path browser test will see the 503 until then.
- The stand-in behaving well (verbatim line, one kind hold, no coaching) is prompt-shaped and unverified. 02-BUILD-PLAN §8's mitigation is in place: `custom_greeting` opens the scene so the call reaches the line.
- `hasPracticed` adds one `practice_history()` RPC per person read. It is deliberately non-fatal: a failed history read omits the field rather than failing the people list.
- `endStandIn` and the sitting rules are pure and tested, but acceptance 5, 6 and 7 are only fully true once the workspace wiring above lands. Nothing today calls them.
- The Cursor browser tool could not reach `127.0.0.1:3103`, so the gallery was checked by fetching the served markup instead of by screenshot.

- External account action: none (0B's stand-in PAL and face are an existing, separately-tracked task).
- Ready for review: yes — draft PR #74.
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
