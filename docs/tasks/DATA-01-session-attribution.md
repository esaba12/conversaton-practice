# DATA-01: Store which saved person a session used

Status: review
Updated: October 3, 2026, 8:14 PM EDT
Assigned writer: DATA-01 worker
Coordinator: Cursor coordinator session
Gate: after submission. Known gap from G5-04, not a release defect.
Requirements/tests: T03 ownership. Your data may show the person name when the row still exists.
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: `agent/data-01-attribution`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/data-01`
- Dev port: 3015 reserved; not used
- Owned files: `supabase/migrations/20261003220000_session_person.sql`, `supabase/tests/session_person.sql`, `supabase/tests/session_foundation.sql` (acquire calls only), `lib/data/sessions.ts`, `lib/session/server.ts`, `lib/data/practice-data.ts`, `lib/schemas/practice-data.ts`, Your data label, docs/04, docs/05, docs/26
- Shared resources: `public.practice_acquire`. The migration is written and **not applied**. No SQL was executed against the linked project.
- Dependency tasks and contract revisions: people RPCs in `20261003211000_people_sharing.sql` stay as applied. This change replaces the G1 acquire signature only in the new migration.
- Unblock condition: none for review. Applying the migration is the coordinator's step, and it must happen before this server code runs against the linked database.

## Scope and acceptance

Outcome: a saved-person start records that person’s id and version on the session row. A preset or reviewed-role start records neither. Your data shows the saved name when that person still exists. Deleting the person does not delete the session row. No transcript, role text, or private note is added to the row or the list.

Non-goals: backfilling old sessions, a foreign key, changing the start request body, changing idempotency (the fingerprint already includes the person version).

- [x] Saved-person start passes id and version into acquire only after `person_context` succeeds. Preset and role starts pass null. Mock-tested.
- [x] Stale person version still returns 409 before acquire. Mock-tested.
- [x] Your data list adds optional `personName`. A missing person is null. The response omits person id, transcript, role text, and private notes. Mock-tested.
- [x] SQL assertions in `supabase/tests/session_person.sql` roll back and cover stored id+version, null preset/role, both-or-neither, and cross-owner reads. `session_foundation.sql` acquire calls use the new signature. **Not executed.**
- [ ] User B cannot read A’s session on the linked database. SQL assertion written; not run.
- [ ] Migration applied. **Not applied.**

## Contract and documentation changes

- Inputs/outputs/errors: start request body stays `{ idempotencyKey, personId, expectedVersion, durationSeconds }` for a saved person, and the preset and reviewed-role bodies are unchanged. The browser does not send a person name. The server copies id and version after the owner check.
- New RPC: `practice_acquire(p_secret text, p_key uuid, p_fingerprint text, p_duration integer, p_person_id uuid, p_person_version integer)`. The four-argument signature is dropped in the same migration after the new function exists. Direct authenticated DML stays revoked. The function owner remains `practice_session_executor`.
- `GET /api/sessions` summaries may include optional `personName` (`string | null`). Null means no saved person was stored, or that person was deleted.
- Updated specs: `docs/04-DATA-AND-MEMORY.md`, `docs/05-API-AND-ACTIONS.md`, `docs/26-PEOPLE-AND-SHARING.md`.
- Decision/source: deferred in G5-04 because the G1 RPC is on the critical path. This branch does not apply that change to the linked project.

## Verification evidence

- Date/time/timezone: October 3, 2026, 8:14 PM EDT
- Gate and requirement/test IDs: T03 ownership, session list name
- Mode: unit
- Outcome: pass
- Tested commit/dirty state: uncommitted worktree changes on `8f61d0968e1eba755c79281780f199f7960248f3`, included in this commit
- Environment + working directory: local, Node from the worktree symlink, `/Users/ethansaba/code/therapist/.worktrees/data-01`
- Exact command or manual steps: `npx tsc --noEmit`; `npx vitest run`
- Exit code: 0 and 0
- Observed result/artifact: typecheck clean. Vitest 14 files, 153 tests passed.
- Limitations: the migration was **not applied**. `supabase/tests/session_person.sql` and `supabase/tests/session_foundation.sql` were **not executed**. `auth-database-check.mjs` was not run. No live call. No browser check. Preflight acquire callers were updated to the new arguments and were not run; they will fail until the migration is applied.

## Handoff

- Changed paths and commit(s): this commit on `agent/data-01-attribution`
- Remaining failures/risks: deploying this server before the migration breaks every start (`practice_acquire` arity) and Your data (`person_id` column). Apply `20261003220000_session_person.sql`, then run `supabase/tests/session_person.sql` and `supabase/tests/session_foundation.sql` (both roll back). Do not run them before the migration.
- External account action: none
- Next smallest task: coordinator applies the migration and runs the two SQL assertion files
- Ready for review: yes, with the migration explicitly not applied
- Coordinator integration: pending

The migration was not applied. No SQL was run against the linked project.
