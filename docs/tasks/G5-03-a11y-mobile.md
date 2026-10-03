# G5-03: Accessibility and mobile pass of setup, people, About me, reflection and Your data

Status: review
Updated: October 3, 2026, 19:14 EDT
Assigned writer: background subagent (G5-03)
Coordinator: Cursor coordinator session
Gate: G5 (docs/10 polish "Accessibility and mobile layout pass")
Requirements/tests: docs/02 accessibility rules; docs/09 browser checks; T16 keyboard/click sharing path
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/24
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g5-hardening` from `main` `03fdde1`
- Branch / worktree: `build/g5-hardening`, `/Users/ethansaba/code/therapist` (shared checkout, disjoint paths)
- Owned files: `app/practice/about-me/**`, `app/practice/data/**`, `app/practice/people/**`, `components/presentation/{people-about-me,people-editor,people-list,people-sharing,people-start,data-overview,reflection-panel,setup-describe,setup-review}.tsx`, `components/presentation/{people,data,reflection,setup}.module.css`, this record.
- Not owned: `practice-workspace.tsx`, `people-save.tsx`, `practice.tsx` (G5-02); `lib/**`; `app/globals.css` (propose changes in the handoff).
- Shared resources: none. No build, Playwright, provider calls or Git writes. Static review of code only.

## Scope and acceptance

Outcome: every new G3/G4 page is usable by keyboard and screen reader and fits 320/390 px without horizontal scroll.
Non-goals: visual redesign, new features, copy rewrites beyond accessibility.

- [x] Every input/textarea has a programmatic label; errors are associated (`aria-describedby`) or in `role="alert"`; async results use one `role="status"` per region, not duplicated. (Static review; Your data error now in `role="alert"`.)
- [x] Sharing: every drag has a click and keyboard path (already Enter on chip buttons); confirm click works, the moved chip keeps or regains focus sensibly, and a status announces "Shared X with Y" / "Stopped sharing X" once. Private prep is never a chip or draggable. (Static review only; not browser-run.)
- [x] Chip editor: groups have `role="group"` + accessible name; selected state exposed (`aria-pressed` or radio semantics). (Already true; unchanged.)
- [x] Headings in order per page; focus moves to the page heading on view changes where the code already intends it. (Already true; unchanged.)
- [x] Destructive delete-all: the confirm phrase input is labelled, the button states what it deletes, the result is announced.
- [x] CSS: at 320 px no fixed widths/`white-space: nowrap` that overflow; tap targets ≥ 44 px for primary actions; long names/facts wrap (`overflow-wrap: anywhere`). (Static reading of CSS; no viewport rendering run.)
- [x] Keep every existing accessible name the coordinator's scripts use. No accessible name or visible label was renamed; exact names below.
- [x] List what you checked and what you changed per file in the handoff.

## Verification evidence

Static code review only. No build, browser, Playwright, dev server or provider call was run, so nothing here is browser-verified or live-verified.

- `npm run typecheck` (October 3, 19:13 EDT): exit 0, no errors.
- `npm test` (October 3, 19:13 EDT): exit 0, 14 test files, 151 tests passed. No unrelated failures from other workers' in-progress files at that time.

## Handoff

- Changed paths (uncommitted, no Git writes by this worker):
  - `app/practice/people/[id]/person-workspace.tsx`: the sharing status is cleared when a move starts (instead of "Sharing with…"), so each move produces one announcement and repeated identical results still announce. Result text is now `Shared “<fact>” with <name>.` / `Stopped sharing “<fact>” with <name>.` (no test or script referenced the old "now knows" wording).
  - `components/presentation/people-sharing.tsx`: a drop now also records the moved chip, so focus follows it into the other column and a stale click target can't steal focus later. The disabled reason (save first, or facts failed to load) is added to each chip's `aria-describedby`. Checked: regions are `section` + `aria-labelledby` ("About me", "Knows about <name>"), h2 then h3, private notes are a labelled textarea that never accepts the custom drag type and are never chips.
  - `components/presentation/people-editor.tsx`: the delete confirmation no longer uses `role="alert"` on the question. Instead, both confirm buttons are described by it, focus moves to Cancel when the confirmation opens, and Cancel returns focus to "Delete <name>". Checked: trait rows already have `role="group"` labelled by the trait name and `aria-pressed` chips; radios are in `fieldset`/`legend`.
  - `components/presentation/people-about-me.tsx`: focus moves to Cancel when a delete confirmation opens. Cancel returns focus to the row's Delete button; closing or saving an edit returns it to the row's Edit button (applied after re-render, once the button is enabled). The confirm prompt describes the confirm/cancel buttons.
  - `components/presentation/data-overview.tsx`: the confirm warning describes the phrase input. After a successful delete-all (or Retry deletion), focus moves to the "Delete all practice data" heading (`tabIndex=-1`) while the existing polite region announces the result. A failed delete refocuses the submit button after `deleting` clears. When a Retry cleanup finishes and focus was dropped, it returns to that row's Retry button or else the "Past sessions" heading. The page-level error moved into its own `role="alert"`; the status stays in the polite region.
  - `app/practice/data/data-workspace.tsx`: clears the previous delete result when a new deletion starts, so an identical result is announced again.
  - `components/presentation/reflection-panel.tsx`: after a request finishes, if focus was dropped (the button was disabled or removed), focus moves to the request button ("Try again") or else to Done/Skip. This never runs on mount, so it can't compete with the After-End panel's default focus.
  - `components/presentation/reflection.module.css`: the result live region is no longer `display: none` while empty. It stays in the accessibility tree, and a negative margin cancels the grid gap, so the first result is announced.
  - `components/presentation/data.module.css`: on narrow screens the session table header is visually hidden instead of `display: none`, so column headers remain available to screen readers.
  - `components/presentation/people.module.css`: `.sectionTitle` gets a focus-visible ring for the new focus targets; fact chips get `overflow-wrap: anywhere`; the add-fact field and fact rows get `min-width: 0` and a 200 px flex basis so they fit 320 px cards.
  - Reviewed, no change needed: `people-list.tsx`, `people-start.tsx`, `setup-describe.tsx`, `setup-review.tsx`, `setup.module.css`, `app/practice/{about-me,data,people/[id]}/page.tsx`, `about-me-workspace.tsx`.
- Exact accessible names of Your data controls (for the coordinator's script):
  - Cleanup state text per row (shown text, no separate accessible name): `confirmed` → "Deleted at provider", `pending` → "Provider cleanup pending", `unresolved` → "Provider cleanup not confirmed", `not_started` → "No provider call", any in-progress session → "In progress". Status column: "In progress", "Ended", "Interrupted", "Deleted".
  - Retry button: accessible name "Retry provider cleanup for the session started <date, time>" (from `aria-label`, using `Intl.DateTimeFormat` medium date + short time). Visible text "Retry cleanup" ("Retrying…" while busy). It appears only for ended/interrupted sessions with pending or unresolved cleanup.
  - Open delete: button "Delete all practice data…" (with the ellipsis character).
  - Phrase input label: "Type delete my practice data to confirm"; the phrase is exactly `delete my practice data`.
  - Delete button: "Permanently delete my practice data" ("Deleting…" while busy); "Cancel" next to it.
  - Result: "Your practice data was deleted from this app." or "Deletion was incomplete." with a "Retry deletion" button. Load failures show "Try again".
- Reflection panel controls: textarea label "What did you notice? (optional, not saved)". Request button "Get a short reflection" (idle), "Reflecting…" (pending), "Try again" (retryable error). Close button "Skip" before a result, "Done" after.
- Remaining failures/risks:
  - The Retry cleanup `aria-label` doesn't contain its visible text "Retry cleanup" (WCAG 2.5.3 label-in-name; voice-control users saying "Retry cleanup" may miss it). Not renamed per instructions. Proposal: `Retry cleanup for the session started <date>`, but only once the coordinator's script is updated.
  - At ≤760 px, table rows use `display: grid`; some browsers (notably Safari) may drop table semantics for restyled rows. Not changed.
  - After a fact is deleted on About me, its row disappears and focus falls to the page; the deletion is announced by the status region.
  - Setup describe/review and person Save disable the focused button while busy, which can drop focus in some browsers. Left as is; the owning view-change focus logic already moves to the next heading.
  - Status messages in the editor, About me and Never shared are `role="status"` elements inserted with their text. Most screen readers announce this, but it is less reliable than a persistent region. Unchanged to keep the diff minimal.
  - Nothing browser-verified at 320/390 px; coordinator mock browser run recommended.
- Ready for review: yes
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
