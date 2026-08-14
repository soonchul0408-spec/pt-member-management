import {
  CONSULTATION_FIELDS,
  applyResponseError,
  handleUnexpectedError,
  isUuid,
  mapConsultationRow,
  mapSupabaseError,
  methodNotAllowed,
  readJsonBody,
  requireStaff,
  sendError,
  sendJson,
} from '../../_lib/ptServer.js'

const CONSULTATION_STATUSES = new Set(['신규 문의', '상담 예정', '상담 완료'])

export default async function handler(req, res) {
  try {
    const consultationId = String(req.query?.id || '').trim()
    if (!isUuid(consultationId)) return sendError(res, 400, 'VALIDATION_ERROR', '상담 ID 형식이 올바르지 않습니다.')

    if (req.method === 'GET') return getConsultation(req, res, consultationId)
    if (req.method === 'PATCH') return updateConsultation(req, res, consultationId)
    return methodNotAllowed(res, ['GET', 'PATCH'])
  } catch {
    return handleUnexpectedError(res)
  }
}

async function getConsultation(req, res, consultationId) {
  const staff = await requireStaff(req)
  if (!staff.ok) return sendError(res, staff.response.status, staff.response.code, staff.response.message)

  const { data, error } = await staff.client
    .from('pt_consultations')
    .select(CONSULTATION_FIELDS)
    .eq('id', consultationId)
    .eq('is_sample', false)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return applyResponseError(res, mapSupabaseError(error))
  if (!data) return sendError(res, 404, 'NOT_FOUND', '상담 문의를 찾을 수 없습니다.')
  return sendJson(res, 200, { item: mapConsultationRow(data) })
}

async function updateConsultation(req, res, consultationId) {
  const staff = await requireStaff(req)
  if (!staff.ok) return sendError(res, staff.response.status, staff.response.code, staff.response.message)

  const body = await readJsonBody(req)
  const status = typeof body?.status === 'string' ? body.status.trim() : ''
  const expectedUpdatedAt = typeof body?.expectedUpdatedAt === 'string' ? body.expectedUpdatedAt.trim() : ''
  if (!CONSULTATION_STATUSES.has(status)) {
    return sendError(res, 422, 'VALIDATION_ERROR', '상담 상태를 확인해 주세요.')
  }

  const updatedAt = new Date().toISOString()
  let updateQuery = staff.client
    .from('pt_consultations')
    .update({
      status,
      completed_at: status === '상담 완료' ? updatedAt : null,
      updated_at: updatedAt,
    })
    .eq('id', consultationId)
    .eq('is_sample', false)
    .is('deleted_at', null)

  if (expectedUpdatedAt) updateQuery = updateQuery.eq('updated_at', expectedUpdatedAt)

  const { data, error } = await updateQuery.select(CONSULTATION_FIELDS).maybeSingle()

  if (error) {
    const mapped = error.code === 'PGRST116'
      ? { status: 404, code: 'NOT_FOUND', message: '상담 문의를 찾을 수 없습니다.' }
      : mapSupabaseError(error)
    return applyResponseError(res, mapped)
  }
  if (!data) {
    return sendError(
      res,
      expectedUpdatedAt ? 409 : 404,
      expectedUpdatedAt ? 'CONCURRENT_UPDATE' : 'NOT_FOUND',
      expectedUpdatedAt ? '다른 요청에서 상담 상태가 먼저 변경되었습니다.' : '상담 문의를 찾을 수 없습니다.',
    )
  }

  return sendJson(res, 200, { item: mapConsultationRow(data) })
}
