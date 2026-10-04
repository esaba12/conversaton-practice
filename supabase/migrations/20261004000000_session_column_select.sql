-- FIX-02. Signed-in users may read only the practice_sessions columns the app lists.
-- Table-level select for authenticated is replaced by column select. The omitted
-- columns are idempotency_key, request_fingerprint, and provider_conversation_id.
-- practice_session_executor grants are unchanged.
-- Rollback: grant select on public.practice_sessions to authenticated;
begin;

revoke select on public.practice_sessions from authenticated;
grant select (id, owner_id, status, created_at, expires_at, connected_at, ended_at, cleanup, person_id, person_version)
  on public.practice_sessions to authenticated;

commit;
