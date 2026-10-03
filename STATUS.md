# Project status

Updated October 3, 2026, America/Detroit (agent workflow preparation; no application build).

## Restart handoff
The user is ready to start building after clearing context. Follow [the final startup checklist](docs/21-START-BUILD.md), recheck what actually ran, then begin G1-00 / GitHub issue #1. This turn prepared instructions; it did not execute activation, a first commit/push, AWS login, or application scaffolding.

Project directory: /Users/ethansaba/code/therapist. The development-agent framework and specs now support one human with parallel coding agents and Warp worktrees. Tooling is partially installed. No application build or cloud provisioning has started.

To resume, read this file, AGENTS.md, README.md, docs/01-PRD.md, docs/10-BUILD-PLAN.md, docs/19-AGENT-WORKFLOW.md, and the assigned task record. The next implementation task is docs/tasks/G1-00-foundation.md. Read docs/18-DESIGN-AND-AWS.md for hosting/auth choices. Do not repeat product discovery or reintroduce a name.

Account setup order: AWS authentication (Cognito recommended), minimal PostgreSQL identity/session/cleanup storage, and ElevenLabs for authenticated G1; OpenAI for G2 generation; broader profiles/personas and memory persistence in G3. The user has AWS credits and an existing Supabase account with no room for another database. App-specific credentials/access are unverified. No credentials are stored here.

Research conclusions and references are saved in docs/00-DECISIONS-AND-VIABILITY.md and docs/14-SOURCES.md (S05, S39, S40). Practice clear requests, boundaries, and saying no; scenario choice is a product decision, not an established research ranking. The app has no demonstrated clinical efficacy.

Event plan: internal submission target October 4, 2026 at 11:30 AM America/Detroit; the existing event notes record an official deadline before noon. Reassess remaining time after the restart.

## Confirmed direction
- One human builder with explicitly authorized coding subagents, multitasking, and worktrees in Warp; project remains unnamed. Keep product gates ordered, parallelize independent tasks within each, and do not add an app runtime orchestration framework.
- Documentation accompanies behavior changes. Coordinator owns shared contracts, numbered specs, integration, and STATUS; workers own their assigned task record and paths. See docs/20-DOCUMENTATION-STANDARD.md.
- Use the connected GitHub repository frequently for task issues, focused commits/branches, draft PRs, review, and CI. This is a standing user preference, recorded in AGENTS.md and docs/19.
- Fresh sessions; approved persona/profile settings may persist, simulated events do not.
- User-described situations are the primary input. Working situation generation is core scope.
- Confirmed: generate an editable counterpart, scenario, and opening, then converse live. Written script generation is outside the current scope.
- Use a concrete communication action as the practice goal. Keep the roommate cleaning request as a demo example; reviewed sources do not rank it above other scenarios.
- Sign-in is required before all workspace actions, including designing personas/conversations and generating setups. This explicitly replaces anonymous/guest-first entry.
- AWS database preferred because of available credits and no capacity for another Supabase database. Supabase is superseded. Recommended path: Cognito + Aurora PostgreSQL Serverless v2/Data API + compatible AWS hosting; specific account resources and engine/region are not yet selected or provisioned.
- Visual direction confirmed: warm and minimal, but crisp and modern. Proposed ivory/ink/sage palette and screen direction are in docs/18-DESIGN-AND-AWS.md.
- Photon is deferred until all core gates pass and demo/submission preparation is covered.

## Current gate
Framework/specification preparation is complete for this task; G1 implementation has not started. Git is initialized, but there is no first commit or application. Two coding subagents contributed documentation, task briefs, and helper verification during preparation; no application workers are currently assigned.

## Dispatch queue
All implementation tasks are `planned`; proposed worktrees, ports, and file ownership become final in G1-00. No app verification has run.

| Task | GitHub issue | Owner at dispatch | Dependency |
| --- | --- | --- | --- |
| G1-00 foundation | [#1](https://github.com/esaba12/conversaton-practice/issues/1) | Coordinator | Reviewed committed baseline and supported hosting/runtime choice |
| G1-01 auth/session | [#2](https://github.com/esaba12/conversaton-practice/issues/2) | Worker 1 | Integrated foundation and frozen contracts |
| G1-02 voice | [#3](https://github.com/esaba12/conversaton-practice/issues/3) | Worker 2 | Integrated foundation and frozen contracts |
| G1-03 UI | [#4](https://github.com/esaba12/conversaton-practice/issues/4) | Worker 3 | Integrated foundation and frozen contracts |
| G1-04 integration | [#5](https://github.com/esaba12/conversaton-practice/issues/5) | Coordinator | Reviewed worker changes; real accounts for live acceptance |

Task briefs are in docs/tasks/. Coordinator may integrate/test independently while waiting on account actions; no live gate can pass without actual evidence. No G1-G5 gate has passed.
The five open issues belong to [the G1 milestone](https://github.com/esaba12/conversaton-practice/milestone/1). Their bodies explicitly state that implementation is planned and the spec/task files await the first push. Update that note when the files are actually on GitHub.

## Selected Git remote
- User selected `git@github.com:esaba12/conversaton-practice.git`.
- GitHub API verified `esaba12/conversaton-practice` exists, is public, and reports size 0 with default branch `main`.
- Reverified authenticated GitHub API access, including repository push permissions. Created milestone 1 and issues #1-#5 successfully through the API. GitHub access works even though local `.git` writes remain restricted.
- Current local verification: initialized repository on `main`, correct SSH `origin`, no commits, and only the original checkout in `git worktree list`. This supersedes the earlier failed initialization attempt. Do not rerun init/remote-add.
- Project files are untracked. No commit, additional worktree, or push was created during this framework task. This session cannot write project Git metadata; review and create the first commit in the normal terminal before using the helper.
- `bash tooling/worktree.sh <task-id> [base-ref] [--dry-run]` is prepared. It requires a clean committed baseline containing the task record. `.worktrees/` is ignored.

## Tooling completed and blocked
- Existing: Codex CLI 0.160.0, Codex VS Code extension, GitHub/Supabase/Vercel CLIs, Prettier, Codex browser tooling, shadcn skill.
- Final preflight verified Node v20.19.4, npm 11.5.1, Codex 0.160.0, GitHub CLI 2.91.0, and Homebrew availability. Foundation still selects a supported app runtime; do not interpret the installed Node version as a frozen deployment choice.
- Installed: Context7 MCP 4.1.1 under tooling/codex, pinned in package.json/package-lock.json. Local MCP startup and expected tool discovery passed. Its remote documentation retrieval was not tested.
- Staged: official ElevenLabs agents and Vercel web-design-guidelines skills with pinned upstream revisions; not yet active/discoverable.
- Verified via direct HTTP: OpenAI Docs and AWS Knowledge MCP each returned tool lists and successful documentation search results. They are not registered in this Codex session.
- Blocked: Codex settings and project `.agents` are protected from writes; VS Code extension installation also encountered a marketplace DNS failure. No automatic approval review rejection occurred; these were command-level sandbox/network failures.
- Ready for the normal terminal: `bash /Users/ethansaba/code/therapist/tooling/finish-setup.sh`. It activates staged skills, registers the three documentation MCPs, and installs ESLint/Tailwind IntelliSense. Existing configs are preserved. Syntax and dry-run checks passed. See tooling/README.md.
- AWS CLI is not currently on PATH. No AWS administration MCP or account permissions have been configured.
- Pre-reset recheck: no `.env.local`, staged skill copies not activated, and OpenAI Docs/Context7/AWS Knowledge are not registered. No credential values were inspected. `finish-setup.sh --dry-run --skip-editor` and shell syntax passed again.
- Added: guarded task-worktree helper, optional staged Warp Codex/checks tab config, multiagent runbook, documentation standard, task template, and five G1 briefs. Warp config is not installed or UI-tested; see tooling/README.md.
- Added locally: `.github/pull_request_template.md` and `.github/ISSUE_TEMPLATE/task.md`. Templates await the first push; CI is assigned to G1-00 once real app scripts exist. No PR or Actions run has been created yet.

## Verification
Preparation evidence and contributor handoff: [PREP-01](docs/tasks/PREP-01-agent-workflow.md). Documentation link/format/P/T checks and final independent contract/ownership review passed after fixes.

Tool installation/smoke checks and documentation/helper verification only. npm previously reported zero vulnerabilities for the tool package installation. Shell syntax and isolated temporary-repository helper checks passed: clean creation, no-mutation dry-run, dirty baseline, invalid task/base, absent task record, symlink/unignored directory, duplicate path/branch, and linked-checkout refusal. Warp TOML parsing/static structure passed; no Warp UI test. Actual project helper correctly refuses until the first commit. No application typecheck/build, real audio checks, authentication tests, owner-isolation tests, or cloud account verification have been performed; the app does not exist yet.

## Outstanding decisions and dependencies
- ElevenLabs account/access is needed for the first real audio test.
- Structured-output provider access is needed for situation generation; OpenAI remains the selected default.
- AWS access, region, sign-in method, and database configuration are needed. Confirm eligible services/expiry for the user's credits; no cost estimate is verified.
- Amplify's current official docs list native Next.js support through 15. Select a patched supported version or a verified alternate AWS hosting path before scaffolding. Next DevTools MCP needs 16+ and is deferred.
- Public hosting versus supervised local/private judging demo remains undecided.
- Sponsor credits, prize stacking, and actual provider models/voices remain unverified.

## Next implementation task
Review and commit the baseline in the normal terminal, then complete G1-00 foundation: choose the supported AWS hosting/runtime/auth path, scaffold once, pin dependencies, and freeze contracts/ownership. Dispatch G1-01/02/03 in parallel, then integrate G1-04. G1 requires sign-in, durable owner-scoped identity/session limits, one real fictional-roommate voice conversation, and teardown even on sign-out/expiry or failed End requests. G2 adds generated setup from an unfamiliar user situation. Follow docs/10-BUILD-PLAN.md; preserve the submission buffer.
