-- M23. Planned real conversations with check-in and the W4 guess (B1, B2, W4 storage); saved-person look-and-voice preset (B4).
-- One transaction: a mid-file failure must not leave the temporary grants below in place.
-- For pre-apply review, strip this file's BEGIN/COMMIT (see supabase/tests/planned_and_presets.sql).
begin;

grant people_executor to postgres;
grant create on schema public to people_executor;

-- B4: the server maps the preset to a face and PAL; the browser never sees provider ids.
alter table public.people
  add column preset_id text
  check (preset_id is null or preset_id in ('roommate', 'professor', 'decline', 'manager'));

create function public.person_set_preset(p_id uuid, p_expected_version integer, p_preset text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
  v_person public.people%rowtype;
begin
  if p_preset is not null and p_preset not in ('roommate', 'professor', 'decline', 'manager') then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  select * into v_person from public.people where id = p_id and owner_id = v_owner for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if p_expected_version is null or v_person.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'VERSION_CONFLICT';
  end if;
  update public.people
  set preset_id = p_preset, version = version + 1, updated_at = pg_catalog.clock_timestamp()
  where id = p_id and owner_id = v_owner
  returning * into v_person;
  return pg_catalog.jsonb_build_object('id', v_person.id, 'version', v_person.version, 'preset_id', v_person.preset_id);
end;
$$;

-- B1/B2/W4: one plan per saved person. No transcript content. The guess fields are stored only when the user opts in.
create table public.planned_conversations (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null,
  planned_on date not null,
  label text check (label is null or pg_catalog.char_length(pg_catalog.btrim(label)) between 1 and 120),
  fear text check (fear is null or pg_catalog.char_length(pg_catalog.btrim(fear)) between 1 and 200),
  likelihood_before smallint check (likelihood_before is null or likelihood_before between 0 and 100),
  likelihood_after smallint check (likelihood_after is null or likelihood_after between 0 and 100),
  checkin text check (checkin is null or checkin in ('not_yet', 'decided_not', 'yes')),
  checkin_note text check (checkin_note is null or pg_catalog.char_length(pg_catalog.btrim(checkin_note)) between 1 and 200),
  checked_in_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (person_id),
  foreign key (person_id, owner_id) references public.people(id, owner_id) on delete cascade
);

create index planned_conversations_owner on public.planned_conversations(owner_id, planned_on desc);

alter table public.planned_conversations enable row level security;
alter table public.planned_conversations force row level security;

revoke all on public.planned_conversations from public, anon, authenticated;
grant select on public.planned_conversations to authenticated;
grant select, insert, update, delete on public.planned_conversations to people_executor;

create policy planned_conversations_owner_read on public.planned_conversations
  for select to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy planned_conversations_executor_owner on public.planned_conversations
  for all to people_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');

-- Setting a (new) day clears any earlier check-in, so B2 asks once per date.
create function public.planned_set(
  p_person_id uuid,
  p_planned_on date,
  p_label text default null,
  p_fear text default null,
  p_likelihood_before smallint default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
  v_plan public.planned_conversations%rowtype;
begin
  if p_planned_on is null then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  if not exists (select 1 from public.people where id = p_person_id and owner_id = v_owner) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  insert into public.planned_conversations(owner_id, person_id, planned_on, label, fear, likelihood_before)
  values (v_owner, p_person_id, p_planned_on, nullif(pg_catalog.btrim(p_label), ''), nullif(pg_catalog.btrim(p_fear), ''), p_likelihood_before)
  on conflict (person_id) do update
  set planned_on = excluded.planned_on,
    label = excluded.label,
    fear = excluded.fear,
    likelihood_before = excluded.likelihood_before,
    likelihood_after = null,
    checkin = null,
    checkin_note = null,
    checked_in_at = null,
    updated_at = pg_catalog.clock_timestamp()
  where public.planned_conversations.owner_id = v_owner
  returning * into v_plan;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  return pg_catalog.to_jsonb(v_plan) - 'owner_id';
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

create function public.planned_checkin(
  p_id uuid,
  p_answer text,
  p_note text default null,
  p_likelihood_after smallint default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
  v_plan public.planned_conversations%rowtype;
begin
  if p_answer is null or p_answer not in ('not_yet', 'decided_not', 'yes') then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  update public.planned_conversations
  set checkin = p_answer,
    checkin_note = case when p_answer = 'yes' then nullif(pg_catalog.btrim(p_note), '') else null end,
    likelihood_after = p_likelihood_after,
    checked_in_at = pg_catalog.clock_timestamp(),
    updated_at = pg_catalog.clock_timestamp()
  where id = p_id and owner_id = v_owner
  returning * into v_plan;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  return pg_catalog.to_jsonb(v_plan) - 'owner_id';
exception when check_violation or not_null_violation then
  raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
end;
$$;

create function public.planned_delete(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
begin
  delete from public.planned_conversations where id = p_id and owner_id = v_owner;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  return pg_catalog.jsonb_build_object('deleted', true);
end;
$$;

alter function public.person_set_preset(uuid, integer, text) owner to people_executor;
alter function public.planned_set(uuid, date, text, text, smallint) owner to people_executor;
alter function public.planned_checkin(uuid, text, text, smallint) owner to people_executor;
alter function public.planned_delete(uuid) owner to people_executor;

revoke all on function public.person_set_preset(uuid, integer, text),
  public.planned_set(uuid, date, text, text, smallint),
  public.planned_checkin(uuid, text, text, smallint),
  public.planned_delete(uuid)
  from public, anon, authenticated;
grant execute on function public.person_set_preset(uuid, integer, text),
  public.planned_set(uuid, date, text, text, smallint),
  public.planned_checkin(uuid, text, text, smallint),
  public.planned_delete(uuid)
  to authenticated;

create or replace function public.practice_data_delete_all()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_user();
  v_planned integer;
  v_situations integer;
  v_people integer;
  v_facts integer;
  v_prep integer;
begin
  delete from public.planned_conversations where owner_id = v_owner;
  get diagnostics v_planned = row_count;
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
      'planned_conversations', v_planned,
      'person_situations', v_situations,
      'people', v_people,
      'about_me_facts', v_facts,
      'private_prep', v_prep > 0
    )
  );
end;
$$;

alter function public.practice_data_delete_all() owner to people_executor;
revoke all on function public.practice_data_delete_all() from public, anon, authenticated;
grant execute on function public.practice_data_delete_all() to authenticated;

revoke create on schema public from people_executor;
revoke people_executor from postgres;

commit;
