<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import {
  getMemberOnboarding,
  getOnboardingStatusType,
} from '@/services/memberOnboarding'
import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const router = useRouter()
const auth = useAuthStore()
const store = usePtStore()

const member = computed(() => store.getMember(auth.activeMemberId))
const assignments = computed(() => (member.value ? store.getMemberAssignments(member.value.id) : []))
const todayAssignments = computed(() => assignments.value.filter((assignment) => assignment.date === store.today))
const importedSessions = computed(() => (member.value ? store.getMemberSessions(member.value.id).filter((session) => session.source === 'notion').sort((a, b) => b.date.localeCompare(a.date)) : []))
const progress = computed(() => (member.value ? store.getMemberProgress(member.value.id) : { completionRate: 0, completedAssignments: 0, assignmentCount: 0 }))
const unreadMessages = computed(() => (member.value ? store.getUnreadCommunicationCount(member.value.id) : 0))
const unreadNotes = computed(() => (member.value ? store.getUnreadCoachingNoteCount(member.value.id) : 0))
const latestNote = computed(() => (member.value ? store.getMemberCoachingNotes(member.value.id)[0] : null))
const onboarding = computed(() => getMemberOnboarding(member.value))
const onboardingDescription = computed(() => {
  if (onboarding.value.onboardingStatus === '관리 시작 준비 완료') return '목표와 기본 조건을 바탕으로 초기 관리 방향이 정리되어 있습니다.'
  if (onboarding.value.onboardingStatus === '온보딩 진행 중') return '트레이너가 회원님의 목표와 운동 조건을 확인하며 관리 방향을 정리하고 있습니다.'
  return '아직 초기 관리 정보가 설정되지 않았습니다. 트레이너와 목표와 운동 일정을 먼저 확인해 주세요.'
})
const nextManagementStep = computed(() => (
  onboarding.value.onboardingStatus === '관리 시작 준비 완료'
    ? '다음 수업 전 컨디션을 확인하고 오늘의 운동을 시작해 보세요.'
    : '트레이너와 초기 목표를 확인하면 맞춤 관리가 시작됩니다.'
))

function formatDate(value) {
  return value?.replaceAll('-', '.') ?? '-'
}

function importedSessionDetails(session) {
  const exerciseText = session.exercises?.replace(/\s*\(https?:\/\/[^)]+\)/g, '').trim()
  return exerciseText && exerciseText !== 'Notion 회차 기록' ? exerciseText : '세부 운동 메모가 없는 회차입니다.'
}

function go(path) {
  router.push(path)
}
</script>

<template>
  <div v-if="member" class="member-home-page">
    <div class="page-intro">
      <div>
        <div class="page-intro__eyebrow"><el-tag type="success" effect="light" round>회원 화면</el-tag><span>MY PT WORKSPACE</span></div>
        <h2>{{ member.name }}님의 오늘</h2>
        <p>운동 과제와 기록을 확인하고 강사와 필요한 내용을 주고받아 보세요.</p>
      </div>
      <div class="page-intro__actions"><el-button type="primary" @click="go('/pt/member/workouts')">오늘의 운동 확인</el-button><el-button plain @click="go('/pt/member/journal')">기록 작성</el-button></div>
    </div>

    <div class="member-stats-grid">
      <div class="member-stat-card member-stat-card--blue">
        <div class="member-stat-card__icon" aria-hidden="true">✓</div>
        <div class="member-stat-card__content">
          <span class="member-stat-card__label">이번 주 운동 완료율</span>
          <strong class="member-stat-card__value">{{ progress.completionRate }}<small>%</small></strong>
          <em class="member-stat-card__description">{{ progress.completedAssignments }} / {{ progress.assignmentCount || 0 }}개 과제 완료</em>
        </div>
      </div>
      <div class="member-stat-card member-stat-card--green">
        <div class="member-stat-card__icon" aria-hidden="true">◷</div>
        <div class="member-stat-card__content">
          <span class="member-stat-card__label">오늘 운동 과제</span>
          <strong class="member-stat-card__value">{{ todayAssignments.length }}<small>개</small></strong>
          <em class="member-stat-card__description">강사가 등록한 운동</em>
        </div>
      </div>
      <div class="member-stat-card member-stat-card--orange">
        <div class="member-stat-card__icon" aria-hidden="true">?</div>
        <div class="member-stat-card__content">
          <span class="member-stat-card__label">읽지 않은 소통</span>
          <strong class="member-stat-card__value">{{ unreadMessages }}<small>개</small></strong>
          <em class="member-stat-card__description">강사에게 답변을 확인하세요</em>
        </div>
      </div>
      <div class="member-stat-card member-stat-card--purple">
        <div class="member-stat-card__icon" aria-hidden="true">✦</div>
        <div class="member-stat-card__content">
          <span class="member-stat-card__label">새 코칭 메모</span>
          <strong class="member-stat-card__value">{{ unreadNotes }}<small>개</small></strong>
          <em class="member-stat-card__description">강사의 피드백</em>
        </div>
      </div>
    </div>

    <el-card class="panel-card member-onboarding-summary" shadow="never">
      <div class="section-heading">
        <div><p class="section-eyebrow">MY STARTING PLAN</p><h2>나의 초기 관리 방향</h2></div>
        <el-tag :type="getOnboardingStatusType(onboarding.onboardingStatus)" effect="light">{{ onboarding.onboardingStatus }}</el-tag>
      </div>
      <p class="member-onboarding-summary__description">{{ onboardingDescription }}</p>
      <div class="member-onboarding-summary__grid">
        <div><span>운동 목표</span><strong>{{ onboarding.exerciseGoal || '아직 설정되지 않았습니다.' }}</strong></div>
        <div><span>운동 경험</span><strong>{{ onboarding.experienceLevel || '미설정' }}</strong></div>
        <div><span>희망 운동 횟수</span><strong>{{ onboarding.weeklyFrequency || '미설정' }}</strong></div>
        <div><span>선호 시간대</span><strong>{{ onboarding.preferredTime || '미설정' }}</strong></div>
      </div>
      <div class="member-onboarding-summary__next"><span>다음에 확인할 내용</span><p>{{ nextManagementStep }}</p></div>
    </el-card>

    <div class="two-column-grid member-dashboard-grid">
      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">TODAY'S WORKOUT</p><h2>오늘의 운동</h2></div><el-button text type="primary" @click="go('/pt/member/workouts')">전체 보기 →</el-button></div>
        <div v-if="todayAssignments.length" class="member-assignment-list">
          <div v-for="assignment in todayAssignments" :key="assignment.id" class="member-assignment-row">
            <div class="member-assignment-row__icon">◎</div>
            <div><strong>{{ assignment.title }}</strong><p>{{ assignment.description }}</p><small>{{ assignment.exercises.length }}개 운동 · {{ formatDate(assignment.date) }}</small></div>
            <el-tag :type="assignment.status === '완료' ? 'success' : 'warning'" effect="light">{{ assignment.status }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="오늘 등록된 운동 과제가 없습니다." :image-size="72" />
      </el-card>

      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">COACHING NOTE</p><h2>최근 코칭 메모</h2></div><el-button text type="primary" @click="go('/pt/member/communication')">소통 보기 →</el-button></div>
        <div v-if="latestNote" class="member-coaching-preview">
          <div class="member-coaching-preview__meta"><el-tag type="primary" size="small" effect="light">강사 작성</el-tag><span>{{ formatDate(latestNote.createdAt.slice(0, 10)) }}</span></div>
          <h3>{{ latestNote.title }}</h3>
          <p>{{ latestNote.content }}</p>
        </div>
        <el-empty v-else description="아직 코칭 메모가 없습니다." :image-size="72" />
      </el-card>
    </div>

    <el-card v-if="importedSessions.length" class="panel-card imported-record-summary" shadow="never">
      <div class="section-heading">
        <div><p class="section-eyebrow">IMPORTED MEMBER RECORD</p><h2>가져온 회차 기록</h2></div>
        <div class="imported-record-summary__actions"><el-tag type="info" effect="plain">{{ importedSessions.length }}회</el-tag><el-button text type="primary" @click="go('/pt/member/schedule')">전체 기록 보기 →</el-button></div>
      </div>
      <p class="imported-record-summary__notice">기존에 정리된 회원 기록을 이 화면에서 확인할 수 있습니다. 원본에 세부 메모가 없는 회차도 날짜와 수업 주제를 보존해 표시합니다.</p>
      <div class="imported-record-list">
        <div v-for="session in importedSessions.slice(0, 4)" :key="session.id" class="imported-record-item">
          <div class="imported-record-item__date"><el-tag type="info" size="small" effect="light">가져온 기록</el-tag><strong>{{ formatDate(session.date) }}</strong></div>
          <div class="imported-record-item__body"><strong>{{ session.focus || 'PT 수업' }}</strong><p>{{ importedSessionDetails(session) }}</p></div>
        </div>
      </div>
    </el-card>

    <el-card class="panel-card member-quick-card" shadow="never">
      <div class="section-heading"><div><p class="section-eyebrow">QUICK ACCESS</p><h2>바로가기</h2></div></div>
      <div class="quick-access-grid">
        <button class="member-quick-action" type="button" @click="go('/pt/member/schedule')"><span>▦</span><strong>나의 PT 일정</strong><small>예약된 수업 확인</small></button>
        <button class="member-quick-action" type="button" @click="go('/pt/member/journal')"><span>✎</span><strong>운동·컨디션 기록</strong><small>오늘의 상태 남기기</small></button>
        <button class="member-quick-action" type="button" @click="go('/pt/member/communication')"><span>☏</span><strong>강사에게 질문</strong><small>질문과 피드백 확인</small></button>
        <button class="member-quick-action" type="button" @click="go('/pt/member/progress')"><span>↗</span><strong>나의 진행률</strong><small>목표와 체성분 확인</small></button>
      </div>
    </el-card>
  </div>
  <el-empty v-else description="회원 정보를 찾을 수 없습니다." :image-size="100" />
</template>

<style scoped>
.page-intro__eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: #8b96a8;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.page-intro h2 {
  margin: 0;
  color: #1e2f4d;
  font-size: 1.5rem;
}

.page-intro p {
  margin: 9px 0 0;
  color: #7c8799;
  font-size: 0.86rem;
}

.member-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: stretch;
  gap: 14px;
  margin-top: 22px;
}

.member-stat-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  min-width: 0;
  min-height: 136px;
  padding: 20px;
  border: 1px solid #e7eaf0;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 5px 20px rgb(23 32 51 / 4%);
}

.member-stat-card__icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 13px;
  font-size: 1.15rem;
  font-weight: 850;
}

.member-stat-card--blue .member-stat-card__icon {
  color: #2563eb;
  background: #edf3ff;
}

.member-stat-card--green .member-stat-card__icon {
  color: #047857;
  background: #ecfdf5;
}

.member-stat-card--orange .member-stat-card__icon {
  color: #b45309;
  background: #fffbeb;
}

.member-stat-card--purple .member-stat-card__icon {
  color: #7c3aed;
  background: #f5f3ff;
}

.member-stat-card__content {
  display: grid;
  min-width: 0;
  gap: 7px;
}

.member-stat-card__label,
.member-stat-card__description {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: keep-all;
}

.member-stat-card__label {
  color: #7c8799;
  font-size: 0.78rem;
  font-weight: 750;
  line-height: 1.45;
}

.member-stat-card__value {
  display: flex;
  align-items: baseline;
  gap: 3px;
  min-width: 0;
  color: #1e2f4d;
  font-size: 1.9rem;
  font-weight: 850;
  letter-spacing: -0.07em;
  line-height: 1.1;
  white-space: nowrap;
}

.member-stat-card__value small {
  color: #8b96a8;
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0;
}

.member-stat-card__description {
  color: #9aa4b4;
  font-size: 0.72rem;
  line-height: 1.5;
}

.member-dashboard-grid {
  margin-top: 18px;
}

.member-onboarding-summary {
  margin-top: 18px;
}

.member-onboarding-summary__description {
  margin: -4px 0 15px;
  color: #68768b;
  font-size: 0.8rem;
  line-height: 1.65;
}

.member-onboarding-summary__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.member-onboarding-summary__grid > div {
  min-width: 0;
  padding: 13px;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  background: #fbfcff;
}

.member-onboarding-summary__grid span,
.member-onboarding-summary__next span {
  color: #8b96a8;
  font-size: 0.7rem;
}

.member-onboarding-summary__grid strong {
  display: block;
  margin-top: 6px;
  color: #34445e;
  font-size: 0.79rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: keep-all;
}

.member-onboarding-summary__next {
  margin-top: 12px;
  padding: 12px 13px;
  border-radius: 11px;
  background: #f4f7ff;
}

.member-onboarding-summary__next p {
  margin: 5px 0 0;
  color: #526078;
  font-size: 0.76rem;
  line-height: 1.6;
}

.member-assignment-list {
  display: grid;
  gap: 12px;
}

.member-assignment-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px;
  border: 1px solid #e9edf4;
  border-radius: 13px;
}

.member-assignment-row__icon {
  display: grid;
  flex: 0 0 35px;
  place-items: center;
  width: 35px;
  height: 35px;
  border-radius: 11px;
  color: #2563eb;
  background: #edf3ff;
}

.member-assignment-row > div:nth-child(2) {
  min-width: 0;
  flex: 1;
}

.member-assignment-row strong {
  color: #33445f;
  font-size: 0.84rem;
}

.member-assignment-row p {
  margin: 5px 0;
  overflow: hidden;
  color: #7c8799;
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-assignment-row small {
  color: #a0a9b7;
  font-size: 0.7rem;
}

.member-coaching-preview {
  padding: 15px;
  border-radius: 13px;
  background: #f4f7ff;
}

.member-coaching-preview__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #8b96a8;
  font-size: 0.72rem;
}

.member-coaching-preview h3 {
  margin: 14px 0 8px;
  color: #2d4162;
  font-size: 0.9rem;
}

.member-coaching-preview p {
  margin: 0;
  color: #526078;
  font-size: 0.82rem;
  line-height: 1.7;
}

.member-quick-card {
  margin-top: 18px;
}

.imported-record-summary {
  margin-top: 18px;
}

.imported-record-summary__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.imported-record-summary__notice {
  margin: -4px 0 16px;
  color: #7c8799;
  font-size: 0.78rem;
  line-height: 1.6;
}

.imported-record-list {
  display: grid;
  gap: 10px;
}

.imported-record-item {
  display: grid;
  grid-template-columns: minmax(142px, auto) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding: 13px 14px;
  border: 1px solid #e8edf5;
  border-radius: 13px;
  background: #fbfcff;
}

.imported-record-item__date {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #526078;
  font-size: 0.76rem;
}

.imported-record-item__body {
  min-width: 0;
}

.imported-record-item__body strong {
  display: block;
  color: #34445e;
  font-size: 0.84rem;
  line-height: 1.45;
}

.imported-record-item__body p {
  margin: 5px 0 0;
  color: #7c8799;
  font-size: 0.76rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: keep-all;
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.member-quick-action {
  display: grid;
  min-height: 118px;
  place-items: center;
  gap: 7px;
  padding: 16px 12px;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  color: #33445f;
  background: #fff;
  cursor: pointer;
  transition: 0.2s ease;
}

.member-quick-action:hover {
  border-color: #bcd0ff;
  background: #f7f9ff;
  transform: translateY(-2px);
}

.member-quick-action span {
  color: #2563eb;
  font-size: 1.25rem;
}

.member-quick-action strong {
  font-size: 0.82rem;
}

.member-quick-action small {
  color: #8b96a8;
  font-size: 0.7rem;
}

@media (max-width: 900px) {
  .member-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .member-onboarding-summary__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-access-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .member-stats-grid {
    grid-template-columns: 1fr;
  }

  .page-intro__actions {
    width: 100%;
  }

  .page-intro__actions .el-button {
    flex: 1;
  }

  .quick-access-grid {
    grid-template-columns: 1fr;
  }

  .member-onboarding-summary__grid {
    grid-template-columns: 1fr;
  }

  .member-assignment-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .member-assignment-row .el-tag {
    margin-left: 48px;
  }

  .member-stat-card {
    min-height: 118px;
    padding: 18px;
  }

  .imported-record-summary__actions {
    align-items: flex-end;
    flex-direction: column;
    gap: 4px;
  }

  .imported-record-item {
    grid-template-columns: 1fr;
    gap: 9px;
  }
}
</style>
