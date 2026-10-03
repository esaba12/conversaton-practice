# Cursor handoff — October 3, 2026

The user is switching editors because of rate limits and requested all ready work merged and documented. Open **`/Users/ethansaba/code/therapist`**, the original checkout. Read this file and STATUS.md before building. Existing project rules remain in AGENTS.md; changing editors does not change the product or gate order.

## Merged work and exact state

- Frontend [PR #7](https://github.com/esaba12/conversaton-practice/pull/7) was reviewed and merged into the foundation branch at `cf32199`. Its final head was `9943679`; no additional frontend commits were outstanding at handoff. The user confirms that worker is done.
- Foundation [PR #8](https://github.com/esaba12/conversaton-practice/pull/8) was merged into **main** on October 3 at 14:44 EDT, merge commit **`c178d37832cfe4540c62b5f071902730ed27affa`**. Its exact head `d7bc7af` passed [CI run 37145240793](https://github.com/esaba12/conversaton-practice/actions/runs/37145240793) before merging.
- Source integration `c48cecf` also passed [CI run 37145104163](https://github.com/esaba12/conversaton-practice/actions/runs/37145104163). The subsequent changes before merge were documentation only. This handoff is a further documentation-only change.
- The frontend worktree `.worktrees/g1-frontend`, branch `agent/g1-frontend`, is clean and preserved. The foundation branch is also preserved. No worker currently owns active implementation. Start a new focused branch from current main for the next task; do not resume an old worker branch accidentally.
- **No G1–G5 product gate has passed.** Merging foundation code is not live-call acceptance. The signed-in app intentionally disables Start practice.

## What works and what is missing

| Area | Implemented / verified | Still missing |
| --- | --- | --- |
| App | Next.js App Router, landing/sign-in, protected workspace, integrated setup presentation, sign-out | Real conversation session routes and app media controller |
| Authentication | Supabase password sign-in, server-verified nonanonymous identity, SSR workspace access, sign-out/re-entry denial tested with real temporary accounts | Actual email delivery and confirmation callback with a human account; hosted redirects |
| Database | Applied owner-isolated session tables/RPCs, capability boundary, idempotency, expiry, late binding, genuine concurrent HTTP acquisition tested | Application route/repository wiring; abandoned-session remote-cleanup integration |
| Provider | Immutable Tavus PAL created/read back, explicit ElevenLabs TTS and perception off, private test-mode call accepted/hard-deleted | Real responsive speech/video, synchronization, interruption, camera privacy and hardware release observed in a call |
| Frontend | Responsive setup/call presentation, accessible controls, all synthetic states, mobile tests, production preview guard tested by frontend worker | Real stream/control wiring and lifecycle behavior; decorative placeholder is not a live avatar |
| Later gates | Specifications only | Editable setup generation, saved profiles/personas, transactional approved memory, reflection/deletion flow, final evaluation/deployment/submission |

## Code map

| Paths | Responsibility |
| --- | --- |
| `app/auth/**`, `lib/auth/**`, `proxy.ts` | Sign-in/signup/callback, Supabase SSR clients and identity guard |
| `app/practice/page.tsx`, `practice-workspace.tsx` | Server authorization; client workspace driving setup → live call → End with local-first teardown and sign-out |
| `app/api/sessions/**`, `lib/session/server.ts`, `lib/data/sessions.ts`, `lib/api/respond.ts` | Authenticated start/connected/end routes over the session RPCs and Tavus (added after handoff on `build/g1-session-media`) |
| `lib/media/daily-controller.ts`, `lib/session/api-client.ts` | Browser Daily controller and typed route client (added after handoff) |
| `components/presentation/practice.tsx` and CSS Modules | `PracticeSetup` / `PracticeCall`, pure props and supplied media nodes; no Auth, fetch or media acquisition |
| `app/design-preview/page.tsx`, `practice-preview.tsx` | Development-only synthetic UI fixture; production returns 404 |
| `lib/schemas/**`, `fixtures/roommate.ts` | Strict public-only role context, identity/session/error/media contracts and fictional example |
| `lib/media/tavus.ts` | Server-only create/End adapter; no browser SDK controller or public session API yet |
| `supabase/migrations/**`, `supabase/tests/session_foundation.sql` | Ordered applied SQL and rollback-only assertions |
| `scripts/preflight/**` | Isolated provider setup/human call harness and coordinator-only live Auth/database checks |
| `tests/unit/**`, `tests/browser/**` | Deterministic contract/provider tests and browser presentation/access checks |
| `website/` | Previously deployed static preview, separate from the Next.js app |

At handoff the app had **no implemented `/api/sessions` start/connected/end routes**; they were added afterwards on `build/g1-session-media` (see STATUS). Do not mistake tested provider helpers or SQL RPCs for that integration. The `MediaController` TypeScript contract is provisional and lacks the final application event/wiring agreement; revise it only after the bounded live preflight.

## Local configuration and accounts

The original checkout's ignored `.env.local` is present with owner-only permissions (600); do not print, commit or replace it. It contains the public Supabase URL/publishable key, server-only Tavus/ElevenLabs/OpenAI keys, selected PAL/face/voice IDs, and `SESSION_SERVER_SECRET`. Safe names are in `.env.example`. These local values do not arrive through Git on a different machine. This editor switch on the same machine should use the existing file.

Fresh Supabase project `rcktybngebovyopregnt` is linked under ignored local CLI state. Account/project/SQL access works. No runtime service-role key is configured. The administration-only test obtains an admin key into process memory solely to create/remove confirmed fictional fixtures; that key is not stored in app configuration or sent to the browser. All test fixtures were removed, and no cleanup ledger remained at handoff.

Already applied, in order:

1. `20261003180000_session_foundation.sql`
2. `20261003182400_identity_helper_privileges.sql`

Do not rewrite/reapply them manually. `supabase db push --dry-run` inspects pending migrations. The first migration exposed a managed Auth-schema grant limitation during tests. The additive repair makes only the private identity/capability helper postgres-owned SECURITY DEFINER; public mutations retain the restricted executor and owner RLS. The capability digest is provisioned in a private table. Never replace it with a caller-selected token or bypass ownership using a service-role runtime.

Five database RPCs exist: `practice_acquire`, `practice_bind`, `practice_connected`, `practice_end`, `practice_cleanup`. Exact arguments and errors are in [G1-00C](tasks/G1-00C-session-schema.md). Every call requires the server capability plus the current authenticated nonanonymous owner. Provider IDs must originate from server create responses; never trust a browser-supplied ID. Room credentials/prompts/transcripts/media are not stored in the session table.

The immutable Tavus PAL already exists. `provider-setup.mjs` should not be rerun as routine onboarding; do not create duplicate resources or rotate keys. ElevenLabs key transfer to Tavus was explicitly authorized/executed for TTS. No separate ElevenLabs Agent or LiveAvatar account is needed. Empty participant tags make calls stateless; perception/recording are off. Recording-off does not disable provider transcripts, and Tavus hard deletion does not prove ElevenLabs deletion.

OpenAI model-list read access was checked earlier. Inference, structured output and billing have not been tested; OpenAI remains the selected setup/reflection provider for G2. No AWS work or sponsor-driven provider migration is needed. Only the static preview is deployed to Vercel; the Next.js app is local and its production environment/redirects remain unconfigured.

## Running services and restart commands

Observed at approximately 14:44 EDT; process IDs are observations, not durable identifiers:

| Port | URL / process | Purpose |
| --- | --- | --- |
| 3000 | http://127.0.0.1:3000, Node PID 27795 | App development server; `/design-preview` shows the clearly labeled synthetic frontend |
| 3010 | http://127.0.0.1:3010, Node PID 8232 | Isolated real-call preflight; starts a call only after an explicit click |
| 3003 | No frontend worker server expected | Former external worker preview port |
| 3100 | Started/stopped by Playwright | Coordinator browser-test server |

Services were left running for continuity. Recheck listeners before starting duplicates; they may exit with the old terminal/session. Do not kill or restart 3010 during a human microphone check. No human call result has been reported to the coordinator.

From the project root, when the corresponding port is free:

```sh
npm run dev -- --port 3000
```

In a separate terminal:

```sh
node_modules/.bin/node --env-file=.env.local scripts/preflight/video-server.mjs
```

Use Node 22 (`.nvmrc`); npm scripts use the pinned local Node 22 binary. Do not upgrade dependencies. `npm ci` is needed only if dependencies are absent/stale. The system Node observed during bootstrap was 20; direct provider scripts deliberately use `node_modules/.bin/node`.

Next dev rewrites generated `next-env.d.ts` imports between `.next/types` and `.next/dev/types`; such a diff is generated, not a feature change. Check it before staging. Preserve the generated Next.js rules block in AGENTS.md. Read relevant installed `node_modules/next/dist/docs/` guides before writing framework code. Stop the app dev server or use an isolated worktree/output before build/test commands that could compete for `.next`.

## Verification already completed

- Local typecheck, 9 unit tests and production build passed on integrated code.
- Combined development browser suite: 8 passed, 1 production-only check intentionally skipped. The frontend worker separately verified the production preview route returns 404; evidence is in its task record.
- SQL rollback assertions initially failed, then passed after the documented repair. These use synthetic database claims; they are not the only ownership evidence.
- `auth-database-check.mjs` passed with real Auth JWTs: two confirmed fictional accounts, cross-owner REST/RPC denial, rejected direct writes/wrong capability, simultaneous acquisition conflict, idempotency and late-response terminal-state handling. It deletes only its own fixtures. No email/provider call was sent.
- The same script with `--ui-only` passed actual Chromium password sign-in, SSR-protected setup, sign-out and blocked re-entry on port 3000; fixtures removed.
- Tavus live API PAL/readback and private **test-mode** call creation/deletion passed. Test mode has no live counterpart; speech and video are not verified.
- GitHub CI passed on source `c48cecf` and exact merged PR head `d7bc7af` (links above). Raw test media, secrets and private prompts were not committed.

Commands, when a changed area warrants rechecking:

```sh
npm run typecheck
npm test
npm run build
npm run test:ui
supabase db query --linked --file supabase/tests/session_foundation.sql
node_modules/.bin/node --env-file=.env.local scripts/preflight/auth-database-check.mjs
node_modules/.bin/node --env-file=.env.local scripts/preflight/auth-database-check.mjs --ui-only
```

The last command needs the app on 3000. Do not rerun paid/provider or account-mutating checks merely because the editor changed. Live test scripts create/delete exact fictional fixtures and require administrative access; they are not application runtime code. A Docker-unavailable migration catalog-cache warning occurred, but remote migration application and assertions succeeded; installing Docker is not a build prerequisite.

## Next task, in order

1. Obtain/perform the bounded human preflight at 3010: five kitchen-chore exchanges, responsive synchronized face/voice, interrupt one reply, End while speaking/connecting, microphone release, optional local-camera release and a fresh second fictional context. Record observations in G1-00, never infer success from a joined room.
2. Repair actual provider/browser failures, then freeze media readiness, credential/expiry, state, error and teardown contracts. The local harness is not the app: its process memory, cookie and single active ID must not become the production ownership design.
3. Finish G1 authenticated session routes/repository and browser Daily controller. Lease before provider create; no blind retry after ambiguous timeout; bind trusted ID; clean late responses if End/expiry wins; acknowledge usable media; stop local media independent of remote failures; accurately track remote cleanup. Add auth-loss/navigation/duration teardown. Wire the existing presentation components instead of rebuilding them.
4. Check actual email delivery/confirmation callback and local/hosted origins. Default Supabase SMTP can restrict recipients/rates; confirmed admin fixtures did not test mail. Ask the user only for a specific account action when it is actually needed.
5. Run full signed-in G1 acceptance before G2 editable situation generation. G1 issues #1–#5 stay open until their full criteria are met; completed presentation code alone does not close #4.

Later: G2 generated editable situations is mandatory, then G3 approved memory, optional structured reflection/deletion, G5 evaluation and submission. No Photon/Relay, extra avatars or provider switches before core gates. Internal submission target: October 4, 11:30 AM America/Detroit; recorded official deadline is before noon. Preserve the buffer.

## Prompt to paste into Cursor

```text
Continue this project as coordinator in /Users/ethansaba/code/therapist.
Read AGENTS.md, STATUS.md, docs/23-CURSOR-HANDOFF.md, README.md,
docs/01-PRD.md, docs/10-BUILD-PLAN.md, and docs/tasks/G1-00-foundation.md.
Read relevant installed Next.js guides before framework changes.

Frontend PR #7 and foundation PR #8 are merged. Verify current main/Git
state, preserve existing work and .env.local, and start a focused branch.
Do not recreate the app, keys, PAL, migrations or frontend, or upgrade deps.

G1 remains active: real Auth/database/browser checks pass, but the human
Tavus + ElevenLabs video preflight has no recorded result. Coordinate the
3010 preflight first, then freeze the media contract and finish authenticated
session routes, Daily media lifecycle and wiring to the existing frontend.
Do not treat test-mode calls or synthetic UI as a working live integration.

Keep sign-in required, private context out of the counterpart, camera local
only, sessions fresh, and End independent of network cleanup. Follow the
gate order and existing task records; use independent agents only with clear
ownership. Keep GitHub and documentation current, record actual checks, and
ask me only for concrete account actions or the real microphone test.
```
