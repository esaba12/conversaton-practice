# M1: Person situations and practice history metadata

Status: ready for coordinator review; not applied
Updated: October 3, 2026, 11:59 PM EDT
Assigned writer: M1 worker
Coordinator: parent coordinator session
Gate: Phase 1 contract migration
Requirements/tests: docs/next/03-CONTRACTS.md §2.5; W10 `hasPracticed` and practice history

## Assignment and isolation

- Base ref + full SHA: `main` `5d718ce0dc16c6892c1dadabd9b1756695d959ae`
- Branch: `agent/m1-person-situations`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/m1`
- Owned files: `supabase/migrations/20261004010000_person_situations.sql`, `supabase/tests/person_situations.sql`, compatibility assertions in the three existing SQL tests, and this record
- Shared resource: linked Supabase project. It was not contacted. The migration is **not applied**; the coordinator applies it.

## Scope and acceptance

The migration:

- Adds required `people.background` (1–600), backfilled from `left(public_context, 600)`.
- Keeps old person create/update calls valid through a trailing optional `p_background`; create falls back to the first 600 characters of `p_public_context`, and update preserves the stored background when omitted/null.
- Adds owner-only `person_situations`, capped at five per person under a lock on the person row. Situation create/delete never updates `people.version`.
- Adds `background` to `person_context`, without reading private prep.
- Adds `practice_data_delete_all()` and explicitly includes situations; session metadata remains.
- Adds `practice_sessions.kind` and `preset`, extends the FIX-02 column-level read grant, and stores both through `practice_acquire`.
- Adds `practice_history()` returning the signed-in owner's ended normal-practice history.

## Function contracts and grants

Changed signatures:

- `person_create(text, text, jsonb, text, text, text, jsonb, text, text)` → `person_create(text, text, jsonb, text, text, text, jsonb, text, text, text default null)`; trailing name `p_background`.
- `person_update(uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text)` → `person_update(uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text, text default null)`; trailing name `p_background`.
- `practice_acquire(text, uuid, text, integer, uuid, integer)` → `practice_acquire(text, uuid, text, integer, uuid, integer, text default 'practice', text default null)`; trailing names `p_kind`, `p_preset`.
- `person_context(uuid, integer)` keeps its signature; its JSON result adds `background`.

New RPCs and return shapes:

- `person_situation_list(p_person_id uuid)` → JSON array, newest first, maximum five; each object has `id`, `person_id`, `label`, `situation`, `created_at`, `updated_at`.
- `person_situation_create(p_person_id uuid, p_label text, p_situation jsonb)` → the created object; `LIMIT_REACHED` at five (mapped by `lib/data/rpc.ts` to 409 `USAGE_LIMIT`).
- `person_situation_delete(p_id uuid)` → `{ "deleted": true }`; another owner's or absent id is `NOT_FOUND`.
- `practice_data_delete_all()` → `{ deleted: { person_situations, people, about_me_facts, private_prep } }`.
- `practice_history()` → `{ person_ids: string[], presets: ("roommate"|"professor"|"decline"|"manager")[] }`; only `status = 'ended'` and `kind = 'practice'`.

`authenticated` receives execute only on all public RPCs above. Situation table SELECT is owner-RLS-scoped; direct INSERT/UPDATE/DELETE remains revoked. Situation mutations and bulk delete are `SECURITY DEFINER`, `search_path = ''`, owned by restricted `people_executor`; `practice_acquire` remains owned by `practice_session_executor`. `authenticated` gains column SELECT on `practice_sessions.kind` and `preset`, not table-level SELECT.

## Application follow-up

Phase 1C:

- Add `background` to `lib/schemas/people.ts`.
- In `lib/data/people.ts`, add `background` to `PERSON_COLUMNS`, map the returned field, and send `p_background`.
- In `lib/data/person-context.ts`, accept returned `background` and map it into the role identity.
- Situations routes call exactly:
  - list: `person_situation_list({ p_person_id: personId })`
  - create: `person_situation_create({ p_person_id: personId, p_label: label, p_situation: situation })`
  - delete: `person_situation_delete({ p_id: situationId })`

Phase 1G:

- Extend `lib/data/sessions.ts#acquire` to send `p_kind` (`"practice"` or `"stand_in"`) and `p_preset` (preset id or null). Existing six-parameter SQL callers remain valid.
- Saved-person normal starts use `p_kind: "practice", p_preset: null`; preset normal starts use `p_kind: "practice", p_preset: preset`; stand-in starts use `p_kind: "stand_in"` and their resolved preset or null.
- `hasPracticed` and `GET /api/practice-history` call `practice_history()` with no parameters. `person_ids` drives saved-person `hasPracticed`; `presets` drives `{ practicedPresets }`.

Existing call sites checked:

- `lib/data/people.ts`: named old person create/update arguments remain valid due the default.
- `lib/data/person-context.ts`: RPC parameters remain `{ p_id, p_expected_version }`; parser must gain `background` before deployment.
- `lib/data/sessions.ts`: named six acquire arguments remain valid due defaults.
- `lib/session/server.ts`: reaches acquire through `lib/data/sessions.ts`; Phase 1G must supply kind/preset.
- `scripts/preflight/auth-database-check.mjs`, `scripts/preflight/g5-checks.mjs`, `supabase/tests/session_foundation.sql`, `supabase/tests/session_person.sql`, and `supabase/tests/people_sharing.sql`: old argument lists remain callable. Their static signature/column/function-count assertions were updated where M1 changes the expected catalog.

## Verification evidence

- Mode: static review only.
- Checked migration ordering, function identity signatures, restricted owners, `search_path = ''`, grants/revokes, error markers, existing named callers, and rolled-back SQL coverage.
- `git diff --check` passed.
- SQL was not executed. No Supabase command, remote database connection, provider call, or environment-file read was made.

## Handoff

- Coordinator applies the migration and runs `person_situations.sql`, then re-runs `people_sharing.sql`, `session_person.sql`, and `session_foundation.sql`.
- For a pre-apply rollback-only check, concatenate one outer `begin;`, the migration body, and the test body without its own `begin;`, ending with the test's `rollback;`.
- The compatibility test can prove the old-argument create fallback after M1. A true pre-existing-row backfill assertion requires seeding a row before the migration body; static review confirms the backfill statement.
- Not applied; coordinator applies.
