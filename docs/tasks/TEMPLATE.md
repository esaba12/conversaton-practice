# <task-id>: <concrete outcome>

Status: planned | ready | active | blocked | review | integrated
Updated: <date/time/timezone>
Assigned writer: <agent/session name>
Coordinator: <agent/session name>
Gate: <G1-G5 or preparation/submission>
Requirements/tests: <Pxx, Txx; named browser/live checks; explain N/A>
GitHub issue: <URL>
Pull request: <URL or not opened>
CI run: <URL and outcome, or not run>

## Assignment and isolation

- Base ref + full SHA: <ref, SHA; uncommitted if no repository>
- Branch: <branch>
- Worktree: <absolute path>
- Dev port: <port or N/A>
- Owned files: <exact paths; enumerate before starting>
- Shared resources: <schema/lockfile/migrations/provider/database/browser; owner or N/A>
- Dependency tasks and contract revisions: <IDs, refs/SHAs, required outputs>
- Unblock condition: <exact missing dependency/action, or none>

## Scope and acceptance

Outcome: <what changes for the user or consuming module>
Non-goals: <only scope boundaries needed for this task>

- [ ] <observable acceptance criterion; P/T ID and gate>
- [ ] <observable acceptance criterion; P/T ID and gate>

## Contract and documentation changes

- Inputs/outputs/errors and relevant ownership/privacy boundary: <summary or spec link>
- Shared change: <owner/coordinator agreement, affected consumers, revision; or none>
- Updated specs/setup/API/environment/schema runbooks: <paths or justified N/A>
- Decision/source: <existing decision entry or official source/date, when needed>

## Verification evidence

Copy this compact entry for each relevant check; mode and outcome are separate.

- Date/time/timezone: <timestamp>
- Gate and requirement/test IDs: <IDs>
- Mode: <not-run | static | unit | mock | live>
- Outcome: <not-run | pass | fail | blocked>
- Tested commit/dirty state: <full SHA plus uncommitted changes, or uncommitted>
- Environment + working directory: <local/CI, runtime/browser/provider versions, path>
- Exact command or manual steps: <command/steps; identify human-reported evidence>
- Exit code: <number, not-run, or N/A for manual observation>
- Observed result/artifact: <concise fact and safe path; no private data>
- Limitations: <what remains unverified>

## Handoff

- Changed paths and commit(s): <paths, SHAs>
- Remaining failures/risks: <specific gap or none>
- External account action: <exact action or none; no secrets>
- Next smallest task: <action and responsible owner>
- Ready for review: <yes/no; dependencies and evidence complete?>
- Coordinator integration: <pending, or integrated SHA/date and verification reference>

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
