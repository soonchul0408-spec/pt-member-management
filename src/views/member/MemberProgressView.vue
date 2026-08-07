<script setup>
import { computed } from 'vue'

import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const auth = useAuthStore()
const store = usePtStore()
const member = computed(() => store.getMember(auth.activeMemberId))
const progress = computed(() => (member.value ? store.getMemberProgress(member.value.id) : { completionRate: 0, completedAssignments: 0, assignmentCount: 0, workoutLogCount: 0 }))
const measurements = computed(() => (member.value ? store.getMemberMeasurements(member.value.id) : []))
const sessions = computed(() => (member.value ? store.getMemberSessions(member.value.id) : []))
const latest = computed(() => measurements.value[0])
const first = computed(() => measurements.value[measurements.value.length - 1])
const weightChange = computed(() => latest.value && first.value && latest.value !== first.value ? Number((latest.value.weight - first.value.weight).toFixed(1)) : 0)

function formatDate(value) { return value?.replaceAll('-', '.') ?? '-' }
</script>

<template>
  <div v-if="member" class="member-page">
    <div class="page-intro"><div><p class="section-eyebrow">MY PROGRESS</p><h2>나의 목표와 진행률</h2><p>{{ member.goal }}</p></div><el-tag type="success" effect="light" round>회원 화면</el-tag></div>
    <div class="progress-overview-grid">
      <el-card class="progress-main-card" shadow="never"><div class="progress-main-card__heading"><div><span>운동 과제 완료율</span><strong>{{ progress.completionRate }}<small>%</small></strong></div><el-tag type="success" effect="light">개인 기록</el-tag></div><el-progress :percentage="progress.completionRate" :stroke-width="14" color="#2563eb" /><p>완료한 운동 과제 {{ progress.completedAssignments }}개 · 누적 운동일지 {{ progress.workoutLogCount }}개</p></el-card>
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">GOAL</p><h2>나의 목표</h2></div></div><p class="goal-copy">{{ member.goal }}</p><div class="goal-meta"><span>담당 트레이너</span><strong>{{ store.getTrainer(member.trainerId)?.name || '-' }}</strong></div><div class="goal-meta"><span>완료 수업</span><strong>{{ sessions.filter((session) => session.status === '완료').length }}회</strong></div></el-card>
    </div>

    <el-card class="panel-card progress-measurements-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">BODY CHECK</p><h2>최근 체성분</h2></div><span class="muted-text">마지막 측정 {{ formatDate(latest?.measuredAt) }}</span></div><div v-if="latest" class="member-measurement-grid"><div><span>체중</span><strong>{{ latest.weight }}<small>kg</small></strong><em :class="weightChange > 0 ? 'is-up' : 'is-down'">{{ weightChange > 0 ? '+' : '' }}{{ weightChange }}kg 변화</em></div><div><span>골격근량</span><strong>{{ latest.muscleMass }}<small>kg</small></strong><em>최근 기록</em></div><div><span>체지방률</span><strong>{{ latest.bodyFat }}<small>%</small></strong><em>최근 기록</em></div></div><el-empty v-else description="아직 체성분 기록이 없습니다." :image-size="80" /></el-card>
  </div>
  <el-empty v-else description="회원 정보를 찾을 수 없습니다." :image-size="100" />
</template>

<style scoped>
.page-intro { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-intro h2 { margin: 4px 0 0; color: #1e2f4d; font-size: 1.5rem; }
.page-intro p:not(.section-eyebrow) { margin: 9px 0 0; color: #7c8799; font-size: 0.86rem; }
.progress-overview-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr); gap: 18px; margin-top: 18px; }
.progress-main-card { display: grid; gap: 24px; padding: 23px; border: 1px solid #dbe6ff; border-radius: 17px; background: linear-gradient(140deg, #f3f7ff, #fff); }
.progress-main-card__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.progress-main-card__heading div { display: grid; gap: 8px; }
.progress-main-card__heading span { color: #7c8799; font-size: 0.78rem; }
.progress-main-card__heading strong { color: #1e3a8a; font-size: 2.3rem; line-height: 1; }
.progress-main-card__heading small { margin-left: 3px; color: #8190aa; font-size: 0.95rem; }
.progress-main-card p { margin: 0; color: #7c8799; font-size: 0.76rem; }
.goal-copy { min-height: 80px; margin: 4px 0 20px; color: #526078; font-size: 0.87rem; line-height: 1.7; }
.goal-meta { display: flex; justify-content: space-between; gap: 12px; padding-top: 11px; border-top: 1px solid #eef1f5; color: #8b96a8; font-size: 0.74rem; }
.goal-meta + .goal-meta { margin-top: 10px; }
.goal-meta strong { color: #34445e; }
.progress-measurements-card { margin-top: 18px; }
.member-measurement-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.member-measurement-grid > div { display: grid; gap: 7px; padding: 17px; border-radius: 13px; background: #f8fafc; }
.member-measurement-grid span, .member-measurement-grid em { color: #8b96a8; font-size: 0.72rem; font-style: normal; }
.member-measurement-grid strong { color: #1e3a8a; font-size: 1.45rem; }
.member-measurement-grid small { margin-left: 3px; color: #8b96a8; font-size: 0.72rem; }
.member-measurement-grid em.is-up { color: #d97706; }
.member-measurement-grid em.is-down { color: #16805a; }
@media (max-width: 760px) { .progress-overview-grid { grid-template-columns: 1fr; } .member-measurement-grid { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .page-intro { flex-direction: column; } }
</style>
