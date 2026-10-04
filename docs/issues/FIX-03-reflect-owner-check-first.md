# FIX-03: Check session ownership before reading the reflection transcript

GitHub issue: [#29](https://github.com/esaba12/conversaton-practice/issues/29)

Who: one coding agent. Priority: medium. Gate: G5 follow-up.
Source: [REV-01](../tasks/REV-01-g5-privacy-review.md) should-fix 3. Requirements: P08, P12, T12.

## Problem

`app/api/sessions/[id]/reflect/route.ts` does this:

```text
requireIdentity → parseId → readBody(…, 96000) → requireEndedSession → generate
```

The server accepts and parses a transcript body of up to 96,000 characters before it knows the session belongs to the caller and has ended. A non-owner still gets 404, and nothing is stored or sent to the model. But the server should not take in another user's practice text for a session it will refuse.

`readBody` (`lib/api/respond.ts` line 27) calls `request.text()`, so the whole body is read whenever it is called.

## Required change

Reorder to:

```text
requireIdentity → parseId → requireEndedSession(client, id) → readBody(…, 96000) → (rest unchanged)
```

Expected behavior changes, and both are intended:

- A foreign or missing session returns 404 even when the body is invalid or oversized.
- An active session returns 409 `SESSION_ACTIVE` even when the body is invalid.

Keep `reserveReflection` after the body is validated, as it is today.

## Owned files

- `app/api/sessions/[id]/reflect/route.ts`
- a unit test (new `tests/unit/reflect-route.test.ts`, or extend `tests/unit/reflection-contract.test.ts` if the route is already tested there)
- `docs/05-API-AND-ACTIONS.md`: the reflect endpoint's error order, if it is documented
- `docs/tasks/FIX-03-reflect-owner-check-first.md` (new)

## Acceptance

- [ ] Unit test: when `requireEndedSession` rejects with `NOT_FOUND`, the response is 404 and the request body is never read. Assert this with a `Request` whose `text()` is spied, or with a body stream that records reads.
- [ ] Unit test: active session plus invalid body → 409.
- [ ] Unit test: ended own session plus invalid body → 400. Valid body → model path reached (mock `generateReflection`).
- [ ] Existing reflection tests still pass. `npm run typecheck`, `npm test`, `npm run build` pass.
- [ ] Note in the handoff that `scripts/preflight/g5-checks.mjs` expectations (404 cross-owner, 409 while active, private notes rejected → 400 on an ended own session) still hold. The coordinator confirms with VERIFY-01.

## Not in scope

Changing `readBody`, the reflection limit, or the reflection prompt.
