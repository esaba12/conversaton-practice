-- Expects 20261004010000_person_situations.sql either already applied, or prepended
-- after this file's BEGIN in one transaction. For pre-apply review, concatenate:
--   this BEGIN; + the migration without its own BEGIN/COMMIT + this test body without its BEGIN + this ROLLBACK;
-- Fictional fixtures only. Nothing in this file calls a provider or remote service.
begin;
set local statement_timeout = '20s';

create function practice_private.test_person_situations_expect(
  p_sql text,
  p_state text,
  p_marker text default null
)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_caught boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_state
      or (p_marker is not null and sqlerrm <> p_marker) then
      raise;
    end if;
    v_caught := true;
  end;
  if not v_caught then
    raise exception 'Expected rejection: %', p_sql;
  end if;
end;
$$;

grant usage on schema practice_private to authenticated;
grant execute on function practice_private.test_person_situations_expect(text, text, text)
  to authenticated;

insert into auth.users(id, aud, role, is_anonymous) values
  ('00000000-0000-4000-8000-0000000e0a01', 'authenticated', 'authenticated', false),
  ('00000000-0000-4000-8000-0000000e0b01', 'authenticated', 'authenticated', false);

-- An existing capability, if present, is restored by ROLLBACK.
delete from practice_private.server_capability;
insert into practice_private.server_capability(singleton, secret_hash)
values (true, extensions.digest(repeat('fictional-test-capability-', 3), 'sha256'));

set local role authenticated;
select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000e0a01","role":"authenticated","is_anonymous":false}',
  true
);

-- Calling person_create with the pre-M1 argument list remains valid. Its fallback is
-- the same expression used to backfill pre-existing rows.
do $$
declare
  v_person jsonb;
  v_long_context text := repeat('context-', 100);
begin
  v_person := public.person_create(
    'Dana',
    'Your fictional manager',
    '{"tone":"warm"}'::jsonb,
    'Calm and practical.',
    v_long_context,
    'Hi, you wanted to talk?',
    '[]'::jsonb,
    'mild_pushback',
    'conversational'
  );
  if v_person ->> 'background' <> pg_catalog.left(v_long_context, 600) then
    raise exception 'Old-signature create did not preserve the background fallback';
  end if;
  if pg_catalog.char_length(v_person ->> 'background') <> 600 then
    raise exception 'Background fallback was not capped at 600 characters';
  end if;
  perform pg_catalog.set_config('test.m1.person_a', v_person ->> 'id', true);
end;
$$;

select public.private_prep_put('PRIVATE PREP MUST NEVER ENTER PERSON CONTEXT');

do $$
declare
  v_person_id uuid := current_setting('test.m1.person_a')::uuid;
  v_before integer;
  v_after integer;
  v_created jsonb;
  v_list jsonb;
  v_context jsonb;
begin
  select version into v_before
  from public.people
  where id = v_person_id;

  for i in 1..5 loop
    v_created := public.person_situation_create(
      v_person_id,
      'Situation ' || i,
      pg_catalog.jsonb_build_object(
        'publicContext', 'Situation context ' || i,
        'opening', 'Opening ' || i,
        'constraints', '[]'::jsonb,
        'challenge', 'neutral',
        'pace', 'conversational'
      )
    );
    if i = 1 then
      perform pg_catalog.set_config('test.m1.situation_a', v_created ->> 'id', true);
    end if;
  end loop;

  select version into v_after
  from public.people
  where id = v_person_id;
  if v_after <> v_before then
    raise exception 'Creating situations changed people.version';
  end if;

  v_list := public.person_situation_list(v_person_id);
  if pg_catalog.jsonb_array_length(v_list) <> 5
    or v_list #>> '{0,label}' <> 'Situation 5'
    or v_list #>> '{4,label}' <> 'Situation 1' then
    raise exception 'Situation list was not capped and newest-first: %', v_list;
  end if;

  v_context := public.person_context(v_person_id, v_before);
  if v_context ->> 'background' <> pg_catalog.left(repeat('context-', 100), 600) then
    raise exception 'person_context omitted background';
  end if;
  if v_context::text like '%PRIVATE PREP%' then
    raise exception 'person_context leaked private prep';
  end if;
end;
$$;

select practice_private.test_person_situations_expect(
  $$select public.person_situation_create(
    current_setting('test.m1.person_a')::uuid,
    'One too many',
    '{"publicContext":"cap fixture"}'::jsonb
  )$$,
  'P0001',
  'LIMIT_REACHED'
);

select practice_private.test_person_situations_expect(
  $$insert into public.person_situations(owner_id, person_id, label, situation)
    values (
      auth.uid(),
      current_setting('test.m1.person_a')::uuid,
      'direct',
      '{}'::jsonb
    )$$,
  '42501'
);
select practice_private.test_person_situations_expect(
  $$update public.person_situations set label = 'direct update'$$,
  '42501'
);
select practice_private.test_person_situations_expect(
  $$delete from public.person_situations$$,
  '42501'
);

-- A null trailing background on update preserves the existing value.
do $$
declare
  v_id uuid := current_setting('test.m1.person_a')::uuid;
  v_before text;
  v_updated jsonb;
begin
  select background into v_before from public.people where id = v_id;
  v_updated := public.person_update(
    v_id,
    1,
    'Dana',
    'Your fictional manager',
    '{"tone":"warm"}'::jsonb,
    'Calm and practical.',
    repeat('context-', 100),
    'Hi, you wanted to talk?',
    '[]'::jsonb,
    'mild_pushback',
    'conversational'
  );
  if v_updated ->> 'background' <> v_before
    or (v_updated ->> 'version')::integer <> 2 then
    raise exception 'Null/default update background did not preserve the stored value';
  end if;
end;
$$;

-- Owner B sees no A rows and receives indistinguishable NOT_FOUND errors for A ids.
select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000e0b01","role":"authenticated","is_anonymous":false}',
  true
);
do $$
begin
  if exists (select 1 from public.person_situations) then
    raise exception 'Cross-owner direct read leaked situations';
  end if;
end;
$$;
select practice_private.test_person_situations_expect(
  $$select public.person_situation_list(current_setting('test.m1.person_a')::uuid)$$,
  'P0001',
  'NOT_FOUND'
);
select practice_private.test_person_situations_expect(
  $$select public.person_situation_create(
    current_setting('test.m1.person_a')::uuid,
    'foreign',
    '{}'::jsonb
  )$$,
  'P0001',
  'NOT_FOUND'
);
select practice_private.test_person_situations_expect(
  $$select public.person_situation_delete(current_setting('test.m1.situation_a')::uuid)$$,
  'P0001',
  'NOT_FOUND'
);

-- B's ended practice must never appear in A's history.
do $$
declare
  v_session jsonb;
begin
  v_session := public.practice_acquire(
    repeat('fictional-test-capability-', 3),
    '20000000-0000-4000-8000-0000000000e1',
    'owner-b-manager',
    180,
    null,
    null,
    'practice',
    'manager'
  );
  perform public.practice_end(
    repeat('fictional-test-capability-', 3),
    (v_session #>> '{session,id}')::uuid,
    'user'
  );
end;
$$;

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000e0a01","role":"authenticated","is_anonymous":false}',
  true
);

-- Person-delete cascade removes situations and does not affect a different person's version.
do $$
declare
  v_person jsonb;
  v_person_id uuid;
  v_version integer;
  v_bad text;
begin
  v_person := public.person_create(
    'Cascade',
    'Your fictional neighbor',
    '{}'::jsonb,
    'Brief.',
    'Lives next door.',
    'Hey.',
    '[]'::jsonb,
    'supportive',
    'patient',
    'A saved background.'
  );
  v_person_id := (v_person ->> 'id')::uuid;
  -- Stored situations are shape-checked like situationSchema: unknown keys and long chips are rejected.
  foreach v_bad in array array['{"goal":"private"}', '{"wants":"this stance chip is far longer than forty characters"}', '{"pace":"fast"}'] loop
    begin
      perform public.person_situation_create(v_person_id, 'bad', v_bad::jsonb);
      raise exception 'Invalid situation was stored: %', v_bad;
    exception when sqlstate 'P0001' then
      if sqlerrm <> 'INVALID_INPUT' then raise; end if;
    end;
  end loop;
  perform public.person_situation_create(v_person_id, 'Cascade situation', '{"wants":"Keep the launch on track","pace":"patient"}'::jsonb);
  v_version := (v_person ->> 'version')::integer;
  perform public.person_delete(v_person_id);
  if exists (
    select 1 from public.person_situations where person_id = v_person_id
  ) then
    raise exception 'Person delete did not cascade to situations';
  end if;
  if (select version from public.people where id = current_setting('test.m1.person_a')::uuid) <> 2 then
    raise exception 'Unrelated situation cascade changed people.version';
  end if;
end;
$$;

-- Session metadata, validation, defaults, and practice history.
do $$
declare
  v_person_id uuid := current_setting('test.m1.person_a')::uuid;
  v_person_session jsonb;
  v_stand_in jsonb;
  v_preset_session jsonb;
  v_interrupted jsonb;
  v_history jsonb;
begin
  -- Existing six-argument callers still resolve and default kind/preset.
  v_person_session := public.practice_acquire(
    repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000e1',
    'owner-a-person-practice',
    180,
    v_person_id,
    2
  );
  if v_person_session #>> '{session,kind}' <> 'practice'
    or v_person_session #> '{session,preset}' <> 'null'::jsonb then
    raise exception 'Acquire defaults did not preserve existing callers';
  end if;
  perform public.practice_end(
    repeat('fictional-test-capability-', 3),
    (v_person_session #>> '{session,id}')::uuid,
    'user'
  );

  v_stand_in := public.practice_acquire(
    repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000e2',
    'owner-a-stand-in-manager',
    180,
    null,
    null,
    'stand_in',
    'manager'
  );
  if v_stand_in #>> '{session,kind}' <> 'stand_in'
    or v_stand_in #>> '{session,preset}' <> 'manager' then
    raise exception 'Stand-in acquire did not store kind and preset';
  end if;
  perform public.practice_end(
    repeat('fictional-test-capability-', 3),
    (v_stand_in #>> '{session,id}')::uuid,
    'user'
  );

  v_preset_session := public.practice_acquire(
    repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000e3',
    'owner-a-practice-roommate',
    180,
    null,
    null,
    'practice',
    'roommate'
  );
  perform public.practice_end(
    repeat('fictional-test-capability-', 3),
    (v_preset_session #>> '{session,id}')::uuid,
    'user'
  );

  v_interrupted := public.practice_acquire(
    repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000e4',
    'owner-a-interrupted-professor',
    180,
    null,
    null,
    'practice',
    'professor'
  );
  perform public.practice_end(
    repeat('fictional-test-capability-', 3),
    (v_interrupted #>> '{session,id}')::uuid,
    'connection_failure'
  );

  v_history := public.practice_history();
  if not (v_history -> 'person_ids' ? v_person_id::text)
    or pg_catalog.jsonb_array_length(v_history -> 'person_ids') <> 1 then
    raise exception 'History did not return exactly A''s ended practice person: %', v_history;
  end if;
  if not (v_history -> 'presets' ? 'roommate')
    or v_history -> 'presets' ? 'manager'
    or v_history -> 'presets' ? 'professor'
    or pg_catalog.jsonb_array_length(v_history -> 'presets') <> 1 then
    raise exception 'History included stand-in, interrupted, or another-owner presets: %', v_history;
  end if;
end;
$$;

select practice_private.test_person_situations_expect(
  $$select public.practice_acquire(
    repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000e5',
    'invalid-kind',
    180,
    null,
    null,
    'invalid',
    null
  )$$,
  'P0001',
  'INVALID_INPUT'
);
select practice_private.test_person_situations_expect(
  $$select public.practice_acquire(
    repeat('fictional-test-capability-', 3),
    '10000000-0000-4000-8000-0000000000e6',
    'invalid-preset',
    180,
    null,
    null,
    'practice',
    'stranger'
  )$$,
  'P0001',
  'INVALID_INPUT'
);

-- The atomic delete-all entrypoint includes person_situations and leaves session metadata.
do $$
declare
  v_deleted jsonb;
begin
  if not exists (select 1 from public.person_situations) then
    raise exception 'Delete-all fixture had no situations';
  end if;
  v_deleted := public.practice_data_delete_all();
  if (v_deleted #>> '{deleted,person_situations}')::integer <> 5
    or exists (select 1 from public.person_situations)
    or exists (select 1 from public.people)
    or exists (select 1 from public.private_prep) then
    raise exception 'Delete-all did not remove owner practice data: %', v_deleted;
  end if;
  if not exists (select id from public.practice_sessions) then
    raise exception 'Delete-all unexpectedly removed session metadata';
  end if;
end;
$$;

reset role;

-- Static privilege and signature assertions run as the migration administrator.
do $$
declare
  v_column text;
begin
  if pg_catalog.has_table_privilege('authenticated', 'public.person_situations', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.person_situations', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.person_situations', 'DELETE') then
    raise exception 'Authenticated direct situation DML is granted';
  end if;
  foreach v_column in array array['kind', 'preset'] loop
    if not pg_catalog.has_column_privilege(
      'authenticated',
      'public.practice_sessions',
      v_column,
      'SELECT'
    ) then
      raise exception 'FIX-02 grant omitted session column: %', v_column;
    end if;
  end loop;
  if (select pg_catalog.count(*)
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'practice_acquire') <> 1 then
    raise exception 'practice_acquire should have exactly one signature';
  end if;
  if not exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'practice_acquire'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) =
        'p_secret text, p_key uuid, p_fingerprint text, p_duration integer, p_person_id uuid, p_person_version integer, p_kind text, p_preset text'
      and p.proowner = 'practice_session_executor'::regrole
      and p.prosecdef
      and 'search_path=""' = any(p.proconfig)
  ) then
    raise exception 'practice_acquire lost its restricted signature or owner';
  end if;
  if not exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'person_create'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) =
        'p_name text, p_relationship text, p_traits jsonb, p_style text, p_public_context text, p_opening text, p_constraints jsonb, p_challenge text, p_pace text, p_background text'
      and p.proowner = 'people_executor'::regrole
      and p.prosecdef
      and 'search_path=""' = any(p.proconfig)
  ) then
    raise exception 'person_create lost its background signature or owner';
  end if;
end;
$$;

select 'person situations assertions completed; transaction will roll back' as result;
rollback;
