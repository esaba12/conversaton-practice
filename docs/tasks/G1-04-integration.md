# G1-04: Integrate and verify the authenticated live voice slice

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
- Unblock condition for wiring/static checks: reviewed worker work. Live acceptance additionally needs actual AWS auth/database and ElevenLabs access, configured demo/test callback origin, and available microphone/browser. Continue independent integration while account dependencies are pending.

Proposed exact ownership, frozen by G1-00 before `ready`:

- `app/layout.tsx`, `app/page.tsx`, `app/practice/page.tsx`, `tests/browser/g1-authenticated-flow.spec.ts`, and this task record.
- Coordinator maintains `STATUS.md` and affected docs/01, 02, 03, 04, 05, 06, 09, 10, 12, 15, 18. Shared schemas, lockfile and worker implementation repairs require explicit ownership transfer or a new bounded repair task.
- Shared resources: coordinator applies reviewed migrations once, configures actual auth origins/provider resources, integrates branches sequentially, and schedules one live microphone check at a time.

## Scope and acceptance

- [ ] Review each worker's diff and privacy/ownership boundary, integrate one at a time, resolve interface mismatches with a single assigned writer, and record actual merged SHAs.
- [ ] Wire the signed-in entrypoint to owner-authorized session creation, public-only roommate context, browser voice controls, and local-first teardown. Signed-out/expired requests fail server-side; UI alone is insufficient (P13/T13).
- [ ] Apply the reviewed G1 users/session-lease/cleanup migration using separated administrative access. Verify runtime ownership restrictions with two actual signed-in users, including direct cross-owner session/End attempts (P12/T03).
- [ ] Verify one active lease per user, duplicate-start behavior, idempotent End, expiry/failure cleanup, and no sensitive output in client bundles/errors/logs (T09/T10/T12).
- [ ] Verify implemented G1 `connecting`, `active`, `ending`, `ended`, `interrupted` transitions agree across server/voice/UI, including connected acknowledgement retries. Reserve `deleted` and its late-result rejection contract for full G4 deletion integration. UI phases must not rewrite persisted state or revive a terminal session.
- [ ] Verify a browser-supplied provider ID cannot authorize lookup/deletion of another session; record the actual supported association mechanism or unresolved cleanup limitation.
- [ ] Run frozen typecheck, relevant unit/integration/browser checks, and production build against the combined revision. Record failures and exact fixes; isolated worker passes do not pass this gate.
- [ ] Complete five real exchanges with the fictional roommate through ElevenLabs in an authenticated session (P04). Record actual browser/provider/model/voice and observed limitations without retaining private audio/transcripts.
- [ ] End during playback and observe microphone release/no later audio; repeat relevant teardown paths for auth expiry/sign-out, navigation and server End network failure. Local cleanup must succeed independently of acknowledgement (P09/T09/T13).
- [ ] Inspect minimal UI, keyboard/focus, permission/connection failure and retry states; confirm any fallback is visibly labeled. Private context remains excluded (P05/T01).
- [ ] Mark G1 passed only after its real auth/database/audio/teardown requirements are observed. Keep unrelated G2-G5 tests and features pending; full memory/profile persistence remains G3.

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
