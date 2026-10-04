-- Expects 20261004020000_planned_and_presets.sql either already applied, or prepended
-- after this file's BEGIN in one transaction. Fictional fixtures only; rolls back.
begin;
set local statement_timeout = '20s';

create function practice_private.test_m23_expect(p_sql text, p_state text, p_marker text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_caught boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_state or (p_marker is not null and sqlerrm <> p_marker) then
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
grant execute on function practice_private.test_m23_expect(text, text, text) to authenticated;

insert into auth.users(id, aud, role, is_anonymous) values
  ('00000000-0000-4000-8000-0000000f0a01', 'authenticated', 'authenticated', false),
  ('00000000-0000-4000-8000-0000000f0b01', 'authenticated', 'authenticated', false);

set local role authenticated;

-- Owner A: a person, a preset, a plan with the opt-in guess.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000f0a01","role":"authenticated","is_anonymous":false}', true);
do $$
declare
  v_person jsonb;
  v_preset jsonb;
  v_plan jsonb;
begin
  v_person := public.person_create('Dana', 'Your fictional manager', '{"tone":"warm"}'::jsonb, 'Calm and practical.',
    'Weekly check-ins.', 'Hi, you wanted to talk?', '[]'::jsonb, 'mild_pushback', 'conversational');
  v_preset := public.person_set_preset((v_person ->> 'id')::uuid, (v_person ->> 'version')::integer, 'professor');
  if v_preset ->> 'preset_id' <> 'professor' or (v_preset ->> 'version')::integer <> (v_person ->> 'version')::integer + 1 then
    raise exception 'person_set_preset did not store the preset and bump the version';
  end if;
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.person_set_preset(%L, %s, %L)', v_person ->> 'id', v_person ->> 'version', 'roommate'),
    'P0001', 'VERSION_CONFLICT');
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.person_set_preset(%L, %s, %L)', v_person ->> 'id', v_preset ->> 'version', 'tavus-face-123'),
    'P0001', 'INVALID_INPUT');

  v_plan := public.planned_set((v_person ->> 'id')::uuid, date '2026-10-09', 'Dishes talk', 'She will say I never help', 80::smallint);
  if v_plan ? 'owner_id' or v_plan ->> 'fear' <> 'She will say I never help' then
    raise exception 'planned_set returned the wrong shape';
  end if;
  v_plan := public.planned_checkin((v_plan ->> 'id')::uuid, 'yes', 'It went fine', 30::smallint);
  if v_plan ->> 'checkin' <> 'yes' or (v_plan ->> 'likelihood_after')::integer <> 30 then
    raise exception 'planned_checkin did not store the answer';
  end if;
  v_plan := public.planned_set((v_person ->> 'id')::uuid, date '2026-10-12', null, null, null);
  if v_plan ->> 'checkin' is not null or v_plan ->> 'checkin_note' is not null or v_plan ->> 'likelihood_after' is not null then
    raise exception 'A new day must clear the earlier check-in';
  end if;
  if (select pg_catalog.count(*) from public.planned_conversations) <> 1 then
    raise exception 'One plan per person expected';
  end if;
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.planned_checkin(%L, %L)', v_plan ->> 'id', 'maybe'), 'P0001', 'INVALID_INPUT');
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.planned_set(%L, %L, %L)', v_person ->> 'id', '2026-10-12', repeat('x', 121)), 'P0001', 'INVALID_INPUT');
  perform practice_private.test_m23_expect(
    pg_catalog.format('update public.planned_conversations set label = %L', 'direct'), '42501');
  perform practice_private.test_m23_expect(
    pg_catalog.format('update public.people set preset_id = %L', 'manager'), '42501');
  perform practice_private.test_m23_expect('delete from public.planned_conversations', '42501');
  if (public.person_context((v_person ->> 'id')::uuid, (v_preset ->> 'version')::integer)) ?| array['fear', 'likelihood_before', 'likelihood_after', 'checkin', 'checkin_note', 'preset_id'] then
    raise exception 'person_context must not carry plan or preset fields';
  end if;
  perform pg_catalog.set_config('test.m23.person_a', v_person ->> 'id', true);
  perform pg_catalog.set_config('test.m23.version_a', v_preset ->> 'version', true);
  perform pg_catalog.set_config('test.m23.plan_a', v_plan ->> 'id', true);
end;
$$;

-- Owner B sees nothing of A's and cannot change it.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000f0b01","role":"authenticated","is_anonymous":false}', true);
do $$
begin
  if exists (select 1 from public.planned_conversations) then
    raise exception 'Owner B can read owner A''s plan';
  end if;
  if exists (select 1 from public.people where preset_id is not null) then
    raise exception 'Owner B can read owner A''s person';
  end if;
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.planned_set(%L, %L)', current_setting('test.m23.person_a'), '2026-10-20'), 'P0001', 'NOT_FOUND');
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.planned_checkin(%L, %L)', current_setting('test.m23.plan_a'), 'yes'), 'P0001', 'NOT_FOUND');
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.planned_delete(%L)', current_setting('test.m23.plan_a')), 'P0001', 'NOT_FOUND');
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.person_set_preset(%L, %s, %L)', current_setting('test.m23.person_a'), current_setting('test.m23.version_a'), 'manager'),
    'P0001', 'NOT_FOUND');
  perform practice_private.test_m23_expect(
    pg_catalog.format('insert into public.planned_conversations(owner_id, person_id, planned_on) values (%L, %L, %L)',
      '00000000-0000-4000-8000-0000000f0b01', current_setting('test.m23.person_a'), '2026-10-20'), '42501');
end;
$$;

-- An anonymous session is rejected.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000f0b01","role":"authenticated","is_anonymous":true}', true);
do $$
begin
  perform practice_private.test_m23_expect(
    pg_catalog.format('select public.planned_set(%L, %L)', current_setting('test.m23.person_a'), '2026-10-20'), 'P0001');
end;
$$;

-- Owner A: B's attempts changed nothing; deleting the person removes the plan; delete-all covers plans.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000f0a01","role":"authenticated","is_anonymous":false}', true);
do $$
declare
  v_person jsonb;
  v_result jsonb;
begin
  if (select planned_on from public.planned_conversations where id = current_setting('test.m23.plan_a')::uuid) <> date '2026-10-12' then
    raise exception 'Owner A''s plan changed';
  end if;
  if (select preset_id from public.people where id = current_setting('test.m23.person_a')::uuid) <> 'professor' then
    raise exception 'Owner A''s preset changed';
  end if;
  perform public.person_delete(current_setting('test.m23.person_a')::uuid);
  if exists (select 1 from public.planned_conversations) then
    raise exception 'Deleting a person must remove its plan';
  end if;
  v_person := public.person_create('Sam', 'Your fictional roommate', '{"tone":"warm"}'::jsonb, 'Direct.',
    'Shared flat.', 'Hey.', '[]'::jsonb, 'neutral', 'conversational');
  perform public.planned_set((v_person ->> 'id')::uuid, date '2026-10-15');
  v_result := public.practice_data_delete_all();
  if (v_result #>> '{deleted,planned_conversations}')::integer <> 1 or exists (select 1 from public.planned_conversations) then
    raise exception 'Delete-all must remove plans';
  end if;
end;
$$;

reset role;
do $$
declare
  v_fn text;
begin
  foreach v_fn in array array[
    'public.person_set_preset(uuid, integer, text)', 'public.planned_set(uuid, date, text, text, smallint)',
    'public.planned_checkin(uuid, text, text, smallint)', 'public.planned_delete(uuid)', 'public.practice_data_delete_all()'
  ] loop
    if not exists (
      select 1 from pg_catalog.pg_proc p
      where p.oid = v_fn::regprocedure
        and p.proowner = 'people_executor'::regrole and p.prosecdef and 'search_path=""' = any(p.proconfig)
    ) then
      raise exception '% lost its owner, definer or search_path', v_fn;
    end if;
    if pg_catalog.has_function_privilege('anon', v_fn, 'execute') then
      raise exception 'anon can execute %', v_fn;
    end if;
  end loop;
end;
$$;

select 'planned and presets assertions completed; transaction will roll back' as result;
rollback;
