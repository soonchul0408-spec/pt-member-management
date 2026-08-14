<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import brandMark from '@/assets/good-habit-pt-mark.png'
import RoleSwitcher from '@/components/pt/RoleSwitcher.vue'
import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = usePtStore()
const mobileMenuOpen = ref(false)

onMounted(() => {
  void auth.initialize()
})

const activeMenu = computed(() => {
  if (route.path.startsWith('/pt/member/sessions')) return '/pt/member/schedule'
  if (route.path.startsWith('/pt/member/schedule')) return '/pt/member/schedule'
  if (route.path.startsWith('/pt/member/workouts')) return '/pt/member/workouts'
  if (route.path.startsWith('/pt/member/journal')) return '/pt/member/journal'
  if (route.path.startsWith('/pt/member/communication')) return '/pt/member/communication'
  if (route.path.startsWith('/pt/member/progress')) return '/pt/member/progress'
  if (route.path.startsWith('/pt/member/announcements')) return '/pt/member/announcements'
  if (route.path.startsWith('/pt/member')) return '/pt/member/dashboard'
  if (route.path.startsWith('/pt/consultations')) return '/pt/consultations'
  if (route.path.startsWith('/pt/members')) return '/pt/members'
  if (route.path.startsWith('/pt/schedule')) return '/pt/schedule'
  if (route.path.startsWith('/pt/sessions')) return '/pt/sessions'
  if (route.path.startsWith('/pt/measurements')) return '/pt/measurements'
  if (route.path.startsWith('/pt/payments')) return '/pt/payments'
  if (route.path.startsWith('/pt/reports')) return '/pt/reports'
  if (route.path.startsWith('/pt/settings')) return '/pt/settings'
  return '/pt/dashboard'
})

const pageTitle = computed(() => {
  const titles = {
    '/pt/dashboard': '대시보드',
    '/pt/members': '회원 관리',
    '/pt/consultations': '신규 상담 관리',
    '/pt/schedule': 'PT 일정 관리',
    '/pt/sessions': '수업 기록',
    '/pt/measurements': '운동 목표·체성분',
    '/pt/payments': '회원권·결제',
    '/pt/reports': '통계·리포트',
    '/pt/settings': '설정',
    '/pt/member/dashboard': '나의 대시보드',
    '/pt/member/schedule': '나의 PT 일정',
    '/pt/member/workouts': '오늘의 운동',
    '/pt/member/journal': '운동·식단 기록',
    '/pt/member/communication': '소통·피드백',
    '/pt/member/progress': '나의 진행률',
    '/pt/member/announcements': '공지사항',
  }
  return route.name === 'pt-member-detail' ? '회원 상세' : titles[activeMenu.value]
})

function handleMenuSelect(path) {
  mobileMenuOpen.value = false
  if (path !== route.path) router.push(path)
}

function goTo(path) {
  router.push(path)
}

async function handleSignOut() {
  await auth.signOut()
  await store.hydrateRemote()
  router.push('/pt/dashboard')
}
</script>

<template>
  <router-view v-if="['pt-public-home', 'pt-member-preview', 'pt-public-consultation', 'pt-login', 'pt-role-select'].includes(route.name)" />

  <div v-else class="pt-app-shell">
    <aside id="pt-sidebar" class="pt-sidebar" :class="{ 'is-open': mobileMenuOpen }">
      <div class="pt-brand">
        <img class="pt-brand__mark" :src="brandMark" alt="좋은 습관 PT 로고" />
        <div>
          <strong>좋은 습관 PT</strong>
          <span>회원관리 workspace</span>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="pt-sidebar__menu"
        :ellipsis="false"
        @select="handleMenuSelect"
      >
        <template v-if="auth.isInstructor">
          <p class="pt-sidebar__label">강사 화면</p>
          <el-menu-item index="/pt/dashboard"><span class="menu-symbol">⌂</span>대시보드</el-menu-item>
          <el-menu-item index="/pt/members"><span class="menu-symbol">◎</span>전체 회원 목록</el-menu-item>
          <el-menu-item v-if="auth.user" index="/pt/consultations"><span class="menu-symbol">☏</span>신규 상담 관리</el-menu-item>
          <el-menu-item index="/pt/schedule"><span class="menu-symbol">▦</span>PT 일정 관리</el-menu-item>
          <el-menu-item index="/pt/sessions"><span class="menu-symbol">✓</span>수업·운동 기록</el-menu-item>

          <p class="pt-sidebar__label">회원 데이터</p>
          <el-menu-item index="/pt/measurements"><span class="menu-symbol">↗</span>운동 목표·체성분</el-menu-item>
          <el-menu-item index="/pt/payments"><span class="menu-symbol">₩</span>회원권·결제</el-menu-item>
          <el-menu-item index="/pt/reports"><span class="menu-symbol">▥</span>통계·리포트</el-menu-item>

          <p class="pt-sidebar__label">시스템</p>
          <el-menu-item index="/pt/settings"><span class="menu-symbol">⚙</span>설정</el-menu-item>
        </template>

        <template v-else>
          <p class="pt-sidebar__label">회원 화면</p>
          <el-menu-item index="/pt/member/dashboard"><span class="menu-symbol">⌂</span>나의 대시보드</el-menu-item>
          <el-menu-item index="/pt/member/schedule"><span class="menu-symbol">▦</span>나의 PT 일정</el-menu-item>
          <el-menu-item index="/pt/member/workouts"><span class="menu-symbol">✓</span>오늘의 운동</el-menu-item>
          <el-menu-item index="/pt/member/journal"><span class="menu-symbol">✎</span>운동·식단 기록</el-menu-item>
          <el-menu-item index="/pt/member/communication"><span class="menu-symbol">☏</span>소통·피드백</el-menu-item>
          <el-menu-item index="/pt/member/progress"><span class="menu-symbol">↗</span>나의 진행률</el-menu-item>
          <el-menu-item index="/pt/member/announcements"><span class="menu-symbol">!</span>공지사항</el-menu-item>
        </template>
      </el-menu>

      <div class="pt-sidebar__footer">
        <RoleSwitcher />
        <div class="pt-sidebar__user">
          <div class="avatar" :class="auth.isMember ? 'avatar--green' : 'avatar--blue'">{{ store.currentUser.name.slice(0, 1) }}</div>
          <div>
            <strong>{{ store.currentUser.name }}</strong>
            <span>{{ auth.roleLabel }}</span>
          </div>
          <span class="online-dot" aria-label="온라인"></span>
        </div>
        <el-button v-if="auth.user" class="pt-sidebar__logout" plain @click="handleSignOut">로그아웃</el-button>
      </div>
    </aside>

    <div v-if="mobileMenuOpen" class="pt-mobile-backdrop" @click="mobileMenuOpen = false"></div>

    <div class="pt-main-shell">
      <header class="pt-topbar">
        <div class="pt-topbar__left">
          <el-button class="mobile-menu-button" text :aria-expanded="mobileMenuOpen" aria-controls="pt-sidebar" :aria-label="mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'" @click="mobileMenuOpen = !mobileMenuOpen">☰</el-button>
          <div>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>좋은 습관 PT</el-breadcrumb-item>
              <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
            <h1>{{ pageTitle }}</h1>
          </div>
        </div>
        <div class="pt-topbar__actions">
          <RoleSwitcher />
          <el-tag :type="auth.canEdit || auth.isMember ? 'success' : 'info'" effect="light" round>
            {{ auth.canEdit ? `${auth.roleLabel} · 편집 가능` : auth.isMember ? '회원 작성 가능' : '읽기 전용' }}
          </el-tag>
          <el-tag v-if="store.syncing" type="warning" effect="plain" round>동기화 중</el-tag>
          <el-tag type="info" effect="plain" round>{{ store.dataOrigin }}</el-tag>
          <el-button v-if="auth.user" plain @click="handleSignOut">로그아웃</el-button>
          <el-button v-else plain @click="goTo('/pt/login')">관리자 로그인</el-button>
          <el-button circle plain aria-label="설정" @click="goTo('/pt/settings')">⚙</el-button>
          <div class="topbar-avatar avatar" :class="auth.isMember ? 'avatar--green' : 'avatar--blue'">{{ store.currentUser.name.slice(0, 1) }}</div>
        </div>
      </header>

      <main class="pt-page-content">
        <el-alert v-if="store.syncError" class="workspace-sync-alert" type="warning" :closable="false" show-icon :title="store.syncError" />
        <el-alert v-if="auth.isDemoMode" class="workspace-sync-alert" type="info" :closable="false" show-icon title="현재는 샘플 데이터 기반 테스트 화면입니다. 역할 전환으로 강사와 회원 흐름을 확인할 수 있습니다." />
        <router-view />
      </main>
    </div>
  </div>
</template>
