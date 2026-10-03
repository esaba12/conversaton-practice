# G2-01: Generate an editable setup draft from a described situation

Status: integrated
Updated: October 3, 2026, 16:45 EDT
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

Mode: unit/mock only (mocked `fetch`, mocked `@/lib/auth/server`, `vi.stubEnv`). Tested on uncommitted changes over `346b61d`, October 3, 2026 ~16:42 EDT. No live OpenAI call, build, dev server, or Playwright.

- `npx vitest run tests/unit/setup-generate.test.ts`: 1 file, 14 tests passed. Covers strict schema shape; success with `outOfScope` stripped; request body (URL, Bearer key, `AbortSignal`, `store:false`, strict `json_schema` named `practice_setup_draft`, model from env, system message identical to the constant and free of notes, notes inside `<untrusted_input>` in the user message); supplied goal returned unchanged; 401 before body read (`request.bodyUsed === false`) and before fetch; 400 for empty/extra-field/oversized bodies; `NOT_CONFIGURED` for missing key and missing model; refusal → retry → 503 retryable (2 calls); invalid JSON then valid → 200 (2 calls); incomplete + 500 and timeout + schema-invalid → 503 retryable without upstream text (2 calls each); `outOfScope` → 422 non-retryable (1 call); echoed private-note phrase twice → 503 and response never contains it; leaked first attempt then clean → clean result; leak-check normalization unit cases.
- `npm test`: 6 files, 66 tests passed (full suite including other workers' in-progress files at that moment).
- `npm run typecheck`: no errors in owned files. One error outside ownership: `app/practice/practice-workspace.tsx(180,76) TS2554` (another worker's in-progress change).
- Coordinator live check, October 3, 2026 16:44 EDT, mode **live**, outcome **pass**, tested on `262c04e` (prompt `setup-2026-10-03.1`) with `.env.local` model `gpt-5.4-mini-2026-03-17`. Ran `generateDraft` directly from a temporary, uncommitted Vitest file (deleted afterwards). Input was a novel fictional situation (a neighbor blocking the driveway on Tuesdays) plus a private note containing a distinctive marker phrase. Two real calls were made: the first passed but its output was hidden by the test runner, so the second wrote it to a temporary file that was deleted after inspection. The second call took 1.7 s and returned a usable draft: a fictional neighbor with a plausible opening, neutral challenge, a concrete goal and three reviewable assumptions. Neither marker word appeared in the role. One constraint said "Does not know any private coaching notes", which reveals that notes exist without revealing what they say. The coordinator tightened the prompt in `setup-2026-10-03.2` so no role field mentions notes, coaching or rehearsal; that revision has not been re-run live. The out-of-scope classification was not tested live, the route was not called over HTTP, and the UI and Tavus start were not exercised.
- Emitted strict schema inspected: root `type: "object"` with no `anyOf`; every object has all properties in `required` and `additionalProperties: false`; no `minLength`/`maxLength`/`$schema`; `enum` and `maxItems: 5` retained. Length/`min(1)` limits are enforced afterwards by `draftModelOutputSchema` (violation → retry → 503).

## Handoff

- Changed paths and commit(s): `lib/setup/prompt.ts` (new), `lib/setup/generate.ts` (new), `app/api/scenarios/draft/route.ts` (new), `tests/unit/setup-generate.test.ts` (new), this record. Uncommitted; coordinator commits.
- Prompt version: `SETUP_PROMPT_VERSION = "setup-2026-10-03.1"` in `lib/setup/prompt.ts`. System message carries all rules (docs/07 setup rules, docs/08 content scope → `outOfScope`, private-note non-disclosure, goal-as-metadata, assumptions, field length limits). The user message carries only the JSON-encoded inputs inside `<untrusted_input>`; `<` is escaped as `\u003c` so input text cannot forge the closing delimiter.
- Leak check (`leaksPrivateNotes`): notes and each role string (`name`, `role`, `style`, `publicContext`, `opening`, each constraint) are NFKC-normalized, lowercased, and split on non-letter/non-digit runs. A match on any five consecutive note words (the whole note if it has fewer than five) inside a single role string is a leak → attempt treated as invalid (retry once, then 503). `goal`/`assumptions` are user-facing and not checked.
- Behavior choices to review: (1) when the user supplies a goal, the server returns it verbatim instead of the model's goal; (2) `status: "failed"` is treated like `incomplete`; (3) per-attempt timeout 20 s, so worst case ≈ 40 s across two attempts — confirm the deployment function duration allows this; (4) OpenAI non-2xx including 401/429 maps to retryable 503 per the frozen contract, so a bad key shows as `PROVIDER_UNAVAILABLE`, not `NOT_CONFIGURED`.
- Remaining failures/risks: live model quality (scope classification, notes non-disclosure beyond verbatim 5-word echoes, opening plausibility, novel-situation check from docs/09) is unverified until the coordinator's live call. Paraphrased leaks are prompt-only protection. The leak check can false-positive on very short notes (e.g. a one-word note appearing in the role), which costs a retry/503.
- Proposed shared-contract changes: none (`OPENAI_API_KEY`/`OPENAI_SETUP_MODEL` already in `.env.example`). docs/05 and docs/07 can cite the prompt version and leak check above.
- External account action: none for this task (coordinator needs a real `OPENAI_API_KEY` and model ID for the live check).
- Next smallest task: coordinator live call of `POST /api/scenarios/draft` with a novel situation plus an out-of-scope request, then UI wiring of the editable draft.
- Ready for review: yes
- Coordinator integration: reviewed and committed at `262c04e` on `build/g2-generation`; prompt tightened to `.2` after live check (see evidence).
