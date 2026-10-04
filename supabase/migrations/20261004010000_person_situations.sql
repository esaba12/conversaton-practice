-- M1. Saved-person backgrounds and reusable situations; session kind/preset metadata.
-- This migration intentionally has no transaction wrapper so it can be prepended inside
-- the rolled-back transaction described by supabase/tests/person_situations.sql.

-- Ownership transfers require temporary membership and CREATE. Both are removed below.
grant people_executor to postgres;
grant create on schema public to people_executor;
grant practice_session_executor to postgres;
grant create on schema public to practice_session_executor;

alter table public.people
  add column background text
  check (pg_catalog.char_length(background) between 1 and 600);

update public.people
set background = pg_catalog.left(public_context, 600);

alter table public.people
  alter column background set not null;

-- Replacing these signatures keeps existing named-argument callers working through the
-- optional trailing parameter while making background available to new callers.
drop function public.person_create(text, text, jsonb, text, text, text, jsonb, text, text);

create function public.person_create(
  p_name text,
  p_relationship text,
  p_traits jsonb,
  p_style text,
  p_public_context text,
  p_opening text,
  p_constraints jsonb,
  p_challenge text,
  p_pace text,
  p_background text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
  v_person public.people%rowtype;
begin
  if (select pg_catalog.count(*) from public.people where owner_id = v_owner) >= 50 then
    raise exception using errcode = 'P0001', message = 'LIMIT_REACHED';
  end if;
  insert into public.people(
    owner_id, name, relationship, traits, style, public_context, opening,
    constraints, challenge, pace, background
  )
  values (
    v_owner, pg_catalog.btrim(p_name), pg_catalog.btrim(p_relationship), p_traits,
    pg_catalog.btrim(p_style), pg_catalog.btrim(p_public_context), pg_catalog.btrim(p_opening),
    p_constraints, p_challenge, p_pace,
    pg_catalog.btrim(coalesce(p_background, pg_catalog.left(p_public_context, 600)))
  )
  returning * into v_person;
  return pg_catalog.to_jsonb(v_person)
    || pg_catalog.jsonb_build_object('shared_fact_ids', '[]'::jsonb);
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

drop function public.person_update(
  uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text
);

create function public.person_update(
  p_id uuid,
  p_expected_version integer,
  p_name text,
  p_relationship text,
  p_traits jsonb,
  p_style text,
  p_public_context text,
  p_opening text,
  p_constraints jsonb,
  p_challenge text,
  p_pace text,
  p_background text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
  v_person public.people%rowtype;
begin
  select * into v_person
  from public.people
  where id = p_id and owner_id = v_owner
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if p_expected_version is null or v_person.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'VERSION_CONFLICT';
  end if;
  update public.people
  set version = version + 1,
    updated_at = pg_catalog.clock_timestamp(),
    name = pg_catalog.btrim(p_name),
    relationship = pg_catalog.btrim(p_relationship),
    traits = p_traits,
    style = pg_catalog.btrim(p_style),
    public_context = pg_catalog.btrim(p_public_context),
    opening = pg_catalog.btrim(p_opening),
    constraints = p_constraints,
    challenge = p_challenge,
    pace = p_pace,
    background = case
      when p_background is null then background
      else pg_catalog.btrim(p_background)
    end
  where id = p_id and owner_id = v_owner
  returning * into v_person;
  return pg_catalog.to_jsonb(v_person)
    || pg_catalog.jsonb_build_object('shared_fact_ids', coalesce((
      select pg_catalog.jsonb_agg(s.fact_id order by s.created_at, s.fact_id)
      from public.person_shared_facts s
      where s.person_id = p_id and s.owner_id = v_owner
    ), '[]'::jsonb));
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

alter function public.person_create(
  text, text, jsonb, text, text, text, jsonb, text, text, text
) owner to people_executor;
alter function public.person_update(
  uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text, text
) owner to people_executor;

revoke all on function public.person_create(
  text, text, jsonb, text, text, text, jsonb, text, text, text
) from public, anon, authenticated;
revoke all on function public.person_update(
  uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text, text
) from public, anon, authenticated;
grant execute on function public.person_create(
  text, text, jsonb, text, text, text, jsonb, text, text, text
) to authenticated;
grant execute on function public.person_update(
  uuid, integer, text, text, jsonb, text, text, text, jsonb, text, text, text
) to authenticated;

create table public.person_situations (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  label text not null
    check (pg_catalog.char_length(pg_catalog.btrim(label)) between 1 and 60),
  situation jsonb not null
    check (
      pg_catalog.jsonb_typeof(situation) = 'object'
      and pg_catalog.octet_length(situation::text) <= 8192
    ),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);

create index person_situations_person_newest
  on public.person_situations(person_id, created_at desc, id);

alter table public.person_situations enable row level security;
alter table public.person_situations force row level security;

revoke all on public.person_situations from public, anon, authenticated;
grant select on public.person_situations to authenticated;
grant select, insert, update, delete on public.person_situations to people_executor;

create policy person_situations_owner_read
  on public.person_situations
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
  );

create policy person_situations_executor_owner
  on public.person_situations
  for all to people_executor
  using (
    owner_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
  )
  with check (
    owner_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
  );

-- Returns a JSON array of at most five rows, newest first. Each row contains
-- id, person_id, label, situation, created_at and updated_at (owner_id omitted).
create function public.person_situation_list(p_person_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_owner uuid;
begin
  if auth.uid() is null or (auth.jwt() ->> 'is_anonymous') is distinct from 'false' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  v_owner := auth.uid();
  if not exists (
    select 1 from public.people where id = p_person_id and owner_id = v_owner
  ) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  return coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', s.id,
      'person_id', s.person_id,
      'label', s.label,
      'situation', s.situation,
      'created_at', s.created_at,
      'updated_at', s.updated_at
    ) order by s.created_at desc, s.id)
    from (
      select *
      from public.person_situations
      where owner_id = v_owner and person_id = p_person_id
      order by created_at desc, id
      limit 5
    ) s
  ), '[]'::jsonb);
end;
$$;

create function public.person_situation_create(
  p_person_id uuid,
  p_label text,
  p_situation jsonb
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
  v_situation public.person_situations%rowtype;
begin
  -- The person-row lock serializes the per-person cap without changing people.version.
  perform 1
  from public.people
  where id = p_person_id and owner_id = v_owner
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if (
    select pg_catalog.count(*)
    from public.person_situations
    where owner_id = v_owner and person_id = p_person_id
  ) >= 5 then
    raise exception using errcode = 'P0001', message = 'LIMIT_REACHED';
  end if;
  insert into public.person_situations(owner_id, person_id, label, situation)
  values (v_owner, p_person_id, pg_catalog.btrim(p_label), p_situation)
  returning * into v_situation;
  return pg_catalog.to_jsonb(v_situation) - 'owner_id';
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

create function public.person_situation_delete(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
begin
  delete from public.person_situations
  where id = p_id and owner_id = v_owner;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  return pg_catalog.jsonb_build_object('deleted', true);
end;
$$;

alter function public.person_situation_create(uuid, text, jsonb) owner to people_executor;
alter function public.person_situation_delete(uuid) owner to people_executor;

revoke all on function public.person_situation_list(uuid),
  public.person_situation_create(uuid, text, jsonb),
  public.person_situation_delete(uuid)
  from public, anon, authenticated;
grant execute on function public.person_situation_list(uuid),
  public.person_situation_create(uuid, text, jsonb),
  public.person_situation_delete(uuid)
  to authenticated;

-- Existing signature and context boundary are unchanged. Background is identity context;
-- private prep and unshared facts remain absent.
create or replace function public.person_context(p_id uuid, p_expected_version integer)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_person public.people%rowtype;
begin
  if auth.uid() is null or (auth.jwt() ->> 'is_anonymous') is distinct from 'false' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select * into v_person
  from public.people
  where id = p_id and owner_id = auth.uid();
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if p_expected_version is null or v_person.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'VERSION_CONFLICT';
  end if;
  return pg_catalog.jsonb_build_object(
    'id', v_person.id,
    'version', v_person.version,
    'name', v_person.name,
    'relationship', v_person.relationship,
    'traits', v_person.traits,
    'style', v_person.style,
    'public_context', v_person.public_context,
    'opening', v_person.opening,
    'constraints', v_person.constraints,
    'challenge', v_person.challenge,
    'pace', v_person.pace,
    'background', v_person.background,
    'known_about_user', coalesce((
      select pg_catalog.jsonb_agg(f.text order by s.created_at, f.id)
      from public.person_shared_facts s
      join public.about_me_facts f
        on f.id = s.fact_id and f.owner_id = s.owner_id
      where s.person_id = v_person.id and s.owner_id = auth.uid()
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.person_context(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.person_context(uuid, integer) to authenticated;

-- Atomic owner bulk-delete entrypoint for application practice data. Session metadata
-- remains for provider cleanup. The person delete cascade is supplemented explicitly so
-- future person deletion behavior cannot leave saved situations behind.
create function public.practice_data_delete_all()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
  v_situations integer;
  v_people integer;
  v_facts integer;
  v_prep integer;
begin
  delete from public.person_situations where owner_id = v_owner;
  get diagnostics v_situations = row_count;
  delete from public.people where owner_id = v_owner;
  get diagnostics v_people = row_count;
  delete from public.about_me_facts where owner_id = v_owner;
  get diagnostics v_facts = row_count;
  delete from public.private_prep where owner_id = v_owner;
  get diagnostics v_prep = row_count;
  return pg_catalog.jsonb_build_object(
    'deleted', pg_catalog.jsonb_build_object(
      'person_situations', v_situations,
      'people', v_people,
      'about_me_facts', v_facts,
      'private_prep', v_prep > 0
    )
  );
end;
$$;

alter function public.practice_data_delete_all() owner to people_executor;
revoke all on function public.practice_data_delete_all()
  from public, anon, authenticated;
grant execute on function public.practice_data_delete_all() to authenticated;

alter table public.practice_sessions
  add column kind text not null default 'practice'
    check (kind in ('practice', 'stand_in')),
  add column preset text
    check (preset is null or preset in ('roommate', 'professor', 'decline', 'manager'));

drop function public.practice_acquire(text, uuid, text, integer, uuid, integer);

create function public.practice_acquire(
  p_secret text,
  p_key uuid,
  p_fingerprint text,
  p_duration integer,
  p_person_id uuid,
  p_person_version integer,
  p_kind text default 'practice',
  p_preset text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_key is null or p_fingerprint is null
    or pg_catalog.length(p_fingerprint) not between 1 and 128
    or p_duration is null or p_duration not in (180, 300)
    or (p_person_id is null) <> (p_person_version is null)
    or (p_person_version is not null and p_person_version < 1)
    or p_kind is null or p_kind not in ('practice', 'stand_in')
    or (p_preset is not null and p_preset not in ('roommate', 'professor', 'decline', 'manager')) then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  update public.practice_sessions
  set status = 'interrupted',
    ended_at = v_now,
    cleanup = case
      when cleanup = 'confirmed' then cleanup
      when provider_conversation_id is null then 'unresolved'
      when cleanup = 'unresolved' then cleanup
      else 'pending'
    end
  where owner_id = v_owner
    and status in ('connecting', 'active', 'ending')
    and expires_at <= v_now;
  select * into v_session
  from public.practice_sessions
  where owner_id = v_owner and idempotency_key = p_key;
  if found then
    if v_session.request_fingerprint <> p_fingerprint then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    return pg_catalog.jsonb_build_object(
      'created', false,
      'session', pg_catalog.to_jsonb(v_session)
    );
  end if;
  if exists (
    select 1
    from public.practice_sessions
    where owner_id = v_owner and status in ('connecting', 'active', 'ending')
  ) then
    raise exception using errcode = 'P0001', message = 'SESSION_ACTIVE';
  end if;
  insert into public.practice_sessions(
    owner_id, idempotency_key, request_fingerprint, created_at, expires_at,
    person_id, person_version, kind, preset
  )
  values (
    v_owner, p_key, p_fingerprint, v_now,
    v_now + pg_catalog.make_interval(secs => p_duration),
    p_person_id, p_person_version, p_kind, p_preset
  )
  returning * into v_session;
  return pg_catalog.jsonb_build_object(
    'created', true,
    'session', pg_catalog.to_jsonb(v_session)
  );
end;
$$;

alter function public.practice_acquire(
  text, uuid, text, integer, uuid, integer, text, text
) owner to practice_session_executor;
revoke all on function public.practice_acquire(
  text, uuid, text, integer, uuid, integer, text, text
) from public, anon, authenticated;
grant execute on function public.practice_acquire(
  text, uuid, text, integer, uuid, integer, text, text
) to authenticated;

-- Extend FIX-02's column-level read grant without restoring table-level SELECT.
grant select (kind, preset) on public.practice_sessions to authenticated;

-- Return shape:
-- {"person_ids": ["uuid", ...], "presets": ["roommate"|"professor"|"decline"|"manager", ...]}
-- Only ended normal-practice sessions belonging to the signed-in owner contribute.
create function public.practice_history()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null or (auth.jwt() ->> 'is_anonymous') is distinct from 'false' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  return pg_catalog.jsonb_build_object(
    'person_ids', coalesce((
      select pg_catalog.jsonb_agg(x.person_id order by x.person_id)
      from (
        select distinct s.person_id
        from public.practice_sessions s
        where s.owner_id = auth.uid()
          and s.status = 'ended'
          and s.kind = 'practice'
          and s.person_id is not null
      ) x
    ), '[]'::jsonb),
    'presets', coalesce((
      select pg_catalog.jsonb_agg(x.preset order by x.preset)
      from (
        select distinct s.preset
        from public.practice_sessions s
        where s.owner_id = auth.uid()
          and s.status = 'ended'
          and s.kind = 'practice'
          and s.preset is not null
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.practice_history() from public, anon, authenticated;
grant execute on function public.practice_history() to authenticated;

revoke create on schema public from people_executor;
revoke people_executor from postgres;
revoke create on schema public from practice_session_executor;
revoke practice_session_executor from postgres;
