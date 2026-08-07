<script setup>
import { computed, ref } from 'vue'

import SessionFormDialog from '@/components/pt/SessionFormDialog.vue'
import { usePtStore } from '@/stores/ptStore'

const store = usePtStore()
const calendarDate = ref(new Date(`${store.today}T00:00:00`))
const selectedTrainer = ref('전체')
const selectedStatus = ref('전체')
const sessionDialogOpen = ref(false)

const filteredSessions = computed(() => store.sessions.filter((session) => {
  const trainerMatches = selectedTrainer.value === '전체' || session.trainerId === selectedTrainer.value
  const statusMatches = selectedStatus.value === '전체' || session.status === selectedStatus.value
  return trainerMatches && statusMatches
}).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)))

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sessionsForDate(date) {
  return filteredSessions.value.filter((session) => session.date === dateKey(date))
}

function memberName(memberId) {
  return store.getMember(memberId)?.name ?? '-'
}

function saveSession(payload) {
  if (!store.canEdit) return
  if (payload.id) store.updateSession(payload)
  else store.addSession(payload)
}
</script>

<template>
  <div class="schedule-page">
    <section class="page-intro">
      <div><p class="page-intro__eyebrow">SCHEDULE MANAGEMENT</p><h2>PT 일정 관리</h2><p>트레이너와 회원의 수업 일정을 확인하고 예약을 관리합니다.</p></div>
      <el-button v-if="store.canEdit" type="primary" @click="sessionDialogOpen = true">+ PT 수업 등록</el-button>
    </section>

    <div class="schedule-toolbar">
      <div class="schedule-toolbar__filters">
        <el-select v-model="selectedTrainer" style="width: 150px"><el-option label="전체 트레이너" value="전체" /><el-option v-for="trainer in store.trainers" :key="trainer.id" :label="trainer.name" :value="trainer.id" /></el-select>
        <el-select v-model="selectedStatus" style="width: 130px"><el-option label="전체 상태" value="전체" /><el-option label="예정" value="예정" /><el-option label="완료" value="완료" /><el-option label="취소" value="취소" /></el-select>
      </div>
      <el-tag type="info" effect="plain">총 {{ filteredSessions.length }}건</el-tag>
    </div>

    <el-card class="page-card calendar-panel" shadow="never">
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div class="calendar-day__number">{{ data.day.split('-').slice(2).join('') }}</div>
          <div class="calendar-day__items">
            <div v-for="session in sessionsForDate(new Date(`${data.day}T00:00:00`)).slice(0, 3)" :key="session.id" class="calendar-day__item" :class="{ 'is-complete': session.status === '완료' }">
              {{ session.startTime }} {{ memberName(session.memberId) }}
            </div>
            <small v-if="sessionsForDate(new Date(`${data.day}T00:00:00`)).length > 3" class="muted-text">+{{ sessionsForDate(new Date(`${data.day}T00:00:00`)).length - 3 }}건</small>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <el-card class="page-card schedule-list-card" shadow="never">
      <div class="section-heading"><div><p class="section-eyebrow">ALL SESSIONS</p><h2>전체 일정</h2></div><span class="muted-text">날짜·시간 순</span></div>
      <div class="data-table-wrap"><table class="data-table"><thead><tr><th>일시</th><th>회원</th><th>담당</th><th>수업 초점</th><th>시간</th><th>상태</th></tr></thead><tbody><tr v-for="session in filteredSessions" :key="session.id"><td>{{ session.date.replaceAll('-', '.') }} {{ session.startTime }}</td><td><strong>{{ memberName(session.memberId) }}</strong></td><td>{{ store.getTrainer(session.trainerId)?.name }}</td><td>{{ session.focus || '-' }}</td><td>{{ session.duration }}분</td><td><el-tag :type="session.status === '완료' ? 'success' : session.status === '취소' ? 'info' : 'primary'" size="small" effect="light">{{ session.status }}</el-tag></td></tr></tbody></table></div>
    </el-card>

    <SessionFormDialog v-if="store.canEdit" v-model="sessionDialogOpen" :members="store.members" :trainers="store.trainers" @save="saveSession" />
  </div>
</template>

<style scoped>
.schedule-list-card {
  margin-top: 18px;
}
</style>
