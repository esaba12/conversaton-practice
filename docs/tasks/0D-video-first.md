# 0D: Video-first counterpart media (Q3)

Status: implemented; mock-tested; live not verified
Updated: October 3, 2026, 22:45 EDT
Assigned writer: 0D worker subagent (claude-sonnet-5-5-high)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 0
Requirements/tests: docs/32 Q3; docs/22 (live requires video)
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/45
Pull request: see Handoff
CI run: not run

## Assignment and isolation

- Base ref + SHA: `main` at 51ef56c (0C integrated).
- Branch: `agent/0d-video-first`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/0d`
- Dev port: 3103
- Owned files: `lib/media/daily-controller.ts`, `components/practice/remote-media.tsx` (extracted by 0C), `tests/unit/daily-controller.test.ts`, new `tests/unit/remote-media.test.ts`, `components/practice/call-stage.tsx` (one-line wiring), this record.
- Shared resources: `lib/schemas/media.ts` is coordinator-owned and unchanged in C0; the `remote-video-playing` signal stays internal to the controller/component.
- Dependency tasks and contract revisions: 0C integrated.
- Unblock condition: 0C merged to `main`.

## Scope and acceptance

Outcome: the counterpart's audio stays muted until the remote video element fires `playing` (or has a decoded frame), then unmutes. No audio-only fallback.

- [x] Mock-media unit test: audio unmutes only after video `playing`.
- [x] If video never arrives within the existing timeout, the existing failure state shows; no audio-only "live".
- [x] End still stops all tracks (existing teardown tests pass).
- [x] Typecheck and `npm test` pass.

## Contract and documentation changes

- Shared change: none.
- Updated specs: propose a docs/22 line ("audio unmutes after video playing") via Handoff.

## Verification evidence

Mock-tested only; live not verified.

- `npm run typecheck`: exit 0. `npm test`: 22 files, 430 tests passed (includes 9 new gating tests in `daily-controller.test.ts` and 9 in the new `remote-media.test.ts`). `npm run build`: exit 0. `npm run test:ui` not run (port 3100 is the coordinator's). No dev server started; no provider calls.
- (a) Audio muted before video plays: `remote-media.test.ts` (element muted on attach, stays muted through `loadeddata`/`timeupdate` without a frame, never unmuted if video never plays); `daily-controller.test.ts` (no `ready` while both tracks are playable until the playing signal).
- (b) Unmutes after `playing`: gate unmutes once on `playing`, on a decoded frame (readyState >= 2 and nonzero video size), or on `requestVideoFrameCallback`; controller emits `ready` once after the signal and ignores repeats.
- (c) Never-playing video: after `VIDEO_FIRST_TIMEOUT_MS` the controller emits `failed: video_lost`, destroys the call and releases the mic; `ready` never fires and a late signal is ignored. Same when no remote video arrives after joining.
- (d) Replacement/re-subscribe: new stream gets a fresh gate (element muted again, new signal required); a late signal from the replaced stream is ignored; the watchdog re-arms; no second `ready`.
- (e) Teardown after gating: local mic and preview tracks stopped, `remote-stream: null` emitted, call destroyed once, no pending timers, late signals and Daily events ignored; gate detach removes every listener and clears `srcObject`. Existing teardown tests unchanged and passing.
- Existing utterance-analysis stripping tests are unchanged. The only edits to existing tests: the "emits ready exactly once" test now also sends the playing signal (and asserts no `ready` before it), and `setup()` ends controllers in `afterEach` so watchdog timers do not leak.

## Handoff

- Changed paths and commit(s): `lib/media/daily-controller.ts`, `components/practice/remote-media.tsx`, `components/practice/call-stage.tsx`, `tests/unit/daily-controller.test.ts`, `tests/unit/remote-media.test.ts`, this record. Commit SHA and PR URL are in the PR.
- How it works: the remote `<video>` is attached muted (`gateRemotePlayback`). It unmutes on `playing`, or on a decoded frame (readyState >= HAVE_CURRENT_DATA with nonzero `videoWidth`, or `requestVideoFrameCallback`), then calls `reportRemoteVideoPlaying(stream)`, an internal export of the controller (a WeakMap keyed by stream; not a `MediaEvent`, `lib/schemas/media.ts` untouched). The controller emits `ready` (which moves ringing to the call) only after that signal and both Daily tracks being playable.
- Timeout: finding: there was no client-side video-arrival timeout before this task (only Tavus's server-side 120 s absent timeout), so a call with no video would ring until the user cancelled. 0D adds `VIDEO_FIRST_TIMEOUT_MS = 45_000`, armed after join, re-armed whenever the remote stream is replaced, cleared once the call is ready and video is playing. On expiry: `failed: video_lost` through the existing failure path (message: "The counterpart’s video stopped, so the call was ended."), full teardown. Coordinator may tune the value or want a distinct reason; that would be a shared-contract change, so it is only proposed here.
- Proposed docs/22 line (coordinator applies): "The counterpart's audio stays muted until the remote video is playing; the call is not live and audio never unmutes if video does not play within 45 s (the call ends as video lost)."
- Remaining failures/risks (live check needed): (1) `playing` timing on a real Tavus MediaStream is unverified; the frame fallbacks should cover a missed event but the 45 s timeout is a guess. (2) Unmuting an already-playing element relies on the user's earlier click granting autoplay permission; Safari may pause on unmute (no `play()` retry added). (3) When the audio track arrives after video, a new stream is built, so the element reloads and re-gates (existing behavior plus a short additional mute). (4) Audio is gated at the element, not the Daily track, so Daily still receives the audio track while hidden.
- External account action: none
- Next smallest task: live call with headphones, watching that audio never precedes the first frame and that ringing ends on first video.
- Ready for review: yes (draft PR)
- Coordinator integration (October 3, ~23:55 EDT): independent review (different model) found one blocker and two should-fixes, all fixed by the coordinator before merge. Blocker: unmuting without fresh user activation can pause the element, so after unmute the gate now calls `play()`; if that is refused it re-mutes, keeps the picture playing and unmutes on the next `pointerdown`/`keydown`, and a `pause` listener re-calls `play()`. Should-fix: a decoded frame no longer releases audio while the element is paused. Should-fix: the 45 s watchdog clears once video is playing, even if Daily audio is not yet `playable`. Three tests added (433 total). Coordinator reran typecheck, npm test, build and npm run test:ui. docs/22 line added. Live not verified: needs a headphones call checking that audio never precedes the first frame and that ringing ends on first video, in Chrome and ideally Safari.

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
