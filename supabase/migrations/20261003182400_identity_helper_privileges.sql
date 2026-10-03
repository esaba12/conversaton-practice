-- Supabase's postgres role has auth-schema USAGE but cannot delegate it.
-- Keep privileged identity/capability verification in this private helper;
-- public session mutations remain owned by the RLS-constrained executor.
begin;

grant practice_session_executor to postgres;
alter function practice_private.require_owner(text) owner to postgres;
alter function practice_private.require_owner(text) security definer;
alter function practice_private.require_owner(text) set search_path = '';
revoke all on function practice_private.require_owner(text) from public, anon, authenticated;
grant execute on function practice_private.require_owner(text) to practice_session_executor;
revoke select on practice_private.server_capability from practice_session_executor;
revoke practice_session_executor from postgres;

commit;
