# G3-02: Start a practice with a saved person

Status: review
Updated: October 3, 2026, 17:21 EDT
Assigned writer: G3-02 background subagent
Coordinator: Cursor coordinator session
Gate: G3
Requirements/tests: G3 acceptance 2, 3, 4, 5 (docs/26); T01 context separation, T16 per-person sharing, T03, T05, fresh session
GitHub issue: [#18](https://github.com/esaba12/conversaton-practice/issues/18)
Pull request: not opened (coordinator integrates on `build/g3-people`)
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g3-people` contract commit recorded in STATUS (from `main` `f4b72a3`).
- Branch: `build/g3-people` (shared checkout; coordinator is the only Git writer)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A (no dev server, build, Playwright, live provider or database calls)
- Owned files: `lib/data/person-context.ts` (new), `lib/session/server.ts`, `app/api/sessions/route.ts` (only if needed), `lib/media/tavus.ts`, `tests/unit/session-server.test.ts`, `tests/unit/tavus.test.ts`, `tests/unit/person-context.test.ts` (new), this record.
- Shared resources (coordinator-owned, frozen): `lib/schemas/**` (including `buildRoleContext(role, extras)` and `roleExtrasSchema`), `lib/data/rpc.ts`, `lib/data/sessions.ts`, `lib/api/respond.ts`, the applied migration.
- Dependency tasks and contract revisions: third `startRequestSchema` branch `{ idempotencyKey, personId, expectedVersion, durationSeconds }`; RPC `person_context(p_id uuid, p_expected_version integer)` returns `{ id, version, name, relationship, traits, style, public_context, opening, constraints, challenge, pace, known_about_user: string[] }` and raises NOT_FOUND / VERSION_CONFLICT / FORBIDDEN (it runs as the caller under owner RLS and never reads `private_prep` or unshared facts); `personToRole()` in `lib/schemas/people.ts`.
- Unblock condition: none. `lib/session/server.ts` currently has a fail-closed `personId` guard (404) that this task replaces.

## Scope and acceptance

Outcome: `POST /api/sessions` with a saved person creates a fresh Tavus call whose context holds that person's fields, traits and exactly the About-me facts shared with that person.
Non-goals: UI, people CRUD routes, migrations, session-row attribution (`person_id` on sessions is deferred).

- [x] `lib/data/person-context.ts` exports `loadPersonContext(db, personId, expectedVersion)` → `{ role: RoleContext, extras: { traits, knownAboutUser }, version }`, calling `rpc(db, "person_context", …)`, Zod-validating the JSON (unknown keys rejected), and building the role with `personToRole`. Malformed output → `storageUnavailable()`.
- [x] `startSession` handles the person branch before `sessions.acquire`: NOT_FOUND → 404 and VERSION_CONFLICT → 409 with no lease and no provider call. Preset and reviewed-role branches behave exactly as before.
- [x] Idempotency fingerprint for the person branch is the keyed HMAC over canonical `{ durationSeconds, role, extras, personId, version }`; preset/role fingerprints stay byte-identical to today (existing tests unchanged).
- [x] `createConversation(role, duration, extras?)` / `conversationBody(role, duration, extras?)` pass extras to `buildRoleContext(role, extras)`; `custom_greeting` stays `role.opening`; every start remains a new conversation with no history fields.
- [x] Tests (mock Supabase RPC and Tavus `fetch` as existing tests do): the Tavus body for a saved person contains the shared fact text and trait phrase; it never contains an unshared fact marker or a private-prep marker even when the mock database also holds them (simulate by asserting the builder only receives `known_about_user`); a stale version yields 409 with zero RPC acquire and zero provider calls; another owner's ID (NOT_FOUND) yields 404 likewise; a start body adding `knownAboutUser`, `role` or `privatePrep` to the person branch is rejected 400; malformed `person_context` output yields 503 without a provider call; two starts with changed traits produce different contexts (fresh, no prior history).
- [x] `npm run typecheck` and `npx vitest run tests/unit/session-server.test.ts tests/unit/tavus.test.ts tests/unit/person-context.test.ts tests/unit/contracts.test.ts` pass (note failures only in other workers' files).

## Contract and documentation changes

- Inputs/outputs/errors: `lib/schemas/session.ts` HTTP comment (frozen). Context framing: `buildRoleContext` in `lib/schemas/role-context.ts`.
- Shared change: none expected; propose any in the handoff.
- Updated specs: coordinator updates docs/05 start row and docs/07 context note after review.

## Verification evidence

Mode: unit/mock only (mocked Supabase RPC client and Tavus `fetch`). No live database, provider, build, dev server or browser run. October 3, 2026, ~17:21 EDT.

- `npm run typecheck`: passed (0 errors).
- `npx vitest run tests/unit/session-server.test.ts tests/unit/tavus.test.ts tests/unit/person-context.test.ts tests/unit/contracts.test.ts`: 4 files, 44/44 passed (session-server 23, tavus 5, person-context 4, contracts 12). All pre-existing preset/reviewed-role tests, including the fingerprint tests, pass unchanged.
- Covered: shared fact text and trait phrase in the Tavus body, and the body equals `buildRoleContext(personToRole(…), { traits, knownAboutUser })`; unshared-fact and private-prep markers held by other mock RPCs never appear, and the only RPCs called are `person_context`, `practice_acquire`, `practice_bind` in that order; stale version gives 409 VERSION_CONFLICT and a foreign/missing ID gives 404 NOT_FOUND with zero acquire and zero provider calls; `knownAboutUser`, `role`, `privatePrep` or `preset` added to the person body give 400 with no RPC; extra-key, missing, out-of-range, ID-mismatch or version-mismatch `person_context` output gives 503 without leaking content and without acquire/provider calls; two starts with edited traits produce different contexts and fingerprints and the same history-free body keys; preset body is identical with and without empty extras.
- Not verified: `person_context` against the real database (owner RLS, shared-fact ordering), a live Tavus call using a saved person.

## Handoff

- Changed paths and commit(s): `lib/data/person-context.ts` (new), `lib/session/server.ts`, `lib/media/tavus.ts`, `tests/unit/person-context.test.ts` (new), `tests/unit/session-server.test.ts`, `tests/unit/tavus.test.ts`, this record. `app/api/sessions/route.ts` unchanged. No commits (coordinator is the Git writer).
- Fingerprint: `startFingerprint(role, duration, secret, person?)` HMACs canonical `{ durationSeconds, role, ...person }` where `person = { extras, personId, version }`; omitted for preset/role, so those hashes are byte-identical.
- Loader also rejects output whose `id`/`version` differs from the request (503), as a defensive check on the RPC.
- Shared changes proposed: none required. Optional: `FORBIDDEN` from `person_context` maps to 401 via `lib/data/rpc.ts`, which is consistent with other G3 RPCs.
- Remaining failures/risks: a concurrent person edit between `person_context` and the provider call is not locked (start uses the version read at that moment, which is the intended snapshot); a replayed idempotency key after the person's version changes now fails 409 VERSION_CONFLICT before acquire rather than SESSION_ACTIVE, so the client should reload the person on that error. Live RLS/DB behavior unverified.
- External account action: none
- Next smallest task: coordinator integration, then a live start with a saved person against the applied migration; docs/05 start row and docs/07 context note.
- Ready for review: yes
- Coordinator integration: pending
