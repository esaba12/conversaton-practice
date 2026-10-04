# REV-02: Privacy and security review, with URL and redirect fixes

Status: review
Updated: October 4, 2026, 11:06 AM EDT
Assigned writer: Cursor session on `ui/redesign`
Coordinator: same session
Gate: submission follow-up (after G5 and Phases 0–3)
Requirements/tests: T01, T03, T08, T12, T13, T16. Live call N/A; no provider call in this pass.
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `origin/main` `9b7bc93` (same tree as local `ui/redesign` `4a8f52f`)
- Branch: `privacy/rev-02`
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A
- Owned files: the paths in Handoff. No migration, lockfile, or provider-account change.
- Shared resources: none. No Supabase apply and no live Tavus or OpenAI call.
- Dependency tasks and contract revisions: [REV-01](REV-01-g5-privacy-review.md) (October 3; its three should-fix items were already fixed in FIX-01, FIX-02, and FIX-03). This pass re-reads the tree after Phases 0–3 and the uncommitted SpeakEasy UI.
- Unblock condition: none

## Scope and acceptance

Outcome: call credentials are accepted only for `https://tavus.daily.co/{id}`. The browser controller refuses any other room before joining, so the microphone is not published to another Daily host. Face stills are fetched only from `https://cdn.replica.tavus.io`, and that fetch does not follow redirects. Tavus, OpenAI, and ElevenLabs requests that send a secret use `redirect: "error"`. Responses also send `Content-Security-Policy: base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'`.

Non-goals: a full `script-src` policy (that needs nonces and would risk the Daily call and Next scripts on submission morning), disabling public sign-up, moving rate limits off the server process, and removing the new home-screen streak.

- [x] A room URL on any host other than `tavus.daily.co`, or with a query, userinfo, port, or extra path segment, fails `mediaCredentialSchema`.
- [x] `createDailyController` does not join a room URL with no conversation id.
- [x] A portrait URL that is not `https://cdn.replica.tavus.io/...` is not fetched and the route fails with 503.
- [x] Provider fetches that send `x-api-key`, `Authorization`, or `xi-api-key` set `redirect: "error"`.
- [x] `npm run typecheck` and `npm run build` pass. Affected unit tests pass. Live call not run.

## What the review checked

Static read on October 4, 2026. No new blocker.

- Every route under `app/api` calls `requireIdentity()` and rejects anonymous users. Practice pages redirect signed-out visitors to sign-in. The home page renders the dashboard only after `getUser()` succeeds for a non-anonymous user.
- `practice_sessions` select for `authenticated` is still column-scoped. `provider_conversation_id`, `request_fingerprint`, and `idempotency_key` are not in that grant. Session RPCs that return the full row require `SESSION_SERVER_SECRET` through `practice_private.require_owner`.
- Counterpart context is still `buildRoleContext` plus the reviewed opening. Saved-person context is `person_context` (shared facts only). Stand-in context is `buildStandInContext`: goal and optional hard-moment line for that one call, not traits, shared facts, private prep, fears, or likelihoods. A normal start body cannot carry the goal.
- Goal check accepts the goal and up to six of the caller’s own turns, after `requireLiveSession`, with `store: false`. It refuses a stand-in session. Reflection and the one alternate phrasing run only after `requireEndedSession`, and reflection reads the body only after that check.
- The dashboard selects session metadata, person name and relationship, an About-me count, and planned labels and likelihoods. It does not select private prep, fact text, fear text, check-in notes, or provider ids. The uncommitted UI review found no medium-or-higher issue in that diff.
- No `dangerouslySetInnerHTML`. API errors stay on `errorSchema`. Sign-in `?error=` maps only through a fixed notice table. The auth callback redirects only to fixed paths on this origin. Camera preview stays local (`videoSource: false`). Recording flags stay off.

## Contract and documentation changes

- Inputs/outputs/errors and relevant ownership/privacy boundary: a Tavus conversation URL that fails `isTavusRoomUrl` never becomes a credential. A portrait URL that fails `allowedPortraitUrl` returns 503 and is not requested. A redirect on a secret-bearing provider call fails that call closed (503 or the existing provider error), instead of following the redirect.
- Shared change: `mediaCredentialSchema` is stricter. Browser tests that mocked `fixture.daily.co` or `hero.daily.co` now use `https://tavus.daily.co/...`. Consumers are `lib/media/tavus.ts`, `lib/session/api-client.ts` via `startResponseSchema`, and `lib/media/daily-controller.ts`.
- Updated specs: [docs/08](../08-SAFETY-AND-PRIVACY.md) threat-model mitigations, [docs/22](../22-LIVE-VIDEO.md) application boundary, [docs/next/03-CONTRACTS.md](../next/03-CONTRACTS.md) §2.9 portraits.
- Decision/source: Tavus Create Conversation URLs are `https://tavus.daily.co/{conversation_id}` ([docs/22](../22-LIVE-VIDEO.md) sources). Face still host `cdn.replica.tavus.io` is the SPIKE-01 read of the faces API.

## Verification evidence

- Date/time/timezone: October 4, 2026, 10:57 AM EDT
- Gate and requirement/test IDs: T01, T03, T08, T12, T13, T16
- Mode: unit
- Outcome: fail, then fixed before the next entry
- Tested commit/dirty state: `4a8f52f45f7a5bfab8ebddf97fa762de9d137411` plus uncommitted edits
- Environment + working directory: local, `/Users/ethansaba/code/therapist`
- Exact command: `npx vitest run tests/unit/contracts.test.ts tests/unit/starter-media.test.ts tests/unit/daily-controller.test.ts tests/unit/tavus.test.ts tests/unit/session-server.test.ts tests/unit/voice-preview.test.ts tests/unit/goal-check-route.test.ts tests/unit/setup-generate.test.ts tests/unit/reflection-generate.test.ts`
- Exit code: 1
- Observed result/artifact: 189 passed, 1 failed. The portrait refusal test reused the cached manager face id from the previous test, so it served the cached still. The test was pointed at face id `fblocked`.
- Limitations: this run is not the final result.

- Date/time/timezone: October 4, 2026, 10:58 AM EDT
- Gate and requirement/test IDs: T01, T03, T08
- Mode: unit
- Outcome: pass
- Tested commit/dirty state: same dirty tree
- Environment + working directory: local, `/Users/ethansaba/code/therapist`
- Exact command: `npx vitest run tests/unit/starter-media.test.ts tests/unit/daily-controller.test.ts tests/unit/contracts.test.ts`
- Exit code: 0
- Observed result/artifact: 3 files, 47 tests passed
- Limitations: does not re-run the other six files from the 10:57 run. Those six had already passed with `redirect: "error"` in place. No browser suite.

- Date/time/timezone: October 4, 2026, 11:02 AM EDT
- Gate and requirement/test IDs: T01, T03
- Mode: unit
- Outcome: pass
- Tested commit/dirty state: same dirty tree
- Environment + working directory: local, `/Users/ethansaba/code/therapist`
- Exact command: `npx tsc --noEmit && npx vitest run tests/unit/starter-media.test.ts`
- Exit code: 0
- Observed result/artifact: typecheck clean; 6 portrait tests passed. An earlier `tsc` had failed on the portrait test’s fetch-mock tuple; the mock now accepts `RequestInit`.
- Limitations: not the full unit suite.

- Date/time/timezone: October 4, 2026, 11:03 AM EDT
- Gate and requirement/test IDs: submission build
- Mode: static
- Outcome: pass
- Tested commit/dirty state: same dirty tree
- Environment + working directory: local, Next.js 16.3.8, `/Users/ethansaba/code/therapist`
- Exact command: `npm run build`
- Exit code: 0
- Observed result/artifact: production build compiled. Build warned that `metadataBase` is unset, so the open-graph image is resolved as `http://localhost:3000` at build time.
- Limitations: no Playwright, no two-owner SQL, no live call. Design-preview routes are built as static shells; each page still calls `notFound()` outside development.

## Handoff

- Changed paths and commit(s): one commit on `privacy/rev-02` from `main` `9b7bc93`. Code: `lib/schemas/media.ts`, `lib/media/tavus.ts`, `lib/media/presets.server.ts`, `lib/media/daily-controller.ts`, `lib/voice-preview/server.ts`, `lib/goal-check/generate.ts`, `lib/reflection/generate.ts`, `lib/setup/generate.ts`, `next.config.ts`. Tests and preflight: `tests/unit/contracts.test.ts`, `tests/unit/starter-media.test.ts`, `tests/unit/daily-controller.test.ts`, `tests/browser/hero-path.spec.ts`, `scripts/preflight/g5-checks.mjs`, `scripts/preflight/video-server.mjs`. Docs: `docs/08-SAFETY-AND-PRIVACY.md`, `docs/22-LIVE-VIDEO.md`, `docs/next/03-CONTRACTS.md`, this record, `STATUS.md`.
- Remaining failures/risks: public sign-up can spend Tavus and OpenAI credit while the deployment stays open. Draft, voice-preview, and goal-light limits are per server process, so they are weaker on Vercel than the numbers in code. Provider retention is unchanged from [docs/08](../08-SAFETY-AND-PRIVACY.md). The new home screen shows a day streak; [docs/08](../08-SAFETY-AND-PRIVACY.md) says not to add perfection streaks. That is a product-safety mismatch, not a cross-user leak, and it was not removed.
- External account action: none for these code changes. If production stays up after the demo, turn off new sign-ups in the Supabase project.
- Next smallest task: merge `privacy/rev-02` if the owner wants these checks on production. They are not on production `9b7bc93`.
- Ready for review: yes
- Coordinator integration: pushed, not merged, not deployed.
