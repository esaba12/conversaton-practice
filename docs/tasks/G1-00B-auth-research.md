# G1-00B-auth-research: Auth and database foundation review

Status: integrated research handoff
Gate: G1 foundation research only
Owner: auth-research
Base revision: `4dc34a10b8206e8b375b9d767a780d5b1ea01968` plus preserved PREP-03 local documentation.
Issue: https://github.com/esaba12/conversaton-practice/issues/1
PR: https://github.com/esaba12/conversaton-practice/pull/8
Worktree: original checkout, read-only research except this task record.
Port: N/A
Dependencies: current project specs; official vendor documentation.
Shared contracts: proposals only; coordinator owns schemas, numbered specs and provider changes.
Owned paths: `docs/tasks/G1-00B-auth-research.md` only.

## Acceptance
Read current official Supabase SSR and database docs plus local contracts. Propose minimal owner-safe session leases and trusted provider association design, migration-access check and email sign-in flow. No SQL execution or cloud changes.

## Handoff
Report source links, exact recommended contract, remaining live checks, and proposed spec corrections to coordinator. Update this record with actual evidence only if permitted; otherwise send exact handoff. No secrets or account payloads.

## Verification
October 3, 2026: static official-documentation research completed. Recommended SSR request clients, verified nonanonymous identity, no-store authenticated responses and owner RLS. Identified that user-JWT RPC alone cannot distinguish trusted server association writes from a direct browser; recommended a global admin-established capability hash and narrow mutation functions. Outlined serialized owner leases, idempotency, late bind after End and truthful remote cleanup. Default SMTP recipient/rate limits remain a deployment dependency. The worker performed no cloud/SQL execution during research. Coordinator later verified migration, real-JWT and browser behavior in G1-00C/D; no live-media gate passed.

Sources: [SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [functions](https://supabase.com/docs/guides/database/functions), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp). The observed managed Auth-schema privilege issue and additive repair are documented in G1-00C; the initial proposal alone was not proof of deployability.
