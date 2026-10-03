# G1-04: Integrate and verify the authenticated FaceTime-style live video slice

Status: integrated — G1 passed (live, human-verified) with residual risks listed below
Updated: October 3, 2026, America/Detroit
Assigned writer: unassigned; coordinator role
Gate: G1 acceptance
GitHub issue: [#5](https://github.com/esaba12/conversaton-practice/issues/5)
Pull request: not opened; CI: not run
Requirements/tests: P04, P05, P09, P12, P13; G1 portions of T01, T03, T09, T10, T12, T13

## Assignment and isolation

- Base ref + SHA: pending integrated G1-00 plus reviewed worker commits.
- Branch/worktree: proposed `main` in `/Users/ethansaba/code/therapist`; verify actual checkout before integration.
- Port: proposed 3000; no running server or live callback assumed.
- Dependencies: G1-01, G1-02, G1-03 in `review` with frozen-contract evidence and integration-ready commits/diffs.
- Unblock condition for wiring/static checks: reviewed worker work. The fresh Supabase project is configured and Auth health returned HTTP 200; migration access and real-JWT database boundary checks now pass; UI email/callback sign-in and audiovisual integration remain untested. Live acceptance additionally needs Supabase Auth/database access, ElevenLabs and selected avatar provider access, configured demo/test callback origin, and available microphone/camera/browser. Continue independent integration while account dependencies are pending. Follow [the live video contract](../22-LIVE-VIDEO.md); Tavus CVI plus explicit ElevenLabs TTS is selected; API preflight is not live-media acceptance.

Proposed exact ownership, frozen by G1-00 before `ready`:

- `app/layout.tsx`, `app/page.tsx`, `app/practice/page.tsx`, root `proxy.ts` (or `middleware.ts` for Next.js 15), `tests/browser/g1-authenticated-flow.spec.ts`, and this task record.
- Coordinator maintains `STATUS.md` and affected docs/01, 02, 03, 04, 05, 06, 09, 10, 12, 15, 18, 22. Shared schemas, lockfile and worker implementation repairs require explicit ownership transfer or a new bounded repair task.
- Shared resources: coordinator applies reviewed migrations once, configures actual auth origins/provider resources, integrates branches sequentially, and schedules one live microphone/camera check at a time.

## Scope and acceptance

- [ ] Review each worker's diff and privacy/ownership boundary, integrate one at a time, resolve interface mismatches with a single assigned writer, and record actual merged SHAs.
- [ ] Wire the signed-in entrypoint to owner-authorized session creation, public-only roommate context, real-time talking counterpart video/audio, browser media controls, and local-first teardown. Signed-out/expired requests fail server-side; UI alone is insufficient (P13/T13).
- [ ] Apply the reviewed G1 session-lease/cleanup migration referencing Supabase auth.users, using separated administrative access. Verify RLS/runtime restrictions with two actual signed-in accounts, including direct cross-owner Data API, session, and End attempts (P12/T03).
- [ ] Verify one active lease per user, duplicate-start behavior, idempotent End, expiry/failure cleanup, and no sensitive output in client bundles/errors/logs (T09/T10/T12).
- [ ] Verify implemented G1 `connecting`, `active`, `ending`, `ended`, `interrupted` transitions agree across server/media/UI, including acknowledgement retries and requiring usable audio plus live counterpart video before connected readiness. Reserve `deleted` and its late-result rejection contract for full G4 deletion integration. UI phases must not rewrite persisted state or revive a terminal session.
- [ ] Verify browser-supplied IDs cannot authorize lookup/deletion of another conversation or avatar session; record actual supported association mechanisms and per-provider pending cleanup limitations. Confirm trusted per-session context does not mutate the shared agent prompt or leak one user's context into another session.
- [ ] Run frozen typecheck, relevant unit/integration/browser checks, and production build against the combined revision. Record failures and exact fixes; isolated worker passes do not pass this gate.
- [ ] Complete five real exchanges with a responsive, visibly lip-synced talking fictional roommate through ElevenLabs plus the selected avatar integration in an authenticated FaceTime-style call (P04). Record actual browser/provider/model/voice/avatar configuration, response/synchronization observations, and limitations without retaining private audio/transcripts. A static portrait, prerecorded footage, mocked streams, or voice-only playback cannot satisfy this check.
- [ ] Interrupt the counterpart through the microphone and verify both superseded speech and stale avatar playback stop; the next reply matches the new turn. Check failed/partial connections, stale video after retry, and no duplicate audio playback. Record observed live behavior rather than inferring it from mocks.
- [ ] End during playback and observe microphone release, any active camera release, and no later audio/video; repeat relevant teardown paths for auth expiry/sign-out, navigation, partial connection failure, and server End network failure. Late acquisition/callbacks cannot restart media. Local cleanup must succeed independently of acknowledgement (P09/T09/T13).
- [ ] Verify optional camera preview is off by default, local-only, and never published/uploaded/recorded; camera denial still permits a counterpart call. Inspect actual provider calls/track publication as well as visible permission indicators.
- [ ] Inspect the FaceTime-style UI, keyboard/focus, permission/connection failure and retry states; confirm any fallback is visibly labeled. Private context remains excluded (P05/T01).
- [ ] Mark G1 passed only after its real auth/database/responsive video/audio/teardown requirements are observed. Keep unrelated G2-G5 tests and features pending; full memory/profile persistence remains G3.

## Documentation and status

Update specs/runbooks to final interfaces and configuration; link task evidence instead
of copying it. Record integrated SHA, actual check results, selected resources without
private identifiers, limitations, and next gate in STATUS. Pending provider cleanup
must remain pending; no instant-erasure promise or claim that all release tests passed.

## Integration record (October 3, 2026)

Branch `build/g1-session-media`: contracts `7d6ff43`, G1-02 `1e20d98`, G1-01 `bdc6ae1`, G1-03 `a8211af`, integrated one at a time after coordinator review. Coordinator contract changes on integration: `INTERNAL_ERROR` code for unexpected 500s; documented media clarifications (ejected = remote-left, `setCamera` resolves current preview state, `connect` resolves if End interrupts) and SESSION_ACTIVE replay semantics.

Checks on combined `a8211af`, original checkout, Node 22.23.3, America/Detroit ~16:10:
- `npm run typecheck`: exit 0. `npm test`: 5 files, 38 tests pass (unit/mock only).
- `npm run build`: exit 0; routes `/api/sessions`, `/api/sessions/[id]/connected`, `/api/sessions/[id]/end`, dynamic `/practice`.
- `npm run test:ui` (with `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright`; the sandbox's temporary browser cache was empty): 8 pass, 1 production-only skip.
- Live HTTP on dev 3000, signed out: POST start and end → 401 UNAUTHENTICATED; cross-site Origin → 403 FORBIDDEN; `/practice` → 307 to sign-in. No provider call made.

- ~16:13, live/pass (human + server log): real email signup with Supabase default SMTP delivered a confirmation email. First callback hit was `otp_expired` (an expired/reused link), a later callback with an auth code succeeded and `/practice` rendered 200 for the signed-in user. Hosted origins/redirects remain unconfigured.

- ~16:15, live/pass (human report "it worked" + server log + DB read): signed-in app call on `a8211af`. `POST /api/sessions` 201 (2.2 s), `/connected` 200, `/end` 200 (4.1 s). Session row: status `ended`, cleanup `confirmed`, provider ID bound, ~43 s duration. Remote Tavus end + hard delete confirmed through the app path. ElevenLabs retention separate.
- ~16:17, live/pass (human-itemized): responsive talking counterpart video, about five exchanges, interruption stopped the reply, browser microphone indicator off after End, mid-call sign-out ended the call cleanly. Lip sync slightly imperfect (stock face, known limitation).

**G1 result: passed** on `a8211af` for authenticated workspace, owner-scoped RPC authorization (real-JWT two-owner and concurrent checks in [G1-00D](G1-00D-auth-database-check.md)), real synchronized five-turn video, interruption, End and sign-out teardown, and confirmed remote cleanup. Residual, not individually observed in the app: lease/auth expiry teardown, 180 s time-limit auto-end, pagehide keepalive end, End with the server unreachable, camera preview on/off in a live call, and two-owner denial through the new HTTP routes (same RPCs as G1-00D). Recheck these in G5 evaluation.

Previously listed, now observed except as noted above: signed-in five-turn live call in the app, interruption, End/microphone release, auth-loss/navigation teardown, live Tavus cleanup confirmation, two-owner HTTP denial on the new routes. G1 not passed.

## Verification evidence

- Mode/outcome: `not-run` / `not-run` for every implementation/live acceptance check.
- Date/time, tested SHA/dirty state, environment/directory, exact commands/manual steps, exit codes, observations/artifacts: pending.
- Planned checks: the frozen project verification commands and live observations above; label `mock`, `unit`, and `live` separately and attribute human-reported observations.

## Handoff

- Changed implementation paths/commits and integrated revision: none recorded.
- Remaining blocker: foundation, three worker tasks, and actual provider/account access.
- Next action: coordinator completes G1-00 before dispatch; this task begins once reviewed work is available.
- Ready for review/G1 result: no / not run. If a core check fails, record a bounded repair task instead of advancing the gate.
- Follow [workflow](../19-AGENT-WORKFLOW.md) and [documentation standard](../20-DOCUMENTATION-STANDARD.md).
