# G5-04: Integrate G5 hardening and run the automated release checks

Status: integrated
Updated: October 3, 2026, 19:15 EDT
Assigned writer: coordinator
Coordinator: Cursor coordinator session
Gate: G5 ("no critical ownership/context/teardown defects"; docs/10)
Requirements/tests: T01, T03, T08, T09, T10, T13, T14, T16; docs/28 G5 items 1–7
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/25 (tasks: #22, #23, #24)
Pull request: not opened
CI run: not run

## Design decisions (coordinator, 19:10 EDT)

- **Two-user check for G4 routes** goes into `scripts/preflight/auth-database-check.mjs --g5-ui` (coordinator-owned): real fixture users, real JWT cookies, the running dev server. A `connecting` session row is created with `practice_acquire` (server capability, no provider call) so reflect-while-active 409 is tested for real; `practice_end` then closes it without a provider ID.
- **Workspace teardown in a real browser.** `lib/media/controller-factory.ts` lets an automated check install a fake `MediaController` on `window.__practiceTestMediaController` before load, development builds only, and the workspace then shows "Test media — no live call". This drives the real workspace through live → auto-end (Playwright clock), End unreachable → Retry, `SESSION_EXPIRED` → interrupted, and sign-out mid-call. It proves workspace logic only; Daily/Tavus behavior stays covered by `daily-controller` unit tests and the human live calls.
- **Draft rate limit:** `DRAFT_RATE_LIMIT` 8 per 10 minutes per user per process (`lib/schemas/draft.ts`), same caveat as the reflection cap.
- **Session `person_id` attribution: deferred.** It needs a change to the G1 `practice_acquire` RPC signature that every start depends on; Your data works without it. Recorded as a known gap, not a defect.

## Frozen contracts

`DRAFT_RATE_LIMIT` + 429 line in `lib/schemas/draft.ts`; `lib/media/controller-factory.ts` (`selectMediaController`, `TEST_MEDIA_GLOBAL`).

| Task | Writer | Owned paths |
| --- | --- | --- |
| [G5-01](G5-01-server-hardening.md) draft rate limit, private-note probe, End-unreachable client unit | background subagent | `lib/setup/rate-limit.ts`, draft route, `tests/unit/{setup-generate,draft-rate-limit,api-client}.test.ts` |
| [G5-02](G5-02-workspace-teardown.md) workspace seam, duplicate save, limit message, call a11y | background subagent | `app/practice/practice-workspace.tsx`, `components/presentation/{people-save,practice}.tsx`, `practice.module.css` |
| [G5-03](G5-03-a11y-mobile.md) a11y/mobile pass of other pages | background subagent | `app/practice/{about-me,data,people}/**`, other `components/presentation/*` |
| G5-04 automated real-Auth checks, docs | coordinator | `scripts/preflight/**`, docs, STATUS |

## Integration

| Commit | Content |
| --- | --- |
| `25082a4` | Frozen contracts, task records |
| `e98b52d` | [G5-01](G5-01-server-hardening.md) draft rate limit, probe and client tests |
| `288e4ed` | [G5-02](G5-02-workspace-teardown.md) test media seam, duplicate-save fix, limit message, call a11y |
| `5f9db39` | `--g5-ui` real-Auth checks (`scripts/preflight/g5-checks.mjs`) |
| `88af611` | [G5-03](G5-03-a11y-mobile.md) a11y/mobile pass |
| `d6917f9` | Retry cleanup accessible name now starts with its visible text; preview test targets the phase badge (two status regions are now intentional) |

Coordinator review notes: G5-02's duplicate-save fix asks the user to confirm "Update Alex" instead of silently updating; accepted. G5-01 noted that a model-written goal could echo private notes; the goal never enters the start request and is the user's own text shown back to them, so it is recorded as an accepted risk, not a counterpart leak.

## Verification evidence (human's machine, macOS, Node 22.23.3, `/Users/ethansaba/code/therapist`, `build/g5-hardening`)

- ~19:15 EDT — unit — pass. `npm run typecheck` pass; `npm test` 14 files, 151 tests pass (`88af611` + uncommitted label fix later committed as `d6917f9`).
- ~19:15 EDT — build — pass. `npm run build` (Next 16.3.8). `grep -rl __practiceTestMediaController .next/static` → 0 files: the test override is compiled out of production; only the (unreachable) notice string remains.
- ~19:16 EDT — browser mock — pass after one fix. Docs/28 recipe against the dev server on 3000: first run 7 pass, 1 fail (`missing media…`: strict-mode violation, two `role=status` elements after G5-02 made the call message region persistent); test scoped to `[data-phase]`; re-run 8 passed, 1 production-only skipped.
- ~19:16 EDT — real-Auth G3 regression — pass. `auth-database-check.mjs --g3-ui`; fixtures removed.
- ~19:16 EDT — real-Auth G5 — pass. `auth-database-check.mjs --g5-ui` (two fictional users, real JWT cookies, linked project, Chromium, dev server; call provider and reflection model never contacted). All twelve PASS lines: G4 two-user routes (reflect 409 while active via a real `practice_acquire` fixture row, 404 cross-owner active and ended, B lists none of A's sessions, B cannot End A's session, empty transcript → insufficient with no model call, private notes rejected, delete-all phrase + caller-only deletion with counts); signed-out 401s for sessions/reflect/delete-all/draft and redirects for three pages; test-media workspace: End (user), End unreachable → message → Retry, `SESSION_EXPIRED` → connection_failure, 180 s auto-end (Playwright clock) → time_limit, sign-out mid-call → auth_loss + re-entry denied + no notes shown; reflect body keys only `turns/goal/selfReflection`; Done and Skip clear the panel; duplicate save after failed list → asks, updates, one Alex; Your data four cleanup labels, Retry only for pending/unresolved, Retry calls End; click sharing stored; 390 and 320 px without horizontal scroll (screenshots `artifacts/local/g5-*-390.png`, not committed). Fixtures removed. Earlier runs: one timeout during first compile, one failure from a wrong fixture enum in the script (`sufficient` → `complete`); both script issues, fixed.
- ~19:16 EDT — live OpenAI, coordinator-run — pass. Temporary uncommitted Vitest file called `generateDraft` with a distinctive codeword and fear sentence in `privateNotes`; the returned role contained neither (1 test, 1.8 s). File deleted; output not saved.
- Not established: that the duplicate-save check fails on pre-G5 code (no negative control run); any live Tavus/Daily behavior; screen-reader output (static review plus role/label assertions only).

## Gate decision

Pending CI and the read-only privacy review. G5 will be accepted on automated evidence by the user's 19:00 decision; **live not verified**.

## Handoff

- Coordinator integration: integrated on `build/g5-hardening` at `d6917f9`; PR pending.
