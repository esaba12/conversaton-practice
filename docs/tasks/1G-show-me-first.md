# 1G: Show me first (W10), practice history and hasPracticed

Status: in progress (worker dispatched October 4, ~00:45 EDT)
Updated: October 4, 2026, 00:45 EDT
Assigned writer: 1G worker subagent (claude-opus-5-thinking-high)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1 (part of the hero-path checkpoint)
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1G; docs/next/04-NEW-SPECS.md W10 (acceptance 1–8); docs/next/03-CONTRACTS.md §2 (stand-in start branch in `lib/schemas/session.ts`), §2.7 (`buildStandInContext`), §2.5 (M1 `kind`, `practice_history()`); docs/07, docs/08, docs/32 A1 (stand-in exception)
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/66
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `6a378b3` (C1, M1 applied, 1C merged).
- Branch: `agent/1g-show-me-first`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1g`
- Dev port: 3103
- Owned files: `components/practice/stand-in*.tsx` (+ CSS module), `lib/practice/stand-in-client.ts` (the only client function that may send the goal), `lib/session/stand-in-context.ts` (server-only `buildStandInContext`), the stand-in branch in `lib/session/server.ts` (remove only the `standIn` part of the 400 guard), `app/api/practice-history/route.ts`, the `hasPracticed` derivation in `lib/data/people.ts`, a new `lib/data/practice-history.ts` if useful, `app/design-preview/**` (add stand-in/Your-turn states), tests, this record.
- Not owned (propose in Handoff): `app/practice/practice-workspace.tsx`, `lib/practice/flow.ts`, `lib/practice/private-state.ts` (use its API), `lib/schemas/**`, `lib/media/**` (1A is editing `daily-controller.ts`; reuse the existing call shell/components read-only), `components/practice/call-*`/`ringing*`/`remote-media.tsx` (1A), lobby/briefing components (1B), `package.json`, lockfile, migrations, numbered docs, STATUS.md.
- Shared resources: no live calls, no provider calls (mock Tavus in tests), no migrations, no real-Auth scripts.
- Stand-in media: server env `TAVUS_STANDIN_PAL_ID`, `TAVUS_STANDIN_FACE_ID` (reserved face; never a person preset). Use the optional media override already on `createConversation` in `lib/media/tavus.ts`. Session row `kind: 'stand_in'` via `acquire(..., { kind: 'stand_in', preset })` in `lib/data/sessions.ts`.

## Scope and acceptance

W10 list 1–8 (docs/next/04-NEW-SPECS.md), in short:
- [ ] 1. No goal: Show me first disabled with its reason. First practice with a person: primary button; after an ended practice: secondary. "Skip to my turn" goes straight to the normal call.
- [ ] 2. Stand-in start body contains only the allowed fields; normal, preset, saved-person and retry bodies still carry no goal or hard-moment line (unit).
- [ ] 3. `buildStandInContext` snapshot: goal, hard-moment line, counterpart's name and situation; no notes, fear, likelihoods, About-me facts, traits or stance chips.
- [ ] 4. `buildRoleContext` for the following Your-turn call contains no goal (regression).
- [ ] 5. Stand-in call turns are cleared at End and never sent to reflection.
- [ ] 6. Offered once per sitting; cap of three calls holds; retry still at most once.
- [ ] 7. End, sign-out and page hide release mic and camera from the stand-in call and the Your-turn card.
- [ ] 8. Stand-in face and voice ids never reach the browser (bundle grep).
- [ ] `GET /api/practice-history` (signed-in) returns `practiceHistoryResponseSchema` from `practice_history()`; `hasPracticed` on person reads derived from it.

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
