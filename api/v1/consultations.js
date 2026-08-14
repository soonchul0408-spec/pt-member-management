import {
  CONSULTATION_FIELDS,
  applyResponseError,
  getAdminClient,
  getPrivacyPolicyVersion,
  getRateLimitConfig,
  getRetentionUntil,
  handleUnexpectedError,
  isUnratedPublicConsultationAllowed,
  isRateLimitConfigured,
  mapConsultationRow,
  mapSupabaseError,
  methodNotAllowed,
  normalizeText,
  readJsonBody,
  requestFingerprint,
  requireStaff,
  sendError,
  sendJson,
} from '../_lib/ptServer.js'

const NAME_MAX_LENGTH = 50
const CONTACT_MAX_LENGTH = 100
const GOAL_MAX_LENGTH = 500

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return listConsultations(req, res)
    if (req.method === 'POST') return createConsultation(req, res)
    return methodNotAllowed(res, ['GET', 'POST'])
  } catch {
    return handleUnexpectedError(res)
  }
}

async function listConsultations(_req, res) {
  const staff = await requireStaff(_req)
  if (!staff.ok) return sendError(res, staff.response.status, staff.response.code, staff.response.message)

  const { data, error } = await staff.client
    .from('pt_consultations')
    .select(CONSULTATION_FIELDS)
    .eq('is_sample', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return applyResponseError(res, mapSupabaseError(error))

  return sendJson(res, 200, { items: (data || []).map(mapConsultationRow) })
}

async function createConsultation(req, res) {
  const body = await readJsonBody(req)
  const name = normalizeText(body?.name, NAME_MAX_LENGTH)
  const contact = normalizeText(body?.contact, CONTACT_MAX_LENGTH)
  const goal = normalizeText(body?.goal, GOAL_MAX_LENGTH)

  if (!name || !contact || !goal) {
    return sendError(res, 422, 'VALIDATION_ERROR', '이름, 연락처, 운동 목표를 모두 입력해 주세요.')
  }

  if (body?.privacyConsent !== true) {
    return sendError(res, 422, 'CONSENT_REQUIRED', '개인정보 수집·이용 동의가 필요합니다.')
  }

  const admin = getAdminClient()
  const rateLimitConfig = getRateLimitConfig()
  if (!admin) {
    return sendError(res, 503, 'RATE_LIMIT_NOT_CONFIGURED', '상담 접수 설정이 아직 완료되지 않았습니다.')
  }

  if (!isUnratedPublicConsultationAllowed()) {
    if (!isRateLimitConfigured()) {
      return sendError(res, 503, 'RATE_LIMIT_NOT_CONFIGURED', '상담 접수 설정이 아직 완료되지 않았습니다.')
    }
    const { data: allowed, error: rateLimitError } = await admin.rpc('consume_pt_public_rate_limit', {
      p_fingerprint: requestFingerprint(req),
      p_limit: rateLimitConfig.limit,
      p_window_seconds: rateLimitConfig.windowSeconds,
    })

    if (rateLimitError) return sendError(res, 503, 'RATE_LIMIT_UNAVAILABLE', '상담 접수 설정을 확인한 뒤 다시 시도해 주세요.')
    if (allowed !== true) return sendError(res, 429, 'RATE_LIMITED', '잠시 후 다시 상담을 신청해 주세요.')
  }

  const createdAt = new Date().toISOString()
  const { data, error } = await admin
    .from('pt_consultations')
    .insert({
      name,
      contact,
      goal,
      status: '신규 문의',
      is_sample: false,
      privacy_consent_at: createdAt,
      privacy_policy_version: getPrivacyPolicyVersion(),
      retention_until: getRetentionUntil(),
    })
    .select('id,status,created_at')
    .single()

  if (error) {
    if (error.code === '42501') return sendError(res, 403, 'FORBIDDEN', '상담 신청 권한을 확인하지 못했습니다.')
    return sendError(res, 500, 'SERVER_ERROR', '상담 신청을 저장하지 못했습니다.')
  }

  return sendJson(res, 201, {
    item: {
      id: data.id,
      status: data.status,
      createdAt: data.created_at,
    },
  })
}
