# G1-04: Integrate and verify the authenticated FaceTime-style live video slice

Status: planned
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
- Unblock condition for wiring/static checks: reviewed worker work. The fresh Supabase project is configured and Auth health returned HTTP 200; real sign-in, migration access, and database isolation remain untested. Live acceptance additionally needs Supabase Auth/database access, ElevenLabs and selected avatar provider access, configured demo/test callback origin, and available microphone/camera/browser. Continue independent integration while account dependencies are pending. Follow [the live video contract](../22-LIVE-VIDEO.md); LiveAvatar is a researched candidate, not a proven selection.

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
