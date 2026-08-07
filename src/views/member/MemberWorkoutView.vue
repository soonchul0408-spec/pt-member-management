<script setup>
import { computed, ref } from 'vue'

import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const auth = useAuthStore()
const store = usePtStore()
const completionDialogOpen = ref(false)
const selectedAssignment = ref(null)
const completionForm = ref({ condition: '보통', duration: 30, memo: '' })
const saved = ref(false)

const member = computed(() => store.getMember(auth.activeMemberId))
const assignments = computed(() => (member.value ? store.getMemberAssignments(member.value.id) : []))
const logs = computed(() => (member.value ? store.getMemberWorkoutLogs(member.value.id) : []))

function formatDate(value) {
  return value?.replaceAll('-', '.') ?? '-'
}

function openComplete(assignment) {
  selectedAssignment.value = assignment
  completionForm.value = { condition: '보통', duration: 30, memo: '' }
  completionDialogOpen.value = true
}

function completeAssignment() {
  if (!selectedAssignment.value) return
  store.completeWorkoutAssignment(selectedAssignment.value.id, { ...completionForm.value, duration: Number(completionForm.value.duration) })
  completionDialogOpen.value = false
  saved.value = true
  window.setTimeout(() => { saved.value = false }, 2400)
}
</script>

<template>
  <div v-if="member" class="member-page">
    <div class="page-intro"><div><p class="section-eyebrow">WORKOUT TASKS</p><h2>오늘의 운동</h2><p>강사가 등록한 운동 과제를 확인하고 완료한 내용을 기록하세요.</p></div><el-tag type="success" effect="light" round>회원 화면</el-tag></div>
    <el-alert v-if="saved" type="success" show-icon :closable="false" title="운동 완료 내용이 저장되었습니다." class="member-alert" />

    <el-card class="panel-card" shadow="never">
      <div class="section-heading"><div><p class="section-eyebrow">ASSIGNED WORKOUT</p><h2>등록된 운동 과제</h2></div><el-tag type="info" effect="plain">{{ assignments.length }}개</el-tag></div>
      <div v-if="assignments.length" class="workout-task-list">
        <article v-for="assignment in assignments" :key="assignment.id" class="workout-task-card" :class="{ 'is-complete': assignment.status === '완료' }">
          <div class="workout-task-card__top"><el-tag :type="assignment.status === '완료' ? 'success' : 'warning'" effect="light">{{ assignment.status }}</el-tag><time>{{ formatDate(assignment.date) }}</time></div>
          <h3>{{ assignment.title }}</h3>
          <p>{{ assignment.description }}</p>
          <ul><li v-for="exercise in assignment.exercises" :key="exercise">{{ exercise }}</li></ul>
          <div class="workout-task-card__footer"><span v-if="assignment.completedAt">완료 {{ new Date(assignment.completedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</span><el-button v-else type="primary" size="small" @click="openComplete(assignment)">운동 완료 체크</el-button></div>
        </article>
      </div>
      <el-empty v-else description="등록된 운동 과제가 없습니다." :image-size="100" />
    </el-card>

    <el-card class="panel-card member-history-card" shadow="never">
      <div class="section-heading"><div><p class="section-eyebrow">WORKOUT LOG</p><h2>최근 운동일지</h2></div></div>
      <div v-if="logs.length" class="workout-log-list"><div v-for="log in logs" :key="log.id" class="workout-log-row"><div><strong>{{ formatDate(log.date) }}</strong><span>{{ log.duration || 0 }}분 · {{ log.condition }}</span></div><p>{{ log.memo || '작성된 메모가 없습니다.' }}</p><el-tag type="success" size="small" effect="light">{{ log.completed ? '완료' : '미완료' }}</el-tag></div></div>
      <el-empty v-else description="아직 작성된 운동일지가 없습니다." :image-size="80" />
    </el-card>

    <el-dialog v-model="completionDialogOpen" title="운동 완료 기록" width="520px" destroy-on-close>
      <el-form :model="completionForm" label-position="top" class="dialog-form">
        <p class="dialog-description">{{ selectedAssignment?.title }}를 완료한 내용을 남겨 주세요.</p>
        <div class="form-grid">
          <el-form-item label="운동 컨디션"><el-select v-model="completionForm.condition" class="full-width"><el-option label="좋음" value="좋음" /><el-option label="보통" value="보통" /><el-option label="피로함" value="피로함" /></el-select></el-form-item>
          <el-form-item label="운동 시간(분)"><el-input-number v-model="completionForm.duration" :min="0" :max="300" class="full-width" /></el-form-item>
          <el-form-item label="운동일지 메모" class="span-2"><el-input v-model="completionForm.memo" type="textarea" :rows="4" placeholder="운동 중 느낀 점이나 강사에게 전달할 내용을 작성하세요." /></el-form-item>
        </div>
      </el-form>
      <template #footer><div class="form-actions"><el-button @click="completionDialogOpen = false">취소</el-button><el-button type="primary" @click="completeAssignment">완료 내용 저장</el-button></div></template>
    </el-dialog>
  </div>
  <el-empty v-else description="회원 정보를 찾을 수 없습니다." :image-size="100" />
</template>

<style scoped>
.page-intro { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-intro h2 { margin: 4px 0 0; color: #1e2f4d; font-size: 1.5rem; }
.page-intro p:not(.section-eyebrow) { margin: 9px 0 0; color: #7c8799; font-size: 0.86rem; }
.member-alert, .member-history-card { margin-top: 18px; }
.workout-task-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.workout-task-card { display: grid; gap: 9px; padding: 18px; border: 1px solid #dbe6ff; border-radius: 15px; background: #f7f9ff; }
.workout-task-card.is-complete { border-color: #d9f1e4; background: #f6fcf8; }
.workout-task-card__top, .workout-task-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.workout-task-card__top time, .workout-task-card__footer span { color: #8b96a8; font-size: 0.72rem; }
.workout-task-card h3 { margin: 5px 0 0; color: #2d4162; font-size: 1rem; }
.workout-task-card p { margin: 0; color: #65738a; font-size: 0.8rem; line-height: 1.6; }
.workout-task-card ul { display: grid; gap: 6px; margin: 4px 0 7px; padding: 0; color: #526078; font-size: 0.78rem; list-style: none; }
.workout-task-card li::before { margin-right: 6px; color: #2563eb; content: '•'; }
.workout-log-list { display: grid; gap: 8px; }
.workout-log-row { display: grid; grid-template-columns: 155px 1fr auto; align-items: center; gap: 16px; padding: 13px 0; border-bottom: 1px solid #eef1f5; }
.workout-log-row:last-child { border-bottom: 0; }
.workout-log-row > div { display: grid; gap: 5px; }
.workout-log-row strong { color: #34445e; font-size: 0.82rem; }
.workout-log-row span, .workout-log-row p { color: #8994a5; font-size: 0.76rem; }
.workout-log-row p { margin: 0; }
@media (max-width: 760px) { .workout-task-list { grid-template-columns: 1fr; } .workout-log-row { grid-template-columns: 1fr auto; } .workout-log-row p { grid-column: 1 / -1; } }
@media (max-width: 520px) { .page-intro { flex-direction: column; } }
</style>
