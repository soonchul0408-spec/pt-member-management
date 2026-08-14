<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import MemberFormDialog from '@/components/pt/MemberFormDialog.vue'
import { CONSULTATION_STATUSES, CONSULTATION_STATUS_TYPES } from '@/data/consultationData'
import {
  CONSULTATION_CHANGED_EVENT,
  consultationRepository,
  getConsultationErrorMessage,
} from '@/services/consultationRepository'
import { findPossibleMemberMatches } from '@/services/memberMatching'
import {
  createMemberDraftFromConsultation,
  normalizeMemberRegistrationPayload,
} from '@/services/memberConversion'
import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const router = useRouter()
const auth = useAuthStore()
const store = usePtStore()
const consultations = ref([])
const selectedId = ref('')
const memberDialogOpen = ref(false)
const memberDraft = ref(null)
const pendingConsultationId = ref('')
const registrationError = ref('')
const storageWarning = ref('')
const loadError = ref('')
const statusError = ref('')
const duplicateAcknowledged = ref(false)
const duplicateMemberId = ref('')
const isLoading = ref(false)
const isStatusUpdating = ref(false)
const isConvertingMember = ref(false)

const selectedConsultation = computed(() => consultations.value.find((consultation) => consultation.id === selectedId.value) || null)
const actualConsultationCount = computed(() => consultations.value.filter((consultation) => !consultation.isSample).length)
const selectedMemberMatches = computed(() => findPossibleMemberMatches(store.members, selectedConsultation.value))
const canRegisterMembers = computed(() => Boolean(auth.user) && auth.isInstructor && store.canEdit)
const canPrepareMemberRegistration = computed(() => Boolean(
  canRegisterMembers.value
  && selectedConsultation.value
  && selectedConsultation.value.status === '상담 완료'
  && !selectedConsultation.value.isSample
  && !selectedConsultation.value.isConvertedToMember,
))
const dataSourceLabel = computed(() => (consultationRepository.isRemote ? '서버 저장' : '브라우저 데모 저장'))

const consultationSummary = computed(() => {
  const sampleCount = consultations.value.filter((consultation) => consultation.isSample).length
  const sampleCaption = sampleCount ? `샘플 ${sampleCount}건 포함` : '현재 브라우저에 저장된 문의'

  return [
    { label: '전체 문의', value: consultations.value.length, caption: sampleCaption, tone: 'blue', symbol: '◎' },
    { label: '신규 문의', value: countByStatus('신규 문의'), caption: '확인이 필요한 문의', tone: 'orange', symbol: '!' },
    { label: '상담 예정', value: countByStatus('상담 예정'), caption: '상담 일정 조율 중', tone: 'purple', symbol: '◷' },
    { label: '상담 완료', value: countByStatus('상담 완료'), caption: '상담이 완료된 문의', tone: 'green', symbol: '✓' },
  ]
})

function countByStatus(status) {
  return consultations.value.filter((consultation) => consultation.status === status).length
}

function formatCreatedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '신청 일시 확인 필요'

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

async function loadConsultations(preferredId = selectedId.value) {
  isLoading.value = true
  loadError.value = ''
  const storageStatus = consultationRepository.getStorageStatus()
  storageWarning.value = storageStatus.status === 'invalid'
    ? '상담 저장 데이터 형식을 읽지 못했습니다. 기존 값을 삭제하지 않고 샘플 문의만 표시합니다. 저장값을 확인한 뒤 다시 시도해 주세요.'
    : storageStatus.status === 'unavailable'
      ? '이 브라우저의 저장 공간을 사용할 수 없어 상담 데이터를 저장하거나 불러올 수 없습니다.'
      : ''

  let nextConsultations
  try {
    nextConsultations = await consultationRepository.list()
  } catch (error) {
    loadError.value = getConsultationErrorMessage(error, '상담 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    consultations.value = []
    selectedId.value = ''
    isLoading.value = false
    return
  }
  consultations.value = nextConsultations
  isLoading.value = false

  if (!nextConsultations.length) {
    selectedId.value = ''
    return
  }

  selectedId.value = nextConsultations.some((consultation) => consultation.id === preferredId)
    ? preferredId
    : nextConsultations[0].id
}

function selectConsultation(id) {
  selectedId.value = id
  registrationError.value = ''
  statusError.value = ''
  duplicateAcknowledged.value = false
  duplicateMemberId.value = ''
}

async function handleStatusChange(status) {
  if (!selectedConsultation.value || selectedConsultation.value.isSample || isStatusUpdating.value) return

  const consultationId = selectedConsultation.value.id
  const expectedUpdatedAt = selectedConsultation.value.updatedAt
  statusError.value = ''
  isStatusUpdating.value = true
  try {
    const updated = await consultationRepository.updateStatus(consultationId, status, expectedUpdatedAt)
    if (updated) await loadConsultations(updated.id)
  } catch (error) {
    statusError.value = getConsultationErrorMessage(error, '상담 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    await loadConsultations(consultationId)
  } finally {
    isStatusUpdating.value = false
  }
}

function prepareMemberRegistration() {
  const consultation = selectedConsultation.value
  registrationError.value = ''
  duplicateMemberId.value = ''

  if (!canRegisterMembers.value) {
    registrationError.value = '회원 등록 전환은 인증된 강사만 실행할 수 있습니다.'
    return
  }
  if (!consultation) {
    registrationError.value = '등록할 상담 문의를 찾을 수 없습니다. 목록을 다시 확인해 주세요.'
    return
  }
  if (consultation.isSample) {
    registrationError.value = '샘플 상담은 실제 회원으로 등록할 수 없습니다.'
    return
  }
  if (consultation.status !== '상담 완료') {
    registrationError.value = '상담 상태가 상담 완료인 경우에만 회원 등록을 준비할 수 있습니다.'
    return
  }
  if (consultation.isConvertedToMember) {
    registrationError.value = '이미 회원으로 등록된 상담입니다.'
    return
  }
  if (selectedMemberMatches.value.length && !duplicateAcknowledged.value) {
    registrationError.value = '기존 회원과 중복 가능성이 있습니다. 기존 회원을 확인한 뒤 등록을 계속해 주세요.'
    return
  }

  pendingConsultationId.value = consultation.id
  memberDraft.value = createMemberDraftFromConsultation(consultation, { trainerId: store.trainers[0]?.id ?? '' })
  memberDialogOpen.value = true
}

function acknowledgeDuplicateAndPrepare() {
  duplicateAcknowledged.value = true
  prepareMemberRegistration()
}

function openExistingMember(memberId) {
  if (!memberId) return
  router.push(`/pt/members/${memberId}`)
}

async function saveConvertedMember(payload) {
  const consultation = consultations.value.find((item) => item.id === pendingConsultationId.value)
  const convertedAt = new Date().toISOString()
  const normalizedPayload = normalizeMemberRegistrationPayload(payload, consultation, convertedAt)

  if (!canRegisterMembers.value) {
    registrationError.value = '회원 등록 전환은 인증된 강사만 실행할 수 있습니다.'
    return
  }
  if (!consultation || consultation.isSample || consultation.status !== '상담 완료' || consultation.isConvertedToMember) {
    registrationError.value = '현재 상담 상태에서는 회원 등록을 완료할 수 없습니다.'
    return
  }
  if (!normalizedPayload) {
    registrationError.value = '회원명, 연락처, 운동 목표를 모두 확인해 주세요.'
    return
  }

  const matches = findPossibleMemberMatches(store.members, normalizedPayload)
  if (matches.length && !duplicateAcknowledged.value) {
    registrationError.value = '기존 회원과 중복 가능성이 있어 등록을 중단했습니다. 기존 회원을 확인해 주세요.'
    return
  }

  if (consultationRepository.isRemote) {
    if (isConvertingMember.value) return
    isConvertingMember.value = true
    try {
      const result = await consultationRepository.convertToMember(consultation.id, normalizedPayload)
      const memberId = result?.member?.id
      if (!memberId) throw new Error('회원 전환 결과를 확인하지 못했습니다. 다시 시도해 주세요.')
      await store.hydrateRemote()
      registrationError.value = ''
      memberDialogOpen.value = false
      memberDraft.value = null
      pendingConsultationId.value = ''
      duplicateAcknowledged.value = false
      await loadConsultations(consultation.id)
      router.push(`/pt/members/${memberId}`)
    } catch (error) {
      duplicateMemberId.value = error?.code === 'DUPLICATE_MEMBER' ? error.details || '' : ''
      registrationError.value = getConsultationErrorMessage(error, '회원 전환을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      isConvertingMember.value = false
    }
    return
  }

  const member = store.addMember(normalizedPayload)
  if (!member) {
    registrationError.value = '회원 정보를 저장하지 못했습니다. 강사 권한과 저장 상태를 확인해 주세요.'
    return
  }

  const convertedConsultation = consultationRepository.markConverted(consultation.id, member.id, convertedAt)
  if (!convertedConsultation) {
    store.removeMember(member.id)
    registrationError.value = '상담 전환 정보를 저장하지 못해 회원 등록을 취소했습니다. 다시 시도해 주세요.'
    return
  }

  registrationError.value = ''
  duplicateMemberId.value = ''
  memberDialogOpen.value = false
  memberDraft.value = null
  pendingConsultationId.value = ''
  duplicateAcknowledged.value = false
  await loadConsultations(consultation.id)
  router.push(`/pt/members/${member.id}`)
}

function handleStorageChange() {
  void loadConsultations()
}

onMounted(() => {
  void loadConsultations()
  window.addEventListener(CONSULTATION_CHANGED_EVENT, handleStorageChange)
  window.addEventListener('storage', handleStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener(CONSULTATION_CHANGED_EVENT, handleStorageChange)
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<template>
  <div class="consultations-page">
    <section class="page-intro">
      <div>
        <p class="page-intro__eyebrow">NEW MEMBER INQUIRIES</p>
        <h2>신규 상담 관리</h2>
        <p>공개 상담 화면에서 들어온 문의를 기존 회원 관리와 구분해 확인하는 화면입니다.</p>
      </div>
      <div class="page-intro__actions">
        <el-button plain @click="router.push('/')">공개 메인으로</el-button>
        <el-tag type="info" effect="plain" round>{{ dataSourceLabel }}</el-tag>
      </div>
    </section>

    <el-alert v-if="storageWarning" type="warning" :closable="false" show-icon :title="storageWarning" />
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="loadError" />

    <section v-if="!loadError" class="consultation-summary-grid" aria-label="상담 문의 상태 요약">
      <article v-for="summary in consultationSummary" :key="summary.label" class="consultation-summary-card" :class="`consultation-summary-card--${summary.tone}`">
        <div class="consultation-summary-card__top">
          <span>{{ summary.label }}</span>
          <strong>{{ summary.symbol }}</strong>
        </div>
        <div class="consultation-summary-card__value"><b>{{ summary.value }}</b><small>건</small></div>
        <p>{{ summary.caption }}</p>
      </article>
    </section>

    <section v-loading="isLoading" class="consultation-layout">
      <el-card class="panel-card consultation-card" shadow="never">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">INQUIRY LIST</p>
            <h2>상담 문의 목록</h2>
          </div>
          <el-tag type="info" effect="plain">{{ consultations.length }}건</el-tag>
        </div>

        <div v-if="loadError" class="consultation-empty-state consultation-empty-state--error">
          <strong>상담 목록을 불러오지 못했습니다.</strong>
          <p>서버 상태와 강사 권한을 확인한 뒤 다시 시도해 주세요.</p>
          <el-button type="primary" plain @click="void loadConsultations(selectedId)">다시 불러오기</el-button>
        </div>

        <div v-else-if="!consultations.length" class="consultation-empty-state">
          <strong>아직 상담 문의가 없습니다.</strong>
          <p>공개 상담 화면에서 신청이 들어오면 이곳에 표시됩니다.</p>
        </div>

        <div v-else class="consultation-list">
          <button
            v-for="request in consultations"
            :key="request.id"
            type="button"
            class="consultation-list-item"
            :class="{ 'is-selected': request.id === selectedId }"
            :aria-pressed="request.id === selectedId"
            @click="selectConsultation(request.id)"
          >
            <div class="consultation-list-item__avatar" aria-hidden="true">{{ request.name.slice(0, 1) }}</div>
            <div class="consultation-list-item__body">
              <div class="consultation-list-item__title">
                <strong>{{ request.name }}</strong>
                <span v-if="request.isSample" class="consultation-list-item__sample">샘플</span>
                <span>{{ formatCreatedAt(request.createdAt) }}</span>
              </div>
              <p>{{ request.goal }}</p>
              <div class="consultation-list-item__meta"><span>연락처 · {{ request.contact }}</span><span>공개 상담 폼</span></div>
            </div>
            <div class="consultation-list-item__tags">
              <el-tag v-if="request.isSample" type="info" effect="plain" round>샘플</el-tag>
              <el-tag v-if="request.isConvertedToMember" type="success" effect="plain" round>회원 등록 완료</el-tag>
              <el-tag :type="CONSULTATION_STATUS_TYPES[request.status]" effect="light" round>{{ request.status }}</el-tag>
            </div>
          </button>
        </div>

        <p v-if="!loadError && actualConsultationCount === 0" class="consultation-card__notice">현재 실제 신청 문의는 없습니다. 위 목록의 샘플 문의는 화면 구조 확인용이며 상담 신청과 연결되지 않습니다.</p>
        <p v-else-if="!loadError" class="consultation-card__notice">실제 신청 문의 {{ actualConsultationCount }}건과 샘플 문의가 함께 표시됩니다. 샘플 표시는 상태 변경을 지원하지 않습니다.</p>
      </el-card>

      <el-card class="panel-card consultation-card consultation-detail-card" shadow="never">
        <div v-if="selectedConsultation" class="section-heading">
          <div>
            <p class="section-eyebrow">INQUIRY PREVIEW</p>
            <h2>상담 상세 미리보기</h2>
          </div>
          <div class="consultation-detail-card__tags">
            <el-tag v-if="selectedConsultation.isSample" type="info" effect="plain" round>샘플</el-tag>
            <el-tag v-if="selectedConsultation.isConvertedToMember" type="success" effect="plain" round>회원 등록 완료</el-tag>
            <el-tag :type="CONSULTATION_STATUS_TYPES[selectedConsultation.status]" effect="light" round>{{ selectedConsultation.status }}</el-tag>
          </div>
        </div>

        <div v-if="selectedConsultation" class="consultation-detail">
          <div class="consultation-detail__identity">
            <div class="consultation-list-item__avatar" aria-hidden="true">{{ selectedConsultation.name.slice(0, 1) }}</div>
            <div>
              <strong>{{ selectedConsultation.name }}님의 상담 문의</strong>
              <span>{{ formatCreatedAt(selectedConsultation.createdAt) }} · 공개 상담 폼</span>
            </div>
          </div>

          <dl class="consultation-detail__facts">
            <div><dt>연락처</dt><dd>{{ selectedConsultation.contact }}</dd></div>
            <div><dt>운동 목표</dt><dd>{{ selectedConsultation.goal }}</dd></div>
            <div><dt>신청 일시</dt><dd>{{ formatCreatedAt(selectedConsultation.createdAt) }}</dd></div>
          </dl>

          <div class="consultation-detail__placeholder">
            <span>{{ selectedConsultation.isSample ? '샘플 데이터' : '브라우저 데모 데이터' }}</span>
            <p v-if="selectedConsultation.isSample">실제 개인정보가 아닌 화면 확인용 샘플입니다. 샘플 문의의 상태는 변경하지 않습니다.</p>
            <p v-else-if="consultationRepository.isRemote">상태를 변경하면 서버에 저장되고, 다른 강사 기기에서도 권한에 따라 확인할 수 있습니다.</p>
            <p v-else>상태를 변경하면 이 브라우저의 localStorage에 반영되고, 새로고침 후에도 유지됩니다.</p>
          </div>

          <div class="consultation-status-control">
            <label for="consultation-status">상담 상태</label>
            <el-select
              id="consultation-status"
              :model-value="selectedConsultation.status"
              :disabled="selectedConsultation.isSample || isStatusUpdating"
              aria-label="상담 상태 변경"
              @change="handleStatusChange"
            >
              <el-option v-for="status in CONSULTATION_STATUSES" :key="status" :label="status" :value="status" />
            </el-select>
            <small v-if="selectedConsultation.isSample">샘플 문의는 상태 변경이 제한됩니다.</small>
            <small v-else-if="isStatusUpdating">상담 상태를 서버에 저장하는 중입니다.</small>
          </div>

          <el-alert v-if="statusError" class="consultation-status-error" type="error" :closable="false" show-icon :title="statusError" />

          <div v-if="selectedConsultation.isConvertedToMember" class="consultation-conversion-card consultation-conversion-card--success">
            <div>
              <span>회원 등록 완료</span>
              <p>{{ formatCreatedAt(selectedConsultation.convertedAt) }}에 기존 회원 관리로 연결되었습니다. 등록된 회원 화면에서 관리 내용을 이어갈 수 있습니다.</p>
            </div>
            <el-button type="primary" plain @click="openExistingMember(selectedConsultation.convertedMemberId)">등록된 회원 보기</el-button>
          </div>

          <el-alert
            v-else-if="canPrepareMemberRegistration && selectedMemberMatches.length"
            class="consultation-duplicate-alert"
            type="warning"
            :closable="false"
            show-icon
            title="기존 회원과 중복 가능성이 있습니다."
          >
            <p>같은 연락처의 회원이 있어 먼저 기존 회원을 확인해야 합니다. 기존 정보를 덮어쓰지 않습니다.</p>
            <div class="consultation-duplicate-alert__actions">
              <el-button v-for="memberMatch in selectedMemberMatches" :key="memberMatch.id" text type="warning" @click="openExistingMember(memberMatch.id)">
                {{ memberMatch.name }} 회원 확인
              </el-button>
              <el-button v-if="!duplicateAcknowledged" type="warning" plain @click="acknowledgeDuplicateAndPrepare">확인 후 등록 준비</el-button>
            </div>
          </el-alert>

          <div v-if="canPrepareMemberRegistration && (!selectedMemberMatches.length || duplicateAcknowledged)" class="consultation-registration-action">
            <div>
              <strong>상담 내용을 회원 등록 화면으로 가져옵니다.</strong>
              <p>등록 전 이름, 연락처, 운동 목표를 확인하고 필요한 내용을 수정할 수 있습니다.</p>
            </div>
            <el-button type="primary" @click="prepareMemberRegistration">회원 등록 준비</el-button>
          </div>

          <p v-else-if="!selectedConsultation.isSample && !selectedConsultation.isConvertedToMember && selectedConsultation.status !== '상담 완료'" class="consultation-registration-hint">
            상담 상태를 ‘상담 완료’로 변경하면 회원 등록 준비 버튼이 표시됩니다.
          </p>

          <p v-if="registrationError" class="consultation-registration-error" role="alert">{{ registrationError }}</p>
          <el-button v-if="duplicateMemberId" text type="warning" @click="openExistingMember(duplicateMemberId)">기존 회원 확인</el-button>
        </div>

        <div v-else class="consultation-detail-empty">
          <strong>선택할 상담 문의가 없습니다.</strong>
          <p>공개 상담 신청이 들어오면 상세 내용이 이곳에 표시됩니다.</p>
        </div>
      </el-card>
    </section>

    <MemberFormDialog
      v-if="canRegisterMembers && memberDraft"
      v-model="memberDialogOpen"
      :member="memberDraft"
      :registration-mode="true"
      :saving="isConvertingMember"
      :error-message="registrationError"
      :trainers="store.trainers"
      :statuses="store.memberStatuses"
      @save="saveConvertedMember"
    />
  </div>
</template>

<style scoped>
.consultation-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.consultation-summary-card {
  min-width: 0;
  min-height: 136px;
  padding: 20px;
  border: 1px solid var(--pt-border);
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 5px 20px rgb(23 32 51 / 4%);
}

.consultation-summary-card__top,
.consultation-summary-card__value {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.consultation-summary-card__top > span {
  color: #8b96a8;
  font-size: 0.78rem;
  font-weight: 700;
}

.consultation-summary-card__top > strong {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 850;
}

.consultation-summary-card--blue .consultation-summary-card__top > strong {
  color: #2563eb;
  background: #edf3ff;
}

.consultation-summary-card--orange .consultation-summary-card__top > strong {
  color: #b45309;
  background: #fffbeb;
}

.consultation-summary-card--purple .consultation-summary-card__top > strong {
  color: #7c3aed;
  background: #f5f3ff;
}

.consultation-summary-card--green .consultation-summary-card__top > strong {
  color: #047857;
  background: #ecfdf5;
}

.consultation-summary-card__value {
  justify-content: flex-start;
  align-items: baseline;
  gap: 3px;
  margin-top: 15px;
}

.consultation-summary-card__value b {
  color: var(--pt-ink);
  font-size: 1.9rem;
  font-weight: 850;
  letter-spacing: -0.07em;
}

.consultation-summary-card__value small {
  color: #8b96a8;
  font-size: 0.8rem;
  font-weight: 700;
}

.consultation-summary-card p {
  min-height: 17px;
  margin: 7px 0 0;
  color: #a1abba;
  font-size: 0.72rem;
}

.consultation-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 18px;
}

.consultation-card {
  min-width: 0;
  height: 100%;
}

.consultation-card :deep(.el-card__body) {
  min-width: 0;
  padding: 21px;
}

.consultation-list {
  display: grid;
}

.consultation-list-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: start;
  gap: 13px;
  min-width: 0;
  width: 100%;
  padding: 15px 0;
  border-top: 0;
  border-bottom: 1px solid #edf0f4;
  color: inherit;
  font: inherit;
  text-align: left;
  background: #fff;
  cursor: pointer;
  transition: background-color 160ms ease;
}

.consultation-list-item:hover,
.consultation-list-item:focus-visible,
.consultation-list-item.is-selected {
  background: #f8faff;
}

.consultation-list-item:focus-visible {
  outline: 2px solid #9bb8ff;
  outline-offset: -2px;
}

.consultation-list-item:first-child {
  padding-top: 0;
}

.consultation-list-item:last-child {
  border-bottom: 0;
}

.consultation-list-item__avatar {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  color: #1d4ed8;
  background: #dbeafe;
  font-size: 0.86rem;
  font-weight: 850;
}

.consultation-list-item__body {
  min-width: 0;
}

.consultation-list-item__title {
  display: flex;
  align-items: baseline;
  gap: 9px;
  min-width: 0;
}

.consultation-list-item__title strong {
  overflow: hidden;
  color: #33445f;
  font-size: 0.84rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consultation-list-item__title span {
  flex: 0 0 auto;
  color: #a0a9b7;
  font-size: 0.68rem;
}

.consultation-list-item__title .consultation-list-item__sample {
  padding: 2px 5px;
  border-radius: 5px;
  color: #64748b;
  background: #f1f5f9;
  font-size: 0.61rem;
  font-weight: 800;
}

.consultation-list-item__body p {
  display: -webkit-box;
  margin: 6px 0;
  overflow: hidden;
  color: #7c8799;
  font-size: 0.76rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.consultation-list-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: #9aa4b4;
  font-size: 0.68rem;
}

.consultation-list-item__tags,
.consultation-detail-card__tags {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
}

.consultation-list-item__tags {
  flex: 0 0 auto;
}

.consultation-empty-state,
.consultation-detail-empty {
  display: grid;
  min-height: 180px;
  place-content: center;
  padding: 24px;
  text-align: center;
}

.consultation-empty-state strong,
.consultation-detail-empty strong {
  color: #526078;
  font-size: 0.86rem;
}

.consultation-empty-state p,
.consultation-detail-empty p {
  margin: 8px 0 0;
  color: #9aa4b4;
  font-size: 0.74rem;
  line-height: 1.6;
}

.consultation-card__notice {
  margin: 18px 0 0;
  padding-top: 14px;
  border-top: 1px solid #edf0f4;
  color: #9aa4b4;
  font-size: 0.7rem;
  line-height: 1.6;
}

.consultation-detail {
  display: grid;
  gap: 20px;
}

.consultation-detail__identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding-bottom: 17px;
  border-bottom: 1px solid #edf0f4;
}

.consultation-detail__identity > div:last-child {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.consultation-detail__identity strong {
  overflow: hidden;
  color: #33445f;
  font-size: 0.84rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consultation-detail__identity span {
  color: #9aa4b4;
  font-size: 0.69rem;
}

.consultation-detail__facts {
  display: grid;
  gap: 13px;
  margin: 0;
}

.consultation-detail__facts div {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.consultation-detail__facts dt {
  color: #9aa4b4;
  font-size: 0.7rem;
}

.consultation-detail__facts dd {
  margin: 0;
  color: #526078;
  font-size: 0.76rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

.consultation-detail__placeholder {
  padding: 14px;
  border-radius: 13px;
  background: #f7f9ff;
}

.consultation-detail__placeholder span {
  color: var(--pt-blue);
  font-size: 0.69rem;
  font-weight: 850;
}

.consultation-detail__placeholder p {
  margin: 6px 0 0;
  color: #7c8799;
  font-size: 0.74rem;
  line-height: 1.6;
}

.consultation-status-control {
  display: grid;
  gap: 8px;
}

.consultation-status-control label {
  color: #526078;
  font-size: 0.74rem;
  font-weight: 800;
}

.consultation-status-control .el-select {
  width: 100%;
}

.consultation-status-control small {
  color: #9aa4b4;
  font-size: 0.68rem;
  line-height: 1.5;
}

.consultation-conversion-card,
.consultation-registration-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px;
  border-radius: 13px;
}

.consultation-conversion-card--success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
}

.consultation-conversion-card span,
.consultation-registration-action strong {
  color: #047857;
  font-size: 0.76rem;
  font-weight: 850;
}

.consultation-conversion-card p,
.consultation-registration-action p {
  margin: 6px 0 0;
  color: #6f7b8f;
  font-size: 0.72rem;
  line-height: 1.6;
}

.consultation-registration-action {
  border: 1px solid #dbeafe;
  background: #f8faff;
}

.consultation-registration-action strong {
  color: var(--pt-blue);
}

.consultation-duplicate-alert :deep(.el-alert__content) {
  min-width: 0;
}

.consultation-duplicate-alert p {
  margin: 2px 0 0;
  color: #7c5b20;
  font-size: 0.74rem;
  line-height: 1.6;
}

.consultation-duplicate-alert__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 8px;
  margin-top: 8px;
}

.consultation-registration-hint,
.consultation-registration-error {
  margin: 0;
  padding: 11px 13px;
  border-radius: 10px;
  color: #8b96a8;
  background: #f8fafc;
  font-size: 0.72rem;
  line-height: 1.6;
}

.consultation-registration-error {
  color: #b42318;
  background: #fff1f0;
}

@media (max-width: 1100px) {
  .consultation-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .consultation-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .consultation-summary-grid {
    grid-template-columns: 1fr;
  }

  .consultation-card :deep(.el-card__body) {
    padding: 17px;
  }

  .consultation-list-item {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .consultation-list-item__tags {
    grid-column: 2;
    justify-self: start;
    justify-content: flex-start;
  }

  .consultation-list-item__title {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .consultation-detail__facts div {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .consultation-conversion-card,
  .consultation-registration-action {
    align-items: stretch;
    flex-direction: column;
  }

  .consultation-conversion-card .el-button,
  .consultation-registration-action .el-button {
    width: 100%;
  }
}
</style>
