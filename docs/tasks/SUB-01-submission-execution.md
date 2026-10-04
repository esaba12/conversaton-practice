# SUB-01: Execute the submission

Status: planned
Coordinator, October 3, 2026, 20:40 EDT: still not executed. The SHA and “not pushed” line below were the tree at 20:00. `main` has moved since then.
Updated: October 3, 2026, 20:00 EDT
Assigned writer: human builder
Coordinator: Cursor coordinator session
Gate: submission (docs/10, docs/11)
Requirements/tests: N/A. Copy and shot list already live in [DEMO-01](DEMO-01-submission-prep.md).
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: `main`
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: 3000 during the pitch and the backup recording
- Owned files: none in the app. This record tracks human execution. Demo sentences stay in DEMO-01.
- Shared resources: Devpost account, laptop, headset, local `.env.local`
- Dependency tasks and contract revisions: DEMO-01 (drafts). POST-01 should be accepted before the human calls the product good enough to submit. LIVE-01 is optional and does not block this list.
- Unblock condition: the human says the workspace is good enough to pitch.

## Scope and acceptance

Outcome: Devpost is submitted before 11:30 AM Sunday, October 4, America/Detroit, with a confirmation kept. The pitch script, backup shot list, and do-not-claim list in DEMO-01 are what get used.

Non-goals: rewriting the pitch, new features the morning of judging, checking sponsor boxes for tools this build did not use.

- [ ] Push `8f61d09` (and any later accepted polish) so the submitted repo matches the laptop.
- [ ] Record the backup from the DEMO-01 shot list. File name or folder label includes “prerecorded”. Fictional content only. Do not delete-all on the demo account.
- [ ] Fill Devpost from the DEMO-01 drafts. Built-with list matches that section.
- [ ] Select Actually Intelligent. Add an ElevenLabs category only with a stacking answer the human is willing to stand on. The expo questions in docs/16 were not recorded as answered.
- [ ] Table number, solo teammate line, and the demo URL https://conversation-practice-zeta.vercel.app. Do not use the static preview host. Keep a prerecorded backup labelled prerecorded.
- [ ] Rehearse once inside three minutes, with a 60–90 second live exchange, on a generated situation.
- [ ] Laptop charged, headset, throwaway account signed in, `npm run dev -- --port 3000` already up before 12:30.
- [ ] Keep the Devpost confirmation. Be in the Duderstadt Basement 1:00–3:00 PM for science-fair judging (confirmed October 4).
- [ ] Screenshots and the gallery contain no keys, real emails, or private notes.

## Contract and documentation changes

- Shared change: none
- Updated specs: check the submitted box in docs/11 when the confirmation exists
- Decision/source: docs/11 and docs/16. Internal target 11:30 AM.

## Verification evidence

- Date/time/timezone: October 3, 2026, 20:00 EDT
- Mode: not-run
- Outcome: not-run
- Tested commit/dirty state: `8f61d0968e1eba755c79281780f199f7960248f3` (local, not pushed)
- Exact command or manual steps: not run
- Exit code: not-run
- Observed result/artifact: DEMO-01 drafts exist. No Devpost confirmation is recorded. No backup file is recorded.
- Limitations: organizer form fields were not re-read for this plan

## Handoff

- Changed paths and commit(s): none
- Remaining failures/risks: the local polish commit is not on GitHub yet. A judge who opens the repo will not see it until it is pushed.
- External account action: Devpost submit; optional organizer answer on ElevenLabs stacking
- Next smallest task: human says the workspace is good enough, then this list
- Ready for review: no
- Coordinator integration: pending
