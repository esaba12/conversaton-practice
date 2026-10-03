# G1-02: Connect live voice and guarantee local microphone teardown

Status: planned
Updated: October 3, 2026, America/Detroit
Assigned writer: unassigned; voice worker role
Coordinator: unassigned
Gate: G1
GitHub issue: [#3](https://github.com/esaba12/conversaton-practice/issues/3)
Pull request: not opened; CI: not run
Requirements/tests: P04, P05, P09, P13; T09, T12, T13 and real End microphone check

## Assignment and isolation

- Base ref + SHA: pending integrated G1-00 commit.
- Branch: proposed `agent/G1-02-voice`; not created by this brief.
- Worktree: proposed `/Users/ethansaba/code/therapist/.worktrees/G1-02-voice`; not created.
- Port: proposed 3002; no server or approved auth callback implied.
- Dependencies: frozen G1-00 browser voice/session/error contracts and authenticated short-lived credential shape. G1-01 may proceed concurrently against those contracts.
- Unblock condition: integrated foundation and frozen ownership; actual authenticated start credentials/provider access for live evidence.

Proposed exact ownership, frozen by G1-00 before `ready`:

- `lib/voice/elevenlabs-adapter.ts`, `lib/voice/mock-adapter.ts`, `lib/session/controller.ts`, `tests/unit/voice-adapter.test.ts`, `tests/unit/session-controller.test.ts`, and this task record.
- Shared resources: coordinator owns provider agent configuration, schemas/dependencies, main entrypoints, and scheduling the shared live microphone. No worker database writes or shared provider edits.

## Scope and acceptance

- [ ] Implement the browser adapter against current official ElevenLabs docs and installed SDK types. Use only server-issued session credentials; no provider secret in client code (P04/T12).
- [ ] Wire connection, microphone permission/failure, agent/user activity, mute, End, and retryable connection failures through the frozen contract. Mute is never labeled pause (P05).
- [ ] Call the authenticated connected acknowledgement after transport success, using the existing lease and frozen retry contract. Server terminal/expired responses tear down locally; client-reported provider IDs are hints, not authorization for provider operations.
- [ ] End stops current/future playback and releases acquired microphone resources. Teardown is idempotent after partial connection, provider errors, repeated End, and late callbacks (P09/T09).
- [ ] Sign-out, auth expiry, navigation/unmount, and failed server End trigger local teardown without awaiting network acknowledgement. Reject late events or completion that would restart a terminated session (P13/T13).
- [ ] Keep transport state compatible with persisted `connecting`, `active`, `ending`, `ended`, `interrupted`, `deleted`; separate UI-only phases `draft`, `ready`, `reflecting`, `closed`.
- [ ] Use the frozen public-only roommate context; do not introduce advice, private preparation, previous simulated history, persistence tools, or transcript logging.
- [ ] Provide a visibly identifiable mock mode for deterministic lifecycle/UI checks. Mock tests must not be reported as real provider audio or acoustic evidence.

## Contract and documentation handoff

Return connection/state/control behavior and limitations to the UI/integration owners.
Send requested changes to docs/03, 05, 06, 09 and environment/setup guidance through the
coordinator. Document verified SDK version, actual teardown behavior, provider errors,
and pending real tests; do not invent methods or claim account configuration is complete.

## Verification evidence

- Mode/outcome: `not-run` / `not-run`; no adapter or audio check executed by this brief.
- Date/time, tested SHA/dirty state, environment/directory, exact command/manual steps, exit code, observation/artifact: pending.
- Planned checks: local lifecycle tests, no late playback/reconnect after teardown, permission/connection failure handling. Final live five-exchange conversation and mic-indicator observation run in G1-04 with actual browser/provider details.

## Handoff

- Changed implementation paths/commits: none recorded.
- Remaining blocker: foundation; real voice additionally depends on authenticated credentials and ElevenLabs access.
- Next action: coordinator freezes contracts and assigns voice worker after G1-00.
- Ready for review/integrated revision: no / pending. Report any provider-setting request; do not mutate the shared agent silently.
- Follow [workflow](../19-AGENT-WORKFLOW.md) and [documentation standard](../20-DOCUMENTATION-STANDARD.md).
