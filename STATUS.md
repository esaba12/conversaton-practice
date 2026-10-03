# Project status

Updated October 3, 2026, America/Detroit (public preview deployed; application G1 not started).

## Restart handoff
Latest user instruction: **check access and document only, then stop for context reset**. This request is complete. No build/resource creation or live call was started. Read [PREP-03 access evidence](docs/tasks/PREP-03-access-check.md) before repeating setup.

Latest setup direction: the user confirms credits for **Tavus and ElevenLabs** and requests setup guidance. Proceed with Tavus CVI plus explicitly selected ElevenLabs TTS as the first integration route. Tavus manages the live conversation; ElevenLabs provides speech. This replaces LiveAvatar/ElevenLabs Agents as the current setup path, not as a claim of a tested integration. All five environment values are now present. Read-only Tavus faces, ElevenLabs voices, OpenAI models, and Supabase Auth health/settings checks returned HTTP 200. Credit balances, paid generation, and live calls remain untested. See docs/tasks/PREP-03-access-check.md. Follow docs/21-START-BUILD.md; no LiveAvatar account or separate ElevenLabs Agent is needed for this route. Before freezing worker contracts, revise the older connector-specific architecture/task details to Tavus; do not combine both pipelines.

Confirmed core product: **FaceTime-style practice with a visible, talking fictional AI counterpart** is the main draw. Real responsive synchronized video is mandatory in G1; voice-only, static portraits, and prerecorded replies cannot pass. The interaction is settled; do not ask again. Specs and GitHub issues #1-#5 now reflect it. Read docs/22-LIVE-VIDEO.md. Tavus CVI + ElevenLabs TTS is the current integration route; API access and live behavior remain unverified. Sign-in, generated editable setups, and Supabase remain selected.

Latest decision: use **Supabase Auth + PostgreSQL** because AWS credits cannot arrive in time. The user supplied fresh project `rcktybngebovyopregnt` and its publishable key. Configuration is saved in the Git-ignored `.env.local`; the Auth health endpoint returned HTTP 200. Database administration, sign-in, and ownership policies remain untested; no existing database is being reused. Keep sign-in required. Skip AWS CLI/login, Cognito, Aurora, and credit-application setup.

The earlier quick public website request is complete at https://conversation-practice-site.vercel.app. Source is in `website/`; details/evidence are in docs/tasks/PREP-02-public-website.md and [GitHub issue #6](https://github.com/esaba12/conversaton-practice/issues/6). The AWS credits application is no longer a build dependency. This is a static product preview, not the authenticated voice application. No G1 acceptance is implied.

The user is ready to start building after clearing context. Follow [the final startup checklist](docs/21-START-BUILD.md), recheck what actually ran, then begin G1-00 / GitHub issue #1. The baseline commit and project skills now exist; application scaffolding has not started.

Project directory: /Users/ethansaba/code/therapist. The development-agent framework and specs support one human with parallel coding agents and Warp worktrees. A standalone public landing page is deployed on Vercel. Authenticated app implementation and Supabase integration have not started.

To resume, read this file, AGENTS.md, README.md, docs/01-PRD.md, docs/10-BUILD-PLAN.md, docs/19-AGENT-WORKFLOW.md, and the assigned task record. The next implementation task is docs/tasks/G1-00-foundation.md. docs/18-DESIGN-AND-AWS.md retains its historical filename but now describes Supabase. Do not repeat product discovery or reintroduce a name.

Account setup order: the user's fresh Supabase project for Auth/minimal PostgreSQL session/cleanup storage, plus conversation/avatar provider access for authenticated live video G1; OpenAI for G2 generation; broader profiles/personas and memory persistence in G3. Provider read access is verified; live integration, inference, and migration access remain untested. No credentials are stored here.

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
- Supabase Auth/PostgreSQL is selected again; the user supplied a fresh project. Owners use verified auth.users.id with RLS and atomic database operations. AWS is superseded. Vercel is the recommended app host; only the public static preview is deployed.
- Visual direction confirmed: warm and minimal, but crisp and modern. Proposed ivory/ink/sage palette and screen direction are in docs/18-DESIGN-AND-AWS.md.
- Photon is deferred until all core gates pass and demo/submission preparation is covered.

## Current gate
G1 implementation has not started. Product, media, privacy, evaluation, startup docs, and five task briefs now require live video. Provider-specific interfaces still need the bounded live feasibility check before dispatch; the interaction itself is confirmed. Git main and remote main now match `4dc34a1` (video architecture/setup docs). The repository was clean before this access-check documentation update. Public static site deployment is complete. No application workers are currently assigned.

## Dispatch queue
All implementation tasks are `planned`; proposed worktrees, ports, and file ownership become final in G1-00. No app verification has run.

| Task | GitHub issue | Owner at dispatch | Dependency |
| --- | --- | --- | --- |
| G1-00 foundation | [#1](https://github.com/esaba12/conversaton-practice/issues/1) | Coordinator | Reviewed committed baseline and supported hosting/runtime choice |
| G1-01 auth/session | [#2](https://github.com/esaba12/conversaton-practice/issues/2) | Worker 1 | Integrated foundation and frozen contracts |
| G1-02 media | [#3](https://github.com/esaba12/conversaton-practice/issues/3) | Worker 2 | Integrated foundation and frozen contracts |
| G1-03 UI | [#4](https://github.com/esaba12/conversaton-practice/issues/4) | Worker 3 | Integrated foundation and frozen contracts |
| G1-04 integration | [#5](https://github.com/esaba12/conversaton-practice/issues/5) | Coordinator | Reviewed worker changes; real accounts for live acceptance |

Task briefs are in docs/tasks/. Coordinator may integrate/test independently while waiting on account actions; no live gate can pass without actual evidence. No G1-G5 gate has passed.
The five open issues belong to [the G1 milestone](https://github.com/esaba12/conversaton-practice/milestone/1). Implementation is planned; the user pushed the latest setup baseline in `4dc34a1`; only this access-check documentation update remains local.

## Selected Git remote
- User selected `git@github.com:esaba12/conversaton-practice.git`.
- GitHub API verified `esaba12/conversaton-practice` exists and is public, with default branch `main`.
- Reverified authenticated GitHub API access, including repository push permissions. Created milestone 1 and issues #1-#5 successfully through the API. GitHub access works even though local `.git` writes remain restricted.
- Current local/remote verification: `main` at `4dc34a1` (video architecture/setup docs), tracking origin/main, with the correct SSH origin. The user completed the baseline after the earlier preflight. Do not rerun initialization or first-commit instructions.
- The user committed/pushed the website and setup handoff; the static website was separately deployed with Vercel CLI. This access-check report/handoff is newly local and uncommitted. This session still cannot write project Git metadata.
- `bash tooling/worktree.sh <task-id> [base-ref] [--dry-run]` is prepared. It requires a clean committed baseline containing the task record. `.worktrees/` is ignored.

## Tooling completed and blocked
- Existing: Codex CLI 0.160.0, Codex VS Code extension, GitHub/Supabase/Vercel CLIs, Prettier, Codex browser tooling, shadcn skill.
- Final preflight verified Node v20.19.4, npm 11.5.1, Codex 0.160.0, GitHub CLI 2.91.0, and Homebrew availability. Foundation still selects a supported app runtime; do not interpret the installed Node version as a frozen deployment choice.
- Installed: Context7 MCP 4.1.1 under tooling/codex, pinned in package.json/package-lock.json. Local MCP startup and expected tool discovery passed. Its remote documentation retrieval was not tested.
- Active in this session: official ElevenLabs agents and Vercel web-design-guidelines skills, after the user's setup. The latest setup dry run also found existing OpenAI Docs and Context7 MCP configurations; remote queries through those configured connections were not retested.
- Earlier direct HTTP checks: OpenAI Docs and AWS Knowledge MCP each returned tool lists and successful documentation search results. AWS Knowledge is optional.
- Blocked: Codex settings and project `.agents` are protected from writes; VS Code extension installation also encountered a marketplace DNS failure. No automatic approval review rejection occurred; these were command-level sandbox/network failures.
- Ready for the normal terminal if activation remains incomplete: `bash /Users/ethansaba/code/therapist/tooling/finish-setup.sh`. It preserves matching installed skills, registers OpenAI Docs/Context7, and installs ESLint/Tailwind IntelliSense. Existing configs are preserved. See tooling/README.md.
- AWS CLI/account setup is no longer required. The finish script now registers OpenAI Docs and Context7 only; optional existing AWS Knowledge configuration is left untouched.
- Supabase CLI is present, but even its version command was blocked by a write to protected `~/.supabase/telemetry.json`; no project listing or account check completed. This is a local tool restriction, not evidence that the user's Supabase login failed.
- Supabase URL/publishable key are saved in `.env.local` with owner-only file permissions; `git check-ignore .env.local` passed. All three private provider keys are now present locally; authenticated read-only requests passed without displaying their values. The earlier unactivated-skill result was superseded by the user's setup: both project skills are now active.
- Added: guarded task-worktree helper, optional staged Warp Codex/checks tab config, multiagent runbook, documentation standard, task template, and five G1 briefs. Warp config is not installed or UI-tested; see tooling/README.md.
- Added `.github/pull_request_template.md` and `.github/ISSUE_TEMPLATE/task.md` to the baseline. CI is assigned to G1-00 once real app scripts exist. No PR or Actions run has been created yet.

## Verification
October 3 at 13:45 America/Detroit: [PREP-03](docs/tasks/PREP-03-access-check.md) records successful read-only provider checks and GitHub access. Supabase CLI still fails on protected local telemetry; it did not reach a project-list result. No paid generation or application verification was run.

Video-scope revision: three coding agents handled product/evaluation specs, task briefs, and official provider research with separate ownership. GitHub issues #1-#5 and milestone #1 were updated successfully. Local links/code fences passed across 37 Markdown files, and `git diff --check` passed. Independent review found a foundation/worker dependency cycle; docs/22 now separates the isolated provider feasibility harness from full authenticated G1-04 acceptance. No application or live video tests have run. Latest source changes remain uncommitted.
Preparation evidence and contributor handoff: [PREP-01](docs/tasks/PREP-01-agent-workflow.md). Documentation link/format/P/T checks and final independent contract/ownership review passed after fixes.

After the fresh Supabase decision: updated GitHub issues #1-#5 and active backend/startup/task contracts. Shell syntax, setup dry run, `git diff --check`, and local links/code fences across 36 Markdown files passed. No settings were changed by the dry run. Latest local edits still need committing.

Tool installation/smoke checks and documentation/helper verification only. npm previously reported zero vulnerabilities for the tool package installation. Shell syntax and isolated temporary-repository helper checks passed: clean creation, no-mutation dry-run, dirty baseline, invalid task/base, absent task record, symlink/unignored directory, duplicate path/branch, and linked-checkout refusal. Warp TOML parsing/static structure passed; no Warp UI test. The first commit now exists; a clean committed baseline is still required before creating worktrees. No application typecheck/build, real audio checks, authentication tests, owner-isolation tests, or cloud account verification have been performed; the app does not exist yet.

## Outstanding decisions and dependencies
- Tavus and ElevenLabs credits are user-confirmed. Their API keys and the OpenAI key are present; read-only provider access passed. No PAL, provider key transfer, SDK install, or live call has been performed. Verify the Tavus/ElevenLabs TTS integration, per-session context, private-room authorization, interruption, and teardown before freezing vendor contracts.
- Structured-output provider access is needed for situation generation; OpenAI remains the selected default.
- Fresh Supabase project configuration is saved and Auth health returned HTTP 200. Migration/admin access, real sign-in, and owner isolation still need verification; no service-role key is required for ordinary user requests.
- Select supported Node/Next.js versions for the recommended Vercel deployment during foundation. The former Amplify version constraint no longer applies.
- Public hosting versus supervised local/private judging demo remains undecided.
- Sponsor credits, prize stacking, and actual provider models/voices remain unverified.

## Next implementation task
Begin G1-00 foundation and the live-video feasibility checklist in docs/22-LIVE-VIDEO.md. Auth/database scaffolding and labeled UI development can proceed while provider account access is pending. Do not replace the required video experience with audio-only practice.

The website/setup baseline is committed. After the user starts the build, preserve/commit this access-check documentation and complete G1-00 foundation: scaffold the Next.js app with Supabase Auth/PostgreSQL, pin dependencies, and freeze contracts/ownership. The baseline already exists. Fresh Supabase configuration is available in `.env.local`; verify migration access during foundation. Continue independent work while remaining provider access is pending. After the shared media contracts are verified and frozen, dispatch G1-01/02/03 in parallel, then integrate G1-04. G1 requires sign-in, durable owner-scoped sessions, a responsive synchronized AI video call, and complete media teardown even on auth loss or failed End requests. Follow docs/10-BUILD-PLAN.md; preserve the submission buffer.
