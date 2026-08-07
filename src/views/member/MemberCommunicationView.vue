<script setup>
import { computed } from 'vue'

import CommunicationThread from '@/components/pt/CommunicationThread.vue'
import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const auth = useAuthStore()
const store = usePtStore()
const member = computed(() => store.getMember(auth.activeMemberId))
const coachingNotes = computed(() => (member.value ? store.getMemberCoachingNotes(member.value.id) : []))

function formatDate(value) {
  return value ? new Date(value).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
}
</script>

<template>
  <div v-if="member" class="member-page">
    <div class="page-intro"><div><p class="section-eyebrow">COMMUNICATION</p><h2>강사와 소통하기</h2><p>강사에게 질문을 남기고 피드백과 코칭 메모를 한 곳에서 확인하세요.</p></div><el-tag type="success" effect="light" round>회원 화면</el-tag></div>
    <div class="two-column-grid communication-page-grid">
      <el-card class="panel-card" shadow="never"><CommunicationThread :member-id="member.id" /></el-card>
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">COACHING NOTES</p><h2>강사 코칭 메모</h2></div><el-tag type="primary" effect="plain">{{ coachingNotes.length }}개</el-tag></div><div v-if="coachingNotes.length" class="coaching-note-list"><article v-for="note in coachingNotes" :key="note.id" class="coaching-note-card"><div class="coaching-note-card__top"><el-tag type="primary" size="small" effect="light">강사 작성</el-tag><span>{{ formatDate(note.createdAt) }}</span></div><h3>{{ note.title }}</h3><p>{{ note.content }}</p><el-button v-if="!note.readAt" text type="primary" size="small" @click="store.markCoachingNoteRead(note.id)">읽음 처리</el-button></article></div><el-empty v-else description="아직 코칭 메모가 없습니다." :image-size="80" /></el-card>
    </div>
  </div>
  <el-empty v-else description="회원 정보를 찾을 수 없습니다." :image-size="100" />
</template>

<style scoped>
.page-intro { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-intro h2 { margin: 4px 0 0; color: #1e2f4d; font-size: 1.5rem; }
.page-intro p:not(.section-eyebrow) { margin: 9px 0 0; color: #7c8799; font-size: 0.86rem; }
.communication-page-grid { margin-top: 18px; }
.coaching-note-list { display: grid; gap: 11px; }
.coaching-note-card { padding: 15px; border: 1px solid #dbe6ff; border-radius: 13px; background: #f7f9ff; }
.coaching-note-card__top { display: flex; justify-content: space-between; gap: 12px; color: #8b96a8; font-size: 0.7rem; }
.coaching-note-card h3 { margin: 13px 0 7px; color: #34445e; font-size: 0.88rem; }
.coaching-note-card p { margin: 0; color: #5e6d84; font-size: 0.79rem; line-height: 1.65; }
.coaching-note-card .el-button { padding-left: 0; }
@media (max-width: 520px) { .page-intro { flex-direction: column; } }
</style>
