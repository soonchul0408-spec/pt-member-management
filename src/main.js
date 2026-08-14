import 'element-plus/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/authStore'

const PUBLIC_ROUTE_NAMES = new Set(['pt-public-home', 'pt-member-preview', 'pt-public-consultation', 'pt-public-privacy'])

function isMemberRoute(path) {
  return path === '/pt/member' || path.startsWith('/pt/member/')
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()

  if (to.meta.requiresInstructorAuth) {
    if (!auth.user) return { name: 'pt-login', query: { redirect: to.fullPath } }
    if (!auth.isInstructor) return { name: 'pt-member-dashboard' }
  }

  // 인증이 없는 로컬 데모에서 주소창으로 대시보드 경로를 직접 열어도
  // 사이드바·역할 선택기와 실제 화면이 서로 다른 역할을 가리키지 않도록 맞춥니다.
  if (!auth.authRequired && auth.isDemoMode) {
    const isDemoMemberRoute = isMemberRoute(to.path) && to.name !== 'pt-member-preview'
    const isDemoInstructorRoute = to.path.startsWith('/pt/')
      && !isDemoMemberRoute
      && !PUBLIC_ROUTE_NAMES.has(to.name)
      && !['pt-login', 'pt-role-select'].includes(to.name)

    if (isDemoMemberRoute && !auth.isMember) auth.switchDemoRole('member')
    if (isDemoInstructorRoute && !auth.isInstructor) auth.switchDemoRole('instructor')
  }

  if (!auth.authRequired) return true

  if (PUBLIC_ROUTE_NAMES.has(to.name)) return true

  if (!auth.user && to.name !== 'pt-login') {
    return { name: 'pt-login', query: { redirect: to.fullPath } }
  }

  if (auth.user && ['pt-login', 'pt-role-select'].includes(to.name)) {
    return auth.isMember ? { name: 'pt-member-dashboard' } : { name: 'pt-dashboard' }
  }

  if (auth.user && auth.isMember && !isMemberRoute(to.path)) {
    return { name: 'pt-member-dashboard' }
  }

  if (auth.user && auth.isInstructor && isMemberRoute(to.path)) {
    return { name: 'pt-dashboard' }
  }

  return true
})

app.use(router)

app.mount('#app')
