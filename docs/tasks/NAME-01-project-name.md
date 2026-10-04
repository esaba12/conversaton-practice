# NAME-01: Choose a project name

Status: blocked
Updated: October 3, 2026, 20:00 EDT
Assigned writer: human builder
Coordinator: Cursor coordinator session
Gate: submission copy, optional
Requirements/tests: N/A
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: `main`
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A
- Owned files: wordmark in `components/presentation/workspace-header.tsx` and the public entry, plus README and DEMO-01, only after a name is chosen
- Shared resources: Devpost title, if the name should match
- Dependency tasks and contract revisions: none
- Unblock condition: the human states the name. Agents do not invent one.

## Scope and acceptance

Outcome: one name, used the same way on the wordmark, the public page title, the README, and the Devpost title. Until then the product keeps “Conversation practice”.

Non-goals: a logo exploration, a domain purchase, renaming the GitHub repo as part of this task.

- [ ] The human picks the name.
- [ ] Wordmark, document title, README, and Devpost title match.
- [ ] The name does not say therapy, diagnosis, or prediction.

## Contract and documentation changes

- Shared change: none
- Updated specs: docs/00 “the project remains unnamed” once a name exists
- Decision/source: docs/00. Naming was deferred on purpose.

## Verification evidence

- Date/time/timezone: October 3, 2026, 20:00 EDT
- Mode: not-run
- Outcome: blocked
- Tested commit/dirty state: `8f61d0968e1eba755c79281780f199f7960248f3`
- Exact command or manual steps: not run
- Exit code: N/A
- Observed result/artifact: wordmark string is “Conversation practice”
- Limitations: no name has been supplied

## Handoff

- Changed paths and commit(s): none
- Remaining failures/risks: a last-minute rename on Devpost and in the UI can diverge. Skip the rename if it lands after the pitch rehearsal.
- External account action: the human chooses the name
- Next smallest task: none until that choice
- Ready for review: no
- Coordinator integration: pending
