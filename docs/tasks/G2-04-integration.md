# G2-04: Integrate and verify editable situation generation

Status: active — integrated and checked; human live G2 call pending
Updated: October 3, 2026, 16:58 EDT
Assigned writer: coordinator
Coordinator: Cursor coordinator session
Gate: G2
Requirements/tests: G2 acceptance (docs/10), docs/09 line 32 (novel situation), T01, T13
GitHub issue: [#12](https://github.com/esaba12/conversaton-practice/issues/12), [#13](https://github.com/esaba12/conversaton-practice/issues/13), [#14](https://github.com/esaba12/conversaton-practice/issues/14)
Pull request: see STATUS (draft PR from `build/g2-generation`)
CI run: pending on the PR

## Integration

| Commit | Content |
| --- | --- |
| `346b61d` | Frozen contracts: `lib/schemas/draft.ts`, start-request union, `OUT_OF_SCOPE`, `readBody` max length, `OPENAI_SETUP_MODEL` |
| `4fcbb81` | [G2-02](G2-02-start-reviewed-role.md) start with reviewed role |
| `262c04e`, `0bf37bf` | [G2-01](G2-01-setup-generation.md) draft route; prompt `.2` after live check |
| `831b122` | [G2-03](G2-03-setup-review-ui.md) describe → generate → review/edit → start UI |
| `5ce6249` | Signed-in G2 UI check in `scripts/preflight/auth-database-check.mjs --ui-only` |
| this commit | Privacy-review fixes (below), docs |

## Privacy review

Read-only reviewer on `831b122`: no blockers. Confirmed private notes/goal never reach the start request, Tavus body, logs, errors, storage or URLs; auth precedes body parsing and provider calls; strict schemas end to end; no secrets in client bundles; sign-out clears setup state; every start is a new Tavus conversation.

Fixed after review:
- Prompt `setup-2026-10-03.3`: private notes may not add facts, feelings, traits or details to any role field (paraphrase risk; still prompt-level only, not live-re-tested).
- `buildRoleContext` adds a fixed boundary line (everyday conversation; no threats, insults, slurs, sexual content or impersonating a real public figure), so manually edited roles carry it too.
- `lib/setup/prompt.ts` is `server-only`.
- Idempotency fingerprint is an HMAC keyed by `SESSION_SERVER_SECRET`.
- Private-notes textarea: `autoComplete="off"`, `spellCheck={false}`; back/forward-cache restore clears setup state.

Deferred: per-user draft rate limit (`USAGE_LIMIT`) — cost risk, not privacy; revisit in G5 if time allows.

## Verification evidence

All October 3, 2026, local macOS, Node 22.23.3, `/Users/ethansaba/code/therapist`, on the final commit's tree unless noted.

- `npm run typecheck` — unit/static — pass.
- `npm test` — unit/mock — pass, 6 files, 66 tests.
- `npm run build` — pass (Next 16.3.8; `/api/scenarios/draft` dynamic route present).
- Browser suite against the already-running dev server on port 3000 (temporary uncommitted config, because Next 16 refuses a second dev server in the same directory): 8 passed, 1 production-only skipped.
- HTTP on `831b122` tree — live local — signed-out `POST /api/scenarios/draft` → 401 `UNAUTHENTICATED`; cross-site origin → 403 `FORBIDDEN`; signed-out `POST /api/sessions` → 401.
- `node --env-file=.env.local scripts/preflight/auth-database-check.mjs --ui-only` — real Supabase Auth with two temporary confirmed fictional users, Chromium; draft and start requests intercepted in the browser (no OpenAI or Tavus call) — pass: private-note marker sent only in the draft request; generated draft shown for review; edited name carried into start; start body keys exactly `durationSeconds,idempotencyKey,role`; marker and goal absent from start; sign-out and denied re-entry. Fixtures and session rows removed. Screenshot inspected at ignored `artifacts/local/g2-review.png`.
- Live OpenAI generation — see G2-01 (two calls on prompt `.1`; pass). Prompt `.3` not re-run live.

Not yet verified: real `/api/scenarios/draft` over HTTP with a signed-in user; live Tavus call with a generated/edited role; that edits change counterpart behavior; interruption with a custom role; private note absent from spoken replies; out-of-scope classification live; keyboard-only and mobile walkthrough of the new screens.

## Human live G2 check (pending)

Sign in at http://127.0.0.1:3000 → describe a novel situation (not roommate) with a distinctive private note → Generate → edit one field (e.g. name or style) → Start → a few exchanges showing the edited persona → interrupt once → End. Report: generation usable? edit reflected? interruption? any private-note content in replies? mic released?
