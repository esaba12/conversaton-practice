# G4-04: Integrate and verify reflection, transcript capture and "Your data"

Status: active — workers dispatched
Updated: October 3, 2026, 17:52 EDT
Assigned writer: coordinator
Coordinator: Cursor cloud coordinator session
Gate: G4 ("end-to-end flow closes with a short optional reflection"; docs/10)
Requirements/tests: P08, P10; T01, T03, T08; docs/07 reflection rules; docs/08 deletion truthfulness
GitHub issue: not opened (this coordinator's `gh` access is read-only)
Pull request: not opened
CI run: not run

## Design decisions (coordinator, 17:50 EDT)

- **Transcript source.** End hard-deletes the Tavus conversation, so no transcript can be fetched afterwards, and the app stores none. During the call, Tavus sends `conversation.utterance` Daily `app-message` events with `properties.role` (`pal` or `user`, plus a legacy duplicate `replica` turn) and `properties.speech` (source: [Tavus utterance event schema](https://docs.tavus.io/sections/event-schemas/conversation-utterance), read October 3, 2026). The Daily controller emits these as `utterance` media events; the workspace keeps a bounded list (100 turns, 40,000 chars) in memory only and sends it once per reflection request. Analysis fields (`user_audio_analysis`, `user_visual_analysis`) are never read.
- **No storage.** Reflections are not persisted, so no migration is needed for G4. Idempotency is replaced by a per-session cap of three generations per server process.
- **Model.** `OPENAI_REFLECTION_MODEL`, falling back to `OPENAI_SETUP_MODEL`; Responses API, strict JSON schema, `store: false`.
- **Memory proposals** stay unbuilt (optional per docs/27); nothing is written automatically.
- **Deletion.** "Your data" deletes people, About-me facts and private prep through the existing owner RPCs (not one transaction; partial failure reported). Session metadata rows are kept to track provider cleanup; a cleanup retry reuses the idempotent End route. ElevenLabs copies are stated as not tracked.

## Contracts (frozen)

`lib/schemas/reflection.ts`, `lib/schemas/practice-data.ts`, `REFLECTION_UNAVAILABLE` in `lib/schemas/errors.ts`, the `utterance` event in `lib/schemas/media.ts`, the `app-message` handler in `lib/media/daily-controller.ts`, `OPENAI_REFLECTION_MODEL` in `.env.example`. Tests: `tests/unit/reflection-contract.test.ts`, a new utterance case in `tests/unit/daily-controller.test.ts`.

| Task | Writer | Owned paths |
| --- | --- | --- |
| [G4-01](G4-01-reflection-server.md) reflection server | background subagent | `lib/reflection/{prompt,generate,session}.ts`, `app/api/sessions/[id]/reflect/route.ts`, `tests/unit/reflection-generate.test.ts` |
| [G4-02](G4-02-reflection-ui.md) reflection UI | background subagent | `app/practice/practice-workspace.tsx`, `components/presentation/reflection-*`, `lib/reflection/api-client.ts`, `tests/unit/reflection-api-client.test.ts` |
| [G4-03](G4-03-data-and-deletion.md) Your data | background subagent | `app/api/sessions/route.ts` (GET), `app/api/practice-data/route.ts`, `lib/data/practice-data.ts`, `app/practice/data/**`, `components/presentation/data-*`, `lib/practice-data/api-client.ts`, `tests/unit/practice-data.test.ts` |

## Environment limits of this coordinator

This coordinator runs in a Cursor cloud VM (`/workspace`) without `.env.local`, Supabase CLI linkage or provider keys. It can run typecheck, unit tests, the production build and the mock browser suite. It cannot run SQL assertions, the real-Auth preflight scripts, generation/reflection calls or live calls; those run on the human's machine and are recorded only when actually run.

## Verification evidence

- October 3, 2026, ~17:48 EDT — contracts — unit — pass. Cloud VM, Node 22.14.0, `/workspace`, uncommitted on `cursor/g4-reflection-9fec`: `npm run typecheck` pass; `npx vitest run tests/unit/reflection-contract.test.ts tests/unit/daily-controller.test.ts tests/unit/contracts.test.ts` 3 files, 29 tests pass.
- Baseline before changes (`6930688`): `npm run typecheck` pass; `npm test` 9 files, 103 tests pass.

## Human live G4 checklist (after integration)

Pending integration.
