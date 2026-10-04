# Conversation practice

A FaceTime-style rehearsal for an everyday conversation you have been putting off. You describe a situation, review an editable fictional counterpart, and talk live on video. This is a practice tool, not therapy, and it does not predict anyone real.

**MHacks prototype** (October 3–4, 2026). One human builder with coding agents. Submit by **11:30 AM America/Detroit** October 4 (hard noon). Pitch, backup shot list, Devpost drafts and claims we must not make: [docs/tasks/DEMO-01-submission-prep.md](docs/tasks/DEMO-01-submission-prep.md).

Public concept site (static, not the app): [conversation-practice-site.vercel.app](https://conversation-practice-site.vercel.app).

## What it does

Sign in, describe a situation (or use a saved person), optionally keep private notes that never go to the call, edit the generated setup, then practice on a live video call. After End you can skip or request a short reflection (nothing stored) and optionally save the person. Each saved person knows only the About-me facts you share with them. Each practice starts fresh.

## Build status

G1 and G2 passed human live calls. G3–G5 are merged and accepted on automated evidence (**live not verified**). See [STATUS.md](STATUS.md). Dependencies are frozen at the lockfile; do not upgrade for the demo.

Stack: Next.js 16, Supabase Auth/PostgreSQL, Tavus CVI + ElevenLabs TTS, OpenAI Responses for setup and optional reflection, Zod, Vitest, Playwright.

## Read in this order

On restart, begin with [STATUS.md](STATUS.md) and [AGENTS.md](AGENTS.md). Work still open is [docs/29](docs/29-REMAINING-WORK.md). Demo copy: [docs/11](docs/11-DEMO-AND-SUBMISSION.md) and [DEMO-01](docs/tasks/DEMO-01-submission-prep.md). The full reference index follows.

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
18. [Photon text practice](docs/17-PHOTON-TEXT-PRACTICE.md)
19. [Latest design, required sign-in, and backend direction](docs/18-DESIGN-AND-AWS.md)
20. [Multiagent workflow, Warp, and worktrees](docs/19-AGENT-WORKFLOW.md)
21. [Documentation and verification standard](docs/20-DOCUMENTATION-STANDARD.md)
22. [Final startup checklist and reset prompt](docs/21-START-BUILD.md)
23. [Live video experience and integration](docs/22-LIVE-VIDEO.md)
24. [Remaining work after G5](docs/29-REMAINING-WORK.md)
25. [One-moment retry](docs/30-ONE-MOMENT-RETRY.md) (decided, not built)
26. [Product vision](docs/31-PRODUCT-VISION.md), [feature specs](docs/32-FEATURE-SPECS.md), and [design system and screens](docs/33-DESIGN-SYSTEM-AND-SCREENS.md) (planning, not built)

## Build with agents

Local application: `npm ci`, then `npm run dev` (http://127.0.0.1:3000). Use Node 22 (`.nvmrc`); a pinned local Node binary also supplies npm scripts. Copy `.env.example` only for a new environment; preserve existing ignored `.env.local`. Checks: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:ui`. Real-Auth scripts: `scripts/preflight/auth-database-check.mjs` (`--g3-ui`, `--g5-ui`) against a running server. The original static preview remains under `website/`.

Repository: [esaba12/conversaton-practice](https://github.com/esaba12/conversaton-practice).

Gates G1–G5 are implemented. Workers maintain task evidence; the coordinator updates STATUS.md. This is a development workflow, not another application dependency.

Text practice is implemented on this branch and stays unmerged until a real iMessage round trip. The live video call remains the demo. Share approved persona settings, keep session histories separate, and keep reflection in the web app. No Photon line, webhook, or domain delivery has succeeded, so the channel is not live-verified.

[AGENTS.md](AGENTS.md) applies from this project root and carries the workflow across restarts and coding-agent sessions.

## What has and has not been done

This folder supplies the application, specifications, and the deployed static product preview in `website/`. See STATUS.md for actual evidence. G3–G5 live audiovisual paths remain labelled live not verified.

## Defaults and unresolved items

Current direction: Next.js App Router, TypeScript, npm, Tavus CVI with explicit ElevenLabs TTS, Supabase Auth/PostgreSQL, required sign-in, and server-side structured output for setup/reflection. Vercel is the recommended app host; the authenticated app is not deployed. See docs/18-DESIGN-AND-AWS.md. Default demo: setting a cleaning boundary with a fictional roommate.

Confirmed event strategy: Actually Intelligent plus both listed ElevenLabs categories, subject to organizer confirmation of category stacking. Submission is before noon Sunday, October 4, America/Detroit; judging uses a three-minute pitch. See docs/16-MHACKS-STRATEGY.md.

Confirmed: one human with parallel coding agents, fresh sessions, user-described situations as the primary input, warm minimal/crisp modern design, and sign-in before all workspace actions. The user supplied a fresh Supabase project; Auth and owner isolation are automated-tested. Situation generation is core scope.

On `main`: three example starts (Alex, Ellis, Sam), a 3- or 5-minute choice, collapsed captions, saved-person session attribution, and a public landing with a signed-in home and a Google sign-in button. Google sign-in is not live-checked. Still open, in [docs/29](docs/29-REMAINING-WORK.md): appearance presets, a project name, app hosting, live G3–G5 checks, and Devpost. A one-moment retry is specified in [docs/30](docs/30-ONE-MOMENT-RETRY.md) and is not part of the submission build. Relay remains deferred. Text practice is implemented on this branch and stays unmerged until a real iMessage round trip. The live video call remains the demo.

## Evidence policy

Sources support API and product facts, not promised outcomes. The design is informed by social-anxiety guidance but has no demonstrated clinical efficacy. Funding, ratings, and downloads are not interchangeable. All competitive and technical research is a dated snapshot. Read source details before relying on a changing API.
