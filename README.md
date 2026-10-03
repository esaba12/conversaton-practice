# MHacks conversation rehearsal specification pack

Project name undecided. Prepared October 3, 2026 (America/Detroit).
Status: specifications plus partially installed development tooling; no application has been built or clinically validated.
Target: a 24-hour MHacks prototype. Confirmed team: one human builder coordinating multiple coding agents.

## Product

A voice rehearsal space for conversations you are avoiding. Users describe a situation; the app generates an editable fictional counterpart and conversation setup. The conversation then unfolds live as the user speaks, as confirmed by the user. Users practice a concrete communication goal and control what the app remembers. Sessions end with a brief reflection and an optional real-world step.

Every session starts fresh. Approved preferences and persona settings may carry over; previous simulated conversations do not.

The core loop is: prepare -> review persona -> practice -> reflect -> approve memory -> close.

## Read in this order

On restart, begin with [STATUS.md](STATUS.md), [project instructions](AGENTS.md), the active gate in [the build plan](docs/10-BUILD-PLAN.md), and your assigned [task record](docs/tasks/TEMPLATE.md). Read the PRD and affected contracts before changing code. The full reference index follows; do not repeat product discovery on every task.
For the first implementation session, follow [the final startup checklist](docs/21-START-BUILD.md).

1. [Decisions and viability](docs/00-DECISIONS-AND-VIABILITY.md)
2. [Product requirements](docs/01-PRD.md)
3. [Experience and interface](docs/02-UX.md)
4. [Architecture](docs/03-ARCHITECTURE.md)
5. [Data and memory](docs/04-DATA-AND-MEMORY.md)
6. [API and action contracts](docs/05-API-AND-ACTIONS.md)
7. [ElevenLabs integration](docs/06-ELEVENLABS.md)
8. [Prompt contracts](docs/07-PROMPTS.md)
9. [Safety and privacy](docs/08-SAFETY-AND-PRIVACY.md)
10. [Evaluation and acceptance](docs/09-EVALUATION.md)
11. [24-hour build checklist](docs/10-BUILD-PLAN.md)
12. [Demo and submission](docs/11-DEMO-AND-SUBMISSION.md)
13. [Codex CLI setup](docs/12-CODEX-SETUP.md)
14. [Tool research and recommendations](docs/13-TOOL-RESEARCH.md)
15. [Sources](docs/14-SOURCES.md)
16. [Handoff and first Codex prompt](docs/15-HANDOFF.md)
17. [MHacks prize strategy and confirmed requirements](docs/16-MHACKS-STRATEGY.md)
18. [Photon text-message rehearsal stretch](docs/17-PHOTON-TEXT-PRACTICE.md)
19. [Latest design, required sign-in, and AWS direction](docs/18-DESIGN-AND-AWS.md)
20. [Multiagent workflow, Warp, and worktrees](docs/19-AGENT-WORKFLOW.md)
21. [Documentation and verification standard](docs/20-DOCUMENTATION-STANDARD.md)
22. [Final startup checklist and reset prompt](docs/21-START-BUILD.md)

## Build with agents

Track current work in [the GitHub G1 milestone](https://github.com/esaba12/conversaton-practice/milestone/1). Each implementation task has an issue; agents use focused branches and draft PRs with documented verification. GitHub Actions is part of the foundation task and has not run yet.

The coordinator completes [G1 foundation](docs/tasks/G1-00-foundation.md), then dispatches independent [auth/session](docs/tasks/G1-01-auth-session.md), [voice](docs/tasks/G1-02-voice.md), and [UI](docs/tasks/G1-03-ui.md) tasks before [integration](docs/tasks/G1-04-integration.md). Keep one writer per worktree and one owner for shared contracts. Workers maintain task evidence; the coordinator updates STATUS.md and accepts gates. See the workflow for Warp tabs, the guarded worktree helper, and merge checkpoints. This is a development workflow, not another application dependency.

First stretch after all core gates pass: bounded iMessage rehearsal using Photon Spectrum. Deferred for the solo MVP. Share approved persona/profile settings, keep session histories separate, and keep reflection in the web app. Implementation is gated on remaining time, sponsor access, and current SDK verification.

[AGENTS.md](AGENTS.md) applies from this project root and carries the workflow across restarts and coding-agent sessions.

## What has and has not been done

This folder supplies specifications, acceptance gates, research, and development tooling. Context7 is installed locally; two vendor skills are staged for activation. Global MCP/VS Code setup was blocked by session permissions/network restrictions. See [tooling status and finish command](tooling/README.md). No application, cloud project, app credential, or deployment has been created.

## Defaults and unresolved items

Current direction: Next.js App Router, TypeScript, npm, ElevenLabs Agents, AWS-hosted PostgreSQL, required account sign-in, and a server-side structured-output model for setup/reflection. Cognito, Aurora Data API, and Amplify are the recommended AWS path pending verification; see docs/18-DESIGN-AND-AWS.md. Default demo: setting a cleaning boundary with a fictional roommate.

Confirmed event strategy: Actually Intelligent plus both listed ElevenLabs categories, subject to organizer confirmation of category stacking. Submission is before noon Sunday, October 4, America/Detroit; judging uses a three-minute pitch. See docs/16-MHACKS-STRATEGY.md.

Confirmed: one human with parallel coding agents, fresh sessions, user-described situations as the primary input, warm minimal/crisp modern design, and sign-in before all workspace actions. The user has AWS credits and no space for another Supabase database; app-specific access is unverified. Situation generation is a core requirement, not an optional scope cut.

Open items: prize stacking, detailed Figma eligibility, available credits, provider account permissions, selected voices and model IDs, and public deployment choice. Live roleplay is confirmed; a written sample conversation is outside the current scope. Record concrete values in STATUS.md when known.

## Evidence policy

Sources support API and product facts, not promised outcomes. The design is informed by social-anxiety guidance but has no demonstrated clinical efficacy. Funding, ratings, and downloads are not interchangeable. All competitive and technical research is a dated snapshot. Read source details before relying on a changing API.
