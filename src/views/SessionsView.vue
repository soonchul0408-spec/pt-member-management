<script setup>
import { computed, ref } from 'vue'

import SessionFormDialog from '@/components/pt/SessionFormDialog.vue'
import { usePtStore } from '@/stores/ptStore'

const store = usePtStore()
const search = ref('')
const statusFilter = ref('전체')
const dialogOpen = ref(false)
const editingSession = ref(null)

const sessions = computed(() => store.sessions.filter((session) => {
  const member = store.getMember(session.memberId)
  const keyword = search.value.trim().toLowerCase()
  const matchesSearch = !keyword || member?.name.toLowerCase().includes(keyword) || session.focus?.toLowerCase().includes(keyword)
  const matchesStatus = statusFilter.value === '전체' || session.status === statusFilter.value
  return matchesSearch && matchesStatus
}).sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)))

function saveSession(payload) {
  if (!store.canEdit) return
  if (payload.id) store.updateSession(payload)
  else store.addSession(payload)
}

function memberName(memberId) {
  return store.getMember(memberId)?.name ?? '-'
}
</script>

<template>
  <div class="sessions-page">
    <section class="page-intro"><div><p class="page-intro__eyebrow">SESSION LOG</p><h2>수업 기록</h2><p>수업 후 진행 운동과 회원 컨디션, 다음 계획을 남깁니다.</p></div><el-button v-if="store.canEdit" type="primary" @click="editingSession = null; dialogOpen = true">+ 수업 기록 작성</el-button></section>
    <section class="page-toolbar"><div class="page-toolbar__filters"><el-input v-model="search" class="page-toolbar__search" clearable placeholder="회원명·운동 초점 검색" /><el-select v-model="statusFilter" style="width: 130px"><el-option label="전체 상태" value="전체" /><el-option label="예정" value="예정" /><el-option label="완료" value="완료" /><el-option label="취소" value="취소" /></el-select></div><span class="muted-text">{{ sessions.length }}건</span></section>
    <el-card class="page-card" shadow="never">
      <div v-if="sessions.length" class="data-table-wrap"><table class="data-table"><thead><tr><th>수업일</th><th>회원</th><th>운동 초점</th><th>진행한 운동</th><th>컨디션</th><th>상태</th><th></th></tr></thead><tbody><tr v-for="session in sessions" :key="session.id"><td>{{ session.date.replaceAll('-', '.') }}<small class="muted-text">{{ session.startTime || '기록' }} · {{ session.duration ? `${session.duration}분` : '회차 기록' }}</small></td><td><strong>{{ memberName(session.memberId) }}</strong></td><td>{{ session.focus || '-' }}</td><td class="long-text">{{ session.exercises || '-' }}</td><td>{{ session.condition }}</td><td><el-tag :type="session.status === '완료' ? 'success' : session.status === '취소' ? 'info' : 'primary'" size="small" effect="light">{{ session.status }}</el-tag></td><td><el-button v-if="store.canEdit" text type="primary" @click="editingSession = session; dialogOpen = true">수정</el-button><span v-else class="muted-text">조회</span></td></tr></tbody></table></div>
      <el-empty v-else description="조건에 맞는 수업 기록이 없습니다." :image-size="90" />
    </el-card>
    <SessionFormDialog v-if="store.canEdit" v-model="dialogOpen" :session="editingSession" :members="store.members" :trainers="store.trainers" @save="saveSession" />
  </div>
</template>

<style scoped>
.long-text {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
