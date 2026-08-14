<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const consultationSummary = [
  { label: '전체 문의', value: '3', caption: '현재 확인할 샘플 문의', tone: 'blue', symbol: '◎' },
  { label: '신규 문의', value: '1', caption: '확인이 필요한 문의', tone: 'orange', symbol: '!' },
  { label: '상담 예정', value: '1', caption: '상담 일정 조율 중', tone: 'purple', symbol: '◷' },
  { label: '상담 완료', value: '1', caption: '상담 기록이 남은 문의', tone: 'green', symbol: '✓' },
]

const consultationRequests = [
  {
    id: 'sample-001',
    name: '샘플 문의 A',
    createdAt: '오늘 10:20',
    goal: '체력 향상',
    summary: '운동을 꾸준히 이어가고 싶어 1:1 PT 관리 방식을 문의했습니다.',
    status: '신규 문의',
    statusType: 'warning',
    source: '공개 상담 폼',
  },
  {
    id: 'sample-002',
    name: '샘플 문의 B',
    createdAt: '어제 16:40',
    goal: '자세 교정',
    summary: '오래 앉아 있는 생활 습관을 바꾸고 맞춤 운동을 상담받고 싶습니다.',
    status: '상담 예정',
    statusType: 'primary',
    source: '공개 상담 폼',
  },
  {
    id: 'sample-003',
    name: '샘플 문의 C',
    createdAt: '08.12 09:10',
    goal: '운동 습관 만들기',
    summary: '기록을 기반으로 매주 운동 방향을 점검하는 관리에 관심이 있습니다.',
    status: '상담 완료',
    statusType: 'success',
    source: '공개 상담 폼',
  },
]

const featuredConsultation = consultationRequests[0]
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
        <el-tag type="info" effect="plain" round>샘플 데이터 · 저장 없음</el-tag>
      </div>
    </section>

    <section class="consultation-summary-grid" aria-label="상담 문의 상태 요약">
      <article v-for="summary in consultationSummary" :key="summary.label" class="consultation-summary-card" :class="`consultation-summary-card--${summary.tone}`">
        <div class="consultation-summary-card__top">
          <span>{{ summary.label }}</span>
          <strong>{{ summary.symbol }}</strong>
        </div>
        <div class="consultation-summary-card__value"><b>{{ summary.value }}</b><small>건</small></div>
        <p>{{ summary.caption }}</p>
      </article>
    </section>

    <section class="consultation-layout">
      <el-card class="panel-card consultation-card" shadow="never">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">INQUIRY LIST</p>
            <h2>상담 문의 목록</h2>
          </div>
          <el-tag type="info" effect="plain">3건</el-tag>
        </div>

        <div class="consultation-list">
          <article v-for="request in consultationRequests" :key="request.id" class="consultation-list-item">
            <div class="consultation-list-item__avatar" aria-hidden="true">{{ request.name.slice(0, 1) }}</div>
            <div class="consultation-list-item__body">
              <div class="consultation-list-item__title"><strong>{{ request.name }}</strong><span>{{ request.createdAt }}</span></div>
              <p>{{ request.summary }}</p>
              <div class="consultation-list-item__meta"><span>관심 목표 · {{ request.goal }}</span><span>{{ request.source }}</span></div>
            </div>
            <el-tag :type="request.statusType" effect="light" round>{{ request.status }}</el-tag>
          </article>
        </div>

        <p class="consultation-card__notice">현재 목록은 화면 구조 확인을 위한 샘플 문의입니다. 실제 상담 신청과 연결되지 않습니다.</p>
      </el-card>

      <el-card class="panel-card consultation-card consultation-detail-card" shadow="never">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">INQUIRY PREVIEW</p>
            <h2>상담 상세 미리보기</h2>
          </div>
          <el-tag :type="featuredConsultation.statusType" effect="light" round>{{ featuredConsultation.status }}</el-tag>
        </div>

        <div class="consultation-detail">
          <div class="consultation-detail__identity">
            <div class="consultation-list-item__avatar" aria-hidden="true">{{ featuredConsultation.name.slice(0, 1) }}</div>
            <div>
              <strong>{{ featuredConsultation.name }}님의 상담 문의</strong>
              <span>{{ featuredConsultation.createdAt }} · {{ featuredConsultation.source }}</span>
            </div>
          </div>

          <dl class="consultation-detail__facts">
            <div><dt>관심 목표</dt><dd>{{ featuredConsultation.goal }}</dd></div>
            <div><dt>문의 내용</dt><dd>{{ featuredConsultation.summary }}</dd></div>
          </dl>

          <div class="consultation-detail__placeholder">
            <span>다음 단계</span>
            <p>상담 일정, 연락 기록, 상태 변경 영역이 추후 이 자리에 추가됩니다.</p>
          </div>
          <el-button class="consultation-detail__button" type="primary" disabled>상태 변경 · 추후 구현</el-button>
        </div>
      </el-card>
    </section>
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
  padding: 15px 0;
  border-bottom: 1px solid #edf0f4;
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

.consultation-list-item > .el-tag {
  flex: 0 0 auto;
  white-space: nowrap;
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

.consultation-detail__button {
  width: 100%;
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

  .consultation-list-item > .el-tag {
    grid-column: 2;
    justify-self: start;
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
}
</style>
