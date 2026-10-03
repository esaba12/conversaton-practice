# G3-02: Start a practice with a saved person

Status: ready
Updated: October 3, 2026, 17:20 EDT
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

- [ ] `lib/data/person-context.ts` exports `loadPersonContext(db, personId, expectedVersion)` → `{ role: RoleContext, extras: { traits, knownAboutUser }, version }`, calling `rpc(db, "person_context", …)`, Zod-validating the JSON (unknown keys rejected), and building the role with `personToRole`. Malformed output → `storageUnavailable()`.
- [ ] `startSession` handles the person branch before `sessions.acquire`: NOT_FOUND → 404 and VERSION_CONFLICT → 409 with no lease and no provider call. Preset and reviewed-role branches behave exactly as before.
- [ ] Idempotency fingerprint for the person branch is the keyed HMAC over canonical `{ durationSeconds, role, extras, personId, version }`; preset/role fingerprints stay byte-identical to today (existing tests unchanged).
- [ ] `createConversation(role, duration, extras?)` / `conversationBody(role, duration, extras?)` pass extras to `buildRoleContext(role, extras)`; `custom_greeting` stays `role.opening`; every start remains a new conversation with no history fields.
- [ ] Tests (mock Supabase RPC and Tavus `fetch` as existing tests do): the Tavus body for a saved person contains the shared fact text and trait phrase; it never contains an unshared fact marker or a private-prep marker even when the mock database also holds them (simulate by asserting the builder only receives `known_about_user`); a stale version yields 409 with zero RPC acquire and zero provider calls; another owner's ID (NOT_FOUND) yields 404 likewise; a start body adding `knownAboutUser`, `role` or `privatePrep` to the person branch is rejected 400; malformed `person_context` output yields 503 without a provider call; two starts with changed traits produce different contexts (fresh, no prior history).
- [ ] `npm run typecheck` and `npx vitest run tests/unit/session-server.test.ts tests/unit/tavus.test.ts tests/unit/person-context.test.ts tests/unit/contracts.test.ts` pass (note failures only in other workers' files).

## Contract and documentation changes

- Inputs/outputs/errors: `lib/schemas/session.ts` HTTP comment (frozen). Context framing: `buildRoleContext` in `lib/schemas/role-context.ts`.
- Shared change: none expected; propose any in the handoff.
- Updated specs: coordinator updates docs/05 start row and docs/07 context note after review.

## Verification evidence

Not run yet.

## Handoff

- Changed paths and commit(s): pending
- Remaining failures/risks: pending
- External account action: none
- Next smallest task: pending
- Ready for review: no
- Coordinator integration: pending
