# G1-02: Connect the live talking AI video call and guarantee media teardown

Status: active
Updated: October 3, 2026, 14:58 America/Detroit
Assigned writer: Cursor subagent "G1-02 media controller"
Coordinator: Cursor coordinator session
Gate: G1
GitHub issue: [#3](https://github.com/esaba12/conversaton-practice/issues/3)
Pull request: not opened; CI: not run
Requirements/tests: P04, P05, P09, P13; T09, T12, T13 and live interruption/video/End microphone-camera checks

## Dispatch (supersedes the proposed assignment below)

- Base: branch `build/g1-session-media`, frozen-contract commit recorded in STATUS. Shared original checkout with G1-01/G1-03 workers on disjoint paths; no separate worktree.
- Owned paths: `lib/media/daily-controller.ts`, `tests/unit/daily-controller.test.ts`, this record.
- Frozen contract (read-only): `MediaController`, `MediaEvent`, `CreateMediaController`, `MediaCredential` in `lib/schemas/media.ts`. Export `createDailyController: CreateMediaController`. Reference behavior that a human verified live: `scripts/preflight/video.html`.
- Do not run `npm run build`, `npm run test:ui`, live calls, or Git commits; the coordinator does. Do not touch other workers' paths.

- Base ref + SHA: pending integrated G1-00 commit.
- Branch: proposed `agent/G1-02-voice`; not created by this brief.
- Worktree: proposed `/Users/ethansaba/code/therapist/.worktrees/G1-02-voice`; not created.
- Port: proposed 3002; no server or approved auth callback implied.
- Dependencies: frozen G1-00 browser media/session/error contracts, authenticated credential shape, and bounded provider feasibility decision in [the live video contract](../22-LIVE-VIDEO.md). G1-01 may proceed concurrently against those contracts.
- Unblock condition: integrated foundation and frozen ownership; actual authenticated start credentials and both conversation/avatar provider access for live evidence. Selected path is Tavus CVI with ElevenLabs TTS and Daily 0.87.0. PAL/test-mode API acceptance passed; actual video, speech and interruption remain unverified.

Proposed exact ownership, frozen by G1-00 before `ready`:

- `lib/media/conversation-adapter.ts`, `lib/media/avatar-adapter.ts`, `lib/media/mock-adapter.ts`, `lib/media/local-camera.ts`, `lib/session/controller.ts`, `tests/unit/media-adapter.test.ts`, `tests/unit/local-camera.test.ts`, `tests/unit/session-controller.test.ts`, and this task record. Adapter filenames express application boundaries; exact vendor calls follow G1-00 evidence.
- Shared resources: coordinator owns provider configuration, shared `lib/schemas/media.ts`, dependencies, main entrypoints, and scheduling the shared live microphone/camera. G1-01 owns `lib/media/server-credentials.ts`; this worker owns browser media acquisition/controllers. UI only displays stream references and emits controls. No worker database writes or shared provider edits.

## Scope and acceptance

- [ ] Implement conversation/avatar browser adapters against current official provider docs and installed SDK types, following G1-00's proven integration path. Use only server-issued scoped session credentials; no provider secret in client code (P04/T12).
- [ ] Produce a real-time talking counterpart video stream with responsive, visibly synchronized speech. Wire both-provider connection readiness, microphone permission/failure, agent/user activity, mute, End, and retryable connection failures through the frozen contract. Mute is never labeled pause (P05).
- [ ] Interruption cancels superseded speech and stale avatar playback together; prevent duplicate audio output and reject old video/audio chunks after interruption or session replacement. Record observed interruption behavior and any synchronization limitations.
- [ ] Call the authenticated connected acknowledgement after usable counterpart audio and live video are ready, using the existing lease and frozen retry contract. Server terminal/expired responses tear down locally; client-reported provider IDs are hints, not authorization for provider operations.
- [ ] Own optional local camera preview capture and release. Default camera off, ask permission only on explicit activation, keep preview muted/local-only, and never upload/publish its tracks to a provider or record it. Camera denial must not prevent the counterpart call; UI consumes the resulting stream reference rather than acquiring media itself.
- [ ] End stops current/future audio and video playback, detaches streams, cancels reconnects, and releases acquired microphone and optional camera tracks. Teardown is idempotent after partial connection, provider errors, repeated End, and late callbacks (P09/T09).
- [ ] Sign-out, auth expiry, navigation/unmount, and failed server End trigger local teardown without awaiting network acknowledgement. Late media acquisition must immediately stop acquired tracks; reject late events or completion that would restart a terminated session (P13/T13).
- [ ] Keep transport state compatible with persisted `connecting`, `active`, `ending`, `ended`, `interrupted`, `deleted`; separate UI-only phases `draft`, `ready`, `reflecting`, `closed`.
- [ ] Use the frozen public-only roommate context; do not introduce advice, private preparation, previous simulated history, persistence tools, or transcript logging.
- [ ] Provide a visibly identifiable mock mode for deterministic lifecycle/UI checks. Voice-only playback, static portraits, prerecorded video, and mocked streams cannot pass the live video gate; no mock test establishes provider audio/video quality.

## Contract and documentation handoff

Return connection/state/control behavior and limitations to the UI/integration owners.
Send requested changes to docs/03, 05, 06, 09, 22 and environment/setup guidance through the
coordinator. Document verified SDK version, actual teardown behavior, provider errors,
and pending real tests; do not invent methods or claim account configuration is complete.

## Verification evidence

- Mode/outcome: `not-run` / `not-run`; no adapter or live audio/video check executed by this brief.
- Date/time, tested SHA/dirty state, environment/directory, exact command/manual steps, exit code, observation/artifact: pending.
- Planned checks: local lifecycle/interruption tests, no stale video or late playback/reconnect after teardown, microphone/camera permission handling, no camera publication, partial-provider connection failures, and late-acquisition disposal. Final real five-exchange responsive lip-synced conversation and mic/camera-indicator observations run in G1-04 with actual browser/provider details.

## Handoff

- Changed implementation paths/commits: none recorded.
- Remaining blocker: foundation/provider feasibility; real video additionally depends on authenticated credentials, ElevenLabs access, and the selected avatar provider access.
- Next action: coordinator freezes contracts and assigns media worker after G1-00. The legacy task ID, branch, and filename remain unchanged.
- Ready for review/integrated revision: no / pending. Report any provider-setting request; do not mutate the shared agent silently.
- Follow [workflow](../19-AGENT-WORKFLOW.md) and [documentation standard](../20-DOCUMENTATION-STANDARD.md).
