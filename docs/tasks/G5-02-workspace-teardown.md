# G5-02: Practice workspace hardening (test media seam, duplicate save, draft limit message)

Status: review
Updated: October 3, 2026, 19:20 EDT
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

- [x] **Test media seam.** Replace the direct `createDailyController` call with `selectMediaController()`, chosen once per mount (e.g. `useState(() => selectMediaController())` or a ref, client side only). When `testMode` is true, the call view shows a visible, persistent notice: "Test media — no live call" (exact text; the coordinator's script asserts it). Production behavior unchanged.
- [x] **Stable selectors the script relies on (keep or add):** header "Sign out" button; "End practice" button; status text that includes "Time’s up" on auto-end, "couldn’t reach the server" when End is unreachable; "Retry closing session" button; "Back to setup"; Reflection panel "Get a short reflection", "Skip"/"Done". Don't rename existing labels.
- [x] **Duplicate same-named person on Save (G3 carry).** If the people list is `error` (not just `loading`), Save must not create blindly: on Save, re-fetch the list (`listPeople`) first and use the fresh list for the same-name match; if the re-fetch fails, show an error and save nothing. `ready` on `SaveAfterEnd` stays false while loading. Mid-save state stays correct.
- [x] **Draft rate limit message.** (see risk: `SetupDescribe` still adds its generic "try again" line) In `generate()`, `USAGE_LIMIT` shows the server's message (not the generic failure) and does not offer endless retry wording; the manual setup path stays available.
- [x] **A11y of the call and save panel (T13/T14).** Check: the call phase/status message is in a live region announced once (not on every elapsed-second tick); the elapsed timer isn't a chatty live region; focus moves sensibly after End (to the save/reflection area or heading) and after Back to setup; buttons have accessible names; 320 px no horizontal scroll in `practice.module.css`. Fix only real problems; list what you checked.
- [x] Teardown invariants preserved: End, auto-end at 180 s, `SESSION_EXPIRED` from connected → interrupt, sign-out during a call, pagehide — each still calls `controller.end()` before/independent of the network and calls the End route once with the right reason. Don't change these paths except to use the factory.

## Contract and documentation changes

- None beyond the frozen factory. Coordinator documents the seam in docs/09 and G5-04.

## Verification evidence

Writer: run `npm run typecheck` and `npm test` only; record exact results here.

- October 3, 19:10 EDT, shared checkout with other workers' uncommitted files present: `npm run typecheck` (`tsc --noEmit`) exit 0, no errors. `npm test` (`vitest run`) 14 files, 151 tests passed. No build, Playwright, dev server or provider calls. Workspace behavior is not unit-tested; the seam, duplicate-save and draft-limit paths are reviewed by reading only (mock browser check is the coordinator's G5-04 script). Live not verified.
- A11y checked (code reading, not a screen reader):
  - Phase pill `role="status"` is always mounted and changes only with phase: announced once per phase. No change.
  - Timer is not a live region (fine). Its `aria-label` sat on a generic `div`, where names are unsupported. Added `role="timer"` (implicit `aria-live="off"`), so the name applies and the per-second ticks stay silent.
  - Call status (`Time’s up…`, `couldn’t reach the server…`, cleanup) was a `role="status"` mounted together with its first text, which screen readers often skip. It is now always mounted (empty when there is nothing to say; `:empty` drops its margin).
  - Focus after End: End becomes disabled; the save panel mounts and focuses Dismiss (existing). Dismiss unmounted the panel and dropped focus to `body`; it now moves focus to "Back to setup". Back to setup: existing `moveFocus` focuses the review heading, or the saved-person heading via `openPerson`. No change.
  - Accessible names: Mute/Unmute, "Turn camera on/off", "End practice"/"Practice ended" contain their visible text (label in name). Save panel buttons are text buttons. No change.
  - 320 px: call header stacks below 360 px, stage overlays are constrained (`max-width: calc(100% - 170px)`, `flex-wrap`), fixed controls are 3 × 76 px + gaps within 320 px, `.actions` wraps, `overflow-wrap: anywhere` on the call. No change found; not measured in a browser.

## Handoff

- Changed paths and commit(s): uncommitted (no Git writes). `app/practice/practice-workspace.tsx`: `selectMediaController()` resolved once per mount in a client effect (`mediaRef`, with a lazy fallback in `launch`) and `testMedia` state passed to the call; `generate()` shows the server message for `USAGE_LIMIT`; `saveFromCall()` re-fetches via `loadPeople()` when the list isn't `ready`, saves nothing and shows "We couldn’t check your saved people, so nothing was saved. Please try again." if that fails, and if the fresh list has a same-named person it stops with "You already saved someone named X. Choose Update to apply this call’s setup." (panel switches to "Update X"); Dismiss focuses "Back to setup". `components/presentation/practice.tsx`: `testMedia` prop renders "Test media — no live call" banner; `role="timer"`; always-mounted status region. `practice.module.css`: `.callStatus:empty`. `people-save.tsx` unchanged.
- Labels the script can rely on (unchanged unless noted): "Sign out"; "End practice" (accessible name; visible text "End"); "Test media — no live call" (new, only when the test global is installed); status "Time’s up. The practice reached its planned length."; "We couldn’t reach the server to close the practice session."; "Retry closing session"; "Back to setup"; "Save this person" / "Update X" / "Dismiss"; Reflection "Get a short reflection", "Skip"/"Done" (unchanged, owned by `reflection-panel.tsx`).
- Teardown: `finish`, `interrupt`, `abandon`, `signOut`, pagehide, unmount and `SESSION_EXPIRED` paths untouched; only the controller construction changed.
- Remaining failures/risks: (1) `SetupDescribe` (not owned) always appends "Your description is still here. You can try again or fill in the setup yourself." to non-out-of-scope errors, so the draft limit still shows mild retry wording after the server message. Proposed: add a `retry?: boolean` to `SetupDescribeError` and hide that sentence (keep "Set up manually") when false. (2) The test-media notice appears after hydration (effect), not in server HTML; the script should wait for it. (3) A save dismissed mid-save is reopened on success (pre-existing).
- Next smallest task: coordinator mock-browser run of the workspace with `TEST_MEDIA_GLOBAL`; optional `SetupDescribe` retry flag.
- Ready for review: yes
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
