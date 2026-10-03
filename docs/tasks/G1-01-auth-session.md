# G1-01: Authenticate users and authorize durable video call sessions

Status: review
Updated: October 3, 2026, 15:05 America/Detroit
Assigned writer: Cursor subagent "G1-01 server routes"
Coordinator: Cursor coordinator session
Gate: G1
GitHub issue: [#2](https://github.com/esaba12/conversaton-practice/issues/2)
Pull request: not opened; CI: not run
Requirements/tests: P12, P13, P04, P09; T01, T03, T09, T10, T12, T13

## Dispatch (supersedes the proposed assignment below)

- Base: branch `build/g1-session-media`, frozen-contract commit recorded in STATUS. Shared original checkout with G1-02/G1-03 workers on disjoint paths; no separate worktree.
- Owned paths: `lib/data/sessions.ts`, `lib/session/server.ts`, `lib/api/respond.ts`, `app/api/sessions/route.ts`, `app/api/sessions/[id]/connected/route.ts`, `app/api/sessions/[id]/end/route.ts`, `lib/media/tavus.ts`, `tests/unit/tavus.test.ts`, `tests/unit/session-server.test.ts`, this record.
- Frozen contracts (read-only): HTTP shapes in `lib/schemas/session.ts`, `errorSchema`/`AppError` in `lib/schemas/errors.ts`, `mediaCredentialSchema`, `requireIdentity()` in `lib/auth/server.ts`, the five RPCs in [G1-00C](G1-00C-session-schema.md).
- Do not run `npm run build`, `npm run test:ui`, live provider calls, SQL, or Git commits; the coordinator does. Do not touch other workers' paths.

- Base ref + SHA: pending integrated G1-00 commit.
- Branch: proposed `agent/G1-01-auth-session`; not created by this brief.
- Worktree: proposed `/Users/ethansaba/code/therapist/.worktrees/G1-01-auth-session`; not created.
- Port: proposed 3001; live authentication needs a coordinator-confirmed callback origin.
- Dependencies: frozen G1-00 identity/session/media/error contracts, selected auth integration, minimal database design, and bounded media provider feasibility decision in [the live video contract](../22-LIVE-VIDEO.md).
- Unblock condition: foundation integrated and ownership frozen. The fresh Supabase project is configured and Auth health returned HTTP 200; real sign-in, migration access, and database isolation remain untested. Supabase Auth/database access, ElevenLabs credentials, and the selected avatar streaming access are required for corresponding live checks.

Proposed exact ownership, frozen by G1-00 before `ready`:

- `lib/auth/identity.ts`, `lib/auth/session.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `lib/data/client.ts`, `lib/data/sessions.ts`, `lib/data/cleanup.ts`, `lib/context/role-context.ts`, `lib/media/server-credentials.ts`.
- `app/auth/callback/route.ts`, `app/api/sessions/route.ts`, `app/api/sessions/[id]/connected/route.ts`, `app/api/sessions/[id]/end/route.ts`.
- One timestamped `supabase/migrations/<timestamp>_identity_sessions.sql` assigned at foundation, `tests/unit/auth-session.test.ts`, `tests/unit/role-context.test.ts`, `tests/integration/session-ownership.test.ts`, and this task record.
- Shared resources: coordinator owns migration execution, Supabase Auth/policy configuration, provider configuration, lockfile, schemas, and numbered specs. Callback and token-refresh paths are provisional until the chosen Next.js version and login method are verified. Coordinator wires root `proxy.ts` (or `middleware.ts` for Next.js 15) to the worker's refresh helper.

## Scope and acceptance

- [ ] Validate Supabase identity server-side with verified claims or a fresh Auth user lookup; never trust the user embedded in getSession alone. Reject anonymous/missing/expired identities before credential issuance or workspace/data operations (P13/T13).
- [ ] Use the verified Supabase Auth user UUID as owner_id. Enforce ownership and RLS with request-scoped user-JWT server clients; do not use a service-role client for ordinary user operations (P12/T03).
- [ ] Author G1 schema referencing auth.users, atomic active-session lease RPCs, expiry, and provider cleanup metadata. Protect privileged metadata/mutations against direct Data API calls as specified in docs/03 and 04. Keep full persona/profile/memory persistence in G3; never persist video/audio/transcripts/private prompts.
- [ ] Start validates the confirmed public fixture/context, acquires one lease atomically, and obtains the documented session credentials server-side for conversation and avatar streaming. Public-only per-session context uses the trusted server-controlled path frozen in G1-00; never mutate a shared agent prompt. Define cleanup for partial provider startup and safe retry without duplicate active sessions (T01/T10/T12).
- [ ] Receive the owner-authorized connected acknowledgement only after both usable counterpart audio and live video, idempotently; do not revive terminal/expired sessions or extend the duration cap. Verify each provider ID association before authoritative storage/provider access; report unresolved association honestly (T03/T09).
- [ ] End is owner-authorized and idempotent; repeated/disconnected/expired sessions converge according to frozen states `connecting`, `active`, `ending`, `ended`, `interrupted`, `deleted`. Late requests cannot reopen ended/deleted sessions (T09).
- [ ] Expose the auth-expiry/sign-out signal and cleanup contract needed by UI/media. Server failures or auth expiry cannot prevent independent browser teardown of audio/video and microphone/optional camera tracks. Preserve per-provider pending cleanup metadata when network/provider work fails, including failures after only one provider started.
- [ ] Test missing/expired identity, cross-owner access, concurrent start, replayed End, and sanitized errors. Use fictional records; do not log secrets, transcripts, private context, or tokens.

## Contract and documentation handoff

Consume frozen shared schemas without editing them. Propose interface changes to the
coordinator with affected consumers. Include exact requested updates to docs/03, 04, 05,
09, 12, 18, 22 and safe environment/migration runbooks; coordinator applies those changes.
Application contracts do not substitute for verified Supabase/ElevenLabs/avatar SDK behavior.

## Implemented behavior (worker, October 3)

- Every route calls `requireIdentity()` first, then uses its request-scoped user-JWT client for the five RPCs with `SESSION_SERVER_SECRET` as `p_secret` (missing or shorter than 32 characters: 503 `NOT_CONFIGURED`). No service-role client. Path ids must be UUIDs; bodies are parsed from text (so `navigator.sendBeacon` works) with the frozen strict schemas, 2 KB limit. A present `Origin` whose host differs from `Host` is rejected with 403.
- Start: checks Tavus configuration before acquiring; fingerprint is SHA-256 hex of `{preset,durationSeconds}`. `created=false` returns 409 `SESSION_ACTIVE` with that row id; a database `SESSION_ACTIVE` marker looks up the caller's own active row id through owner RLS. Only `created=true` makes exactly one `createConversation` call with the server-side roommate fixture. Create failure ends the lease (`connection_failure`, cleanup becomes unresolved because no provider id is known) and returns 503 `PROVIDER_UNAVAILABLE` `retryable:false`. Bind failure ends the lease and stops plus hard-deletes the remote call. A bound row that is already terminal or expired gets End (`time_limit` if needed) plus remote cleanup and a 409 `SESSION_EXPIRED` with no credential. Otherwise 201 `{session, credential}`.
- Connected: `practice_connected`, returns 200 `{session}`.
- End: `practice_end` commits terminal state first. If a provider id is bound and cleanup is not confirmed, the server sends Tavus End (failure tolerated), verifies status `ended`, then sends `DELETE conversations/{id}?hard=true`, and only then records `practice_cleanup confirmed`. Any failure leaves the database's pending/unresolved value. Cleanup provider calls use 8 s timeouts (worst case about 24 s). Repeated End retries cleanup.
- Public error mapping (all errorSchema JSON, fixed messages, random `request_id`):

| Source | HTTP | Code |
| --- | --- | --- |
| Not signed in / anonymous | 401 | UNAUTHENTICATED |
| Bad id/body, `INVALID_INPUT` | 400 | VALIDATION_ERROR |
| `FORBIDDEN`, cross-site Origin | 403 | FORBIDDEN |
| `IDEMPOTENCY_CONFLICT`, `ASSOCIATION_REQUIRED`, `INVALID_TRANSITION` | 409 | VALIDATION_ERROR |
| `SESSION_ACTIVE`, replay | 409 | SESSION_ACTIVE (+`session_id`) |
| `SESSION_CLOSED`, `SESSION_EXPIRED`, End won race | 409 | SESSION_EXPIRED |
| `ASSOCIATION_CONFLICT`, provider create failure | 503 | PROVIDER_UNAVAILABLE (`retryable:false`) |
| Other DB/network error | 503 | PROVIDER_UNAVAILABLE (`retryable:true`) |
| Missing capability or Tavus config | 503 | NOT_CONFIGURED |
| Unexpected exception | 500 | PROVIDER_UNAVAILABLE (logs request id only) |

- `lib/media/tavus.ts`: added `assertTavusConfigured`, `deleteConversation` (hard delete), and `stopConversation` (end, verify, hard delete; never throws). `request` accepts a timeout. `endConversation` tolerates an End POST failure and still verifies status. Malformed create responses now use `stopConversation`.

## Verification evidence

- Mode/outcome: unit/static mock-tested / pass. October 3, 2026 about 15:03 America/Detroit, base `7d6ff43` with uncommitted work from this and other workers, original checkout.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0, 5 files, 38 tests passed. `npx vitest run tests/unit/session-server.test.ts tests/unit/tavus.test.ts --reporter=verbose`: 17 passed (13 route tests, 4 Tavus tests).
- The route tests mock `requireIdentity`, the Supabase `rpc`/`from` client and `fetch`. They cover unauthenticated rejection, invalid id/body/extra fields and cross-site origin, missing capability, successful start, replay 409 with `session_id`, database `SESSION_ACTIVE` lookup, a single create attempt on timeout, End winning the race (cleanup confirmed, no credential), bind failure cleanup, idempotent End that retries a failed hard delete, connected/terminal mapping, and sanitized storage/unexpected errors.
- Not run: `npm run build`, real HTTP requests with a signed-in user, real RPC calls through these routes, live Tavus create/end/delete. Nothing here is live-verified.

## Handoff

- Changed implementation paths: `lib/data/sessions.ts`, `lib/session/server.ts`, `lib/api/respond.ts`, `app/api/sessions/route.ts`, `app/api/sessions/[id]/connected/route.ts`, `app/api/sessions/[id]/end/route.ts`, `lib/media/tavus.ts`, `tests/unit/session-server.test.ts`, this record. `tests/unit/tavus.test.ts` unchanged and passing. No commits.
- Remaining checks: production build; signed-in HTTP start/connected/end against the linked project with the provisioned capability; two-identity cross-owner HTTP denial; live Tavus create, End, verify and hard delete; End during an in-flight create; behavior when Tavus reports an already hard-deleted conversation (GET 404 currently leaves cleanup pending forever).
- Proposed contract changes (coordinator decides): add an `INTERNAL_ERROR` (500) code instead of reusing `PROVIDER_UNAVAILABLE` for unexpected and storage failures; optionally a `NOT_READY` code for `ASSOCIATION_REQUIRED`; document that a replay of an already terminal session also returns 409 `SESSION_ACTIVE` per the frozen contract, even though nothing is active.
- Ready for review/integrated revision: yes / pending. Coordinator alone applies migrations and updates STATUS.
- Follow [workflow](../19-AGENT-WORKFLOW.md) and [documentation standard](../20-DOCUMENTATION-STANDARD.md).
