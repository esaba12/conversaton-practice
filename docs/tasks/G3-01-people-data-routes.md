# G3-01: About-me, people and shared-facts data and routes

Status: ready
Updated: October 3, 2026, 17:20 EDT
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

Not run yet.

## Handoff

- Changed paths and commit(s): pending
- Remaining failures/risks: pending
- External account action: none
- Next smallest task: pending
- Ready for review: no
- Coordinator integration: pending
