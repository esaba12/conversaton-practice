# VERIFY-01: Re-run the full automated regression on current `main`

GitHub issue: [#30](https://github.com/esaba12/conversaton-practice/issues/30)

Who: coordinator, or one agent explicitly assigned by the coordinator. It uses the shared Supabase project and port 3000. Priority: high. Run it now, and again after FIX-01–03 merge and the FIX-02 migration is applied.

## Why

The last real-Auth browser checks (`auth-database-check.mjs --g3-ui` and `--g5-ui`) passed at ~19:16 EDT ([G5-04](../tasks/G5-04-integration.md)). These changes were merged afterward:

- the landing page and sign-in page (UI-01)
- the three example setups (UX-01)
- the 3- or 5-minute choice (UX-02)
- captions (UX-03)
- session attribution (DATA-01)

They changed `/`, `/auth/sign-in`, `/practice`, and the start request, and the scripts drive those pages. CI on `223e87a` covers typecheck, unit, build, and the mocked browser suite only.

## Steps

Run from a clean checkout of `main` at the SHA you record. Use the repository's Node: `node_modules/.bin/node` (22.x).

1. `npm run typecheck && npm test && npm run build`
2. Nothing else may be listening on port 3100. Then run `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npm run test:ui`.
3. Start the app on port 3000 from this checkout: `npm run dev -- --port 3000`. If the human already has a dev server on 3000, ask before stopping it, or confirm it serves this SHA.
4. `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node_modules/.bin/node --env-file=.env.local scripts/preflight/auth-database-check.mjs --g3-ui`
5. Same command with `--g5-ui`.
6. Read-only SQL assertions (they roll back their fixtures): `supabase db query --linked --file supabase/tests/session_foundation.sql`, then `session_person.sql` and `people_sharing.sql`.

Steps 4–6 need network access to Supabase, and step 4 shells out to `supabase projects api-keys`. None of them calls Tavus or OpenAI. Confirm that the scripts removed their fixture users.

## Handling failures

- **Script drift** means the UI legitimately changed (new label, new duration step, landing redirect). Fix only `scripts/preflight/auth-database-check.mjs` or `g5-checks.mjs`, and only with coordinator assignment, because these are coordinator-owned paths. Do not weaken an assertion to make it pass. Say exactly what changed.
- **A product defect** gets a new file in `docs/issues/` with reproduction steps using fictional fixtures. Do not fix it inside this task.

## Owned files

- `docs/tasks/VERIFY-01-regression-on-main.md` (new): one evidence entry per step, with SHA, command, exit code, and PASS lines summarized
- `scripts/preflight/*.mjs` only for assigned script-drift fixes

## Acceptance

- [ ] All six steps pass on a recorded SHA, or each failure is classified and filed.
- [ ] No Tavus or OpenAI call was made. No fixture users remain.
- [ ] Coordinator records the result in STATUS.md.
