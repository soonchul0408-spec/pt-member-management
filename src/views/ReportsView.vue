<script setup>
import { computed } from 'vue'

import { usePtStore } from '@/stores/ptStore'

const store = usePtStore()

const trainerStats = computed(() => store.trainers.map((trainer) => {
  const sessions = store.sessions.filter((session) => session.trainerId === trainer.id)
  const completed = sessions.filter((session) => session.status === '완료').length
  return { ...trainer, total: sessions.length, completed, rate: sessions.length ? Math.round((completed / sessions.length) * 100) : 0 }
}))

const statusStats = computed(() => [
  { label: '활성 회원', value: store.members.filter((member) => member.status === '활성').length, color: '#2563eb' },
  { label: '휴식 회원', value: store.members.filter((member) => member.status === '휴식').length, color: '#d97706' },
  { label: '종료 회원', value: store.members.filter((member) => member.status === '종료').length, color: '#94a3b8' },
])

const maxTrainerSessions = computed(() => Math.max(...trainerStats.value.map((trainer) => trainer.total), 1))
const formatCurrency = (value) => `${Number(value).toLocaleString('ko-KR')}원`
</script>

<template>
  <div class="reports-page">
    <section class="page-intro"><div><p class="page-intro__eyebrow">REPORTS & INSIGHTS</p><h2>통계·리포트</h2><p>수업 운영, 회원 상태, 트레이너별 진행 현황을 요약해서 확인합니다.</p></div><el-tag type="info" effect="plain">샘플 데이터 기준</el-tag></section>
    <section class="report-summary"><div class="report-summary__item"><span>전체 수업</span><strong>{{ store.sessions.length }}건</strong></div><div class="report-summary__item"><span>완료 수업</span><strong>{{ store.completedSessions.length }}건</strong></div><div class="report-summary__item"><span>출석률</span><strong>{{ store.attendanceRate }}%</strong></div><div class="report-summary__item"><span>결제 완료액</span><strong>{{ formatCurrency(store.totalRevenue) }}</strong></div></section>
    <section class="report-grid">
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">TRAINER PERFORMANCE</p><h2>트레이너별 수업 현황</h2></div></div><div class="report-bar-list"><div v-for="trainer in trainerStats" :key="trainer.id" class="report-bar-list__item"><div class="report-bar-list__label"><span>{{ trainer.name }} · {{ trainer.role }}</span><strong>{{ trainer.total }}건</strong></div><el-progress :percentage="Math.round((trainer.total / maxTrainerSessions) * 100)" :show-text="false" :color="trainer.color" /><span class="muted-text">완료 {{ trainer.completed }}건 · 완료율 {{ trainer.rate }}%</span></div></div></el-card>
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">MEMBER STATUS</p><h2>회원 상태 분포</h2></div></div><div class="status-report-list"><div v-for="item in statusStats" :key="item.label" class="status-report-item"><span class="status-report-item__dot" :style="{ background: item.color }"></span><span>{{ item.label }}</span><strong>{{ item.value }}명</strong></div></div><div class="member-status-progress"><div v-for="item in statusStats" :key="item.label" :style="{ width: `${store.members.length ? (item.value / store.members.length) * 100 : 0}%`, background: item.color }"></div></div><p class="report-note">회원권 만료 예정과 휴식 상태를 주기적으로 확인하면 상담 일정을 정리하기 좋습니다.</p></el-card>
    </section>
    <section class="two-column-grid"><el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">OPERATING CHECKLIST</p><h2>운영 점검 항목</h2></div></div><div class="checklist"><div class="checklist-item"><span class="checklist-item__mark is-done">✓</span><div><strong>오늘 수업 일정 확인</strong><small>{{ store.todaySessions.length }}건의 수업이 등록되어 있습니다.</small></div></div><div class="checklist-item"><span class="checklist-item__mark">!</span><div><strong>회원권 만료 상담</strong><small>{{ store.expiringMemberships.length }}명의 회원권 상태를 확인하세요.</small></div></div><div class="checklist-item"><span class="checklist-item__mark is-done">✓</span><div><strong>수업 기록 업데이트</strong><small>완료 수업 {{ store.completedSessions.length }}건이 기록되어 있습니다.</small></div></div></div></el-card><el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">DATA NOTE</p><h2>기록 운영 원칙</h2></div></div><ul class="report-guidelines"><li>수업 직후 진행 운동과 회원 컨디션을 기록합니다.</li><li>체성분 수치는 측정일과 함께 입력합니다.</li><li>상담 메모에는 다음 확인할 내용을 남깁니다.</li><li>실제 운영 전에는 로그인과 권한 관리를 연결합니다.</li></ul></el-card></section>
  </div>
</template>

<style scoped>
.status-report-list {
  display: grid;
  gap: 15px;
}

.status-report-item {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #65738a;
  font-size: 0.82rem;
}

.status-report-item strong {
  margin-left: auto;
  color: #334155;
  font-weight: 850;
}

.status-report-item__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.member-status-progress {
  display: flex;
  overflow: hidden;
  height: 12px;
  margin-top: 23px;
  border-radius: 999px;
  background: #eef1f5;
}

.report-note {
  margin-top: 20px;
  color: #8793a6;
  font-size: 0.78rem;
  line-height: 1.6;
}

.checklist,
.report-guidelines {
  display: grid;
  gap: 12px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border: 1px solid #eef1f5;
  border-radius: 11px;
}

.checklist-item__mark {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  color: #b45309;
  background: #fffbeb;
  font-weight: 850;
}

.checklist-item__mark.is-done {
  color: #047857;
  background: #ecfdf5;
}

.checklist-item strong,
.checklist-item small {
  display: block;
}

.checklist-item strong {
  color: #415069;
  font-size: 0.8rem;
}

.checklist-item small {
  margin-top: 3px;
  color: #9aa4b4;
  font-size: 0.7rem;
}

.report-guidelines {
  margin: 0;
  padding-left: 19px;
  color: #66748a;
  font-size: 0.82rem;
  line-height: 1.8;
}
</style>
