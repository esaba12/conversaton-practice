-- Execute as the migration administrator after applying 20261003211000_people_sharing.sql.
-- Fictional fixtures only; everything is rolled back. Simulates JWT claims inside one transaction;
-- does not exercise HTTP token validation or concurrent connections.
begin;
set local statement_timeout = '20s';

create function practice_private.test_people_expect(p_sql text, p_state text, p_marker text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_caught boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_state or (p_marker is not null and sqlerrm <> p_marker) then raise; end if;
    v_caught := true;
  end;
  if not v_caught then raise exception 'Expected rejection: %', p_sql; end if;
end;
$$;
grant usage on schema practice_private to authenticated, anon;
grant execute on function practice_private.test_people_expect(text, text, text) to authenticated, anon;

insert into auth.users(id, aud, role, is_anonymous) values
  ('00000000-0000-4000-8000-0000000c0a01', 'authenticated', 'authenticated', false),
  ('00000000-0000-4000-8000-0000000c0b01', 'authenticated', 'authenticated', false);

-- Owner A: two facts, private prep, one person sharing exactly one fact.
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000c0a01","role":"authenticated","is_anonymous":false}', true);
do $$
declare v_shared jsonb; v_unshared jsonb; v_person jsonb; v_linked jsonb;
begin
  v_shared := public.about_me_create('  I joined the team in June (shared fixture)  ');
  if v_shared ->> 'text' <> 'I joined the team in June (shared fixture)' then raise exception 'Fact text not trimmed'; end if;
  v_unshared := public.about_me_create('I am vegetarian (unshared fixture)');
  perform public.private_prep_put('PRIVATE PREP FIXTURE: I fear sounding rude');
  v_person := public.person_create('Dana', 'Your fictional manager', '{"tone":"warm","formality":"formal"}'::jsonb,
    'Calm, asks clarifying questions.', 'You manage a small team.', 'Hi, you wanted to talk?',
    '["Has ten minutes."]'::jsonb, 'neutral', 'patient');
  if (v_person ->> 'version')::int <> 1 or v_person -> 'shared_fact_ids' <> '[]'::jsonb then raise exception 'New person shape'; end if;
  v_linked := public.person_set_shared_facts((v_person ->> 'id')::uuid, 1, array[(v_shared ->> 'id')::uuid]);
  if (v_linked ->> 'version')::int <> 2 or v_linked -> 'shared_fact_ids' <> pg_catalog.jsonb_build_array(v_shared ->> 'id') then
    raise exception 'Sharing did not bump version or link exactly one fact';
  end if;
  perform pg_catalog.set_config('test.person_a', v_person ->> 'id', true);
  perform pg_catalog.set_config('test.fact_shared', v_shared ->> 'id', true);
  perform pg_catalog.set_config('test.fact_unshared', v_unshared ->> 'id', true);
end;
$$;

-- Context path: exactly the shared fact; never the unshared fact or private prep.
do $$
declare v_context jsonb;
begin
  v_context := public.person_context(current_setting('test.person_a')::uuid, 2);
  if v_context -> 'known_about_user' <> '["I joined the team in June (shared fixture)"]'::jsonb then
    raise exception 'Context did not contain exactly the shared fact: %', v_context -> 'known_about_user';
  end if;
  if v_context::text like '%unshared fixture%' or v_context::text like '%PRIVATE PREP FIXTURE%' then
    raise exception 'Context leaked unshared fact or private prep';
  end if;
  if v_context -> 'traits' <> '{"tone":"warm","formality":"formal"}'::jsonb then raise exception 'Context traits'; end if;
end;
$$;

-- Stale versions return VERSION_CONFLICT without a partial write.
select practice_private.test_people_expect(
  $$select public.person_context(current_setting('test.person_a')::uuid, 1)$$, 'P0001', 'VERSION_CONFLICT');
select practice_private.test_people_expect(
  $$select public.person_update(current_setting('test.person_a')::uuid, 1, 'Changed', 'r', '{}'::jsonb, 's', 'c', 'o', '[]'::jsonb, 'neutral', 'patient')$$,
  'P0001', 'VERSION_CONFLICT');
select practice_private.test_people_expect(
  $$select public.person_set_shared_facts(current_setting('test.person_a')::uuid, 1, array[current_setting('test.fact_shared')::uuid, current_setting('test.fact_unshared')::uuid])$$,
  'P0001', 'VERSION_CONFLICT');
do $$
begin
  if (select name from public.people where id = current_setting('test.person_a')::uuid) <> 'Dana'
    or (select version from public.people where id = current_setting('test.person_a')::uuid) <> 2
    or (select pg_catalog.count(*) from public.person_shared_facts) <> 1 then
    raise exception 'Stale write changed data';
  end if;
end;
$$;

-- Validation and direct-write denial.
select practice_private.test_people_expect(
  $$select public.person_create('X', 'r', '{"tone":"furious"}'::jsonb, 's', 'c', 'o', '[]'::jsonb, 'neutral', 'patient')$$, 'P0001', 'INVALID_INPUT');
select practice_private.test_people_expect(
  $$select public.person_create('X', 'r', '{"confidence":"90%"}'::jsonb, 's', 'c', 'o', '[]'::jsonb, 'neutral', 'patient')$$, 'P0001', 'INVALID_INPUT');
select practice_private.test_people_expect(
  $$select public.person_create('X', 'r', '{}'::jsonb, 's', 'c', 'o', '["1","2","3","4","5","6"]'::jsonb, 'neutral', 'patient')$$, 'P0001', 'INVALID_INPUT');
select practice_private.test_people_expect($$select public.about_me_create('   ')$$, 'P0001', 'INVALID_INPUT');
select practice_private.test_people_expect($$select public.about_me_create(repeat('x', 121))$$, 'P0001', 'INVALID_INPUT');
select practice_private.test_people_expect(
  $$select public.person_set_shared_facts(current_setting('test.person_a')::uuid, 2, array[current_setting('test.fact_shared')::uuid, current_setting('test.fact_shared')::uuid])$$,
  'P0001', 'INVALID_INPUT');
select practice_private.test_people_expect(
  $$insert into public.about_me_facts(owner_id, text) values (auth.uid(), 'direct')$$, '42501');
select practice_private.test_people_expect(
  $$update public.people set version = 99$$, '42501');
select practice_private.test_people_expect(
  $$insert into public.person_shared_facts(owner_id, person_id, fact_id) values (auth.uid(), current_setting('test.person_a')::uuid, current_setting('test.fact_unshared')::uuid)$$, '42501');
select practice_private.test_people_expect($$delete from public.private_prep$$, '42501');
select practice_private.test_people_expect($$select practice_private.require_user()$$, '42501');

-- Owner B sees nothing of A and cannot read, edit, share into, delete or build context from A's records.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000c0b01","role":"authenticated","is_anonymous":false}', true);
do $$
declare v_fact jsonb; v_person jsonb;
begin
  if exists (select 1 from public.people) or exists (select 1 from public.about_me_facts)
    or exists (select 1 from public.person_shared_facts) or exists (select 1 from public.private_prep) then
    raise exception 'Cross-owner SELECT leaked rows';
  end if;
  v_fact := public.about_me_create('Owner B fixture fact');
  v_person := public.person_create('Sam', 'Your fictional neighbor', '{}'::jsonb, 'Brief.', 'You live next door.', 'Hey.', '[]'::jsonb, 'supportive', 'conversational');
  perform pg_catalog.set_config('test.fact_b', v_fact ->> 'id', true);
  perform pg_catalog.set_config('test.person_b', v_person ->> 'id', true);
end;
$$;
select practice_private.test_people_expect(
  $$select public.person_context(current_setting('test.person_a')::uuid, 2)$$, 'P0001', 'NOT_FOUND');
select practice_private.test_people_expect(
  $$select public.person_update(current_setting('test.person_a')::uuid, 2, 'Hijack', 'r', '{}'::jsonb, 's', 'c', 'o', '[]'::jsonb, 'neutral', 'patient')$$,
  'P0001', 'NOT_FOUND');
select practice_private.test_people_expect(
  $$select public.person_set_shared_facts(current_setting('test.person_a')::uuid, 2, array[current_setting('test.fact_b')::uuid])$$, 'P0001', 'NOT_FOUND');
select practice_private.test_people_expect(
  $$select public.person_delete(current_setting('test.person_a')::uuid)$$, 'P0001', 'NOT_FOUND');
select practice_private.test_people_expect(
  $$select public.about_me_update(current_setting('test.fact_shared')::uuid, 'hijack')$$, 'P0001', 'NOT_FOUND');
select practice_private.test_people_expect(
  $$select public.about_me_delete(current_setting('test.fact_unshared')::uuid)$$, 'P0001', 'NOT_FOUND');
-- Cross-owner sharing: B cannot share A's fact into B's own person.
select practice_private.test_people_expect(
  $$select public.person_set_shared_facts(current_setting('test.person_b')::uuid, 1, array[current_setting('test.fact_shared')::uuid])$$, 'P0001', 'INVALID_INPUT');
do $$
begin
  if (select pg_catalog.jsonb_array_length(public.person_context(current_setting('test.person_b')::uuid, 1) -> 'known_about_user')) <> 0
    or (select version from public.people where id = current_setting('test.person_b')::uuid) <> 1 then
    raise exception 'Rejected cross-owner share changed B';
  end if;
  if (select pg_catalog.jsonb_build_object('notes', notes) from public.private_prep) is not null then
    raise exception 'B can read private prep';
  end if;
end;
$$;

-- A cannot share B's fact either; A's links are unchanged.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000c0a01","role":"authenticated","is_anonymous":false}', true);
select practice_private.test_people_expect(
  $$select public.person_set_shared_facts(current_setting('test.person_a')::uuid, 2, array[current_setting('test.fact_shared')::uuid, current_setting('test.fact_b')::uuid])$$,
  'P0001', 'INVALID_INPUT');
do $$
declare v_updated jsonb;
begin
  if (select pg_catalog.count(*) from public.person_shared_facts) <> 1
    or (select version from public.people where id = current_setting('test.person_a')::uuid) <> 2 then
    raise exception 'Rejected foreign share changed A';
  end if;
  -- Editing a shared fact changes what Dana knows, so her version bumps.
  perform public.about_me_update(current_setting('test.fact_shared')::uuid, 'I joined the team in June (edited fixture)');
  if (select version from public.people where id = current_setting('test.person_a')::uuid) <> 3 then raise exception 'Shared fact edit did not bump version'; end if;
  v_updated := public.person_update(current_setting('test.person_a')::uuid, 3, 'Dana', 'Your fictional manager',
    '{"tone":"warm","formality":"casual"}'::jsonb, 'Calm.', 'You manage a small team.', 'Hi!', '[]'::jsonb, 'neutral', 'patient');
  if (v_updated ->> 'version')::int <> 4 or v_updated #>> '{traits,formality}' <> 'casual'
    or pg_catalog.jsonb_array_length(v_updated -> 'shared_fact_ids') <> 1 then raise exception 'Version-checked update'; end if;
  -- Deleting a shared fact removes the link and bumps the person.
  perform public.about_me_delete(current_setting('test.fact_shared')::uuid);
  if (select version from public.people where id = current_setting('test.person_a')::uuid) <> 5
    or public.person_context(current_setting('test.person_a')::uuid, 5) -> 'known_about_user' <> '[]'::jsonb then
    raise exception 'Fact deletion did not cascade or bump';
  end if;
  -- Cap of 30 facts per owner (A has 1 left).
  for i in 1..29 loop perform public.about_me_create('Cap fixture ' || i); end loop;
end;
$$;
select practice_private.test_people_expect($$select public.about_me_create('One too many')$$, 'P0001', 'LIMIT_REACHED');

-- Anonymous identities and the anon role are rejected.
select pg_catalog.set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000c0a01","role":"authenticated","is_anonymous":true}', true);
select practice_private.test_people_expect($$select public.about_me_create('anon fixture')$$, 'P0001', 'FORBIDDEN');
select practice_private.test_people_expect(
  $$select public.person_context(current_setting('test.person_a')::uuid, 5)$$, 'P0001', 'FORBIDDEN');
reset role;
set local role anon;
select practice_private.test_people_expect($$select public.about_me_create('anon role fixture')$$, '42501');
select practice_private.test_people_expect($$select * from public.people$$, '42501');
reset role;

-- Composite keys block a cross-owner link even for the administrator.
select practice_private.test_people_expect(
  $$insert into public.person_shared_facts(owner_id, person_id, fact_id) values ('00000000-0000-4000-8000-0000000c0a01', current_setting('test.person_a')::uuid, current_setting('test.fact_b')::uuid)$$,
  '23503');

-- Privilege shape and the context-path boundary.
do $$
begin
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'people_executor' and (rolcanlogin or rolbypassrls or rolsuper)) then
    raise exception 'people_executor is overprivileged';
  end if;
  if pg_catalog.has_table_privilege('authenticated', 'public.people', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.people', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.person_shared_facts', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.about_me_facts', 'DELETE')
    or pg_catalog.has_table_privilege('anon', 'public.private_prep', 'SELECT')
    or pg_catalog.has_function_privilege('authenticated', 'practice_private.require_user()', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.person_context(uuid, integer)', 'EXECUTE') then
    raise exception 'Unexpected direct privilege';
  end if;
  if (select pg_catalog.count(*) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proowner = 'people_executor'::regrole and p.prosecdef
        and 'search_path=""' = any(p.proconfig)) <> 11 then
    raise exception 'Mutation RPCs lost their restricted executor';
  end if;
  if exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'person_context' and (p.prosecdef or p.prosrc ilike '%private_prep%')) then
    raise exception 'Context path can read private prep or bypass RLS';
  end if;
  if not exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'practice_private' and p.proname = 'require_user' and p.proowner = 'postgres'::regrole and p.prosecdef) then
    raise exception 'Identity helper boundary';
  end if;
end;
$$;
select 'people sharing assertions completed; transaction will roll back' as result;
rollback;
