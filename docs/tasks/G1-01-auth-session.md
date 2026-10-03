# G1-01: Authenticate users and authorize durable video call sessions

Status: active
Updated: October 3, 2026, 14:58 America/Detroit
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

## Verification evidence

- Mode/outcome: `not-run` / `not-run`; no implementation, migration, or live auth/database check performed by this brief.
- Date/time, tested SHA/dirty state, environment/directory, exact command/steps, exit code, observed result/artifact: pending.
- Planned checks: relevant auth/context/ownership/lifecycle checks plus typecheck and build after integration. Distinguish mocked identity from two actual signed-in identities with real database isolation.

## Handoff

- Changed implementation paths/commits: none recorded.
- Remaining blocker: foundation and app-specific account access; record actual failures when attempted.
- Next action: coordinator freezes ownership and assigns worker after G1-00.
- Ready for review/integrated revision: no / pending. Coordinator alone applies migrations and updates STATUS.
- Follow [workflow](../19-AGENT-WORKFLOW.md) and [documentation standard](../20-DOCUMENTATION-STANDARD.md).
