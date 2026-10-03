-- G3 saved people, About-me facts, per-person sharing and private prep (docs/26).
-- Owner RLS on every table; authenticated users read their own rows and write only through
-- version-checked RPCs owned by a restricted NOLOGIN/NOBYPASSRLS executor. No service-role runtime.
-- Executor function bodies never name the auth schema (managed Supabase cannot delegate its USAGE);
-- identity comes from the postgres-owned private helper, and policies reference auth helpers by OID.
begin;

create role people_executor nologin noinherit nobypassrls;
grant people_executor to postgres;
grant usage on schema public, practice_private to people_executor;
-- Ownership transfer requires CREATE temporarily; removed before commit.
grant create on schema public to people_executor;
grant execute on function auth.uid(), auth.jwt() to people_executor;

create function practice_private.require_user()
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := auth.uid();
begin
  if v_owner is null or (auth.jwt() ->> 'is_anonymous') is distinct from 'false' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  -- Serializes one owner's people/fact writes so caps and version checks are race-free.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('people:' || v_owner::text, 0));
  return v_owner;
end;
$$;
revoke all on function practice_private.require_user() from public, anon, authenticated;
grant execute on function practice_private.require_user() to people_executor;

create function practice_private.valid_traits(p jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select p is not null and pg_catalog.jsonb_typeof(p) = 'object' and not exists (
    select 1 from pg_catalog.jsonb_each(p) as e(key, value)
    where pg_catalog.jsonb_typeof(e.value) <> 'string' or not (case e.key
      when 'tone' then (e.value #>> '{}') in ('warm', 'neutral', 'blunt')
      when 'formality' then (e.value #>> '{}') in ('casual', 'professional', 'formal')
      when 'talkativeness' then (e.value #>> '{}') in ('brief', 'balanced', 'chatty')
      when 'familiarity' then (e.value #>> '{}') in ('stranger', 'acquaintance', 'close')
      else false end))
$$;
create function practice_private.valid_constraints(p jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select p is not null and pg_catalog.jsonb_typeof(p) = 'array' and pg_catalog.jsonb_array_length(p) <= 5
    and not exists (
      select 1 from pg_catalog.jsonb_array_elements(p) as e(value)
      where pg_catalog.jsonb_typeof(e.value) <> 'string'
        or pg_catalog.char_length(pg_catalog.btrim(e.value #>> '{}')) not between 1 and 200)
$$;
revoke all on function practice_private.valid_traits(jsonb), practice_private.valid_constraints(jsonb) from public, anon, authenticated;
grant execute on function practice_private.valid_traits(jsonb), practice_private.valid_constraints(jsonb) to people_executor;

create table public.about_me_facts (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (pg_catalog.char_length(pg_catalog.btrim(text)) between 1 and 120),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (id, owner_id)
);
create index about_me_facts_owner on public.about_me_facts(owner_id, created_at);

create table public.people (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1 check (version >= 1),
  name text not null check (pg_catalog.char_length(pg_catalog.btrim(name)) between 1 and 60),
  relationship text not null check (pg_catalog.char_length(pg_catalog.btrim(relationship)) between 1 and 120),
  traits jsonb not null default '{}'::jsonb check (practice_private.valid_traits(traits)),
  style text not null check (pg_catalog.char_length(pg_catalog.btrim(style)) between 1 and 300),
  public_context text not null check (pg_catalog.char_length(pg_catalog.btrim(public_context)) between 1 and 1500),
  opening text not null check (pg_catalog.char_length(pg_catalog.btrim(opening)) between 1 and 300),
  constraints jsonb not null default '[]'::jsonb check (practice_private.valid_constraints(constraints)),
  challenge text not null check (challenge in ('supportive', 'neutral', 'mild_pushback')),
  pace text not null check (pace in ('patient', 'conversational')),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (id, owner_id)
);
create index people_owner on public.people(owner_id, updated_at desc);

-- Composite foreign keys make cross-owner links structurally impossible.
create table public.person_shared_facts (
  owner_id uuid not null,
  person_id uuid not null,
  fact_id uuid not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (person_id, fact_id),
  foreign key (person_id, owner_id) references public.people(id, owner_id) on delete cascade,
  foreign key (fact_id, owner_id) references public.about_me_facts(id, owner_id) on delete cascade
);
create index person_shared_facts_fact on public.person_shared_facts(fact_id);

-- Never joined to people and never read by the context path.
create table public.private_prep (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  notes text not null check (pg_catalog.char_length(notes) between 1 and 1000),
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);

alter table public.about_me_facts enable row level security;
alter table public.about_me_facts force row level security;
alter table public.people enable row level security;
alter table public.people force row level security;
alter table public.person_shared_facts enable row level security;
alter table public.person_shared_facts force row level security;
alter table public.private_prep enable row level security;
alter table public.private_prep force row level security;

revoke all on public.about_me_facts, public.people, public.person_shared_facts, public.private_prep
  from public, anon, authenticated;
grant select on public.about_me_facts, public.people, public.person_shared_facts, public.private_prep to authenticated;
grant select, insert, update, delete on public.about_me_facts, public.people, public.person_shared_facts, public.private_prep
  to people_executor;

create policy about_me_facts_owner_read on public.about_me_facts for select to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy people_owner_read on public.people for select to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy person_shared_facts_owner_read on public.person_shared_facts for select to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy private_prep_owner_read on public.private_prep for select to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy about_me_facts_executor_owner on public.about_me_facts for all to people_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy people_executor_owner on public.people for all to people_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy person_shared_facts_executor_owner on public.person_shared_facts for all to people_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy private_prep_executor_owner on public.private_prep for all to people_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');

-- All expected failures raise SQLSTATE P0001 with a constant marker:
-- FORBIDDEN, NOT_FOUND, INVALID_INPUT, VERSION_CONFLICT, LIMIT_REACHED.

create function public.about_me_create(p_text text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := practice_private.require_user(); v_fact public.about_me_facts%rowtype;
begin
  if (select pg_catalog.count(*) from public.about_me_facts where owner_id = v_owner) >= 30 then
    raise exception using errcode = 'P0001', message = 'LIMIT_REACHED';
  end if;
  insert into public.about_me_facts(owner_id, text) values (v_owner, pg_catalog.btrim(p_text)) returning * into v_fact;
  return pg_catalog.to_jsonb(v_fact);
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

create function public.about_me_update(p_id uuid, p_text text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := practice_private.require_user(); v_fact public.about_me_facts%rowtype;
begin
  update public.about_me_facts set text = pg_catalog.btrim(p_text), updated_at = pg_catalog.clock_timestamp()
    where id = p_id and owner_id = v_owner returning * into v_fact;
  if not found then raise exception using errcode = 'P0001', message = 'NOT_FOUND'; end if;
  -- What a person knows changed, so a start holding the old version must reload.
  update public.people p set version = p.version + 1, updated_at = pg_catalog.clock_timestamp()
    where p.owner_id = v_owner and exists (select 1 from public.person_shared_facts s
      where s.person_id = p.id and s.fact_id = p_id and s.owner_id = v_owner);
  return pg_catalog.to_jsonb(v_fact);
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

create function public.about_me_delete(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := practice_private.require_user();
begin
  update public.people p set version = p.version + 1, updated_at = pg_catalog.clock_timestamp()
    where p.owner_id = v_owner and exists (select 1 from public.person_shared_facts s
      where s.person_id = p.id and s.fact_id = p_id and s.owner_id = v_owner);
  delete from public.about_me_facts where id = p_id and owner_id = v_owner;
  if not found then raise exception using errcode = 'P0001', message = 'NOT_FOUND'; end if;
  return pg_catalog.jsonb_build_object('deleted', true);
end;
$$;

create function public.person_create(p_name text, p_relationship text, p_traits jsonb, p_style text,
  p_public_context text, p_opening text, p_constraints jsonb, p_challenge text, p_pace text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := practice_private.require_user(); v_person public.people%rowtype;
begin
  if (select pg_catalog.count(*) from public.people where owner_id = v_owner) >= 50 then
    raise exception using errcode = 'P0001', message = 'LIMIT_REACHED';
  end if;
  insert into public.people(owner_id, name, relationship, traits, style, public_context, opening, constraints, challenge, pace)
    values (v_owner, pg_catalog.btrim(p_name), pg_catalog.btrim(p_relationship), p_traits, pg_catalog.btrim(p_style),
      pg_catalog.btrim(p_public_context), pg_catalog.btrim(p_opening), p_constraints, p_challenge, p_pace)
    returning * into v_person;
  return pg_catalog.to_jsonb(v_person) || pg_catalog.jsonb_build_object('shared_fact_ids', '[]'::jsonb);
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

create function public.person_update(p_id uuid, p_expected_version integer, p_name text, p_relationship text,
  p_traits jsonb, p_style text, p_public_context text, p_opening text, p_constraints jsonb, p_challenge text, p_pace text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := practice_private.require_user(); v_person public.people%rowtype;
begin
  select * into v_person from public.people where id = p_id and owner_id = v_owner for update;
  if not found then raise exception using errcode = 'P0001', message = 'NOT_FOUND'; end if;
  if p_expected_version is null or v_person.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'VERSION_CONFLICT';
  end if;
  update public.people set version = version + 1, updated_at = pg_catalog.clock_timestamp(),
    name = pg_catalog.btrim(p_name), relationship = pg_catalog.btrim(p_relationship), traits = p_traits,
    style = pg_catalog.btrim(p_style), public_context = pg_catalog.btrim(p_public_context),
    opening = pg_catalog.btrim(p_opening), constraints = p_constraints, challenge = p_challenge, pace = p_pace
    where id = p_id and owner_id = v_owner returning * into v_person;
  return pg_catalog.to_jsonb(v_person) || pg_catalog.jsonb_build_object('shared_fact_ids', coalesce((
    select pg_catalog.jsonb_agg(s.fact_id order by s.created_at, s.fact_id) from public.person_shared_facts s
    where s.person_id = p_id and s.owner_id = v_owner), '[]'::jsonb));
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

create function public.person_delete(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := practice_private.require_user();
begin
  delete from public.people where id = p_id and owner_id = v_owner;
  if not found then raise exception using errcode = 'P0001', message = 'NOT_FOUND'; end if;
  return pg_catalog.jsonb_build_object('deleted', true);
end;
$$;

-- Replaces the whole shared set atomically; any unknown or foreign fact rejects the entire call.
create function public.person_set_shared_facts(p_id uuid, p_expected_version integer, p_fact_ids uuid[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := practice_private.require_user(); v_person public.people%rowtype;
begin
  if p_fact_ids is null or pg_catalog.cardinality(p_fact_ids) > 30 or pg_catalog.array_position(p_fact_ids, null) is not null
    or (select pg_catalog.count(distinct f) from pg_catalog.unnest(p_fact_ids) as f) <> pg_catalog.cardinality(p_fact_ids) then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  select * into v_person from public.people where id = p_id and owner_id = v_owner for update;
  if not found then raise exception using errcode = 'P0001', message = 'NOT_FOUND'; end if;
  if p_expected_version is null or v_person.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'VERSION_CONFLICT';
  end if;
  if (select pg_catalog.count(*) from public.about_me_facts where owner_id = v_owner and id = any(p_fact_ids))
    <> pg_catalog.cardinality(p_fact_ids) then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  delete from public.person_shared_facts where person_id = p_id and owner_id = v_owner and not (fact_id = any(p_fact_ids));
  insert into public.person_shared_facts(owner_id, person_id, fact_id)
    select v_owner, p_id, f from pg_catalog.unnest(p_fact_ids) as f
    on conflict (person_id, fact_id) do nothing;
  update public.people set version = version + 1, updated_at = pg_catalog.clock_timestamp()
    where id = p_id and owner_id = v_owner returning * into v_person;
  return pg_catalog.to_jsonb(v_person) || pg_catalog.jsonb_build_object('shared_fact_ids', coalesce((
    select pg_catalog.jsonb_agg(s.fact_id order by s.created_at, s.fact_id) from public.person_shared_facts s
    where s.person_id = p_id and s.owner_id = v_owner), '[]'::jsonb));
end;
$$;

-- Empty notes delete the row.
create function public.private_prep_put(p_notes text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := practice_private.require_user(); v_prep public.private_prep%rowtype;
begin
  if p_notes is null or pg_catalog.char_length(p_notes) > 1000 then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  if pg_catalog.btrim(p_notes) = '' then
    delete from public.private_prep where owner_id = v_owner;
    return pg_catalog.jsonb_build_object('notes', '', 'updated_at', null);
  end if;
  insert into public.private_prep(owner_id, notes) values (v_owner, pg_catalog.btrim(p_notes))
    on conflict (owner_id) do update set notes = excluded.notes, updated_at = pg_catalog.clock_timestamp()
    returning * into v_prep;
  return pg_catalog.jsonb_build_object('notes', v_prep.notes, 'updated_at', v_prep.updated_at);
end;
$$;

-- The only counterpart-context read path: one person's fields plus the text of facts shared with it.
-- Runs as the caller under owner RLS. It never reads private_prep or unshared facts.
create function public.person_context(p_id uuid, p_expected_version integer)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare v_person public.people%rowtype;
begin
  if auth.uid() is null or (auth.jwt() ->> 'is_anonymous') is distinct from 'false' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select * into v_person from public.people where id = p_id and owner_id = auth.uid();
  if not found then raise exception using errcode = 'P0001', message = 'NOT_FOUND'; end if;
  if p_expected_version is null or v_person.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'VERSION_CONFLICT';
  end if;
  return pg_catalog.jsonb_build_object(
    'id', v_person.id, 'version', v_person.version, 'name', v_person.name, 'relationship', v_person.relationship,
    'traits', v_person.traits, 'style', v_person.style, 'public_context', v_person.public_context,
    'opening', v_person.opening, 'constraints', v_person.constraints, 'challenge', v_person.challenge, 'pace', v_person.pace,
    'known_about_user', coalesce((
      select pg_catalog.jsonb_agg(f.text order by s.created_at, f.id)
      from public.person_shared_facts s
      join public.about_me_facts f on f.id = s.fact_id and f.owner_id = s.owner_id
      where s.person_id = v_person.id and s.owner_id = auth.uid()), '[]'::jsonb));
end;
$$;

alter function public.about_me_create(text) owner to people_executor;
alter function public.about_me_update(uuid, text) owner to people_executor;
alter function public.about_me_delete(uuid) owner to people_executor;
alter function public.person_create(text, text, jsonb, text, text, text, jsonb, text, text) owner to people_executor;
alter function public.person_update(uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text) owner to people_executor;
alter function public.person_delete(uuid) owner to people_executor;
alter function public.person_set_shared_facts(uuid, integer, uuid[]) owner to people_executor;
alter function public.private_prep_put(text) owner to people_executor;

revoke all on function public.about_me_create(text), public.about_me_update(uuid, text), public.about_me_delete(uuid),
  public.person_create(text, text, jsonb, text, text, text, jsonb, text, text),
  public.person_update(uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text),
  public.person_delete(uuid), public.person_set_shared_facts(uuid, integer, uuid[]),
  public.private_prep_put(text), public.person_context(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.about_me_create(text), public.about_me_update(uuid, text), public.about_me_delete(uuid),
  public.person_create(text, text, jsonb, text, text, text, jsonb, text, text),
  public.person_update(uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text),
  public.person_delete(uuid), public.person_set_shared_facts(uuid, integer, uuid[]),
  public.private_prep_put(text), public.person_context(uuid, integer)
  to authenticated;
revoke create on schema public from people_executor;
revoke people_executor from postgres;

commit;
