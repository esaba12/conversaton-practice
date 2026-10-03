# G3-03: My people, person page, About me and save after End

Status: review
Updated: October 3, 2026, 17:30 EDT
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

Mode: unit (mocked `fetch`) and static (TypeScript). Not browser-checked, not built, no live provider or database calls. Run October 3, 2026, about 17:27 EDT, on `build/g3-people` (base `7bb796b`) with other workers' uncommitted files present.

- `npm run typecheck` (`tsc --noEmit`): passed, 0 errors.
- `npx vitest run tests/unit/people-api-client.test.ts tests/unit/api-client.test.ts`: 2 files, 23 tests passed (10 new people/about-me/private-prep client tests; 13 session/draft client tests including 2 new saved-person start tests).
- `npx vitest run` (whole unit suite, informational): 9 files, 103 tests passed; no failures from other workers' files at that moment.
- Covered by tests: each people/about-me/private-prep method's path, verb and exact body (bodiless GET/DELETE; `{ text }`; person fields only, extra trait keys, goal and private notes dropped; PATCH adds only `expectedVersion`; shared-facts sends the full de-duplicated `factIds` plus `expectedVersion`); request bodies validate against the frozen request schemas; 404 NOT_FOUND, 409 VERSION_CONFLICT and 409 USAGE_LIMIT become `SessionClientError` with code/status; malformed and non-JSON responses become MALFORMED_RESPONSE. Saved-person start body is exactly `{ idempotencyKey, personId, expectedVersion, durationSeconds }` and passes `startRequestSchema`.
- Not covered (needs a browser): drag and drop, keyboard focus after a chip moves, `aria-live` announcements, mobile layout, Dismiss default focus, sign-in redirects on the new pages.

## Handoff

- Changed paths (no commits; coordinator is the Git writer):
  - New: `app/practice/people/[id]/page.tsx`, `app/practice/people/[id]/person-workspace.tsx`, `app/practice/about-me/page.tsx`, `app/practice/about-me/about-me-workspace.tsx`, `components/presentation/people-list.tsx` (MyPeople cards, `PeopleHeader`, `formatUpdated`), `people-start.tsx` (saved-person start card), `people-editor.tsx` (chip editor), `people-sharing.tsx` (Knows about you + Never shared), `people-about-me.tsx`, `people-save.tsx` (after End), `people.module.css`, `lib/people/api-client.ts`, `tests/unit/people-api-client.test.ts`.
  - Modified: `app/practice/practice-workspace.tsx` (My people above the describe flow; `?person=<id>` opens a saved person; a shared `launch` path for role and saved-person starts; VERSION_CONFLICT reloads the person; after End, Save this person / Update <name> / Edit <name> with Dismiss focused; nothing saves automatically; call view, mute, End and teardown unchanged), `lib/session/api-client.ts` (exported `requestJson` generalizing the old `post`, added `startSavedPersonSession`; existing exports unchanged), `components/presentation/setup-describe.tsx` (eyebrow now "Practice a new conversation"), `tests/unit/api-client.test.ts`.
- Behavior notes: pages redirect signed-out users like `app/practice/page.tsx`; `[id]` accepts `new` or a UUID, otherwise `notFound()`. Trait chips are pressed buttons in labelled groups (click again to clear). Sharing chips are buttons with native HTML drag and drop (custom MIME type only, so no text field, including the private notes, accepts a dropped fact); Enter/Space/click toggles; focus follows the moved chip; a `role="status"` line announces each change. Each change PUTs the full set with `expectedVersion` and updates only version/shared IDs, keeping unsaved form edits. Save/share 409 shows a non-destructive message with "Load latest version". Private notes go only to `/api/private-prep`; the G2 describe notes stay browser-only and are never passed to people routes.
- Accessible names for a browser script: home "My people" heading, links "About me" and "Add a person", buttons "Practice with <name>", links "Edit <name>"; person page heading = name, text fields "Name", "Relationship", "How they talk", "What they know about the situation", "Opening line"; chip groups "Tone"/"Formality"/"Talkativeness"/"Familiarity" with buttons "Warm", "Casual", … (`aria-pressed`); buttons "Save" ("Save person" when new), "Load latest version", "Delete <name>" then "Yes, delete"; link "Practice with <name>"; sharing regions "About me" and "Knows about <name>", chips "Share with <name>: <fact>" / "Stop sharing with <name>: <fact>"; "Never shared" heading, textarea "Private preparation notes", button "Save private notes". About me page: input "New fact about you", button "Add fact", per-fact "Edit: <fact>", "Delete: <fact>", "Confirm delete: <fact>", edit input "Edit fact", "Save fact". Saved-person start: heading "Talk with <name>.", button "Start practice". After End: "Dismiss" (focused), "Save this person" or "Update <name>", or link "Edit <name>"; after saving, link "Open <name>".
- Remaining risks: browser behavior unverified (see above). If the people list fails to load after End, "Save this person" stays enabled and could create a duplicate of a same-named person (not destructive). Same-name matching uses the list loaded at End. `/practice?person=` is read once on mount. The practice page's `useSearchParams` relies on the route being dynamic (`force-dynamic` already set); production build not run.
- Proposed shared changes: none required. Optional: coordinator updates docs/02 with the screens above.
- External account action: none
- Next smallest task: coordinator browser check of the flow above against the G3-01 routes.
- Ready for review: yes
- Coordinator integration: pending
