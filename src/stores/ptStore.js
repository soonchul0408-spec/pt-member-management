import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { supabase, supabaseConfigured } from '@/lib/supabase'
import {
  getInitialState,
  MEMBER_STATUSES,
  TRAINERS,
} from '@/data/ptData'
import { createOnboardingPatch, isSampleMember } from '@/services/memberOnboarding'
import { memberRepository } from '@/services/memberDataStorage'
import { useAuthStore } from '@/stores/authStore'

const DEFAULT_USER = { name: '공개 사용자', role: '조회 전용' }
// 운영 빌드에서는 Supabase 설정이 누락되어도 샘플 회원 데이터를 내부 화면에 노출하지 않습니다.
const SECURE_MODE = import.meta.env.PROD || supabaseConfigured || import.meta.env.VITE_REQUIRE_AUTH === 'true'

function createEmptyState() {
  return Object.fromEntries(Object.keys(getInitialState()).map((key) => [key, []]))
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export const usePtStore = defineStore('pt', () => {
  const auth = useAuthStore()
  const state = SECURE_MODE ? createEmptyState() : getInitialState()
  const members = ref(state.members)
  const memberships = ref(state.memberships)
  const sessions = ref(state.sessions)
  const measurements = ref(state.measurements)
  const payments = ref(state.payments)
  const notes = ref(state.notes)
  const workoutAssignments = ref(state.workoutAssignments)
  const workoutLogs = ref(state.workoutLogs)
  const mealRecords = ref(state.mealRecords)
  const coachingNotes = ref(state.coachingNotes)
  const communications = ref(state.communications)
  const announcements = ref(state.announcements)
  const currentUser = ref({ ...DEFAULT_USER })
  const hydrated = ref(false)
  const remoteHydrated = ref(false)
  const syncing = ref(false)
  const syncError = ref('')
  let remoteSaveTimer

  function cloneRows(rows) {
    return Array.isArray(rows)
      ? structuredClone(rows).filter((row) => row && typeof row === 'object')
      : []
  }

  function normalizeRows(rows) {
    const seenIds = new Set()

    return cloneRows(rows).filter((row) => {
      if (typeof row.id !== 'string' || !row.id.trim() || seenIds.has(row.id)) return false
      seenIds.add(row.id)
      return true
    })
  }

  function normalizeMembers(rows) {
    return normalizeRows(rows)
      .map((member) => ({
        ...member,
        name: typeof member.name === 'string' && member.name.trim() ? member.name : '이름 미설정 회원',
        phone: typeof member.phone === 'string' ? member.phone : '',
        email: typeof member.email === 'string' ? member.email : '',
        gender: typeof member.gender === 'string' ? member.gender : '미설정',
        birthYear: typeof member.birthYear === 'string' ? member.birthYear : '',
        goal: typeof member.goal === 'string' ? member.goal : '',
        status: typeof member.status === 'string' ? member.status : MEMBER_STATUSES[0],
      }))
  }

  const canEdit = computed(() => auth.canEdit)
  const isInstructor = computed(() => auth.isInstructor)
  const isMember = computed(() => auth.isMember)
  const activeMemberId = computed(() => auth.activeMemberId)
  const readOnly = computed(() => !canEdit.value)
  const canWriteRemote = computed(() => auth.canEdit || auth.isMember)
  const dataOrigin = computed(() => {
    if (SECURE_MODE && !auth.user) return '로그인 필요'
    return supabaseConfigured && auth.user ? '서버 데이터' : '샘플 데이터'
  })

  function applyState(nextState = {}) {
    members.value = normalizeMembers(nextState.members)
    memberships.value = normalizeRows(nextState.memberships)
    sessions.value = normalizeRows(nextState.sessions)
    measurements.value = normalizeRows(nextState.measurements)
    payments.value = normalizeRows(nextState.payments)
    notes.value = normalizeRows(nextState.notes)
    workoutAssignments.value = normalizeRows(nextState.workoutAssignments)
    workoutLogs.value = normalizeRows(nextState.workoutLogs)
    mealRecords.value = normalizeRows(nextState.mealRecords)
    coachingNotes.value = normalizeRows(nextState.coachingNotes)
    communications.value = normalizeRows(nextState.communications)
    announcements.value = normalizeRows(nextState.announcements)
  }

  function snapshot() {
    return {
      members: members.value,
      memberships: memberships.value,
      sessions: sessions.value,
      measurements: measurements.value,
      payments: payments.value,
      notes: notes.value,
      workoutAssignments: workoutAssignments.value,
      workoutLogs: workoutLogs.value,
      mealRecords: mealRecords.value,
      coachingNotes: coachingNotes.value,
      communications: communications.value,
      announcements: announcements.value,
    }
  }

  function persistLocalState() {
    if (typeof window === 'undefined' || SECURE_MODE || (supabaseConfigured && auth.user)) return true

    if (memberRepository.save(snapshot())) {
      syncError.value = ''
      return true
    }

    syncError.value = '회원 정보를 이 브라우저에 저장하지 못했습니다. 저장 공간을 확인해 주세요.'
    return false
  }

  function mergeRemoteRows(rows) {
    const merged = createEmptyState()

    for (const row of rows ?? []) {
      const payload = row?.payload
      if (!payload || typeof payload !== 'object') continue

      for (const key of Object.keys(merged)) {
        if (Array.isArray(payload[key])) merged[key].push(...payload[key])
      }
    }

    for (const key of Object.keys(merged)) {
      const uniqueRows = new Map()
      for (const row of merged[key]) {
        const rowId = row?.id || `${key}-${uniqueRows.size}`
        uniqueRows.set(rowId, row)
      }
      merged[key] = [...uniqueRows.values()]
    }

    applyState(merged)
  }

  function payloadForMember(memberId) {
    const payload = {}
    const current = snapshot()

    for (const [key, rows] of Object.entries(current)) {
      if (key === 'members') {
        payload[key] = rows.filter((row) => row.id === memberId)
      } else if (key === 'announcements') {
        // 공지사항은 연결된 회원이 로그인했을 때도 보여야 하므로 각 작업공간에 복제합니다.
        payload[key] = rows
      } else {
        payload[key] = rows.filter((row) => row.memberId === memberId)
      }
    }

    return payload
  }

  function buildRemoteRows() {
    const memberIds = [...new Set(members.value.map((member) => member.id))]
    return memberIds.map((memberId) => ({
      member_id: memberId,
      payload: payloadForMember(memberId),
      updated_by: auth.user?.id || null,
      updated_at: new Date().toISOString(),
    }))
  }

  function hydrate() {
    if (typeof window === 'undefined') return

    if (SECURE_MODE) {
      applyState(createEmptyState())
      hydrated.value = true
      return
    }

    // 로그인한 Supabase 사용자는 서버 데이터를 사용하고, 역할 테스트 화면은 localStorage를 사용합니다.
    if (supabaseConfigured && auth.user) {
      hydrated.value = true
      return
    }

    const saved = memberRepository.load(null)
    if (saved.data) applyState(saved.data)
    if (saved.status === 'invalid') {
      syncError.value = '저장된 회원 데이터 형식을 읽지 못했습니다. 기존 데이터를 변경하지 않고 빈 상태로 표시합니다.'
    }

    hydrated.value = true
    if (saved.status !== 'invalid' && (!supabaseConfigured || auth.isDemoMode)) persistLocalState()
  }

  hydrate()

  async function persistRemote(force = false) {
    if (!supabase || !supabaseConfigured || !auth.user || !canWriteRemote.value || (!remoteHydrated.value && !force)) return false

    const rows = buildRemoteRows()
    if (!rows.length) return false

    syncing.value = true
    syncError.value = ''
    const { error } = await supabase.from('pt_member_workspaces').upsert(rows, { onConflict: 'member_id' })
    syncing.value = false

    if (error) {
      syncError.value = '변경 내용을 서버에 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      return false
    }

    return true
  }

  function queueRemoteSave() {
    if (typeof window === 'undefined') return
    window.clearTimeout(remoteSaveTimer)
    remoteSaveTimer = window.setTimeout(() => {
      void persistRemote()
    }, 350)
  }

  async function hydrateRemote() {
    if (!supabase || !supabaseConfigured) {
      if (SECURE_MODE) applyState(createEmptyState())
      return
    }

    remoteHydrated.value = false
    syncError.value = ''

    if (!auth.user) {
      applyState(createEmptyState())
      hydrated.value = true
      return
    }

    syncing.value = true
    const { data, error } = await supabase.from('pt_member_workspaces').select('member_id, payload, updated_at')
    syncing.value = false

    if (error) {
      syncError.value = '회원 전용 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
      applyState(createEmptyState())
    } else if (Array.isArray(data)) {
      mergeRemoteRows(data)
    } else {
      applyState(createEmptyState())
      remoteHydrated.value = true
      if (canWriteRemote.value) await persistRemote(true)
    }

    remoteHydrated.value = true
    hydrated.value = true
  }

  watch(
    [members, memberships, sessions, measurements, payments, notes, workoutAssignments, workoutLogs, mealRecords, coachingNotes, communications, announcements],
    () => {
      if (!hydrated.value || typeof window === 'undefined') return

      if (!SECURE_MODE && (!supabaseConfigured || auth.isDemoMode)) {
        persistLocalState()
      } else if (SECURE_MODE && remoteHydrated.value && canWriteRemote.value) {
        queueRemoteSave()
      }
    },
    { deep: true },
  )

  watch(
    () => `${auth.user?.id ?? ''}:${auth.role}:${auth.currentRole}`,
    () => {
      void hydrateRemote()
    },
    { immediate: true },
  )

  watch(
    () => ({ name: auth.displayName, role: auth.roleLabel, memberId: auth.activeMemberId }),
    (nextUser) => {
      currentUser.value = { name: nextUser.name || DEFAULT_USER.name, role: nextUser.role }
    },
    { immediate: true, deep: true },
  )

  const activeMembers = computed(() => members.value.filter((member) => member.status === '활성'))
  const today = computed(() => todayString())
  const todaySessions = computed(() =>
    sessions.value
      .filter((session) => session.date === today.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  )
  const upcomingSessions = computed(() =>
    sessions.value
      .filter((session) => session.date >= today.value && session.status === '예정')
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
      .slice(0, 6),
  )
  const completedSessions = computed(() => sessions.value.filter((session) => session.status === '완료'))
  const expiringMemberships = computed(() =>
    memberships.value.filter((membership) => membership.status === '만료 임박' || membership.status === '휴식 중'),
  )
  const activeMemberships = computed(() => memberships.value.filter((membership) => membership.status === '이용 중'))
  const completedPayments = computed(() => payments.value.filter((payment) => payment.status === '결제 완료'))
  const totalRevenue = computed(() => completedPayments.value.reduce((total, payment) => total + payment.amount, 0))
  const attendanceRate = computed(() => {
    const relevant = sessions.value.filter((session) => session.status !== '예정')
    if (!relevant.length) return 0
    return Math.round((relevant.filter((session) => session.status === '완료').length / relevant.length) * 100)
  })

  function getMember(memberId) {
    return members.value.find((member) => member.id === memberId)
  }

  function getTrainer(trainerId) {
    return TRAINERS.find((trainer) => trainer.id === trainerId)
  }

  function getMembership(memberId) {
    return memberships.value.find((membership) => membership.memberId === memberId)
  }

  function getMemberSessions(memberId) {
    return sessions.value
      .filter((session) => session.memberId === memberId)
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
  }

  function getMemberMeasurements(memberId) {
    return measurements.value
      .filter((measurement) => measurement.memberId === memberId)
      .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
  }

  function getMemberNotes(memberId) {
    return notes.value.filter((note) => note.memberId === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function getMemberAssignments(memberId) {
    return workoutAssignments.value
      .filter((assignment) => assignment.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  function getMemberWorkoutLogs(memberId) {
    return workoutLogs.value
      .filter((log) => log.memberId === memberId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function getMemberMealRecords(memberId) {
    return mealRecords.value
      .filter((record) => record.memberId === memberId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function getMemberCoachingNotes(memberId) {
    return coachingNotes.value
      .filter((note) => note.memberId === memberId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function getMemberCommunications(memberId) {
    return communications.value
      .filter((message) => message.memberId === memberId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  function getAnnouncements() {
    return [...announcements.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function getUnreadCommunicationCount(memberId, recipientType = auth.isMember ? 'member' : 'instructor') {
    return communications.value.filter((message) => message.memberId === memberId && message.status === 'unread' && message.authorType !== recipientType).length
  }

  function getUnreadCoachingNoteCount(memberId) {
    return coachingNotes.value.filter((note) => note.memberId === memberId && !note.readAt).length
  }

  function getMemberProgress(memberId) {
    const assignments = getMemberAssignments(memberId)
    const logs = getMemberWorkoutLogs(memberId)
    const completedAssignments = assignments.filter((assignment) => assignment.status === '완료').length
    const completedLogs = logs.filter((log) => log.completed).length
    const total = Math.max(assignments.length, logs.length)
    return {
      assignmentCount: assignments.length,
      completedAssignments,
      workoutLogCount: logs.length,
      completedLogs,
      completionRate: total ? Math.round((Math.max(completedAssignments, completedLogs) / total) * 100) : 0,
    }
  }

  function addMember(payload = {}) {
    if (!canEdit.value) return null
    const source = payload && typeof payload === 'object' ? payload : {}
    const member = {
      ...source,
      id: createId('member'),
      joinedAt: source.joinedAt || today.value,
      avatarColor: source.avatarColor || '#dbeafe',
      isSample: source.isSample === true,
      exerciseGoal: source.exerciseGoal ?? source.goal ?? '',
    }
    members.value.unshift(member)
    if (!persistLocalState()) {
      members.value.shift()
      return null
    }
    return member
  }

  function removeMember(memberId) {
    if (!canEdit.value || !memberId) return false
    const index = members.value.findIndex((member) => member.id === memberId)
    if (index === -1) return false
    const [removed] = members.value.splice(index, 1)
    if (!persistLocalState()) {
      members.value.splice(index, 0, removed)
      return false
    }
    return true
  }

  function updateMember(payload) {
    if (!canEdit.value || !payload || typeof payload.id !== 'string') return false
    const index = members.value.findIndex((member) => member.id === payload.id)
    if (index === -1) return false

    const previous = members.value[index]
    const nextMember = { ...previous, ...payload }
    if (Object.prototype.hasOwnProperty.call(payload, 'goal') && payload.goal !== previous.goal) {
      nextMember.exerciseGoal = payload.goal
    }
    members.value[index] = nextMember
    if (!persistLocalState()) {
      members.value[index] = previous
      return false
    }
    return true
  }

  function saveMemberOnboarding(memberId, input) {
    if (!canEdit.value || !memberId) return false
    const member = getMember(memberId)
    if (!member || isSampleMember(member)) return false

    const patch = createOnboardingPatch(input)
    return updateMember({
      id: member.id,
      ...patch,
      goal: patch.exerciseGoal || member.goal || '',
    })
  }

  function addSession(payload) {
    if (!canEdit.value) return null
    const session = { ...payload, id: createId('session'), status: payload.status || '예정' }
    sessions.value.push(session)
    return session
  }

  function updateSession(payload) {
    if (!canEdit.value) return false
    const index = sessions.value.findIndex((session) => session.id === payload.id)
    if (index !== -1) sessions.value[index] = { ...sessions.value[index], ...payload }
    return index !== -1
  }

  function addMeasurement(payload) {
    if (!canEdit.value) return null
    const measurement = { ...payload, id: createId('measurement') }
    measurements.value.unshift(measurement)
    return measurement
  }

  function addPayment(payload) {
    if (!canEdit.value) return null
    const payment = { ...payload, id: createId('payment'), status: payload.status || '결제 완료' }
    payments.value.unshift(payment)
    return payment
  }

  function addNote(payload) {
    if (!canEdit.value) return null
    const note = { ...payload, id: createId('note'), createdAt: payload.createdAt || today.value, author: payload.author || currentUser.value.name }
    notes.value.unshift(note)
    return note
  }

  function addWorkoutAssignment(payload) {
    if (!canEdit.value) return null
    const assignment = {
      ...payload,
      id: createId('assignment'),
      trainerId: payload.trainerId || 'trainer-1',
      status: payload.status || '진행 중',
      exercises: Array.isArray(payload.exercises) ? payload.exercises : [],
      completedAt: null,
    }
    workoutAssignments.value.unshift(assignment)
    return assignment
  }

  function addCoachingNote(payload) {
    if (!canEdit.value) return null
    const note = {
      ...payload,
      id: createId('coaching-note'),
      trainerId: payload.trainerId || 'trainer-1',
      createdAt: payload.createdAt || new Date().toISOString(),
      readAt: null,
    }
    coachingNotes.value.unshift(note)
    return note
  }

  function addAnnouncement(payload) {
    if (!canEdit.value) return null
    const announcement = {
      ...payload,
      id: createId('announcement'),
      createdAt: payload.createdAt || new Date().toISOString(),
      author: payload.author || currentUser.value.name,
    }
    announcements.value.unshift(announcement)
    return announcement
  }

  function addWorkoutLog(payload) {
    if (!isMember.value || payload.memberId !== activeMemberId.value) return null
    const nextLog = {
      ...payload,
      id: payload.id || createId('workout-log'),
      createdAt: payload.createdAt || new Date().toISOString(),
      completed: payload.completed ?? true,
    }
    const existingIndex = workoutLogs.value.findIndex((log) => log.assignmentId && log.assignmentId === payload.assignmentId && log.memberId === payload.memberId)
    if (existingIndex !== -1) workoutLogs.value[existingIndex] = { ...workoutLogs.value[existingIndex], ...nextLog }
    else workoutLogs.value.unshift(nextLog)
    return nextLog
  }

  function completeWorkoutAssignment(assignmentId, payload = {}) {
    if (!isMember.value) return null
    const assignmentIndex = workoutAssignments.value.findIndex((assignment) => assignment.id === assignmentId && assignment.memberId === activeMemberId.value)
    if (assignmentIndex === -1) return null
    const assignment = workoutAssignments.value[assignmentIndex]
    assignment.status = '완료'
    assignment.completedAt = new Date().toISOString()
    return addWorkoutLog({
      memberId: activeMemberId.value,
      assignmentId,
      date: assignment.date,
      condition: payload.condition || '보통',
      duration: payload.duration || 0,
      memo: payload.memo || `${assignment.title} 완료`,
      completed: true,
    })
  }

  function addMealRecord(payload) {
    if (!isMember.value || payload.memberId !== activeMemberId.value) return null
    const record = {
      ...payload,
      id: createId('meal-record'),
      createdAt: payload.createdAt || new Date().toISOString(),
    }
    mealRecords.value.unshift(record)
    return record
  }

  function addCommunication(payload) {
    const memberId = payload.memberId || activeMemberId.value
    if (!memberId) return null
    if (isMember.value && memberId !== activeMemberId.value) return null
    if (!isMember.value && !canEdit.value) return null
    const authorType = isMember.value ? 'member' : 'instructor'
    const message = {
      ...payload,
      id: createId('communication'),
      memberId,
      authorType,
      authorId: isMember.value ? memberId : 'trainer-1',
      authorName: currentUser.value.name,
      type: payload.type || (isMember.value ? 'question' : 'feedback'),
      createdAt: new Date().toISOString(),
      replyToId: payload.replyToId || null,
      status: 'unread',
    }
    communications.value.push(message)
    return message
  }

  function markCommunicationRead(messageId) {
    const message = communications.value.find((item) => item.id === messageId)
    if (!message) return false
    if (isMember.value && message.memberId !== activeMemberId.value) return false
    message.status = 'read'
    return true
  }

  function markCoachingNoteRead(noteId) {
    const note = coachingNotes.value.find((item) => item.id === noteId)
    if (!note || !isMember.value || note.memberId !== activeMemberId.value) return false
    note.readAt = new Date().toISOString()
    return true
  }

  function resetLocalData() {
    if (SECURE_MODE || !canEdit.value) return false
    applyState(getInitialState())
    return persistLocalState()
  }

  return {
    members,
    memberships,
    sessions,
    measurements,
    payments,
    notes,
    workoutAssignments,
    workoutLogs,
    mealRecords,
    coachingNotes,
    communications,
    announcements,
    currentUser,
    hydrated,
    syncing,
    syncError,
    canEdit,
    isInstructor,
    isMember,
    activeMemberId,
    readOnly,
    dataOrigin,
    activeMembers,
    today,
    todaySessions,
    upcomingSessions,
    completedSessions,
    expiringMemberships,
    activeMemberships,
    totalRevenue,
    attendanceRate,
    memberStatuses: MEMBER_STATUSES,
    trainers: TRAINERS,
    getMember,
    getTrainer,
    getMembership,
    getMemberSessions,
    getMemberMeasurements,
    getMemberNotes,
    getMemberAssignments,
    getMemberWorkoutLogs,
    getMemberMealRecords,
    getMemberCoachingNotes,
    getMemberCommunications,
    getAnnouncements,
    getUnreadCommunicationCount,
    getUnreadCoachingNoteCount,
    getMemberProgress,
    addMember,
    removeMember,
    updateMember,
    saveMemberOnboarding,
    addSession,
    updateSession,
    addMeasurement,
    addPayment,
    addNote,
    addWorkoutAssignment,
    addCoachingNote,
    addAnnouncement,
    addWorkoutLog,
    completeWorkoutAssignment,
    addMealRecord,
    addCommunication,
    markCommunicationRead,
    markCoachingNoteRead,
    resetLocalData,
    hydrateRemote,
  }
})
