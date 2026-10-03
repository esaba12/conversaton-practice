# G2 kickoff — October 3, 2026, 16:30 EDT

Read this after AGENTS.md and STATUS.md when starting a fresh coordinator context. It records where G1 ended and the exact plan for G2.

## Where things are

- **G1 passed** on `main` at `4964761` (PR [#10](https://github.com/esaba12/conversaton-practice/pull/10), CI pass). Signed-in user completed a real Tavus + ElevenLabs video call in the app: responsive talking face, ~five exchanges, interruption, mic released on End, mid-call sign-out clean, DB row `ended` + cleanup `confirmed`. Email signup confirmation also works locally. Evidence: [G1-04](tasks/G1-04-integration.md). Issues #1–#5 closed.
- Known limitation: lip sync slightly imperfect on the stock face. Do not build custom pipelines to fix it; optionally try another stock face late.
- Residual G1 paths to recheck in G5 (not blockers): lease/auth expiry teardown, 180 s auto-end, pagehide keepalive end, End with server unreachable, live camera preview toggle, two-owner denial through the new HTTP routes.
- Not started: G2 (generation), G3 (approved memory), G4 (reflection/deletion), G5 (evaluation), submission. Internal submission target **October 4, 11:30 AM America/Detroit**.

## Progress (16:50 EDT, branch `build/g2-generation`)

- `346b61d` contracts frozen (situation limit 1,000 per docs/02, not 1,500).
- `4fcbb81` G2-02 integrated: start with reviewed role; canonical role fingerprint.
- `262c04e` G2-01 integrated: `POST /api/scenarios/draft`; `0bf37bf` prompt `.2` after one live generation check (pass; see G2-01 record).
- G2-03 UI worker still active. Then: privacy review, verification recipe, PR, human live G2 call. Parallel G3/demo preparation prompts: [docs/25](25-PARALLEL-PROMPTS.md).

## Current app shape

| Path | Role |
| --- | --- |
| `app/practice/practice-workspace.tsx` | Client orchestrator: setup → connecting → live → ended/interrupted; local-first teardown |
| `components/presentation/practice.tsx` | `PracticeSetup` / `PracticeCall` presentation (pure props) |
| `app/api/sessions/**`, `lib/session/server.ts`, `lib/data/sessions.ts`, `lib/api/respond.ts` | Authenticated start/connected/end over Supabase RPCs; `handle()` + `readBody()` + `parseId()` helpers for new routes |
| `lib/media/tavus.ts`, `lib/media/daily-controller.ts` | Server Tavus adapter; browser Daily controller |
| `lib/schemas/*.ts` | Frozen Zod contracts (session HTTP shapes, errors, media, role context) |
| `fixtures/roommate.ts` | The only counterpart today; start route builds context from it server-side |

Start currently ignores client content: `startRequestSchema` is `{idempotencyKey, preset: "roommate", durationSeconds}` and the server uses the fixture. G2 must change this.

## G2 goal and acceptance

Gate G2 (docs/10-BUILD-PLAN.md): a novel user-described situation generates a usable editable setup; the user reviews/edits and starts a live call with that counterpart; responses and interruption work; private notes never reach the counterpart; each session starts without prior simulated history. A canned preset alone does not pass (docs/09 line 32). Manual setup fallback when generation fails, clearly not counted as generation.

Specs to read: docs/01-PRD.md, docs/02-UX.md (setup inputs and limits, lines ~15–30), docs/05-API-AND-ACTIONS.md (`POST /api/scenarios/draft`), docs/07-PROMPTS.md (setup generator rules), docs/08-SAFETY-AND-PRIVACY.md, docs/09-EVALUATION.md (T01 context separation, T13).

## Contracts the coordinator freezes first (before dispatch)

1. `lib/schemas/draft.ts`:
   - `draftRequestSchema` strict: `situation` (1–1500), optional `goal` (≤200), optional `privateNotes` (≤1000). Private notes are used only to shape the draft, never stored, never sent to Tavus.
   - `draftResponseSchema`: `{ role: RoleContext (existing roleContextSchema), goal: string, assumptions: string[] (≤5, shown for review) }`.
   - Route: `POST /api/scenarios/draft` → 200 draftResponseSchema; errors via errorSchema (401, 400, 503 `PROVIDER_UNAVAILABLE` retryable, 503 `NOT_CONFIGURED`). No persistence.
2. Extend `startRequestSchema` to accept the reviewed role instead of only the preset: `{ idempotencyKey, durationSeconds, role: roleContextSchema }` (keep `preset: "roommate"` as an alternative via discriminated union if cheap). Server re-validates with strict `roleContextSchema` (rejects private fields), builds context via `buildRoleContext`, and includes a hash of the role in the idempotency fingerprint. Never trust or forward any other client field.
3. Model config: server-only `OPENAI_API_KEY` (present in `.env.local`) and new `OPENAI_SETUP_MODEL` in `.env.example`. Use the OpenAI Responses API with structured outputs (JSON schema from Zod 4 `z.toJSONSchema`) via `fetch` to avoid a new dependency; verify request/response shape against official OpenAI docs before coding. Validate model output with Zod; at most one retry on invalid output, then return a retryable error so the UI offers the manual form.

## Parallel worker split (same checkout, disjoint paths; workers do not build, run Playwright, call live providers, or write Git)

| Task | Owned paths | Notes |
| --- | --- | --- |
| G2-01 setup generation server | `lib/setup/generate.ts`, `lib/setup/prompt.ts`, `app/api/scenarios/draft/route.ts`, `tests/unit/setup-generate.test.ts`, its task record | Prompt per docs/07; private notes may shape public facts only as the user would share them, never quoted into role; reject/skip unsafe requests per docs/08; mock fetch in tests |
| G2-02 start with reviewed role | `lib/session/server.ts`, `app/api/sessions/route.ts`, `lib/media/tavus.ts` (if needed), `tests/unit/session-server.test.ts`, its task record | Use the frozen start schema; fingerprint includes role hash; fixture stays as preset path |
| G2-03 setup + review UI | `components/presentation/setup-*.tsx` (new), `app/practice/practice-workspace.tsx`, `lib/session/api-client.ts` (add `generateDraft`), `tests/unit/api-client.test.ts`, its task record | Describe-situation form → generating state → editable review (name, role, style, context, opening, goal, challenge, pace) → Start; manual-form fallback on failure; preserve inputs; private notes clearly labeled "never shared with the character" |
| Optional read-only reviewer | none | Privacy/context-separation review of the combined diff (T01, docs/08) before integration |

Coordinator: write task records `docs/tasks/G2-01..03` from TEMPLATE before dispatch, create GitHub issues, own `lib/schemas/**`, `.env.example`, `package.json`, STATUS, numbered specs. Integrate one task at a time, then run the full checks.

## Verification recipe

```sh
npm run typecheck && npm test && npm run build
PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npm run test:ui
```

- Shell sandbox: localhost HTTP, Playwright, `gh`, `git push`, and `supabase db query --linked` need the `all` permission. Playwright's sandbox browser cache is empty, hence the env var.
- Dev server: `npm run dev -- --port 3000` (may need restarting after a context reset). Next 16 build output does not conflict with the running dev server.
- `next-env.d.ts` flips when dev runs; never stage it.
- Live OpenAI inference is untested: the first real `/api/scenarios/draft` call also tests key and billing. A coordinator may make one small real generation call with a fictional situation after integration.
- G2 live acceptance needs the human: generate a novel situation (not roommate), edit something, start, have a few exchanges showing the edited persona, interrupt once, End. Check a private note does not surface in the counterpart's replies.

## After G2

G3 approved memory (migration owned/applied by coordinator, transactional version-checked approval), then G4 short reflection + deletion status, G5 evaluation incl. G1 residuals, then demo recording and submission by 11:30 AM. Scope-cut order is in docs/10-BUILD-PLAN.md; never cut generation, live video, editable persona, approved-memory boundary, End, or ownership.

## Paste-ready prompt

```text
Continue as coordinator in /Users/ethansaba/code/therapist on main.
Read AGENTS.md, STATUS.md, docs/24-G2-KICKOFF.md, then the G2 specs it
lists. G1 is passed and merged (4964761); do not redo it.

Go full speed on G2 with parallel subagents. First freeze the contracts in
docs/24 section "Contracts the coordinator freezes first" (lib/schemas,
.env.example), write task records G2-01..03 from docs/tasks/TEMPLATE.md,
open GitHub issues, commit on a new branch, then dispatch three background
subagents with the owned paths in the table (plus an optional read-only
privacy reviewer). Workers: no build, no Playwright, no live provider
calls, no git writes. Review and integrate each as it finishes, run the
verification recipe, make one small real OpenAI generation check with a
fictional situation, update docs/STATUS, push a PR, then ask me for the
live G2 call. Keep sign-in required, private notes out of counterpart
context, sessions fresh, and record only checks actually run.
```
