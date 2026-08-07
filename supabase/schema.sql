-- 좋은 습관 PT 회원 전용 데이터베이스 구조
-- Supabase SQL Editor에서 새 프로젝트에 실행하거나 기존 PT 스키마를 교체할 때 사용합니다.
-- 회원별 작업공간과 접근 목록을 분리해, 로그인한 회원과 지정된 강사만 같은 회원 데이터를 읽고 쓸 수 있게 합니다.

create table if not exists public.pt_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'member',
  member_id text,
  studio text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.pt_profiles add column if not exists member_id text;
alter table public.pt_profiles alter column role set default 'member';
alter table public.pt_profiles drop constraint if exists pt_profiles_role_check;
alter table public.pt_profiles
  add constraint pt_profiles_role_check check (role in ('member', 'instructor', 'admin', 'viewer', 'editor'));

create table if not exists public.pt_member_access (
  member_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_role text not null check (access_role in ('member', 'instructor')),
  created_at timestamptz not null default now(),
  primary key (member_id, user_id)
);

create table if not exists public.pt_member_workspaces (
  member_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- 이전 버전의 공유 작업공간은 앱에서 더 이상 사용하지 않습니다.
-- 기존 데이터는 삭제하지 않되, 일반 로그인 사용자의 접근은 차단합니다.
create table if not exists public.pt_workspace_state (
  id text primary key default 'default',
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.pt_profiles enable row level security;
alter table public.pt_member_access enable row level security;
alter table public.pt_member_workspaces enable row level security;
alter table public.pt_workspace_state enable row level security;

-- SQL Editor에서 직접 만든 테이블은 프로젝트 설정에 따라 API 역할 권한이
-- 자동으로 부여되지 않을 수 있으므로, 로그인 사용자에게 필요한 권한을 명시합니다.
grant usage on schema public to authenticated;
grant select on public.pt_profiles, public.pt_member_access, public.pt_member_workspaces to authenticated;
grant insert, update on public.pt_member_workspaces to authenticated;

create or replace function public.current_pt_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.pt_profiles where id = auth.uid()), 'member');
$$;

create or replace function public.current_pt_member_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select member_id from public.pt_profiles where id = auth.uid();
$$;

create or replace function public.has_pt_member_access(target_member_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_pt_role() = 'admin'
    or exists (
      select 1
      from public.pt_member_access access
      where access.member_id = target_member_id
        and access.user_id = auth.uid()
    );
$$;

grant execute on function public.current_pt_role() to authenticated;
grant execute on function public.current_pt_member_id() to authenticated;
grant execute on function public.has_pt_member_access(text) to authenticated;

create or replace function public.handle_new_pt_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pt_profiles (id, name, role, member_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, '사용자'), '@', 1)),
    'member',
    new.raw_user_meta_data ->> 'member_id'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_pt on auth.users;
create trigger on_auth_user_created_pt
  after insert on auth.users
  for each row execute procedure public.handle_new_pt_user();

drop policy if exists "Users can read their own PT profile" on public.pt_profiles;
drop policy if exists "Users can read their own profile" on public.pt_profiles;
create policy "Users can read their own PT profile"
  on public.pt_profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "Users can read their own PT access" on public.pt_member_access;
create policy "Users can read their own PT access"
  on public.pt_member_access for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Members and assigned instructors can read private workspaces" on public.pt_member_workspaces;
create policy "Members and assigned instructors can read private workspaces"
  on public.pt_member_workspaces for select to authenticated
  using (public.has_pt_member_access(member_id));

drop policy if exists "Members and assigned instructors can create private workspaces" on public.pt_member_workspaces;
create policy "Members and assigned instructors can create private workspaces"
  on public.pt_member_workspaces for insert to authenticated
  with check (public.has_pt_member_access(member_id));

drop policy if exists "Members and assigned instructors can update private workspaces" on public.pt_member_workspaces;
create policy "Members and assigned instructors can update private workspaces"
  on public.pt_member_workspaces for update to authenticated
  using (public.has_pt_member_access(member_id))
  with check (public.has_pt_member_access(member_id));

-- 이전 공유 작업공간 정책은 제거합니다. 정책이 없는 RLS 테이블은 일반 사용자가 읽을 수 없습니다.
drop policy if exists "Authenticated users can read workspace" on public.pt_workspace_state;
drop policy if exists "Editors can create workspace" on public.pt_workspace_state;
drop policy if exists "Editors can update workspace" on public.pt_workspace_state;
revoke all on public.pt_workspace_state from anon, authenticated;

-- 계정 생성 후 관리자 계정에서 아래와 같이 역할과 회원 연결을 설정합니다.
-- update public.pt_profiles set role = 'instructor' where id = '강사_AUTH_USER_UUID';
-- update public.pt_profiles set role = 'member', member_id = 'member-notion-1' where id = '회원_AUTH_USER_UUID';
-- insert into public.pt_member_access (member_id, user_id, access_role)
-- values ('member-notion-1', '회원_AUTH_USER_UUID', 'member'), ('member-notion-1', '강사_AUTH_USER_UUID', 'instructor');
