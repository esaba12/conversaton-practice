# 0C: Practice flow state machine refactor (W1)

Status: ready
Updated: October 3, 2026, 22:45 EDT
Assigned writer: 0C worker subagent (claude-opus-5-thinking-high)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 0
Requirements/tests: docs/next/04-NEW-SPECS.md W1; docs/30 step 1 (private state clear)
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/44
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` at the C0 contract commit (exact SHA in STATUS.md "Wow pass"); record it here when you start.
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

- [ ] `lib/practice/flow.ts`: pure reducer with stages `lobby → briefing → meet → green → ringing → call → recap` plus `retry-ringing → retry-call → retry-recap`; events `pickPerson`, `pickSomeoneNew`, `draftReady`, `toGreenRoom`, `ready`, `sessionAccepted`, `videoPlaying`, `ended`, `retryAccepted`, `back`, `signOut`, `authLost`, `pageHide`. Each transition declares teardown (`releaseMic`, `endSession`) as data.
- [ ] Today's screens map onto stages (describe/review/person → briefing/meet; call → ringing/call; reflection/save after End → recap). Stages with no screen yet are reachable only in reducer tests.
- [ ] `lib/practice/private-state.ts`: browser-memory holder for goal, hard-moment line, prediction and likelihoods with one `clear()` called on new setup, sign-out, auth loss and page hide.
- [ ] Extract the remote `<video>` rendering (today `StreamVideo` inside the workspace) into `components/practice/remote-media.tsx` with no behavior change, so 0D can own it.
- [ ] Reducer unit tests cover every transition, including illegal ones (for example `ready` from `lobby` is ignored); teardown flags asserted for leave-from-green, cancel-from-ringing, end-from-call, sign-out and page hide in every stage; private state cleared on the four events.
- [ ] All existing unit tests pass unchanged; `npm run typecheck` passes. (Coordinator runs `npm run build` and `npm run test:ui` at integration; do not use port 3100.)
- [ ] No private field (goal, hard-moment line, notes, fear, likelihoods) is added to any request body.

## Contract and documentation changes

- After 0C merges, `practice-workspace.tsx` and `lib/practice/flow.ts` become coordinator-owned integration entrypoints (02-BUILD-PLAN §0). Document the stage component props in this record so Phase 1 workers can build against them.
- Shared change: none expected; propose in Handoff.
- Updated specs: propose docs/03 architecture note via Handoff.

## Verification evidence

(worker fills in)

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- External account action: none
- Next smallest task:
- Ready for review:
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
