# 운영 연결 전 체크리스트

이 문서는 실제 Supabase·Vercel 계정을 연결하기 전에 확인할 순서입니다. 이 저장소의 점검 문서는 비밀값을 기록하지 않으며, SQL을 자동 실행하지 않습니다.

## 1. Supabase 준비

1. Supabase 프로젝트를 새로 만들거나 사용할 기존 프로젝트를 확인합니다.
2. 기존 PT 기본 스키마(`pt_profiles`, `current_pt_role`, `pt_member_workspaces`, `pt_member_access`)가 먼저 적용되어 있는지 확인합니다.
3. SQL Editor에서 [`supabase/migrations/20260814_pt_consultations.sql`](../supabase/migrations/20260814_pt_consultations.sql)을 검토한 뒤 전체 실행합니다. 이미 기본 스키마를 관리하는 방식이 있다면 그 migration 순서를 따릅니다.
4. SQL 실행 후 `pt_consultations`, `pt_consultation_audit`, `pt_public_rate_limits` 테이블과 RLS, `convert_pt_consultation`, `consume_pt_public_rate_limit`, `purge_expired_pt_consultations` 함수를 확인합니다.
5. 테스트 계정으로 강사·일반 회원·권한 없는 계정의 조회와 변경 권한을 각각 확인합니다.

실행한 SQL은 Supabase migration 기록과 별도로 운영 문서에 남기고, 기존 테이블을 삭제하는 방식의 롤백은 수행하지 않습니다. 문제가 있으면 백업과 영향 범위를 확인한 뒤 별도의 검토된 보정 SQL을 사용합니다.

## 2. Vercel 환경변수

Vercel의 Preview와 Production을 구분해 다음 변수 이름을 등록합니다. 실제 값은 Secret 또는 Vercel 환경변수 UI에서만 관리합니다.

- 클라이언트·인증: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 또는 `VITE_SUPABASE_ANON_KEY`
- 상담 API 서버: `SUPABASE_SERVICE_ROLE_KEY`, `PT_PRIVACY_POLICY_VERSION`, `PT_CONSULTATION_RETENTION_DAYS`, `PT_PUBLIC_RATE_LIMIT`, `PT_PUBLIC_RATE_WINDOW_SECONDS`, `PT_RATE_LIMIT_SALT`
- 운영 우회 금지: `PT_ALLOW_UNRATED_PUBLIC_CONSULTATIONS`는 Production에서 `false` 또는 미설정
- 선택 기능: `VITE_MEMBER_LOGIN_EMAIL`, `NOTION_VIDEO_MAP_JSON`, `NOTION_SESSION_CONTENT_B64`
- 프론트 동작: `VITE_PT_DATA_MODE`, `VITE_PT_API_BASE_URL`, `VITE_REQUIRE_AUTH`

`SUPABASE_SERVICE_ROLE_KEY`와 `PT_RATE_LIMIT_SALT`에는 `VITE_` 접두사를 붙이지 않습니다. 두 값은 Vercel Serverless Function에서만 사용하며, 프론트 환경변수나 저장소에 복사하지 않습니다.

## 3. 개발·운영 차이

- 개발 빌드: `VITE_PT_DATA_MODE`를 비우면 상담은 localStorage 데모 저장을 사용합니다. Supabase 키가 없어도 공개 화면과 역할 데모를 확인할 수 있습니다.
- 운영 빌드: Vite production 빌드는 상담 저장을 `/api/v1/consultations`로 보냅니다. API가 실패하면 완료 화면을 표시하지 않으며 localStorage로 조용히 대체하지 않습니다.
- localStorage 데이터는 브라우저·기기별 데모일 뿐 서버 데이터와 자동으로 합쳐지지 않습니다.
- 화면의 route guard는 UX 장치이고, 최종 권한은 Supabase RLS·RPC·Vercel API에서 다시 검증합니다.

## 4. 연결 후 수동 테스트

1. 공개 상담 화면에서 동의하지 않고 제출했을 때 요청이 차단되는지 확인합니다.
2. 이름·연락처·운동 목표와 동의 후 상담을 신청하고, API 성공 응답 뒤에만 완료 화면이 표시되는지 확인합니다.
3. 강사 계정으로 상담 목록을 새로고침해 신청 문의가 보이는지 확인합니다.
4. 일반 회원과 권한 없는 계정이 상담 목록·연락처를 조회하거나 상태를 변경할 수 없는지 확인합니다.
5. 상담 상태를 `상담 예정` → `상담 완료`로 변경하고 새로고침 후 유지되는지 확인합니다.
6. 상담 상세에서 회원 등록을 준비하고, 이름·연락처·목표를 수정한 뒤 한 번에 전환합니다.
7. 같은 상담을 두 탭에서 동시에 전환하거나 상태 변경해 중복 회원·덮어쓰기가 발생하지 않는지 확인합니다.
8. 연락처가 같은 회원이 있을 때 `409` 안내와 기존 회원 확인 선택지가 표시되는지 확인합니다.
9. 여러 번 연속으로 공개 상담을 신청해 `429` 안내가 표시되는지 확인합니다. 실제 운영에서는 과도한 테스트 데이터를 만들지 않습니다.
10. 손상된 요청, 잘못된 ID, 네트워크 중단, API `401/403/409/422/500` 응답에서 저장 완료로 오인되지 않는지 확인합니다.

## 5. 보존·개인정보·장애 대응

1. `PT_CONSULTATION_RETENTION_DAYS`와 `PT_PRIVACY_POLICY_VERSION`을 실제 정책과 맞춥니다.
2. 승인된 scheduler 또는 운영 작업에서 service role로 `purge_expired_pt_consultations`를 호출하고, 익명화 결과와 감사 로그를 확인합니다.
3. [`/privacy`](../src/views/PublicPrivacyView.vue) 템플릿을 실제 처리방침·사업자 정보·문의 방법으로 교체하고 법률·개인정보 담당 검토를 받습니다.
4. Vercel Function 로그, Supabase Auth·RLS·Database 로그, rate limit 테이블을 개인정보를 직접 출력하지 않는 범위에서 확인합니다.
5. 장애 시 먼저 Vercel 배포를 이전 정상 배포로 롤백하고, API 환경변수·Supabase 로그·RLS/RPC 변경 이력을 확인합니다. 데이터를 삭제하거나 테이블을 즉시 되돌리는 SQL은 백업과 영향 검토 후 별도로 실행합니다.

## 6. 사전 점검 명령

```bash
npm run preflight
npm run lint -- --no-fix
npm run build
git diff --check
```

`preflight`는 환경변수의 이름·존재·형식과 파일·프론트 노출 여부만 확인합니다. 실제 환경변수 값 출력, Supabase 접속, SQL 실행, 데이터 변경은 하지 않습니다.
