import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/pt/role-select' },
    { path: '/pt', redirect: '/pt/role-select' },
    { path: '/pt/role-select', name: 'pt-role-select', component: () => import('../views/RoleSelectionView.vue') },
    { path: '/pt/login', name: 'pt-login', component: () => import('../views/LoginView.vue') },
    { path: '/pt/dashboard', name: 'pt-dashboard', component: () => import('../views/DashboardView.vue') },
    { path: '/pt/members', name: 'pt-members', component: () => import('../views/MembersView.vue') },
    { path: '/pt/members/:id', name: 'pt-member-detail', component: () => import('../views/MemberDetailView.vue') },
    { path: '/pt/schedule', name: 'pt-schedule', component: () => import('../views/ScheduleView.vue') },
    { path: '/pt/sessions', name: 'pt-sessions', component: () => import('../views/SessionsView.vue') },
    { path: '/pt/sessions/:id', name: 'pt-session-detail', component: () => import('../views/SessionDetailView.vue') },
    { path: '/pt/measurements', name: 'pt-measurements', component: () => import('../views/MeasurementsView.vue') },
    { path: '/pt/payments', name: 'pt-payments', component: () => import('../views/PaymentsView.vue') },
    { path: '/pt/reports', name: 'pt-reports', component: () => import('../views/ReportsView.vue') },
    { path: '/pt/settings', name: 'pt-settings', component: () => import('../views/SettingsView.vue') },
    { path: '/pt/member', redirect: '/pt/member/dashboard' },
    { path: '/pt/member/dashboard', name: 'pt-member-dashboard', component: () => import('../views/member/MemberDashboardView.vue') },
    { path: '/pt/member/schedule', name: 'pt-member-schedule', component: () => import('../views/member/MemberScheduleView.vue') },
    { path: '/pt/member/workouts', name: 'pt-member-workouts', component: () => import('../views/member/MemberWorkoutView.vue') },
    { path: '/pt/member/journal', name: 'pt-member-journal', component: () => import('../views/member/MemberJournalView.vue') },
    { path: '/pt/member/communication', name: 'pt-member-communication', component: () => import('../views/member/MemberCommunicationView.vue') },
    { path: '/pt/member/progress', name: 'pt-member-progress', component: () => import('../views/member/MemberProgressView.vue') },
    { path: '/pt/member/announcements', name: 'pt-member-announcements', component: () => import('../views/member/MemberAnnouncementsView.vue') },
  ],
})

export default router
