# APPEAR-01: Stock face and premade voice for a saved person

Status: review
Updated: October 4, 2026, 10:15 AM America/Detroit
Assigned writer: unassigned
Coordinator: Cursor coordinator session
Gate: after submission, if the human still wants it. docs/10 cut order drops this catalog before generation, live video, or sharing.
Requirements/tests: P03 “preset catalog is decided for later.” docs/00 appearance section.
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Built October 4 (docs remaining until this update)

The picker shipped in [PR #87](https://github.com/esaba12/conversaton-practice/pull/87) (`9689b15`), narrower than the original catalog: Default plus Alex, Ellis, Sam, and Jordan. Server mapping, unit tests for the mapping and the start body, and the two-owner `person_set_preset` SQL check are recorded on [Z](Z-faces-landing.md). This update covers the remaining docs: docs/00, docs/02, docs/06, and docs/26.

Still open: one live call with a non-default face. The owner runs it. Issue #37 stays open until that call is reported and these docs are on `main`. No upload, no cloning, no provider ids in the browser.

- [x] docs/00, docs/02, docs/06, and docs/26 describe the four-starter picker
- [ ] One live call with a non-default face (owner)

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: a focused branch only after the unblock
- Worktree: coordinator creates provider resources; UI can be a separate writer after the catalog contract is frozen
- Dev port: 3000
- Owned files: to be frozen at start. Expected: person schema and migration (preset id only), server map from preset id to Tavus replica and PAL ids, person editor control, `lib/media/tavus.ts` selection
- Shared resources: the one existing PAL and stock face stay the default. New PALs are created only when this task starts. The browser never receives provider ids.
- Dependency tasks and contract revisions: docs/00 (October 3, 17:23 EDT) and docs/06 (one PAL per premade voice, same roleplay settings).
- Unblock condition: submission is sent and the human schedules the catalog. Do not create PALs before that.

## Scope and acceptance

Outcome: on a saved person, the user picks one entry from a short catalog. The next practice with that person uses that stock face and premade ElevenLabs voice. Traits and shared About-me facts stay independent of the pick. The counterpart remains labeled fictional.

Non-goals: photo upload, generated likeness, voice cloning, a face for unsaved one-off setups beyond the current default, per-call face overrides from the browser.

Catalog rules when scheduled:

- The person row stores a preset id from a server-owned list. Unknown ids are rejected.
- The server maps that id to a replica id and a PAL id. Those ids are configuration, not request fields.
- Each distinct premade voice needs its own PAL with the same roleplay settings. Faces can vary per conversation if Tavus already accepts the replica on the call; confirm against current Tavus docs before adding PALs that differ only by face.
- Default preset is today’s configured face and voice, so existing people keep today’s look until edited.

- [ ] The picker lists names a person would recognize (“warm, lower voice”), not provider ids.
- [ ] A saved-person start uses the stored preset. A reviewed-role start keeps the default.
- [ ] User B cannot set or read A’s preset.
- [ ] No upload control and no cloning control exists.
- [ ] One live call with a non-default preset is a separate human check. Automated tests prove the id mapping and the request boundary.

## Contract and documentation changes

- Inputs/outputs/errors: person create/update gains `appearancePreset`. Start body for a saved person stays id + version. The server loads the preset.
- Shared change: coordinator adds the field and the server map. Workers do not invent provider ids.
- Updated specs: docs/00, docs/02, docs/06, docs/26. October 4: those four now describe the built picker. The “later / not built” lines were replaced.
- Decision/source: docs/00, October 3, 17:23 EDT.

## Verification evidence

- Date/time/timezone: October 4, 2026, 10:15 AM America/Detroit
- Mode: static
- Outcome: pass for the doc update only. No typecheck, unit test, build, browser run, or live call in this change.
- Tested commit/dirty state: docs on `cursor/face-picker-docs-3689`, based on `main` `75f9c7d`
- Exact command or manual steps: read `components/presentation/people-look.tsx`, `lib/media/presets.server.ts`, `lib/session/server.ts`, migration `20261004020000_planned_and_presets.sql`, and [Z](Z-faces-landing.md), then updated the four specs to match.
- Exit code: not-run (no test command)
- Observed result/artifact: the specs name Default plus the four starters, the preset route, and the live-not-verified call.
- Limitations: behavior is taken from the merged implementation and the Z record. This pass did not re-run those tests and did not start a call.

- Date/time/timezone: October 3, 2026, 20:00 EDT
- Mode: not-run
- Outcome: not-run
- Tested commit/dirty state: `8f61d0968e1eba755c79281780f199f7960248f3`
- Exact command or manual steps: not run
- Exit code: not-run
- Observed result/artifact: one PAL, one stock face, no person field for appearance
- Limitations: catalog size and which stock faces are available were not re-fetched for this plan

## Handoff

- Changed paths and commit(s): none yet
- Remaining failures/risks: extra PALs cost account setup and can drift from the roleplay settings. Create them in one pass and read them back.
- External account action: none until the task starts; then the coordinator creates PALs in the existing Tavus account
- Next smallest task: leave it
- Ready for review: no
- Coordinator integration: pending
