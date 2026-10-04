# NAME-01: Choose a project name

Status: review
Updated: October 4, 2026, 10:15 EDT
Assigned writer: Cursor coordinator session
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
- Unblock condition: none. The owner stated the name SpeakEasy on October 4.

## Scope and acceptance

Outcome: SpeakEasy is the product name on the wordmark, the public page title, the README, the static preview, and the Devpost title.

Non-goals: a logo exploration, attaching a custom domain (hostname not supplied), renaming the GitHub repo or `package.json` `name`.

- [x] The human picks the name: SpeakEasy.
- [x] Wordmark, document title, README, and Devpost title match.
- [x] The name does not say therapy, diagnosis, or prediction.

## Contract and documentation changes

- Shared change: none
- Updated specs: docs/00 now records SpeakEasy
- Decision/source: owner, October 4, 2026. “name will be SpeakEasy”

## Verification evidence

- Date/time/timezone: October 4, 2026, 10:15 EDT
- Mode: browser on the running app, plus typecheck
- Outcome: wordmark and document title are SpeakEasy
- Tested commit/dirty state: branch `ui/redesign`, uncommitted rename
- Exact command or manual steps: signed-in home and `/practice` at `http://127.0.0.1:3012`; `npm run typecheck`
- Exit code: 0 (`npm run typecheck`)
- Observed result/artifact: page title “SpeakEasy”; header link name “SpeakEasy” on `/` and `/practice`
- Limitations: live not verified as a product gate. Custom domain hostname was not supplied, so it is not attached. Production `https://conversation-practice-zeta.vercel.app` still has the previous wordmark until this change is deployed. `package.json` name and the GitHub repository were left unchanged.

## Handoff

- Changed paths and commit(s): uncommitted on `ui/redesign`. The same wordmark and title strings are also edited in `.worktrees/ui-landing` so the server on port 3012 matches.
- Remaining failures/risks: Devpost still has to be filled with the SpeakEasy title. Production still shows the previous wordmark until deploy. The custom domain hostname was not provided.
- External account action: owner supplies the domain so it can be attached; Devpost title is SpeakEasy
- Next smallest task: attach the domain once the hostname is known
- Ready for review: yes
- Coordinator integration: pending commit
