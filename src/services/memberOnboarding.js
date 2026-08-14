import { SAMPLE_MEMBER_IDS } from '@/data/ptData'

export const ONBOARDING_STATUSES = Object.freeze([
  '초기 설정 필요',
  '온보딩 진행 중',
  '관리 시작 준비 완료',
])

export const ONBOARDING_STATUS_TYPES = Object.freeze({
  '초기 설정 필요': 'warning',
  '온보딩 진행 중': 'primary',
  '관리 시작 준비 완료': 'success',
})

export const EXPERIENCE_LEVELS = Object.freeze([
  '처음 시작',
  '기초 경험 있음',
  '꾸준히 운동 중',
])

export const WEEKLY_FREQUENCIES = Object.freeze([
  '주 1회',
  '주 2회',
  '주 3회',
  '주 4회 이상',
])

export const PREFERRED_TIMES = Object.freeze([
  '오전',
  '점심 전후',
  '오후',
  '저녁',
  '유동적',
])

const GOAL_MAX_LENGTH = 200
const NOTE_MAX_LENGTH = 500

function normalizeText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizeOptionalDate(value) {
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) return null
  return new Date(value).toISOString()
}

function hasOnboardingInput(onboarding) {
  return Boolean(
    onboarding.exerciseGoal
    || onboarding.experienceLevel
    || onboarding.weeklyFrequency
    || onboarding.preferredTime
    || onboarding.trainerNote,
  )
}

export function isSampleMember(member) {
  return Boolean(member?.isSample === true || SAMPLE_MEMBER_IDS.includes(member?.id))
}

export function getMemberOnboarding(member) {
  const exerciseGoal = normalizeText(member?.exerciseGoal || member?.goal, GOAL_MAX_LENGTH)
  const experienceLevel = normalizeText(member?.experienceLevel, 50)
  const weeklyFrequency = normalizeText(member?.weeklyFrequency, 50)
  const preferredTime = normalizeText(member?.preferredTime, 50)
  const trainerNote = normalizeText(member?.trainerNote, NOTE_MAX_LENGTH)
  const storedStatus = ONBOARDING_STATUSES.includes(member?.onboardingStatus)
  const onboardingStatus = storedStatus
    ? member.onboardingStatus
    : '초기 설정 필요'

  return {
    onboardingStatus,
    exerciseGoal,
    experienceLevel,
    weeklyFrequency,
    preferredTime,
    trainerNote,
    onboardingCompletedAt: normalizeOptionalDate(member?.onboardingCompletedAt),
  }
}

export function createOnboardingPatch(input) {
  const onboarding = {
    exerciseGoal: normalizeText(input?.exerciseGoal, GOAL_MAX_LENGTH),
    experienceLevel: normalizeText(input?.experienceLevel, 50),
    weeklyFrequency: normalizeText(input?.weeklyFrequency, 50),
    preferredTime: normalizeText(input?.preferredTime, 50),
    trainerNote: normalizeText(input?.trainerNote, NOTE_MAX_LENGTH),
  }
  const completed = input?.onboardingCompleted === true
  const onboardingStatus = completed
    ? '관리 시작 준비 완료'
    : hasOnboardingInput(onboarding)
      ? '온보딩 진행 중'
      : '초기 설정 필요'

  return {
    ...onboarding,
    onboardingStatus,
    onboardingCompletedAt: completed ? new Date().toISOString() : null,
  }
}

export function getOnboardingStatusType(status) {
  return ONBOARDING_STATUS_TYPES[status] || 'info'
}
