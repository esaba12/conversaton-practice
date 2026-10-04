# UX-03: Optional collapsed captions

Status: integrated
Coordinator, October 3, 2026, 20:40 EDT: merged to `main`. Show captions is collapsed on the call and uses in-memory turns. `enable_closed_captions` stayed false. The “no captions control” line below is the state before this task.
Updated: October 3, 2026, 20:00 EDT
Assigned writer: unassigned
Coordinator: Cursor coordinator session
Gate: polish, if scheduled. docs/02 accessibility.
Requirements/tests: docs/02 “captions remain optional and collapsed.” Not required for G1.
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: a focused branch when this becomes ready
- Worktree: `/Users/ethansaba/code/therapist` unless occupied
- Dev port: 3000 if free
- Owned files: `lib/media/tavus.ts` caption flag, `lib/media/daily-controller.ts` if a caption event must be surfaced, `components/presentation/practice.tsx`, `app/practice/practice-workspace.tsx`, a unit test
- Shared resources: the live Tavus conversation body. This task touches the call path. Drop it first if the submission clock is tight (docs/29 cut order).
- Dependency tasks and contract revisions: POST-01 accepted, and a short read of current Tavus/Daily caption events against installed types before any flag flip.
- Unblock condition: the human schedules it after confirming the research step found a caption event that can be shown without recording or logging transcript text.

## Scope and acceptance

Outcome: captions are off until the user opens them during a call. The control is a disclosure, collapsed by default. Text shown is the same in-call utterance stream the reflection panel already holds in memory. Closing captions hides the text. End, sign-out, and page hide still clear it.

Non-goals: saving captions, live captions as a product log, announcing every token to a screen reader, turning captions on inside the Tavus dashboard for all future calls if the app can display the utterance stream it already receives.

Research step, before code: `conversation.utterance` app-messages already become in-memory turns (G4). If that text is enough for a collapsed panel, leave `enable_closed_captions: false`. Flip that provider flag only when the research note shows the utterance stream is absent or unusable for the user-facing caption.

- [ ] A captions disclosure is collapsed on connect. Opening it shows turns already held for this attempt. Closing it hides them.
- [ ] The region does not use a polite live region that speaks every new token. A single “captions on/off” announcement is enough.
- [ ] Caption text is cleared with the rest of the in-memory transcript.
- [ ] Production still does not log utterance text.

## Contract and documentation changes

- Inputs/outputs/errors: no new route. If the Tavus flag must change, record the exact property and that recording stays off.
- Shared change: coordinator approves any edit to `lib/media/tavus.ts`.
- Updated specs: docs/02 practice captions line, docs/08 if the flag means the provider stores text it did not store before.
- Decision/source: docs/02. docs/08 already says provider transcripts can exist even with recording off.

## Verification evidence

- Date/time/timezone: October 3, 2026, 20:00 EDT
- Mode: not-run
- Outcome: not-run
- Tested commit/dirty state: `8f61d0968e1eba755c79281780f199f7960248f3`
- Exact command or manual steps: not run
- Exit code: not-run
- Observed result/artifact: `enable_closed_captions: false` in `lib/media/tavus.ts`. No captions control in `practice.tsx`.
- Limitations: whether Daily already delivers caption cues is unread in this planning pass

## Handoff

- Changed paths and commit(s): none yet
- Remaining failures/risks: enabling provider captions can increase retained text at Tavus. Prefer the in-memory utterance path.
- External account action: none
- Next smallest task: research note, then stop for a schedule decision
- Ready for review: no
- Coordinator integration: pending
