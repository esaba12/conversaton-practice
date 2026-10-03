# G2-01: Generate an editable setup draft from a described situation

Status: ready
Updated: October 3, 2026, 16:40 EDT
Assigned writer: G2-01 background subagent
Coordinator: Cursor coordinator session
Gate: G2
Requirements/tests: G2 generation acceptance (docs/10), T01 context separation, T13 sign-in before provider calls; docs/09 line 32 (novel situation, not a canned preset)
GitHub issue: [#12](https://github.com/esaba12/conversaton-practice/issues/12)
Pull request: not opened (coordinator integrates on `build/g2-generation`)
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g2-generation` from `main` `1c9506d48996be77188c7512caa071363d598270`, plus the coordinator contract commit recorded in STATUS.
- Branch: `build/g2-generation` (shared checkout; coordinator is the only Git writer)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A (no dev server, build, Playwright, or live provider calls)
- Owned files: `lib/setup/generate.ts`, `lib/setup/prompt.ts`, `app/api/scenarios/draft/route.ts`, `tests/unit/setup-generate.test.ts`, this record.
- Shared resources: `lib/schemas/**`, `lib/api/respond.ts`, `.env.example` are coordinator-owned and frozen; propose changes in the handoff.
- Dependency tasks and contract revisions: frozen `lib/schemas/draft.ts` (`draftRequestSchema`, `draftResponseSchema`, `draftModelOutputSchema`), `errorSchema` with `OUT_OF_SCOPE`, `readBody(request, schema, maxLength)`.
- Unblock condition: none.

## Scope and acceptance

Outcome: a signed-in user posts a described situation and receives a strict, editable fictional role plus goal and up to five reviewable assumptions.
Non-goals: persistence, UI, presets, memory/profile input, reflection.

- [ ] `POST /api/scenarios/draft` uses `handle()`, calls `requireIdentity()` before reading the body or calling the model (T13), reads with `readBody(request, draftRequestSchema, 4096)`, returns 200 `draftResponseSchema`. No database writes, no logging of situation/notes/model output.
- [ ] `lib/setup/generate.ts` calls `https://api.openai.com/v1/responses` with `fetch` (no new dependency): `model` from `OPENAI_SETUP_MODEL`, `store: false`, `input` with a system/developer instruction message and a user message, `text: { format: { type: "json_schema", name: "practice_setup_draft", schema, strict: true } }`, and an `AbortSignal.timeout`. Missing `OPENAI_API_KEY` or `OPENAI_SETUP_MODEL` → 503 `NOT_CONFIGURED`.
- [ ] JSON schema is derived from `draftModelOutputSchema` with `z.toJSONSchema` and post-processed for strict mode: every object has all properties `required` and `additionalProperties: false`; drop keywords not in the documented supported subset (`minLength`, `maxLength`, `$schema`). Keep `enum`, `minItems`/`maxItems`. Unit-test the transformed schema shape.
- [ ] Parse the raw response: find the `output` item of `type: "message"`, its `content` item of `type: "output_text"` → `JSON.parse` → `draftModelOutputSchema`. A `refusal` content item, `status: "incomplete"`, non-2xx, network error, or invalid output triggers at most one retry total, then 503 `PROVIDER_UNAVAILABLE` retryable. `outOfScope: true` → 422 `OUT_OF_SCOPE` (not retryable), no retry. On success return only `draftResponseSchema.parse({ role, goal, assumptions })` (strip `outOfScope`).
- [ ] Prompt (`lib/setup/prompt.ts`, versioned constant) follows docs/07 setup-generator rules and docs/08 content scope: fictional counterpart only; distinguish counterpart-known facts from private notes; no invented biography or inferred thoughts; neutral editable defaults listed as assumptions; no diagnosis/treatment/prediction; plausible opening; suggest one concrete goal if none given; never prewrite the user's dialogue; abuse/trauma/humiliation reenactment or non-everyday harmful requests → `outOfScope: true`. User inputs are wrapped as delimited untrusted data, not instructions.
- [ ] Private notes (T01): may inform what the counterpart plausibly knows only as the user would openly share it; the prompt instructs never to quote, paraphrase, or reveal private notes in any role field. Server-side backstop: if any role string contains any five consecutive words of the private notes (case-insensitive, whitespace/punctuation-normalized; the whole note when it has fewer than five words), treat the output as invalid (retry once, then 503). Unit test: a mocked model that echoes a distinctive private-note phrase never returns it.
- [ ] Goal is returned as user metadata only; the prompt does not put the goal into role fields unless the situation states the counterpart already knows it.
- [ ] Unit tests (mocked `fetch`, `vi.stubEnv`): success; request body shape (`store:false`, strict format, model from env, no notes in system message); unauthenticated route returns 401 before fetch (mock `requireIdentity` / auth module); NOT_CONFIGURED; refusal → retry → 503; invalid JSON then valid → success with exactly 2 calls; out-of-scope → 422 with 1 call; private-note leak detection; response strips `outOfScope`.

## Contract and documentation changes

- Inputs/outputs/errors: `lib/schemas/draft.ts` HTTP comment (frozen).
- Shared change: none expected; propose in handoff if needed.
- Updated specs: coordinator updates docs/05, docs/07 after review. Writer documents prompt version and leak check here.
- Decision/source: OpenAI Structured Outputs guide (Responses API), fetched by coordinator October 3, 2026: `text.format` json_schema with `strict: true`; supported string keywords are `pattern`/`format` (no length limits); refusals appear as `content[].type === "refusal"`.

## Verification evidence

- Not run yet. Writer records `npm run typecheck` and `npx vitest run tests/unit/setup-generate.test.ts` results (unit/mock mode). Live OpenAI call is coordinator-only after integration.

## Handoff

- Changed paths and commit(s): pending (coordinator commits)
- Remaining failures/risks: pending
- External account action: none
- Next smallest task: pending
- Ready for review: no
- Coordinator integration: pending
