# G3 handoff — October 3, 2026, 17:45 EDT

Read this after AGENTS.md and STATUS.md when starting a fresh coordinator context. It records where G3 stands and what comes next.

## Where things are

- **G1 and G2 passed** and are merged to `main`.
- **G3 is built and integrated, but not passed.** Branch `build/g3-people` at `0ca75ec`, draft [PR #20](https://github.com/esaba12/conversaton-practice/pull/20). CI [run 37155697794](https://github.com/esaba12/conversaton-practice/actions/runs/37155697794) passes. Issues [#17](https://github.com/esaba12/conversaton-practice/issues/17), [#18](https://github.com/esaba12/conversaton-practice/issues/18) and [#19](https://github.com/esaba12/conversaton-practice/issues/19) stay open until the human live call passes.
- **The G3 migration is already applied** to linked Supabase project `rcktybngebovyopregnt` (`20261003211000_people_sharing.sql`). Do not re-apply or edit it. Any later change is a new additive migration.
- **Evidence and the human checklist:** [G3-04](tasks/G3-04-integration.md). Design and "As built" differences: [docs/26](26-PEOPLE-AND-SHARING.md).
- **The dev server may still be running** at http://127.0.0.1:3000. Restart it with `npm run dev -- --port 3000` if not.

## What G3 does

| Area | Where |
| --- | --- |
| Frozen contracts | `lib/schemas/people.ts` (shapes and the HTTP contract comment), `lib/schemas/role-context.ts` (`traitChipsSchema`, `buildRoleContext(role, { traits, knownAboutUser })`), the saved-person branch in `lib/schemas/session.ts` |
| Database | Four owner-RLS tables (`about_me_facts`, `people`, `person_shared_facts`, `private_prep`). Signed-in users can only read. Writes go through version-checked RPCs owned by the restricted `people_executor` role. `person_context` is the only path that reads counterpart context, and it never reads private prep. |
| Routes | `/api/about-me`, `/api/people`, `/api/people/[id]/shared-facts`, `/api/private-prep`; `POST /api/sessions` with `{ personId, expectedVersion }` |
| UI | My people cards on `/practice`; `/practice/people/[id]` (chips, sharing columns, "Never shared"); `/practice/about-me`; Save / Update / Edit offered after End |
| Checks | `supabase/tests/people_sharing.sql`. `scripts/preflight/auth-database-check.mjs` has three modes: `--g3` (real tokens), `--g3-ui` (two signed-in browser sessions) and `--ui-only` (G2 regression). |

## Immediate next steps

1. **Human live G3 call.** Use the checklist in G3-04. Record exactly what the human reports, mode live, without itemizing anything they didn't itemize. Corroborate it read-only in the database: the session rows have `ended` status and cleanup `confirmed`, and no transcript or role text is stored.
2. **If it passes:** mark G3 passed in G3-04 and STATUS, take PR #20 out of draft, merge it after CI, and close #17–#19. **If it fails:** fix the smallest cause on `build/g3-people`, re-run the relevant checks, and ask again.
3. **Then G4**, per docs/10 (10–14 hours section), on a new branch from `main`. Gate G4: the end-to-end flow closes with a short optional reflection.
   - Reflection stays separate from the live character. It uses a server-only structured-output model with Zod validation, and the model ID comes from configuration.
   - Deletion and session cleanup report truthful provider status.
   - Optional: a user-written reflection instead of a generated one.
   - Reflection-generated memory proposals are optional and never write automatically.
   - The appearance-preset catalog (docs/00) stays unbuilt unless time remains after G4 and G5.
4. **Then G5 evaluation**, including the carried items below. Then demo and submission prep: docs/11, plus Prompt B in docs/25. The submission target is **October 4, 11:30 AM America/Detroit**.

## Carried items (G5 or later)

- G1 residual paths: lease/auth expiry teardown, 180 s auto-end, End with the server unreachable, the camera preview toggle.
- G2: an explicit private-note probe on a live call, a live out-of-scope check, and a per-user draft rate limit.
- G3: session `person_id`/`person_version` attribution, a mobile and screen-reader walkthrough of the new pages, and the risk that Save after End duplicates a same-named person if the people list failed to load.

## Working pattern (unchanged from docs/24)

The coordinator freezes contracts first: `lib/schemas/**`, migrations it applies itself, and SQL assertions. It writes `docs/tasks/<id>.md` records from TEMPLATE, opens GitHub issues, and commits on a new branch. Then it dispatches up to three background workers on disjoint owned paths, plus an optional read-only reviewer. Workers do not build, run Playwright, call live providers or write Git. The coordinator integrates one worker at a time, then runs:

```sh
npm run typecheck && npm test && npm run build
# browser suite against the running dev server (Next 16 refuses a second dev server in one directory):
sed -e 's/3100/3000/g' -e 's/webServer: {[^}]*},//' playwright.config.ts > playwright.tmp.config.ts && PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright test -c playwright.tmp.config.ts; rm -f playwright.tmp.config.ts
PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node_modules/.bin/node --env-file=.env.local scripts/preflight/auth-database-check.mjs --g3-ui
```

- Shell sandbox: localhost HTTP, Playwright, `gh`, `git push`, `supabase db push` and `supabase db query --linked` all need the `all` permission.
- `supabase db query` reports a failed assertion as an error payload, and the command still exits 0. Read the output.
- Never stage `next-env.d.ts`, `.env.local`, or `artifacts/`. Other agents may leave uncommitted docs. Preserve them and commit them separately; never revert them.

## Paste-ready prompt

```text
Continue as coordinator in /Users/ethansaba/code/therapist. Read AGENTS.md,
STATUS.md and docs/27-G3-HANDOFF.md first, then docs/26 and
docs/tasks/G3-04-integration.md. G1 and G2 are passed and merged. G3 is
built, integrated and CI-green on build/g3-people (draft PR #20); its
migration is already applied, so do not re-apply or edit it.

Step 1: I will report my live G3 call (checklist in G3-04). Record exactly
what I report, corroborate read-only in the database, then either mark G3
passed (G3-04, STATUS), merge PR #20 after CI and close #17-#19, or fix
the smallest failing cause and ask me again.

Step 2: build G4 at full speed with the same pattern (docs/27 "Working
pattern"): freeze contracts, write docs/tasks/G4-* from TEMPLATE, open
issues, commit on a new branch from main, dispatch up to three background
workers on disjoint paths plus an optional read-only privacy reviewer.
Workers: no build, no Playwright, no live provider calls, no git writes.
Integrate one at a time, run the verification recipe, update docs and
STATUS, push a PR, then ask me for the live G4 check. Then G5 and demo
prep. Keep sign-in required, private notes out of counterpart context,
sessions fresh, no automatic memory writes, and record only checks
actually run. Submission target: Oct 4, 11:30 AM America/Detroit.
```
