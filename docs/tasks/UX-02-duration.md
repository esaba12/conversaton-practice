# UX-02: Choose a 3- or 5-minute practice

Status: planned
Updated: October 3, 2026, 20:00 EDT
Assigned writer: unassigned
Coordinator: Cursor coordinator session
Gate: polish, if scheduled. PRD defaults.
Requirements/tests: P05 duration boundary. Schema already allows both lengths.
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: a focused branch from `main` when this becomes ready
- Worktree: `/Users/ethansaba/code/therapist` unless another writer is in that checkout
- Dev port: 3000 if this checkout is free; otherwise an isolated port
- Owned files: `app/practice/practice-workspace.tsx`, the setup/review presentation that gains the control, matching CSS, `tests/unit/api-client.test.ts` if the client starts sending 300
- Shared resources: `lib/schemas/session.ts` is already `z.union([z.literal(180), z.literal(300)])`. Do not widen it. Tavus `max_call_duration` already uses the request value (`lib/media/tavus.ts`).
- Dependency tasks and contract revisions: POST-01 accepted. Start request union in `lib/schemas/session.ts`.
- Unblock condition: the human accepts the workspace and schedules this task.

## Scope and acceptance

Outcome: before Start, the user can pick 3 minutes (default) or 5 minutes. The same choice applies to a reviewed role, the roommate example, and a saved person. The on-call timer and the provider cap use that choice.

Non-goals: other durations, a change to the lease RPC, captions, presets.

- [ ] Default remains 180. Choosing 5 minutes sends `durationSeconds: 300` and no other new field.
- [ ] The call timer shows the selected length. Auto-end uses it (`time_limit`).
- [ ] A 300-second start still rejects private notes and still sends only the existing start-body keys.
- [ ] Signed-out and cross-owner behavior is unchanged.

## Contract and documentation changes

- Inputs/outputs/errors: no schema change. Document the control in docs/02 and the “always 180 in the UI” note in docs/05 if one exists.
- Shared change: none expected. If the fingerprint already includes `durationSeconds`, keep that and add a unit assertion for 300.
- Updated specs: docs/02 defaults, this record.
- Decision/source: PRD “user may choose 3 or 5 minutes.”

## Verification evidence

- Date/time/timezone: October 3, 2026, 20:00 EDT
- Mode: not-run
- Outcome: not-run
- Tested commit/dirty state: `8f61d0968e1eba755c79281780f199f7960248f3`
- Exact command or manual steps: not run
- Exit code: not-run
- Observed result/artifact: `DURATION_SECONDS = 180` in `app/practice/practice-workspace.tsx`. Unit tests already accept a 300-second reviewed role at the server.
- Limitations: no UI control exists

## Handoff

- Changed paths and commit(s): none yet
- Remaining failures/risks: a five-minute call costs more provider time in a demo. Default stays 3.
- External account action: none
- Next smallest task: wait for the human to schedule it
- Ready for review: no
- Coordinator integration: pending
