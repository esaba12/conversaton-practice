# Documentation standard

Documentation is part of each task, updated with the behavior it describes. One human
builder coordinates multiple coding agents; documentation should make their work
reviewable without another discovery session. Follow [the agent workflow](19-AGENT-WORKFLOW.md).

## Source of truth

Latest explicit user decisions take precedence. Resolve a conflict in the affected
specification before implementing against a competing interpretation.

| Question | Authoritative project record |
| --- | --- |
| Project rules and current state | `../AGENTS.md`; coordinator-owned `../STATUS.md` |
| Product decisions and requirements | `00-DECISIONS-AND-VIABILITY.md`, `01-PRD.md` |
| Experience and visual direction | `02-UX.md`, `18-DESIGN-AND-AWS.md` |
| Module boundaries and authentication | `03-ARCHITECTURE.md` |
| Ownership, storage, approval, deletion | `04-DATA-AND-MEMORY.md` |
| Application request/response contracts | `05-API-AND-ACTIONS.md` |
| Voice integration and prompt boundaries | `06-ELEVENLABS.md`, `07-PROMPTS.md` |
| Privacy and safety requirements | `08-SAFETY-AND-PRIVACY.md` |
| Test definitions and gate order | `09-EVALUATION.md`, `10-BUILD-PLAN.md` |
| Work still open after G5 | `29-REMAINING-WORK.md` and `tasks/POST-01` through `tasks/HOST-01` |
| Snapshot for the next planning agent | `next/README.md` |
| One-moment retry (decided, not built) | `00-DECISIONS-AND-VIABILITY.md`, `30-ONE-MOMENT-RETRY.md` |
| Post-submission plan (decided items not built) | `00-DECISIONS-AND-VIABILITY.md`, `31-PRODUCT-VISION.md`, `32-FEATURE-SPECS.md`, `33-DESIGN-SYSTEM-AND-SCREENS.md` |
| Wow pass: experience target, build plan, proposed contracts, new specs, UI upgrade (planned) | `next/01-THE-WOW.md` through `next/06-KICKOFF-PROMPT.md`; research `research/R07-UI-CRAFT.md` |
| Submission and event strategy | `11-DEMO-AND-SUBMISSION.md`, `16-MHACKS-STRATEGY.md` |
| Tool setup and external evidence | `12-CODEX-SETUP.md`, `13-TOOL-RESEARCH.md`, `14-SOURCES.md`, `../tooling/README.md` |
| Restart instructions | `15-HANDOFF.md`, with live progress in `../STATUS.md` |
| Deferred text extension | `17-PHOTON-TEXT-PRACTICE.md` |
| Agent coordination and task evidence | `19-AGENT-WORKFLOW.md`, `tasks/<task-id>.md` |

Paths in this table are relative to `docs/` unless indicated. README is an index and
entry point, not a second progress log. Specs describe required behavior; installed
types and implementation establish actual interfaces; task evidence records what
has been verified. Disagreement is a defect to resolve, not permission to invent results.

## Records and ownership

- The coordinator alone edits `STATUS.md`, assigns ownership, and accepts integrated gates.
- Each assigned writer maintains its own task record using [the template](tasks/TEMPLATE.md).
- Link the task's GitHub issue, PR, and applicable CI run. GitHub tracks dispatch/review; repository specs and task evidence retain the detailed contract and verification. Update both at meaningful handoffs without duplicating full documents.
- Claim exact paths and shared resources before editing. Name migration order,
  provider agent/configuration, database, browser session, or port when shared.
- A task records its gate, applicable P/T requirement and test IDs, dependency tasks,
  base ref and SHA, branch, worktree, and port. Use `N/A` with a reason when appropriate.
- Task states: `planned`, `ready`, `active`, `blocked`, `review`, `integrated`.
  `ready` requires accepted scope and dependencies; `review` means ready for integration
  review; only the coordinator records `integrated` after actual integration.
- A blocked task names the dependency and exact unblock condition. Continue independent
  authorized work when possible; do not change the product scope to hide a blocker.
- Keep each record short: current contract, outcome, evidence, risk, next action.
  Replace stale summaries instead of accumulating transcripts of the work.

## Shared contract changes

1. Identify the current owning task and all consumers before changing shared schemas,
   auth/session types, adapter interfaces, routes, migrations, or environment variables.
2. Propose the smallest change with inputs, outputs, failure behavior, ownership,
   privacy implications, affected P/T IDs, and migration/compatibility impact.
3. The coordinator assigns one writer and notifies affected agents. Dependent work
   waits for the accepted contract or continues against an explicitly labeled mock.
4. Update the authoritative spec and shared types together; communicate the resulting
   commit/ref. Consumers record which contract revision they used.
5. Integrate and run relevant boundary checks before retiring the previous contract.
   A worker's isolated passing checks do not establish an integrated gate pass.

## Documentation that accompanies a behavior change

| Change | Required update |
| --- | --- |
| User-visible behavior or acceptance | PRD/UX and applicable evaluation IDs |
| API or adapter | Contract, validation, auth, errors, retry/idempotency, affected consumers |
| Data model or migration | Data spec, version/ownership behavior, migration order and recovery steps |
| Configuration or environment | Setup/runbook and safe example names; required/optional and server/client scope |
| Provider integration | Verified SDK version/types, official source, account prerequisite and actual limitation |
| Privacy, retention, deletion, teardown | Relevant boundary spec, user disclosure, test evidence |
| Development or deployment command | Runnable setup/runbook command and required working directory |

Update only affected documents. A small fix may need only its task evidence and one
specification correction. Record consequential decisions with rationale in the existing
decision document; link to it rather than copying the explanation across every file.
New configuration examples contain placeholders, never credentials. Do not add unused
environment variables or operational steps for a merely proposed integration.

## Evidence, not implied success

Record execution mode separately from outcome:

- Mode: `not-run`, `static`, `unit`, `mock`, or `live`.
- Outcome: `not-run`, `pass`, `fail`, or `blocked`.
- `mock/pass` verifies only the exercised simulated behavior. It never proves real
  authentication, provider audio quality, account configuration, or database isolation.
- `live/pass` requires actual observation against the named real integration. Attribute
  human-reported observations explicitly; do not present them as agent-observed checks.

Each evidence entry contains date/time with timezone, exact command or manual steps,
working directory, tested commit SHA (and dirty changes if any), environment, exit code
for commands, relevant P/T and gate IDs, outcome, and a concise observation/artifact link.
For live checks include relevant browser and provider/model/voice versions without
credentials. If there is no Git commit yet, say `uncommitted`; do not fabricate a SHA.
After integration, record the integrated commit and checks actually run against it.

Keep artifacts local or in an approved ignored location unless safe to commit. Use
fictional fixtures. Omit audio, transcripts, private notes/prompts, tokens, email
addresses, credentials, and identifying account data from logs, screenshots, and docs.
Summarize a sensitive failure by error category and reproduction steps using fixtures.

## Completion and handoff

- Acceptance criteria map to requirements/tests and evidence, or an explicit remaining gap.
- Affected contracts, setup/API/environment/schema documentation reflect the final change.
- The task lists changed paths, commit(s), dependencies, known failures, and next action.
- The coordinator reviews ownership/security boundaries and integrates in dependency order.
- The coordinator updates STATUS with actual gate evidence, blockers, and next task.
- Leave pending account actions, live checks, and deployment decisions clearly pending.
  Documentation quality does not turn a proposed service or mock into a working integration.
