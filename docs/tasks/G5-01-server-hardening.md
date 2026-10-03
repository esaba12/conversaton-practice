# G5-01: Per-user draft rate limit and automated private-note probe

Status: review
Updated: October 3, 2026, 19:10 EDT
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

- [x] `reserveDraft(userId, now?)` in `lib/setup/rate-limit.ts`: sliding or fixed window per `DRAFT_RATE_LIMIT`; over the limit throws `AppError("USAGE_LIMIT", <user-facing message>, 429)`; bounded map (evict oldest past ~1,000 users) like `lib/reflection/session.ts`. Calls rejected by validation do not count; OUT_OF_SCOPE and provider failures do count (they cost a model call). T10.
- [x] Draft route: auth → body validation → `reserveDraft(identity.id)` → generate. 401 and 400 happen before counting and before any model call.
- [x] Unit tests: the 9th request inside the window returns 429 `USAGE_LIMIT` with no fetch; another user is unaffected; the window resets (fake timers or injected `now`); 401/400 don't count.
- [x] Private-note probe (unit, T01): with a distinctive marker in `privateNotes`, (a) the marker appears only in the model user message, never the system prompt; (b) a model output that copies five consecutive note words into any role field is retried and, if it repeats, returns 503 with nothing leaked in the body; (c) the 200 response body never contains the marker when the model behaves; (d) the goal field never carries the notes into the response. Add only the cases that aren't already covered; note which existed.
- [x] Client "End with the server unreachable" (unit, `tests/unit/api-client.test.ts`): `endSession` rejects with `SessionClientError` code `NETWORK` when fetch throws, and with `keepalive: true` passes `keepalive` to fetch. Add only what's missing.

## Contract and documentation changes

- Inputs/outputs/errors: docs/05 draft route gains 429 `USAGE_LIMIT` (coordinator updates docs/05).
- Shared change: none beyond the frozen constant.

## Verification evidence

Mock/unit only; no build, Playwright, provider calls or Git writes. Live not verified.

- `npx vitest run tests/unit/setup-generate.test.ts tests/unit/draft-rate-limit.test.ts tests/unit/api-client.test.ts` (19:09 EDT): 3 files, 36 tests passed. The first run failed one new test whose expectation was wrong (eight requests at one fake timestamp all leave the window together); the test was corrected, not the limiter.
- `npm run typecheck` (19:08 EDT): passed with no errors.

Rate limit (`tests/unit/draft-rate-limit.test.ts`, new, 7 tests): 9th request in the window returns 429 `USAGE_LIMIT` (`retryable: false`) with no added fetch; a second user is unaffected; capacity returns exactly at `windowMs` (fake timers) and the window slides (injected `now`); 401 and 400 requests (10 each) don't count and never fetch; OUT_OF_SCOPE (422) and provider failures (503) do count; the map stays bounded at 1,000 users (oldest evicted).

Private-note probe on the draft path (`tests/unit/setup-generate.test.ts`):
- (a) marker only in the user message, never the system prompt: already covered ("sends a strict, unstored Responses request…").
- (b) five-word copy into a role field retried, then 503 with nothing leaked: already covered ("never returns a role that echoes private notes", plus the clean-retry case and `leaksPrivateNotes` unit cases).
- (c) and (d): added "never returns a distinctive private-note marker when the model behaves, with or without a goal" — distinctive marker absent from the 200 body and the returned goal on both the model-goal and supplied-goal paths, and present only in the user message of each request.
- Existing tests now call `resetDraftLimitsForTests()` in `beforeEach` so the shared user id doesn't hit the limit.

Client End with the server unreachable (`tests/unit/api-client.test.ts`): `NETWORK` on fetch throw and `keepalive` passthrough were already covered separately; added the combined case (keepalive end, fetch throws, rejects with `SessionClientError` `NETWORK`, fetch received `keepalive: true`).

## Handoff

- Changed paths and commit(s): `lib/setup/rate-limit.ts` (new: `reserveDraft(userId, now?)`, sliding window per `DRAFT_RATE_LIMIT`, bounded map, `resetDraftLimitsForTests`), `app/api/scenarios/draft/route.ts` (auth → validation → `reserveDraft` → generate), `tests/unit/draft-rate-limit.test.ts` (new), `tests/unit/setup-generate.test.ts`, `tests/unit/api-client.test.ts`, this record. Uncommitted (no Git writes per assignment).
- Remaining failures/risks:
  - The leak check covers role fields only. A model-written goal (no goal supplied) that copies the notes would be returned to the user unchanged; the goal is user-only reflection metadata, but if it is later persisted or shown elsewhere this is a gap. Proposed shared change (coordinator, `lib/setup/generate.ts`): also treat `leaksPrivateNotes`-style matches in a model-generated `goal` as invalid output, with a unit case.
  - NOT_CONFIGURED requests are also counted (the reservation precedes `generateDraft`'s configuration check). Harmless in practice; move the check if it matters.
  - Limit is per process, not shared across instances or restarts (as the frozen contract states).
  - docs/05 needs the 429 `USAGE_LIMIT` row (coordinator).
- Next smallest task: G5-02 maps the 429 to a user message; coordinator updates docs/05.
- Ready for review: yes
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
