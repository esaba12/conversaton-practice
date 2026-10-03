-- G1 only. The coordinator separately provisions a random server capability.
-- No runtime service-role key or browser-writable provider associations.
begin;

create extension if not exists pgcrypto with schema extensions;
create schema practice_private;
revoke all on schema practice_private from public, anon, authenticated;

create role practice_session_executor nologin noinherit nobypassrls;
grant practice_session_executor to postgres;
grant usage on schema public, practice_private, auth, extensions to practice_session_executor;
-- Ownership transfer requires CREATE temporarily; remove it before commit.
grant create on schema public, practice_private to practice_session_executor;
grant execute on function auth.uid(), auth.jwt() to practice_session_executor;
grant execute on function extensions.digest(text, text) to practice_session_executor;

create table practice_private.server_capability (
  singleton boolean primary key default true check (singleton),
  secret_hash bytea not null check (pg_catalog.octet_length(secret_hash) = 32)
);
revoke all on practice_private.server_capability from public, anon, authenticated;
grant select on practice_private.server_capability to practice_session_executor;

create table public.practice_sessions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  request_fingerprint text not null check (pg_catalog.length(request_fingerprint) between 1 and 128),
  status text not null default 'connecting'
    check (status in ('connecting', 'active', 'ending', 'ended', 'interrupted', 'deleted')),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  expires_at timestamptz not null,
  connected_at timestamptz,
  ended_at timestamptz,
  provider_conversation_id text unique
    check (pg_catalog.length(provider_conversation_id) between 1 and 256),
  cleanup text not null default 'not_started'
    check (cleanup in ('not_started', 'pending', 'confirmed', 'unresolved')),
  unique (owner_id, idempotency_key),
  check (expires_at > created_at)
);
create unique index practice_sessions_one_active_owner
  on public.practice_sessions(owner_id)
  where status in ('connecting', 'active', 'ending');
alter table public.practice_sessions enable row level security;
alter table public.practice_sessions force row level security;
revoke all on public.practice_sessions from public, anon, authenticated;
grant select on public.practice_sessions to authenticated;
grant select, insert, update on public.practice_sessions to practice_session_executor;
create policy practice_sessions_owner_read on public.practice_sessions
  for select to authenticated
  using (owner_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false');
create policy practice_sessions_executor_owner on public.practice_sessions
  for all to practice_session_executor
  using (owner_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false')
  with check (owner_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false');

create function practice_private.require_owner(p_secret text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_owner uuid := auth.uid();
begin
  if v_owner is null or (auth.jwt() ->> 'is_anonymous') is distinct from 'false'
    or p_secret is null or pg_catalog.octet_length(p_secret) not between 32 and 512
    or not exists (
      select 1 from practice_private.server_capability c
      where c.singleton and c.secret_hash = extensions.digest(p_secret, 'sha256')
    ) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  -- Serializes all owner mutations, including the no-session-row-yet case.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_owner::text, 0));
  return v_owner;
end;
$$;

create function public.practice_acquire(p_secret text, p_key uuid, p_fingerprint text, p_duration integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_key is null or p_fingerprint is null
    or pg_catalog.length(p_fingerprint) not between 1 and 128
    or p_duration is null or p_duration not in (180, 300) then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  update public.practice_sessions set status = 'interrupted', ended_at = v_now,
    cleanup = case when cleanup = 'confirmed' then cleanup
      when provider_conversation_id is null then 'unresolved'
      when cleanup = 'unresolved' then cleanup else 'pending' end
    where owner_id = v_owner and status in ('connecting', 'active', 'ending')
      and expires_at <= v_now;
  select * into v_session from public.practice_sessions
    where owner_id = v_owner and idempotency_key = p_key;
  if found then
    if v_session.request_fingerprint <> p_fingerprint then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    return pg_catalog.jsonb_build_object('created', false, 'session', pg_catalog.to_jsonb(v_session));
  end if;
  if exists (select 1 from public.practice_sessions
    where owner_id = v_owner and status in ('connecting', 'active', 'ending')) then
    raise exception using errcode = 'P0001', message = 'SESSION_ACTIVE';
  end if;
  insert into public.practice_sessions(owner_id, idempotency_key, request_fingerprint, created_at, expires_at)
    values (v_owner, p_key, p_fingerprint, v_now,
      v_now + pg_catalog.make_interval(secs => p_duration)) returning * into v_session;
  return pg_catalog.jsonb_build_object('created', true, 'session', pg_catalog.to_jsonb(v_session));
end;
$$;

create function public.practice_bind(p_secret text, p_id uuid, p_provider_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
begin
  select * into v_session from public.practice_sessions where id = p_id and owner_id = v_owner for update;
  if not found then raise exception using errcode = 'P0001', message = 'FORBIDDEN'; end if;
  if p_provider_id is null or pg_catalog.length(p_provider_id) not between 1 and 256 then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  if v_session.provider_conversation_id is not null and v_session.provider_conversation_id <> p_provider_id then
    raise exception using errcode = 'P0001', message = 'ASSOCIATION_CONFLICT';
  end if;
  update public.practice_sessions set provider_conversation_id = p_provider_id,
    cleanup = case when status in ('ended', 'interrupted', 'deleted') and cleanup = 'not_started'
      then 'pending' else cleanup end
    where id = p_id and owner_id = v_owner returning * into v_session;
  return pg_catalog.to_jsonb(v_session);
exception when unique_violation then
  raise exception using errcode = 'P0001', message = 'ASSOCIATION_CONFLICT';
end;
$$;

create function public.practice_connected(p_secret text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
begin
  select * into v_session from public.practice_sessions where id = p_id and owner_id = v_owner for update;
  if not found then raise exception using errcode = 'P0001', message = 'FORBIDDEN'; end if;
  if v_session.status not in ('connecting', 'active') then
    raise exception using errcode = 'P0001', message = 'SESSION_CLOSED';
  end if;
  if v_session.expires_at <= pg_catalog.clock_timestamp() then
    raise exception using errcode = 'P0001', message = 'SESSION_EXPIRED';
  end if;
  if v_session.provider_conversation_id is null then
    raise exception using errcode = 'P0001', message = 'ASSOCIATION_REQUIRED';
  end if;
  update public.practice_sessions set status = 'active',
    connected_at = coalesce(connected_at, pg_catalog.clock_timestamp())
    where id = p_id and owner_id = v_owner returning * into v_session;
  return pg_catalog.to_jsonb(v_session);
end;
$$;

create function public.practice_end(p_secret text, p_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
begin
  select * into v_session from public.practice_sessions where id = p_id and owner_id = v_owner for update;
  if not found then raise exception using errcode = 'P0001', message = 'FORBIDDEN'; end if;
  if p_reason is null or p_reason not in ('user', 'auth_loss', 'navigation', 'connection_failure', 'time_limit') then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  if v_session.status in ('ended', 'interrupted', 'deleted') then return pg_catalog.to_jsonb(v_session); end if;
  update public.practice_sessions set
    status = case when p_reason in ('auth_loss', 'connection_failure')
      or expires_at <= pg_catalog.clock_timestamp() then 'interrupted' else 'ended' end,
    ended_at = pg_catalog.clock_timestamp(),
    cleanup = case when cleanup in ('confirmed', 'unresolved') then cleanup
      when provider_conversation_id is null then 'unresolved' else 'pending' end
    where id = p_id and owner_id = v_owner returning * into v_session;
  return pg_catalog.to_jsonb(v_session);
end;
$$;

create function public.practice_cleanup(p_secret text, p_id uuid, p_cleanup text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := practice_private.require_owner(p_secret);
  v_session public.practice_sessions%rowtype;
begin
  select * into v_session from public.practice_sessions where id = p_id and owner_id = v_owner for update;
  if not found then raise exception using errcode = 'P0001', message = 'FORBIDDEN'; end if;
  if p_cleanup is null or p_cleanup not in ('pending', 'confirmed', 'unresolved') then
    raise exception using errcode = 'P0001', message = 'INVALID_INPUT';
  end if;
  if v_session.status not in ('ended', 'interrupted', 'deleted')
    or (v_session.cleanup = 'confirmed' and p_cleanup <> 'confirmed')
    or (v_session.cleanup = 'unresolved' and p_cleanup = 'pending')
    or (p_cleanup = 'confirmed' and v_session.provider_conversation_id is null) then
    raise exception using errcode = 'P0001', message = 'INVALID_TRANSITION';
  end if;
  update public.practice_sessions set cleanup = p_cleanup
    where id = p_id and owner_id = v_owner returning * into v_session;
  return pg_catalog.to_jsonb(v_session);
end;
$$;

alter function practice_private.require_owner(text) owner to practice_session_executor;
alter function public.practice_acquire(text, uuid, text, integer) owner to practice_session_executor;
alter function public.practice_bind(text, uuid, text) owner to practice_session_executor;
alter function public.practice_connected(text, uuid) owner to practice_session_executor;
alter function public.practice_end(text, uuid, text) owner to practice_session_executor;
alter function public.practice_cleanup(text, uuid, text) owner to practice_session_executor;
revoke all on function practice_private.require_owner(text) from public, anon, authenticated;
revoke all on function public.practice_acquire(text, uuid, text, integer),
  public.practice_bind(text, uuid, text), public.practice_connected(text, uuid),
  public.practice_end(text, uuid, text), public.practice_cleanup(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.practice_acquire(text, uuid, text, integer),
  public.practice_bind(text, uuid, text), public.practice_connected(text, uuid),
  public.practice_end(text, uuid, text), public.practice_cleanup(text, uuid, text)
  to authenticated;
revoke create on schema public, practice_private from practice_session_executor;
revoke practice_session_executor from postgres;

commit;
