export const STORAGE_READ_STATUS = Object.freeze({
  unavailable: 'unavailable',
  missing: 'missing',
  valid: 'valid',
  invalid: 'invalid',
})

function getBrowserStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage || null
  } catch {
    return null
  }
}

function dispatchStorageEvent(eventName) {
  if (!eventName || typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return

  try {
    const event = typeof window.CustomEvent === 'function'
      ? new window.CustomEvent(eventName)
      : new Event(eventName)
    window.dispatchEvent(event)
  } catch {
    // 저장 자체는 성공했으므로 사용자 화면을 깨뜨리지 않습니다.
  }
}

export const localJsonStorage = Object.freeze({
  read(key, fallback = null) {
    const storage = getBrowserStorage()
    if (!storage) return { value: fallback, status: STORAGE_READ_STATUS.unavailable }

    try {
      const raw = storage.getItem(key)
      if (raw === null) return { value: fallback, status: STORAGE_READ_STATUS.missing }
      return { value: JSON.parse(raw), status: STORAGE_READ_STATUS.valid }
    } catch {
      return { value: fallback, status: STORAGE_READ_STATUS.invalid }
    }
  },

  write(key, value, { eventName } = {}) {
    const storage = getBrowserStorage()
    if (!storage) return false

    try {
      storage.setItem(key, JSON.stringify(value))
      dispatchStorageEvent(eventName)
      return true
    } catch {
      return false
    }
  },

  remove(key) {
    const storage = getBrowserStorage()
    if (!storage) return false

    try {
      storage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
})
