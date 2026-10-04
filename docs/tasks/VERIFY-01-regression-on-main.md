# VERIFY-01: Re-run the auth and database regression on current main

Status: blocked
Updated: October 4, 2026, 10:10 AM America/Detroit
Assigned writer: coordinator
Coordinator: cloud coordinator session
Gate: submission morning
Requirements/tests: docs/issues/VERIFY-01-regression-on-main.md steps 4–6 (auth-database scripts and SQL). Steps 1–2 are the CI recipe.
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/30
Pull request: not opened for a script run (nothing was executed)
CI run: not a substitute. See limitations.

## Assignment and isolation

- Base ref + full SHA: `main` `91ba25e`
- Branch: `cursor/status-after-docs-3689` (this record only)
- Worktree: cloud checkout of `esaba12/conversaton-practice`
- Dev port: not started
- Owned files: this record, STATUS.md
- Shared resources: Supabase project `rcktybngebovyopregnt` (not reachable from this checkout)
- Dependency tasks and contract revisions: none
- Unblock condition: a checkout with `.env.local` and a logged-in Supabase CLI for project `rcktybngebovyopregnt`

## Scope and acceptance

Outcome: record that the auth/database scripts were not re-run, and why. Do not close issue #30.

- [ ] `auth-database-check.mjs --g3-ui` on a recorded SHA
- [ ] `auth-database-check.mjs --g5-ui` on that SHA
- [ ] `session_foundation.sql`, `session_person.sql`, and `people_sharing.sql` roll back cleanly
- [x] No Tavus or OpenAI call was made. No fixture users were created by this attempt.

## Verification evidence

- Date/time/timezone: October 4, 2026, 10:10 AM America/Detroit
- Gate and requirement/test IDs: VERIFY-01 steps 4–6
- Mode: not-run
- Outcome: blocked
- Tested commit/dirty state: `main` `91ba25e` (docs only on top of `75f9c7d`)
- Environment + working directory: cloud agent checkout. `node` v22.14.0. No `node_modules`. No `.env.local`. `supabase` and `vercel` are not on `PATH`. No `SUPABASE_*`, `TAVUS_*`, `ELEVENLABS_*`, or `OPENAI_*` variables in the environment. Playwright browsers are not installed at `$HOME/Library/Caches/ms-playwright`.
- Exact command or manual steps: looked for `.env.local`, the Supabase CLI, and provider environment names. Did not start the app, did not call `supabase db query`, and did not run `auth-database-check.mjs`.
- Exit code: not-run
- Observed result/artifact: none
- Limitations: the last note on issue #30 (owner, Oct 4 ~03:25) says the auth-database scripts were not re-run that night, and the SQL suites had last passed after M23 (~02:00). That is still the latest database evidence. CI on [PR #94](https://github.com/esaba12/conversaton-practice/actions/runs/37207371897) and [PR #95](https://github.com/esaba12/conversaton-practice/actions/runs/37207440488) re-ran typecheck, 786 unit tests, build, the client-bundle check, and Playwright (11 passed / 3 skipped). Those runs do not include `--g3-ui`, `--g5-ui`, or the SQL files, and the hero-path tests skipped because CI has no service-role key.

## Handoff

- Changed paths and commit(s): this record and the STATUS top section
- Remaining failures/risks: owner isolation, sharing, and the post-redesign pages have not been re-checked with the real-Auth scripts since the wow-pass UI landed
- External account action: on a machine that already has `.env.local` and `supabase` logged in, run the commands in docs/issues/VERIFY-01-regression-on-main.md steps 4–6. Do not paste keys into chat.
- Next smallest task: owner live call and Devpost submission. Regression when a credentialed checkout is available.
- Ready for review: yes as a blocked record. Not a pass.
- Coordinator integration: pending
