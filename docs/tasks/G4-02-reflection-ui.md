# G4-02: Reflection after End in the practice workspace

Status: ready
Updated: October 3, 2026, 17:50 EDT
Assigned writer: G4-02 background subagent
Coordinator: Cursor cloud coordinator session
Gate: G4
Requirements/tests: P08 reflection (optional, skippable, no score); docs/02 "Reflection"; T01/T14 (transcript stays in memory, cleared on leave/sign-out)
GitHub issue: not opened (coordinator GitHub access is read-only for issues)
Pull request: coordinator integrates on `cursor/g4-reflection-9fec`
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `cursor/g4-reflection-9fec` contract commit recorded in STATUS (from `build/g3-people` `6930688`).
- Branch: `cursor/g4-reflection-9fec` (shared checkout; coordinator is the only Git writer)
- Worktree: `/workspace` (cloud VM)
- Dev port: N/A. No dev server, build, Playwright, live provider, database or Git writes.
- Owned files: `app/practice/practice-workspace.tsx`, `components/presentation/reflection-panel.tsx` (new), `components/presentation/reflection.module.css` (new), `lib/reflection/api-client.ts` (new), `tests/unit/reflection-api-client.test.ts` (new), this record.
- Shared resources (coordinator-owned, frozen): `lib/schemas/**`, `lib/media/daily-controller.ts` (already emits `{ type: "utterance", speaker, text }`), `lib/session/api-client.ts`, other presentation components (reuse, do not edit; propose changes).
- Dependency tasks and contract revisions: frozen `lib/schemas/reflection.ts` (`appendTurn`, `reflectRequestSchema`, `reflectResponseSchema`, HTTP contract), `utterance` media event in `lib/schemas/media.ts`. G4-01 implements the route in parallel; code against the contract only.
- Unblock condition: none.

## Scope and acceptance

Outcome: after a call ends, the user sees an optional "Reflect" step next to the existing Save/Update offer. They can skip it, write their own takeaway, and/or ask for a short generated reflection.
Non-goals: storing reflections or transcripts, memory proposals, editing people from the reflection, the "Your data" page (G4-03).

- [ ] The workspace accumulates `utterance` events for the current attempt only, using `appendTurn` (bounded), in a ref or state tied to the attempt. It is reset when a new call starts, and cleared on Back to setup, on Done/Skip, on sign-out or auth loss, on `pagehide`, and in the existing bfcache `pageshow` clear. The workspace never logs it.
- [ ] After `phase === "ended"` or `"interrupted"` (session ID known), render `ReflectionPanel` below the call: heading "Reflect (optional)", a self-reflection textarea (≤ 1,000 chars, label like "What did you notice? (optional, not saved)", `autoComplete="off"`), a "Get a short reflection" button, and "Skip". The panel says plainly that the reflection uses what was said in the call (the provider's transcription) and that nothing is saved.
- [ ] "Get a short reflection" posts `{ turns, goal?, selfReflection? }` via `lib/reflection/api-client.ts` to `POST /api/sessions/{id}/reflect`. `goal` is the call's goal from `callInfo.goal` when non-empty (a saved-person call has none). Never send private notes, role, About-me facts or person data. While pending, the button is disabled with "Reflecting…"; double-clicks send one request.
- [ ] Result display: "What you did" (observedAction), "Takeaway", "Next time" (nextStep), each shown only when non-null; evidence label "Based on part of the conversation" for `partial` and an "insufficient" message ("There wasn't enough of the conversation to reflect on. Your own notes above still count.") when `insufficient`. If `supportExit`, show only a calm message that practice has stopped and point to real-world support (e.g. "If you're in immediate danger, call 911. In the US you can call or text 988 to reach the Suicide & Crisis Lifeline."), no feedback.
- [ ] Errors: REFLECTION_UNAVAILABLE / network → "The reflection couldn't be generated. Your own notes still count." with a retry button; USAGE_LIMIT → no retry; SESSION_ACTIVE / NOT_FOUND → short message. The user's typed self-reflection is kept on error. No score, grade or rating anywhere.
- [ ] If there are zero captured user turns, still allow the request (the server returns insufficient) but show a hint that no speech was captured.
- [ ] Add a "Your data" link to `/practice/data` in the workspace header next to existing links (G4-03 builds that page).
- [ ] Accessibility: panel is a labelled `section`, results announced with `aria-live="polite"`, keyboard reachable, focus not stolen from the Save offer. Matches existing CSS module conventions and tokens in `components/presentation/*.module.css`.
- [ ] Unit tests for `lib/reflection/api-client.ts` following `tests/unit/api-client.test.ts`: request path/method/body shape (only `turns`, optional `goal`, optional `selfReflection`), same-origin JSON, response validated with `reflectResponseSchema`, error envelope mapped, malformed response rejected.
- [ ] `npm run typecheck` and `npx vitest run tests/unit/reflection-api-client.test.ts tests/unit/api-client.test.ts` pass.

## Contract and documentation changes

- Inputs/outputs: `lib/schemas/reflection.ts` (frozen).
- Shared change: none expected; propose any in the handoff.
- Updated specs: coordinator updates docs/02 after review.

## Verification evidence

Not run yet.

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- External account action: none
- Next smallest task: coordinator integration and browser check with the reflect route intercepted.
- Ready for review:
- Coordinator integration: pending
