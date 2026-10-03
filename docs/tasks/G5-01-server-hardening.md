# G5-01: Per-user draft rate limit and automated private-note probe

Status: active
Updated: October 3, 2026, 19:15 EDT
Assigned writer: background subagent (G5-01)
Coordinator: Cursor coordinator session
Gate: G5 ("no critical ownership/context/teardown defects"; docs/10)
Requirements/tests: T01, T10, T11, T13; docs/28 G5 items 3 (End unreachable, client side) and 4
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/22
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g5-hardening` from `main` `03fdde1`, plus uncommitted frozen contracts (`DRAFT_RATE_LIMIT` in `lib/schemas/draft.ts`).
- Branch: `build/g5-hardening` (shared checkout, disjoint paths)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A
- Owned files: `lib/setup/rate-limit.ts` (new), `app/api/scenarios/draft/route.ts`, `tests/unit/setup-generate.test.ts`, `tests/unit/draft-rate-limit.test.ts` (new), `tests/unit/api-client.test.ts`, this record.
- Shared resources: none. No build, Playwright, provider calls or Git writes.
- Dependency tasks and contract revisions: frozen `DRAFT_RATE_LIMIT` (do not edit `lib/schemas/**`).
- Unblock condition: none

## Scope and acceptance

Outcome: a signed-in user can't burn the setup model with unlimited drafts, and the private-note boundary on the draft path has explicit unit evidence.
Non-goals: shared/durable rate limiting, UI changes (G5-02 maps the 429 to a message).

- [ ] `reserveDraft(userId, now?)` in `lib/setup/rate-limit.ts`: sliding or fixed window per `DRAFT_RATE_LIMIT`; over the limit throws `AppError("USAGE_LIMIT", <user-facing message>, 429)`; bounded map (evict oldest past ~1,000 users) like `lib/reflection/session.ts`. Calls rejected by validation do not count; OUT_OF_SCOPE and provider failures do count (they cost a model call). T10.
- [ ] Draft route: auth → body validation → `reserveDraft(identity.id)` → generate. 401 and 400 happen before counting and before any model call.
- [ ] Unit tests: the 9th request inside the window returns 429 `USAGE_LIMIT` with no fetch; another user is unaffected; the window resets (fake timers or injected `now`); 401/400 don't count.
- [ ] Private-note probe (unit, T01): with a distinctive marker in `privateNotes`, (a) the marker appears only in the model user message, never the system prompt; (b) a model output that copies five consecutive note words into any role field is retried and, if it repeats, returns 503 with nothing leaked in the body; (c) the 200 response body never contains the marker when the model behaves; (d) the goal field never carries the notes into the response. Add only the cases that aren't already covered; note which existed.
- [ ] Client "End with the server unreachable" (unit, `tests/unit/api-client.test.ts`): `endSession` rejects with `SessionClientError` code `NETWORK` when fetch throws, and with `keepalive: true` passes `keepalive` to fetch. Add only what's missing.

## Contract and documentation changes

- Inputs/outputs/errors: docs/05 draft route gains 429 `USAGE_LIMIT` (coordinator updates docs/05).
- Shared change: none beyond the frozen constant.

## Verification evidence

Writer: run `npm run typecheck` and `npx vitest run <your test files>` only; record exact results here.

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- Next smallest task:
- Ready for review:
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
