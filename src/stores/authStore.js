import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { supabase, supabaseConfigured } from '@/lib/supabase'
import { localJsonStorage } from '@/services/storageAdapter'
import { DEMO_ROLE_STORAGE_KEY } from '@/services/storageKeys'

const EDITOR_ROLES = ['instructor', 'editor', 'admin']
const localEditorMode = import.meta.env.DEV && import.meta.env.VITE_LOCAL_EDITOR_MODE === 'true'
const memberLoginEmail = import.meta.env.VITE_MEMBER_LOGIN_EMAIL?.trim()

// 운영 빌드는 환경변수 누락으로 데모 권한이 열리지 않도록 인증을 기본 요구합니다.
// 로컬 개발에서만 Supabase 없이 역할 데모를 사용할 수 있습니다.
const AUTH_REQUIRED = import.meta.env.PROD || supabaseConfigured || import.meta.env.VITE_REQUIRE_AUTH === 'true'

function readDemoPreferences() {
  if (typeof window === 'undefined') return { role: 'instructor', memberId: 'member-1' }

  try {
    const saved = localJsonStorage.read(DEMO_ROLE_STORAGE_KEY, null).value
    return {
      role: saved?.role === 'member' ? 'member' : 'instructor',
      memberId: saved?.memberId || 'member-1',
    }
  } catch {
    return { role: 'instructor', memberId: 'member-1' }
  }
}

export const useAuthStore = defineStore('auth', () => {
  const demoPreferences = readDemoPreferences()
  const user = ref(null)
  const profile = ref(null)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref('')
  const demoRole = ref(demoPreferences.role)
  const demoMemberId = ref(demoPreferences.memberId)

  const role = computed(() => profile.value?.role ?? 'viewer')
  const isDemoMode = computed(() => !AUTH_REQUIRED && !user.value)
  const currentRole = computed(() => {
    if (user.value) return EDITOR_ROLES.includes(role.value) ? 'instructor' : 'member'
    return isDemoMode.value ? demoRole.value : null
  })
  const isInstructor = computed(() => currentRole.value === 'instructor')
  const isMember = computed(() => currentRole.value === 'member')
  const canEdit = computed(() => {
    if (isDemoMode.value) return isInstructor.value
    return Boolean(user.value) && isInstructor.value && EDITOR_ROLES.includes(role.value)
  })
  const isLocalEditor = computed(() => isDemoMode.value && isInstructor.value && localEditorMode)
  const isAdmin = computed(() => role.value === 'admin')
  const activeMemberId = computed(() => {
    if (user.value) return profile.value?.member_id || profile.value?.memberId || null
    return demoMemberId.value
  })
  const displayName = computed(() => {
    if (profile.value?.name) return profile.value.name
    if (user.value?.email) return user.value.email
    if (AUTH_REQUIRED) return '로그인 필요'
    if (isMember.value) return '회원 데모'
    return '김도윤'
  })
  const roleLabel = computed(() => {
    if (AUTH_REQUIRED && !user.value) return '로그인 필요'
    if (isDemoMode.value) return isMember.value ? '회원 데모' : '강사 데모'
    if (role.value === 'admin') return '관리자 · 강사'
    if (EDITOR_ROLES.includes(role.value)) return '강사'
    return '회원'
  })

  function persistDemoPreferences() {
    if (typeof window === 'undefined') return
    localJsonStorage.write(DEMO_ROLE_STORAGE_KEY, { role: demoRole.value, memberId: demoMemberId.value })
  }

  function switchDemoRole(nextRole, memberId = demoMemberId.value) {
    if (AUTH_REQUIRED || user.value || !['instructor', 'member'].includes(nextRole)) return false
    demoRole.value = nextRole
    if (memberId) demoMemberId.value = memberId
    persistDemoPreferences()
    return true
  }

  function setDemoMember(memberId) {
    if (AUTH_REQUIRED || user.value || !memberId) return false
    demoMemberId.value = memberId
    demoRole.value = 'member'
    persistDemoPreferences()
    return true
  }

  async function loadProfile(nextUser) {
    if (!supabase || !nextUser) {
      profile.value = null
      return
    }

    const { data, error: profileError } = await supabase
      .from('pt_profiles')
      .select('id, name, role, studio, phone, member_id')
      .eq('id', nextUser.id)
      .maybeSingle()

    if (profileError) {
      profile.value = { id: nextUser.id, name: nextUser.email, role: 'member', member_id: null }
      error.value = '사용자 권한 정보를 불러오지 못해 연결된 기록만 표시합니다.'
      return
    }

    profile.value = data || { id: nextUser.id, name: nextUser.email, role: 'member', member_id: null }
  }

  async function applySession(session) {
    user.value = session?.user ?? null
    error.value = ''
    await loadProfile(user.value)
  }

  async function initialize() {
    if (initialized.value) return
    initialized.value = true

    if (!supabase) return

    const { data } = await supabase.auth.getSession()
    await applySession(data.session)

    supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void applySession(session)
      }, 0)
    })
  }

  async function signIn(email, password) {
    if (!supabase) {
      error.value = '보호된 화면을 사용하려면 Supabase 환경변수를 먼저 설정해야 합니다.'
      return false
    }

    loading.value = true
    error.value = ''
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    loading.value = false

    if (signInError) {
      error.value = '이메일 또는 비밀번호를 확인해 주세요.'
      return false
    }

    await applySession(data.session)
    return true
  }

  async function signInMember(password) {
    if (!memberLoginEmail) {
      error.value = '회원 로그인 설정이 아직 완료되지 않았습니다.'
      return false
    }

    return signIn(memberLoginEmail, password)
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    user.value = null
    profile.value = null
    error.value = ''
  }

  function clearError() {
    error.value = ''
  }

  return {
    authConfigured: supabaseConfigured,
    authRequired: AUTH_REQUIRED,
    memberLoginConfigured: Boolean(memberLoginEmail),
    isLocalEditor,
    isDemoMode,
    user,
    profile,
    initialized,
    loading,
    error,
    role,
    currentRole,
    currentMemberId: activeMemberId,
    isInstructor,
    isMember,
    activeMemberId,
    canEdit,
    isAdmin,
    displayName,
    roleLabel,
    switchDemoRole,
    setDemoMember,
    initialize,
    signIn,
    signInMember,
    signOut,
    clearError,
  }
})
