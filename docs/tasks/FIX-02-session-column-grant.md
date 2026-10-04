# FIX-02: Limit what signed-in users can read from practice_sessions

Status: integrated
Coordinator, October 3, 2026, 21:30 EDT: merged as `b9f68c1` (PR #39, CI verify pass). Migration applied with `supabase db push --linked --yes`. `session_foundation.sql`, `session_person.sql`, and `people_sharing.sql` each returned their completion line and rolled back. Docker catalog-cache warning only.
Updated: October 3, 2026, 8:52 PM EDT
Assigned writer: FIX-02 worker
Coordinator: Cursor coordinator session
Gate: G5 follow-up
Requirements/tests: P12, T01/T12 (ownership, minimal metadata). SQL assertions written; not executed.
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/28
Pull request: https://github.com/esaba12/conversaton-practice/pull/39
CI run: verify pass, https://github.com/esaba12/conversaton-practice/actions/runs/37168061814

## Assignment and isolation

- Base ref + full SHA: `main` `df60345ae2ad9ffdfa8e5bfbc2c32191ec6613e8`
- Branch: `agent/fix-02`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/fix-02`
- Dev port: N/A
- Owned files: `supabase/migrations/20261004000000_session_column_select.sql`, `supabase/tests/session_foundation.sql`, `supabase/tests/session_person.sql`, `docs/04-DATA-AND-MEMORY.md`, this record
- Shared resources: linked Supabase project. Migration is written and **not applied**. No SQL was executed against the linked project.
- Dependency tasks and contract revisions: session columns from `20261003180000_session_foundation.sql` and `20261003220000_session_person.sql`. `practice_session_executor` grants are unchanged.
- Unblock condition: none for review. Applying the migration and running the three SQL files is the coordinator's step.

## Scope and acceptance

Outcome: `authenticated` no longer has table-level `select` on `public.practice_sessions`. It may select `id`, `owner_id`, `status`, `created_at`, `expires_at`, `connected_at`, `ended_at`, `cleanup`, `person_id`, and `person_version`. It cannot select `idempotency_key`, `request_fingerprint`, or `provider_conversation_id`. Those ten columns are every column on the table except those three.

Non-goals: applying the migration, views, RPC changes, deleting session rows, app code. `people_sharing.sql` does not read `practice_sessions`.

- [x] Migration revokes table-level `select` from `authenticated` and grants the ten columns. Static review of both session migrations. **Not applied.**
- [x] SQL assertions reject the three hidden columns with `42501`, select the granted columns, and check `has_column_privilege`. **Not executed.**
- [ ] Coordinator runs `supabase db push --linked --yes`, then `supabase db query --linked --file` on `session_foundation.sql`, `session_person.sql`, and `people_sharing.sql`.
- [ ] After apply, coordinator re-runs VERIFY-01 (`--g3-ui`, `--g5-ui`).
- [x] `npm run typecheck` and `npm test` pass. No app code change.

## Contract and documentation changes

- Inputs/outputs/errors and relevant ownership/privacy boundary: direct PostgREST reads as `authenticated` can return only the granted columns. Owner RLS is unchanged. Hidden columns remain on the row for `practice_session_executor` RPCs. App reads already use granted columns only: `id, status, cleanup, created_at, ended_at, person_id` and `cleanup` (`lib/data/practice-data.ts`), `id` filtered by `status` (`lib/data/sessions.ts`), `id, status` (`lib/reflection/session.ts`), and `id` (`scripts/preflight/auth-database-check.mjs`).
- Shared change: new migration. Coordinator applies it. No dependency manifest change.
- Updated specs: `docs/04-DATA-AND-MEMORY.md` session-grant sentence. The October 3 pass of the two session SQL files predates these edits.
- Decision/source: REV-01 should-fix 2. Issue #28.

## Verification evidence

- Date/time/timezone: October 3, 2026, 8:52 PM EDT
- Gate and requirement/test IDs: G5 follow-up; P12, T01/T12
- Mode: static
- Outcome: pass
- Tested commit/dirty state: uncommitted worktree changes on `df60345ae2ad9ffdfa8e5bfbc2c32191ec6613e8`, included in this commit
- Environment + working directory: local, Node v20.19.4, `/Users/ethansaba/code/therapist/.worktrees/fix-02`
- Exact command or manual steps: `npm run typecheck`
- Exit code: 0
- Observed result/artifact: `tsc --noEmit` completed with no errors
- Limitations: does not apply or execute SQL

- Date/time/timezone: October 3, 2026, 8:52 PM EDT
- Gate and requirement/test IDs: G5 follow-up; P12, T01/T12
- Mode: unit
- Outcome: pass
- Tested commit/dirty state: uncommitted worktree changes on `df60345ae2ad9ffdfa8e5bfbc2c32191ec6613e8`, included in this commit
- Environment + working directory: local, Node v20.19.4, Vitest 4.1.11, `/Users/ethansaba/code/therapist/.worktrees/fix-02`
- Exact command or manual steps: `npm test` (`vitest run`)
- Exit code: 0
- Observed result/artifact: 15 files, 157 tests passed
- Limitations: unit tests do not cover the migration. SQL files were not run.

- Date/time/timezone: October 3, 2026, 8:52 PM EDT
- Gate and requirement/test IDs: P12, T01/T12
- Mode: not-run
- Outcome: not-run
- Tested commit/dirty state: uncommitted worktree changes on `df60345ae2ad9ffdfa8e5bfbc2c32191ec6613e8`
- Environment + working directory: linked Supabase project, not used
- Exact command or manual steps: not run. Coordinator applies `20261004000000_session_column_select.sql`, then runs the three SQL files with `supabase db query --linked --file`.
- Exit code: not-run
- Observed result/artifact: none
- Limitations: column grants, `42501` on the hidden columns, and the existing session assertions are unverified on the database

## Handoff

- Changed paths and commit(s): this commit on `agent/fix-02`
- Remaining failures/risks: migration is not applied, so signed-in users can still read the three columns on their own rows. `SELECT` with no granted column (`select 1`, `count(*)`) now needs a granted column for `authenticated`; the two session SQL files were updated for that. `practice_acquire` and the other session RPCs still return the full row, including the three columns, to a caller who has the server capability. A direct table read does not. Rollback is `grant select on public.practice_sessions to authenticated;`.
- External account action: coordinator applies the migration and runs the three SQL files. Do not run the SQL files before the migration.
- Next smallest task: coordinator applies `20261004000000_session_column_select.sql`, runs `session_foundation.sql`, `session_person.sql`, and `people_sharing.sql`, then re-runs VERIFY-01
- Ready for review: yes, with the migration explicitly not applied
- Coordinator integration: pending

The migration was not applied. No SQL was run against the linked project.
