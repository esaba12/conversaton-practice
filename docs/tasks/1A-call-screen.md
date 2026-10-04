# 1A: Call screen, ringing, live interactions and call bar (S3, S4, S5, S6, W9)

Status: in progress (worker dispatched October 4, ~00:10 EDT)
Updated: October 4, 2026, 00:10 EDT
Assigned writer: 1A worker subagent (claude-opus-5-5-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1A; docs/32 S3, S4, S5, S6; docs/next/04-NEW-SPECS.md W9 (call bar), W5; docs/next/03-CONTRACTS.md §2.8; docs/33 call screens; docs/next/05-UI-UPGRADE.md §2
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/60
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `5d718ce` (Phase 0 complete).
- Branch: `agent/1a-call-screen`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1a`
- Dev port: 3101
- Owned files: `components/practice/ringing*.tsx`, `components/practice/call-*.tsx`, `components/practice/call.module.css`, `components/practice/remote-media.tsx` (keep 0D's gate intact), `lib/media/interactions.ts` (new), `lib/media/daily-controller.ts` (event parsing additions), `components/presentation/captions*` (restyle), `app/design-preview/**` (add call states), tests for these, this record.
- Not owned (propose changes in Handoff): `app/practice/practice-workspace.tsx`, `lib/practice/flow.ts`, `lib/schemas/**`, `lib/session/**`, `package.json`, lockfile, `scripts/**`, numbered docs, STATUS.md.
- Shared resources: no live calls; port 3100 is the coordinator's.
- Dependency tasks: Phase 0 merged. C1/M1 run in parallel; 1A does not depend on them.

## Scope and acceptance

From 02-BUILD-PLAN 1A:
- [ ] S3, S4, S5, S6 acceptance lists (docs/32).
- [ ] W9: Help and the "Fictional AI" pill always present on the call screen.
- [ ] Cancel during ringing tears down (mic released, session ended).
- [ ] Controls fade but stay in the accessibility tree; 56 px call-bar targets.
- [ ] `lib/media/interactions.ts`: typed builders only for `conversation.append_context`, `conversation.interrupt`, `conversation.respond`; fixed templates plus the reviewed name, or the user's typed turn (≤300). Wrap-up and ask-to-wait texts are fixed templates plus the name only.
- [ ] Event parsing: `conversation.utterance.streaming` (captions), `conversation.started_speaking` / `stopped_speaking` with role `pal` or legacy `replica` (speaking glow). Any `user_audio_analysis` field is dropped at parse time and never reaches React state.
- [ ] Call states added to `/design-preview` with `data-gallery-state` markers.

## Verification evidence

(worker fills in)

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- Proposed shared-file changes:
- External account action: none
- Ready for review:
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
