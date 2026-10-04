# 1B: Lobby and briefing (P1, P3, W2 UI, R1 chips)

Status: in progress (worker dispatched October 4, ~00:25 EDT)
Updated: October 4, 2026, 00:25 EDT
Assigned writer: 1B worker subagent (claude-opus-5-5-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1B; docs/32 P1, P3, R1; docs/next/04-NEW-SPECS.md W2; docs/next/03-CONTRACTS.md §2 (C1, frozen) and §2.9 (portraits); docs/33 lobby/briefing screens; docs/next/05-UI-UPGRADE.md
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/61
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `916e590` (C1 merged).
- Branch: `agent/1b-lobby-briefing`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1b`
- Dev port: 3102
- Owned files: `app/practice/page.tsx`, `components/practice/lobby*.tsx`, `components/practice/briefing*.tsx`, `components/ui/person-card.tsx`, `lib/practice/skill-templates.ts`, `lib/people/api-client.ts` (read additions only), `app/design-preview/**` (add lobby/briefing states), tests for these, this record.
- Not owned (propose changes in Handoff): `app/practice/practice-workspace.tsx`, `lib/practice/flow.ts`, `lib/practice/private-state.ts` (use its exported API only), `lib/schemas/**`, `lib/session/**`, `lib/setup/**`, `app/api/**`, `components/practice/call-*`/`ringing*`/`remote-media.tsx` (1A), `package.json`, lockfile, `scripts/**`, numbered docs, STATUS.md.
- Shared resources: no live calls, no provider calls, no migrations; port 3100 is the coordinator's.
- Dependency tasks: C1 merged. M1 (person `background`, saved situations, practice history) is being applied by the coordinator; 1C builds those routes in parallel. Code against the C1 schemas in `lib/schemas/people.ts` and mock the routes in tests.

## Scope and acceptance

From 02-BUILD-PLAN 1B:
- [ ] P1 and P3 acceptance lists (docs/32).
- [ ] Jordan (manager) first in the starters; starter cards show the portrait from `GET /api/portraits/[presetId]` with a graceful fallback (initials) when it 404s/503s.
- [ ] R1 skill chips fill the situation text and never auto-generate.
- [ ] Back preserves typed text within the sitting.
- [ ] Keyboard grid navigation in the lobby.
- [ ] Private card fields (hard-moment line, fear, likelihoods, notes) go to `lib/practice/private-state.ts` only. The draft body carries goal as today, never the hard-moment line or fear.
- [ ] Lobby/briefing states in `/design-preview` with `data-gallery-state` markers.

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
