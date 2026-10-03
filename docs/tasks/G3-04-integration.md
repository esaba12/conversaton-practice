# G3-04: Integrate and verify saved people, About me and per-person sharing

Status: integrated — accepted on automated evidence by user decision (19:00); live G3 call not verified
Updated: October 3, 2026, 19:02 EDT
Assigned writer: coordinator
Coordinator: Cursor coordinator session
Gate: G3
Requirements/tests: G3 acceptance 1–5 (docs/26), T01, T03, T05, T16
GitHub issue: [#17](https://github.com/esaba12/conversaton-practice/issues/17), [#18](https://github.com/esaba12/conversaton-practice/issues/18), [#19](https://github.com/esaba12/conversaton-practice/issues/19)
Pull request: [#20](https://github.com/esaba12/conversaton-practice/pull/20) (draft)
CI run: [run 37155697794](https://github.com/esaba12/conversaton-practice/actions/runs/37155697794) pass (typecheck/unit/build/browser)

## Integration

| Commit | Content |
| --- | --- |
| `7bb796b` | Frozen contracts (`lib/schemas/people.ts`, role-context traits/`knownAboutUser`, saved-person start branch, `NOT_FOUND`, `lib/data/rpc.ts`), migration, SQL assertions, task records G3-01..03 |
| `120f3c2` | [G3-02](G3-02-start-saved-person.md) saved-person start |
| `b51bd69` | [G3-01](G3-01-people-data-routes.md) routes |
| `12a3878`, `71e837d` | Two-session HTTP check; privacy-review follow-ups |
| `1133e16` | [G3-03](G3-03-people-ui.md) UI |

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

## UI integration (G3-03, `1133e16`)

Coordinator added the provider disclosure to the sharing hint ("Shared facts are sent to the video call provider as part of this character's setup when you practice") and updated one G3-02 test for the new familiarity wording.

- ~17:36 EDT — `npm run typecheck` pass; `npm test` 9 files, 103 tests pass; `npm run build` pass (Next 16.3.8; new dynamic routes `/practice/about-me`, `/practice/people/[id]` and six API routes).
- ~17:38 EDT — `auth-database-check.mjs --g3-ui` with UI steps — live local (real Auth, real database, Chromium; start request intercepted in the browser, no provider call) — pass after one script-timing fix (first run read the stored person while the page still showed "Saving…"; screenshot inspected; not a UI defect). Verified: About me add; keyboard share (focus chip, Enter) moves it into "Knows about Dana"; native drag-and-drop shares a fact and drags it back out; stored `sharedFactIds` equal exactly the two chosen facts; Formality chip Formal → Casual + Save stores `casual` with a version bump; "Never shared" notes show the stored prep and are not a chip or draggable; `/practice?person=<id>` Start sends exactly `durationSeconds, expectedVersion, idempotencyKey, personId` with the current version and no fact/prep text; user B's `/practice/people/<A's id>` shows "Person not found." and none of A's data. Screenshots at ignored `artifacts/local/g3-person.png` and `g3-foreign.png`.
- ~17:39 EDT — G2 regression `auth-database-check.mjs --ui-only` — pass (describe → mocked draft → edit → start body only the edited role; sign-out and denied re-entry).
- ~17:40 EDT — browser suite against the running dev server (temporary uncommitted config pointing at port 3000) — 8 passed, 1 production-only skipped.
- ~17:40 EDT — signed-out `/practice/about-me`, `/practice/people/new`, `/practice/people/<uuid>` → 307 to `/auth/sign-in`.

Not yet verified (needs the human live call): a successful saved-person start with Tavus; the counterpart using the shared fact and not knowing the unshared fact or private prep; visible behavior change after a chip edit; "Save this person / Update" after a real End; screen-reader announcement quality and mobile layout of the new pages.

## Human live G3 checklist

1. Sign in at http://127.0.0.1:3000 → About me → add two facts, one distinctive (for example "I just adopted a greyhound named Pixel") and one you will not share (for example "I'm training for a marathon").
2. Practice a new conversation (generate any setup) → Start → a short exchange → End → **Save this person**.
3. Open the person → drag the greyhound fact into "Knows about <name>" (or select it and press Enter); leave the marathon fact; type something distinctive into "Never shared" and save it.
4. Practice with <name> → ask "What do you know about me?" and "Any plans this weekend?" → the character may mention the dog; it should not know the marathon or the private note → End.
5. Change Formality (for example Formal → Casual) → Save → practice again → note the tone difference and that the character does not remember the previous call → End.
6. Report: shared fact used? unshared fact or private note surfaced? tone change visible? Save/Update after End worked? mic released?

## Gate decision (October 3, 19:00 EDT)

The user decided to stop waiting on human live checks ("do it as automated or unit testing where you can … I'll verify myself when I want to"). G3 advances on the automated evidence above, and PR #20 is merged. **Live G3 is not verified.** That covers a saved-person Tavus start, the counterpart using only shared facts, a tone change after a chip edit, and Save after a real End.

Partial human use observed read-only, not a gate check: ~18:48–18:52 EDT the user added About-me facts, generated a setup, started and ended two real calls (cleanup handled by End), saved a person from the call and edited its chips. The dev-server log showed no share request; the user reported being unable to assign facts. Their page rendered the sharing section correctly when inspected in the Cursor browser (no clicks made). The likely cause is that drag-and-drop doesn't work in the embedded browser. The hint now leads with click (`7852d23`), and "About me" is in the practice header (`57bf297`).
