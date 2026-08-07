<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { usePtStore } from '@/stores/ptStore'

const router = useRouter()
const store = usePtStore()

const formatDate = (value) => value?.replaceAll('-', '.') ?? '-'
const unreadQuestions = computed(() => store.members.reduce((total, member) => total + store.getUnreadCommunicationCount(member.id, 'instructor'), 0))
const todayLabel = computed(() => {
  const date = new Date(`${store.today}T00:00:00`)
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date)
})

function memberName(memberId) {
  return store.getMember(memberId)?.name ?? '알 수 없는 회원'
}

function trainerName(trainerId) {
  return store.getTrainer(trainerId)?.name ?? '-'
}

function openMember(memberId) {
  router.push(`/pt/members/${memberId}`)
}
</script>

<template>
  <div class="dashboard-page">
    <section class="page-intro">
      <div>
        <p class="page-intro__eyebrow">GOOD MORNING, {{ store.currentUser.name }}</p>
        <h2>오늘의 PT 운영 현황</h2>
        <p>{{ todayLabel }} · 회원의 흐름을 확인하고 수업을 준비하세요.</p>
      </div>
      <div class="dashboard-heading__actions">
        <el-button plain @click="router.push('/pt/members')">회원 목록</el-button>
        <el-button v-if="store.canEdit" type="primary" @click="router.push('/pt/schedule')">+ 수업 등록</el-button>
      </div>
    </section>

    <section class="stat-grid">
      <el-card class="stat-card" shadow="never">
        <div class="stat-card__top"><span class="stat-card__label">전체 회원</span><span class="stat-card__symbol">◎</span></div>
        <div class="stat-card__value-row"><strong class="stat-card__value">{{ store.members.length }}</strong><span class="stat-card__unit">명</span></div>
        <p class="stat-card__caption">활성 회원 {{ store.activeMembers.length }}명</p>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-card__top"><span class="stat-card__label">오늘 수업</span><span class="stat-card__symbol">▦</span></div>
        <div class="stat-card__value-row"><strong class="stat-card__value">{{ store.todaySessions.length }}</strong><span class="stat-card__unit">건</span></div>
        <p class="stat-card__caption">예정 수업을 확인하세요</p>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-card__top"><span class="stat-card__label">회원권 만료 예정</span><span class="stat-card__symbol">!</span></div>
        <div class="stat-card__value-row"><strong class="stat-card__value">{{ store.expiringMemberships.length }}</strong><span class="stat-card__unit">명</span></div>
        <p class="stat-card__caption">연장 상담이 필요한 회원</p>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-card__top"><span class="stat-card__label">누적 결제액</span><span class="stat-card__symbol">₩</span></div>
        <div class="stat-card__value-row"><strong class="stat-card__value stat-card__value--money">{{ (store.totalRevenue / 10000).toFixed(0) }}</strong><span class="stat-card__unit">만원</span></div>
        <p class="stat-card__caption">결제 완료 기준</p>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-card__top"><span class="stat-card__label">읽지 않은 질문</span><span class="stat-card__symbol">?</span></div>
        <div class="stat-card__value-row"><strong class="stat-card__value">{{ unreadQuestions }}</strong><span class="stat-card__unit">건</span></div>
        <p class="stat-card__caption">회원 소통 화면에서 답변</p>
      </el-card>
    </section>

    <section class="dashboard-grid">
      <el-card class="panel-card" shadow="never">
        <div class="section-heading">
          <div><p class="section-eyebrow">TODAY'S SCHEDULE</p><h2>오늘의 수업</h2></div>
          <el-button text type="primary" @click="router.push('/pt/schedule')">전체 일정 보기 →</el-button>
        </div>
        <div v-if="store.todaySessions.length" class="mini-list">
          <div v-for="session in store.todaySessions" :key="session.id" class="mini-list__item" @click="openMember(session.memberId)">
            <div class="member-avatar" :style="{ background: store.getMember(session.memberId)?.avatarColor }">{{ memberName(session.memberId).slice(0, 1) }}</div>
            <div>
              <strong>{{ memberName(session.memberId) }} · {{ session.focus || '운동 기록 전' }}</strong>
              <span>{{ trainerName(session.trainerId) }} · {{ session.duration }}분</span>
            </div>
            <span class="mini-list__time">{{ session.startTime }}</span>
            <el-tag :type="session.status === '완료' ? 'success' : 'primary'" size="small" effect="light">{{ session.status }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="오늘 예정된 수업이 없습니다." :image-size="70" />
      </el-card>

      <el-card class="panel-card" shadow="never">
        <div class="section-heading">
          <div><p class="section-eyebrow">MEMBERSHIP ALERT</p><h2>회원권 확인 필요</h2></div>
          <el-button text type="primary" @click="router.push('/pt/payments')">회원권 관리 →</el-button>
        </div>
        <div v-if="store.expiringMemberships.length" class="mini-list">
          <div v-for="membership in store.expiringMemberships.slice(0, 4)" :key="membership.id" class="mini-list__item" @click="openMember(membership.memberId)">
            <div class="member-avatar" :style="{ background: store.getMember(membership.memberId)?.avatarColor }">{{ memberName(membership.memberId).slice(0, 1) }}</div>
            <div>
              <strong>{{ memberName(membership.memberId) }}</strong>
              <span>{{ membership.type }} · {{ membership.remainingSessions }}회 남음</span>
            </div>
            <el-tag :type="membership.status === '휴식 중' ? 'info' : 'warning'" size="small" effect="light">{{ membership.status }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="확인이 필요한 회원권이 없습니다." :image-size="70" />
      </el-card>
    </section>

    <section class="two-column-grid">
      <el-card class="panel-card" shadow="never">
        <div class="section-heading">
          <div><p class="section-eyebrow">ATTENDANCE</p><h2>출석 현황</h2></div>
          <el-tag type="success" effect="plain">최근 기록 기준</el-tag>
        </div>
        <div class="progress-row">
          <div class="progress-row__label"><span>전체 출석률</span><strong>{{ store.attendanceRate }}%</strong></div>
          <el-progress :percentage="store.attendanceRate" :stroke-width="11" :show-text="false" color="#0f766e" />
        </div>
        <div class="summary-card__footer"><strong>{{ store.completedSessions.length }}건 수업 완료</strong><span>취소·예정 수업을 제외하고 계산했습니다.</span></div>
      </el-card>

      <el-card class="panel-card" shadow="never">
        <div class="section-heading">
          <div><p class="section-eyebrow">QUICK ACCESS</p><h2>빠른 작업</h2></div>
        </div>
        <div v-if="store.canEdit" class="quick-actions">
          <el-button class="quick-action" plain @click="router.push('/pt/members')">
            <span class="quick-action__icon" aria-hidden="true">◎</span>
            <span class="quick-action__title">새 회원 등록</span>
            <span class="quick-action__description">회원 기본정보와 목표 입력</span>
          </el-button>
          <el-button class="quick-action" plain @click="router.push('/pt/sessions')">
            <span class="quick-action__icon" aria-hidden="true">✓</span>
            <span class="quick-action__title">수업 기록 작성</span>
            <span class="quick-action__description">진행 운동과 메모 저장</span>
          </el-button>
          <el-button class="quick-action" plain @click="router.push('/pt/measurements')">
            <span class="quick-action__icon" aria-hidden="true">↗</span>
            <span class="quick-action__title">체성분 기록</span>
            <span class="quick-action__description">변화 추이를 업데이트</span>
          </el-button>
        </div>
        <el-empty v-else description="읽기 전용 계정에서는 신규 기록을 만들 수 없습니다." :image-size="70"><el-button type="primary" plain @click="router.push('/pt/login')">편집자 로그인</el-button></el-empty>
      </el-card>
    </section>

    <section class="two-column-grid">
      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">RECENT MEMBERS</p><h2>최근 회원</h2></div><el-button text type="primary" @click="router.push('/pt/members')">전체 보기 →</el-button></div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>회원</th><th>담당</th><th>등록일</th><th>상태</th></tr></thead>
            <tbody>
              <tr v-for="member in store.members.slice(0, 4)" :key="member.id" class="is-clickable" @click="openMember(member.id)">
                <td><div class="table-cell-with-avatar"><div class="member-avatar" :style="{ background: member.avatarColor }">{{ member.name.slice(0, 1) }}</div><div><strong>{{ member.name }}</strong><small>{{ member.goal }}</small></div></div></td>
                <td>{{ trainerName(member.trainerId) }}</td><td>{{ formatDate(member.joinedAt) }}</td>
                <td><el-tag :type="member.status === '활성' ? 'success' : 'info'" size="small" effect="light">{{ member.status }}</el-tag></td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-card>
      <el-card class="panel-card" shadow="never">
        <div class="section-heading"><div><p class="section-eyebrow">UPCOMING</p><h2>다가오는 수업</h2></div><el-button text type="primary" @click="router.push('/pt/schedule')">일정 보기 →</el-button></div>
        <div class="mini-list">
          <div v-for="session in store.upcomingSessions.slice(0, 4)" :key="session.id" class="mini-list__item" @click="openMember(session.memberId)">
            <div class="member-avatar" :style="{ background: store.getMember(session.memberId)?.avatarColor }">{{ memberName(session.memberId).slice(0, 1) }}</div>
            <div><strong>{{ memberName(session.memberId) }}</strong><span>{{ formatDate(session.date) }} · {{ trainerName(session.trainerId) }}</span></div>
            <span class="mini-list__time">{{ session.startTime }}</span>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.stat-card__value--money {
  font-size: 1.6rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  gap: 12px;
}

.quick-action {
  display: flex;
  height: auto;
  min-height: 142px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  padding: 18px;
  border-color: #edf0f5;
  border-radius: 14px;
  text-align: left;
  white-space: normal;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.quick-action:hover {
  border-color: #c7d7ff;
  background: #fbfdff;
  transform: translateY(-2px);
}

.quick-action__icon,
.quick-action__title,
.quick-action__description {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-action__icon {
  width: 34px;
  height: 34px;
  padding-top: 1px;
  border-radius: 10px;
  color: #2563eb;
  background: #eff4ff;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 33px;
  text-align: center;
}

.quick-action__title {
  color: #2f3d53;
  font-size: 0.83rem;
  font-weight: 800;
  line-height: 1.35;
  white-space: nowrap;
}

.quick-action__description {
  color: #9aa4b4;
  font-size: 0.65rem;
  line-height: 1.4;
  white-space: normal;
}

.quick-action:nth-child(2) .quick-action__icon {
  color: #047857;
  background: #ecfdf5;
}

.quick-action:nth-child(3) .quick-action__icon {
  color: #7c3aed;
  background: #f5f3ff;
}

@media (max-width: 980px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }

  .quick-action {
    min-height: 112px;
  }
}

.mini-list__item {
  cursor: pointer;
}

@media (max-width: 520px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
