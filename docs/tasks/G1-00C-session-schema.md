# G1-00C: Reviewable owner-safe session foundation migration

Status: integrated (coordinator applied both migrations and verified assertions)
Gate: G1 foundation, independent of media feasibility
Owner: auth-research agent, SQL author only
Base: `a601a0e` on `build/g1-foundation`; original checkout shared with coordinator
Issue: https://github.com/esaba12/conversaton-practice/issues/1
PR: foundation draft pending
Port: none
Owned paths: `supabase/migrations/20261003180000_session_foundation.sql`, `supabase/migrations/20261003182400_identity_helper_privileges.sql`, `supabase/tests/session_foundation.sql`, this task record only. Coordinator temporarily delegates authoring of these migrations; execution, secrets, shared schemas and numbered specs remain coordinator-owned. The second migration is an authorized additive repair after the first was applied; never rewrite the applied first migration.

## Acceptance and contracts

Implement reviewed research from G1-00B. Global admin-provisioned server capability hash in inaccessible private schema, never caller-chosen. Empty config fails closed. User JWT and verified nonanonymous `auth.uid()` required for every mutation. Restricted NOLOGIN/NOBYPASSRLS executor, not table owner, fixed empty search_path, fully qualified names. Owner-only SELECT; revoke direct user DML. No service-role runtime.

Minimal public `practice_sessions`: id, owner_id, idempotency_key, request_fingerprint, status (connecting/active/ending/ended/interrupted/deleted), created_at, expires_at, provider_conversation_id, cleanup (not_started/pending/confirmed/unresolved). Add necessary timestamps. No secrets, URLs, transcripts, media or prompts. One active session per owner (partial unique index), owner+idempotency unique, provider ID unique when present. Do not drop/replace existing user objects; fresh public schema was confirmed empty.

RPC contracts (names fixed for consuming coordinator): `practice_acquire(p_secret text, p_key uuid, p_fingerprint text, p_duration integer)` returns JSON `{created:boolean, session:<row>}`; `practice_bind(p_secret text,p_id uuid,p_provider_id text)` returns row JSON and never reactivates terminal states; `practice_connected(p_secret text,p_id uuid)` returns row JSON; `practice_end(p_secret text,p_id uuid,p_reason text)` returns row JSON preserving prior terminal state; `practice_cleanup(p_secret text,p_id uuid,p_cleanup text)` returns row JSON. Only configured secret + same owner can call. Capability check function private; config digest uses pgcrypto SHA-256 via extensions.digest. Coordinator provisions hash separately, outside migration. No browser-supplied provider ID accepted in application routes.

Acquisition serializes by owner advisory transaction lock; lazily marks expired active states interrupted + appropriate pending/unresolved cleanup. Idempotency replay never returns created=true. Same key changed fingerprint raises P0001 with safe constant marker IDEMPOTENCY_CONFLICT; active lease conflict SESSION_ACTIVE. Unknown/foreign row FORBIDDEN; expired acknowledgement SESSION_EXPIRED; missing capability FORBIDDEN. Late bind is accepted for owner terminal row to enable cleanup, unique immutable association; never start second provider call on replay. Duration 180 or 300. Lease starts at acquisition (bounded maximum call). End commits terminal state before remote cleanup; deletion belongs later gate, do not implement broader domain persistence.

Provide SQL transactional tests in owned tests file: two synthetic auth identities using local JWT claims, absence/wrong secret, anonymous identity, direct DML forbidden, owner isolation, duplicate idempotency, changed fingerprint, terminal acknowledgement, late bind after End, monotonic cleanup. Tests must roll back, insert no real accounts or PII and not change cloud settings. DO NOT EXECUTE SQL or provision secrets; coordinator reviews and runs against fresh linked project. If test setup requires auth.users inserts, fixture UUIDs only and rollback.

Handoff: exact changed files, privilege design, expected return shapes/errors, proposed spec changes, tests authored versus actually run. Do not claim live verification. No Git commit/staging in shared checkout; coordinator commits.

## Authored result

October 3, 2026: authored only the assigned migration, transactional SQL assertion file, and this task record. No SQL, cloud call, credential provisioning, package install, or Git mutation was performed by the worker.

- `supabase/migrations/20261003180000_session_foundation.sql`: owner-scoped sessions, partial unique active lease, immutable provider association, private capability gate and five named RPCs.
- `supabase/tests/session_foundation.sql`: rollback-only database assertions using two fictional UUID identities and synthetic JWT claims. These simulate database roles; they do not establish real Supabase sign-in or HTTP token verification.

### Privileges and provisioning

`practice_session_executor` is NOLOGIN/NOINHERIT/NOBYPASSRLS and owns the five public mutation functions, not tables. Tables remain administrator-owned. Owner RLS applies to authenticated reads and executor writes. Direct authenticated DML and private-table access are revoked. After the additive privilege repair, private `require_owner(text)` is a postgres-owned SECURITY DEFINER helper, executable only by the executor (besides its administrative owner). It checks vendor identity helpers and the capability digest, obtains the advisory lock, and returns the owner UUID; it never mutates session rows. The executor no longer reads the capability table directly. All functions fix the empty search path and qualify objects. Temporary membership/schema grants needed for ownership transfer are revoked before commit.

Coordinator provisioning contract: `practice_private.server_capability(singleton boolean, secret_hash bytea)` receives exactly one row with `singleton=true` and the SHA-256 digest of a random server-only capability. No capability is included in the migration. An empty configuration denies every mutation. Provision via administration, never an authenticated bootstrap RPC. This is an application capability check combined with user JWT ownership, not a service-role key. Runtime secrets must never reach browser bundles or logs.

Privilege caveats for coordinator execution: the migration administrator must be allowed to create/transfer this restricted role, grant schema privileges, and reference auth.users. Confirm the executor has no inherited schema CREATE or role membership after execution. Existing names cause a failure rather than replacing user objects. The test administrator must be able to insert rollback-only auth.users fixtures and temporarily set the authenticated/anon roles. Tests temporarily replace the capability row inside their transaction; rollback restores the prior value. Do not commit or split the test transaction.

### Return values and transitions

`practice_acquire` returns `{created:boolean,session:<full database row>}`; the other RPCs return the full row as JSONB. Map database snake_case fields into the smaller existing app response schema server-side. Only `created=true` authorizes a provider creation attempt. Include all relevant request options, especially duration, in the trusted request fingerprint.

Duplicate acquisition retains the same row and expiry. Expired active states lazily become interrupted. Connected acknowledgement requires a bound provider ID, rejects expired/terminal rows, and is idempotent without extending expiry. End preserves any prior terminal state; otherwise user/navigation/time_limit becomes ended, and auth_loss/connection_failure or expired lease becomes interrupted. End before binding records unresolved cleanup. A later bind preserves the terminal state and authoritative ID is immutable.

Cleanup is separately updated only for terminal sessions. Confirmed cannot downgrade; unresolved cannot become pending; confirmed requires a bound provider ID. Same-value repeats succeed. Unresolved can become confirmed after a successful late cleanup. A provider association uniqueness collision returns a safe constant rather than exposing the conflicting row.

All expected domain failures use SQLSTATE P0001 and a constant marker: FORBIDDEN, INVALID_INPUT, IDEMPOTENCY_CONFLICT, SESSION_ACTIVE, ASSOCIATION_CONFLICT, ASSOCIATION_REQUIRED, SESSION_CLOSED, SESSION_EXPIRED, INVALID_TRANSITION. Coordinator must sanitize/map these to public error codes; never return raw database errors. A raised exception rolls back that RPC transaction, including any attempted lazy expiry changes. An expired acknowledgement reports SESSION_EXPIRED without falsely claiming it committed reconciliation.

### Authored assertions and remaining evidence

Assertions cover empty/wrong/missing capability, signed-out database role, anonymous/missing identity, direct DML/private access denial, owner reads, foreign-owner mutation denial, duplicate starts, conflicting keys/fingerprints, invalid duration, repeated connection acknowledgement, preserved expiry, terminal End replay, terminal acknowledgement, immutable and globally unique provider IDs, late bind after End, monotonic confirmed cleanup, expiry reconciliation, and executor privilege shape.

Actual worker check: `git diff --check -- supabase/migrations/20261003180000_session_foundation.sql supabase/tests/session_foundation.sql docs/tasks/G1-00C-session-schema.md` exited 0; it does not validate untracked SQL syntax. Source was manually reviewed. No SQL parser/database assertion execution was performed. No unit/typecheck/build was needed for SQL authorship alone; coordinator runs relevant integrated checks.

Remaining checks: coordinator SQL execution and rollback verification, direct HTTP/RPC isolation with real identities, genuine simultaneous acquisitions from separate transactions, request/response sanitization, provider-create timeout/late-response cleanup, runtime environment capability provisioning, and live sign-in. The single-transaction SQL assertions cannot establish cross-connection concurrency behavior or audiovisual quality. No G1 acceptance is claimed.

Proposed coordinator spec corrections: document this exact global-capability/role boundary; distinguish terminal call status from remote cleanup; state that lease expiry is reconciled lazily and does not itself stop remote media; remove browser-supplied provider association authority. Live creation credentials must still be rejected/cleaned up by the server if the lease expires before its provider response arrives.

## Additive privilege repair

Coordinator verification, October 3 at approximately 14:27 America/Detroit, original checkout a601a0e plus current migrations: `supabase db push --yes` applied the repair, then `supabase db query --linked --file supabase/tests/session_foundation.sql` exited 0 with all assertions completed and transaction rollback. Mode live database / pass. Migration catalog caching emitted a Docker-unavailable warning, but migration application and remote SQL verification succeeded. Separate real-JWT/concurrent HTTP checks also passed; see G1-00D. Historical author-only statements below describe the worker handoff before coordinator execution.

Coordinator-reported live evidence, October 3: `supabase db push` applied the first migration successfully. The first missing-configuration assertion in the transactional SQL tests failed with SQLSTATE 42501, permission denied for schema auth, while initializing `require_owner` through auth.uid(). The expected result was P0001/FORBIDDEN. Coordinator's follow-up read query returned executor auth-schema USAGE=false, authenticated auth-schema USAGE=true, and executor auth.uid EXECUTE=true. Thus the attempted auth-schema grant did not establish required usage; the original migration's success was insufficient evidence of working RPC execution.

The coordinator delegated the new `20261003182400_identity_helper_privileges.sql` path. This repair transfers only the private identity/capability helper to postgres, enables SECURITY DEFINER with a fixed empty search path, grants executor-only invocation, and removes executor direct capability-table SELECT. It temporarily restores executor membership to postgres for ownership transfer and revokes that membership again. It neither broadens the executor through Auth roles nor changes the five public RPC ownership/RLS boundaries.

The SQL test now additionally asserts private-helper ownership/definer/search-path settings, denied authenticated/anon execution, executor invocation rights without direct capability-table reads, and retained executor ownership of all five public mutation RPCs. The worker authored this repair and assertions but did not execute them. Coordinator must apply the additive migration, rerun the complete rollback transaction, and verify the absence of persisted fixture users/rows. The observed initial failure remains recorded; no passing database test result is claimed here.
