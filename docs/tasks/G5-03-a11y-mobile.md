# G5-03: Accessibility and mobile pass of setup, people, About me, reflection and Your data

Status: active
Updated: October 3, 2026, 19:15 EDT
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

- [ ] Every input/textarea has a programmatic label; errors are associated (`aria-describedby`) or in `role="alert"`; async results use one `role="status"` per region, not duplicated.
- [ ] Sharing: every drag has a click and keyboard path (already Enter on chip buttons); confirm click works, the moved chip keeps or regains focus sensibly, and a status announces "Shared X with Y" / "Stopped sharing X" once. Private prep is never a chip or draggable.
- [ ] Chip editor: groups have `role="group"` + accessible name; selected state exposed (`aria-pressed` or radio semantics).
- [ ] Headings in order per page; focus moves to the page heading on view changes where the code already intends it.
- [ ] Destructive delete-all: the confirm phrase input is labelled, the button states what it deletes, the result is announced.
- [ ] CSS: at 320 px no fixed widths/`white-space: nowrap` that overflow; tap targets ≥ 44 px for primary actions; long names/facts wrap (`overflow-wrap: anywhere`).
- [ ] Keep every existing accessible name the coordinator's scripts use: "Knows about <name>" and "About me" regions, "Share with <name>: <fact>", "Stop sharing with <name>: <fact>", "New fact about you", "Add fact", "Private preparation notes", "Formality" group with "Casual", "Save", "Get a short reflection", "Skip", "Done", "Retry cleanup" (or whatever Your data uses today — do not rename; report the exact current names in the handoff).
- [ ] List what you checked and what you changed per file in the handoff.

## Verification evidence

Writer: run `npm run typecheck` and `npm test` only; record exact results here.

## Handoff

- Changed paths and commit(s):
- Exact accessible names of Your data controls (for the coordinator's script):
- Remaining failures/risks:
- Ready for review:
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
