-- 좋은 습관 PT 기존 Supabase 프로젝트에 상담 서버 저장을 추가하는 migration입니다.
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요. psql 전용 \i 문은 사용하지 않습니다.

create extension if not exists pgcrypto;

create table if not exists public.pt_consultations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 50),
  contact text not null check (char_length(btrim(contact)) between 1 and 100),
  goal text not null check (char_length(btrim(goal)) between 1 and 500),
  status text not null default '신규 문의' check (status in ('신규 문의', '상담 예정', '상담 완료')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  is_sample boolean not null default false,
  converted_member_id text,
  converted_at timestamptz,
  privacy_consent_at timestamptz not null,
  privacy_policy_version text not null default '2026-01',
  retention_until timestamptz,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint pt_consultations_completed_at_check check (status <> '상담 완료' or completed_at is not null),
  constraint pt_consultations_conversion_check check ((converted_member_id is null) = (converted_at is null))
);

create index if not exists pt_consultations_created_at_idx on public.pt_consultations (created_at desc);
create index if not exists pt_consultations_status_idx on public.pt_consultations (status, created_at desc);

create table if not exists public.pt_consultation_audit (
  id bigint generated always as identity primary key,
  consultation_id uuid references public.pt_consultations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pt_consultation_audit_created_at_idx on public.pt_consultation_audit (created_at desc);

create table if not exists public.pt_public_rate_limits (
  fingerprint text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.pt_consultations enable row level security;
alter table public.pt_consultation_audit enable row level security;
alter table public.pt_public_rate_limits enable row level security;

grant select, update on public.pt_consultations to authenticated;
grant select on public.pt_consultation_audit to authenticated;
grant all on public.pt_consultations, public.pt_consultation_audit, public.pt_public_rate_limits to service_role;
revoke insert on public.pt_consultations from anon, authenticated;
revoke update on public.pt_consultations from authenticated;
grant update (status, completed_at, updated_at) on public.pt_consultations to authenticated;
revoke all on public.pt_public_rate_limits from anon, authenticated;

create or replace function public.is_pt_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_pt_role() in ('instructor', 'editor', 'admin');
$$;

grant execute on function public.is_pt_staff() to authenticated;
revoke all on function public.is_pt_staff() from public, anon;

drop policy if exists "Public can submit consultations with consent" on public.pt_consultations;
create policy "Public can submit consultations with consent"
  on public.pt_consultations for insert to anon, authenticated
  with check (is_sample = false and privacy_consent_at is not null and deleted_at is null);

drop policy if exists "Staff can read consultations" on public.pt_consultations;
create policy "Staff can read consultations"
  on public.pt_consultations for select to authenticated
  using (public.is_pt_staff() and deleted_at is null);

drop policy if exists "Staff can update consultations" on public.pt_consultations;
create policy "Staff can update consultations"
  on public.pt_consultations for update to authenticated
  using (public.is_pt_staff() and deleted_at is null)
  with check (public.is_pt_staff() and is_sample = false);

drop policy if exists "Staff can read consultation audit" on public.pt_consultation_audit;
create policy "Staff can read consultation audit"
  on public.pt_consultation_audit for select to authenticated
  using (public.is_pt_staff());

create or replace function public.audit_pt_consultation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pt_consultation_audit (consultation_id, actor_user_id, action, metadata)
  values (
    new.id,
    auth.uid(),
    case when tg_op = 'INSERT' then 'created' else 'updated' end,
    jsonb_build_object('status', new.status, 'converted_member_id', new.converted_member_id)
  );
  return new;
end;
$$;

drop trigger if exists pt_consultation_audit_trigger on public.pt_consultations;
create trigger pt_consultation_audit_trigger
  after insert or update on public.pt_consultations
  for each row execute procedure public.audit_pt_consultation_change();

create or replace function public.consume_pt_public_rate_limit(
  p_fingerprint text,
  p_limit integer default 5,
  p_window_seconds integer default 3600
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_limit public.pt_public_rate_limits%rowtype;
begin
  if p_fingerprint is null or btrim(p_fingerprint) = '' or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.pt_public_rate_limits (fingerprint, window_started_at, request_count, updated_at)
  values (p_fingerprint, now(), 1, now())
  on conflict (fingerprint) do update
  set window_started_at = case
        when public.pt_public_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now() then now()
        else public.pt_public_rate_limits.window_started_at
      end,
      request_count = case
        when public.pt_public_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now() then 1
        else public.pt_public_rate_limits.request_count + 1
      end,
      updated_at = now()
  returning * into current_limit;

  return current_limit.request_count <= p_limit;
end;
$$;

revoke all on function public.consume_pt_public_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_pt_public_rate_limit(text, integer, integer) to service_role;

create or replace function public.convert_pt_consultation(
  p_consultation_id uuid,
  p_member_id text,
  p_member_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  consultation_row public.pt_consultations%rowtype;
  member_row jsonb;
  duplicate_member_id text;
begin
  if not public.is_pt_staff() then
    raise exception using errcode = '42501', message = 'staff_required';
  end if;

  if p_member_id is null or btrim(p_member_id) = '' or jsonb_typeof(p_member_payload -> 'members') <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_member_payload';
  end if;

  select * into consultation_row
  from public.pt_consultations
  where id = p_consultation_id and deleted_at is null
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'consultation_not_found';
  end if;

  if consultation_row.status <> '상담 완료' then
    raise exception using errcode = '23514', message = 'consultation_not_completed';
  end if;

  if consultation_row.converted_member_id is not null then
    raise exception using errcode = '23505', message = 'consultation_already_converted';
  end if;

  member_row := p_member_payload -> 'members' -> 0;
  if member_row is null
    or jsonb_array_length(p_member_payload -> 'members') <> 1
    or jsonb_typeof(member_row) <> 'object'
    or member_row ->> 'id' <> p_member_id
    or lower(coalesce(member_row ->> 'isSample', 'false')) = 'true'
    or nullif(btrim(member_row ->> 'name'), '') is null
    or char_length(btrim(member_row ->> 'name')) > 50
    or nullif(btrim(member_row ->> 'phone'), '') is null
    or char_length(btrim(member_row ->> 'phone')) > 100
    or nullif(btrim(member_row ->> 'goal'), '') is null
    or char_length(btrim(member_row ->> 'goal')) > 500
    or member_row ->> 'sourceConsultationId' <> p_consultation_id::text then
    raise exception using errcode = '22023', message = 'invalid_member_payload';
  end if;

  select workspace.member_id into duplicate_member_id
  from public.pt_member_workspaces workspace
  cross join lateral jsonb_array_elements(coalesce(workspace.payload -> 'members', '[]'::jsonb)) member
  where workspace.member_id <> p_member_id
    and (
      (
        nullif(regexp_replace(lower(btrim(member ->> 'phone')), '[^0-9]', '', 'g'), '') is not null
        and nullif(regexp_replace(lower(btrim(member ->> 'phone')), '[^0-9]', '', 'g'), '')
          = nullif(regexp_replace(lower(btrim(member_row ->> 'phone')), '[^0-9]', '', 'g'), '')
      )
      or (
        nullif(lower(btrim(member ->> 'phone')), '') is not null
        and lower(btrim(member ->> 'phone')) = lower(btrim(member_row ->> 'phone'))
      )
    )
  limit 1;

  if duplicate_member_id is not null then
    raise exception using errcode = '23505', message = 'duplicate_member', detail = duplicate_member_id;
  end if;

  if exists (select 1 from public.pt_member_workspaces where member_id = p_member_id) then
    raise exception using errcode = '23505', message = 'member_id_exists';
  end if;

  insert into public.pt_member_workspaces (member_id, payload, updated_by)
  values (p_member_id, p_member_payload, auth.uid());

  insert into public.pt_member_access (member_id, user_id, access_role)
  values (p_member_id, auth.uid(), 'instructor')
  on conflict (member_id, user_id) do update set access_role = excluded.access_role;

  update public.pt_consultations
  set converted_member_id = p_member_id, converted_at = now(), updated_at = now()
  where id = p_consultation_id;

  return jsonb_build_object('consultationId', p_consultation_id, 'memberId', p_member_id, 'convertedAt', now());
end;
$$;

revoke all on function public.convert_pt_consultation(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.convert_pt_consultation(uuid, text, jsonb) to authenticated;

create or replace function public.purge_expired_pt_consultations(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.pt_consultations
  set name = '삭제된 상담', contact = '삭제된 정보', goal = '삭제된 정보',
      privacy_consent_at = coalesce(privacy_consent_at, now()),
      deleted_at = now(), updated_at = now()
  where id in (
    select id from public.pt_consultations
    where deleted_at is null and retention_until is not null and retention_until <= now()
    order by retention_until
    limit greatest(p_limit, 1)
  );

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.purge_expired_pt_consultations(integer) from public, anon, authenticated;
grant execute on function public.purge_expired_pt_consultations(integer) to service_role;
