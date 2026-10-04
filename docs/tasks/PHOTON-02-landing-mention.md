# PHOTON-02: Mention text practice on the public landing

Status: review
Updated: October 4, 2026, 11:15 America/Detroit
Assigned writer: landing/docs session on the photon-text worktree
Coordinator: unassigned
Gate: N/A. Copy and documentation only. Text practice is not a live gate.
Requirements/tests: `tests/browser/public.spec.ts` public-entry assertion for the new sentence. No P/T ID. Live iMessage is out of scope.
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `docs/photon-text`, `5e0e793ac0b4bf6dc9dfde64cd82b033eede2488` plus uncommitted work already in this worktree
- Branch: `docs/photon-text`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/photon-text`
- Dev port: 3100 for the Playwright web server
- Owned files: `components/site/public-landing.tsx`, `app/globals.css` (`.text-aside` only), `tests/browser/public.spec.ts`, README Photon pointers, and the doc status lines listed in the handoff
- Shared resources: N/A. No migration, package, provider, or STATUS.md change.
- Dependency tasks and contract revisions: PHOTON-01 and docs/17. This note does not change the text-channel contract.
- Unblock condition: a real iMessage round trip, which this task does not claim.

## Scope and acceptance

Outcome: the signed-out landing keeps the live video call as the hero and adds a short secondary note that the same fictional character can be rehearsed by text. Docs that a merge would ship no longer say Photon is only a deferred, unbuilt stretch.

Non-goals: committing, pushing, merging, STATUS.md, a Photon CLI, provider calls, and any claim that the line, webhook, or domain delivery works.

- [x] Landing hero and three video steps stay. One secondary paragraph describes text practice and says a text does not start a video call.
- [x] README, PRD, demo, and build-plan “do not start” lines say text practice is implemented on this branch and stays unmerged until a real iMessage round trip. Video remains the demo.
- [ ] Coordinator review. Live text is not verified.

## Contract and documentation changes

- Inputs/outputs/errors and relevant ownership/privacy boundary: unchanged. Private prep still does not reach the character. The existing landing disclosure still says this is fictional practice and does not predict how anyone will respond.
- Shared change: none.
- Updated specs/setup/API/environment/schema runbooks: README.md, docs/00, docs/01, docs/02, docs/03, docs/04, docs/05, docs/08, docs/10, docs/11, docs/15, docs/17, docs/20, docs/29, AGENTS.md. docs/17 status stays implemented, not merged, live not verified.
- Decision/source: owner direction for this branch, October 4, 2026. No new Photon call.

## Verification evidence

- Date/time/timezone: October 4, 2026, America/Detroit
- Gate and requirement/test IDs: N/A. Browser check is the public landing sentence in `tests/browser/public.spec.ts`.
- Mode: mock
- Outcome: see the command result recorded after the run in this same file
- Tested commit/dirty state: `5e0e793ac0b4bf6dc9dfde64cd82b033eede2488` plus uncommitted landing and doc edits
- Environment + working directory: local, `/Users/ethansaba/code/therapist/.worktrees/photon-text`
- Exact command or manual steps: `CI=1 npx playwright test tests/browser/public.spec.ts`
- Exit code: pending in this draft until the command finishes
- Observed result/artifact: pending
- Limitations: Playwright does not send an iMessage or prove a Photon line, webhook, or domain. Text practice remains live not verified.

## Handoff

- Changed paths and commit(s): uncommitted. No commit from this task.
- Remaining failures/risks: no Photon line, webhook, or domain delivery has succeeded. The owner merges only if a real text round trip works.
- External account action: none for this copy change.
- Next smallest task: a real iMessage round trip, owned by whoever runs the Photon line.
- Ready for review: after the browser check is recorded
- Coordinator integration: pending. STATUS.md was not edited.
