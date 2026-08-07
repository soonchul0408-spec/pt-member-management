<script setup>
import { computed, ref } from 'vue'

import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const auth = useAuthStore()
const store = usePtStore()
const savedMessage = ref('')

const member = computed(() => store.getMember(auth.activeMemberId))
const assignments = computed(() => (member.value ? store.getMemberAssignments(member.value.id) : []))
const workoutLogs = computed(() => (member.value ? store.getMemberWorkoutLogs(member.value.id) : []))
const mealRecords = computed(() => (member.value ? store.getMemberMealRecords(member.value.id) : []))
const exerciseForm = ref(createExerciseForm())
const mealForm = ref(createMealForm())

function createExerciseForm() {
  return { assignmentId: '', date: store.today, duration: 30, condition: '보통', memo: '' }
}

function createMealForm() {
  return { date: store.today, meal: '', water: '', sleepHours: 7, stress: '보통', condition: '보통', memo: '' }
}

function formatDate(value) {
  return value?.replaceAll('-', '.') ?? '-'
}

function showSaved(message) {
  savedMessage.value = message
  window.setTimeout(() => { savedMessage.value = '' }, 2400)
}

function saveExerciseLog() {
  if (!member.value) return
  store.addWorkoutLog({ memberId: member.value.id, ...exerciseForm.value, duration: Number(exerciseForm.value.duration), completed: true })
  if (exerciseForm.value.assignmentId) store.completeWorkoutAssignment(exerciseForm.value.assignmentId, exerciseForm.value)
  exerciseForm.value = createExerciseForm()
  showSaved('운동일지가 저장되었습니다.')
}

function saveMealRecord() {
  if (!member.value || !mealForm.value.meal.trim()) return
  store.addMealRecord({ memberId: member.value.id, ...mealForm.value, sleepHours: Number(mealForm.value.sleepHours) })
  mealForm.value = createMealForm()
  showSaved('식단·컨디션 기록이 저장되었습니다.')
}
</script>

<template>
  <div v-if="member" class="member-page">
    <div class="page-intro"><div><p class="section-eyebrow">MY JOURNAL</p><h2>운동·식단·컨디션 기록</h2><p>오늘의 몸 상태와 생활 습관을 남기면 다음 코칭에 활용할 수 있습니다.</p></div></div>
    <el-alert v-if="savedMessage" type="success" show-icon :closable="false" :title="savedMessage" class="member-alert" />

    <div class="two-column-grid journal-form-grid">
      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">WORKOUT JOURNAL</p><h2>운동일지 작성</h2></div></div>
        <el-form :model="exerciseForm" label-position="top" class="member-form">
          <el-form-item label="운동 과제 연결"><el-select v-model="exerciseForm.assignmentId" clearable class="full-width" placeholder="선택하지 않아도 됩니다."><el-option v-for="assignment in assignments" :key="assignment.id" :label="assignment.title" :value="assignment.id" /></el-select></el-form-item>
          <div class="form-grid"><el-form-item label="운동일"><el-date-picker v-model="exerciseForm.date" type="date" value-format="YYYY-MM-DD" class="full-width" /></el-form-item><el-form-item label="운동 시간(분)"><el-input-number v-model="exerciseForm.duration" :min="0" :max="300" class="full-width" /></el-form-item></div>
          <el-form-item label="운동 컨디션"><el-radio-group v-model="exerciseForm.condition"><el-radio-button label="좋음" /><el-radio-button label="보통" /><el-radio-button label="피로함" /></el-radio-group></el-form-item>
          <el-form-item label="메모"><el-input v-model="exerciseForm.memo" type="textarea" :rows="5" placeholder="운동 중 느낀 점, 불편했던 동작을 작성하세요." /></el-form-item>
          <div class="form-actions"><el-button type="primary" @click="saveExerciseLog">운동일지 저장</el-button></div>
        </el-form>
      </el-card>

      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">MEAL & CONDITION</p><h2>식단·컨디션 기록</h2></div></div>
        <el-form :model="mealForm" label-position="top" class="member-form">
          <el-form-item label="기록일"><el-date-picker v-model="mealForm.date" type="date" value-format="YYYY-MM-DD" class="full-width" /></el-form-item>
          <el-form-item label="오늘의 식단"><el-input v-model="mealForm.meal" type="textarea" :rows="3" placeholder="아침·점심·저녁과 간식을 자유롭게 기록하세요." /></el-form-item>
          <div class="form-grid"><el-form-item label="물 섭취량"><el-input v-model="mealForm.water" placeholder="예: 1.8L" /></el-form-item><el-form-item label="수면 시간"><el-input-number v-model="mealForm.sleepHours" :min="0" :max="24" :precision="1" class="full-width" /></el-form-item></div>
          <div class="form-grid"><el-form-item label="스트레스"><el-select v-model="mealForm.stress" class="full-width"><el-option label="낮음" value="낮음" /><el-option label="보통" value="보통" /><el-option label="높음" value="높음" /></el-select></el-form-item><el-form-item label="컨디션"><el-select v-model="mealForm.condition" class="full-width"><el-option label="좋음" value="좋음" /><el-option label="보통" value="보통" /><el-option label="피로함" value="피로함" /></el-select></el-form-item></div>
          <el-form-item label="추가 메모"><el-input v-model="mealForm.memo" type="textarea" :rows="3" placeholder="생활 습관이나 강사에게 알릴 내용을 작성하세요." /></el-form-item>
          <div class="form-actions"><el-button type="primary" @click="saveMealRecord">식단·컨디션 저장</el-button></div>
        </el-form>
      </el-card>
    </div>

    <div class="two-column-grid journal-history-grid">
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">RECENT WORKOUT</p><h2>최근 운동일지</h2></div></div><div v-if="workoutLogs.length" class="journal-history-list"><div v-for="log in workoutLogs.slice(0, 5)" :key="log.id" class="journal-history-item"><div><strong>{{ formatDate(log.date) }}</strong><span>{{ log.duration }}분 · {{ log.condition }}</span></div><p>{{ log.memo || '-' }}</p></div></div><el-empty v-else description="작성된 운동일지가 없습니다." :image-size="70" /></el-card>
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">RECENT MEAL</p><h2>최근 식단·컨디션</h2></div></div><div v-if="mealRecords.length" class="journal-history-list"><div v-for="record in mealRecords.slice(0, 5)" :key="record.id" class="journal-history-item"><div><strong>{{ formatDate(record.date) }}</strong><span>수면 {{ record.sleepHours }}시간 · 스트레스 {{ record.stress }}</span></div><p>{{ record.meal }}</p></div></div><el-empty v-else description="작성된 식단 기록이 없습니다." :image-size="70" /></el-card>
    </div>
  </div>
  <el-empty v-else description="회원 정보를 찾을 수 없습니다." :image-size="100" />
</template>

<style scoped>
.page-intro h2 { margin: 4px 0 0; color: #1e2f4d; font-size: 1.5rem; }
.page-intro p:not(.section-eyebrow) { margin: 9px 0 0; color: #7c8799; font-size: 0.86rem; }
.member-alert { margin-top: 18px; }
.journal-form-grid, .journal-history-grid { margin-top: 18px; }
.member-form { margin-top: 18px; }
.journal-history-list { display: grid; gap: 8px; }
.journal-history-item { padding: 12px 0; border-bottom: 1px solid #eef1f5; }
.journal-history-item:last-child { border-bottom: 0; }
.journal-history-item > div { display: flex; align-items: center; gap: 10px; }
.journal-history-item strong { color: #34445e; font-size: 0.8rem; }
.journal-history-item span, .journal-history-item p { color: #8994a5; font-size: 0.75rem; }
.journal-history-item p { margin: 7px 0 0; line-height: 1.5; }
</style>
