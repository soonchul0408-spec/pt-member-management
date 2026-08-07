-- Supabase SQL Editor에서 기존 PT 스키마에 한 번 실행합니다.
-- 로그인한 회원과 지정된 강사가 private workspace를 읽고 쓸 수 있게 합니다.

grant usage on schema public to authenticated;

grant select
on public.pt_profiles, public.pt_member_access, public.pt_member_workspaces
to authenticated;

grant insert, update
on public.pt_member_workspaces
to authenticated;

grant execute on function public.current_pt_role() to authenticated;
grant execute on function public.current_pt_member_id() to authenticated;
grant execute on function public.has_pt_member_access(text) to authenticated;
