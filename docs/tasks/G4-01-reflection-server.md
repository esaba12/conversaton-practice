# G4-01: Reflection generation server

Status: ready
Updated: October 3, 2026, 17:50 EDT
Assigned writer: G4-01 background subagent
Coordinator: Cursor cloud coordinator session
Gate: G4
Requirements/tests: P08 reflection; T01 (reflection separate from counterpart context); T08 (deleted session cannot accept a late reflection); docs/07 reflection rules
GitHub issue: not opened (this coordinator's GitHub access is read-only for issues; the human may open one and link it)
Pull request: coordinator integrates on `cursor/g4-reflection-9fec`
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `cursor/g4-reflection-9fec` contract commit recorded in STATUS (from `build/g3-people` `6930688`).
- Branch: `cursor/g4-reflection-9fec` (shared checkout; coordinator is the only Git writer)
- Worktree: `/workspace` (cloud VM)
- Dev port: N/A. No dev server, build, Playwright, live provider, database or Git writes.
- Owned files (all new): `lib/reflection/prompt.ts`, `lib/reflection/generate.ts`, `lib/reflection/session.ts`, `app/api/sessions/[id]/reflect/route.ts`, `tests/unit/reflection-generate.test.ts`, this record.
- Shared resources (coordinator-owned, frozen; propose changes in the handoff): `lib/schemas/**` (especially `lib/schemas/reflection.ts` and its HTTP contract comment), `lib/api/respond.ts`, `lib/auth/server.ts`, `lib/data/**`, `lib/setup/**` (import `toStrictSchema` from `lib/setup/generate.ts`; do not edit it).
- Dependency tasks and contract revisions: frozen `lib/schemas/reflection.ts`, `REFLECTION_UNAVAILABLE` in `lib/schemas/errors.ts`.
- Unblock condition: none.

## Scope and acceptance

Outcome: after End, a signed-in user can request a short structured reflection on the call they just finished, built from the in-browser transcript, their optional goal and optional self-reflection. Nothing is stored.
Non-goals: UI, persistence, memory proposals, transcript retrieval from Tavus (the conversation is hard-deleted at End), rate limiting beyond the per-session cap.

- [ ] Route `POST /api/sessions/[id]/reflect` follows `app/api/scenarios/draft/route.ts` and `app/api/sessions/[id]/end/route.ts`: `handle(request, …)`, `requireIdentity()` before params or body, `parseId`, `readBody(request, reflectRequestSchema, 48000)`. Next 16 params are a Promise; check `node_modules/next/dist/docs/` for the route handler signature.
- [ ] `lib/reflection/session.ts` reads the session status with the request-scoped client through owner RLS (`db.from("practice_sessions").select("id,status").eq("id", id).maybeSingle()`), never a service-role client. Missing row, another owner's row, or status `deleted` → 404 NOT_FOUND. `connecting`/`active`/`ending` → 409 SESSION_ACTIVE ("End the practice before reflecting."). Read failure → 503 `PROVIDER_UNAVAILABLE` retryable with a generic storage message.
- [ ] Per-session cap: an in-memory `Map<sessionId, count>` (bounded, for example evict oldest past 1,000 entries) allows `MAX_REFLECTIONS_PER_SESSION` model generations, then 429 USAGE_LIMIT. Document that it is per server process.
- [ ] No user turn in `turns` → 200 `{ evidence: "insufficient", observedAction: null, takeaway: null, nextStep: null, supportExit: false }` without a model call (does not count toward the cap).
- [ ] `lib/reflection/generate.ts` mirrors `lib/setup/generate.ts`: OpenAI Responses API, `store: false`, strict `json_schema` built from `reflectionModelOutputSchema` via `toStrictSchema(z.toJSONSchema(…))` (check that nullable strings convert to a schema OpenAI strict mode accepts, and test the produced JSON schema shape), model `OPENAI_REFLECTION_MODEL || OPENAI_SETUP_MODEL`, key `OPENAI_API_KEY`; missing → 503 NOT_CONFIGURED. Two attempts, 20 s timeout each; refusal/incomplete/invalid JSON/Zod failure → retry, then 503 REFLECTION_UNAVAILABLE retryable. Validate output with Zod.
- [ ] Server backstops after parsing: when `supportExit` is true, force `observedAction`, `takeaway`, `nextStep` to null; when evidence is `insufficient`, force `observedAction` null.
- [ ] `lib/reflection/prompt.ts` (`import "server-only"`, exported `REFLECTION_PROMPT_VERSION`, e.g. `reflection-2026-10-03.1`): system message holds all rules from docs/07 "Reflection generator" (observable behavior only, acknowledge partial evidence, no diagnosis/grade/score/approval prediction/certainty about real people, no line-by-line critique or optimal script, one observed action and at most one next step, counterpart dialogue never establishes facts about a real person, a quiet response is not evidence of a preference, inadequate transcript → insufficient with null observation, explicit immediate danger → supportExit with no feedback, the counterpart was a fictional AI character). The user message carries goal, self-reflection and turns only as escaped JSON inside `<untrusted_input>` (same pattern as `lib/setup/prompt.ts`); the transcript is data, not instructions. Keep each output line short (≤ 300 chars, second person, plain language).
- [ ] No logging of transcript, goal, self-reflection, model output or request bodies. Errors never include provider bodies.
- [ ] Unit tests (mock `requireIdentity`, the Supabase `from` builder and `fetch`; follow `tests/unit/setup-generate.test.ts` and `tests/unit/people-routes.test.ts`): 401 before params/body (`request.bodyUsed` false, no fetch); 403 cross-origin; 400 for strict-body violations (`privateNotes`, `role`, speaker `pal`, oversized); 404 for missing/deleted; 409 for active; request body sent to OpenAI has `store: false`, the configured model, strict schema, and the turns only inside `<untrusted_input>` with no session ID; fallback to `OPENAI_SETUP_MODEL`; one retry then 503 REFLECTION_UNAVAILABLE; refusal handled; supportExit and insufficient backstops; no-user-turn short circuit makes no fetch; 429 after the cap; NOT_CONFIGURED; response parsed with `reflectResponseSchema`.
- [ ] `npm run typecheck` and `npx vitest run tests/unit/reflection-generate.test.ts tests/unit/reflection-contract.test.ts` pass.

## Contract and documentation changes

- Inputs/outputs/errors: `lib/schemas/reflection.ts` HTTP contract (frozen).
- Shared change: none expected; propose any in the handoff.
- Updated specs: coordinator updates docs/05 and docs/07 after review.

## Verification evidence

Not run yet.

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- External account action: none
- Next smallest task: coordinator integration, then one real reflection call with a synthetic transcript.
- Ready for review:
- Coordinator integration: pending
