# POST-01: Browser pass of the workspace polish and the post-gate UI

GitHub issue: [#31](https://github.com/esaba12/conversaton-practice/issues/31)

Who: one agent with a browser (Playwright CLI or the IDE browser). Priority: medium. Start after VERIFY-01 is done with port 3000.
Existing record to update: [docs/tasks/POST-01-workspace-polish.md](../tasks/POST-01-workspace-polish.md). Its SHAs and "not pushed" notes are stale: the polish commit `8f61d09` is an ancestor of `main`, and `main` is pushed.

## Why

The polish commit is merged but no one ever ran it in a browser. It covers the situation-first home, the shared header, saved people as shortcuts, and the collapsed person-editor fields. The later presets, duration choice, and captions changed the same pages.

## Setup

- `main` at a recorded SHA. Dev server on port 3000: `npm run dev -- --port 3000`.
- Sign in with a **fictional throwaway** account. If the IDE browser is already signed in to the human's demo account, use fictional data only and never use Delete all on it.
- To test the call screen without starting Tavus, use the dev-only test-media seam (`window.__practiceTestMediaController`; see `scripts/preflight/g5-checks.mjs` for how it is injected). The screen must show the test-mode label. Never start a real call for this task.

## Acceptance

From the existing record:

- [ ] Signed-in `/practice`: the situation heading is the first content. Generating (stop before a real model call if no key is wanted, or let one call happen only with coordinator approval), an example, and manual setup each reach review.
- [ ] With one saved person, Practice and Edit work. With none, the shortcut section is absent, and adding a person is still reachable.
- [ ] Practice, About me, Your data, and a person page share the header, and the current page is indicated.
- [ ] During a test-media call the header is quiet, and Sign out runs the workspace teardown (session ends as `auth_loss`; re-entry requires sign-in).
- [ ] A saved person with style, context, and opening filled shows them collapsed under "More about how they talk". Empty ones start open. Save, chip edit, and click-to-share still work.
- [ ] At 390 px and 320 px there is no horizontal scroll on `/practice`, a person page, About me, and Your data.

Added for the post-gate merges:

- [ ] Three examples (Alex, Ellis, Sam) open a labeled review without generation.
- [ ] Review offers 3 and 5 minutes with 3 as the default. The choice is in the start request.
- [ ] Captions start collapsed in a test-media call and expand on request.
- [ ] Signed-in `/` shows the home links. Signed-out `/` shows the landing.

## Output

Update the existing record: set status to `review`, refresh the base SHA, and add evidence with mode `mock` for test-media steps and `live` only for real sign-in/navigation. Keep screenshots under ignored `artifacts/local/`. List any defects as a short fix list, each with a page, viewport, and reproduction. Fix only small layout defects inside the polish commit's files. Anything larger becomes a new `docs/issues/` file.

One question for the human goes in the handoff: first-time users no longer see "No saved people yet". Is that intended?
