import { localJsonStorage, STORAGE_READ_STATUS } from '@/services/storageAdapter'
import {
  MEMBER_DATA_STORAGE_KEY as STORAGE_KEY,
  STORAGE_SCHEMA_VERSIONS,
} from '@/services/storageKeys'

export const MEMBER_DATA_STORAGE_KEY = STORAGE_KEY
export const MEMBER_DATA_STORAGE_EVENT = 'pt-member-management-data-changed'

const STATE_KEYS = [
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

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hasStateShape(value) {
  if (!isRecord(value)) return false

  const presentKeys = STATE_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(value, key))
  return presentKeys.length > 0 && presentKeys.every((key) => Array.isArray(value[key]))
}

function migrateStoredMemberData(value) {
  if (!isRecord(value)) return { data: null, migration: 'invalid' }

  if (Object.prototype.hasOwnProperty.call(value, 'version')) {
    if (value.version !== STORAGE_SCHEMA_VERSIONS.memberData || !hasStateShape(value.data)) {
      return { data: null, migration: 'unsupported-version' }
    }

    return { data: value.data, migration: 'versioned-v1' }
  }

  if (hasStateShape(value)) return { data: value, migration: 'legacy-v1' }
  return { data: null, migration: 'invalid' }
}

export function loadMemberData(fallback = null) {
  const stored = localJsonStorage.read(STORAGE_KEY, null)

  if (stored.status === STORAGE_READ_STATUS.missing || stored.status === STORAGE_READ_STATUS.unavailable) {
    return { data: fallback, status: stored.status, migration: 'none' }
  }

  if (stored.status === STORAGE_READ_STATUS.invalid) {
    return { data: fallback, status: stored.status, migration: 'invalid' }
  }

  const migrated = migrateStoredMemberData(stored.value)
  return {
    data: migrated.data ?? fallback,
    status: migrated.data ? stored.status : 'invalid',
    migration: migrated.migration,
  }
}

export function saveMemberData(snapshot) {
  return localJsonStorage.write(STORAGE_KEY, snapshot, { eventName: MEMBER_DATA_STORAGE_EVENT })
}

export function clearMemberData() {
  return localJsonStorage.remove(STORAGE_KEY)
}

export function createMemberRepository(implementation = {}) {
  return Object.freeze({
    load: implementation.load || loadMemberData,
    save: implementation.save || saveMemberData,
    clear: implementation.clear || clearMemberData,
  })
}

// 현재는 localStorage 구현을 주입합니다. 추후 API 구현은 같은 메서드 모양으로 교체합니다.
export const memberRepository = createMemberRepository()
