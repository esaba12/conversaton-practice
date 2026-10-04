# POST-01: Verify the workspace polish

Status: planned
Updated: October 3, 2026, 20:00 EDT
Assigned writer: unassigned
Coordinator: Cursor coordinator session
Gate: polish (docs/10, 18–21 hours). Not a new product gate.
Requirements/tests: docs/02 home and persona review. Browser pass of the signed-in workspace.
GitHub issue: not opened
Pull request: not opened. Commit is local on `main`.
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: `main` (one commit ahead of `origin/main`, not pushed)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: 3000
- Owned files: the paths in that commit. Follow-up fixes stay in those files unless a shared contract is actually wrong.
- Shared resources: dev server on port 3000, signed-in browser session. No provider call is required for the layout pass.
- Dependency tasks and contract revisions: none. The commit is the human’s polish.
- Unblock condition: none for verification. Do not treat this as permission to start UX-01, UX-02, or UX-03.

## Scope and acceptance

Outcome: the polish commit is exercised in a browser and either accepted or given a short fix list. The situation leads the practice home. Saved people are shortcuts under that heading. A shared header covers Practice, About me, Your data, and Sign out. Long character fields stay in a collapsed “More about how they talk” section when they already have text.

Non-goals: new presets, a duration picker, captions, appearance, session attribution, hosting, and a name.

The commit already does this:

- `WorkspaceHeader` on practice, About me, Your data, and the person page. The call view passes `quiet`, so only Sign out shows, and Sign out is the workspace handler.
- The situation form renders first. `MyPeople` is passed in as shortcuts titled “Or someone you’ve saved”. A ready list with zero people renders nothing (the old empty-state sentence is gone).
- The person editor puts Practice in the title row. Style, situation knowledge, opening line, and constraints sit in `details`, open on first paint only when one of those three text fields is empty.

- [ ] Signed-in `/practice`: the situation heading is the first content; generating, the roommate example, and manual setup still reach review.
- [ ] With at least one saved person, Practice and Edit work. With none, the shortcut section is absent and Add a person remains reachable from a person route or after a practice.
- [ ] About me, Your data, and a person page show the same header. The current page is indicated. Person pages keep Practice current.
- [ ] During a call the header is quiet. Sign out still runs the workspace teardown path (test-media is enough; do not start Tavus for this).
- [ ] A saved person with style, context, and opening filled shows those fields collapsed. Empty ones start open. Save, chip edit, and click-to-share still work.
- [ ] 390 px and 320 px: no horizontal scroll on `/practice`, a person page, About me, and Your data.

## Contract and documentation changes

- Inputs/outputs/errors and relevant ownership/privacy boundary: none. Header sign-out on non-call pages uses the browser Auth client. Call sign-out stays in `practice-workspace.tsx`.
- Shared change: none.
- Updated specs/setup/API/environment/schema runbooks: after a pass, one line in STATUS. docs/02 home copy can note that saved people sit under the situation field.
- Decision/source: human direction in STATUS, October 3 19:35 EDT, polish before pitch.

## Verification evidence

- Date/time/timezone: October 3, 2026, 20:00 EDT
- Gate and requirement/test IDs: polish
- Mode: not-run
- Outcome: not-run
- Tested commit/dirty state: `8f61d0968e1eba755c79281780f199f7960248f3`
- Environment + working directory: not run
- Exact command or manual steps: not run
- Exit code: not-run
- Observed result/artifact: commit exists; no browser pass is recorded for it
- Limitations: empty-state removal and the collapsed editor are unverified

## Handoff

- Changed paths and commit(s): already in `8f61d09`. This record adds no code.
- Remaining failures/risks: first-time users no longer see “No saved people yet”. Confirm that is the intended home.
- External account action: none
- Next smallest task: browser pass, then STATUS. Band C stays waiting.
- Ready for review: no
- Coordinator integration: pending
