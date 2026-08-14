import { CONSULTATION_STATUSES, SAMPLE_CONSULTATIONS } from '@/data/consultationData'
import { localJsonStorage } from '@/services/storageAdapter'
import {
  CONSULTATION_STORAGE_KEY as STORAGE_KEY,
  STORAGE_SCHEMA_VERSIONS,
} from '@/services/storageKeys'

export { CONSULTATION_STORAGE_KEY } from '@/services/storageKeys'
export const CONSULTATION_STORAGE_EVENT = 'pt-member-management-consultations-changed'
export const CONSULTATION_PRIVACY_POLICY_VERSION = '2026-01'

const NAME_MAX_LENGTH = 50
const CONTACT_MAX_LENGTH = 100
const GOAL_MAX_LENGTH = 500
const ID_MAX_LENGTH = 120

function normalizeText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function createConsultationId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  return `consultation-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeCreatedAt(value) {
  if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) return new Date(value).toISOString()
  return new Date().toISOString()
}

function normalizeOptionalDate(value) {
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) return null
  return new Date(value).toISOString()
}

function createRetentionUntil(createdAt) {
  const retentionUntil = new Date(createdAt)
  retentionUntil.setUTCDate(retentionUntil.getUTCDate() + 180)
  return retentionUntil.toISOString()
}

function normalizeStatus(value) {
  return CONSULTATION_STATUSES.includes(value) ? value : CONSULTATION_STATUSES[0]
}

function normalizeStoredConsultation(value) {
  if (!value || typeof value !== 'object' || value.isSample === true || value.sample === true) return null

  const name = normalizeText(value.name, NAME_MAX_LENGTH)
  const contact = normalizeText(value.contact, CONTACT_MAX_LENGTH)
  const goal = normalizeText(value.goal || value.summary, GOAL_MAX_LENGTH)

  if (!name || !contact || !goal) return null

  const convertedMemberId = normalizeText(value.convertedMemberId, ID_MAX_LENGTH)
  const isConvertedToMember = value.isConvertedToMember === true && Boolean(convertedMemberId)

  return {
    id: normalizeText(value.id, ID_MAX_LENGTH) || createConsultationId(),
    name,
    contact,
    goal,
    status: normalizeStatus(value.status),
    createdAt: normalizeCreatedAt(value.createdAt),
    completedAt: normalizeOptionalDate(value.completedAt),
    isSample: false,
    isConvertedToMember,
    convertedMemberId: isConvertedToMember ? convertedMemberId : null,
    convertedAt: isConvertedToMember ? normalizeOptionalDate(value.convertedAt) : null,
    privacyConsentAt: normalizeOptionalDate(value.privacyConsentAt),
    privacyPolicyVersion: normalizeText(value.privacyPolicyVersion, 40) || null,
    retentionUntil: normalizeOptionalDate(value.retentionUntil),
  }
}

function getStoredCandidates(value) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return null

  const data = value.version === STORAGE_SCHEMA_VERSIONS.consultations && value.data
    ? value.data
    : value

  if (Array.isArray(data)) return data
  if (Array.isArray(data.consultations)) return data.consultations
  if (Array.isArray(data.items)) return data.items
  return null
}

function normalizeStoredConsultations(candidates) {
  const seenIds = new Set()

  return candidates
    .map(normalizeStoredConsultation)
    .filter(Boolean)
    .filter((consultation) => {
      if (seenIds.has(consultation.id)) return false
      seenIds.add(consultation.id)
      return true
    })
}

function readStoredConsultationState() {
  const stored = localJsonStorage.read(STORAGE_KEY, null)
  if (stored.status === 'missing') return { consultations: [], writable: true, status: stored.status }
  if (stored.status === 'unavailable' || stored.status === 'invalid') {
    return { consultations: [], writable: false, status: stored.status }
  }

  const candidates = getStoredCandidates(stored.value)

  if (candidates === null) {
    return { consultations: [], writable: false, status: 'invalid' }
  }

  return {
    consultations: normalizeStoredConsultations(candidates),
    writable: true,
    status: stored.status,
  }
}

function readStoredConsultations() {
  return readStoredConsultationState().consultations
}

export function getConsultationStorageStatus() {
  const stored = readStoredConsultationState()
  return { status: stored.status, writable: stored.writable }
}

function writeStoredConsultations(consultations) {
  return localJsonStorage.write(STORAGE_KEY, consultations, { eventName: CONSULTATION_STORAGE_EVENT })
}

function sortByNewest(first, second) {
  return second.createdAt.localeCompare(first.createdAt)
}

export function getConsultations({ includeSamples = true } = {}) {
  const stored = readStoredConsultations().sort(sortByNewest)
  if (!includeSamples) return stored

  return [...stored, ...SAMPLE_CONSULTATIONS.map((consultation) => ({ ...consultation }))].sort(sortByNewest)
}

export function addConsultation(input) {
  const name = normalizeText(input?.name, NAME_MAX_LENGTH)
  const contact = normalizeText(input?.contact, CONTACT_MAX_LENGTH)
  const goal = normalizeText(input?.goal, GOAL_MAX_LENGTH)

  if (!name || !contact || !goal || input?.privacyConsent !== true) return null

  const createdAt = new Date().toISOString()

  const consultation = {
    id: createConsultationId(),
    name,
    contact,
    goal,
    status: CONSULTATION_STATUSES[0],
    createdAt,
    completedAt: null,
    isSample: false,
    isConvertedToMember: false,
    convertedMemberId: null,
    convertedAt: null,
    privacyConsentAt: createdAt,
    privacyPolicyVersion: CONSULTATION_PRIVACY_POLICY_VERSION,
    retentionUntil: createRetentionUntil(createdAt),
  }

  const stored = readStoredConsultationState()
  if (!stored.writable) return null

  const saved = writeStoredConsultations([consultation, ...stored.consultations])
  return saved ? consultation : null
}

export function updateConsultationStatus(id, status) {
  if (!id || !CONSULTATION_STATUSES.includes(status)) return null

  const stored = readStoredConsultationState()
  if (!stored.writable) return null

  const target = stored.consultations.find((consultation) => consultation.id === id)
  if (!target) return null

  const updated = {
    ...target,
    status,
    completedAt: status === '상담 완료'
      ? target.completedAt || new Date().toISOString()
      : null,
  }
  const next = stored.consultations.map((consultation) => (consultation.id === id ? updated : consultation))
  return writeStoredConsultations(next) ? updated : null
}

export function markConsultationConverted(id, memberId, convertedAt = new Date().toISOString()) {
  const normalizedMemberId = normalizeText(memberId, ID_MAX_LENGTH)
  if (!id || !normalizedMemberId) return null

  const stored = readStoredConsultationState()
  if (!stored.writable) return null

  const target = stored.consultations.find((consultation) => consultation.id === id)
  if (!target || target.status !== '상담 완료' || target.isConvertedToMember) return null

  const updated = {
    ...target,
    isConvertedToMember: true,
    convertedMemberId: normalizedMemberId,
    convertedAt: normalizeOptionalDate(convertedAt) || new Date().toISOString(),
  }
  const next = stored.consultations.map((consultation) => (consultation.id === id ? updated : consultation))
  return writeStoredConsultations(next) ? updated : null
}
