import { randomUUID } from 'node:crypto'

import {
  CONSULTATION_FIELDS,
  applyResponseError,
  handleUnexpectedError,
  isUuid,
  mapConsultationRow,
  methodNotAllowed,
  normalizeText,
  readJsonBody,
  requireStaff,
  sendError,
  sendJson,
} from '../../../_lib/ptServer.js'

const MEMBER_STATE_KEYS = [
  'members',
  'memberships',
  'sessions',
  'measurements',
  'payments',
  'notes',
  'workoutAssignments',
  'workoutLogs',
  'mealRecords',
  'coachingNotes',
  'communications',
  'announcements',
]

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

    const consultationId = String(req.query?.id || '').trim()
    if (!isUuid(consultationId)) return sendError(res, 400, 'VALIDATION_ERROR', '상담 ID 형식이 올바르지 않습니다.')

    const staff = await requireStaff(req)
    if (!staff.ok) return sendError(res, staff.response.status, staff.response.code, staff.response.message)

    const { data: sourceConsultation, error: sourceConsultationError } = await staff.client
      .from('pt_consultations')
      .select('id,status,created_at,completed_at,converted_member_id')
      .eq('id', consultationId)
      .eq('is_sample', false)
      .is('deleted_at', null)
      .maybeSingle()

    if (sourceConsultationError) return sendError(res, 500, 'SERVER_ERROR', '상담 정보를 확인하지 못했습니다.')
    if (!sourceConsultation) return sendError(res, 404, 'NOT_FOUND', '상담 문의를 찾을 수 없습니다.')
    if (sourceConsultation.status !== '상담 완료') return sendError(res, 422, 'CONSULTATION_NOT_COMPLETED', '상담 완료 상태에서만 회원으로 전환할 수 있습니다.')
    if (sourceConsultation.converted_member_id) return sendError(res, 409, 'ALREADY_CONVERTED', '이미 회원으로 전환된 상담입니다.')

    const body = await readJsonBody(req)
    const name = normalizeText(body?.name, 50)
    const phone = normalizeText(body?.phone || body?.contact, 100)
    const goal = normalizeText(body?.goal, 500)
    if (!name || !phone || !goal) {
      return sendError(res, 422, 'VALIDATION_ERROR', '회원명, 연락처, 운동 목표를 모두 입력해 주세요.')
    }

    const memberId = `member-${randomUUID()}`
    const convertedAt = new Date().toISOString()
    const member = {
      id: memberId,
      name,
      phone,
      email: normalizeText(body?.email, 160),
      birthYear: normalizeText(body?.birthYear, 4),
      gender: normalizeText(body?.gender, 20) || '미설정',
      joinedAt: normalizeText(body?.joinedAt, 10) || convertedAt.slice(0, 10),
      trainerId: normalizeText(body?.trainerId, 100),
      goal,
      caution: normalizeText(body?.caution, 500),
      status: '활성',
      avatarColor: normalizeText(body?.avatarColor, 20) || '#dbeafe',
      isSample: false,
      onboardingStatus: '초기 설정 필요',
      exerciseGoal: goal,
      experienceLevel: '',
      weeklyFrequency: '',
      preferredTime: '',
      trainerNote: '',
      onboardingCompletedAt: null,
      registeredFromConsultation: true,
      sourceConsultationId: consultationId,
      sourceConsultationCreatedAt: sourceConsultation.created_at,
      sourceConsultationCompletedAt: sourceConsultation.completed_at || convertedAt,
      registeredFromConsultationAt: convertedAt,
    }
    const workspacePayload = Object.fromEntries(MEMBER_STATE_KEYS.map((key) => [key, key === 'members' ? [member] : []]))

    const { data: conversion, error: conversionError } = await staff.client.rpc('convert_pt_consultation', {
      p_consultation_id: consultationId,
      p_member_id: memberId,
      p_member_payload: workspacePayload,
    })

    if (conversionError) return applyResponseError(res, mapConversionError(conversionError))

    const { data: consultation, error: consultationError } = await staff.client
      .from('pt_consultations')
      .select(CONSULTATION_FIELDS)
      .eq('id', consultationId)
      .maybeSingle()

    if (consultationError || !consultation) {
      return sendJson(res, 201, {
        member,
        consultation: mapConsultationRow({
          ...sourceConsultation,
          is_sample: false,
          converted_member_id: memberId,
          converted_at: conversion?.convertedAt || convertedAt,
          updated_at: conversion?.convertedAt || convertedAt,
        }),
      })
    }

    return sendJson(res, 201, {
      member,
      consultation: mapConsultationRow(consultation),
    })
  } catch {
    return handleUnexpectedError(res)
  }
}

function mapConversionError(error) {
  const raw = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`
  const details = typeof error?.details === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(error.details)
    ? error.details
    : undefined

  if (raw.includes('duplicate_member')) {
    return { status: 409, code: 'DUPLICATE_MEMBER', message: '연락처가 같은 기존 회원이 있습니다.', details }
  }
  if (raw.includes('member_id_exists')) return { status: 409, code: 'MEMBER_ID_EXISTS', message: '이미 등록된 회원입니다.' }
  if (raw.includes('consultation_already_converted')) return { status: 409, code: 'ALREADY_CONVERTED', message: '이미 회원으로 전환된 상담입니다.' }
  if (raw.includes('consultation_not_completed')) return { status: 422, code: 'CONSULTATION_NOT_COMPLETED', message: '상담 완료 상태에서만 회원으로 전환할 수 있습니다.' }
  if (raw.includes('consultation_not_found') || error?.code === 'P0002') return { status: 404, code: 'NOT_FOUND', message: '상담 문의를 찾을 수 없습니다.' }
  if (raw.includes('staff_required') || error?.code === '42501') return { status: 403, code: 'FORBIDDEN', message: '강사 권한이 필요합니다.' }
  return { status: 500, code: 'SERVER_ERROR', message: '회원 전환을 저장하지 못했습니다.' }
}
