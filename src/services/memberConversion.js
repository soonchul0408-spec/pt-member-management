function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function createMemberDraftFromConsultation(consultation, { trainerId = '', joinedAt = new Date().toISOString().slice(0, 10) } = {}) {
  if (!consultation || typeof consultation !== 'object') return null

  const goal = normalizeText(consultation.goal)
  return {
    name: normalizeText(consultation.name),
    phone: normalizeText(consultation.contact),
    email: '',
    birthYear: '',
    gender: '남성',
    joinedAt,
    trainerId,
    goal,
    caution: '',
    status: '활성',
    avatarColor: '#dbeafe',
    isSample: false,
    onboardingStatus: '초기 설정 필요',
    exerciseGoal: goal,
    experienceLevel: '',
    weeklyFrequency: '',
    preferredTime: '',
    trainerNote: '',
    onboardingCompletedAt: null,
  }
}

export function normalizeMemberRegistrationPayload(payload, consultation, convertedAt = new Date().toISOString()) {
  if (!payload || typeof payload !== 'object' || !consultation) return null

  const name = normalizeText(payload.name)
  const phone = normalizeText(payload.phone)
  const goal = normalizeText(payload.goal)
  if (!name || !phone || !goal) return null

  return {
    ...payload,
    name,
    phone,
    goal,
    isSample: false,
    onboardingStatus: '초기 설정 필요',
    exerciseGoal: goal,
    experienceLevel: '',
    weeklyFrequency: '',
    preferredTime: '',
    trainerNote: '',
    onboardingCompletedAt: null,
    registeredFromConsultation: true,
    sourceConsultationId: consultation.id,
    sourceConsultationCreatedAt: consultation.createdAt,
    sourceConsultationCompletedAt: consultation.completedAt || convertedAt,
    registeredFromConsultationAt: convertedAt,
  }
}
