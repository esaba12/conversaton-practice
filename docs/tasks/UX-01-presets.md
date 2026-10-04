# UX-01: Professor and saying-no presets

Status: integrated
Coordinator, October 3, 2026, 20:40 EDT: merged to `main`. Unedited starts of the roommate, professor, and saying-no examples send only the preset id.
Updated: October 3, 2026, 8:05 PM EDT
Assigned writer: UX-01 worker
Coordinator: Cursor coordinator session
Gate: polish. PRD P01.
Requirements/tests: P01. Preset starts stay free of private notes (T01).
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: `agent/ux-01-presets`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/ux-01`
- Dev port: 3013 reserved; not started
- Owned files: `fixtures/professor.ts`, `fixtures/decline.ts`, `fixtures/examples.ts`, `lib/schemas/session.ts` preset union, `lib/session/server.ts` preset map, `lib/session/api-client.ts` `startPresetSession`, `components/presentation/setup-describe.tsx`, `components/presentation/setup.module.css`, `app/practice/practice-workspace.tsx`, `tests/unit/contracts.test.ts`, `tests/unit/session-server.test.ts`, `tests/unit/api-client.test.ts`, `docs/01-PRD.md`, `docs/02-UX.md`, `docs/05-API-AND-ACTIONS.md`
- Shared resources: `startRequestSchema` preset branch widened to three literals. `durationSchema` unchanged. No migration, appearance, captions, or duration UI.
- Dependency tasks and contract revisions: base is the workspace-polish commit above. Draft route still rejects a preset body.
- Unblock condition: none

## Scope and acceptance

Outcome: from the practice home the user can open review, without generation, for three fictional situations. Each review is labeled “Example setup — not generated.” Generate setup stays the primary button. An example the user has not edited starts with `{idempotencyKey, preset, durationSeconds}` only. Editing the role before Start sends that reviewed role instead, so the edit is what the call uses. Private notes typed on the home never enter either start body.

Non-goals: more than these three, appearance presets, a duration picker, captions, storing the preset as a saved person, a migration.

| Id | Name | Scene |
| --- | --- | --- |
| `roommate` | Alex | Shared kitchen; dishes left in the sink. Already shipped. |
| `professor` | Ellis | Office hours; help on one assignment. Formal and brief. |
| `decline` | Sam | A classmate asks you to cover their project section this weekend; you want to say no. Ordinary pressure. |

- [x] Home shows three example actions under the situation field: “Ask a professor for help”, “Talk about a roommate issue”, “Say no to a request”. Generate setup stays the primary button.
- [x] Each action opens review with that fixture, its local goal, and mode `example`.
- [x] `POST /api/sessions` accepts `preset: "roommate" | "professor" | "decline"` and rejects any other preset before storage or a provider call.
- [x] The server maps the preset to the fixture. Fingerprints hash the resolved role, and professor and decline do not hash as roommate.
- [x] An unedited example start sends only the key, preset id, and duration. Private notes are not a start field.
- [x] Draft route still rejects a preset body (`tests/unit/setup-generate.test.ts`, unchanged, included in the unit run).

## Contract and documentation changes

- Inputs/outputs/errors: `sessionPresetSchema` is `"roommate" | "professor" | "decline"`. Other preset strings fail validation (400). Error shape stays `errorSchema`. Idempotency fingerprint is still the keyed HMAC of canonical `{durationSeconds, role}` after the server resolves the fixture.
- Privacy: preset and reviewed-role start bodies do not include private notes, goals, or unshared facts. A preset body also omits role text. Constraints on the new fixtures say to respond in character and not give communication advice. Neither role has a private-notes field.
- Updated specs: `docs/01-PRD.md` P01, `docs/02-UX.md` home presets, `docs/05-API-AND-ACTIONS.md` sessions row.
- Decision/source: PRD P01. The roommate scene remains the demo default.

## Verification evidence

- Date/time/timezone: October 3, 2026, 8:04 PM EDT
- Gate and requirement/test IDs: P01, T01
- Mode: unit
- Outcome: pass
- Tested commit/dirty state: uncommitted on `agent/ux-01-presets` at base `8f61d0968e1eba755c79281780f199f7960248f3`; this record is in the same commit
- Environment + working directory: local, Node via the repo toolchain, `/Users/ethansaba/code/therapist/.worktrees/ux-01` (`node_modules` is the existing symlink; no install)
- Exact command: `npm run typecheck`
- Exit code: 0
- Observed result: `tsc --noEmit` completed with no errors
- Limitations: none for the typecheck itself

- Date/time/timezone: October 3, 2026, 8:04 PM EDT
- Gate and requirement/test IDs: P01, T01
- Mode: unit
- Outcome: pass
- Tested commit/dirty state: same dirty tree as above
- Environment + working directory: Vitest 4.1.11, `/Users/ethansaba/code/therapist/.worktrees/ux-01`
- Exact command: `npm test` (`vitest run`)
- Exit code: 0
- Observed result: 14 files, 153 tests passed. Includes the new professor/decline fixture mapping, fourth-preset rejection, preset-body shape, and the existing draft-route rejection of `preset: "roommate"`.
- Limitations: live calls are not verified. No browser pass.

- Date/time/timezone: October 3, 2026, 8:05 PM EDT
- Gate and requirement/test IDs: P01 home actions
- Mode: not-run
- Outcome: not-run
- Tested commit/dirty state: same tree
- Environment + working directory: browser on port 3013 was not started
- Exact command or manual steps: skipped
- Exit code: not-run
- Observed result: not run
- Limitations: `/practice` requires a signed-in identity when Supabase env is set, which would query the linked project. That, `scripts/preflight/auth-database-check.mjs`, a Tavus call, and the microphone were out of bounds. With auth unset, the route only redirects to sign-in, so the three example actions cannot be clicked.

## Handoff

- Changed paths and commit(s): fixtures `professor.ts`, `decline.ts`, `examples.ts`; `lib/schemas/session.ts`; `lib/session/server.ts`; `lib/session/api-client.ts`; `components/presentation/setup-describe.tsx`; `components/presentation/setup.module.css`; `app/practice/practice-workspace.tsx`; unit tests `contracts`, `session-server`, `api-client`; `docs/01-PRD.md`, `docs/02-UX.md`, `docs/05-API-AND-ACTIONS.md`; this record. SHA is the commit that adds this file on `agent/ux-01-presets`.
- Remaining failures/risks: live speech of the new scenes is unverified. An edited example sends the reviewed role, not the preset id, so the edit is honored.
- External account action: none
- Next smallest task: coordinator review and integration
- Ready for review: yes
- Coordinator integration: pending
