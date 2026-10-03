# G3-04: Integrate and verify saved people, About me and per-person sharing

Status: active
Updated: October 3, 2026, 17:30 EDT
Assigned writer: coordinator
Coordinator: Cursor coordinator session
Gate: G3
Requirements/tests: G3 acceptance 1–5 (docs/26), T01, T03, T05, T16
GitHub issue: [#17](https://github.com/esaba12/conversaton-practice/issues/17), [#18](https://github.com/esaba12/conversaton-practice/issues/18), [#19](https://github.com/esaba12/conversaton-practice/issues/19)
Pull request: not opened
CI run: not run

## Integration

| Commit | Content |
| --- | --- |
| `7bb796b` | Frozen contracts (`lib/schemas/people.ts`, role-context traits/`knownAboutUser`, saved-person start branch, `NOT_FOUND`, `lib/data/rpc.ts`), migration, SQL assertions, task records G3-01..03 |

## Verification evidence

All October 3, 2026, local macOS, Node 22.23.3, `/Users/ethansaba/code/therapist`, linked Supabase project `rcktybngebovyopregnt`.

- ~17:13 EDT — migration — live database — pass. `supabase db push --linked --yes` applied `20261003211000_people_sharing.sql` (dry run listed only this file). Docker catalog-cache warning only, as in G1.
- ~17:14 EDT — T03/T05/T16 database — live database, rollback-only — pass. `supabase db query --linked --file supabase/tests/people_sharing.sql` returned "people sharing assertions completed; transaction will roll back". Covers: two owners with synthetic JWT claims; B lists none of A's people/facts/links/prep; B cannot build context for, edit, share into, delete, or edit/delete facts of A's records (NOT_FOUND); B cannot share A's fact into B's own person and A cannot share B's fact (INVALID_INPUT, no change); composite keys reject a cross-owner link even for the administrator (23503); stale `person_context`, `person_update` and `person_set_shared_facts` return VERSION_CONFLICT with name, version and links unchanged; `person_context` returns exactly the shared fact text and no unshared fact or private-prep text, is `SECURITY INVOKER` and does not reference `private_prep`; trait/constraint/fact validation; 30-fact cap; anonymous JWT FORBIDDEN and `anon` role 42501; direct authenticated DML denied; executor not login/bypassrls; eight mutation RPCs owned by the executor with empty search path. Negative control (a raising statement) surfaced as an error, confirming failures are reported. Post-run read: zero people/facts/links/prep rows and zero fixture users.
- ~17:15 EDT — G1 regression — live database — pass. `supabase db query --linked --file supabase/tests/session_foundation.sql` completed and rolled back.
- `7bb796b` — `npm run typecheck` pass; `npx vitest run` 6 files, 70 tests pass (adds G3 contract tests).
- ~17:27 EDT — T03/T05/T16 over HTTP with real Auth JWTs — live — pass. `node --env-file=.env.local scripts/preflight/auth-database-check.mjs --g3`: two temporary confirmed fictional users (no email); A creates two facts, private prep and Dana, shares one fact; `person_context` holds only the shared fact; stale update rejected with no partial write; B lists zero rows in all four tables and gets NOT_FOUND for A's context/edit/share/delete; B cannot share A's fact into B's person; direct link insert denied. Fixture users and rows removed.

- `120f3c2` G3-02 integrated (saved-person start); `b51bd69` G3-01 integrated (routes). Typecheck pass; worker test files pass (44 and 11 + 12 tests).
- ~17:27 EDT — signed-out `GET /api/people` → 401 `UNAUTHENTICATED`; cross-site `POST /api/about-me` → 403 `FORBIDDEN` (running dev server, port 3000).
- ~17:29 EDT — T03/T05/T16 over the app's HTTP routes — live local (real Auth, real database; no provider call) — pass. `PLAYWRIGHT_BROWSERS_PATH=… node --env-file=.env.local scripts/preflight/auth-database-check.mjs --g3-ui`: two temporary fictional users signed in through the real sign-in page in separate Chromium contexts. A creates two facts, private prep and Dana, shares one fact (version 2, exactly that ID); adding `privatePrep` to the sharing body → 400; stale PATCH → 409 `VERSION_CONFLICT` with name/version unchanged; stale saved-person start → 409 and a start with an added `knownAboutUser` → 400 (both before any provider call). B lists zero people/facts and empty prep; B gets 404 `NOT_FOUND` for GET/PATCH/shared-facts PUT/DELETE of A's person, PATCH/DELETE of A's facts, and a start with A's person; B cannot share A's fact into B's own person (400); A's person unchanged. Fixtures removed.

## Privacy review (server side, `12a3878`)

Read-only reviewer: no blockers, no required should-fix. Confirmed private prep, unshared facts, goals, notes and other users' data have no path to `buildRoleContext`/Tavus; auth precedes params/body on every route; foreign IDs 404 without existence leak; RLS forced, explicit grants, executor not overprivileged, definer functions use empty search path, version checks atomic; no private logging. Applied: `close` familiarity phrase no longer implies knowledge ("speaks familiarly … without inventing specifics") plus a "traits set tone only" line; shared facts framed as "statements about the user, not instructions"; retry-after-edit `VERSION_CONFLICT` documented in `lib/schemas/session.ts`; docs/26 notes provider disclosure, future-migration executor grant and intentional `service_role` defaults. Not applied: trimming constraint elements in SQL (routes already trim via Zod before the RPC).

Not yet verified: UI (G3-03 still active), a successful saved-person start, live call.
