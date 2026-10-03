# G3-01: About-me, people and shared-facts data and routes

Status: integrated
Updated: October 3, 2026, 17:23 EDT
Assigned writer: G3-01 background subagent
Coordinator: Cursor coordinator session
Gate: G3
Requirements/tests: G3 acceptance 1, 4, 5 (docs/26); T03 ownership, T05 stale version, T16 private prep not shareable
GitHub issue: [#17](https://github.com/esaba12/conversaton-practice/issues/17)
Pull request: not opened (coordinator integrates on `build/g3-people`)
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g3-people` contract commit recorded in STATUS (from `main` `f4b72a3`).
- Branch: `build/g3-people` (shared checkout; coordinator is the only Git writer)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A (no dev server, build, Playwright, live provider or database calls)
- Owned files: `lib/data/people.ts` (new), `app/api/about-me/route.ts`, `app/api/about-me/[id]/route.ts`, `app/api/people/route.ts`, `app/api/people/[id]/route.ts`, `app/api/people/[id]/shared-facts/route.ts`, `app/api/private-prep/route.ts` (all new), `tests/unit/people-routes.test.ts` (new), this record.
- Shared resources (coordinator-owned, frozen; propose changes in handoff): `lib/schemas/**`, `lib/data/rpc.ts`, `lib/api/respond.ts`, `lib/auth/server.ts`, the applied migration `supabase/migrations/20261003211000_people_sharing.sql`.
- Dependency tasks and contract revisions: `lib/schemas/people.ts` (shapes and the HTTP contract comment at its end), `lib/data/rpc.ts` (`rpc()` maps P0001 markers to AppError), migration RPCs listed below.
- Unblock condition: none.

## Scope and acceptance

All items below are met in unit/mock mode (see Verification evidence); boxes left for the coordinator to tick on review.

Outcome: signed-in users can list/create/edit/delete their About-me facts and saved people, replace which facts a person knows, and read/write their private prep, all owner-scoped.
Non-goals: UI, session start, context building, migrations.

- [ ] Every handler uses `handle(request, …)`, calls `requireIdentity()` before reading the body or params, reads bodies with `readBody(request, schema, limit)` using the limits in the `people.ts` contract comment, and validates `[id]` with `parseId`. Next 16 route params are a Promise (`{ params }: { params: Promise<{ id: string }> }`); check `node_modules/next/dist/docs/` for the route handler signature.
- [ ] Writes go only through RPCs via `rpc(db, name, args)` from `lib/data/rpc.ts`: `about_me_create(p_text)`, `about_me_update(p_id, p_text)`, `about_me_delete(p_id)`, `person_create(p_name, p_relationship, p_traits, p_style, p_public_context, p_opening, p_constraints, p_challenge, p_pace)`, `person_update(p_id, p_expected_version, …same fields)`, `person_delete(p_id)`, `person_set_shared_facts(p_id, p_expected_version, p_fact_ids)`, `private_prep_put(p_notes)`. Never direct table DML (it is revoked).
- [ ] Reads use owner-RLS selects with the request client (`db.from("about_me_facts" | "people" | "person_shared_facts" | "private_prep")`), with an explicit column list. A person's `sharedFactIds` come from `person_shared_facts` (ordered by `created_at`). GET of another owner's person returns 404 NOT_FOUND (RLS returns no row).
- [ ] Map snake_case rows (`public_context`, `created_at`, `shared_fact_ids`, …) to the camelCase response schemas and validate every response with its Zod schema (`aboutMeFactSchema`, `personSchema`, `privatePrepSchema`); a malformed row becomes the `storageUnavailable()` 503, never a raw error.
- [ ] Error mapping per contract: NOT_FOUND 404, VERSION_CONFLICT 409, LIMIT_REACHED → USAGE_LIMIT 409, INVALID_INPUT → 400 (includes unknown/foreign fact IDs in shared-facts PUT). Private prep has no route that links it to a person; the shared-facts route accepts only `factIds` UUIDs.
- [ ] Unit tests with a mocked `requireIdentity`/Supabase client (follow `tests/unit/session-server.test.ts` mocking style): 401 before body parsing on every route; strict body rejection (extra fields such as `privateNotes`, `ownerId`, chip values outside the enums); correct RPC name/args (trimmed values, `p_traits` as an object, `p_constraints` as an array); marker mapping (NOT_FOUND→404, VERSION_CONFLICT→409, LIMIT_REACHED→409 USAGE_LIMIT, INVALID_INPUT→400); response shapes validated; private-prep PUT never mentions any person.
- [ ] `npm run typecheck` and `npx vitest run tests/unit/people-routes.test.ts tests/unit/contracts.test.ts` pass (note failures only in other workers' in-progress files).

## Contract and documentation changes

- Inputs/outputs/errors: `lib/schemas/people.ts` HTTP contract (frozen). Database behavior: migration header and `supabase/tests/people_sharing.sql`.
- Shared change: none expected; propose any in the handoff.
- Updated specs: coordinator updates docs/05 after review.

## Verification evidence

Mode: unit/mock only (mocked `requireIdentity`, mocked Supabase `rpc` and a recording chainable `from` builder). No database, provider, build, dev server or browser was used. October 3, 2026, ~17:22 EDT, base `7bb796b` plus uncommitted G3-01 files.

- `npm run typecheck` — pass (no errors).
- `npx vitest run tests/unit/people-routes.test.ts tests/unit/contracts.test.ts` — 2 files, 23 tests passed (people-routes 11, contracts 12). No failures from other workers' files in this run.

What the 11 route tests cover:
- 401 on all 12 handlers before the body or `[id]` param is read (`request.bodyUsed` stays false, invalid id ignored), no RPC or table query.
- 400 for strict-body violations (`ownerId`, `privateNotes`, `sharedFactIds` on PATCH, `personId` on private prep, unknown chip key/value, non-string chip, >5 constraints, missing/zero `expectedVersion`, non-UUID or duplicate or object `factIds`, oversized bodies, invalid ids); 403 cross-origin; no storage call.
- Exact RPC names/args: trimmed text, `p_traits` as an object, `p_constraints` as an array, `p_expected_version`, `p_fact_ids` as UUIDs only; private prep sends only `p_notes`.
- Reads: explicit column lists, oldest-first facts, people by `updated_at desc`, links ordered by `created_at` and grouped per person; missing person row → 404.
- Markers: NOT_FOUND→404, VERSION_CONFLICT→409, LIMIT_REACHED→409 USAGE_LIMIT, INVALID_INPUT→400 VALIDATION_ERROR.
- Malformed rows (bad chip, bad timestamp, `deleted: false`, non-UUID link), PostgREST errors and thrown RPC errors → sanitized 503 with no raw text.
- Every response parsed with its `people.ts` response schema in the tests.

Not verified: real PostgREST behavior (query-builder chaining, `maybeSingle`, `uuid[]` binding of `p_fact_ids`, timestamp format) against the applied migration; two-user isolation is enforced by RLS/RPCs and is covered only by the coordinator's SQL assertions, not by these mocks.

## Handoff

- Changed paths and commit(s): `lib/data/people.ts`, `app/api/about-me/route.ts`, `app/api/about-me/[id]/route.ts`, `app/api/people/route.ts`, `app/api/people/[id]/route.ts`, `app/api/people/[id]/shared-facts/route.ts`, `app/api/private-prep/route.ts`, `tests/unit/people-routes.test.ts`, this record. Uncommitted (coordinator is the only Git writer).
- Behavior notes: timestamps are normalized to `toISOString()` (millisecond `Z` form) like `lib/data/sessions.ts`. Link reads for the people list are chunked 25 people per query so 50 people × 30 facts stays under PostgREST's default 1000-row cap. List reads also `limit` to the schema caps (30 facts, 50 people). Responses are validated with `safeParse`; any mismatch is the `storageUnavailable()` 503.
- Shared change proposals: none required. Optional: `rpc.ts` and `people.ts` each build a 404 NOT_FOUND `AppError`; exporting a `notFound()` helper from `rpc.ts` would remove the duplicate message string.
- Remaining failures/risks: the live read path is unverified (see above). `GET /api/people/[id]` and the list do two reads (person, then links) without a transaction, so a concurrent share change can briefly return links newer than `version`; the next PUT still version-checks. `about_me_delete`/`about_me_update` bump linked people's versions, so a UI holding a person's version must reload after editing facts.
- External account action: none
- Next smallest task: coordinator integration, then a live two-user check through these routes (preflight script) against the applied migration.
- Ready for review: yes
- Coordinator integration: integrated on `build/g3-people`; see [G3-04](G3-04-integration.md).
