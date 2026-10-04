# 1D: Meet card and green room (S1, S2, W4 before, U1 streaming UI, U2 knowledge panel, T1 and D2 notices)

Status: in progress (worker dispatched October 4, ~00:55 EDT)
Updated: October 4, 2026, 00:55 EDT
Assigned writer: 1D worker subagent (claude-opus-5-5-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1D; docs/32 S1, S2, T1 (and the U1/U2/D2 sections in docs/32 or docs/next/04-NEW-SPECS.md); docs/next/04-NEW-SPECS.md W4 (before), W11 (streamed draft events); docs/next/03-CONTRACTS.md §2; docs/33 Meet/green-room screens; docs/next/05-UI-UPGRADE.md
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/63
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `50beba5` (C1, M1, 1C and 1B merged; 1B screens not yet wired into the workspace).
- Branch: `agent/1d-meet-green-room`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1d`
- Dev port: 3102
- Owned files: `components/practice/meet*.tsx`, `components/practice/green-room*.tsx` (+ CSS modules), `lib/practice/mic-meter.ts`, `lib/practice/devices.ts`, a client helper for the W11 event-stream draft if needed (`lib/setup/draft-stream-client.ts`), `app/design-preview/**` (add Meet/green-room states), tests, this record.
- Not owned (propose in Handoff): `app/practice/practice-workspace.tsx`, `lib/practice/flow.ts`, `lib/practice/private-state.ts` (use its API), `lib/schemas/**`, `lib/setup/generate.ts` and the draft route (1C, merged), `lib/media/**` and call components (1A in progress), lobby/briefing (1B, merged), stand-in components (1G in progress), `package.json`, lockfile, numbered docs, STATUS.md.
- Shared resources: no live calls, no provider calls, no migrations; port 3100 is the coordinator's. The green-room mic meter must use `getUserMedia` only after user action and release the stream on leave, on ready (handed to Daily) and on error.

## Scope and acceptance

From 02-BUILD-PLAN 1D:
- [ ] S1 and S2 acceptance lists.
- [ ] Mic stream released on leave, on ready (handed to Daily) and on error; camera stays off unless opted in (local preview only).
- [ ] Tone notice (T1) on both screens; reflection disclosure line present (D2).
- [ ] U1: the identity renders before the draft returns and fields fill as they stream (consume 1C's `text/event-stream` draft: `field` events, then one `done`; `error` event shape is `errorSchema`).
- [ ] U2: the "Knows" list matches the start body's role fields by name; "Never sees" lists only fields the user filled.
- [ ] W4 (before): the user's guess is private state only (`lib/practice/private-state.ts`), never in any request body.
- [ ] Stance chips are counterpart context the user sees and edits; prediction, fear and likelihood stay private.
- [ ] Starter portraits via `GET /api/portraits/[presetId]` with the initials fallback (reuse `components/ui/person-card` portrait logic if exported).
- [ ] Meet/green-room states in `/design-preview` with `data-gallery-state` markers; no horizontal overflow at 320/390 px (use `grid-template-columns: minmax(0, 1fr)` on grid columns that hold nowrap chips).

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
