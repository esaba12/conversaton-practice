# 1C: Person/situation server (P2, Q2 server, W2 fixture, W11 streamed draft)

Status: ready for coordinator review (live not verified)
Updated: October 4, 2026, 00:55 EDT
Assigned writer: 1C worker subagent (gpt-5.6-sol-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1C; docs/32 P2, Q2; docs/next/04-NEW-SPECS.md W2, W11; docs/next/03-CONTRACTS.md §2 (C1 frozen, including the staging notes at the top of §2), §2.5 (M1), §2.9 (starter faces); docs/07, docs/08, docs/26
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/62
Pull request: https://github.com/esaba12/conversaton-practice/pull/70 (draft)
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `9d2e396` (C1 and M1 merged; M1 applied to the linked project).
- Branch: `agent/1c-person-server`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1c`
- Dev port: 3103
- Owned files: `lib/setup/**`, `app/api/scenarios/draft/route.ts`, `lib/session/server.ts`, `app/api/sessions/route.ts`, `lib/data/people.ts`, `lib/data/person-context.ts`, `lib/data/person-situations.ts` (new), `app/api/people/[id]/situations/**` (new), `lib/schemas/draft.ts` and `lib/schemas/people.ts` **only** for the staged changes 03-CONTRACTS §2 assigns to 1C (make `stanceOptions` required, add stance to the model output, `background` on reads), `scripts/preflight/auth-database-check.mjs` (add a `--p2` mode; do not run it), tests (`setup-generate`, `session-server`, `person-context`, `people-routes`, new ones), this record.
- Not owned (propose in Handoff): `lib/schemas/role-context.ts`, `lib/schemas/session.ts`, `lib/schemas/situation.ts`, `lib/media/**` (use `starterMedia` from `lib/media/presets.server.ts`; propose any change), `lib/media/tavus.ts` signature changes (propose), UI components, `app/practice/**`, `package.json`, lockfile, migrations, numbered docs, STATUS.md. Stand-in branch and `hasPracticed`/practice-history belong to 1G — keep the stand-in 400 guard in `startSession`.
- Shared resources: no live calls, no provider calls (mock OpenAI/Tavus in tests), no migrations, no real-Auth scripts (coordinator runs `auth-database-check.mjs --g3 --g3-ui --p2`).

## Scope and acceptance

From 02-BUILD-PLAN 1C:
- [x] P2 and Q2 acceptance lists (docs/32).
- [x] Draft with `personId`: server loads that person's identity fields (not shared facts, not private prep); model generates situation fields only. Another owner's `personId` → 404; stale version → 409.
- [x] Stance: `draftModelOutputSchema` gains stance fields and `stanceOptions` (prompt version bump); `draftResponseSchema.stanceOptions` required. FIX-01 private-note probe extended to `wants`, `holdsBackBecause`, `softensWhen` and every situation field.
- [x] W11: an event-stream draft emits completed fields then one validated `done`; a probe failure emits an error and no `done`; private notes never appear in any event; a JSON request is unchanged.
- [x] Start branches: person + `situation` merges identity (loaded by id) with the Zod-validated situation; preset + optional `openingOverride`; remove the 400 guard for `situation` and `openingOverride` only. The start body never carries identity or fact text for a saved person, nor goal, notes or hard-moment line.
- [x] Preset starts use the starter's PAL and face via `starterMedia(preset)`; role, person and stand-in starts unchanged. Pass `kind: 'practice'` and `preset` to `practice_acquire` (M1 added `p_kind`, `p_preset`).
- [x] Situations routes: `GET/POST /api/people/[id]/situations`, `DELETE /api/people/[id]/situations/[situationId]` per C1 schemas and M1 RPCs (`person_situation_list/create/delete`; `LIMIT_REACHED` → a clear 409/422 per contracts). Person reads/writes include `background` (`p_background`).
- [x] `buildRoleContext` snapshot has the stance instruction, freeze rule and emotional-delivery line, and no goal; existing presets validate.
- [x] `auth-database-check.mjs --p2` mode written (two real users: situations owner isolation, cap, cross-owner 404) for the coordinator to run.

## Verification evidence

- `npm run typecheck` — passed.
- `npm test` — passed: 24 files, 459 tests.
- `npm run build` — passed; Next.js production build includes the three new/changed API surfaces.
- Focused P2/Q2/W11 route, privacy, context, session and saved-situation tests — passed: 5 files, 85 tests before the final full-suite run.
- Provider behavior is mock-tested only. `--p2` real-Auth/database mode was written but not run, as assigned. Live not verified.

## Handoff

- Changed paths and commit(s): `5749860` (person/situation server, contracts, routes, tests and `--p2` preflight); `437f212` (incremental validated Responses streaming).
- Remaining failures/risks: no known automated failure. Real OpenAI streaming, real starter PAL/face selection, real Auth/database `--p2`, and live audiovisual behavior remain unverified.
- Proposed shared-file changes: `lib/data/sessions.ts` passes M1's required `p_kind`/`p_preset` RPC arguments; `lib/media/tavus.ts` accepts a server-only PAL/face override so preset starts can use `starterMedia`. Both are minimal acceptance dependencies for coordinator review.
- External account action: none
- Ready for review: yes
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
