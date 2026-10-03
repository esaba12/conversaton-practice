# Project status

Updated October 3, 2026, for the Cursor handoff. **G1 foundation is active; no product gate has passed.**

## Latest user direction
The user is switching to Cursor because of rate limits, confirms the frontend worker is done, and requested all ready work merged and fully documented. No new feature work is part of this handoff turn. Start with [the complete Cursor handoff and paste-ready prompt](docs/23-CURSOR-HANDOFF.md). Keep the confirmed FaceTime-style live-video product, editable generated setups, required sign-in, Supabase, Tavus CVI + ElevenLabs TTS, and OpenAI setup/reflection defaults.

## Current work and ownership
- Handoff checkout: `/Users/ethansaba/code/therapist`, **main**. Foundation PR #8, including frontend PR #7, merged to main at `c178d37832cfe4540c62b5f071902730ed27affa` on October 3 at 14:44 EDT. Subsequent Cursor handoff changes are documentation only. Historical source revisions: scaffold `a601a0e`, provider/database `fe27967`, frontend integration `cf32199`, workspace/Auth `c48cecf`.
- External frontend: `.worktrees/g1-frontend`, branch `agent/g1-frontend`, base `a601a0e`, port 3003. Owns only presentation components, development preview route, one frontend test and [its task record](docs/tasks/G1-03-frontend-preview.md). Its [PR #7](https://github.com/esaba12/conversaton-practice/pull/7) was reviewed and merged at `cf32199`, then included in main by PR #8. The user confirms this worker is done; its clean worktree at `9943679` has no outstanding commits relative to the merged foundation and is preserved. Coordinator wired its setup into the protected workspace.
- Coordinator owns shared contracts, app wiring, auth/media/backend, dependencies, numbered specs, migration execution, provider resources and STATUS.
- Research agents completed provider/API and database reviews. One authored the two coordinator-reviewed migrations and rollback assertions; no worker ran SQL.
- Media contracts are **provisional** until human live-video feasibility is recorded. G1-01/02/04 full implementation dispatch remains gated. Independent auth/database scaffolding and presentational UI proceeded within foundation.

## What exists
- Next.js 16.3.8 / React 19.3.0 / TypeScript 5.9.3 scaffold with pinned lockfile, local Node 22.23.3 and Node 22 CI. Host Node 20 bootstrapped npm installation; npm scripts use the local Node binary.
- Supabase SSR 0.12.7 and client 2.117.2; Daily 0.87.0; Zod 4.6.5; Vitest 4.1.11; Playwright 1.63.0. Vitest was patched after npm audit; subsequent installation reported zero vulnerabilities.
- Landing page, email/password sign-in/account-creation form, confirmation callback, cookie-refresh proxy, protected workspace shell. Real password sign-in and sign-out passed in Chromium using temporary confirmed fictional accounts; email delivery/confirmation callback still need verification. The workspace explicitly says calls are disabled.
- Allowlisted fictional roommate context, strict request/media/state schemas and tested server Tavus adapter. Private notes/history are rejected by role schema.
- GitHub Actions typecheck/unit/build/browser workflow passes on final code revision `c48cecf`: [run 37145104163](https://github.com/esaba12/conversaton-practice/actions/runs/37145104163), completed 14:42 EDT. Foundation [PR #8](https://github.com/esaba12/conversaton-practice/pull/8) is merged to main; its exact final head `d7bc7af` also passed [run 37145240793](https://github.com/esaba12/conversaton-practice/actions/runs/37145240793). Gate remains pending.
- Integrated app is running at http://127.0.0.1:3000 (launch session 16025). Development-only presentation fixture: /design-preview. This does not start media or pass G1.
- Original static public preview remains at https://conversation-practice-site.vercel.app and is separate from the app.

## Supabase
Fresh selected project `rcktybngebovyopregnt` is linked locally. Escalated CLI account and SQL checks succeeded; it initially had zero public tables.
Applied in order:
1. `20261003180000_session_foundation.sql`
2. `20261003182400_identity_helper_privileges.sql`

The first database assertion run exposed that managed Supabase's postgres role could not delegate Auth schema usage to the restricted executor. Additive repair moved only the private identity/capability verifier to postgres SECURITY DEFINER; mutation RPCs remain restricted and owner-RLS protected. Re-run passed. CLI migration catalog caching warned that Docker was unavailable; migrations still applied and SQL assertions succeeded. Docker is not a hosted-build prerequisite.

Session rows contain owner/lease/status/trusted provider association/cleanup only, not room credentials, raw prompts, transcripts or media. Direct authenticated DML is revoked. Runtime mutations require a verified nonanonymous owner plus an admin-provisioned server capability; raw capability stays local, only its digest goes to a private table. See [G1-00C evidence](docs/tasks/G1-00C-session-schema.md).

## Tavus / ElevenLabs
User-supplied keys passed read checks in PREP-03. Coordinator created one immutable roleplay PAL using a ready system stock face and a premade ElevenLabs voice. Server-to-server speech-key transfer is part of the authorized selected route. PAL readback confirmed explicit ElevenLabs TTS and perception off. Provider LLM default was not changed.

Private test-mode conversation creation returned ended plus a meeting token; Tavus hard deletion succeeded. This verifies request acceptance only, not live TTS/video or billing. Recording-off does not disable provider transcripts. ElevenLabs retention/deletion remains separate from Tavus cleanup.

Isolated live preflight is running at **http://127.0.0.1:3010** (process session 14951 at launch). It starts a real three-minute call only on explicit click. User was asked to test five exchanges, interruption, End/microphone release, and two fictional contexts. **No human result received yet.** Restart command:
`node_modules/.bin/node --env-file=.env.local scripts/preflight/video-server.mjs`

This harness is intentionally separate from the authenticated application, binds loopback, and is not a G1 pass. Do not run automated call-start/camera actions while the user is testing.

## Actual verification
October 3, original checkout; checks ran during development based on `a601a0e` and were integrated through `c48cecf`/`d7bc7af` into main merge `c178d37`. Per-task records retain exact modes/revisions; these are no longer uncommitted feature changes:
- `npm run typecheck`: pass.
- `npm test`: 9 unit tests pass, including private-context rejection, state rules, credential boundary, no blind provider-create retry and separate End verification.
- `npm run build`: pass, Next 16.3.8 production build.
- Combined `npm run test:ui`: 8 Chromium checks passed and 1 production-only check intentionally skipped in development. Includes entry/guard, frontend controls, mobile layouts and truthful preview states. No media mock claimed as live.
- `supabase db query --linked --file supabase/tests/session_foundation.sql`: initial permission failure, then pass after additive repair. Synthetic identities/claims, all fixtures/config changes rolled back. Checks owner isolation, direct-write denial, capability/anonymous rejection, idempotency, terminal-state/late-bind behavior and expiry. Does not establish HTTP Auth or concurrent multi-connection behavior.
- Real Auth/HTTP concurrent boundary check: passed; two fictional users signed in, owner/capability/direct-write checks and simultaneous acquisition passed; all fixtures removed. `auth-database-check.mjs --ui-only` also passed real browser sign-in, SSR workspace, integrated setup, sign-out and denied re-entry. No email or provider calls; no credentials retained.
- Provider PAL/readback and test-mode creation/deletion: live API pass, audiovisual not run.
- Playwright screenshot of loopback preflight inspected without starting a call; no media recorded.
- Installed Next.js cookies/proxy/authentication/route guides reviewed; preserve its generated AGENTS.md rules block.

## Next steps and real blockers
1. Record the human live-video preflight result; repair actual provider/media failures before freezing integration contracts.
2. Continue from main on a new focused branch in Cursor. PRs #7 and #8 are merged; G1 issues remain open until full acceptance. Follow docs/23 for the exact implementation map and next task.
3. Verify actual email delivery/confirmation callback; real password/UI sign-in already passed with confirmed fixtures. Default Supabase SMTP may restrict recipients/rate; do not burn quota with repeated synthetic signup attempts or claim public email readiness.
4. Freeze media/session contracts, then dispatch/review application auth/session routes and media-controller work against the integrated frontend props.
5. Full G1 requires authenticated five-turn video, durable owner isolation/concurrency and local media teardown on End/auth loss/failed requests. Only then start G2 situation generation.

G2 editable generation, G3 approved memory, later reflection/deletion and G5 evaluation remain unimplemented. Do not replace generated situations or live video with simpler features. Photon/Relay remain deferred.

## GitHub and setup
Repository: https://github.com/esaba12/conversaton-practice . G1 issues #1–#5 remain open. Foundation PR #8 and presentation PR #7 are merged and preserved in main history. The documentation-only Cursor handoff follows separately. Check existing PRs before creating another. Local environment and provider IDs are ignored; never stage `.env.local`. Git/worktree and network operations succeeded via scoped escalation; a context reset does not change managed read-only permissions. Preserve uncommitted work.

Preparation evidence: [PREP-01](docs/tasks/PREP-01-agent-workflow.md), [public preview](docs/tasks/PREP-02-public-website.md), [access checks](docs/tasks/PREP-03-access-check.md). No need to recreate keys, reinitialize Git, obtain AWS credits or create LiveAvatar accounts.

Submission target: October 4, 11:30 AM America/Detroit; event notes record deadline before noon. Preserve the submission buffer.
