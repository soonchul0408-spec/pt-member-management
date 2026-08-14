export const CONSULTATION_STATUSES = Object.freeze(['신규 문의', '상담 예정', '상담 완료'])

export const CONSULTATION_STATUS_TYPES = Object.freeze({
  '신규 문의': 'warning',
  '상담 예정': 'primary',
  '상담 완료': 'success',
})

// 공개 화면의 구조를 보여주기 위한 데이터입니다. 실제 문의와 저장 데이터를 섞지 않습니다.
export const SAMPLE_CONSULTATIONS = Object.freeze([
  {
    id: 'sample-001',
    name: '샘플 문의 A',
    contact: '데모용 연락처',
    goal: '운동을 꾸준히 이어가고 싶어 1:1 PT 관리 방식을 문의했습니다.',
    status: '신규 문의',
    createdAt: '2026-08-14T10:20:00+09:00',
    completedAt: null,
    isSample: true,
    isConvertedToMember: false,
    convertedMemberId: null,
    convertedAt: null,
  },
  {
    id: 'sample-002',
    name: '샘플 문의 B',
    contact: '데모용 연락처',
    goal: '오래 앉아 있는 생활 습관을 바꾸고 맞춤 운동을 상담받고 싶습니다.',
    status: '상담 예정',
    createdAt: '2026-08-13T16:40:00+09:00',
    completedAt: null,
    isSample: true,
    isConvertedToMember: false,
    convertedMemberId: null,
    convertedAt: null,
  },
  {
    id: 'sample-003',
    name: '샘플 문의 C',
    contact: '데모용 연락처',
    goal: '기록을 기반으로 매주 운동 방향을 점검하는 관리에 관심이 있습니다.',
    status: '상담 완료',
    createdAt: '2026-08-12T09:10:00+09:00',
    completedAt: '2026-08-12T18:00:00+09:00',
    isSample: true,
    isConvertedToMember: false,
    convertedMemberId: null,
    convertedAt: null,
  },
])
