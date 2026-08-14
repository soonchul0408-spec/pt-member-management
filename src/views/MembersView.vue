<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import MemberFormDialog from '@/components/pt/MemberFormDialog.vue'
import {
  getMemberOnboarding,
  getOnboardingStatusType,
  isSampleMember,
  ONBOARDING_STATUSES,
} from '@/services/memberOnboarding'
import { usePtStore } from '@/stores/ptStore'

const router = useRouter()
const store = usePtStore()
const search = ref('')
const statusFilter = ref('전체')
const trainerFilter = ref('전체')
const onboardingFilter = ref('전체')
const dialogOpen = ref(false)
const editingMember = ref(null)

const filteredMembers = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return store.members.filter((member) => {
    const matchesSearch = !keyword || [member.name, member.phone, member.email, member.goal].some((value) => String(value ?? '').toLowerCase().includes(keyword))
    const matchesStatus = statusFilter.value === '전체' || member.status === statusFilter.value
    const matchesTrainer = trainerFilter.value === '전체' || member.trainerId === trainerFilter.value
    const matchesOnboarding = onboardingFilter.value === '전체' || getMemberOnboarding(member).onboardingStatus === onboardingFilter.value
    return matchesSearch && matchesStatus && matchesTrainer && matchesOnboarding
  })
})

function trainerName(trainerId) {
  return store.getTrainer(trainerId)?.name ?? '-'
}

function membership(memberId) {
  return store.getMembership(memberId)
}

function formatDate(value) {
  return typeof value === 'string' ? value.replaceAll('-', '.') : '-'
}

function openNew() {
  if (!store.canEdit) return
  editingMember.value = null
  dialogOpen.value = true
}

function openEdit(member) {
  if (!store.canEdit) return
  editingMember.value = member
  dialogOpen.value = true
}

function saveMember(payload) {
  if (payload.id) store.updateMember(payload)
  else store.addMember(payload)
}
</script>

<template>
  <div class="members-page">
    <section class="page-intro">
      <div>
        <p class="page-intro__eyebrow">MEMBER MANAGEMENT</p>
        <h2>회원 관리</h2>
        <p>회원 기본정보, 목표, 회원권 상태를 한 곳에서 관리합니다.</p>
      </div>
      <div v-if="store.canEdit" class="page-intro__actions"><el-button type="primary" @click="openNew">+ 새 회원 등록</el-button></div>
    </section>

    <section class="page-toolbar">
      <div class="page-toolbar__filters">
        <el-input v-model="search" class="page-toolbar__search" clearable placeholder="이름·연락처·목표 검색" />
        <el-select v-model="statusFilter" placeholder="회원 상태" style="width: 130px">
          <el-option label="전체 상태" value="전체" />
          <el-option v-for="status in store.memberStatuses" :key="status" :label="status" :value="status" />
        </el-select>
        <el-select v-model="trainerFilter" placeholder="담당 트레이너" style="width: 150px">
          <el-option label="전체 트레이너" value="전체" />
          <el-option v-for="trainer in store.trainers" :key="trainer.id" :label="trainer.name" :value="trainer.id" />
        </el-select>
        <el-select v-model="onboardingFilter" placeholder="온보딩 상태" style="width: 160px">
          <el-option label="전체 온보딩" value="전체" />
          <el-option v-for="status in ONBOARDING_STATUSES" :key="status" :label="status" :value="status" />
        </el-select>
      </div>
      <span class="muted-text">{{ filteredMembers.length }}명 표시 중</span>
    </section>

    <el-card class="page-card" shadow="never">
      <div v-if="filteredMembers.length" class="data-table-wrap">
        <table class="data-table members-table">
          <thead><tr><th>회원</th><th>운동 목표</th><th>연락처</th><th>담당 트레이너</th><th>온보딩</th><th>회원권</th><th>남은 수업</th><th>최근 출석</th><th>소통</th><th>상태</th><th></th></tr></thead>
          <tbody>
            <tr v-for="member in filteredMembers" :key="member.id" class="is-clickable" @click="router.push(`/pt/members/${member.id}`)">
              <td><div class="table-cell-with-avatar"><div class="member-avatar" :style="{ background: member.avatarColor }">{{ member.name.slice(0, 1) }}</div><div class="member-name"><strong>{{ member.name }} <el-tag v-if="isSampleMember(member)" type="info" size="small" effect="plain">샘플</el-tag></strong><small>{{ member.gender }} · {{ member.birthYear }}년생</small></div></div></td>
              <td class="member-goal-cell">{{ member.goal || '목표 미설정' }}</td>
              <td><span>{{ member.phone }}</span><small class="muted-text">{{ member.email }}</small></td>
              <td>{{ trainerName(member.trainerId) }}</td>
              <td><el-tag :type="getOnboardingStatusType(getMemberOnboarding(member).onboardingStatus)" size="small" effect="light">{{ getMemberOnboarding(member).onboardingStatus }}</el-tag></td>
              <td><span v-if="membership(member.id)">{{ membership(member.id).type }}</span><span v-else class="muted-text">미등록</span></td>
              <td><strong class="remaining-count">{{ membership(member.id)?.remainingSessions ?? 0 }}회</strong></td>
              <td>{{ formatDate(store.getMemberSessions(member.id)[0]?.date) }}</td>
              <td><el-tag v-if="store.getUnreadCommunicationCount(member.id, 'instructor')" type="warning" size="small" effect="light">질문 {{ store.getUnreadCommunicationCount(member.id, 'instructor') }}</el-tag><span v-else class="muted-text">확인 완료</span></td>
              <td><el-tag :type="member.status === '활성' ? 'success' : member.status === '휴식' ? 'warning' : 'info'" size="small" effect="light">{{ member.status }}</el-tag></td>
              <td><el-button v-if="store.canEdit" text type="primary" @click.stop="openEdit(member)">수정</el-button><span v-else class="muted-text">조회</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-panel">
        <el-empty description="조건에 맞는 회원이 없습니다." :image-size="90">
          <el-button v-if="store.canEdit" type="primary" plain @click="openNew">새 회원 등록</el-button>
        </el-empty>
      </div>
    </el-card>

    <MemberFormDialog v-if="store.canEdit" v-model="dialogOpen" :member="editingMember" :trainers="store.trainers" :statuses="store.memberStatuses" @save="saveMember" />
  </div>
</template>

<style scoped>
.page-intro__actions {
  margin-left: auto;
}

.remaining-count {
  color: #2563eb;
  font-weight: 850;
}

.members-table td small {
  display: block;
  margin-top: 3px;
}

.member-goal-cell {
  max-width: 230px;
  color: #526078;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: keep-all;
}

.member-name strong {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}
</style>
