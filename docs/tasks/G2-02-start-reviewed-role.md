# G2-02: Start a live call with the user-reviewed role

Status: ready
Updated: October 3, 2026, 16:40 EDT
Assigned writer: G2-02 background subagent
Coordinator: Cursor coordinator session
Gate: G2
Requirements/tests: G2 start-with-edited-persona, T01 context separation, fresh session (no prior simulated history), T10 idempotency
GitHub issue: [#13](https://github.com/esaba12/conversaton-practice/issues/13)
Pull request: not opened (coordinator integrates on `build/g2-generation`)
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g2-generation` from `main` `1c9506d48996be77188c7512caa071363d598270`, plus the coordinator contract commit recorded in STATUS.
- Branch: `build/g2-generation` (shared checkout; coordinator is the only Git writer)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A (no dev server, build, Playwright, or live provider calls)
- Owned files: `lib/session/server.ts`, `app/api/sessions/route.ts`, `lib/media/tavus.ts` (only if needed), `tests/unit/session-server.test.ts`, `tests/unit/tavus.test.ts` (only if `tavus.ts` changes), this record.
- Shared resources: `lib/schemas/**`, `lib/api/respond.ts` frozen and coordinator-owned. No migrations: the session row stores no role content.
- Dependency tasks and contract revisions: frozen `startRequestSchema` union in `lib/schemas/session.ts` (preset branch or `role: roleContextSchema` branch, both strict); `readBody(request, schema, maxLength)`.
- Unblock condition: none. The current typecheck error at `lib/session/server.ts` (`input.preset`) is expected and is this task's to fix.

## Scope and acceptance

Outcome: `POST /api/sessions` accepts either the roommate preset or a reviewed role and creates the Tavus call with exactly that role's allowlisted context.
Non-goals: UI, generation, persistence of role/goal, provider/PAL changes.

- [ ] Route reads with `readBody(request, startRequestSchema, 8192)`; `requireIdentity()` still precedes body parsing and provider calls.
- [ ] `startSession` resolves the role as `input.role` (already strict-parsed) or the `roommate` fixture for the preset branch; re-parses it with `roleContextSchema` before `createConversation`; never forwards any other client field (goal, notes, ids).
- [ ] Idempotency fingerprint = sha256 over a canonical JSON of `{ durationSeconds, role }` (canonical key order so equal roles hash equally); preset requests hash the fixture role. A replayed key with a different role is rejected by the existing acquire RPC fingerprint check (verify current behavior in `lib/data/sessions.ts`; do not change SQL).
- [ ] Tavus `conversational_context` comes only from `buildRoleContext(role)` and `custom_greeting` from `role.opening`; each call is a new conversation with no prior history (current behavior — keep and assert).
- [ ] Unit tests (mock Tavus/data as existing tests do): reviewed role reaches `createConversation` unchanged; preset still uses fixture; fingerprints differ for different roles and match for key-reordered equal roles; role with extra/private field rejected at schema level; conversation body for a custom role contains its name/publicContext and no `privateNotes`/`goal` text; existing replay/no-blind-retry/cleanup tests still pass.
- [ ] `npm run typecheck` and `npm test` pass for the whole repo except failures in other workers' in-progress files (note them).

## Contract and documentation changes

- Inputs/outputs/errors: `lib/schemas/session.ts` HTTP comment (frozen); no response changes.
- Shared change: none expected.
- Updated specs: coordinator updates docs/05 start row after review.

## Verification evidence

- Not run yet. Writer records typecheck and unit results (unit/mock mode).

## Handoff

- Changed paths and commit(s): pending (coordinator commits)
- Remaining failures/risks: pending
- External account action: none
- Next smallest task: pending
- Ready for review: no
- Coordinator integration: pending
