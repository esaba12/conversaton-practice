# G5-04: Integrate G5 hardening and run the automated release checks

Status: active
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

## Verification evidence

(recorded as run)

## Handoff

- Coordinator integration: pending
