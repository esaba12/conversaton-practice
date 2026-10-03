# MHacks conversation rehearsal specification pack

Project name undecided. Prepared October 3, 2026 (America/Detroit).
Status: public product preview deployed; authenticated application foundation in progress. No live acceptance gate or clinical validation.
Confirmed core experience: FaceTime-style practice with a visible, talking fictional AI counterpart. Real synchronized video is required in the first slice. See docs/22-LIVE-VIDEO.md for the integration and acceptance plan.
Target: a 24-hour MHacks prototype. Confirmed team: one human builder coordinating multiple coding agents.

Public website: [conversation-practice-site.vercel.app](https://conversation-practice-site.vercel.app). This is a static concept preview for the credits application; see [source/deployment notes](website/README.md).

## Product

A FaceTime-style rehearsal space for conversations you are avoiding. Users describe a situation; the app generates an editable fictional counterpart and conversation setup. The fictional counterpart responds live on video as the user speaks. Users practice a concrete communication goal and control what the app remembers. Sessions end with a brief reflection and an optional real-world step.

Every session starts fresh. Approved preferences and persona settings may carry over; previous simulated conversations do not.

The core loop is: prepare -> review persona -> practice -> reflect -> approve memory -> close.

## Read in this order

On restart, begin with [STATUS.md](STATUS.md), [project instructions](AGENTS.md), the active gate in [the build plan](docs/10-BUILD-PLAN.md), and your assigned [task record](docs/tasks/TEMPLATE.md). Read the PRD and affected contracts before changing code. The full reference index follows; do not repeat product discovery on every task.
For setup/resume commands, follow [the startup checklist](docs/21-START-BUILD.md). For the editor transition and exact next implementation task, read [the Cursor handoff](docs/23-CURSOR-HANDOFF.md).

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
19. [Latest design, required sign-in, and backend direction](docs/18-DESIGN-AND-AWS.md)
20. [Multiagent workflow, Warp, and worktrees](docs/19-AGENT-WORKFLOW.md)
21. [Documentation and verification standard](docs/20-DOCUMENTATION-STANDARD.md)
22. [Final startup checklist and reset prompt](docs/21-START-BUILD.md)
23. [Live video experience and integration](docs/22-LIVE-VIDEO.md)

## Build with agents

Local application: `npm ci`, then `npm run dev` (http://127.0.0.1:3000). Use Node 22 (`.nvmrc`); a pinned local Node binary also supplies npm scripts. Copy `.env.example` only for a new environment; preserve existing ignored `.env.local`. Checks: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:ui`. Calls are disabled in the initial protected workspace shell. The original static preview remains under `website/`.

Track current work in [the GitHub G1 milestone](https://github.com/esaba12/conversaton-practice/milestone/1). Each implementation task has an issue; agents use focused branches and draft PRs with documented verification. GitHub Actions is part of the foundation task and has not run yet.

The coordinator completes [G1 foundation](docs/tasks/G1-00-foundation.md), then dispatches independent [auth/session](docs/tasks/G1-01-auth-session.md), [voice](docs/tasks/G1-02-voice.md), and [UI](docs/tasks/G1-03-ui.md) tasks before [integration](docs/tasks/G1-04-integration.md). Keep one writer per worktree and one owner for shared contracts. Workers maintain task evidence; the coordinator updates STATUS.md and accepts gates. See the workflow for Warp tabs, the guarded worktree helper, and merge checkpoints. This is a development workflow, not another application dependency.

First stretch after all core gates pass: bounded iMessage rehearsal using Photon Spectrum. Deferred for the solo MVP. Share approved persona/profile settings, keep session histories separate, and keep reflection in the web app. Implementation is gated on remaining time, sponsor access, and current SDK verification.

[AGENTS.md](AGENTS.md) applies from this project root and carries the workflow across restarts and coding-agent sessions.

## What has and has not been done

This folder supplies specifications, acceptance gates, research, development tooling, and the deployed static product preview in `website/`. Context7 is installed locally; the two staged vendor skills are now active in this session. Recheck MCP activation on restart. See [tooling status](tooling/README.md). The authenticated scaffold and provider API preflight now exist; live audiovisual integration and the full application gates remain pending. See STATUS.md for actual evidence.

## Defaults and unresolved items

Current direction: Next.js App Router, TypeScript, npm, Tavus CVI with explicit ElevenLabs TTS, Supabase Auth/PostgreSQL, required sign-in, and server-side structured output for setup/reflection. Vercel is the recommended app host; the authenticated app is not deployed. See docs/18-DESIGN-AND-AWS.md. Default demo: setting a cleaning boundary with a fictional roommate.

Confirmed event strategy: Actually Intelligent plus both listed ElevenLabs categories, subject to organizer confirmation of category stacking. Submission is before noon Sunday, October 4, America/Detroit; judging uses a three-minute pitch. See docs/16-MHACKS-STRATEGY.md.

Confirmed: one human with parallel coding agents, fresh sessions, user-described situations as the primary input, warm minimal/crisp modern design, and sign-in before all workspace actions. The user supplied a fresh Supabase project; local configuration and Auth health are verified, while sign-in/database integration remain untested. See STATUS.md. Situation generation is a core requirement, not an optional scope cut.

Open items: prize stacking, detailed Figma eligibility, available credits, provider account permissions, selected voices and model IDs, and public deployment choice. Live roleplay is confirmed; a written sample conversation is outside the current scope. Record concrete values in STATUS.md when known.

## Evidence policy

Sources support API and product facts, not promised outcomes. The design is informed by social-anxiety guidance but has no demonstrated clinical efficacy. Funding, ratings, and downloads are not interchangeable. All competitive and technical research is a dated snapshot. Read source details before relying on a changing API.
