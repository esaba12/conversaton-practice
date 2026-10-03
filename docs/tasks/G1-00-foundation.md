# G1-00: Application and provider foundation

Status: active — human video feasibility and final media contract freeze pending
Owner: coordinator
Gate: G1 foundation; no product gate passed
Issue: https://github.com/esaba12/conversaton-practice/issues/1
PR: https://github.com/esaba12/conversaton-practice/pull/8
Branch: build/g1-foundation
Base: 4dc34a1; preservation e98fa75; scaffold a601a0e; provider/database fe27967; frontend merge cf32199; tested integration c48cecf
Worktree: /Users/ethansaba/code/therapist
Ports: app 3000; browser tests 3100; isolated video preflight 3010; external UI 3003

## Ownership and scope
Coordinator owns root configuration/lockfile, app wiring/auth shell, shared schemas, fixtures, provider adapter, preflight scripts, CI, numbered specs and STATUS. SQL authoring was delegated only under [G1-00C](G1-00C-session-schema.md); coordinator reviewed/executed. External frontend is isolated under [its task](G1-03-frontend-preview.md), with no shared writes.

G1 foundation establishes the smallest sign-in/session/video contract, not later generation/memory features. Presentation can develop against inert props before live media freeze.

## Completed foundation work
- Pinned Next 16.3.8, React 19.3.0, Node 22.23.3, TypeScript 5.9.3, Supabase SSR/client, Daily 0.87.0 and Zod 4.6.5. Lockfile committed. Vitest updated to patched 4.1.11 after initial audit; zero vulnerabilities then reported.
- Added real scripts and CI for typecheck, unit tests, production build and browser checks.
- Added sign-in/signup UI, callback, cookie-refresh proxy, verified nonanonymous workspace guard and explicitly disabled-call shell. Real browser password sign-in/sign-out passed with confirmed fictional accounts; email delivery/confirmation callback remains pending.
- Shared strict schemas separate identity, persisted session state, public-only fictional context, sanitized errors and provisional bounded media credentials.
- Linked selected fresh Supabase project; verified empty schema before ordered migrations. Owner-readable session metadata, direct-write denial, capability-gated RPCs and durable one-active-owner lease exist.
- Fixed observed Auth-schema delegation failure with an additive narrowly privileged identity-helper migration; public mutation functions remain restricted/RLS-constrained.
- Provisioned server capability hash; raw secret stays only in ignored local environment.
- Configured immutable Tavus PAL with stock face and premade ElevenLabs voice, explicit ElevenLabs TTS and perception off. Test-mode private conversation accepted and hard-deleted.
- Loopback-only real-call harness is available on 3010 with two fictional contexts, camera off/local-only, immediate local teardown and separate provider cleanup results.
- User received isolated frontend worktree/prompt; frontend PR #7 was reviewed and merged at cf32199, then its setup component was wired into the protected workspace with a sign-out control.

## Actual checks
October 3, 2026, America/Detroit, original checkout a601a0e plus current changes:
- 14:24: `npm run typecheck && npm test && npm run build`: exit 0, 9 unit tests and production build pass. Static/unit evidence only.
- Chromium `npm run test:ui`: exit 0, 2 signed-out/entry browser checks pass. No live-media mock claim.
- `supabase db push --dry-run` identified only intended migration; coordinator applied both ordered migrations. Initial SQL assertion failed on missing executor auth-schema usage, repaired additively.
- `supabase db query --linked --file supabase/tests/session_foundation.sql`: exit 0 after repair; rollback-only ownership/capability/idempotency/expiry/late-bind assertions pass.
- `node_modules/.bin/node --env-file=.env.local scripts/preflight/auth-database-check.mjs`: exit 0. Two real confirmed fictional Auth identities signed in, verified JWT ownership and simultaneous acquisition checks passed; all users/session fixtures removed. No email or provider call. [Evidence](G1-00D-auth-database-check.md).
- `node_modules/.bin/node --env-file=.env.local scripts/preflight/provider-setup.mjs`: exit 0. Live API PAL creation/readback plus test-mode private conversation/deletion pass. No audiovisual proof.
- Loopback preflight screenshot inspected without starting a call. Installed Next cookies/proxy/auth/route guides and Daily types reviewed.
- Foundation CI passed at cf32199: https://github.com/esaba12/conversaton-practice/actions/runs/37144707035. Combined local wiring check then passed typecheck, 9 unit tests, build and 8 browser tests (1 production-only skip). Real browser Auth check passed sign-in, protected integrated workspace, sign-out and denied re-entry; fixtures removed.

## Remaining acceptance

Final code CI: [run 37145104163](https://github.com/esaba12/conversaton-practice/actions/runs/37145104163) passed for c48cecfde061d5550b56265d6f045a78215de2b5 at 14:42 EDT, covering npm ci, typecheck, unit tests, production build and Chromium suite. Research handoff/doc-only follow-up does not alter implementation. Coordinator visually inspected combined desktop setup and 320px call fixtures; they are clearly labeled synthetic media and do not prove a live call.
Human live preflight must establish usable synchronized speech/video, interruption, two isolated contexts and actual media release before media contracts freeze. Full G1 then requires authenticated app integration, real UI Auth, readiness acknowledgement and End/auth-loss/navigation teardown through application routes. Credential expiry and app lease expiry remain separate. No raw transcript/media persistence; provider transcripts and downstream deletion limitations are explicit.

Next smallest action: record human preflight result, keep draft PR/CI current, then dispatch application media/auth tasks against accepted contracts. Do not advance to G2 or count test mode as a working live call.
