# G3-03: My people, person page, About me and save after End

Status: ready
Updated: October 3, 2026, 17:20 EDT
Assigned writer: G3-03 background subagent
Coordinator: Cursor coordinator session
Gate: G3
Requirements/tests: G3 acceptance 1–3 (docs/26 UI section); T16 private prep never offered for sharing; keyboard path for sharing
GitHub issue: [#19](https://github.com/esaba12/conversaton-practice/issues/19)
Pull request: not opened (coordinator integrates on `build/g3-people`)
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g3-people` contract commit recorded in STATUS (from `main` `f4b72a3`).
- Branch: `build/g3-people` (shared checkout; coordinator is the only Git writer)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A (no dev server, build, Playwright, live provider or database calls)
- Owned files: `app/practice/practice-workspace.tsx`, `app/practice/people/[id]/page.tsx` + client component(s) beside it, `app/practice/about-me/page.tsx` + client component, `components/presentation/people-*.tsx` and `components/presentation/people.module.css` (new), `components/presentation/setup-*.tsx` (only small changes, e.g. a My people entry), `lib/people/api-client.ts` (new), `lib/session/api-client.ts` (add the saved-person start), `tests/unit/people-api-client.test.ts` (new), `tests/unit/api-client.test.ts`, this record.
- Shared resources (coordinator-owned, frozen): `lib/schemas/**` (`traitOptions`, `traitPhrases`, `roleToPersonFields`, `personToRole`, all people schemas), `proxy.ts`, `app/practice/page.tsx` guard pattern, `scripts/preflight/**`.
- Dependency tasks and contract revisions: HTTP contract at the end of `lib/schemas/people.ts` (routes are being built by G3-01 in parallel; code against the contract and mock `fetch` in tests); saved-person start `{ idempotencyKey, personId, expectedVersion, durationSeconds }` (G3-02).
- Unblock condition: none.

## Scope and acceptance

Outcome: a signed-in user manages About-me facts and saved people, chooses what each person knows by drag and drop or keyboard, keeps private prep visibly separate, practices with a saved person, and can save the setup they just used after End.
Non-goals: server routes, context building, voice/avatar per person, reordering, contacts import.

- [ ] Pages live under `/practice/…` so the existing proxy and the server guard pattern in `app/practice/page.tsx` apply (each new `page.tsx` redirects signed-out users to `/auth/sign-in` the same way). Sign-in stays required.
- [ ] **Home / My people:** the practice setup view shows saved people cards (name, relationship, last updated) with "Practice with <name>" and "Edit", an "About me" link, and the existing "Practice a new conversation" describe flow. Empty state is plain text.
- [ ] **Person page** `/practice/people/[id]` (and `/practice/people/new`): name, relationship; trait chips from `traitOptions` (one value per category, click again to clear; `role="radiogroup"`/`aria-checked` or pressed buttons), challenge and pace; style, what they know about the situation (`publicContext`), opening line, up to five constraints; shows stored values, version and last updated time; Save (PATCH with `expectedVersion`; on 409 tell the user it changed elsewhere and offer reload without discarding their edits), Delete (confirm), "Practice with <name>".
- [ ] **Knows about you:** two columns, About me chips and "Knows about <name>". Native HTML drag and drop moves a chip between them; each chip is also a button: Enter/Space toggles sharing (or a "Share with <name>"/"Stop sharing" action), with an `aria-live` announcement. Each change calls `PUT /api/people/[id]/shared-facts` with the full set and `expectedVersion`, updating the stored version from the response. Nothing is shared by default.
- [ ] **Never shared:** private preparation notes (`GET/PUT /api/private-prep`) sit in a visibly separate section labeled "Never shared", are not chips, not draggable, not drop targets, and never sent to people or session routes. `autoComplete="off"`, `spellCheck={false}`.
- [ ] **About me page** `/practice/about-me`: add (≤120 chars, cap 30 shown), edit, delete facts; explain that facts are shared only with people the user chooses.
- [ ] **Practice with a saved person:** `/practice?person=<id>` (or equivalent) loads the person, shows name/relationship/version and Start; start sends only `{ idempotencyKey, personId, expectedVersion, durationSeconds }`. On 409 VERSION_CONFLICT reload the person and say it changed. The call view, teardown and End behavior stay as today.
- [ ] **After End:** for a generated/manual role, offer "Save this person" (POST `roleToPersonFields(role)`, then link to the new page). If a saved person has the same name (case-insensitive), label it "Update <name>" and PATCH that person with the role fields, keeping its traits and shared facts, using its current version. For a saved-person call, offer "Edit <name>". Dismiss is the default focus. Nothing saves automatically.
- [ ] `lib/people/api-client.ts` wraps every route with Zod-validated responses and the `SessionClientError` type; tests with mocked `fetch` cover each method's path/verb/body (no extra fields, no private prep in people/start bodies) and error parsing (404, 409).
- [ ] Accessible labels on every control, visible focus, works at mobile width; no new dependencies.
- [ ] `npm run typecheck` and `npx vitest run tests/unit/people-api-client.test.ts tests/unit/api-client.test.ts` pass (note failures only in other workers' files).

## Contract and documentation changes

- Inputs/outputs/errors: `lib/schemas/people.ts`, `lib/schemas/session.ts`.
- Shared change: none expected; propose any in the handoff.
- Updated specs: coordinator updates docs/02 after review.

## Verification evidence

Not run yet.

## Handoff

- Changed paths and commit(s): pending
- Remaining failures/risks: pending
- External account action: none
- Next smallest task: pending
- Ready for review: no
- Coordinator integration: pending
