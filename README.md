# SpeakEasy

**Have the hard conversation once, before it counts.** SpeakEasy is a FaceTime-style rehearsal for an everyday conversation you have been putting off. You describe the situation or pick a starter character, review an editable fictional counterpart, and talk it through on a live video call. Afterward you get a short recap and can try the hard moment once more. It is a practice tool. It is not therapy, and it does not predict anyone real.

- **App:** [speakeasyapp.tech](https://speakeasyapp.tech) (sign-in required; also at [conversation-practice-zeta.vercel.app](https://conversation-practice-zeta.vercel.app))
- **Built at MHacks 2026** (October 3–4) by one person with coding agents. Main track: Actually Intelligent. Sponsor prizes: Best Project Built with ElevenLabs, and the .Tech domain prize.
- **Devpost copy, judging pitch and the claims we don't make:** [DEMO-01](docs/tasks/DEMO-01-submission-prep.md)

The static concept site at conversation-practice-site.vercel.app is older and is not the app.

## What it does

1. **Set it up.** Pick a starter (Jordan the manager, Alex the roommate, Ellis the professor, Sam the classmate) or describe your own situation. The app drafts a fictional character from your words, and you can edit it. Add a goal and, optionally, the line you'll say when it gets hard. Private notes stay with you and never reach the call.
2. **Show me first.** A stand-in plays your side once while you play the other person.
3. **Your call.** A live talking-video call, three minutes by default or five if you choose. The character reacts, pushes back and can be interrupted. End any time; End releases the microphone.
4. **Recap and one retry.** A short recap you can skip. If you didn't say your line, try just that moment once.
5. **People who grow with you.** Save the person, give them one of the four starter faces and voices, and drag in only the About-me facts you want them to know.

Each practice starts fresh. No recording or transcript is kept by default, and there is no score.

## How it's built

| Part | Used for |
| --- | --- |
| Next.js 16 App Router, React 19, TypeScript | App and API routes, deployed on Vercel |
| Tavus Conversational Video Interface over Daily | Live talking-video counterpart; one stock face and persona per starter |
| ElevenLabs text-to-speech | The voice of every Tavus persona, the stand-in, and voice previews |
| OpenAI Responses (structured output, `store: false`) | Editable setup drafts, the recap, and the goal check |
| Supabase Auth and PostgreSQL | Sign-in, owner-scoped rows with row-level security, version-checked saves |
| Zod, Vitest, Playwright | Validation of every request and model output; 792 unit tests; browser tests including a real-sign-in hero path |

The counterpart's context is built from an allowlist: role, traits, and the facts you shared. Private notes and unshared facts are not on it. Provider ids and secrets stay on the server, and CI checks that they are not in the client bundle.

## Status

`main` `9b7bc93` is in production. CI passes: typecheck, 792 unit tests, build, client-bundle check, and Playwright (12 passed, 3 skipped without the service-role key).

On October 4 at about 10:23 AM, the builder ran the current path live on the deployed app and reported that it all worked. That path was saved Jordan, Show me first, the call, the recap, and one retry, then a call using Alex's look and voice. The report is not itemized, and it was before the landing and lobby redesign shipped. Sharing, chip-tone changes, Your data and video-loss handling are tested automatically and have not been checked live. Details: [STATUS.md](STATUS.md) and [LIVE-01](docs/tasks/LIVE-01-human-checks.md).

## Run it locally

Use Node 22 (`.nvmrc`). Run `npm ci`, then `npm run dev` (http://127.0.0.1:3000). Copy `.env.example` to `.env.local` for a new environment; it needs Supabase, Tavus, ElevenLabs and OpenAI keys. Checks: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:ui`. Real-Auth scripts: `scripts/preflight/auth-database-check.mjs` (`--g3-ui`, `--g5-ui`) against a running server. Demo account seed and reset: `node --env-file=.env.local scripts/demo/seed.mjs --checkin`.

Repository: [esaba12/conversaton-practice](https://github.com/esaba12/conversaton-practice).

## Read in this order

On restart, begin with [STATUS.md](STATUS.md) and [AGENTS.md](AGENTS.md). Work still open is [docs/29](docs/29-REMAINING-WORK.md). Demo copy: [docs/11](docs/11-DEMO-AND-SUBMISSION.md) and [DEMO-01](docs/tasks/DEMO-01-submission-prep.md). The full reference index follows; several early specs are historical.

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
24. [Remaining work after G5](docs/29-REMAINING-WORK.md)
25. [One-moment retry](docs/30-ONE-MOMENT-RETRY.md) (built)
26. [Product vision](docs/31-PRODUCT-VISION.md), [feature specs](docs/32-FEATURE-SPECS.md), and [design system and screens](docs/33-DESIGN-SYSTEM-AND-SCREENS.md) (planning; the compressed plan in [docs/next](docs/next/README.md) is what shipped)

## Build with agents

The build followed gates G1–G5 in [docs/10](docs/10-BUILD-PLAN.md), then the plan in [docs/next](docs/next/README.md). A coordinator kept [STATUS.md](STATUS.md) and integrated one reviewed task at a time; workers kept their own records in `docs/tasks/`. [AGENTS.md](AGENTS.md) carries the workflow across restarts. Dependencies are frozen at the lockfile.

Deferred: an iMessage rehearsal with Photon ([docs/17](docs/17-PHOTON-TEXT-PRACTICE.md)), Relay, group conversations, voice cloning, and photo upload.

## Evidence policy

Sources support API and product facts, not promised outcomes. The design is informed by social-anxiety guidance but has no demonstrated clinical efficacy. All competitive and technical research is a dated snapshot. Read source details before relying on a changing API.
