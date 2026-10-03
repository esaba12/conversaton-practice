# G2-03: Describe, generate, review/edit, then start

Status: ready
Updated: October 3, 2026, 16:40 EDT
Assigned writer: G2-03 background subagent
Coordinator: Cursor coordinator session
Gate: G2
Requirements/tests: G2 editable setup acceptance, docs/02 Prepare + Persona review, T01 (private notes labeled and never sent to start), T13 (auth loss clears transient private content)
GitHub issue: [#14](https://github.com/esaba12/conversaton-practice/issues/14)
Pull request: not opened (coordinator integrates on `build/g2-generation`)
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g2-generation` from `main` `1c9506d48996be77188c7512caa071363d598270`, plus the coordinator contract commit recorded in STATUS.
- Branch: `build/g2-generation` (shared checkout; coordinator is the only Git writer)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A (no dev server, build, Playwright, or live provider calls)
- Owned files: `components/presentation/setup-*.tsx` and `components/presentation/setup.module.css` (new), `app/practice/practice-workspace.tsx`, `lib/session/api-client.ts`, `tests/unit/api-client.test.ts`, this record.
- Shared resources: `lib/schemas/**` frozen; `components/presentation/practice.tsx` and `app/design-preview/**` are not owned — keep `PracticeSetup`/`PracticeCall` exports working (design preview imports them). Browser tests under `tests/browser/**` are coordinator-owned; list selectors/text you changed in the handoff so the coordinator can update them.
- Dependency tasks and contract revisions: frozen `draftRequestSchema`/`draftResponseSchema` (`lib/schemas/draft.ts`), `startRequestSchema` role branch (`lib/schemas/session.ts`), `OUT_OF_SCOPE` error code. Server route `POST /api/scenarios/draft` is built in parallel by G2-01; code against the schema.
- Unblock condition: none.

## Scope and acceptance

Outcome: a signed-in user describes a situation, gets an editable generated setup, reviews/edits it, and starts the live call with that exact role.
Non-goals: saved personas/profiles (G3), reflection, presets beyond one optional roommate example shortcut.

- [ ] `api-client.ts`: add `generateDraft(input: DraftRequest): Promise<DraftResponse>` using the existing `post` helper and `draftResponseSchema`; change `startSession` to take `{ role: RoleContext, durationSeconds, idempotencyKey? }` and send `{ idempotencyKey, role, durationSeconds }` only (no goal, no notes). Unit tests for both, including that the start body has exactly those keys and that private notes are never in it.
- [ ] Describe step (`setup-describe.tsx`, pure props): situation textarea (required, max 1000, counter), "What do you want to say or do?" (optional, max 200), "Private preparation notes" (optional, max 1000) labeled "Never shared with the character". Generate button; generating state with `aria-busy`/status text; an "Enter setup manually" link.
- [ ] Review step (`setup-review.tsx`, pure props, controlled fields): name, role, style, "What this character knows" (publicContext), opening line, constraints (up to 5, add/remove), challenge (supportive/neutral/mild pushback), pace (patient/conversational), goal (shown as "Your goal — not shared with the character"), assumptions listed read-only for review. Field limits mirror `roleContextSchema`; Start disabled until the role parses with `roleContextSchema`. "Back"/"Regenerate" keep inputs. Private notes are not shown in or copied to any role field.
- [ ] Manual fallback: on generation failure (network/503/malformed) keep all inputs, show the message and a "Set up manually" action that opens the same review form with empty/neutral fields, visibly labeled "Manual setup — not generated". `OUT_OF_SCOPE` shows the server message plus a suggestion to describe an everyday conversation; no manual bypass prompt for that case beyond the normal manual link.
- [ ] Workspace: replace the fixed roommate/GOAL with the reviewed role + goal state; `PracticeCall` gets the reviewed name and goal. Start calls `startSession({ role, durationSeconds })`. Each Start uses a fresh idempotency key and a fresh call (no history). "Back to setup" after End returns to review with the same role (edit or start again). Auth loss/sign-out clears situation, notes, draft and goal state. Keep all existing teardown logic intact.
- [ ] Accessibility: labels for every field, keyboard-only flow, visible focus, status regions for generating/errors, mobile layout readable. Warm minimal style per docs/02 (reuse existing CSS variables).
- [ ] `npm run typecheck` (excluding other workers' in-progress files) and `npx vitest run tests/unit/api-client.test.ts` pass.

## Contract and documentation changes

- Inputs/outputs/errors: frozen schemas only.
- Shared change: none expected; list browser-test selector changes in the handoff.
- Updated specs: coordinator updates docs/02 if behavior differs.

## Verification evidence

- Not run yet. Writer records typecheck/unit results. Browser checks are coordinator-only.

## Handoff

- Changed paths and commit(s): pending (coordinator commits)
- Remaining failures/risks: pending
- External account action: none
- Next smallest task: pending
- Ready for review: no
- Coordinator integration: pending
