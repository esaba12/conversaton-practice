# Parallel engineering workflow

Updated October 3, 2026. One human builder directs the project. The user explicitly requested multitasking, worktrees in Warp, and multiple engineering agents where useful. Delegate independent work within the active build gate; keep G1 → G2 → G3 → G4 → G5 ordered. This workflow adds no runtime agent framework to the application.

## Roles and capacity

- **Coordinator:** owns the current gate, task allocation, shared contracts, integration, and the truthful project status. Keep the original checkout as the integration workspace.
- **Workers:** implement bounded tasks in separate worktrees, or review without editing. Use one coordinator plus up to three workers, subject to the actual available runtime slots. Two well-scoped workers are often sufficient.
- **Human builder:** supplies account access and performs required real microphone checks and judging preparation. Agents continue independent work while an external dependency is unresolved.

Use agents when a task can proceed against an agreed interface with distinct file ownership. Keep tiny edits, unresolved contracts, migration execution, and final integration with one owner. In-session subagents share a filesystem unless explicitly assigned another worktree; spawning an agent does not itself provide isolation.

## Starting state and first checkpoint

At this workflow's creation, Git is initialized on `main`, `origin` is `git@github.com:esaba12/conversaton-practice.git`, and no initial commit exists. No application or additional worktree has been created. Check [STATUS.md](../STATUS.md) for subsequent changes.

Before ordinary task worktrees, the coordinator reviews ignored files and the documentation, then creates a clean committed baseline. Do not commit secrets, generated dependency folders, or temporary evidence containing private data. A connected remote does not mean anything has been pushed.

When Git metadata writes are restricted in Codex, the first checkpoint can be completed in the normal Warp terminal from `/Users/ethansaba/code/therapist`:

```bash
git status --short
git add -- .gitignore .github AGENTS.md README.md STATUS.md docs tooling
git diff --cached --stat
git diff --cached --check
```

Review the staged diff, then commit the baseline:
If tool activation already copied the two staged skills into `.agents/skills`, stage those exact directories as well so the checkout stays clean and worktrees receive them: `git add -- .agents/skills/elevenlabs-agents .agents/skills/web-design-guidelines`. See [the complete first-start sequence](21-START-BUILD.md).

```bash
git commit -m "docs: prepare solo multiagent build workflow"
```

These commands are instructions, not evidence of a commit. Do not rerun `git init` or add a duplicate origin. This checkpoint commits preparation only; complete and commit foundation before launching the three implementation workers.

Next complete [G1-00 foundation](tasks/G1-00-foundation.md): choose the supported app/runtime path, scaffold once, install and pin dependencies, define shared types, and establish the minimal durable identity/session/cleanup design. G1 uses verified Supabase Auth user IDs and owner-scoped session/cleanup metadata; the broader profile/persona/memory domain remains G3.

## Task lifecycle

Create each task from [the template](tasks/TEMPLATE.md). Record its gate, dependency, base commit, owner, owned files, accepted interfaces, acceptance criteria, verification, and documentation deliverables before dispatch.

| State | Meaning |
| --- | --- |
| `planned` | Scope exists; dependencies or contracts still need work. |
| `ready` | Dependencies, ownership, and acceptance are clear enough to start. |
| `active` | One named worker is implementing or reviewing it. |
| `blocked` | A concrete dependency prevents that task's next step; record it. |
| `review` | Worker has handed off changes and actual evidence for integration. |
| `integrated` | Coordinator has incorporated the work and checked the combined result. |

An integrated task does not automatically pass its product gate. A mock can support UI development; it cannot establish working authentication, audio, generation, or database isolation. Record unrun checks explicitly.

Workers update only their task record and assigned implementation files. The coordinator owns `STATUS.md`, numbered specifications, dependency manifests/lockfiles, shared-contract changes, migration application, and shared infrastructure. A worker proposing a spec or dependency change includes the exact requested change in its handoff; the coordinator applies it or explicitly assigns temporary ownership before edits.

## Initial G1 allocation

| Task | Scope | Dependency |
| --- | --- | --- |
| [G1-00 foundation](tasks/G1-00-foundation.md) | Scaffold, lockfile, shared identity/session/voice contracts, minimal durable metadata design | First implementation task |
| [G1-01 auth/session](tasks/G1-01-auth-session.md) | Sign-in, server authorization, owner-scoped session and cleanup metadata, server credentials | Integrated foundation and agreed contracts |
| [G1-02 voice](tasks/G1-02-voice.md) | Browser ElevenLabs adapter, connection state, microphone lifecycle | Integrated foundation and agreed credential contract |
| [G1-03 UI](tasks/G1-03-ui.md) | Minimal warm/crisp sign-in and practice UI wired to agreed interfaces | Integrated foundation and agreed component/state contracts |
| [G1-04 integration](tasks/G1-04-integration.md) | Wiring, combined checks, authenticated live conversation, End evidence | Auth/session, voice, and UI ready for integration |

The three middle tasks can run concurrently after foundation. Give each a distinct set of paths. The coordinator owns shared entrypoints and final wiring unless assigned otherwise. When a worker discovers an interface mismatch, send the proposed change to the coordinator before editing another task's files.

## Warp tabs and worktrees

Use ordinary Warp terminal tabs; no custom Warp automation or plugin is assumed. Keep one coordinator tab in the original checkout and one tab per active worker. Name tabs after their task IDs where convenient.

An optional two-pane Warp configuration is staged in [tooling/warp/task-codex.toml](../tooling/warp/task-codex.toml); [installation instructions](../tooling/README.md) open Codex and a checks terminal in an existing worktree. It is statically checked, not installed or UI-tested. Ordinary tabs remain sufficient. This follows Warp's [multiple coding agents guide](https://docs.warp.dev/guides/agent-workflows/how-to-run-multiple-ai-coding-agents) and [Tab Config reference](https://docs.warp.dev/terminal/windows/tab-configs).

From the original checkout, once the baseline is clean and committed:

```bash
bash tooling/worktree.sh G1-02-voice --dry-run
bash tooling/worktree.sh G1-02-voice
git worktree list
```

The helper accepts `bash tooling/worktree.sh <task-id> [base-ref] [--dry-run]`. It creates a unique `agent/<task-id>` branch in ignored `.worktrees/<task-id>`. Use the coordinator's agreed base commit when passing `base-ref`; record the resolved commit in the task. The helper requires a clean committed baseline. A dry run reports the proposed operation and is not evidence that a worktree exists.

In the worker's Warp tab:

```bash
cd /Users/ethansaba/code/therapist/.worktrees/G1-02-voice
git status --short --branch
codex
```

Give the agent this bounded instruction, with the actual task path:

> Read AGENTS.md, STATUS.md, README.md, docs/01-PRD.md, the active gate in docs/10-BUILD-PLAN.md, and docs/tasks/G1-02-voice.md. Implement only this task in this worktree. Respect file ownership and agreed contracts. Update your task record with actual checks, limitations, and the integration handoff. Report shared-contract changes before making them.

Do not start another writer in the same worktree. Read-only reviewers may examine the committed task diff independently. If filesystem restrictions prevent Git metadata writes, record the actual failed operation and run the prepared command from the normal terminal; do not report a planned checkout as created.

Git's [official worktree documentation](https://git-scm.com/docs/git-worktree) explains linked worktrees and their shared repository metadata. Installed `git worktree -h` is the reference for supported local flags.

## Resource isolation

| Resource | Rule |
| --- | --- |
| Git files | One writer per worktree; one branch per task. Preserve another worker's changes. |
| Packages/build output | Each worktree installs from the committed app lockfile with `npm ci`. Do not share `node_modules`, `.next`, or test output folders. Foundation must create the app lockfile first. |
| Local ports | Assign and record distinct ports for running servers, such as 3000/3001/3002. Record the actual URL; a planned port is not a running server. |
| Auth redirects | Confirm each tested origin has the intended Supabase Auth redirect configuration. A different worktree port does not automatically support live sign-in. |
| Environment | Use ignored per-worktree `.env.local` or the established secure environment. Commit placeholders only in `.env.example`; never copy secrets into tasks or chats. |
| Database | Coordinator applies one reviewed migration sequence. Workers author only assigned migration files; do not run competing schema changes against the same database. |
| Shared test data | Use fictional fixtures and separate test identities. Scope cleanup to the task's records; never clear shared demo data as test setup. |
| Provider assets | Coordinator owns shared ElevenLabs agent settings, Supabase Auth configuration, database policies, and deployment settings. Worktrees do not isolate remote assets. Request a concrete configuration change through the task handoff. |
| Browser/audio | Keep test contexts and recordings separate. Only one scheduled live microphone test should control the demo device at a time. |

Record resource assignments in the task, without credentials. Stop the task's own server when finished; identify its process instead of killing every process on a guessed port. Shared configuration and cloud changes stay within the user's authorized build scope.

## Parallel work by later gate

| Gate | Independent work after contracts settle | Sequential boundary |
| --- | --- | --- |
| G2 | Structured setup adapter; preparation/review UI; context/privacy review | Freeze draft and role-context schemas first. Integrate real generation, review, interruption, and fresh-session behavior before G3. |
| G3 | Owner-scoped repositories/approval transaction; profile/proposal UI; isolation/version tests | One migration owner/executor. Integrate approval atomically with version checks before accepting persistence. |
| G4 | Reflection adapter/UI; deletion adapter; retention/disclosure review | Agree session/deletion states first. Coordinator resolves late-result races and verifies actual provider status. |
| G5 | Focused domain checks; browser/accessibility checks; demo/documentation review | Check a recorded integrated revision. Human live audio checks remain required; integrate fixes individually. |

When a core gate fails, prioritize repairing it. A waiting worker may research a forthcoming dependency or review current work, but should not implement stretch features or later-gate scope to stay busy. Photon remains deferred.

## Integration checkpoint

1. Worker reviews its diff, runs task-relevant checks, and updates its task record under the [documentation standard](20-DOCUMENTATION-STANDARD.md). Include changed behavior, files, exact commands/outcomes, live checks, limitations, and proposed spec updates.
2. Worker stages explicit owned paths, creates a focused task commit, pushes its branch, and opens/updates the linked draft PR. Do not use blanket staging when unrelated changes exist. If committing/pushing is blocked, hand off the exact working diff and limitation instead.
3. Coordinator reviews implementation, privacy boundaries, acceptance evidence, and documentation. Resolve shared-contract changes before integrating consumers; assign a single conflict owner.
4. From a clean integration checkout, integrate one reviewed PR at a time after its applicable checks pass, then synchronize the local integration branch and inspect the result. A local merge is a fallback if GitHub is unavailable; record it and reconcile the PR later. Do not silently resolve conflicts by replacing another worker's work.
5. Run type checking, relevant unit tests, and production build after meaningful integration. Run the required live checks for the gate. Passing tests in separate branches do not prove their combined behavior.
6. Mark the task `integrated`, record the resulting revision and evidence, and update affected specs plus `STATUS.md`. Mark the gate passed only when its full acceptance is observed.
7. Send the next worker the new base revision and any changed contracts. Resume parallel work only after ownership is clear.

If a check fails, record the failure and smallest repair task. Keep useful completed work; do not mark failed or skipped verification as passed. Avoid repeating a passed check without a new change or concrete remaining risk. Follow [evaluation requirements](09-EVALUATION.md) for the live/mock distinction.

## GitHub as the task and review hub

The user explicitly requests frequent use of [the connected repository](https://github.com/esaba12/conversaton-practice). Create one issue per bounded task, group current-gate work under a milestone, and reuse the task ID in its branch/PR. Search existing issues and PRs first. Each task record carries its issue/PR links; keep detailed specs and evidence in the repository rather than copying whole documents into comments.

Use draft PRs for reviewable work in progress. Push focused commits at meaningful checkpoints, include affected docs, and use the [PR template](../.github/pull_request_template.md). Summarize behavior, checks actually run, pending live checks, and integration dependencies. Link `Refs #N` while acceptance is still pending; use a closing reference only when the PR satisfies the issue. Worker reviews and CI results inform coordinator integration; they do not replace the required human/live microphone checks.

G1 foundation adds GitHub Actions only after app scripts and the lockfile exist. Run typecheck, relevant deterministic tests, and production build on PRs; keep live provider credentials out of ordinary PR checks. Record run URLs and results. Until the workflow is committed and runs, CI is pending. The current preparation templates are local until the first push.

At each handoff, update the existing issue with meaningful status/dependency changes and link the task record/PR. Close a task issue only when its acceptance is complete; close the gate milestone only after actual gate evidence. Do not create placeholder PRs against an empty repository or repeatedly post unchanged status.

## Finishing and resuming

Before removing a worktree, confirm its commits were integrated and inspect for needed tracked, untracked, and ignored local files. Preserve needed local configuration/evidence securely. Stop its server, then use `git worktree remove <path>`; do not force removal to bypass unresolved changes. Branch cleanup can wait until the work is safely integrated.

At a break or restart, read `STATUS.md`, the active task records, and the current gate. Check Git/worktree state rather than assuming previous commands succeeded. The coordinator records the next smallest task, active worker ownership, external blocker, and latest verified integration revision. Workers report only what they actually completed.

Keep documentation useful during the build: contracts explain expected behavior; task records capture implementation evidence; `STATUS.md` tells the next agent where to resume. Use [the documentation standard](20-DOCUMENTATION-STANDARD.md) as each task's completion check.
