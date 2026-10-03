# G1-01: Authenticate users and authorize durable voice sessions

Status: planned
Updated: October 3, 2026, America/Detroit
Assigned writer: unassigned; auth/session worker role
Coordinator: unassigned
Gate: G1
GitHub issue: [#2](https://github.com/esaba12/conversaton-practice/issues/2)
Pull request: not opened; CI: not run
Requirements/tests: P12, P13, P04, P09; T01, T03, T09, T10, T12, T13

## Assignment and isolation

- Base ref + SHA: pending integrated G1-00 commit.
- Branch: proposed `agent/G1-01-auth-session`; not created by this brief.
- Worktree: proposed `/Users/ethansaba/code/therapist/.worktrees/G1-01-auth-session`; not created.
- Port: proposed 3001; live authentication needs a coordinator-confirmed callback origin.
- Dependencies: frozen G1-00 identity/session/voice/error contracts, selected auth integration, minimal database design.
- Unblock condition: foundation integrated and ownership frozen. AWS identity/database permissions and ElevenLabs credentials are required for corresponding live checks.

Proposed exact ownership, frozen by G1-00 before `ready`:

- `lib/auth/identity.ts`, `lib/auth/session.ts`, `lib/data/client.ts`, `lib/data/users.ts`, `lib/data/sessions.ts`, `lib/data/cleanup.ts`, `lib/context/role-context.ts`, `lib/voice/server-credentials.ts`.
- `app/api/auth/[...auth]/route.ts`, `app/api/sessions/route.ts`, `app/api/sessions/[id]/connected/route.ts`, `app/api/sessions/[id]/end/route.ts`.
- `db/migrations/0001_identity_sessions.sql`, `tests/unit/auth-session.test.ts`, `tests/unit/role-context.test.ts`, `tests/integration/session-ownership.test.ts`, and this task record.
- Shared resources: coordinator owns migration execution, runtime/admin database roles, Cognito/provider configuration, lockfile, schemas, and numbered specs. The auth catch-all path is provisional until the chosen library is verified; it is not a vendor API claim.

## Scope and acceptance

- [ ] Validate identity server-side using the selected maintained integration; derive owner from validated identity, never a request owner ID. Gate credential issuance and every implemented workspace/data endpoint (P13/T13).
- [ ] Map validated issuer/subject to internal user ID. Enforce owner checks and restricted-role database isolation on every users/session/cleanup operation, with transaction-local owner context (P12/T03).
- [ ] Author G1 minimal schema for users, atomic active-session leases, expiry, and provider cleanup metadata. Keep full persona/profile/memory persistence in G3; never persist audio/transcripts/private prompts.
- [ ] Start validates the confirmed public fixture/context, acquires one lease atomically, and obtains short-lived provider credentials server-side. Define provider-start failure cleanup and safe retry without duplicate active sessions (T01/T10/T12).
- [ ] Receive the owner-authorized connected acknowledgement idempotently; do not revive terminal/expired sessions or extend the duration cap. Verify provider ID association before authoritative storage/provider access; report unresolved association honestly (T03/T09).
- [ ] End is owner-authorized and idempotent; repeated/disconnected/expired sessions converge according to frozen states `connecting`, `active`, `ending`, `ended`, `interrupted`, `deleted`. Late requests cannot reopen ended/deleted sessions (T09).
- [ ] Expose the auth-expiry/sign-out signal and cleanup contract needed by UI/voice. Server failures or auth expiry cannot prevent independent browser teardown. Preserve truthful pending cleanup metadata when network/provider work fails.
- [ ] Test missing/expired identity, cross-owner access, concurrent start, replayed End, and sanitized errors. Use fictional records; do not log secrets, transcripts, private context, or tokens.

## Contract and documentation handoff

Consume frozen shared schemas without editing them. Propose interface changes to the
coordinator with affected consumers. Include exact requested updates to docs/03, 04, 05,
09, 12, 18 and safe environment/migration runbooks; coordinator applies those changes.
Application contracts do not substitute for verified Cognito/ElevenLabs/AWS SDK behavior.

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
