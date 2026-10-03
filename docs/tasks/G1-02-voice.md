# G1-02: Connect the live talking AI video call and guarantee media teardown

Status: review
Updated: October 3, 2026, 15:02 America/Detroit
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

## Implementation (dispatch scope)

`createDailyController: CreateMediaController` in `lib/media/daily-controller.ts` ports the human-verified `scripts/preflight/video.html` approach. Daily is imported lazily inside `connect`, so server rendering can import the module. The controller is single-use: a second `connect` rejects without creating another call object.

Daily APIs used, each checked against `node_modules/@daily-co/daily-js/index.d.ts` (0.87.0): `Daily.createCallObject({ audioSource: true, videoSource: false })`, `join({ url, token, startVideoOff: true, startAudioOff })`, `participants()` with `tracks.{audio,video}.{state,persistentTrack,track}` and `session_id`, `setLocalAudio(enabled)`, `destroy()`, and `on()` for `participant-joined`, `participant-updated`, `track-started`, `track-stopped`, `participant-left`, `camera-error`, `error`, `left-meeting`.

Event mapping:

- `participant-joined` / `participant-updated` / `track-started`, plus a check right after join: build a `MediaStream` from the remote participant's live `persistentTrack`s and emit `remote-stream` when the track set changes. Emit `ready` once, when the remote `video.state` and `audio.state` are both `playable`.
- `track-stopped` for a non-local participant's video: `failed: video_lost`.
- `error`: `exp-token`/`exp-room` map to `failed: credential_expired`, `ejected` maps to `remote-left`, and anything else maps to `failed: provider_error`.
- `left-meeting`, or `participant-left` for the rendered remote participant (matched by `session_id`): `remote-left`.
- `camera-error` with `permissions` that block audio: `failed: microphone_denied`. Missing or in-use microphone errors map to `failed: join`. Video-only camera errors are ignored because Daily never receives a camera source.
- A rejected join maps to `microphone_denied` when the error is `NotAllowedError` or a permission message, and to `join` otherwise. An expired `expiresAt` is caught before any call object is created and maps to `credential_expired`. The controller never retries a join. If the user ends the session during a join, `connect` resolves quietly.
- Every failure tears down local media synchronously before it emits `failed`/`remote-left`. `end()` is idempotent, works synchronously first (generation bump, null streams, preview stop, `setLocalAudio(false)`, stopping local `persistentTrack`/`track`), then awaits a single shared `destroy()` and swallows its errors. It never calls the app server.
- `setMuted` calls `setLocalAudio(!muted)`. A mute set before join is applied through `startAudioOff`.
- `setCamera` uses `getUserMedia({ video: true, audio: false })` for local preview only. It resolves `true` when a preview is active and `false` after denial, a missing API, disable, end, or a superseded request. It emits nothing on denial, and a late acquisition stops its tracks immediately.

## Verification evidence

- Mode: **unit (mocked Daily and `navigator.mediaDevices`)**. Mocks do not establish live audio/video, lip sync, interruption, or microphone-indicator behavior.
- 2026-10-03 15:00 America/Detroit, base `7d6ff43` with an uncommitted shared checkout, project root:
  - `npx vitest run tests/unit/daily-controller.test.ts`: exit 0, 11/11 passed.
  - `npm run typecheck`: exit 0.
  - `npm test`: exit 0, 3 files and 20 tests passed.
- Unit coverage: join options (`videoSource: false`, `startVideoOff`); `ready` emitted once and only when both tracks are playable; idempotent `end` with one `destroy`, mic stopped, and preview stopped; Daily events ignored after `end`; a camera granted after `end` is stopped; camera denial resolves `false` with no events; a failed join tears down, rejects, does not retry, and refuses reuse; microphone denial via join rejection and via `camera-error`; expired credential; mapping for video loss, provider error, and left-meeting; mute calls `setLocalAudio`; the camera stream/track is never passed to any Daily method.
- Not run (per dispatch): `npm run build`, `npm run test:ui`, live calls.

## Handoff

- Changed paths: `lib/media/daily-controller.ts` (new), `tests/unit/daily-controller.test.ts` (new), this record. No commits (coordinator-owned).
- Remaining live checks (G1-04): interruption stops both speech and speaking animation; End during counterpart speech and during startup stops playback and releases the browser microphone indicator in the real app; camera preview enable/disable/End releases the camera indicator and is not published; real Tavus behavior on `max_call_duration` expiry (assumed to arrive as `ejected`/`left-meeting`, which maps to `remote-left`); whether a real microphone denial shows up as a join rejection or as `camera-error`.
- Proposed contract clarifications (no edit made): (1) document that `setCamera` resolves "preview is active now" (so `setCamera(false)` resolves `false`); (2) document that `connect` resolves without error when `end()` interrupts the join; (3) document that the `ejected` Daily error maps to `remote-left`.
- Ready for review/integrated revision: yes / pending coordinator integration. Report any provider-setting request; do not mutate the shared agent silently.
- Follow [workflow](../19-AGENT-WORKFLOW.md) and [documentation standard](../20-DOCUMENTATION-STANDARD.md).
