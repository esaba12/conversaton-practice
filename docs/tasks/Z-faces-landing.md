# Z: Faces and landing (3C + 2D combined)

Status: queued (dispatch when a lane frees and M23 is applied)
Assigned writer: Z worker subagent
Coordinator: wow-pass coordinator
Gate: Compressed finish (docs/next/02-BUILD-PLAN.md §1a)
Requirements/tests: docs/32-FEATURE-SPECS.md B4, R6; docs/next/03-CONTRACTS.md §2.9 (starter map); migration `20261004020000_planned_and_presets.sql` (`people.preset_id`, RPC `person_set_preset(p_id, p_expected_version, p_preset)`)

## Assignment and isolation

- Branch `agent/z-faces-landing`; worktree `.worktrees/z`; dev port 3108.
- Owned: person editor "Look and voice" component (`components/presentation/people-look.tsx`) and its mount in the person page, `app/api/people/[id]/preset/route.ts`, `lib/data/people-preset.ts`, the saved-person branch of face/PAL resolution in `lib/session/**` and `lib/media/tavus.ts` (read `preset_id` from `people` directly; `person_context` is strict and unchanged), `app/page.tsx`, `components/site/**`, tests, this record.
- Not owned (propose exact diffs): `app/practice/practice-workspace.tsx`, `lib/schemas/**` shared shapes, migrations, package files, numbered docs, STATUS.md.

## Scope and acceptance

- [ ] B4 with the four starter faces/voices only (existing PALs; no new provider setup): picker shows portraits via `/api/portraits/[presetId]`; saving calls `person_set_preset` with the version; saved-person start uses the mapped face and PAL (default when null); unknown preset rejected; bundle grep finds no provider ids.
- [ ] R6 landing without a recorded clip: the live Meet card illustration works with zero network requests on interaction (browser test); reduced motion shows a still; "Fictional AI" labeling.
