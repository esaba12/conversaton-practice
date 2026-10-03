# G5-02: Practice workspace hardening (test media seam, duplicate save, draft limit message)

Status: active
Updated: October 3, 2026, 19:15 EDT
Assigned writer: background subagent (G5-02)
Coordinator: Cursor coordinator session
Gate: G5
Requirements/tests: T09, T13, T14, T15; docs/28 G5 items 2, 3, 5, 6 (workspace parts)
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/23
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g5-hardening` from `main` `03fdde1`, plus uncommitted frozen contract `lib/media/controller-factory.ts`.
- Branch / worktree: `build/g5-hardening`, `/Users/ethansaba/code/therapist` (shared checkout, disjoint paths)
- Owned files: `app/practice/practice-workspace.tsx`, `components/presentation/people-save.tsx`, `components/presentation/practice.tsx`, `components/presentation/practice.module.css`, this record.
- Shared resources: none. No build, Playwright, provider calls or Git writes.
- Dependency: frozen `selectMediaController()` and `TEST_MEDIA_GLOBAL` (do not edit `lib/**`).

## Scope and acceptance

Outcome: the coordinator's real-Auth browser script can drive the real workspace through a fake media controller (dev only, visibly labelled), and two G3 carry-overs are fixed.
Non-goals: new features, refactoring the workspace beyond what's needed.

- [ ] **Test media seam.** Replace the direct `createDailyController` call with `selectMediaController()`, chosen once per mount (e.g. `useState(() => selectMediaController())` or a ref, client side only). When `testMode` is true, the call view shows a visible, persistent notice: "Test media — no live call" (exact text; the coordinator's script asserts it). Production behavior unchanged.
- [ ] **Stable selectors the script relies on (keep or add):** header "Sign out" button; "End practice" button; status text that includes "Time’s up" on auto-end, "couldn’t reach the server" when End is unreachable; "Retry closing session" button; "Back to setup"; Reflection panel "Get a short reflection", "Skip"/"Done". Don't rename existing labels.
- [ ] **Duplicate same-named person on Save (G3 carry).** If the people list is `error` (not just `loading`), Save must not create blindly: on Save, re-fetch the list (`listPeople`) first and use the fresh list for the same-name match; if the re-fetch fails, show an error and save nothing. `ready` on `SaveAfterEnd` stays false while loading. Mid-save state stays correct.
- [ ] **Draft rate limit message.** In `generate()`, `USAGE_LIMIT` shows the server's message (not the generic failure) and does not offer endless retry wording; the manual setup path stays available.
- [ ] **A11y of the call and save panel (T13/T14).** Check: the call phase/status message is in a live region announced once (not on every elapsed-second tick); the elapsed timer isn't a chatty live region; focus moves sensibly after End (to the save/reflection area or heading) and after Back to setup; buttons have accessible names; 320 px no horizontal scroll in `practice.module.css`. Fix only real problems; list what you checked.
- [ ] Teardown invariants preserved: End, auto-end at 180 s, `SESSION_EXPIRED` from connected → interrupt, sign-out during a call, pagehide — each still calls `controller.end()` before/independent of the network and calls the End route once with the right reason. Don't change these paths except to use the factory.

## Contract and documentation changes

- None beyond the frozen factory. Coordinator documents the seam in docs/09 and G5-04.

## Verification evidence

Writer: run `npm run typecheck` and `npm test` only; record exact results here.

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- Next smallest task:
- Ready for review:
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
