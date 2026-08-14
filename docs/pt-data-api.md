# PT 데이터 API 계약 및 운영 연결 문서

> 상담 API와 Supabase migration은 구현되어 있습니다. 회원·온보딩 REST endpoint는 아직 예정 계약이며, 현재 화면은 기존 Supabase workspace 저장 구조를 사용합니다. 로컬 개발에서만 `localStorage` repository를 선택할 수 있으며, 운영 상담 저장은 API 모드를 사용합니다.

## 1. 현재 프론트 저장 계층

화면은 저장 키나 JSON 형식을 직접 다루지 않습니다.

- 공개 상담: `consultationRepository`
- 회원·회원 관련 기록: `usePtStore` → `memberRepository`
- 회원 온보딩 변환: `usePtStore.saveMemberOnboarding` → `memberOnboarding` 도메인 서비스
- 브라우저 JSON 접근: `storageAdapter`

현재 localStorage 키와 버전은 `src/services/storageKeys.js`에서 관리합니다.

| 영역 | 키 | 현재 형식 | 버전 |
| --- | --- | --- | --- |
| 상담 | `pt-member-management-consultations-v1` | 상담 배열 또는 기존 `consultations`·`items` 컨테이너 | v1 |
| 회원 관리 | `pt-member-management-data-v1` | 회원·수업·기록 배열을 가진 상태 객체 | v1 |
| 로컬 역할 데모 | `pt-member-management-demo-role-v1` | `{ role, memberId }` 객체 | v1 |

localStorage는 브라우저·기기별 데모 저장소이며 운영용 보안 저장소가 아닙니다. Supabase API 모드에서는 상담 신청 데이터가 강사 계정 간 공유됩니다.

## 2. 공통 규칙

- API base URL: `/api/v1`
- 인증: Supabase 로그인 세션의 `Authorization: Bearer <session token>`
- 공개 상담 생성만 비로그인 허용. 서버 rate limit과 개인정보 동의가 필수입니다.
- 상담 목록, 상담자 연락처, 회원·온보딩 정보는 강사 권한 필요
- 회원은 본인 회원 ID에 연결된 공개 필드만 조회
- `trainerNote`, 연락처 등 내부·개인정보 필드는 강사 응답에서만 포함
- route guard는 화면 이동을 위한 장치일 뿐 서버 권한 검증을 대신하지 않음

공통 실패 응답 예시:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "필수 입력값을 확인해 주세요."
  }
}
```

주요 HTTP 상태:

- `200` 조회·수정 성공
- `201` 생성 성공
- `204` 본문 없는 처리 성공
- `400` 형식 오류
- `401` 로그인 필요
- `403` 역할 또는 소유권 없음
- `404` 대상 ID 없음
- `409` 중복 또는 이미 전환된 데이터
- `422` 필수값·상태 전이 검증 실패
- `429` 공개 상담 요청 제한 초과
- `503` 운영 저장·rate limit 설정 또는 연결 불가
- `500` 서버 처리 실패

## 3. 상담 API (현재 구현)

현재 프론트 필드명은 다음과 같습니다.

```json
{
  "id": "consultation-id",
  "name": "상담 신청자 이름",
  "contact": "상담 연락처",
  "goal": "운동 목표",
  "status": "신규 문의",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "completedAt": null,
  "isSample": false,
  "isConvertedToMember": false,
  "convertedMemberId": null,
  "convertedAt": null
}
```

### 상담 목록 조회

- `GET /api/v1/consultations`
- 인증: 강사 필요
- 구현: 삭제되지 않은 실제 상담만 최신순으로 반환하며 샘플은 프론트가 별도로 표시
- 성공 `200`: `{ "items": [...] }` 형식의 실제 상담 목록. 현재 pagination 필드는 반환하지 않음
- 실패 `401`, `403`, `500`

예상 응답:

```json
{
  "items": [
    {
      "id": "consultation-id",
      "name": "상담 신청자 이름",
      "contact": "상담 연락처",
      "goal": "운동 목표",
      "status": "신규 문의",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "isSample": false,
      "isConvertedToMember": false,
      "convertedMemberId": null
    }
  ]
}
```

### 상담 상세 조회

- `GET /api/v1/consultations/:consultationId`
- 인증: 강사 필요
- 요청: path의 상담 ID
- 성공 `200`: `{ "item": { ... } }` 형식의 상담 상세
- 실패 `401`, `403`, `404`, `500`

### 공개 상담 신청 생성

- `POST /api/v1/consultations`
- 인증: 불필요. 개인정보 동의 필수, 서버 rate limit 적용
- 요청:

```json
{
  "name": "상담 신청자 이름",
  "contact": "상담 연락처",
  "goal": "운동 목표",
  "privacyConsent": true
}
```

- 성공 `201`: 생성된 상담의 `id`, `status`, `createdAt` 중심 응답. 공개 응답에는 연락처를 되돌려주지 않음
- 실패 `422`, `429`, `503`, `500`

### 상담 상태 변경

- `PATCH /api/v1/consultations/:consultationId`
- 인증: 강사 필요
- 요청:

```json
{ "status": "상담 예정", "expectedUpdatedAt": "2026-01-01T00:00:00.000Z" }
```

- 허용 상태: `신규 문의`, `상담 예정`, `상담 완료`
- 성공 `200`: `{ "item": { ... } }` 형식의 변경된 상담 객체
- `expectedUpdatedAt`을 보내면 서버가 해당 시점과 일치할 때만 변경하며, 다른 요청이 먼저 변경한 경우 `409 CONCURRENT_UPDATE`
- 실패 `401`, `403`, `404`, `409`, `422`, `500`

### 상담을 회원으로 전환

- `POST /api/v1/consultations/:consultationId/convert`
- 인증: 강사 필요
- 요청: 강사가 확인·수정한 회원 등록 정보

```json
{
  "name": "회원 이름",
  "phone": "회원 연락처",
  "goal": "운동 목표",
  "trainerId": "trainer-id"
}
```

- 성공 `201`: `{ "consultation": { ... }, "member": { ... } }`
- 상담 상태가 완료가 아니거나 이미 전환된 경우 `409` 또는 `422`
- 중복 연락처가 확인되면 `409`와 기존 회원 ID를 반환하되 자동 덮어쓰기는 금지
- 실패 `401`, `403`, `404`, `409`, `422`, `500`

현재 API에서는 `convert_pt_consultation` security definer RPC가 상담 잠금, 중복 연락처 검사, 회원 workspace 삽입, 강사 access 연결, 상담 전환 표시를 하나의 데이터베이스 트랜잭션으로 처리합니다. localStorage 모드에서만 기존 보상 삭제 방식이 사용됩니다.

## 4. 회원 저장 및 예정 API 계약

아래 회원 endpoint는 추후 API로 교체하기 위한 계약 초안이며, 현재 이 저장소에는 해당 Vercel handler가 없습니다. 현재 회원·온보딩 화면은 `usePtStore`가 Supabase `pt_member_workspaces`를 읽고 쓰며, 개발 환경에서는 member data storage를 통해 localStorage를 사용합니다.

현재 회원 기본 구조는 기존 화면 호환을 위해 `contact` 대신 `phone`, `consultationId` 대신 `sourceConsultationId`를 사용합니다.

```json
{
  "id": "member-id",
  "name": "회원 이름",
  "phone": "회원 연락처",
  "email": "",
  "goal": "운동 목표",
  "joinedAt": "2026-01-01",
  "isSample": false,
  "registeredFromConsultation": true,
  "sourceConsultationId": "consultation-id",
  "registeredFromConsultationAt": "2026-01-01T00:00:00.000Z"
}
```

### 회원 목록 조회

- `GET /api/v1/members`
- 인증: 강사 필요. 회원은 본인 1건 조회 API를 사용
- 성공 `200`: 개인정보 정책에 맞춘 회원 요약 배열
- 실패 `401`, `403`, `500`

### 회원 상세 조회

- `GET /api/v1/members/:memberId`
- 인증: 연결된 강사 또는 해당 회원 본인
- 성공 `200`: 역할에 맞는 회원 기본정보·온보딩 요약
- 실패 `401`, `403`, `404`, `500`

### 회원 등록

- `POST /api/v1/members`
- 인증: 강사 필요
- 요청: 이름, 연락처, 운동 목표, 담당 강사 ID, 선택적 상담 연결 ID
- 성공 `201`: 생성된 회원 객체
- 중복 가능성 `409`: 기존 회원을 제시하고 자동 생성하지 않음
- 실패 `401`, `403`, `409`, `422`, `500`

### 회원 정보 수정

- `PATCH /api/v1/members/:memberId`
- 인증: 강사 필요. 회원이 직접 수정하는 필드는 별도 endpoint로 제한
- 요청: 수정 가능한 회원 기본정보의 부분 객체
- 성공 `200`: 수정된 회원 객체
- 실패 `401`, `403`, `404`, `422`, `500`

## 5. 온보딩 예정 API 계약

아래 endpoint 역시 문서 계약만 존재합니다. 실제 운영 API를 추가할 때에는 RLS와 회원 소유권 검증을 서버에서 다시 구현하고, 회원에게는 내부 메모를 반환하지 않아야 합니다.

현재 온보딩 정보는 별도 localStorage 키가 아니라 회원 객체에 함께 저장됩니다.

```json
{
  "memberId": "member-id",
  "exerciseGoal": "운동 목표",
  "experienceLevel": "처음 시작",
  "weeklyFrequency": "주 2회",
  "preferredTime": "저녁",
  "trainerNote": "강사 내부 관리 메모",
  "onboardingStatus": "관리 시작 준비 완료",
  "onboardingCompletedAt": "2026-01-01T00:00:00.000Z"
}
```

### 회원 초기 정보 조회

- `GET /api/v1/members/:memberId/onboarding`
- 인증: 연결된 강사 또는 해당 회원 본인
- 성공 `200`: 회원은 `trainerNote`가 제거된 공개 projection을 받음
- 실패 `401`, `403`, `404`, `500`

### 온보딩 정보 저장

- `PUT /api/v1/members/:memberId/onboarding`
- 인증: 강사 필요
- 요청: `exerciseGoal`, `experienceLevel`, `weeklyFrequency`, `preferredTime`, `trainerNote`
- 성공 `200`: 저장된 온보딩 객체. 상태는 서버에서 계산하거나 검증
- 실패 `401`, `403`, `404`, `422`, `500`

### 온보딩 완료 처리

- `POST /api/v1/members/:memberId/onboarding/complete`
- 인증: 강사 필요
- 요청: `{ "completed": true }`
- 성공 `200`: `onboardingStatus: "관리 시작 준비 완료"`와 `onboardingCompletedAt`
- 필수 운동 목표가 없으면 `422`
- 실패 `401`, `403`, `404`, `422`, `500`

## 6. 저장 데이터 마이그레이션

- 기존 상담 v1 배열, `consultations` 컨테이너, `items` 컨테이너를 계속 읽습니다.
- 기존 회원 v1 상태 객체를 계속 읽고, 호환을 위해 현재는 같은 raw 객체 형식으로 저장합니다.
- `{ "version": 1, "data": ... }` 형태도 읽을 수 있도록 준비했습니다.
- 잘못된 JSON이나 알 수 없는 버전은 삭제하지 않습니다. 화면에는 빈 상태와 저장 오류를 표시하고 새 값으로 덮어쓰지 않습니다.
- 필수 ID가 없거나 중복된 행은 메모리에서 무시합니다. 정상적인 원본 데이터가 자동 삭제되지는 않습니다.
- 샘플 상담·샘플 회원은 실제 입력 데이터와 분리하며 API에는 `isSample: true`를 운영 데이터로 전송하지 않습니다.

마이그레이션 상태는 `loadMemberData()`의 `status`와 `migration` 결과로 개발자가 확인할 수 있습니다. 실제 운영 전에는 서버 migration을 별도로 만들고, 기존 localStorage를 서버로 자동 이관할지 사용자 동의와 중복 정책을 먼저 정해야 합니다.

## 7. API 모드와 변경 지점

화면 컴포넌트는 저장 방식을 직접 알지 않으며, 다음 경계에서 교체합니다.

1. `consultationRepository`가 운영 빌드에서 `/api/v1/consultations`를 호출
2. `ptStore`의 기존 Supabase `pt_member_workspaces` provider가 회원·온보딩을 서버에 저장
3. 로컬 개발에서만 `storageAdapter`와 localStorage 안내를 사용
4. `supabase/schema.sql` 또는 [migration](../supabase/migrations/20260814_pt_consultations.sql)을 적용하고 RLS·RPC를 서버에서 재검증

### 서버 환경변수

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 또는 `VITE_SUPABASE_ANON_KEY`: Vercel 빌드·Supabase 클라이언트
- `SUPABASE_SERVICE_ROLE_KEY`: Vercel API 함수만 사용. 브라우저 변수로 노출 금지
- `PT_CONSULTATION_RETENTION_DAYS`: 기본 180일
- `PT_PUBLIC_RATE_LIMIT`, `PT_PUBLIC_RATE_WINDOW_SECONDS`: 공개 접수 rate limit
- `PT_PRIVACY_POLICY_VERSION`: 동의 당시 정책 버전
- `PT_ALLOW_UNRATED_PUBLIC_CONSULTATIONS`: 개발 환경 외 `false`
- `PT_RATE_LIMIT_SALT`: 공개 rate limit fingerprint용 서버 Secret

보존 만료 처리는 `purge_expired_pt_consultations`를 scheduler 또는 승인된 운영 작업에서 service role로 호출해야 합니다. API·RLS가 구성되지 않은 환경에서는 공개 상담을 운영 데이터처럼 사용하지 마세요.
