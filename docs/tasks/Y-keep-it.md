# Y: Keep it (2C + 3A combined: pocket card, feedback style, planned date and check-in)

Status: queued (dispatch when a lane frees and M23 is applied)
Assigned writer: Y worker subagent
Coordinator: wow-pass coordinator
Gate: Compressed finish (docs/next/02-BUILD-PLAN.md §1a)
Requirements/tests: docs/32-FEATURE-SPECS.md L2, L3, B1, B2; docs/next/04-NEW-SPECS.md W4 (storage); migration `supabase/migrations/20261004020000_planned_and_presets.sql` (RPCs `planned_set`, `planned_checkin`, `planned_delete`; table `planned_conversations`, owner-read RLS)

## Assignment and isolation

- Branch `agent/y-keep-it`; worktree `.worktrees/y`; dev port 3107.
- Owned: `components/practice/pocket-card*.tsx`, `lib/pocket-card/**` (canvas PNG export), `lib/practice/feedback-style.ts` (device-only `localStorage`, enum `gentle` | `direct` | `list`, default `gentle`), a feedback-style control mounted in `app/practice/about-me/about-me-workspace.tsx`, `app/api/planned/**`, `lib/data/planned.ts`, `lib/schemas/planned.ts`, `components/practice/checkin-banner.tsx`, `components/practice/planned-date.tsx`, `app/design-preview/keep/page.tsx`, tests, this record.
- Not owned (propose exact diffs): `app/practice/practice-workspace.tsx`, recap components (slice X), people pages, migrations, package files, numbered docs, STATUS.md.

## Scope and acceptance

- [ ] L2: pocket card renders and exports PNG offline; no network on export; works with no date; "Add a day (optional)" is a quiet link.
- [ ] L3: feedback style stored on the device only; read by the client and sent as an enum in the reflect request (slice X validates it).
- [ ] B1: optional date and ≤120 label on a saved person and the recap; never required or re-prompted; routes are owner-authorized; cross-owner → 404.
- [ ] W4 storage: "Keep my guess to check after the real conversation" off by default; only then send fear and likelihood to `planned_set`.
- [ ] B2: check-in shows only when a date exists, on or after it, once; Not yet / I decided not to / Yes (optional note ≤200); Not yet offers a new day; "Talked for real" mark when the answer is Yes; no reminders outside the app.
