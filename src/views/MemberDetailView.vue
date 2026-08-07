<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import MeasurementFormDialog from '@/components/pt/MeasurementFormDialog.vue'
import MemberFormDialog from '@/components/pt/MemberFormDialog.vue'
import SessionFormDialog from '@/components/pt/SessionFormDialog.vue'
import CommunicationThread from '@/components/pt/CommunicationThread.vue'
import WorkoutAssignmentDialog from '@/components/pt/WorkoutAssignmentDialog.vue'
import { usePtStore } from '@/stores/ptStore'

const route = useRoute()
const router = useRouter()
const store = usePtStore()
const activeTab = ref('overview')
const memberDialogOpen = ref(false)
const sessionDialogOpen = ref(false)
const measurementDialogOpen = ref(false)
const noteDialogOpen = ref(false)
const assignmentDialogOpen = ref(false)
const coachingDialogOpen = ref(false)
const noteForm = ref({ type: '상담', content: '' })
const coachingForm = ref({ title: '운동·생활 피드백', content: '' })

const member = computed(() => store.getMember(String(route.params.id)))
const membership = computed(() => (member.value ? store.getMembership(member.value.id) : null))
const memberSessions = computed(() => (member.value ? store.getMemberSessions(member.value.id) : []))
const memberMeasurements = computed(() => (member.value ? store.getMemberMeasurements(member.value.id) : []))
const memberNotes = computed(() => (member.value ? store.getMemberNotes(member.value.id) : []))
const memberAssignments = computed(() => (member.value ? store.getMemberAssignments(member.value.id) : []))
const memberWorkoutLogs = computed(() => (member.value ? store.getMemberWorkoutLogs(member.value.id) : []))
const memberMealRecords = computed(() => (member.value ? store.getMemberMealRecords(member.value.id) : []))
const memberCoachingNotes = computed(() => (member.value ? store.getMemberCoachingNotes(member.value.id) : []))
const unreadCommunications = computed(() => (member.value ? store.getUnreadCommunicationCount(member.value.id, 'instructor') : 0))
const trainer = computed(() => (member.value ? store.getTrainer(member.value.trainerId) : null))

function formatDate(value) {
  return value?.replaceAll('-', '.') ?? '-'
}

function formatCurrency(value) {
  return `${Number(value ?? 0).toLocaleString('ko-KR')}원`
}

function saveMember(payload) {
  if (!store.canEdit) return
  store.updateMember(payload)
}

function saveSession(payload) {
  if (!store.canEdit) return
  if (payload.id) store.updateSession(payload)
  else store.addSession(payload)
}

function saveMeasurement(payload) {
  if (!store.canEdit) return
  store.addMeasurement(payload)
  activeTab.value = 'measurements'
}

function openNoteDialog() {
  if (!store.canEdit) return
  noteForm.value = { type: '상담', content: '' }
  noteDialogOpen.value = true
}

function saveNote() {
  if (!store.canEdit || !noteForm.value.content.trim() || !member.value) return
  store.addNote({ ...noteForm.value, memberId: member.value.id })
  noteDialogOpen.value = false
}

function saveAssignment(payload) {
  if (!store.canEdit) return
  store.addWorkoutAssignment(payload)
  activeTab.value = 'schedule'
}

function openCoachingDialog() {
  if (!store.canEdit) return
  coachingForm.value = { title: '운동·생활 피드백', content: '' }
  coachingDialogOpen.value = true
}

function saveCoachingNote() {
  if (!store.canEdit || !member.value || !coachingForm.value.content.trim()) return
  store.addCoachingNote({ ...coachingForm.value, memberId: member.value.id })
  coachingDialogOpen.value = false
}

function sessionType(status) {
  return status === '완료' ? 'success' : status === '취소' ? 'info' : 'primary'
}
</script>

<template>
  <div v-if="member" class="member-detail-page">
    <div class="detail-back"><el-button text @click="router.push('/pt/members')">← 회원 목록으로</el-button></div>

    <el-card class="detail-profile" shadow="never">
      <div class="detail-profile__identity">
        <div class="member-avatar member-avatar--large" :style="{ background: member.avatarColor }">{{ member.name.slice(0, 1) }}</div>
        <div>
          <div class="detail-profile__title-row"><h2>{{ member.name }}</h2><el-tag :type="member.status === '활성' ? 'success' : 'warning'" effect="light">{{ member.status }}</el-tag></div>
          <p>{{ member.phone }} · {{ member.email }}</p>
          <p class="detail-profile__goal">목표: {{ member.goal }}</p>
        </div>
        <div class="detail-profile__actions">
          <el-button v-if="store.canEdit" plain @click="memberDialogOpen = true">회원 정보 수정</el-button>
          <el-button v-if="store.canEdit" type="primary" @click="sessionDialogOpen = true">+ 수업 등록</el-button>
        </div>
      </div>
      <div class="detail-stats">
        <div class="detail-stats__item"><span>담당 트레이너</span><strong>{{ trainer?.name ?? '-' }}</strong></div>
        <div class="detail-stats__item"><span>회원권</span><strong>{{ membership?.type ?? '미등록' }}</strong></div>
        <div class="detail-stats__item"><span>남은 수업</span><strong class="blue-text">{{ membership?.remainingSessions ?? 0 }}회</strong></div>
        <div class="detail-stats__item"><span>회원권 종료일</span><strong>{{ formatDate(membership?.endDate) }}</strong></div>
        <div class="detail-stats__item"><span>등록일</span><strong>{{ formatDate(member.joinedAt) }}</strong></div>
      </div>
    </el-card>

    <el-alert v-if="member.caution" class="member-caution" type="warning" :closable="false" show-icon title="수업 전 확인할 주의사항">
      {{ member.caution }}
    </el-alert>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="회원 정보" name="overview">
        <div class="detail-content-grid">
          <el-card class="panel-card" shadow="never">
            <div class="section-heading"><div><p class="section-eyebrow">PROFILE</p><h2>회원 기본정보</h2></div><el-button v-if="store.canEdit" text type="primary" @click="memberDialogOpen = true">수정</el-button></div>
            <dl class="info-list">
              <div class="info-list__item"><dt>회원명</dt><dd>{{ member.name }}</dd></div>
              <div class="info-list__item"><dt>성별·출생연도</dt><dd>{{ member.gender }} · {{ member.birthYear }}년생</dd></div>
              <div class="info-list__item"><dt>연락처</dt><dd>{{ member.phone }}</dd></div>
              <div class="info-list__item"><dt>이메일</dt><dd>{{ member.email || '-' }}</dd></div>
              <div class="info-list__item"><dt>운동 목표</dt><dd>{{ member.goal }}</dd></div>
              <div class="info-list__item"><dt>담당 트레이너</dt><dd>{{ trainer?.name ?? '-' }}</dd></div>
            </dl>
          </el-card>
          <el-card class="panel-card" shadow="never">
            <div class="section-heading"><div><p class="section-eyebrow">MEMBERSHIP</p><h2>회원권 현황</h2></div><el-tag :type="membership?.status === '이용 중' ? 'success' : 'warning'" effect="light">{{ membership?.status ?? '미등록' }}</el-tag></div>
            <div v-if="membership">
              <div class="membership-detail-row"><span>{{ membership.type }}</span><strong>{{ membership.remainingSessions }} / {{ membership.totalSessions }}회 남음</strong></div>
              <el-progress :percentage="Math.round((membership.remainingSessions / membership.totalSessions) * 100)" :show-text="false" color="#2563eb" />
              <div class="membership-detail-meta"><span>{{ formatDate(membership.startDate) }} ~ {{ formatDate(membership.endDate) }}</span><span>{{ formatCurrency(membership.price) }}</span></div>
            </div>
            <el-empty v-else description="등록된 회원권이 없습니다." :image-size="70" />
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="PT 일정" name="schedule">
        <el-card class="panel-card" shadow="never">
          <div class="section-heading"><div><p class="section-eyebrow">ASSIGNMENTS & SCHEDULE</p><h2>PT 일정·운동 과제</h2></div><el-button v-if="store.canEdit" type="primary" @click="assignmentDialogOpen = true">+ 운동 과제 등록</el-button></div>
          <div v-if="memberAssignments.length" class="assignment-list">
            <article v-for="assignment in memberAssignments" :key="assignment.id" class="assignment-item">
              <div class="assignment-item__top"><el-tag :type="assignment.status === '완료' ? 'success' : 'warning'" size="small" effect="light">{{ assignment.status }}</el-tag><span>{{ formatDate(assignment.date) }}</span></div>
              <h3>{{ assignment.title }}</h3><p>{{ assignment.description }}</p><ul><li v-for="exercise in assignment.exercises" :key="exercise">{{ exercise }}</li></ul>
            </article>
          </div>
          <el-empty v-else description="등록된 운동 과제가 없습니다." :image-size="80" />
          <div class="member-detail-subheading"><strong>예약된 PT 수업</strong></div>
          <div v-if="memberSessions.length" class="mini-session-list"><div v-for="session in memberSessions.slice(0, 4)" :key="session.id"><span>{{ formatDate(session.date) }} {{ session.startTime }}</span><strong>{{ session.focus }}</strong><el-tag :type="sessionType(session.status)" size="small" effect="light">{{ session.status }}</el-tag></div></div>
          <el-empty v-else description="등록된 PT 수업이 없습니다." :image-size="60" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="운동 기록" name="sessions">
        <el-card class="panel-card" shadow="never">
          <div class="section-heading"><div><p class="section-eyebrow">SESSION & WORKOUT LOG</p><h2>수업·운동 기록</h2></div><el-button v-if="store.canEdit" type="primary" @click="sessionDialogOpen = true">+ 수업 기록 추가</el-button></div>
          <div v-if="memberSessions.length" class="data-table-wrap"><table class="data-table"><thead><tr><th>수업일</th><th>운동 초점</th><th>진행한 운동</th><th>컨디션</th><th>상태</th><th>담당</th></tr></thead><tbody><tr v-for="session in memberSessions" :key="session.id"><td>{{ formatDate(session.date) }} {{ session.startTime }}</td><td><strong>{{ session.focus || '-' }}</strong></td><td class="long-text">{{ session.exercises || '수업 전' }}</td><td>{{ session.condition }}</td><td><el-tag :type="sessionType(session.status)" size="small" effect="light">{{ session.status }}</el-tag></td><td>{{ store.getTrainer(session.trainerId)?.name }}</td></tr></tbody></table></div>
          <el-empty v-else description="아직 수업 기록이 없습니다." :image-size="80" />
          <div class="member-detail-subheading"><strong>회원 운동일지</strong><el-tag v-if="memberWorkoutLogs.length" type="info" size="small" effect="plain">{{ memberWorkoutLogs.length }}개</el-tag></div>
          <div v-if="memberWorkoutLogs.length" class="workout-log-list"><div v-for="log in memberWorkoutLogs" :key="log.id" class="workout-log-item"><div><strong>{{ formatDate(log.date) }}</strong><span>{{ log.duration || 0 }}분 · {{ log.condition }}</span></div><p>{{ log.memo || '-' }}</p><el-tag :type="log.completed ? 'success' : 'warning'" size="small" effect="light">{{ log.completed ? '완료' : '미완료' }}</el-tag></div></div>
          <el-empty v-else description="회원이 작성한 운동일지가 없습니다." :image-size="60" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="식단·컨디션" name="meals">
        <el-card class="panel-card" shadow="never">
          <div class="section-heading"><div><p class="section-eyebrow">MEAL & CONDITION</p><h2>식단·생활 습관 기록</h2></div><el-button v-if="store.canEdit" type="primary" @click="openCoachingDialog">+ 피드백 작성</el-button></div>
          <div v-if="memberMealRecords.length" class="meal-record-list"><article v-for="record in memberMealRecords" :key="record.id" class="meal-record-item"><div class="meal-record-item__top"><strong>{{ formatDate(record.date) }}</strong><span>수면 {{ record.sleepHours }}시간 · 물 {{ record.water || '-' }} · 스트레스 {{ record.stress }}</span></div><p>{{ record.meal }}</p><small>{{ record.memo || '추가 메모 없음' }}</small></article></div>
          <el-empty v-else description="회원이 작성한 식단·컨디션 기록이 없습니다." :image-size="80" />
          <div class="member-detail-subheading"><strong>작성한 생활 습관 피드백</strong></div>
          <div v-if="memberCoachingNotes.length" class="coaching-note-list"><div v-for="note in memberCoachingNotes" :key="note.id" class="coaching-note-item"><div><el-tag type="primary" size="small" effect="light">강사 작성</el-tag><span>{{ formatDate(note.createdAt.slice(0, 10)) }}</span></div><strong>{{ note.title }}</strong><p>{{ note.content }}</p></div></div>
          <el-empty v-else description="작성된 피드백이 없습니다." :image-size="60" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane :label="`소통·피드백${unreadCommunications ? ` (${unreadCommunications})` : ''}`" name="communication">
        <el-card class="panel-card" shadow="never"><CommunicationThread v-if="member" :member-id="member.id" /></el-card>
      </el-tab-pane>

      <el-tab-pane label="운동 목표·체성분" name="measurements">
        <el-card class="panel-card" shadow="never">
          <div class="section-heading"><div><p class="section-eyebrow">MEASUREMENTS</p><h2>체성분 변화</h2></div><el-button v-if="store.canEdit" type="primary" @click="measurementDialogOpen = true">+ 측정 기록 추가</el-button></div>
          <div v-if="memberMeasurements.length" class="measurement-grid">
            <div class="measurement-highlight"><span>최근 체중</span><strong>{{ memberMeasurements[0].weight }}<small>kg</small></strong><el-tag type="success" effect="light">최근 측정 {{ formatDate(memberMeasurements[0].measuredAt) }}</el-tag></div>
            <div class="measurement-highlight"><span>골격근량</span><strong>{{ memberMeasurements[0].muscleMass }}<small>kg</small></strong><span class="muted-text">최근 기록</span></div>
            <div class="measurement-highlight"><span>체지방률</span><strong>{{ memberMeasurements[0].bodyFat }}<small>%</small></strong><span class="muted-text">최근 기록</span></div>
          </div>
          <div v-if="memberMeasurements.length" class="data-table-wrap measurement-table"><table class="data-table"><thead><tr><th>측정일</th><th>체중</th><th>골격근량</th><th>체지방률</th></tr></thead><tbody><tr v-for="item in memberMeasurements" :key="item.id"><td>{{ formatDate(item.measuredAt) }}</td><td>{{ item.weight }}kg</td><td>{{ item.muscleMass }}kg</td><td>{{ item.bodyFat }}%</td></tr></tbody></table></div>
          <el-empty v-else description="체성분 기록이 없습니다." :image-size="80" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="상담·메모" name="notes">
        <el-card class="panel-card" shadow="never">
          <div class="section-heading"><div><p class="section-eyebrow">NOTES</p><h2>상담·회원 메모</h2></div><el-button v-if="store.canEdit" type="primary" @click="openNoteDialog">+ 메모 작성</el-button></div>
          <div v-if="memberNotes.length" class="notes-list"><div v-for="note in memberNotes" :key="note.id" class="note-item"><div class="note-item__top"><el-tag size="small" effect="light">{{ note.type }}</el-tag><span>{{ formatDate(note.createdAt) }} · {{ note.author }}</span></div><p>{{ note.content }}</p></div></div>
          <el-empty v-else description="작성된 메모가 없습니다." :image-size="80" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <MemberFormDialog v-if="store.canEdit" v-model="memberDialogOpen" :member="member" :trainers="store.trainers" :statuses="store.memberStatuses" @save="saveMember" />
    <SessionFormDialog v-if="store.canEdit" v-model="sessionDialogOpen" :default-member-id="member.id" :members="store.members" :trainers="store.trainers" @save="saveSession" />
    <MeasurementFormDialog v-if="store.canEdit" v-model="measurementDialogOpen" :default-member-id="member.id" :members="store.members" @save="saveMeasurement" />
    <WorkoutAssignmentDialog v-if="store.canEdit" v-model="assignmentDialogOpen" :default-member-id="member.id" :members="store.members" :trainers="store.trainers" @save="saveAssignment" />

    <el-dialog v-if="store.canEdit" v-model="noteDialogOpen" title="회원 메모 작성" width="520px" destroy-on-close>
      <el-form :model="noteForm" label-position="top" class="dialog-form">
        <el-form-item label="메모 유형"><el-select v-model="noteForm.type" class="full-width"><el-option label="상담" value="상담" /><el-option label="회원 메모" value="회원 메모" /><el-option label="운동 주의사항" value="운동 주의사항" /></el-select></el-form-item>
        <el-form-item label="내용"><el-input v-model="noteForm.content" type="textarea" :rows="6" placeholder="회원과 나눈 상담 내용이나 다음 확인 사항을 작성하세요" /></el-form-item>
      </el-form>
      <template #footer><div class="form-actions"><el-button @click="noteDialogOpen = false">취소</el-button><el-button type="primary" @click="saveNote">메모 저장</el-button></div></template>
    </el-dialog>

    <el-dialog v-if="store.canEdit" v-model="coachingDialogOpen" title="회원 피드백 작성" width="560px" destroy-on-close>
      <el-form :model="coachingForm" label-position="top" class="dialog-form">
        <el-form-item label="피드백 제목"><el-input v-model="coachingForm.title" placeholder="예: 이번 주 식단·컨디션 피드백" /></el-form-item>
        <el-form-item label="회원에게 전달할 내용"><el-input v-model="coachingForm.content" type="textarea" :rows="6" placeholder="회원 기록을 바탕으로 다음 주에 확인할 내용을 작성하세요." /></el-form-item>
      </el-form>
      <template #footer><div class="form-actions"><el-button @click="coachingDialogOpen = false">취소</el-button><el-button type="primary" @click="saveCoachingNote">피드백 저장</el-button></div></template>
    </el-dialog>
  </div>
  <el-empty v-else description="회원을 찾을 수 없습니다."><el-button type="primary" @click="router.push('/pt/members')">회원 목록으로</el-button></el-empty>
</template>

<style scoped>
.detail-back {
  margin-bottom: 13px;
}

.detail-profile__title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.detail-profile__goal {
  margin-top: 7px !important;
  color: #526b91 !important;
}

.member-avatar--large {
  width: 62px;
  height: 62px;
  border-radius: 17px;
  font-size: 1.35rem;
}

.blue-text {
  color: #2563eb !important;
}

.member-caution {
  margin-bottom: 18px;
}

.membership-detail-row,
.membership-detail-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.membership-detail-row {
  margin-bottom: 13px;
  color: #526078;
  font-size: 0.83rem;
}

.membership-detail-row strong {
  color: #2563eb;
  font-weight: 850;
}

.membership-detail-meta {
  margin-top: 13px;
  color: #9aa4b4;
  font-size: 0.72rem;
}

.long-text {
  max-width: 330px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.measurement-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 25px;
}

.measurement-highlight {
  display: grid;
  gap: 6px;
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
}

.measurement-highlight span {
  color: #8b96a8;
  font-size: 0.72rem;
}

.measurement-highlight strong {
  color: #1e3a8a;
  font-size: 1.4rem;
  font-weight: 850;
}

.measurement-highlight strong small {
  margin-left: 2px;
  color: #8793a6;
  font-size: 0.72rem;
}

.notes-list {
  display: grid;
  gap: 12px;
}

.assignment-list,
.meal-record-list,
.coaching-note-list,
.workout-log-list {
  display: grid;
  gap: 11px;
}

.assignment-item,
.meal-record-item,
.coaching-note-item {
  padding: 15px;
  border: 1px solid #e8edf5;
  border-radius: 13px;
  background: #fbfcff;
}

.assignment-item__top,
.meal-record-item__top,
.coaching-note-item > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #8b96a8;
  font-size: 0.72rem;
}

.assignment-item h3 {
  margin: 13px 0 6px;
  color: #34445e;
  font-size: 0.9rem;
}

.assignment-item p,
.meal-record-item p,
.coaching-note-item p {
  margin: 0;
  color: #64738a;
  font-size: 0.79rem;
  line-height: 1.65;
}

.assignment-item ul {
  display: grid;
  gap: 5px;
  margin: 11px 0 0;
  padding-left: 18px;
  color: #526078;
  font-size: 0.76rem;
}

.meal-record-item__top {
  justify-content: flex-start;
}

.meal-record-item__top strong {
  color: #34445e;
}

.meal-record-item small {
  display: block;
  margin-top: 8px;
  color: #9aa4b4;
  font-size: 0.72rem;
}

.coaching-note-item > div {
  justify-content: flex-start;
}

.coaching-note-item > strong {
  display: block;
  margin: 11px 0 5px;
  color: #34445e;
  font-size: 0.84rem;
}

.member-detail-subheading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 28px 0 12px;
  padding-top: 19px;
  border-top: 1px solid #eef1f5;
  color: #34445e;
  font-size: 0.83rem;
}

.mini-session-list {
  display: grid;
  gap: 8px;
}

.mini-session-list > div,
.workout-log-item {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  align-items: center;
  gap: 13px;
  padding: 11px 0;
  border-bottom: 1px solid #eef1f5;
  color: #526078;
  font-size: 0.76rem;
}

.mini-session-list > div:last-child,
.workout-log-item:last-child {
  border-bottom: 0;
}

.mini-session-list strong,
.workout-log-item strong {
  color: #34445e;
}

.workout-log-item > div {
  display: grid;
  gap: 4px;
}

.workout-log-item span,
.workout-log-item p {
  color: #8b96a8;
  font-size: 0.72rem;
}

.workout-log-item p {
  margin: 0;
}

.note-item {
  padding: 15px;
  border: 1px solid #edf0f5;
  border-radius: 11px;
}

.note-item__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #9aa4b4;
  font-size: 0.72rem;
}

.note-item p {
  margin: 10px 0 0;
  color: #526078;
  font-size: 0.82rem;
  line-height: 1.65;
}

@media (max-width: 640px) {
  .measurement-grid {
    grid-template-columns: 1fr;
  }

  .mini-session-list > div,
  .workout-log-item {
    grid-template-columns: 1fr auto;
  }

  .mini-session-list strong,
  .workout-log-item p {
    grid-column: 1 / -1;
  }
}
</style>
