# G1-00D: Real Auth and database boundary check

Status: integrated verification (coordinator)
Owner: coordinator
Gate: G1 foundation; does not pass authenticated live-video gate
Base: a601a0e plus reviewed foundation migrations; original checkout
Issue: https://github.com/esaba12/conversaton-practice/issues/1
PR: foundation draft pending
Owned paths: `scripts/preflight/auth-database-check.mjs`, this record
Dependencies: both G1 migrations applied, rollback SQL assertions passed, server capability provisioned

Acceptance: create two temporary confirmed fictional Auth identities without email; authenticate with real password/JWT; verify signed-out rejection, owner-only REST/RPC, required server capability, denied direct writes, true simultaneous acquisition conflict, idempotency and terminal-state late-event handling. Delete only this run's fixtures afterward. No provider calls, no real email, no credentials persisted or printed.

Administrative key stays in isolated test process memory, obtained through the authenticated CLI. It is never written to application environment, imported by app code, or used for normal runtime requests. Runtime tests use publishable key and each user's real JWT. The ledger contains only exact fixture IDs in an ignored local file for cleanup recovery.

Evidence: October 3, 2026, approximately 14:35 America/Detroit; original checkout at a601a0e plus current changes. `node_modules/.bin/node --env-file=.env.local scripts/preflight/auth-database-check.mjs` exited 0. Mode live / outcome pass: two confirmed fictional users signed in; server identity verification, signed-out/capability rejection, owner isolation, denied direct writes, simultaneous start conflict, idempotency and terminal late-event handling passed. Cleanup reported all fixture users and rows removed; ledger deleted. No provider call or email was sent. This does not establish UI sign-in, email delivery, callback behavior or audiovisual quality.
