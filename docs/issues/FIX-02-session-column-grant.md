# FIX-02: Limit what signed-in users can read from `practice_sessions`

GitHub issue: [#28](https://github.com/esaba12/conversaton-practice/issues/28)

Who: one coding agent writes the migration and SQL tests. **The coordinator applies the migration** to the shared Supabase project. Priority: medium. Gate: G5 follow-up.
Source: [REV-01](../tasks/REV-01-g5-privacy-review.md) should-fix 2. Requirements: P12, T01/T12 (ownership, minimal metadata).

## Problem

`supabase/migrations/20261003180000_session_foundation.sql` line 48 grants `select` on the **whole** `public.practice_sessions` table to `authenticated`. Owner RLS keeps other users' rows hidden. But a user with their own JWT and the public key can query their own rows directly through PostgREST. They can then read internal columns the app never shows: `provider_conversation_id`, `idempotency_key`, and `request_fingerprint`. There is no practice content in the table, so this is not a blocker.

## What the app actually reads as `authenticated`

- `lib/data/practice-data.ts`: `id, status, cleanup, created_at, ended_at, person_id`; also `cleanup` for counts
- `lib/data/sessions.ts` line 61: `id` filtered by `status`
- `lib/reflection/session.ts` line 12: `id, status`
- `scripts/preflight/auth-database-check.mjs` line 241: `id`

Mutations go through SECURITY DEFINER RPCs owned by `practice_session_executor`. That role has its own table grant (line 49), which this change does not touch.

## Required change

New additive migration, named after the last one, for example `supabase/migrations/20261004000000_session_column_select.sql`:

```sql
begin;
revoke select on public.practice_sessions from authenticated;
grant select (id, owner_id, status, created_at, expires_at, connected_at, ended_at, cleanup, person_id, person_version)
  on public.practice_sessions to authenticated;
commit;
```

Keep `owner_id` in the list because the RLS policy compares it. Confirm the full column list against both session migrations before you finalize. Write a header comment in the style of the existing migrations, and put the one-line rollback in it: `grant select on public.practice_sessions to authenticated;`.

Update the SQL assertion files so they still pass and prove the new boundary:

- `supabase/tests/session_foundation.sql` around line 199 runs `select to_jsonb(s) … from public.practice_sessions s` as `authenticated`. That needs every column and will fail under a column grant. Select only the columns the test needs.
- Check `supabase/tests/session_person.sql` and `supabase/tests/people_sharing.sql` for `select *` or `to_jsonb` on this table as `authenticated`.
- Add assertions: as `authenticated`, selecting `provider_conversation_id`, `idempotency_key`, or `request_fingerprint` raises `42501`. Selecting the granted columns works. `has_column_privilege` matches the list.

## Owned files

- the new migration file
- `supabase/tests/session_foundation.sql`, `supabase/tests/session_person.sql` (only lines that touch this grant)
- `docs/04-DATA-AND-MEMORY.md`: the sentence describing session grants
- `docs/tasks/FIX-02-session-column-grant.md` (new)

## Acceptance

- [ ] Migration and test changes reviewed by the coordinator.
- [ ] Coordinator runs `supabase db push --linked --yes`, then `supabase db query --linked --file supabase/tests/session_foundation.sql`, `…/session_person.sql`, `…/people_sharing.sql`. All pass. Record the output summary, not credentials.
- [ ] After apply, the coordinator re-runs [VERIFY-01](VERIFY-01-regression-on-main.md) (`--g3-ui`, `--g5-ui`) so Your data, session start, and reflection still read what they need.
- [ ] `npm run typecheck` and `npm test` pass (no app code should change).

## Not in scope

Views, changes to RPCs, or deleting session rows. Workers do not run SQL against the linked project.
