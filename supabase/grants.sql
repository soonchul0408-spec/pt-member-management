-- Supabase SQL Editor에서 기존 PT 스키마와 상담 migration을 적용한 뒤 실행합니다.
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
grant execute on function public.is_pt_staff() to authenticated;
revoke all on function public.is_pt_staff() from public, anon;
revoke all on function public.convert_pt_consultation(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.convert_pt_consultation(uuid, text, jsonb) to authenticated;
grant execute on function public.consume_pt_public_rate_limit(text, integer, integer) to service_role;
grant execute on function public.purge_expired_pt_consultations(integer) to service_role;
