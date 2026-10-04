# 0D: Video-first counterpart media (Q3)

Status: in progress (worker dispatched October 3, ~23:50 EDT)
Updated: October 3, 2026, 22:45 EDT
Assigned writer: 0D worker subagent (claude-sonnet-5-5-high)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 0
Requirements/tests: docs/32 Q3; docs/22 (live requires video)
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/45
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `51ef56c` (0C merged in PR #53, 0E in PR #55).
- Branch: `agent/0d-video-first`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/0d`
- Dev port: 3103
- Owned files: `lib/media/daily-controller.ts`, `components/practice/remote-media.tsx` (extracted by 0C), `tests/unit/daily-controller.test.ts`, this record.
- Shared resources: `lib/schemas/media.ts` is coordinator-owned and unchanged in C0; the `remote-video-playing` signal stays internal to the controller/component.
- Dependency tasks and contract revisions: 0C integrated.
- Unblock condition: 0C merged to `main`.

## Scope and acceptance

Outcome: the counterpart's audio stays muted until the remote video element fires `playing` (or has a decoded frame), then unmutes. No audio-only fallback.

- [ ] Mock-media unit test: audio unmutes only after video `playing`.
- [ ] If video never arrives within the existing timeout, the existing failure state shows; no audio-only "live".
- [ ] End still stops all tracks (existing teardown tests pass).
- [ ] Typecheck and `npm test` pass.

## Contract and documentation changes

- Shared change: none.
- Updated specs: propose a docs/22 line ("audio unmutes after video playing") via Handoff.

## Verification evidence

(worker fills in)

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- External account action: none
- Next smallest task:
- Ready for review:
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
