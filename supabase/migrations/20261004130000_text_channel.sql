-- Text practice (docs/17). Video rows stay channel = 'video'. New tables hold the
-- linked number, the frozen role, and temporary turns. Webhook functions are
-- owned by postgres so they can run without a user JWT; each one checks the
-- server capability and derives the owner from the phone or the pick token.
begin;

grant practice_session_executor to postgres;
grant create on schema public to practice_session_executor;

alter table public.practice_sessions
  add column channel text not null default 'video'
    check (channel in ('video', 'text'));

grant select (channel) on public.practice_sessions to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'practice_sessions_id_owner' and conrelid = 'public.practice_sessions'::regclass
  ) then
    alter table public.practice_sessions
      add constraint practice_sessions_id_owner unique (id, owner_id);
  end if;
end $$;

create function practice_private.require_capability(p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or pg_catalog.octet_length(p_secret) not between 32 and 512
    or not exists (
      select 1 from practice_private.server_capability c
      where c.singleton and c.secret_hash = extensions.digest(p_secret, 'sha256')
    ) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
end;
$$;
revoke all on function practice_private.require_capability(text) from public, anon, authenticated;
grant execute on function practice_private.require_capability(text) to practice_session_executor;

create table public.text_links (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  phone_e164 text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  verified_at timestamptz not null default pg_catalog.clock_timestamp()
);

create table public.text_link_challenges (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create index text_link_challenges_phone on public.text_link_challenges(phone_e164, code_hash);

create table public.text_session_state (
  session_id uuid primary key references public.practice_sessions(id) on delete cascade,
  owner_id uuid not null,
  role jsonb not null,
  extras jsonb not null,
  opening text not null,
  opening_sent boolean not null default false,
  space_id text,
  user_turns integer not null default 0 check (user_turns >= 0),
  foreign key (session_id, owner_id) references public.practice_sessions(id, owner_id)
);

create table public.text_turns (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  owner_id uuid not null,
  direction text not null check (direction in ('user', 'counterpart')),
  body text not null check (pg_catalog.char_length(body) between 1 and 2000),
  created_at timestamptz not null default pg_catalog.clock_timestamp()
);
create index text_turns_session on public.text_turns(session_id, created_at);

create table public.text_pick_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  space_id text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table public.text_inbound_dedupe (
  message_id text primary key check (pg_catalog.char_length(message_id) between 1 and 256),
  received_at timestamptz not null default pg_catalog.clock_timestamp()
);

alter table public.text_links enable row level security;
alter table public.text_links force row level security;
alter table public.text_link_challenges enable row level security;
alter table public.text_link_challenges force row level security;
alter table public.text_session_state enable row level security;
alter table public.text_session_state force row level security;
alter table public.text_turns enable row level security;
alter table public.text_turns force row level security;
alter table public.text_pick_tokens enable row level security;
alter table public.text_pick_tokens force row level security;
alter table public.text_inbound_dedupe enable row level security;
alter table public.text_inbound_dedupe force row level security;

revoke all on public.text_links, public.text_link_challenges, public.text_session_state,
  public.text_turns, public.text_pick_tokens, public.text_inbound_dedupe
  from public, anon, authenticated;
grant select, insert, update, delete on public.text_links, public.text_link_challenges,
  public.text_session_state, public.text_turns, public.text_pick_tokens, public.text_inbound_dedupe
  to practice_session_executor;

create policy text_links_executor on public.text_links
  for all to practice_session_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy text_challenges_executor on public.text_link_challenges
  for all to practice_session_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy text_state_executor on public.text_session_state
  for all to practice_session_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy text_turns_executor on public.text_turns
  for all to practice_session_executor
  using (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid()) and (select auth.jwt() ->> 'is_anonymous') = 'false');

create function public.text_link_begin(p_secret text, p_phone text, p_code_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_count integer;
begin
  if p_phone is null or p_phone !~ '^\+[1-9][0-9]{7,14}$' or p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  if exists (select 1 from public.text_links where owner_id = v_owner) then
    raise exception using errcode = 'P0001', message = 'ALREADY_LINKED';
  end if;
  select count(*) into v_count from public.text_link_challenges
    where owner_id = v_owner and expires_at > pg_catalog.clock_timestamp() - interval '1 hour';
  if v_count >= 5 then
    raise exception using errcode = 'P0001', message = 'LIMIT_REACHED';
  end if;
  update public.text_link_challenges set consumed_at = pg_catalog.clock_timestamp()
    where owner_id = v_owner and consumed_at is null;
  insert into public.text_link_challenges(owner_id, phone_e164, code_hash, expires_at)
    values (v_owner, p_phone, p_code_hash, pg_catalog.clock_timestamp() + interval '10 minutes');
  return pg_catalog.jsonb_build_object('expires_at', pg_catalog.clock_timestamp() + interval '10 minutes');
end;
$$;

create function public.text_link_status()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_phone text;
begin
  if v_owner is null or (auth.jwt() ->> 'is_anonymous') is distinct from 'false' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select phone_e164 into v_phone from public.text_links where owner_id = v_owner;
  if v_phone is null then return pg_catalog.jsonb_build_object('linked', false); end if;
  return pg_catalog.jsonb_build_object('linked', true, 'phone_last4', pg_catalog.right(v_phone, 4));
end;
$$;

create function public.text_link_phone(p_secret text)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_phone text;
begin
  select phone_e164 into v_phone from public.text_links where owner_id = v_owner;
  if v_phone is null then
    raise exception using errcode = 'P0001', message = 'NOT_LINKED';
  end if;
  return v_phone;
end;
$$;

create function public.text_unlink(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
begin
  select * into v_session from public.practice_sessions
    where owner_id = v_owner and channel = 'text' and status in ('connecting', 'active', 'ending')
    for update;
  if found then
    update public.practice_sessions set status = 'ended', ended_at = pg_catalog.clock_timestamp(), cleanup = 'pending'
      where id = v_session.id;
  end if;
  delete from public.text_links where owner_id = v_owner;
  return pg_catalog.jsonb_build_object('linked', false);
end;
$$;

create function public.practice_text_acquire(
  p_secret text, p_key uuid, p_fingerprint text,
  p_person_id uuid, p_person_version integer, p_preset text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_key is null or p_fingerprint is null or pg_catalog.length(p_fingerprint) not between 1 and 128
    or (p_person_id is null) <> (p_person_version is null)
    or (p_person_version is not null and p_person_version < 1)
    or (p_preset is not null and p_preset not in ('roommate', 'professor', 'decline', 'manager'))
    or (p_person_id is not null and p_preset is not null) then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  if not exists (select 1 from public.text_links where owner_id = v_owner) then
    raise exception using errcode = 'P0001', message = 'NOT_LINKED';
  end if;
  update public.practice_sessions
    set status = 'interrupted', ended_at = v_now,
      cleanup = case when channel = 'text' then 'pending' when provider_conversation_id is null then 'unresolved' else 'pending' end
    where owner_id = v_owner and status in ('connecting', 'active', 'ending') and expires_at <= v_now;
  select * into v_session from public.practice_sessions where owner_id = v_owner and idempotency_key = p_key;
  if found then
    if v_session.request_fingerprint <> p_fingerprint or v_session.channel <> 'text' then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    return pg_catalog.jsonb_build_object('created', false, 'session', pg_catalog.to_jsonb(v_session));
  end if;
  if exists (select 1 from public.practice_sessions where owner_id = v_owner and status in ('connecting', 'active', 'ending')) then
    raise exception using errcode = 'P0001', message = 'SESSION_ACTIVE';
  end if;
  insert into public.practice_sessions(
    owner_id, idempotency_key, request_fingerprint, created_at, expires_at,
    person_id, person_version, kind, preset, channel
  ) values (
    v_owner, p_key, p_fingerprint, v_now, v_now + interval '10 minutes',
    p_person_id, p_person_version, 'practice', p_preset, 'text'
  ) returning * into v_session;
  return pg_catalog.jsonb_build_object('created', true, 'session', pg_catalog.to_jsonb(v_session));
end;
$$;

create function public.text_state_save(
  p_secret text, p_id uuid, p_role jsonb, p_extras jsonb, p_opening text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
begin
  if p_opening is null or pg_catalog.char_length(pg_catalog.btrim(p_opening)) not between 1 and 300
    or p_role is null or p_extras is null then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  if not exists (
    select 1 from public.practice_sessions
    where id = p_id and owner_id = v_owner and channel = 'text' and status = 'connecting'
  ) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  insert into public.text_session_state(session_id, owner_id, role, extras, opening)
    values (p_id, v_owner, p_role, p_extras, pg_catalog.btrim(p_opening))
    on conflict (session_id) do nothing;
end;
$$;

create function public.text_opening(p_secret text, p_id uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_opening text;
begin
  select opening into v_opening from public.text_session_state s
    join public.practice_sessions p on p.id = s.session_id
    where s.session_id = p_id and s.owner_id = v_owner and p.channel = 'text'
      and p.status = 'connecting' and s.opening_sent = false;
  if v_opening is null then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  return v_opening;
end;
$$;

create function public.text_mark_active(p_secret text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
begin
  update public.text_session_state set opening_sent = true
    where session_id = p_id and owner_id = v_owner;
  update public.practice_sessions set status = 'active',
    connected_at = coalesce(connected_at, pg_catalog.clock_timestamp())
    where id = p_id and owner_id = v_owner and channel = 'text' and status = 'connecting'
    returning * into v_session;
  if not found then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  return pg_catalog.to_jsonb(v_session);
end;
$$;

create function public.text_end(p_secret text, p_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
begin
  if p_reason is null or p_reason not in ('user', 'auth_loss', 'navigation', 'connection_failure', 'time_limit') then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  select * into v_session from public.practice_sessions
    where id = p_id and owner_id = v_owner and channel = 'text' for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if v_session.status in ('ended', 'interrupted', 'deleted') then
    return pg_catalog.to_jsonb(v_session);
  end if;
  update public.practice_sessions set
    status = case when p_reason in ('auth_loss', 'connection_failure') then 'interrupted' else 'ended' end,
    ended_at = pg_catalog.clock_timestamp(),
    cleanup = 'pending'
    where id = p_id returning * into v_session;
  return pg_catalog.to_jsonb(v_session);
end;
$$;

create function public.text_turns_read(p_secret text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
begin
  if not exists (
    select 1 from public.practice_sessions
    where id = p_id and owner_id = v_owner and channel = 'text' and status in ('ended', 'interrupted')
  ) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  return coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'speaker', case when direction = 'user' then 'user' else 'counterpart' end,
      'text', body
    ) order by created_at)
    from public.text_turns where session_id = p_id and owner_id = v_owner
  ), '[]'::jsonb);
end;
$$;

create function public.text_turns_purge(p_secret text, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
begin
  if not exists (select 1 from public.practice_sessions where id = p_id and owner_id = v_owner and channel = 'text') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  delete from public.text_turns where session_id = p_id and owner_id = v_owner;
  delete from public.text_session_state where session_id = p_id and owner_id = v_owner;
  update public.practice_sessions set cleanup = 'confirmed'
    where id = p_id and owner_id = v_owner and channel = 'text' and status in ('ended', 'interrupted', 'deleted');
end;
$$;

-- Inbound, pick tokens, and pick start run as postgres: the webhook has no user JWT.
-- The owner always comes from the verified phone or the token row, never from a caller-supplied id.
create function public.text_inbound(
  p_secret text, p_message_id text, p_phone text, p_space_id text, p_body text, p_kind text, p_code_hash text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_session public.practice_sessions%rowtype;
  v_state public.text_session_state%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_turns integer;
begin
  perform practice_private.require_capability(p_secret);
  if p_message_id is null or p_phone is null or p_phone !~ '^\+[1-9][0-9]{7,14}$'
    or p_kind is null or p_kind not in ('text', 'code', 'end', 'other') then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  insert into public.text_inbound_dedupe(message_id) values (p_message_id)
    on conflict (message_id) do nothing;
  if not found then
    return pg_catalog.jsonb_build_object('action', 'duplicate');
  end if;
  delete from public.text_inbound_dedupe where received_at < v_now - interval '48 hours';

  if p_kind = 'code' and not exists (select 1 from public.text_links where phone_e164 = p_phone) then
    update public.text_link_challenges set consumed_at = v_now
      where phone_e164 = p_phone and code_hash = p_code_hash and consumed_at is null and expires_at > v_now
      returning owner_id into v_owner;
    if v_owner is null then
      return pg_catalog.jsonb_build_object('action', 'unlinked');
    end if;
    insert into public.text_links(owner_id, phone_e164) values (v_owner, p_phone)
      on conflict (phone_e164) do nothing;
    if not found then
      return pg_catalog.jsonb_build_object('action', 'phone_taken');
    end if;
    return pg_catalog.jsonb_build_object('action', 'linked');
  end if;
  if p_kind = 'code' then
    p_kind := 'text';
  end if;

  select owner_id into v_owner from public.text_links where phone_e164 = p_phone;
  if v_owner is null then
    return pg_catalog.jsonb_build_object('action', 'unlinked');
  end if;

  select * into v_session from public.practice_sessions
    where owner_id = v_owner and status in ('connecting', 'active', 'ending')
    order by created_at desc limit 1
    for update;
  if found and v_session.expires_at <= v_now then
    update public.practice_sessions set status = 'ended', ended_at = v_now, cleanup = 'pending'
      where id = v_session.id;
    v_session.id := null;
  end if;
  if found and v_session.id is not null and v_session.channel <> 'text' then
    return pg_catalog.jsonb_build_object('action', 'video_busy');
  end if;
  if not found or v_session.id is null then
    return pg_catalog.jsonb_build_object('action', 'card');
  end if;
  if v_session.status = 'connecting' then
    if p_kind = 'text' and p_body is not null and pg_catalog.char_length(pg_catalog.btrim(p_body)) > 0 then
      insert into public.text_turns(session_id, owner_id, direction, body)
        values (v_session.id, v_owner, 'user', pg_catalog.left(pg_catalog.btrim(p_body), 2000));
    end if;
    return pg_catalog.jsonb_build_object('action', 'hold', 'session_id', v_session.id);
  end if;
  if p_kind = 'end' then
    return pg_catalog.jsonb_build_object('action', 'end', 'session_id', v_session.id);
  end if;
  if p_kind = 'other' then
    return pg_catalog.jsonb_build_object('action', 'attachment', 'session_id', v_session.id);
  end if;

  select * into v_state from public.text_session_state where session_id = v_session.id;
  if not found then
    return pg_catalog.jsonb_build_object('action', 'card');
  end if;
  v_turns := v_state.user_turns + 1;
  if v_turns > 10 then
    return pg_catalog.jsonb_build_object('action', 'capped', 'session_id', v_session.id);
  end if;
  insert into public.text_turns(session_id, owner_id, direction, body)
    values (v_session.id, v_owner, 'user', pg_catalog.left(pg_catalog.btrim(p_body), 2000));
  update public.text_session_state set user_turns = v_turns
    where session_id = v_session.id;
  update public.practice_sessions set expires_at = v_now + interval '10 minutes'
    where id = v_session.id;
  return pg_catalog.jsonb_build_object(
    'action', case when v_turns = 10 then 'final' else 'turn' end,
    'session_id', v_session.id,
    'user_turns', v_turns,
    'role', v_state.role,
    'extras', v_state.extras,
    'opening', v_state.opening,
    'turns', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'speaker', case when direction = 'user' then 'user' else 'counterpart' end,
        'text', body
      ) order by created_at)
      from public.text_turns where session_id = v_session.id
    ), '[]'::jsonb)
  );
end;
$$;

create function public.text_turn_count(p_secret text, p_session_id uuid)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare
  v_turns integer;
begin
  perform practice_private.require_capability(p_secret);
  select user_turns into v_turns from public.text_session_state where session_id = p_session_id;
  return coalesce(v_turns, 0);
end;
$$;

create function public.text_pick_activate(p_secret text, p_session_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform practice_private.require_capability(p_secret);
  update public.text_session_state set opening_sent = true where session_id = p_session_id;
  update public.practice_sessions set status = 'active',
    connected_at = coalesce(connected_at, pg_catalog.clock_timestamp())
    where id = p_session_id and channel = 'text' and status = 'connecting';
end;
$$;

create function public.text_record_reply(p_secret text, p_session_id uuid, p_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  perform practice_private.require_capability(p_secret);
  select owner_id into v_owner from public.practice_sessions
    where id = p_session_id and channel = 'text' and status = 'active';
  if v_owner is null or p_body is null or pg_catalog.char_length(pg_catalog.btrim(p_body)) not between 1 and 600 then
    return;
  end if;
  insert into public.text_turns(session_id, owner_id, direction, body)
    values (p_session_id, v_owner, 'counterpart', pg_catalog.btrim(p_body));
end;
$$;

create function public.text_end_inbound(p_secret text, p_session_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform practice_private.require_capability(p_secret);
  if p_reason is null or p_reason not in ('user', 'time_limit', 'connection_failure') then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  update public.practice_sessions set
    status = 'ended', ended_at = pg_catalog.clock_timestamp(), cleanup = 'pending'
    where id = p_session_id and channel = 'text' and status in ('connecting', 'active', 'ending');
end;
$$;

create function public.text_pick_save(p_secret text, p_token_hash text, p_phone text, p_space_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  perform practice_private.require_capability(p_secret);
  select owner_id into v_owner from public.text_links where phone_e164 = p_phone;
  if v_owner is null or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or p_space_id is null then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  update public.text_pick_tokens set expires_at = pg_catalog.clock_timestamp()
    where owner_id = v_owner and used_at is null and expires_at > pg_catalog.clock_timestamp();
  insert into public.text_pick_tokens(token_hash, owner_id, space_id, expires_at)
    values (p_token_hash, v_owner, p_space_id, pg_catalog.clock_timestamp() + interval '15 minutes');
end;
$$;

create function public.text_pick_catalog(p_secret text, p_token_hash text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  perform practice_private.require_capability(p_secret);
  select owner_id into v_owner from public.text_pick_tokens
    where token_hash = p_token_hash and used_at is null and expires_at > pg_catalog.clock_timestamp();
  if v_owner is null then
    return null;
  end if;
  return coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', p.id,
      'version', p.version,
      'name', p.name,
      'relationship', p.relationship,
      'situations', coalesce((
        select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', s.id, 'label', s.label) order by s.created_at desc)
        from public.person_situations s
        where s.person_id = p.id and s.owner_id = p.owner_id
      ), '[]'::jsonb)
    ) order by p.updated_at desc)
    from public.people p where p.owner_id = v_owner
  ), '[]'::jsonb);
end;
$$;

create function public.text_pick_person(
  p_secret text, p_token_hash text, p_person_id uuid, p_version integer, p_situation_id uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_person public.people%rowtype;
  v_situation jsonb;
begin
  perform practice_private.require_capability(p_secret);
  select owner_id into v_owner from public.text_pick_tokens
    where token_hash = p_token_hash and used_at is null and expires_at > pg_catalog.clock_timestamp();
  if v_owner is null then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select * into v_person from public.people where id = p_person_id and owner_id = v_owner;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_person.version <> p_version then
    raise exception using errcode = 'P0001', message = 'VERSION_CONFLICT';
  end if;
  if p_situation_id is not null then
    select situation into v_situation from public.person_situations
      where id = p_situation_id and person_id = p_person_id and owner_id = v_owner;
    if v_situation is null then
      raise exception using errcode = 'P0001', message = 'NOT_FOUND';
    end if;
  end if;
  return pg_catalog.jsonb_build_object(
    'person', pg_catalog.jsonb_build_object(
      'name', v_person.name,
      'relationship', v_person.relationship,
      'traits', v_person.traits,
      'style', v_person.style,
      'public_context', v_person.public_context,
      'opening', v_person.opening,
      'constraints', v_person.constraints,
      'challenge', v_person.challenge,
      'pace', v_person.pace,
      'background', v_person.background
    ),
    'known', coalesce((
      select pg_catalog.jsonb_agg(f.text order by f.created_at)
      from public.person_shared_facts s
      join public.about_me_facts f on f.id = s.fact_id and f.owner_id = s.owner_id
      where s.person_id = v_person.id and s.owner_id = v_owner
    ), '[]'::jsonb),
    'situation', v_situation,
    'phone', (select phone_e164 from public.text_links where owner_id = v_owner)
  );
end;
$$;

create function public.text_pick_commit(
  p_secret text, p_token_hash text, p_key uuid, p_fingerprint text,
  p_person_id uuid, p_person_version integer, p_preset text,
  p_role jsonb, p_extras jsonb, p_opening text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_space text;
  v_session public.practice_sessions%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  perform practice_private.require_capability(p_secret);
  select owner_id, space_id into v_owner, v_space from public.text_pick_tokens
    where token_hash = p_token_hash and used_at is null and expires_at > v_now
    for update;
  if v_owner is null then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if exists (
    select 1 from public.practice_sessions
    where owner_id = v_owner and status in ('connecting', 'active', 'ending') and expires_at > v_now
  ) then
    raise exception using errcode = 'P0001', message = 'SESSION_ACTIVE';
  end if;
  insert into public.practice_sessions(
    owner_id, idempotency_key, request_fingerprint, created_at, expires_at,
    person_id, person_version, kind, preset, channel
  ) values (
    v_owner, p_key, p_fingerprint, v_now, v_now + interval '10 minutes',
    p_person_id, p_person_version, 'practice', p_preset, 'text'
  ) returning * into v_session;
  insert into public.text_session_state(session_id, owner_id, role, extras, opening, space_id)
    values (v_session.id, v_owner, p_role, p_extras, p_opening, v_space);
  update public.text_pick_tokens set used_at = v_now where token_hash = p_token_hash;
  return pg_catalog.jsonb_build_object(
    'session', pg_catalog.to_jsonb(v_session),
    'phone', (select phone_e164 from public.text_links where owner_id = v_owner)
  );
end;
$$;

revoke all on function
  public.text_link_begin(text, text, text),
  public.text_link_status(),
  public.text_link_phone(text),
  public.text_unlink(text),
  public.practice_text_acquire(text, uuid, text, uuid, integer, text),
  public.text_state_save(text, uuid, jsonb, jsonb, text),
  public.text_opening(text, uuid),
  public.text_mark_active(text, uuid),
  public.text_end(text, uuid, text),
  public.text_turns_read(text, uuid),
  public.text_turns_purge(text, uuid)
  from public, anon, authenticated;
grant execute on function
  public.text_link_begin(text, text, text),
  public.text_link_status(),
  public.text_link_phone(text),
  public.text_unlink(text),
  public.practice_text_acquire(text, uuid, text, uuid, integer, text),
  public.text_state_save(text, uuid, jsonb, jsonb, text),
  public.text_opening(text, uuid),
  public.text_mark_active(text, uuid),
  public.text_end(text, uuid, text),
  public.text_turns_read(text, uuid),
  public.text_turns_purge(text, uuid)
  to authenticated;

alter function public.text_link_begin(text, text, text) owner to practice_session_executor;
alter function public.text_link_status() owner to practice_session_executor;
alter function public.text_link_phone(text) owner to practice_session_executor;
alter function public.text_unlink(text) owner to practice_session_executor;
alter function public.practice_text_acquire(text, uuid, text, uuid, integer, text) owner to practice_session_executor;
alter function public.text_state_save(text, uuid, jsonb, jsonb, text) owner to practice_session_executor;
alter function public.text_opening(text, uuid) owner to practice_session_executor;
alter function public.text_mark_active(text, uuid) owner to practice_session_executor;
alter function public.text_end(text, uuid, text) owner to practice_session_executor;
alter function public.text_turns_read(text, uuid) owner to practice_session_executor;
alter function public.text_turns_purge(text, uuid) owner to practice_session_executor;

revoke all on function
  public.text_inbound(text, text, text, text, text, text, text),
  public.text_turn_count(text, uuid),
  public.text_pick_activate(text, uuid),
  public.text_record_reply(text, uuid, text),
  public.text_end_inbound(text, uuid, text),
  public.text_pick_save(text, text, text, text),
  public.text_pick_catalog(text, text),
  public.text_pick_person(text, text, uuid, integer, uuid),
  public.text_pick_commit(text, text, uuid, text, uuid, integer, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function
  public.text_inbound(text, text, text, text, text, text, text),
  public.text_turn_count(text, uuid),
  public.text_pick_activate(text, uuid),
  public.text_record_reply(text, uuid, text),
  public.text_end_inbound(text, uuid, text),
  public.text_pick_save(text, text, text, text),
  public.text_pick_catalog(text, text),
  public.text_pick_person(text, text, uuid, integer, uuid),
  public.text_pick_commit(text, text, uuid, text, uuid, integer, text, jsonb, jsonb, text)
  to anon, authenticated;

revoke create on schema public from practice_session_executor;
revoke practice_session_executor from postgres;

commit;
