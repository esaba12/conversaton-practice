# FIX-01: Reject shorter and split private-note copies in a generated setup

Status: review
Updated: October 3, 2026, 20:53 EDT
Assigned writer: FIX-01 coding agent
Coordinator: Cursor coordinator session
Gate: G5 follow-up
Requirements/tests: P02, T03 (private notes never reach counterpart context). Unit checks below. Live call N/A for this probe.
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/27
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `df60345ae2ad9ffdfa8e5bfbc2c32191ec6613e8`
- Branch: `agent/fix-01`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/fix-01`
- Dev port: N/A (no dev server)
- Owned files: `lib/setup/generate.ts`, `tests/unit/setup-generate.test.ts`, `docs/07-PROMPTS.md`, `docs/tasks/FIX-01-private-note-probe.md`
- Shared resources: none. No dependency, schema, migration, or provider change.
- Dependency tasks and contract revisions: [FIX-01 spec](../issues/FIX-01-private-note-probe.md); [REV-01](REV-01-g5-privacy-review.md) should-fix 1. `lib/setup/prompt.ts` unchanged (`SETUP_PROMPT_VERSION` stays `setup-2026-10-03.2`).
- Unblock condition: none

## Scope and acceptance

Outcome: `leaksPrivateNotes(role, privateNotes, situation)` rejects a generated role that copies a 3-word window of the private notes (the whole note when it is shorter than 3 words), including a window split across fields, or a distinctive note token. A window that is only stopwords, or a window or distinctive token that already appears in the situation, is not a leak. A leak still discards the attempt, retries once, then returns `PROVIDER_UNAVAILABLE`.

Non-goals: probing `goal` or `assumptions`, prompt changes, a second model call, review UI, and the start request.

- [x] A five-word copy is still flagged. A whole three-word note is flagged; a one-token plural mismatch is not.
- [x] A 3-word excerpt from a 30-word note is flagged.
- [x] A copy split across the end of `style` and the start of `publicContext` is flagged; the style fragment alone is not.
- [x] A name (`Priya`) or a number (`$400`) that appears only in the notes is flagged in the role. The same token in the situation is not.
- [x] Situation words do not flag, including the dishes example and a 3-word window that also occurs in the situation.
- [x] A stopword-only window (`I don't want to`) does not flag.
- [x] No notes never flags.
- [x] Mocked `generateDraft`: two leaks return `PROVIDER_UNAVAILABLE`; one leak then a clean role returns the clean role. A name only in `goal` and `assumptions` is returned.
- [x] `npm run typecheck`, `npm test`, and `npm run build` pass in this worktree.

## Contract and documentation changes

- Inputs/outputs/errors and relevant ownership/privacy boundary: `leaksPrivateNotes` now takes the situation. Counterpart strings checked are `name`, `role`, `style`, `publicContext`, `opening`, and each `constraints` entry, joined and per field. `goal` and `assumptions` are still user-only and are not probed. On a leak, behavior is unchanged: discard, one retry, then 503 `PROVIDER_UNAVAILABLE`.
- Shared change: none. Single caller is `attempt()` in `lib/setup/generate.ts`.
- Updated specs/setup/API/environment/schema runbooks: `docs/07-PROMPTS.md` backstop sentence. `lib/setup/prompt.ts` not edited.
- Decision/source: [FIX-01](../issues/FIX-01-private-note-probe.md); REV-01 should-fix 1. Accepted risk 4 (goal echo shown only to the user) is unchanged.

## Verification evidence

- Date/time/timezone: October 3, 2026, 20:53 EDT
- Gate and requirement/test IDs: G5 follow-up; P02, T03
- Mode: static
- Outcome: pass
- Tested commit/dirty state: `df60345ae2ad9ffdfa8e5bfbc2c32191ec6613e8` plus uncommitted edits in the owned files
- Environment + working directory: local, Node v20.19.4, `/Users/ethansaba/code/therapist/.worktrees/fix-01`
- Exact command or manual steps: `npm run typecheck`
- Exit code: 0
- Observed result/artifact: `tsc --noEmit` completed with no errors
- Limitations: does not execute the probe

- Date/time/timezone: October 3, 2026, 20:53 EDT
- Gate and requirement/test IDs: G5 follow-up; P02, T03
- Mode: unit
- Outcome: pass
- Tested commit/dirty state: `df60345ae2ad9ffdfa8e5bfbc2c32191ec6613e8` plus uncommitted edits in the owned files
- Environment + working directory: local, Node v20.19.4, Vitest 4.1.11, `/Users/ethansaba/code/therapist/.worktrees/fix-01`
- Exact command or manual steps: `npm test` (`vitest run`). Acceptance cases live in `tests/unit/setup-generate.test.ts` (24 tests in that file, including the mocked `generateDraft` retry).
- Exit code: 0
- Observed result/artifact: 15 files passed, 166 tests passed
- Limitations: provider `fetch` is mocked. No live OpenAI call. Paraphrase is not detected. Live counterpart playback was not run.

- Date/time/timezone: October 3, 2026, 20:53 EDT
- Gate and requirement/test IDs: G5 follow-up; P02, T03
- Mode: static
- Outcome: pass
- Tested commit/dirty state: `df60345ae2ad9ffdfa8e5bfbc2c32191ec6613e8` plus uncommitted edits in the owned files
- Environment + working directory: local, Node v20.19.4, Next.js 16.3.8, `/Users/ethansaba/code/therapist/.worktrees/fix-01`
- Exact command or manual steps: `npm run build`
- Exit code: 0
- Observed result/artifact: production build compiled and generated 11 static pages. `.next` stays in the worktree and is not committed.
- Limitations: build does not exercise a live draft. `npm run test:ui` was not run.

## Handoff

- Changed paths and commit(s): `lib/setup/generate.ts`, `tests/unit/setup-generate.test.ts`, `docs/07-PROMPTS.md`, this record, on `agent/fix-01`
- Remaining failures/risks: a 1–2 word excerpt of a longer note still passes unless it is a digit or a mid-sentence capital. A name that is the first word of a sentence is not treated as distinctive. Mid-sentence ALL CAPS can look like a name. A common 3-word phrase can false-positive and use the single retry. `Dr.` makes the next word look sentence-initial. Paraphrase is still prompt-only. `goal` and `assumptions` are still not probed (REV-01 accepted risk 4).
- External account action: none
- Next smallest task: coordinator review and integration. CI on the draft PR was not run from this worktree.
- Ready for review: yes
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
