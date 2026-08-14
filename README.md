# 좋은 습관 PT 회원관리

신규 방문자가 트레이너의 관리 방식을 확인하고 상담을 신청할 수 있도록 만든 Vue 3 기반 PT 회원관리 프로토타입입니다. 회원·강사 대시보드, 상담 관리, 상담에서 회원으로의 전환, 회원 온보딩 흐름을 하나의 화면 구조로 확인할 수 있습니다.

## 기술 스택

- Vue 3, Vite, Vue Router
- Pinia, Element Plus
- Supabase 인증·RLS 연동 구조
- Vercel 정적 SPA 배포 및 선택적 Serverless Function

## 시작하기

```bash
git clone https://github.com/soonchul0408-spec/pt-member-management.git
cd pt-member-management
npm install
npm run dev
```

검증 명령:

```bash
npm run lint
npm run preflight
npm run build
npm run preview
```

현재 `package.json`에는 별도 타입 검사와 테스트 스크립트가 없습니다.

## 화면 경로와 접근 범위

공개 화면:

- `/` — 서비스·트레이너 소개와 신규 상담 CTA
- `/pt/member/preview` — 개인정보가 없는 회원 화면 샘플
- `/pt/consultation` — 신규 회원 상담 신청 데모
- `/privacy` — 상담 입력 정보와 데모 한계를 설명하는 개인정보 안내 템플릿

강사 전용 화면:

- `/pt/login` — Supabase 로그인
- `/pt/dashboard` — 강사 대시보드
- `/pt/members` — 회원 목록
- `/pt/members/:id` — 회원 상세 및 온보딩
- `/pt/consultations` — 신규 상담 관리

회원 전용 화면:

- `/pt/member/dashboard` — 회원 대시보드
- `/pt/member/schedule` — 일정·회차 기록
- `/pt/member/workouts` — 운동 과제
- `/pt/member/journal` — 운동·컨디션 기록
- `/pt/member/communication` — 강사 소통
- `/pt/member/progress` — 진행 상황

운영 빌드에서는 인증이 기본으로 요구됩니다. 비로그인 사용자는 공개 화면만 이용할 수 있고, 강사·회원 경로는 기존 Vue Router 가드에 따라 로그인 화면 또는 역할별 화면으로 이동합니다. 로컬 개발에서는 Supabase 환경변수가 없을 때 역할 데모를 사용할 수 있습니다.

## 신규 회원 모집 흐름

```text
공개 메인
→ 회원 화면 미리보기
→ 상담 신청
→ 상담 완료 안내
→ 강사 상담 관리
→ 상담 완료 상태 지정
→ 회원 등록 준비·중복 확인
→ 회원 등록
→ 회원 상세의 초기 관리 정보 설정
→ 온보딩 완료
→ 회원 목록·회원 대시보드 확인
```

상담에서 회원으로 전환할 때 이름·연락처·운동 목표를 미리 입력하고, 강사가 확인한 뒤 등록합니다. 온보딩에서는 운동 목표, 운동 경험, 주당 희망 횟수, 선호 시간대, 트레이너 내부 메모, 완료 상태를 관리합니다.

## 데이터 저장 방식

저장 구현은 `consultationRepository`, `memberRepository`, 기존 Supabase workspace 저장 계층으로 분리되어 있습니다. 운영 빌드에서는 Supabase와 Vercel API가 설정된 경우 상담을 서버에 저장하고, 로컬 개발에서는 별도 API 설정이 없을 때 브라우저 데모 저장으로 동작합니다.

- 상담: `pt-member-management-consultations-v1`
- 회원 관리 데이터: `pt-member-management-data-v1`
- 로컬 데모 역할 선택: `pt-member-management-demo-role-v1`

샘플 상담과 초기 샘플 회원은 `isSample`로 구분하고, 공개 상담 신청으로 생성된 데이터는 샘플과 분리합니다. 잘못된 JSON이나 이전 회원 형식은 가능한 범위에서 빈 상태·초기 설정 필요 상태로 안전하게 처리합니다.

`localStorage` 데모는 브라우저별·기기별 저장 방식이며 암호화된 운영용 저장소가 아닙니다. 운영 모드에서는 상담 신청이 `/api/v1/consultations`를 통해 Supabase `pt_consultations`에 저장되어 인증된 강사 화면에서 공유됩니다. API 환경변수가 빠진 운영 배포는 상담 접수를 안전하게 중단하도록 구성해야 합니다.

## 저장 계층과 API

화면은 localStorage 키와 JSON 형식을 직접 다루지 않습니다. 상담은 `consultationRepository`, 회원·회원 관련 기록은 `usePtStore`와 `memberRepository`, 온보딩 변환은 `memberOnboarding` 서비스가 담당합니다. 브라우저 저장 접근은 `src/services/storageAdapter.js` 한 곳에서 안전하게 처리합니다.

상담 서버 API와 Supabase migration은 이번 단계에서 준비했습니다. endpoint·권한·응답 구조는 [docs/pt-data-api.md](docs/pt-data-api.md), 데이터베이스 정책은 [supabase/migrations/20260814_pt_consultations.sql](supabase/migrations/20260814_pt_consultations.sql)에 정리했습니다. 회원·온보딩은 기존 `pt_member_workspaces`와 RLS를 유지하고, 상담 완료→회원 전환은 서버 RPC로 원자 처리합니다.

실제 Supabase·Vercel 연결 순서와 운영 전 수동 테스트는 [docs/operations-checklist.md](docs/operations-checklist.md)에 정리했습니다. `npm run preflight`는 비밀값을 출력하거나 외부 서비스에 접속하지 않고 배포에 필요한 환경변수 이름·존재·형식, 필수 파일, 프론트 번들 노출 여부만 점검합니다.

## Supabase·Vercel 환경변수

실제 로그인과 회원별 서버 저장을 사용할 때만 Vercel 프로젝트에 다음 값을 설정합니다. 값 자체는 저장소에 올리지 않습니다.

클라이언트·Supabase:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` 또는 기존 호환용 `VITE_SUPABASE_ANON_KEY`
- `VITE_MEMBER_LOGIN_EMAIL` — 회원 로그인 화면에서 이메일을 숨길 때 선택
- `VITE_REQUIRE_AUTH` — 개발 환경에서 보호 모드를 명시할 때 사용
- `VITE_LOCAL_EDITOR_MODE` — 개발 환경 전용 편집 모드 설정
- `VITE_PT_DATA_MODE` — `api` 또는 `local`; 비워두면 운영 빌드는 API, 개발은 localStorage 기본값
- `VITE_PT_API_BASE_URL` — 기본값 `/api/v1`

Vercel Serverless Function(`/api/session-video`)를 사용할 때의 서버 환경변수:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` 또는 `VITE_SUPABASE_ANON_KEY`
- `NOTION_VIDEO_MAP_JSON`
- `NOTION_SESSION_CONTENT_B64`
- `SUPABASE_SERVICE_ROLE_KEY` — 공개 상담 rate limit·보존 작업용 서버 전용 Secret
- `PT_PRIVACY_POLICY_VERSION`
- `PT_CONSULTATION_RETENTION_DAYS`
- `PT_PUBLIC_RATE_LIMIT`
- `PT_PUBLIC_RATE_WINDOW_SECONDS`
- `PT_ALLOW_UNRATED_PUBLIC_CONSULTATIONS` — 개발 환경 외에는 `false` 유지
- `PT_RATE_LIMIT_SALT` — rate limit fingerprint용 서버 Secret

`service_role` 키, 비밀번호, 개인 원본은 클라이언트 변수나 저장소에 넣지 않습니다. Supabase를 운영에 연결할 때는 `supabase/schema.sql`의 RLS 정책과 필요한 경우 `supabase/grants.sql`을 먼저 적용해야 합니다.

## Vercel 배포

Vite의 기본 빌드 결과인 `dist`를 사용합니다. 저장소의 `vercel.json`은 Vue Router의 직접 접속·새로고침을 위한 SPA fallback을 제공합니다. 배포 전에는 다음을 확인합니다.

1. Vercel 프로젝트의 Root Directory가 이 저장소 루트인지 확인
2. Supabase URL·publishable key·서버 전용 Secret과 보존·rate limit 환경변수 등록
3. `supabase/schema.sql` 또는 기존 프로젝트용 migration을 Supabase SQL Editor에 적용
4. 배포 후 `/`, `/pt/member/preview`, `/pt/consultation`, `/privacy` 직접 접속 확인
5. 로그인 후 `/pt/dashboard`, `/pt/consultations`, `/pt/member/dashboard` 권한 확인
6. 공개 상담 신청이 강사 계정의 상담 목록에 나타나는지 확인
7. `/api/session-video`를 사용하는 경우 인증된 요청의 응답 확인

운영 빌드는 환경변수가 빠져도 내부 화면이 데모 권한으로 열리지 않도록 인증을 기본 요구합니다. Supabase 환경변수 없이 운영 배포하면 공개 화면은 열리지만 로그인 기능은 동작하지 않습니다.

## 백엔드 연결 후에도 필요한 운영 작업

- Supabase migration을 실제 프로젝트에 적용하고 정책·RPC를 계정별로 검증
- 회원·온보딩 workspace의 서버 저장, 갱신 이력, 삭제·보존 작업 검증
- 연락처 등 개인정보의 접근 로그·동의·실제 개인정보 처리방침과 담당자 연락처 마련
- 보존 기간 만료 시 `purge_expired_pt_consultations`를 승인된 scheduler/운영 작업에서 호출
- 운영용 오류 모니터링, 백업, CAPTCHA 또는 추가 봇 방어, 상담 알림 연동
- localStorage 데모 데이터와 운영 데이터를 완전히 분리하고 임의 이관하지 않기
