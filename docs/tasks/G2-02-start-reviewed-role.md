# G2-02: Start a live call with the user-reviewed role

Status: integrated
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

- [x] Route reads with `readBody(request, startRequestSchema, 8192)`; `requireIdentity()` still precedes body parsing and provider calls.
- [x] `startSession` resolves the role as `input.role` (already strict-parsed) or the `roommate` fixture for the preset branch; re-parses it with `roleContextSchema` before `createConversation`; never forwards any other client field (goal, notes, ids).
- [x] Idempotency fingerprint = sha256 over a canonical JSON of `{ durationSeconds, role }` (canonical key order so equal roles hash equally); preset requests hash the fixture role. A replayed key with a different role is rejected by the existing acquire RPC fingerprint check (verify current behavior in `lib/data/sessions.ts`; do not change SQL).
- [x] Tavus `conversational_context` comes only from `buildRoleContext(role)` and `custom_greeting` from `role.opening`; each call is a new conversation with no prior history (current behavior — keep and assert).
- [x] Unit tests (mock Tavus/data as existing tests do): reviewed role reaches `createConversation` unchanged; preset still uses fixture; fingerprints differ for different roles and match for key-reordered equal roles; role with extra/private field rejected at schema level; conversation body for a custom role contains its name/publicContext and no `privateNotes`/`goal` text; existing replay/no-blind-retry/cleanup tests still pass.
- [x] `npm run typecheck` and `npm test` pass for the whole repo except failures in other workers' in-progress files (note them).

## Contract and documentation changes

- Inputs/outputs/errors: `lib/schemas/session.ts` HTTP comment (frozen); no response changes.
- Shared change: none expected.
- Updated specs: coordinator updates docs/05 start row after review.

## Verification evidence

Mode: unit/mock (Tavus `fetch` and Supabase RPC mocked; no live provider, database, network, build, or browser). Tree: uncommitted changes over `346b61d` on `build/g2-generation`, October 3, 2026 ~16:41 EDT.

- `npx vitest run tests/unit/session-server.test.ts tests/unit/tavus.test.ts`: 2 files, 22/22 tests passed. New cases: reviewed role reaches Tavus as exactly `buildRoleContext(role)` with `custom_greeting = role.opening`, no "Alex", fixed body key set (no history/conversation-reuse fields), and duration 300; private field (`privateNotes`), extra top-level `goal`, and preset+role mixes return 400 before any RPC/provider call; a >2048-char maximal role body is accepted and an 8193-char body rejected; canonical fingerprint (key-reordered equal roles match, different role/duration/constraint order differ, preset hashes the fixture role); `IDEMPOTENCY_CONFLICT` marker maps to 409 with no provider call. Existing replay/no-blind-retry/cleanup/End tests unchanged and passing.
- `npm run typecheck`: the former `lib/session/server.ts` `input.preset` error is fixed. Remaining errors are only in other workers' in-progress files: `app/practice/practice-workspace.tsx(180)` and `tests/unit/api-client.test.ts(15,23,31)` (TS2554, `startSession` call arity in `lib/session/api-client.ts`).
- `npm test`: 46 tests, 43 passed, 3 failed — all three in `tests/unit/api-client.test.ts` (other worker's in-progress `lib/session/api-client.ts`); all other files pass.

## Handoff

- Changed paths and commit(s): `lib/session/server.ts` (role resolution + re-parse, exported `startFingerprint` with a small sorted-key canonicalizer, `createConversation(role, …)`), `app/api/sessions/route.ts` (8192-char body limit), `tests/unit/session-server.test.ts` (5 new tests), this record. `lib/media/tavus.ts` and `tests/unit/tavus.test.ts` unchanged. Uncommitted; coordinator commits.
- Replay behavior (per `lib/data/sessions.ts` and `practice_acquire` SQL, unchanged): same key + same canonical role/duration returns `created: false` → 409 `SESSION_ACTIVE` with that session id and no provider call. Same key + different role (or duration) raises `IDEMPOTENCY_CONFLICT` → 409 `VALIDATION_ERROR` "already used with different settings", no provider call; the client must start with a fresh key. This mapping is mock-tested only; the SQL check itself is covered by `supabase/tests/session_foundation.sql`.
- Remaining failures/risks: (1) A preset request and a role request carrying the exact roommate fixture hash identically, so they are treated as the same start for a reused key — intended (same context reaches the provider). (2) Fingerprint changes from the old `{preset, durationSeconds}` form; any pre-existing in-flight row for a reused key would now conflict, which is harmless since keys are per-attempt UUIDs. (3) Live Tavus behavior with a custom role is unverified (unit/mock only). (4) docs/05 start row still needs the coordinator update.
- External account action: none
- Next smallest task: coordinator integrates after the api-client worker lands; then a live start with a reviewed role per docs/09.
- Ready for review: yes
- Coordinator integration: pending
