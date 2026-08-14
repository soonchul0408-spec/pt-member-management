import { supabase, supabaseConfigured } from '@/lib/supabase'
import { SAMPLE_CONSULTATIONS } from '@/data/consultationData'
import {
  addConsultation,
  getConsultationStorageStatus,
  getConsultations,
  markConsultationConverted,
  updateConsultationStatus,
} from '@/services/consultationStorage'

export const CONSULTATION_CHANGED_EVENT = 'pt-member-management-consultations-changed'

const configuredMode = import.meta.env.VITE_PT_DATA_MODE?.trim().toLowerCase()
const useApiRepository = import.meta.env.PROD || configuredMode === 'api'
const apiBaseUrl = (import.meta.env.VITE_PT_API_BASE_URL || '/api/v1').replace(/\/$/, '')

export class ConsultationRepositoryError extends Error {
  constructor(message, { status = 500, code = 'REQUEST_FAILED', details = undefined } = {}) {
    super(message)
    this.name = 'ConsultationRepositoryError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function getConsultationErrorMessage(error, fallback = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.') {
  const messages = {
    NETWORK_ERROR: '서버에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
    UNAUTHORIZED: '로그인이 필요합니다. 로그인 상태를 확인해 주세요.',
    FORBIDDEN: '이 작업을 수행할 강사 권한이 없습니다.',
    AUTH_PROVIDER_UNAVAILABLE: '로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    PROFILE_LOOKUP_FAILED: '권한 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    RATE_LIMITED: '요청이 잠시 제한되었습니다. 잠시 후 다시 상담을 신청해 주세요.',
    RATE_LIMIT_NOT_CONFIGURED: '상담 접수 설정이 아직 완료되지 않았습니다. 관리자에게 확인을 요청해 주세요.',
    RATE_LIMIT_UNAVAILABLE: '상담 접수 설정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    SUPABASE_NOT_CONFIGURED: '상담 접수 설정이 아직 완료되지 않았습니다. 관리자에게 확인을 요청해 주세요.',
    VALIDATION_ERROR: '입력 내용을 확인해 주세요.',
    CONSENT_REQUIRED: '개인정보 수집·이용 동의가 필요합니다.',
    SERVER_ERROR: '서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    REQUEST_FAILED: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    METHOD_NOT_ALLOWED: '현재 요청을 처리할 수 없습니다.',
    CONCURRENT_UPDATE: '다른 요청에서 상담 상태가 먼저 변경되었습니다. 목록을 새로고침해 주세요.',
    NOT_FOUND: '상담 문의를 찾을 수 없습니다. 목록을 새로고침해 주세요.',
    CONSULTATION_NOT_COMPLETED: '상담 완료 상태에서만 회원으로 전환할 수 있습니다.',
    DUPLICATE_MEMBER: '연락처가 같은 기존 회원이 있습니다. 기존 회원을 먼저 확인해 주세요.',
    MEMBER_ID_EXISTS: '이미 등록된 회원입니다. 목록을 새로고침해 주세요.',
    ALREADY_CONVERTED: '이미 회원으로 전환된 상담입니다.',
    API_ONLY_OPERATION: '운영 모드에서는 서버 전환 기능을 사용해야 합니다.',
    INVALID_RESPONSE: '서버 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  }
  return messages[error?.code] || fallback
}

function mapServerConsultation(item) {
  if (!item || typeof item.id !== 'string' || !item.id.trim()) return null
  return {
    id: item.id,
    name: item.name || '',
    contact: item.contact || '',
    goal: item.goal || '',
    status: item.status,
    createdAt: item.createdAt,
    completedAt: item.completedAt || null,
    isSample: Boolean(item.isSample),
    isConvertedToMember: Boolean(item.isConvertedToMember || item.convertedMemberId),
    convertedMemberId: item.convertedMemberId || null,
    convertedAt: item.convertedAt || null,
    privacyConsentAt: item.privacyConsentAt || null,
    privacyPolicyVersion: item.privacyPolicyVersion || null,
    retentionUntil: item.retentionUntil || null,
    updatedAt: item.updatedAt || null,
  }
}

async function getSessionToken() {
  if (!supabase) return ''
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  } catch {
    return ''
  }
}

async function requestApi(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  const token = await getSessionToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  } catch {
    throw new ConsultationRepositoryError('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.', {
      status: 503,
      code: 'NETWORK_ERROR',
    })
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const error = payload?.error || {}
    throw new ConsultationRepositoryError(error.message || '상담 요청을 처리하지 못했습니다.', {
      status: response.status,
      code: error.code || 'REQUEST_FAILED',
      details: error.details,
    })
  }

  return payload
}

const localImplementation = {
  mode: 'local',
  list: (options) => getConsultations(options),
  create: addConsultation,
  updateStatus: updateConsultationStatus,
  markConverted: markConsultationConverted,
  getStorageStatus: getConsultationStorageStatus,
}

const apiImplementation = {
  mode: 'api',
  async list({ includeSamples = true } = {}) {
    const payload = await requestApi('/consultations')
    if (!Array.isArray(payload?.items)) {
      throw new ConsultationRepositoryError('서버 응답을 확인하지 못했습니다.', { status: 502, code: 'INVALID_RESPONSE' })
    }
    const items = payload.items.map(mapServerConsultation).filter(Boolean)
    if (payload.items.length && !items.length) {
      throw new ConsultationRepositoryError('서버 응답을 확인하지 못했습니다.', { status: 502, code: 'INVALID_RESPONSE' })
    }
    if (!includeSamples) return items
    return [...items, ...SAMPLE_CONSULTATIONS.map((item) => ({ ...item }))]
  },
  async create(input) {
    const payload = await requestApi('/consultations', {
      method: 'POST',
      body: JSON.stringify({
        name: input?.name,
        contact: input?.contact,
        goal: input?.goal,
        privacyConsent: input?.privacyConsent === true,
      }),
    })
    const created = mapServerConsultation({
      ...input,
      ...payload?.item,
      isSample: false,
      isConvertedToMember: false,
    })
    if (!created) throw new ConsultationRepositoryError('상담 신청 결과를 확인하지 못했습니다.', { status: 502, code: 'INVALID_RESPONSE' })
    return created
  },
  async updateStatus(id, status, expectedUpdatedAt = undefined) {
    const payload = await requestApi(`/consultations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, expectedUpdatedAt }),
    })
    const updated = mapServerConsultation(payload?.item)
    if (!updated) throw new ConsultationRepositoryError('상담 상태 변경 결과를 확인하지 못했습니다.', { status: 502, code: 'INVALID_RESPONSE' })
    return updated
  },
  async convertToMember(id, memberPayload) {
    const payload = await requestApi(`/consultations/${encodeURIComponent(id)}/convert`, {
      method: 'POST',
      body: JSON.stringify(memberPayload),
    })
    const consultation = mapServerConsultation(payload?.consultation)
    if (!payload?.member?.id || !consultation) {
      throw new ConsultationRepositoryError('회원 전환 결과를 확인하지 못했습니다.', { status: 502, code: 'INVALID_RESPONSE' })
    }
    return { member: payload.member, consultation }
  },
  async markConverted() {
    throw new ConsultationRepositoryError('운영 모드에서는 상담 전환 API를 사용해야 합니다.', {
      status: 405,
      code: 'API_ONLY_OPERATION',
    })
  },
  getStorageStatus: () => ({ status: 'remote', writable: true }),
}

export function createConsultationRepository(implementation = {}) {
  const fallback = implementation.mode === 'api' ? apiImplementation : localImplementation

  return Object.freeze({
    mode: implementation.mode || fallback.mode || 'local',
    isRemote: (implementation.mode || fallback.mode) === 'api',
    list: implementation.list || fallback.list || getConsultations,
    create: implementation.create || fallback.create || addConsultation,
    updateStatus: implementation.updateStatus || fallback.updateStatus || updateConsultationStatus,
    markConverted: implementation.markConverted || fallback.markConverted || markConsultationConverted,
    convertToMember: implementation.convertToMember || fallback.convertToMember,
    getStorageStatus: implementation.getStorageStatus || fallback.getStorageStatus || getConsultationStorageStatus,
  })
}

export const consultationRepository = createConsultationRepository(useApiRepository ? { mode: 'api' } : localImplementation)
export const isRemoteConsultationRepository = useApiRepository

// 공개 상담과 강사 관리 화면은 이 저장소만 사용하며, 실제 저장 방식은 환경에 따라 교체됩니다.
export { supabaseConfigured }
