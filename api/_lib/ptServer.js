import { createHash } from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

const STAFF_ROLES = new Set(['instructor', 'editor', 'admin'])

export const CONSULTATION_FIELDS = [
  'id',
  'name',
  'contact',
  'goal',
  'status',
  'created_at',
  'completed_at',
  'is_sample',
  'converted_member_id',
  'converted_at',
  'privacy_consent_at',
  'privacy_policy_version',
  'retention_until',
  'updated_at',
].join(',')

function getSupabaseUrl() {
  return process.env.VITE_SUPABASE_URL?.trim()
}

function getPublishableKey() {
  return (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)?.trim()
}

function createSupabaseClient({ accessToken = '' } = {}) {
  const url = getSupabaseUrl()
  const key = getPublishableKey()
  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}

export function getPublicClient() {
  return createSupabaseClient()
}

export function getAdminClient() {
  const url = getSupabaseUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceRoleKey) return null

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function getBearerToken(req) {
  const authorization = req.headers?.authorization || req.headers?.Authorization || ''
  const match = String(authorization).match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ''
}

export function sendJson(res, status, payload) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return res.status(status).json(payload)
}

export function sendError(res, status, code, message, details = undefined) {
  const error = { code, message }
  if (details) error.details = details
  return sendJson(res, status, { error })
}

export function methodNotAllowed(res, methods = []) {
  if (methods.length) res.setHeader('Allow', methods.join(', '))
  return sendError(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.')
}

export async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'object') return req.body
    try {
      return JSON.parse(String(req.body))
    } catch {
      return null
    }
  }

  if (typeof req.on !== 'function') return null

  return new Promise((resolve) => {
    let raw = ''
    let tooLarge = false
    req.on('data', (chunk) => {
      if (tooLarge) return
      raw += chunk
      if (raw.length > 100_000) {
        tooLarge = true
        resolve(null)
      }
    })
    req.on('end', () => {
      if (tooLarge) return
      if (!raw.trim()) return resolve(null)
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(null)
      }
    })
    req.on('error', () => resolve(null))
  })
}

export async function requireStaff(req) {
  const token = getBearerToken(req)
  const client = createSupabaseClient({ accessToken: token })

  if (!token || !client) {
    return { ok: false, response: { status: 401, code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } }
  }

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError) {
    const authStatus = Number(userError.status)
    if (authStatus !== 401 && userError.code !== 'invalid_jwt') {
      return { ok: false, response: { status: 503, code: 'AUTH_PROVIDER_UNAVAILABLE', message: '로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' } }
    }
    return { ok: false, response: { status: 401, code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } }
  }
  if (!userData?.user) {
    return { ok: false, response: { status: 401, code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } }
  }

  const { data: profile, error: profileError } = await client
    .from('pt_profiles')
    .select('id, name, role, member_id')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    return { ok: false, response: { status: 503, code: 'PROFILE_LOOKUP_FAILED', message: '권한 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' } }
  }
  if (!profile || !STAFF_ROLES.has(profile.role)) {
    return { ok: false, response: { status: 403, code: 'FORBIDDEN', message: '강사 권한이 필요합니다.' } }
  }

  return { ok: true, client, user: userData.user, profile }
}

export function mapConsultationRow(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    goal: row.goal,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at || null,
    isSample: Boolean(row.is_sample),
    isConvertedToMember: Boolean(row.converted_member_id),
    convertedMemberId: row.converted_member_id || null,
    convertedAt: row.converted_at || null,
    privacyConsentAt: row.privacy_consent_at || null,
    privacyPolicyVersion: row.privacy_policy_version || null,
    retentionUntil: row.retention_until || null,
    updatedAt: row.updated_at || null,
  }
}

export function normalizeText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function getRetentionUntil() {
  const configuredDays = Number.parseInt(process.env.PT_CONSULTATION_RETENTION_DAYS || '180', 10)
  const days = Number.isFinite(configuredDays) && configuredDays > 0 ? configuredDays : 180
  const retentionUntil = new Date()
  retentionUntil.setUTCDate(retentionUntil.getUTCDate() + days)
  return retentionUntil.toISOString()
}

export function getPrivacyPolicyVersion() {
  return process.env.PT_PRIVACY_POLICY_VERSION?.trim() || '2026-01'
}

export function getRateLimitConfig() {
  const limit = Number.parseInt(process.env.PT_PUBLIC_RATE_LIMIT || '5', 10)
  const windowSeconds = Number.parseInt(process.env.PT_PUBLIC_RATE_WINDOW_SECONDS || '3600', 10)
  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 5,
    windowSeconds: Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : 3600,
  }
}

export function isUnratedPublicConsultationAllowed() {
  if (isProductionRuntime()) return false
  return process.env.PT_ALLOW_UNRATED_PUBLIC_CONSULTATIONS === 'true'
}

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

export function isRateLimitConfigured() {
  return !isProductionRuntime() || Boolean(process.env.PT_RATE_LIMIT_SALT?.trim())
}

export function requestFingerprint(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
  const realIp = String(req.headers?.['x-real-ip'] || '').trim()
  const userAgent = String(req.headers?.['user-agent'] || '').slice(0, 300)
  const source = `${forwarded || realIp || 'unknown'}|${userAgent}|${process.env.PT_RATE_LIMIT_SALT || 'pt-member-management'}`
  return createHash('sha256').update(source).digest('hex')
}

export function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function mapSupabaseError(error) {
  const rawCode = error?.code || ''
  const rawMessage = String(error?.message || '')
  const detail = String(error?.details || '')
  const combined = `${rawCode} ${rawMessage} ${detail}`
  const safeDetail = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(detail) ? detail : undefined

  if (combined.includes('duplicate_member')) return { status: 409, code: 'DUPLICATE_MEMBER', message: '연락처가 같은 기존 회원이 있습니다.', details: safeDetail }
  if (combined.includes('member_id_exists')) return { status: 409, code: 'MEMBER_ID_EXISTS', message: '이미 등록된 회원입니다.' }
  if (combined.includes('consultation_already_converted')) return { status: 409, code: 'ALREADY_CONVERTED', message: '이미 회원으로 전환된 상담입니다.' }
  if (combined.includes('consultation_not_completed')) return { status: 422, code: 'CONSULTATION_NOT_COMPLETED', message: '상담 완료 상태에서만 회원으로 전환할 수 있습니다.' }
  if (combined.includes('consultation_not_found') || rawCode === 'P0002') return { status: 404, code: 'NOT_FOUND', message: '상담 문의를 찾을 수 없습니다.' }
  if (rawCode === '42501' || combined.includes('staff_required')) return { status: 403, code: 'FORBIDDEN', message: '강사 권한이 필요합니다.' }
  if (rawCode === '23514' || rawCode === '22023') return { status: 422, code: 'VALIDATION_ERROR', message: '전달된 상담·회원 정보를 확인해 주세요.' }
  return { status: 500, code: 'SERVER_ERROR', message: '서버에서 요청을 처리하지 못했습니다.' }
}

export function applyResponseError(res, mappedError) {
  return sendError(res, mappedError.status, mappedError.code, mappedError.message, mappedError.details)
}

export function handleUnexpectedError(res) {
  return sendError(res, 500, 'SERVER_ERROR', '서버에서 요청을 처리하지 못했습니다.')
}
