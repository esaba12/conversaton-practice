# G4-04: Integrate and verify reflection, transcript capture and "Your data"

Status: integrated — accepted on automated evidence by user decision (19:00); live G4 check not verified
Updated: October 3, 2026, 18:05 EDT
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

## Integration

| Commit | Content |
| --- | --- |
| `fbcd359` | Frozen contracts, utterance capture in the Daily controller, task records |
| `ef117b2` | [G4-01](G4-01-reflection-server.md) reflection route, prompt, generation, per-session cap |
| `5f4d67a` | [G4-03](G4-03-data-and-deletion.md) Your data page, `GET /api/sessions`, `DELETE /api/practice-data` |
| `598accd` | [G4-02](G4-02-reflection-ui.md) reflection panel, in-memory transcript, header link |

Coordinator review notes: the worker choices are accepted. A failed generation releases its slot, so it doesn't use up one of the three. The 409 carries `session_id`. The empty-transcript short circuit runs after the session check, so a deleted session still gets 404. G4-01 rewrites Zod's nullable `anyOf` to `type: [T, "null"]` inside its own file; whether OpenAI strict mode accepts it is checked by the first real call.

## Integrated verification (cloud VM, Node 22.14.0, `/workspace`, `598accd`)

- ~18:01 EDT — unit — pass. `npm run typecheck` pass; `npm test` 13 files, 141 tests pass.
- ~18:01 EDT — build — pass. `npm run build` (Next 16.3.8) lists the new dynamic routes `/api/practice-data`, `/api/sessions/[id]/reflect` and `/practice/data`.
- ~18:02 EDT — browser mock — pass. `npm run test:ui` (Playwright 1.63.0, headless Chromium, its own dev server on port 3100): 8 passed, 1 production-only skipped.
- ~18:02 EDT — visual — static fixture. Rendered `ReflectionPanel` (idle with no speech, partial result, retryable error, support exit) and `DataOverview` (three cleanup states, partial-deletion result) on a temporary, uncommitted dev-only page at 900 px and 375 px. Screenshots: `/opt/cursor/artifacts/screenshots/g4-reflection-and-data.png` and `g4-mobile.png`. Layout and wording look as intended. This used fixture props, not real data or sign-in.
- Not runnable here (no credentials): signed-in flows, a real reflection call, the real `GET /api/sessions` and `DELETE /api/practice-data` against Supabase, two-user isolation of the new routes, and live Tavus utterance events.

## Privacy review (read-only, on `3608690`)

No blockers. Applied:
- **Counterpart turns.** Legacy `replica` utterances are now accepted until a `pal` turn is seen, and a repeated `inference_id` is dropped. A call that sends only `replica` still yields counterpart turns, and a call that sends both doesn't duplicate them. A new controller test covers this. The role Tavus actually sends is still to be observed live.
- **Stuck reflect after a failed close.** When closing the session was unreachable, a reflect 409 now says "Use Retry closing session, then try again" instead of an endless "still closing".
- **Your data and the back/forward cache.** A restored page now clears the people, sessions and result state and reloads, so names from before a sign-out elsewhere don't reappear. `authLost` clears the result and message too.
- **Nits.**
  - Reflect body cap raised to 96,000 characters (the schema still bounds content).
  - The support exit is scoped to real danger in the user's own turns or note, not the fictional counterpart's lines (prompt `.2`).
  - Items that were already gone (NOT_FOUND) are no longer counted as deleted.
  - docs/08 notes the US-only support numbers.

The per-process reflection cap isn't enforced across instances or restarts, which was already documented. After the fixes: typecheck pass, `npm test` 13 files and 142 tests pass, `npm run build` exit 0.

## Local verification (human's machine, October 3, 2026)

- ~18:56 EDT — G3 regression — live local (real Auth, real database, Chromium; no provider call) — pass. `auth-database-check.mjs --g3-ui` against the running dev server on this branch (`689c095`). Fixtures removed.
- ~19:00 EDT — reflection — live OpenAI, coordinator-run — pass. A temporary uncommitted Vitest file called `generateReflection` with the configured model (`OPENAI_REFLECTION_MODEL` unset, so the setup model). (1) A synthetic five-turn roommate transcript with a goal and self-reflection returned a `reflectionSchema`-valid result, confirming OpenAI strict mode accepts the `type: ["string","null"]` schema. (2) An explicit real-danger statement in the user's own turn returned `supportExit: true` with all feedback fields null. Two tests passed in 3.5 s total. Outputs were not saved.
- Signed out: `GET /api/sessions` 401, `POST /api/sessions/<id>/reflect` 401, `/practice/data` 307 to sign-in (running dev server).

## Gate decision (October 3, 19:00 EDT)

By the user's decision, G4 advances on automated evidence. **Live G4 is not verified:** that means Tavus utterance events reaching the panel during a real call, a reflection from a real call, and Your data against real sessions. The two-user HTTP check for `GET /api/sessions` and `DELETE /api/practice-data` is carried to G5 (automatable).

## Human live G4 checklist (optional, whenever the human chooses)

On your machine, at `cursor/g4-reflection-9fec` with the dev server on port 3000. Optionally set `OPENAI_REFLECTION_MODEL`; it falls back to `OPENAI_SETUP_MODEL`.

1. Sign in → practice a new generated conversation with a goal → speak at least three times → End.
2. In "Reflect (optional)", type a short note → **Get a short reflection**. Check that it arrives within about 20 s, shows "What you did", "Takeaway" and "Next time" with no score or grade, and refers to something you actually said. Then press Done; the panel should disappear.
3. Start and End another short call. This time press **Skip** and confirm the flow closes cleanly (Back to setup works).
4. Open **Your data** in the header. Check that the sessions show "Deleted at provider" (or a truthful pending/not-confirmed state with Retry cleanup) and that the counts match your About-me facts and people.
5. Optional, destructive: **Delete all practice data** with the phrase, using a throwaway account or after the demo data is no longer needed. Check the deleted and remaining counts.
6. Report: did the reflection arrive and match what you said? Any score, or anything private (notes, About-me facts) in it? Did Skip/Done close cleanly? Were the cleanup labels correct? Was the mic released after each End?
7. Read-only database check (run and paste): `supabase db query --linked "select status, cleanup, ended_at is not null as ended from practice_sessions order by created_at desc limit 5"`. Then `select count(*) from information_schema.columns where table_schema='public' and column_name ilike '%transcript%'` should return 0.
