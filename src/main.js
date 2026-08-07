import 'element-plus/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()

  if (!auth.authRequired) return true

  if (!auth.user && to.name !== 'pt-login') {
    return { name: 'pt-login', query: { redirect: to.fullPath } }
  }

  if (auth.user && ['pt-login', 'pt-role-select'].includes(to.name)) {
    return auth.isMember ? { name: 'pt-member-dashboard' } : { name: 'pt-dashboard' }
  }

  if (auth.user && auth.isMember && !to.path.startsWith('/pt/member')) {
    return { name: 'pt-member-dashboard' }
  }

  if (auth.user && auth.isInstructor && to.path.startsWith('/pt/member')) {
    return { name: 'pt-dashboard' }
  }

  return true
})

app.use(router)

app.mount('#app')
