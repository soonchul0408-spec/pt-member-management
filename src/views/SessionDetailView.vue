<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SessionFormDialog from '@/components/pt/SessionFormDialog.vue'
import { usePtStore } from '@/stores/ptStore'

const route = useRoute()
const router = useRouter()
const store = usePtStore()
const dialogOpen = ref(false)

const session = computed(() => store.sessions.find((item) => item.id === String(route.params.id)))
const member = computed(() => (session.value ? store.getMember(session.value.memberId) : null))
const trainer = computed(() => (session.value ? store.getTrainer(session.value.trainerId) : null))

const exerciseLinks = computed(() => {
  if (!session.value) return []
  if (Array.isArray(session.value.exerciseLinks) && session.value.exerciseLinks.length) return session.value.exerciseLinks

  const text = session.value.exercises || ''
  return [...text.matchAll(/([^(),]+?)\s*\((https?:\/\/[^)]+)\)/g)].map((match) => ({
    name: match[1].trim(),
    url: match[2],
  }))
})

const exerciseText = computed(() => {
  if (!session.value) return ''
  return (session.value.exercises || '').replace(/\s*\(https?:\/\/[^)]+\)/g, '').trim()
})

function formatDate(value) {
  return value?.replaceAll('-', '.') ?? '-'
}

function sessionType(status) {
  return status === '완료' ? 'success' : status === '취소' ? 'info' : 'primary'
}

function saveSession(payload) {
  if (!store.canEdit) return
  store.updateSession(payload)
  dialogOpen.value = false
}

function goBack() {
  router.push('/pt/sessions')
}
</script>

<template>
  <div v-if="session" class="session-detail-page">
    <div class="detail-back"><el-button text @click="goBack">← 수업 기록으로</el-button></div>

    <el-card class="session-detail-hero" shadow="never">
      <div class="session-detail-hero__top">
        <div>
          <p class="page-intro__eyebrow">SESSION DETAIL</p>
          <h2>{{ member?.name || '회원' }} · {{ session.focus || 'PT 수업' }}</h2>
          <p>{{ formatDate(session.date) }}<span v-if="session.startTime"> · {{ session.startTime }}</span><span v-if="session.duration"> · {{ session.duration }}분</span></p>
        </div>
        <div class="session-detail-hero__actions">
          <el-tag :type="sessionType(session.status)" effect="light">{{ session.status }}</el-tag>
          <el-button v-if="store.canEdit" type="primary" @click="dialogOpen = true">수업 기록 수정</el-button>
        </div>
      </div>
      <div class="session-detail-stats">
        <div><span>회원</span><strong>{{ member?.name || '-' }}</strong></div>
        <div><span>운동 초점</span><strong>{{ session.focus || '-' }}</strong></div>
        <div><span>회원 컨디션</span><strong>{{ session.condition || '기록 없음' }}</strong></div>
        <div><span>담당 트레이너</span><strong>{{ trainer?.name || '-' }}</strong></div>
      </div>
    </el-card>

    <div class="session-detail-grid">
      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">WORKOUT & VIDEO</p><h2>운동 영상·원본</h2></div><el-tag type="info" effect="plain">{{ exerciseLinks.length }}개</el-tag></div>
        <p v-if="exerciseText" class="session-detail-exercises">{{ exerciseText }}</p>
        <div v-if="exerciseLinks.length" class="session-detail-links">
          <a v-for="link in exerciseLinks" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer">
            <span class="session-detail-link__icon">▶</span>
            <span><strong>{{ link.name }}</strong><small>Notion 원본 페이지 열기</small></span>
            <span class="session-detail-link__arrow">↗</span>
          </a>
        </div>
        <el-alert v-else type="info" :closable="false" show-icon title="이 회차에는 영상 링크가 없습니다.">원본 내보내기에는 영상 파일이 포함되지 않은 회차입니다.</el-alert>
      </el-card>

      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">COACHING NOTE</p><h2>수업 코멘트</h2></div><el-tag type="success" effect="plain">기록</el-tag></div>
        <div class="session-note-list">
          <div><span>회원 컨디션</span><p>{{ session.condition || '기록 없음' }}</p></div>
          <div><span>트레이너 메모</span><p>{{ session.memo && session.memo !== 'Notion에서 가져온 회차 기록입니다.' ? session.memo : '작성된 코멘트가 없습니다.' }}</p></div>
          <div><span>다음 수업 계획</span><p>{{ session.nextPlan || '작성된 다음 계획이 없습니다.' }}</p></div>
        </div>
        <el-button v-if="store.canEdit" class="session-detail-note-button" plain type="primary" @click="dialogOpen = true">코멘트 작성·수정</el-button>
      </el-card>
    </div>

    <el-card class="panel-card session-detail-source" shadow="never">
      <div class="section-heading"><div><p class="section-eyebrow">SOURCE</p><h2>원본 기록 정보</h2></div></div>
      <div class="session-source-grid"><div><span>기록 출처</span><strong>{{ session.source === 'notion' ? 'Notion 가져오기' : '웹앱 기록' }}</strong></div><div><span>원본 수정 시각</span><strong>{{ session.sourceEditedAt ? session.sourceEditedAt.replace('T', ' ') : '해당 없음' }}</strong></div></div>
    </el-card>

    <SessionFormDialog v-if="store.canEdit" v-model="dialogOpen" :session="session" :members="store.members" :trainers="store.trainers" @save="saveSession" />
  </div>
  <el-empty v-else description="수업 기록을 찾을 수 없습니다."><el-button type="primary" @click="goBack">수업 기록으로 돌아가기</el-button></el-empty>
</template>

<style scoped>
.session-detail-hero { margin-bottom: 18px; }
.session-detail-hero__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
.session-detail-hero h2 { margin: 4px 0 0; color: #1e2f4d; font-size: 1.45rem; }
.session-detail-hero p:not(.page-intro__eyebrow) { margin: 8px 0 0; color: #7c8799; font-size: 0.82rem; }
.session-detail-hero__actions { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
.session-detail-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 22px; padding-top: 18px; border-top: 1px solid #edf0f5; }
.session-detail-stats div, .session-source-grid div { display: grid; gap: 6px; }
.session-detail-stats span, .session-source-grid span, .session-note-list span { color: #98a2b2; font-size: 0.7rem; }
.session-detail-stats strong, .session-source-grid strong { color: #34445e; font-size: 0.82rem; }
.session-detail-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); gap: 18px; }
.session-detail-exercises { margin: 0 0 16px; color: #526078; font-size: 0.82rem; line-height: 1.7; white-space: pre-wrap; }
.session-detail-links { display: grid; gap: 9px; }
.session-detail-links a { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #dbe7fb; border-radius: 12px; color: #34445e; background: #f8faff; text-decoration: none; transition: border-color 0.18s ease, transform 0.18s ease; }
.session-detail-links a:hover { border-color: #9eb8f5; transform: translateY(-1px); }
.session-detail-link__icon { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 9px; color: #2563eb; background: #e9f0ff; font-size: 0.72rem; }
.session-detail-links a span:nth-child(2) { display: grid; min-width: 0; gap: 3px; }
.session-detail-links strong { font-size: 0.8rem; }
.session-detail-links small { color: #8b96a8; font-size: 0.68rem; }
.session-detail-link__arrow { margin-left: auto; color: #8da2c7; font-size: 1rem; }
.session-note-list { display: grid; gap: 15px; }
.session-note-list div { padding-bottom: 13px; border-bottom: 1px solid #edf0f5; }
.session-note-list div:last-child { padding-bottom: 0; border-bottom: 0; }
.session-note-list p { margin: 6px 0 0; color: #526078; font-size: 0.8rem; line-height: 1.7; white-space: pre-wrap; }
.session-detail-note-button { width: 100%; margin-top: 20px; }
.session-detail-source { margin-top: 18px; }
.session-source-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 760px) { .session-detail-hero__top { flex-direction: column; } .session-detail-hero__actions { justify-content: flex-start; } .session-detail-stats, .session-detail-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 520px) { .session-detail-stats, .session-detail-grid, .session-source-grid { grid-template-columns: 1fr; } }
</style>
