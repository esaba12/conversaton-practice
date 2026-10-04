-- DATA-01. Additive session attribution. Does not edit the G1 session migration.
-- A saved-person start stores person_id and person_version. A preset or reviewed-role
-- start stores neither. No foreign key: deleting a person must not delete or block the session.
-- The previous practice_acquire signature is dropped only after the new function exists.
begin;

-- Ownership transfer requires membership and CREATE on the function schema. Both are removed before commit.
grant practice_session_executor to postgres;
grant create on schema public to practice_session_executor;

alter table public.practice_sessions
  add column person_id uuid,
  add column person_version integer,
  add constraint practice_sessions_person_pair check (
    (person_id is null and person_version is null)
    or (person_id is not null and person_version is not null and person_version >= 1)
  );

create function public.practice_acquire(
  p_secret text, p_key uuid, p_fingerprint text, p_duration integer,
  p_person_id uuid, p_person_version integer
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
    or (p_person_version is not null and p_person_version < 1) then
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
  insert into public.practice_sessions(
    owner_id, idempotency_key, request_fingerprint, created_at, expires_at, person_id, person_version)
    values (v_owner, p_key, p_fingerprint, v_now,
      v_now + pg_catalog.make_interval(secs => p_duration), p_person_id, p_person_version)
    returning * into v_session;
  return pg_catalog.jsonb_build_object('created', true, 'session', pg_catalog.to_jsonb(v_session));
end;
$$;

alter function public.practice_acquire(text, uuid, text, integer, uuid, integer) owner to practice_session_executor;
revoke all on function public.practice_acquire(text, uuid, text, integer, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.practice_acquire(text, uuid, text, integer, uuid, integer)
  to authenticated;

-- Callers of the four-argument signature are updated in the same change. Drop it only now.
drop function public.practice_acquire(text, uuid, text, integer);

revoke create on schema public from practice_session_executor;
revoke practice_session_executor from postgres;

commit;
