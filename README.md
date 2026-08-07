# 좋은 습관 PT 회원관리

Vue 3, Vite, Pinia, Element Plus, Supabase를 사용하는 PT 회원관리 화면입니다.

## 운영 주소

https://pt-member-management.vercel.app/

회원별 기록은 Supabase의 인증·RLS 정책으로 보호하고, 프론트엔드에는 개인 Notion 원본을 포함하지 않습니다.

## 다른 Mac에서 시작하기

```bash
git clone <GitHub 저장소 주소>
cd pt-member-management
npm install
```

로컬에서 Supabase 연결이 필요하면 Vercel 프로젝트를 연결한 뒤 운영 환경변수를 `.env.local`로 받아옵니다. `.env.local`은 Git에 포함되지 않습니다.

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local --environment production
npm run dev
```

Vercel CLI를 사용하지 않는 경우 `.env.example`을 `.env.local`로 복사하고 값을 직접 입력합니다. API 키·비밀번호·서비스 롤 키는 저장소에 올리지 않습니다.

## 주요 명령

```bash
npm run dev
npm run lint
npm run build
```

## 데이터 및 보안 주의사항

- `private-data/`: Notion에서 가져온 개인 원본과 가져오기 스크립트. Git·Vercel 배포에서 제외됩니다.
- `.env.local`: Supabase 연결값과 로그인 설정. Git에 올리지 않습니다.
- 실제 회원 데이터는 Supabase `pt_member_workspaces`에 저장됩니다.
- Supabase SQL Editor에는 `supabase/schema.sql`의 RLS·권한 설정이 적용되어 있어야 합니다.
- 회원 계정은 연결된 본인 작업공간만, 지정된 강사 계정은 연결된 회원 작업공간만 조회합니다.

## 화면 경로

- 회원 대시보드: `/pt/member/dashboard`
- 회원 PT 일정·가져온 회차 기록: `/pt/member/schedule`
- 오늘의 운동: `/pt/member/workouts`
- 운동·식단 기록: `/pt/member/journal`
- 소통·피드백: `/pt/member/communication`
- 강사 대시보드: `/pt/dashboard`
