# PREP-01: Prepare the solo builder's multiagent workflow

Status: review — prepared and checked locally; first Git commit pending
Updated: October 3, 2026, America/Detroit
Assigned writer/coordinator: `/root`
Contributors: `/root/spec_audit` (docs/tasks/review), `/root/workflow_review` (workflow/helper/Warp verification)
Gate: preparation; no product gate passed
Requirements/tests: development workflow and specification consistency; application P/T evidence remains not-run

## Assignment and outcome

- Working directory: `/Users/ethansaba/code/therapist`, original `main` checkout.
- Base/revision: uncommitted; repository has no HEAD. No task branch/worktree or app server created.
- Coordinator owned existing project instructions/specs/status and integration of preparation changes. Agents wrote disjoint new docs and tooling paths; no concurrent writer overlap.
- Added docs/19, docs/20, the task template and five G1 briefs; updated affected product/API/data/evaluation/build/handoff documents and the README index.
- Added `tooling/worktree.sh`, `tooling/warp/task-codex.toml`, usage instructions, and ignore rules for worktrees/local artifacts.
- Shared foundation precedes parallel auth/session, voice, and UI workers; one coordinator integrates and maintains shared specs/STATUS.
- Corrected G1's minimal durable storage prerequisite, sign-in coverage, lifecycle/connection acknowledgement, provider ID trust boundary, memory removal semantics, optional reflection, and Photon gate wording.

## Verification evidence

All checks used the uncommitted preparation files. No app package, cloud resources, or live app integration exists.

| Check | Mode/outcome | Actual execution and limits |
| --- | --- | --- |
| Shell syntax | static/pass | `bash -n tooling/worktree.sh tooling/finish-setup.sh`, exit 0 in original checkout |
| Original repository guard | static/pass | `bash tooling/worktree.sh G1-02-voice --dry-run` returned expected exit 1: no committed baseline; no worktree created |
| Isolated Git fixture | unit/pass | Workflow worker ran a one-off Python subprocess harness under `/private/tmp/rehearsal-worktree-fixture-*`; exit 0, 13 passing groups; see below |
| Warp template | static/pass | Python `tomllib` parsed the file and asserted horizontal split, two panes, directory-only worktree parameter, and Codex/git-status commands; exit 0. Not installed or UI-tested |
| Documentation checks | static/pass | Coordinator's inline Python check enumerated root Markdown, tooling README, and docs; checked local Markdown targets exist, paired fences, trailing whitespace, valid G1 P/T references, and planned/not-run G1 state; exit 0 |
| Contract/ownership review | static/pass | Spec reviewer inspected current docs and task paths; identified connection acknowledgement and provider-ID trust gaps, then verified coordinator fixes. No remaining blocking contradiction found in targeted review |
| Application checks | not-run/not-run | No application typecheck/build, account validation, auth/database isolation, or live voice test |

Date for all entries: October 3, 2026, America/Detroit. Exact wall-clock time for the worker fixture was not captured. The coordinator's verification ran around 12:42 PM in the original checkout. Fixture evidence is agent-reported, not a claim about the actual application's integrations.

The fixture copied the current helper into a temporary repository with spaces in its path, initialized and committed synthetic task records, and checked invalid task IDs, unborn repository refusal, no-mutation dry-run (identical file hashes/no branch/no directory), dirty tracked/untracked state, missing task/invalid base, symlink/unignored worktree root, successful branch/worktree creation, duplicate branch/path, and linked-checkout refusal. It removed its generated worktree/branches and temporary directory. The ad hoc harness was not retained as an application test suite.

## Handoff

GitHub follow-up, October 3: user explicitly requested frequent GitHub use. Verified authenticated access and created [G1 milestone 1](https://github.com/esaba12/conversaton-practice/milestone/1) plus issues #1-#5 through direct `gh api` calls, each returning its created resource URL. Added local issue/PR templates, standing workflow instructions, issue links in task records, and foundation CI acceptance. Templates/specs remain unpushed; no PR or CI execution is claimed. Initial nested CLI request hit a network error; direct API commands succeeded. Application verification remains not-run.

- First commit, global tool activation, and Warp template installation remain pending; project Git metadata/global settings are protected in this Codex session.
- The selected origin is already configured; do not rerun Git initialization or remote-add.
- Normal-terminal baseline and worktree instructions: [agent workflow](../19-AGENT-WORKFLOW.md). Tool activation/template instructions: [tooling README](../../tooling/README.md).
- Next implementation task: [G1-00 foundation](G1-00-foundation.md). Confirm actual AWS hosting/auth/database choices, scaffold, and freeze contracts before dispatch.
- Coordinator integration revision: pending first commit. No push, cloud provisioning, application build, or live gate success is claimed.
