-- Execute as the migration administrator, after reviewing the migration.
-- Fictional fixtures only. All rows, helper functions, grants and config changes
-- are rolled back. This script does NOT call providers or exercise HTTP JWT validation.
begin;
set local statement_timeout = '20s';

create function practice_private.test_expect_error(p_sql text, p_state text, p_marker text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_caught boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_state or (p_marker is not null and sqlerrm <> p_marker) then raise; end if;
    v_caught := true;
  end;
  if not v_caught then raise exception 'Expected operation to be rejected'; end if;
end;
$$;
grant usage on schema practice_private to authenticated, anon;
grant execute on function practice_private.test_expect_error(text, text, text) to authenticated, anon;

insert into auth.users(id, aud, role, is_anonymous) values
  ('00000000-0000-4000-8000-00000000a001', 'authenticated', 'authenticated', false),
  ('00000000-0000-4000-8000-00000000b001', 'authenticated', 'authenticated', false);
-- An existing real capability, if present, is restored by ROLLBACK.
delete from practice_private.server_capability;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","is_anonymous":false}', true);
select practice_private.test_expect_error(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-000000000001', 'fixture-a-180', 180, null, null)$$,
  'P0001', 'FORBIDDEN');
reset role;
insert into practice_private.server_capability(singleton, secret_hash)
  values (true, extensions.digest(repeat('fictional-test-capability-', 3), 'sha256'));

set local role anon;
select practice_private.test_expect_error(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-000000000001', 'fixture-a-180', 180, null, null)$$,
  '42501');
reset role;
set local role authenticated;
select practice_private.test_expect_error(
  $$select public.practice_acquire(null, '10000000-0000-4000-8000-000000000001', 'fixture-a-180', 180, null, null)$$,
  'P0001', 'FORBIDDEN');
select practice_private.test_expect_error(
  $$select public.practice_acquire(repeat('wrong-fictional-secret-', 3), '10000000-0000-4000-8000-000000000001', 'fixture-a-180', 180, null, null)$$,
  'P0001', 'FORBIDDEN');
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","is_anonymous":true}', true);
select practice_private.test_expect_error(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-000000000001', 'fixture-a-180', 180, null, null)$$,
  'P0001', 'FORBIDDEN');
select pg_catalog.set_config('request.jwt.claims', '{}', true);
select practice_private.test_expect_error(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-000000000001', 'fixture-a-180', 180, null, null)$$,
  'P0001', 'FORBIDDEN');
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","is_anonymous":false}', true);

do $$
declare v_first jsonb; v_replay jsonb; v_id uuid; v_connected jsonb;
begin
  v_first := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-000000000001', 'fixture-a-180', 180, null, null);
  if v_first ->> 'created' <> 'true' then raise exception 'First acquisition was not created'; end if;
  v_id := (v_first #>> '{session,id}')::uuid;
  perform pg_catalog.set_config('test.session_a', v_id::text, true);
  v_replay := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-000000000001', 'fixture-a-180', 180, null, null);
  if v_replay ->> 'created' <> 'false' or v_replay -> 'session' <> v_first -> 'session' then
    raise exception 'Idempotent replay changed session';
  end if;
  perform public.practice_bind(repeat('fictional-test-capability-', 3), v_id, 'fictional-provider-a');
  v_connected := public.practice_connected(repeat('fictional-test-capability-', 3), v_id);
  if v_connected ->> 'status' <> 'active'
    or public.practice_connected(repeat('fictional-test-capability-', 3), v_id) <> v_connected
    or v_connected ->> 'expires_at' <> v_first #>> '{session,expires_at}' then
    raise exception 'Connected acknowledgement changed expiry or replay';
  end if;
end;
$$;
select practice_private.test_expect_error(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-000000000001', 'changed', 180, null, null)$$,
  'P0001', 'IDEMPOTENCY_CONFLICT');
select practice_private.test_expect_error(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-000000000002', 'fixture-new', 180, null, null)$$,
  'P0001', 'SESSION_ACTIVE');
select practice_private.test_expect_error(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-000000000002', 'fixture-new', 999, null, null)$$,
  'P0001', 'INVALID_INPUT');
select practice_private.test_expect_error(
  $$update public.practice_sessions set provider_conversation_id = 'forged'$$, '42501');
select practice_private.test_expect_error(
  $$delete from public.practice_sessions$$, '42501');
select practice_private.test_expect_error(
  $$insert into public.practice_sessions(owner_id,idempotency_key,request_fingerprint,expires_at)
    values (auth.uid(),gen_random_uuid(),'forged',now()+interval '3 minutes')$$, '42501');
select practice_private.test_expect_error(
  $$select provider_conversation_id from public.practice_sessions$$, '42501');
select practice_private.test_expect_error(
  $$select idempotency_key from public.practice_sessions$$, '42501');
select practice_private.test_expect_error(
  $$select request_fingerprint from public.practice_sessions$$, '42501');
do $$
declare v_id uuid;
begin
  select s.id into v_id
    from public.practice_sessions s
    where s.id = current_setting('test.session_a')::uuid
      and s.owner_id = auth.uid()
      and s.status = 'active'
      and s.created_at is not null
      and s.expires_at is not null
      and s.connected_at is not null
      and s.ended_at is null
      and s.cleanup = 'not_started'
      and s.person_id is null
      and s.person_version is null;
  if v_id is null then raise exception 'Granted session columns were not selectable'; end if;
end;
$$;
select practice_private.test_expect_error(
  $$select * from practice_private.server_capability$$, '42501');
select practice_private.test_expect_error(
  $$select practice_private.require_owner(repeat('fictional-test-capability-', 3))$$, '42501');
-- A private definer helper must not become an authenticated entrypoint.
do $$
begin
  if pg_catalog.has_function_privilege('authenticated', 'practice_private.require_owner(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'practice_private.require_owner(text)', 'EXECUTE') then
    raise exception 'Private identity helper is publicly executable';
  end if;
end;
$$;

-- Second authenticated owner sees no first-owner rows and cannot mutate them.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","is_anonymous":false}', true);
do $$
declare v_acquired jsonb;
begin
  if exists(select id from public.practice_sessions) then raise exception 'Cross-owner SELECT leaked rows'; end if;
  v_acquired := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '20000000-0000-4000-8000-000000000001', 'fixture-b-300', 300, null, null);
  perform pg_catalog.set_config('test.session_b', v_acquired #>> '{session,id}', true);
end;
$$;
select practice_private.test_expect_error(
  $$select public.practice_bind(repeat('fictional-test-capability-', 3), current_setting('test.session_a')::uuid, 'forged')$$,
  'P0001', 'FORBIDDEN');
select practice_private.test_expect_error(
  $$select public.practice_connected(repeat('fictional-test-capability-', 3), current_setting('test.session_a')::uuid)$$,
  'P0001', 'FORBIDDEN');
select practice_private.test_expect_error(
  $$select public.practice_end(repeat('fictional-test-capability-', 3), current_setting('test.session_a')::uuid, 'user')$$,
  'P0001', 'FORBIDDEN');
select practice_private.test_expect_error(
  $$select public.practice_cleanup(repeat('fictional-test-capability-', 3), current_setting('test.session_a')::uuid, 'confirmed')$$,
  'P0001', 'FORBIDDEN');

-- End before provider creation response: late bind retains terminal state.
do $$
declare v_id uuid := current_setting('test.session_b')::uuid; v_ended jsonb; v_late jsonb;
begin
  v_ended := public.practice_end(repeat('fictional-test-capability-', 3), v_id, 'user');
  if v_ended ->> 'status' <> 'ended' or v_ended ->> 'cleanup' <> 'unresolved' then
    raise exception 'Unbound End should retain unresolved cleanup';
  end if;
  v_late := public.practice_bind(repeat('fictional-test-capability-', 3), v_id, 'fictional-provider-b');
  if v_late ->> 'status' <> 'ended' or v_late ->> 'ended_at' <> v_ended ->> 'ended_at' then
    raise exception 'Late bind reactivated session';
  end if;
  perform public.practice_cleanup(repeat('fictional-test-capability-', 3), v_id, 'confirmed');
end;
$$;
select practice_private.test_expect_error(
  $$select public.practice_bind(repeat('fictional-test-capability-', 3), current_setting('test.session_b')::uuid, 'different-id')$$,
  'P0001', 'ASSOCIATION_CONFLICT');
select practice_private.test_expect_error(
  $$select public.practice_cleanup(repeat('fictional-test-capability-', 3), current_setting('test.session_b')::uuid, 'unresolved')$$,
  'P0001', 'INVALID_TRANSITION');

select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","is_anonymous":false}', true);
do $$
declare v_id uuid := current_setting('test.session_a')::uuid; v_ended jsonb; v_expiry jsonb;
begin
  v_ended := public.practice_end(repeat('fictional-test-capability-', 3), v_id, 'user');
  if v_ended ->> 'status' <> 'ended' or v_ended ->> 'cleanup' <> 'pending'
    or public.practice_end(repeat('fictional-test-capability-', 3), v_id, 'connection_failure') <> v_ended then
    raise exception 'Terminal End was not idempotent';
  end if;
  perform public.practice_cleanup(repeat('fictional-test-capability-', 3), v_id, 'confirmed');
  v_expiry := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-000000000002', 'fixture-expiry', 180, null, null);
  perform pg_catalog.set_config('test.session_expiry', v_expiry #>> '{session,id}', true);
end;
$$;
select practice_private.test_expect_error(
  $$select public.practice_connected(repeat('fictional-test-capability-', 3), current_setting('test.session_a')::uuid)$$,
  'P0001', 'SESSION_CLOSED');
select practice_private.test_expect_error(
  $$select public.practice_bind(repeat('fictional-test-capability-', 3), current_setting('test.session_expiry')::uuid, 'fictional-provider-b')$$,
  'P0001', 'ASSOCIATION_CONFLICT');
select public.practice_bind(repeat('fictional-test-capability-', 3),
  current_setting('test.session_expiry')::uuid, 'fictional-provider-expiry');
reset role;
-- Administrator advances only this test fixture's timestamps; no waiting needed.
update public.practice_sessions set created_at = now() - interval '4 minutes',
  expires_at = now() - interval '1 minute'
  where id = current_setting('test.session_expiry')::uuid;
set local role authenticated;
select practice_private.test_expect_error(
  $$select public.practice_connected(repeat('fictional-test-capability-', 3), current_setting('test.session_expiry')::uuid)$$,
  'P0001', 'SESSION_EXPIRED');
do $$
declare v_new jsonb; v_old jsonb; v_replay jsonb;
begin
  v_new := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-000000000003', 'fixture-after-expiry', 180, null, null);
  select jsonb_build_object('status', s.status, 'cleanup', s.cleanup) into v_old
    from public.practice_sessions s
    where s.id = current_setting('test.session_expiry')::uuid;
  if v_new ->> 'created' <> 'true' or v_old ->> 'status' <> 'interrupted'
    or v_old ->> 'cleanup' <> 'pending' then raise exception 'Expired lease was not reconciled'; end if;
  v_replay := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-000000000002', 'fixture-expiry', 180, null, null);
  if v_replay ->> 'created' <> 'false' or v_replay #>> '{session,status}' <> 'interrupted' then
    raise exception 'Expired request replay created another session';
  end if;
  if (select count(id) from public.practice_sessions where status in ('connecting','active','ending')) <> 1 then
    raise exception 'One-active-session invariant failed';
  end if;
end;
$$;
reset role;

-- Verify the executor cannot log in, bypass RLS, or own the protected table.
do $$
declare
  v_column text;
  v_granted text[] := array[
    'id', 'owner_id', 'status', 'created_at', 'expires_at', 'connected_at', 'ended_at',
    'cleanup', 'person_id', 'person_version', 'kind', 'preset'];
  v_hidden text[] := array['idempotency_key', 'request_fingerprint', 'provider_conversation_id'];
begin
  if exists(select 1 from pg_catalog.pg_roles where rolname = 'practice_session_executor'
    and (rolcanlogin or rolbypassrls or rolsuper)) then raise exception 'Executor role is overprivileged'; end if;
  if exists(select 1 from pg_catalog.pg_tables where schemaname = 'public' and tablename = 'practice_sessions'
    and tableowner = 'practice_session_executor') then raise exception 'Executor owns protected table'; end if;
  if not exists (
    select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'practice_private' and p.proname = 'require_owner'
      and p.proowner = 'postgres'::regrole and p.prosecdef
      and 'search_path=""' = any(p.proconfig)
  ) then raise exception 'Identity helper does not have its narrow definer boundary'; end if;
  if (select count(*) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('practice_acquire','practice_bind','practice_connected','practice_end','practice_cleanup')
      and p.proowner = 'practice_session_executor'::regrole and p.prosecdef) <> 5 then
    raise exception 'Public mutation RPCs lost their restricted executor';
  end if;
  if not pg_catalog.has_function_privilege('practice_session_executor', 'practice_private.require_owner(text)', 'EXECUTE')
    or pg_catalog.has_table_privilege('practice_session_executor', 'practice_private.server_capability', 'SELECT') then
    raise exception 'Executor can bypass the private capability verification boundary';
  end if;
  if pg_catalog.has_table_privilege('authenticated', 'public.practice_sessions', 'SELECT') then
    raise exception 'Authenticated still has table-level session select';
  end if;
  if not pg_catalog.has_table_privilege('practice_session_executor', 'public.practice_sessions', 'SELECT')
    or not pg_catalog.has_table_privilege('practice_session_executor', 'public.practice_sessions', 'INSERT')
    or not pg_catalog.has_table_privilege('practice_session_executor', 'public.practice_sessions', 'UPDATE') then
    raise exception 'Executor session grants changed';
  end if;
  foreach v_column in array v_granted loop
    if not pg_catalog.has_column_privilege('authenticated', 'public.practice_sessions', v_column, 'SELECT') then
      raise exception 'Granted session column is not selectable: %', v_column;
    end if;
  end loop;
  foreach v_column in array v_hidden loop
    if pg_catalog.has_column_privilege('authenticated', 'public.practice_sessions', v_column, 'SELECT') then
      raise exception 'Hidden session column is still selectable: %', v_column;
    end if;
  end loop;
  if (
    select pg_catalog.array_agg(a.attname::text order by a.attname)
    from pg_catalog.pg_attribute a
    where a.attrelid = 'public.practice_sessions'::regclass and a.attnum > 0 and not a.attisdropped
  ) is distinct from array[
    'cleanup', 'connected_at', 'created_at', 'ended_at', 'expires_at', 'id', 'idempotency_key',
    'kind', 'owner_id', 'person_id', 'person_version', 'preset', 'provider_conversation_id',
    'request_fingerprint', 'status'
  ]::text[] then
    raise exception 'practice_sessions columns changed; update the authenticated column grant';
  end if;
end;
$$;
select 'session foundation assertions completed; transaction will roll back' as result;
rollback;
