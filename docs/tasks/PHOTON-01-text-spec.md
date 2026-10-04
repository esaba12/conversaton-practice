# PHOTON-01: Specify text practice

Status: review
Updated: October 4, 2026, 00:20 America/Detroit
Assigned writer: docs session on the photon-text worktree
Coordinator: unassigned
Gate: N/A. Documentation only. Text practice is not in the current wow-pass gates.
Requirements/tests: N/A. No product behavior changed. Acceptance for a later build is in docs/17.
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main`, `916e5908a8a14f913ba4e88d5a7adee372d11892`
- Branch: `docs/photon-text`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/photon-text`
- Dev port: N/A
- Owned files: `docs/17-PHOTON-TEXT-PRACTICE.md`, `docs/tasks/PHOTON-01-text-spec.md`, and the pointer updates listed below
- Shared resources: N/A. No migration, package, or provider change.
- Dependency tasks and contract revisions: reads contracts/c1 as merged in `916e590`. Does not change those contracts.
- Unblock condition: none for this spec. Implementation waits until text practice is explicitly scheduled.

## Scope and acceptance

Outcome: docs/17 is the build map for iMessage practice. A linked website number unlocks it. Start is either the review screen or a Photon app card that picks a saved person or an example.

Non-goals: application code, a Photon account, a phone-call channel, STATUS.md.

- [x] docs/17 names the user flows, the card, the data tables, the routes, the code map, and the acceptance checks.
- [x] docs/00, 01, 03, 04, 05, 07, 08, 20, and AGENTS.md point at that shape and no longer describe a different text flow.
- [ ] Coordinator review. STATUS.md is unchanged on purpose.

## Contract and documentation changes

- Inputs/outputs/errors and relevant ownership/privacy boundary: docs/17. Not implemented.
- Shared change: none in code. The spec proposes a later migration and a split of `startSession`.
- Updated specs/setup/API/environment/schema runbooks: the files in the handoff. `.env.example` is intentionally unchanged until implementation.
- Decision/source: user, October 4, 2026, 00:13 America/Detroit. Photon Stable docs, cited in docs/17. No live Photon call.

## Verification evidence

- Date/time/timezone: October 4, 2026, 00:20 America/Detroit
- Gate and requirement/test IDs: N/A
- Mode: static
- Outcome: pass
- Tested commit/dirty state: `916e5908a8a14f913ba4e88d5a7adee372d11892` plus uncommitted documentation in this worktree
- Environment + working directory: local, `/Users/ethansaba/code/therapist/.worktrees/photon-text`
- Exact command or manual steps: read of Stable Photon docs and the session, people, and role-context modules at the base SHA. No test command.
- Exit code: N/A
- Observed result/artifact: docs/17 and the pointer updates
- Limitations: Spectrum is not installed. Signature verification, line provisioning, and a real DM are unchecked. The spec says so.

## Handoff

- Changed paths and commit(s): uncommitted. `AGENTS.md`, `docs/00-DECISIONS-AND-VIABILITY.md`, `docs/01-PRD.md`, `docs/03-ARCHITECTURE.md`, `docs/04-DATA-AND-MEMORY.md`, `docs/05-API-AND-ACTIONS.md`, `docs/07-PROMPTS.md`, `docs/08-SAFETY-AND-PRIVACY.md`, `docs/17-PHOTON-TEXT-PRACTICE.md`, `docs/20-DOCUMENTATION-STANDARD.md`, `docs/tasks/PHOTON-01-text-spec.md`
- Remaining failures/risks: a shared-pool Photon line may block the first opening send. docs/17 requires that to be confirmed on a real line before text start is called done.
- External account action: none for this spec. A later build needs a Spectrum project, an iMessage line, and a webhook secret.
- Next smallest task: coordinator review of docs/17. Do not implement from this record alone.
- Ready for review: yes
- Coordinator integration: pending. STATUS.md was not edited.
