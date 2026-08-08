<script setup>
import { computed } from 'vue'

import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const auth = useAuthStore()
const store = usePtStore()
const member = computed(() => store.getMember(auth.activeMemberId))
const sessions = computed(() => (member.value ? store.getMemberSessions(member.value.id) : []))
const assignments = computed(() => (member.value ? store.getMemberAssignments(member.value.id) : []))
const notionSessions = computed(() => sessions.value.filter((session) => session.source === 'notion'))
const notionNotes = computed(() => (member.value ? store.getMemberNotes(member.value.id).filter((note) => note.source === 'notion') : []))

const genericSessionDescription = 'Notion 회차 기록'
const genericSessionMemo = 'Notion에서 가져온 회차 기록입니다.'

function formatDate(value) {
  return value?.replaceAll('-', '.') ?? '-'
}

function sessionType(status) {
  return status === '완료' ? 'success' : status === '취소' ? 'info' : 'primary'
}

function sessionDetails(session) {
  const details = []
  if (session.exercises && session.exercises !== genericSessionDescription) details.push({ label: '운동 메모', value: session.exercises })
  if (session.memo && session.memo !== genericSessionMemo && session.memo !== session.exercises) details.push({ label: '회차 메모', value: session.memo })
  if (session.condition && session.condition !== '기록 확인 필요') details.push({ label: '컨디션', value: session.condition })
  return details
}

function fallbackSessionDescription(session) {
  return sessionDetails(session).length ? '' : '세부 기록이 없는 회차입니다.'
}

function formatSourceEditedAt(value) {
  return value?.replace('T', ' ').replace('Z', '') ?? '-'
}
</script>

<template>
  <div v-if="member" class="member-page">
    <div class="page-intro"><div><p class="section-eyebrow">MY SCHEDULE</p><h2>나의 PT 일정</h2><p>{{ member.name }}님에게 등록된 수업과 운동 과제를 확인하세요.</p></div></div>

    <div class="two-column-grid">
      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">PT SESSION</p><h2>수업 일정</h2></div><el-tag type="info" effect="plain">{{ sessions.length }}개</el-tag></div>
        <div v-if="sessions.length" class="member-schedule-list">
          <div v-for="session in sessions" :key="session.id" class="member-schedule-item">
            <div class="member-schedule-item__date"><strong>{{ formatDate(session.date).slice(5) }}</strong><span>{{ session.startTime }}</span></div>
            <div class="member-schedule-item__body"><strong>{{ session.focus || 'PT 수업' }}</strong><p>{{ session.nextPlan || '수업 내용을 확인해 주세요.' }}</p><small>{{ session.duration ? `${session.duration}분` : '회차 기록' }} · {{ store.getTrainer(session.trainerId)?.name || '-' }}</small></div>
            <el-tag :type="sessionType(session.status)" size="small" effect="light">{{ session.status }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="등록된 PT 일정이 없습니다." :image-size="80" />
      </el-card>

      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">ASSIGNMENTS</p><h2>운동 과제 일정</h2></div><el-tag type="success" effect="plain">{{ assignments.length }}개</el-tag></div>
        <div v-if="assignments.length" class="member-assignment-cards">
          <div v-for="assignment in assignments" :key="assignment.id" class="member-assignment-card">
            <div class="member-assignment-card__top"><el-tag :type="assignment.status === '완료' ? 'success' : 'warning'" size="small" effect="light">{{ assignment.status }}</el-tag><span>{{ formatDate(assignment.date) }}</span></div>
            <strong>{{ assignment.title }}</strong><p>{{ assignment.description }}</p><small>{{ assignment.exercises.length }}개 운동</small>
          </div>
        </div>
        <el-empty v-else description="등록된 운동 과제가 없습니다." :image-size="80" />
      </el-card>
    </div>

    <el-card v-if="notionSessions.length" class="panel-card imported-records-panel" shadow="never">
      <div class="section-heading">
        <div><p class="section-eyebrow">IMPORTED MEMBER RECORDS</p><h2>가져온 회차 기록</h2></div>
        <div class="imported-records-panel__heading-meta"><el-tag type="info" effect="light">Notion 기록</el-tag><el-tag type="info" effect="plain">{{ notionSessions.length }}회</el-tag></div>
      </div>
      <el-alert type="info" :closable="false" show-icon title="기존 회원 기록을 보존해 정리했습니다. 원본 세부 내용이 없는 회차도 날짜와 수업 주제를 확인할 수 있습니다." />

      <div class="imported-session-list">
        <article v-for="session in notionSessions" :key="session.id" class="imported-session-item">
          <div class="imported-session-item__header">
            <div class="imported-session-item__date"><strong>{{ formatDate(session.date) }}</strong><span>{{ session.startTime || '-' }}</span></div>
            <div class="imported-session-item__meta"><el-tag type="info" size="small" effect="light">Notion 회차 기록</el-tag><el-tag :type="sessionType(session.status)" size="small" effect="plain">{{ session.status }}</el-tag></div>
          </div>
          <h3>{{ session.focus || 'PT 수업' }}</h3>
          <div v-if="sessionDetails(session).length" class="imported-session-item__details">
            <p v-for="detail in sessionDetails(session)" :key="detail.label"><strong>{{ detail.label }}</strong><span>{{ detail.value }}</span></p>
          </div>
          <div v-if="session.exerciseLinks?.length" class="imported-session-item__links">
            <a v-for="link in session.exerciseLinks" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer">▶ {{ link.name }} 영상·원본 보기</a>
          </div>
          <p v-if="!sessionDetails(session).length && !session.exerciseLinks?.length" class="imported-session-item__empty">{{ fallbackSessionDescription(session) }}</p>
          <small v-if="session.sourceEditedAt" class="imported-session-item__source">원본 확인 시각: {{ formatSourceEditedAt(session.sourceEditedAt) }}</small>
        </article>
      </div>

      <div v-if="notionNotes.length" class="imported-notes-section">
        <div class="imported-notes-section__heading"><h3>상세 메모</h3><el-tag type="info" size="small" effect="plain">{{ notionNotes.length }}개</el-tag></div>
        <div class="imported-note-list">
          <article v-for="note in notionNotes" :key="note.id" class="imported-note-item">
            <div class="imported-note-item__meta"><el-tag type="info" size="small" effect="light">가져온 메모</el-tag><span>{{ formatDate(note.createdAt?.slice(0, 10)) }}</span></div>
            <h4>{{ note.title || '회원 기록 메모' }}</h4>
            <p>{{ note.content }}</p>
          </article>
        </div>
      </div>
    </el-card>
  </div>
  <el-empty v-else description="회원 정보를 찾을 수 없습니다." :image-size="100" />
</template>

<style scoped>
.page-intro h2 { margin: 4px 0 0; color: #1e2f4d; font-size: 1.5rem; }
.page-intro p:not(.section-eyebrow) { margin: 9px 0 0; color: #7c8799; font-size: 0.86rem; }
.member-schedule-list, .member-assignment-cards { display: grid; gap: 11px; }
.member-schedule-item { display: flex; align-items: center; gap: 13px; padding: 14px; border: 1px solid #e8edf5; border-radius: 13px; }
.member-schedule-item__date { display: grid; flex: 0 0 62px; gap: 4px; place-items: center; padding: 9px 5px; border-radius: 10px; color: #2563eb; background: #eff4ff; }
.member-schedule-item__date strong { font-size: 0.8rem; }
.member-schedule-item__date span, .member-schedule-item__body small, .member-assignment-card small { color: #98a2b2; font-size: 0.7rem; }
.member-schedule-item__body { min-width: 0; flex: 1; }
.member-schedule-item__body > strong, .member-assignment-card > strong { color: #34445e; font-size: 0.84rem; }
.member-schedule-item__body p, .member-assignment-card p { margin: 5px 0; overflow: hidden; color: #7c8799; font-size: 0.76rem; text-overflow: ellipsis; white-space: nowrap; }
.member-assignment-card { padding: 15px; border: 1px solid #e8edf5; border-radius: 13px; background: #fbfcff; }
.member-assignment-card__top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 13px; color: #98a2b2; font-size: 0.72rem; }
.imported-records-panel { margin-top: 18px; }
.imported-records-panel__heading-meta, .imported-session-item__meta, .imported-note-item__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.imported-session-list { display: grid; gap: 10px; max-height: 720px; margin-top: 16px; padding-right: 4px; overflow: auto; }
.imported-session-item { padding: 15px; border: 1px solid #e3eaf5; border-radius: 14px; background: #fbfcff; }
.imported-session-item__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.imported-session-item__date { display: flex; align-items: baseline; gap: 9px; color: #526078; }
.imported-session-item__date strong { font-size: 0.84rem; }
.imported-session-item__date span, .imported-session-item__source, .imported-note-item__meta span { color: #98a2b2; font-size: 0.7rem; }
.imported-session-item h3 { margin: 12px 0 9px; color: #34445e; font-size: 0.92rem; }
.imported-session-item__details { display: grid; gap: 7px; }
.imported-session-item__details p { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 10px; margin: 0; color: #66748b; font-size: 0.78rem; line-height: 1.65; }
.imported-session-item__details p strong { color: #8b96a8; font-size: 0.72rem; }
.imported-session-item__details p span, .imported-note-item p { min-width: 0; overflow-wrap: anywhere; white-space: pre-wrap; word-break: keep-all; }
.imported-session-item__links { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
.imported-session-item__links a { padding: 6px 9px; border: 1px solid #dbe7fb; border-radius: 8px; color: #2563eb; background: #f5f8ff; font-size: 0.7rem; font-weight: 750; text-decoration: none; }
.imported-session-item__links a:hover { border-color: #9eb8f5; background: #edf3ff; }
.imported-session-item__empty { margin: 0; color: #98a2b2; font-size: 0.76rem; line-height: 1.6; }
.imported-session-item__source { display: block; margin-top: 12px; }
.imported-notes-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid #edf0f5; }
.imported-notes-section__heading { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
.imported-notes-section__heading h3 { margin: 0; color: #34445e; font-size: 0.92rem; }
.imported-note-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.imported-note-item { padding: 14px; border: 1px solid #e8edf5; border-radius: 13px; background: #fff; }
.imported-note-item h4 { margin: 11px 0 7px; color: #34445e; font-size: 0.82rem; }
.imported-note-item p { margin: 0; color: #66748b; font-size: 0.76rem; line-height: 1.65; }
@media (max-width: 560px) { .member-schedule-item { align-items: flex-start; flex-wrap: wrap; } .member-schedule-item .el-tag { margin-left: 76px; } }
@media (max-width: 700px) { .imported-session-item__header { flex-direction: column; gap: 8px; } .imported-note-list { grid-template-columns: 1fr; } }
</style>
