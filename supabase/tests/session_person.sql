-- Execute as the migration administrator after 20261003220000_session_person.sql.
-- This file does not apply the migration. Fictional fixtures only. The transaction rolls back.
begin;
set local statement_timeout = '20s';

create function practice_private.test_session_person_expect(p_sql text, p_state text, p_marker text default null)
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
grant usage on schema practice_private to authenticated;
grant execute on function practice_private.test_session_person_expect(text, text, text) to authenticated;

insert into auth.users(id, aud, role, is_anonymous) values
  ('00000000-0000-4000-8000-00000000d0a1', 'authenticated', 'authenticated', false),
  ('00000000-0000-4000-8000-00000000d0b1', 'authenticated', 'authenticated', false);
-- An existing real capability, if present, is restored by ROLLBACK.
delete from practice_private.server_capability;
insert into practice_private.server_capability(singleton, secret_hash)
  values (true, extensions.digest(repeat('fictional-test-capability-', 3), 'sha256'));

set local role authenticated;
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000d0a1","role":"authenticated","is_anonymous":false}', true);

do $$
declare v_person jsonb; v_saved jsonb; v_replay jsonb; v_ended jsonb; v_plain jsonb; v_person_id uuid;
begin
  v_person := public.person_create('Sam', 'Your fictional coworker', '{}'::jsonb,
    'STYLE-NOT-ON-SESSION', 'CONTEXT-NOT-ON-SESSION', 'OPENING-NOT-ON-SESSION',
    '[]'::jsonb, 'neutral', 'patient');
  v_person_id := (v_person ->> 'id')::uuid;
  if (v_person ->> 'version')::int <> 1 then raise exception 'New person did not start at version 1'; end if;
  perform pg_catalog.set_config('test.person_id', v_person_id::text, true);

  v_saved := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000d1', 'saved-person-v1', 180, v_person_id, 1);
  if v_saved ->> 'created' <> 'true'
    or v_saved #>> '{session,person_id}' <> v_person_id::text
    or v_saved #>> '{session,person_version}' <> '1' then
    raise exception 'Saved-person acquire did not store id and version';
  end if;
  if v_saved::text like '%STYLE-NOT-ON-SESSION%'
    or v_saved::text like '%CONTEXT-NOT-ON-SESSION%'
    or v_saved::text like '%OPENING-NOT-ON-SESSION%'
    or v_saved::text like '%Sam%' then
    raise exception 'Acquire stored a name or role text';
  end if;
  perform pg_catalog.set_config('test.saved_session', v_saved #>> '{session,id}', true);

  v_replay := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000d1', 'saved-person-v1', 180, v_person_id, 1);
  if v_replay ->> 'created' <> 'false' or v_replay -> 'session' <> v_saved -> 'session' then
    raise exception 'Saved-person replay changed the session';
  end if;

  v_ended := public.practice_end(repeat('fictional-test-capability-', 3),
    (v_saved #>> '{session,id}')::uuid, 'user');
  if v_ended ->> 'person_id' <> v_person_id::text or v_ended ->> 'person_version' <> '1' then
    raise exception 'End cleared person attribution';
  end if;

  -- Preset and reviewed-role starts have no person; both pass null.
  v_plain := public.practice_acquire(repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000d2', 'preset-or-role', 300, null, null);
  if v_plain ->> 'created' <> 'true'
    or v_plain #>> '{session,person_id}' is not null
    or v_plain #>> '{session,person_version}' is not null then
    raise exception 'Preset or role acquire stored a person';
  end if;
  perform public.practice_end(repeat('fictional-test-capability-', 3),
    (v_plain #>> '{session,id}')::uuid, 'user');
end;
$$;

select practice_private.test_session_person_expect(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-0000000000d3', 'half-id', 180, current_setting('test.person_id')::uuid, null)$$,
  'P0001', 'INVALID_INPUT');
select practice_private.test_session_person_expect(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-0000000000d3', 'half-version', 180, null, 1)$$,
  'P0001', 'INVALID_INPUT');
select practice_private.test_session_person_expect(
  $$select public.practice_acquire(repeat('fictional-test-capability-', 3), '10000000-0000-4000-8000-0000000000d3', 'zero-version', 180, current_setting('test.person_id')::uuid, 0)$$,
  'P0001', 'INVALID_INPUT');
select practice_private.test_session_person_expect(
  $$update public.practice_sessions set person_id = null$$, '42501');

-- Owner B cannot read A's session or learn A's person id.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000d0b1","role":"authenticated","is_anonymous":false}', true);
do $$
begin
  if exists (select id from public.practice_sessions) then raise exception 'Cross-owner SELECT leaked session rows'; end if;
  if exists (select 1 from public.people) then raise exception 'Cross-owner SELECT leaked people'; end if;
  if exists (select person_id from public.practice_sessions where person_id is not null) then
    raise exception 'Cross-owner SELECT leaked a person id';
  end if;
end;
$$;

select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-00000000d0a1","role":"authenticated","is_anonymous":false}', true);
do $$
declare v_name text;
begin
  perform public.person_delete(current_setting('test.person_id')::uuid);
  if exists (select 1 from public.people where id = current_setting('test.person_id')::uuid) then
    raise exception 'Person delete left the person row';
  end if;
  if not exists (
    select id from public.practice_sessions
    where id = current_setting('test.saved_session')::uuid
      and person_id = current_setting('test.person_id')::uuid
      and person_version = 1
  ) then raise exception 'Deleting the person removed or changed the session'; end if;
  select p.name into v_name
    from public.practice_sessions s
    left join public.people p on p.id = s.person_id and p.owner_id = s.owner_id
    where s.id = current_setting('test.saved_session')::uuid;
  if v_name is not null then raise exception 'Deleted person still resolved a name'; end if;
end;
$$;
reset role;

do $$
declare v_now timestamptz := pg_catalog.clock_timestamp();
begin
  begin
    insert into public.practice_sessions(owner_id, idempotency_key, request_fingerprint, created_at, expires_at, person_id)
      values ('00000000-0000-4000-8000-00000000d0a1', '30000000-0000-4000-8000-0000000000d8', 'half-id',
        v_now, v_now + interval '3 minutes', '00000000-0000-4000-8000-00000000d0c1');
    raise exception 'Person id without version was stored';
  exception when check_violation then null;
  end;
  begin
    insert into public.practice_sessions(owner_id, idempotency_key, request_fingerprint, created_at, expires_at, person_version)
      values ('00000000-0000-4000-8000-00000000d0a1', '30000000-0000-4000-8000-0000000000d9', 'half-version',
        v_now, v_now + interval '3 minutes', 1);
    raise exception 'Person version without id was stored';
  exception when check_violation then null;
  end;
  if (select count(*) from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'practice_acquire') <> 1 then
    raise exception 'practice_acquire should have exactly one signature';
  end if;
  if exists (
    select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'practice_acquire'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) in (
        'p_secret text, p_key uuid, p_fingerprint text, p_duration integer',
        'p_secret text, p_key uuid, p_fingerprint text, p_duration integer, p_person_id uuid, p_person_version integer'
      )
  ) then raise exception 'Old practice_acquire signature still exists'; end if;
  if not exists (
    select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'practice_acquire'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) = 'p_secret text, p_key uuid, p_fingerprint text, p_duration integer, p_person_id uuid, p_person_version integer, p_kind text, p_preset text'
      and p.proowner = 'practice_session_executor'::regrole and p.prosecdef
      and 'search_path=""' = any(p.proconfig)
  ) then raise exception 'New practice_acquire is not the restricted executor function'; end if;
  if exists (
    select 1 from pg_catalog.pg_constraint c
    where c.conrelid = 'public.practice_sessions'::regclass and c.contype = 'f'
      and pg_catalog.pg_get_constraintdef(c.oid) ilike '%person%'
  ) then raise exception 'Session person columns must not reference people'; end if;
  -- supabase_admin grants this role to postgres (same as people_executor). The boundary
  -- is that the executor cannot log in, bypass RLS, or be superuser.
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'practice_session_executor' and (rolcanlogin or rolbypassrls or rolsuper)) then
    raise exception 'practice_session_executor is overprivileged';
  end if;
  if pg_catalog.has_table_privilege('authenticated', 'public.practice_sessions', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.practice_sessions', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.practice_sessions', 'DELETE') then
    raise exception 'Authenticated direct session DML is still granted';
  end if;
end;
$$;

select 'session person assertions completed; transaction will roll back' as result;
rollback;
