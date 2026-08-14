<script setup>
import brandMark from '@/assets/good-habit-pt-mark.png'

const sampleStats = [
  { label: '이번 주 운동 완료율', value: '72', unit: '%', caption: '5개 중 4개 과제 완료', tone: 'blue' },
  { label: '오늘의 운동', value: '3', unit: '개', caption: '강사가 등록한 운동', tone: 'green' },
  { label: '이번 달 출석률', value: '86', unit: '%', caption: '예약 수업 6회 기준', tone: 'orange' },
  { label: '현재 진도', value: '4', unit: '주차', caption: '기초 체력 만들기', tone: 'purple' },
]

const sampleWorkouts = [
  { title: '하체 안정화 루틴', detail: '스쿼트 · 힙 브릿지 · 데드버그', duration: '약 25분', status: '오늘 할 운동' },
  { title: '가벼운 걷기', detail: '편한 속도로 호흡을 확인하며 걷기', duration: '20분', status: '권장' },
]

const sampleRecords = [
  { date: '08.12', title: '등·코어 수업', detail: '자세 교정과 코어 활성화', status: '완료' },
  { date: '08.10', title: '하체 안정화 루틴', detail: '스쿼트 3세트 · 힙 브릿지 3세트', status: '완료' },
  { date: '08.08', title: '상체 가동성 수업', detail: '어깨 가동 범위와 호흡 패턴 확인', status: '완료' },
]
</script>

<template>
  <div class="member-preview-page">
    <header class="member-preview-header">
      <div class="member-preview-container member-preview-header__inner">
        <router-link class="member-preview-brand" to="/" aria-label="좋은 습관 PT 홈으로 이동">
          <img :src="brandMark" alt="좋은 습관 PT 로고" />
          <span>
            <strong>좋은 습관 PT</strong>
            <small>회원 화면 미리보기</small>
          </span>
        </router-link>

        <div class="member-preview-header__actions">
          <span class="member-preview-readonly">공개 샘플 · 읽기 전용</span>
          <router-link class="member-preview-header__link" to="/">메인으로</router-link>
        </div>
      </div>
    </header>

    <main>
      <section class="member-preview-intro">
        <div class="member-preview-container member-preview-intro__inner">
          <div>
            <p class="member-preview-kicker"><span></span> MEMBER WORKSPACE</p>
            <h1>회원은 이렇게<br /><em>관리받습니다.</em></h1>
            <p class="member-preview-intro__lead">
              오늘 할 운동부터 나의 변화, 강사의 피드백까지<br />
              한 화면에서 확인하는 회원용 관리 공간입니다.
            </p>
          </div>

          <div class="member-preview-profile">
            <span>샘플 회원</span>
            <strong>샘플 회원 A</strong>
            <p>목표 · 체력과 자세 개선</p>
            <small>실제 개인정보가 아닌 예시 화면입니다.</small>
          </div>
        </div>
      </section>

      <section class="member-preview-container member-preview-content">
        <div class="member-preview-stats">
          <article v-for="stat in sampleStats" :key="stat.label" class="member-preview-stat" :class="`member-preview-stat--${stat.tone}`">
            <div class="member-preview-stat__icon" aria-hidden="true">
              <span v-if="stat.tone === 'blue'">✓</span>
              <span v-else-if="stat.tone === 'green'">◷</span>
              <span v-else-if="stat.tone === 'orange'">◎</span>
              <span v-else>↗</span>
            </div>
            <div>
              <span class="member-preview-stat__label">{{ stat.label }}</span>
              <strong class="member-preview-stat__value">{{ stat.value }}<small>{{ stat.unit }}</small></strong>
              <em>{{ stat.caption }}</em>
            </div>
          </article>
        </div>

        <div class="member-preview-grid member-preview-grid--primary">
          <el-card class="panel-card member-preview-card" shadow="never">
            <div class="member-preview-card__heading">
              <div>
                <p class="member-preview-eyebrow">TODAY'S WORKOUT</p>
                <h2>오늘의 운동</h2>
              </div>
              <el-tag type="primary" effect="light" round>샘플</el-tag>
            </div>

            <div class="member-preview-workout-list">
              <div v-for="workout in sampleWorkouts" :key="workout.title" class="member-preview-workout">
                <span class="member-preview-workout__icon" aria-hidden="true">✓</span>
                <div>
                  <strong>{{ workout.title }}</strong>
                  <p>{{ workout.detail }}</p>
                  <small>{{ workout.duration }}</small>
                </div>
                <el-tag type="success" size="small" effect="light">{{ workout.status }}</el-tag>
              </div>
            </div>
            <p class="member-preview-card__hint">강사가 등록한 오늘의 과제를 확인하고, 운동 후 기록을 남깁니다.</p>
          </el-card>

          <el-card class="panel-card member-preview-card" shadow="never">
            <div class="member-preview-card__heading">
              <div>
                <p class="member-preview-eyebrow">COACHING NOTE</p>
                <h2>트레이너 피드백</h2>
              </div>
              <span class="member-preview-note-mark" aria-hidden="true">✦</span>
            </div>

            <div class="member-preview-feedback">
              <div class="member-preview-feedback__meta"><el-tag type="primary" size="small" effect="light">강사 작성</el-tag><span>08.13</span></div>
              <h3>허리가 편해지는 움직임을 찾아가고 있어요</h3>
              <p>어제보다 스쿼트 깊이가 안정적이었습니다. 오늘은 발바닥 전체로 바닥을 눌러 보면서 천천히 진행해 주세요.</p>
            </div>
            <p class="member-preview-card__hint">수업 후 남겨진 코칭 메모와 다음 운동 방향을 확인합니다.</p>
          </el-card>
        </div>

        <div class="member-preview-grid member-preview-grid--secondary">
          <el-card class="panel-card member-preview-card" shadow="never">
            <div class="member-preview-card__heading">
              <div>
                <p class="member-preview-eyebrow">ATTENDANCE & PROGRESS</p>
                <h2>출석과 진도</h2>
              </div>
              <el-tag type="success" effect="plain">꾸준히 진행 중</el-tag>
            </div>

            <div class="member-preview-progress">
              <div class="member-preview-progress__label"><span>이번 목표 달성률</span><strong>72%</strong></div>
              <el-progress :percentage="72" :stroke-width="10" :show-text="false" color="#2563eb" />
              <div class="member-preview-progress__meta"><span>시작</span><span>기초 체력 만들기 · 4주차</span><span>8주</span></div>
            </div>

            <div class="member-preview-attendance">
              <div><strong>6회</strong><span>이번 달 출석</span></div>
              <div><strong>86%</strong><span>출석률</span></div>
              <div><strong>2회</strong><span>남은 수업</span></div>
            </div>
          </el-card>

          <el-card class="panel-card member-preview-card" shadow="never">
            <div class="member-preview-card__heading">
              <div>
                <p class="member-preview-eyebrow">RECENT RECORD</p>
                <h2>최근 운동 기록</h2>
              </div>
              <span class="member-preview-static-label">최근 3회</span>
            </div>

            <div class="member-preview-record-list">
              <div v-for="record in sampleRecords" :key="record.date" class="member-preview-record">
                <strong>{{ record.date }}</strong>
                <div><b>{{ record.title }}</b><span>{{ record.detail }}</span></div>
                <el-tag type="success" size="small" effect="light">{{ record.status }}</el-tag>
              </div>
            </div>
          </el-card>
        </div>

        <section class="member-preview-notice">
          <div>
            <p class="member-preview-kicker"><span></span> PREVIEW ONLY</p>
            <h2>운동을 기록하면,<br /><em>다음 관리가 달라집니다.</em></h2>
            <p>이 화면은 서비스 흐름을 보여주기 위한 공개 샘플입니다. 실제 회원 정보와 저장 기능은 포함하지 않습니다.</p>
          </div>
          <div class="member-preview-notice__actions">
            <router-link class="member-preview-primary-button" to="/pt/consultation">신규 회원 상담 신청 <span>→</span></router-link>
            <router-link class="member-preview-secondary-button" to="/">메인으로 돌아가기</router-link>
          </div>
        </section>
      </section>
    </main>

    <footer class="member-preview-footer">
      <div class="member-preview-container member-preview-footer__inner">
        <span>좋은 습관 PT · 회원 화면 미리보기</span>
        <span>샘플 데이터로 구성된 읽기 전용 화면</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.member-preview-page {
  --preview-ink: var(--pt-ink, #172033);
  --preview-muted: var(--pt-muted, #6f7b8f);
  --preview-line: var(--pt-border, #e7e8ec);
  --preview-primary: var(--pt-blue, #2563eb);
  --preview-primary-soft: var(--pt-blue-soft, #eef3ff);
  --preview-green: var(--pt-green, #0f766e);
  min-width: 0;
  min-height: 100vh;
  color: var(--preview-ink);
  background: var(--pt-bg, #f7f7f5);
}

.member-preview-container { width: min(1080px, calc(100% - 48px)); margin: 0 auto; }

.member-preview-header { border-bottom: 1px solid var(--preview-line); background: rgb(247 247 245 / 94%); }
.member-preview-header__inner { display: flex; min-height: 76px; align-items: center; justify-content: space-between; gap: 20px; }
.member-preview-brand { display: inline-flex; min-width: 0; align-items: center; gap: 10px; color: var(--preview-ink); text-decoration: none; }
.member-preview-brand img { width: 36px; height: 36px; border-radius: 11px; object-fit: cover; }
.member-preview-brand span { display: grid; min-width: 0; gap: 2px; }
.member-preview-brand strong { font-size: 0.93rem; font-weight: 850; letter-spacing: -0.05em; }
.member-preview-brand small { color: #9aa4b5; font-size: 0.63rem; }
.member-preview-header__actions { display: flex; flex-shrink: 0; align-items: center; gap: 16px; }
.member-preview-readonly { color: #7f8ba0; font-size: 0.68rem; font-weight: 750; }
.member-preview-header__link { color: var(--preview-primary); font-size: 0.73rem; font-weight: 850; text-decoration: none; }
.member-preview-header__link:hover { text-decoration: underline; }

.member-preview-intro { background: linear-gradient(120deg, #f7f7f5 10%, #eef3ff 100%); }
.member-preview-intro__inner { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 0.55fr); align-items: center; gap: 60px; padding-top: 60px; padding-bottom: 60px; }
.member-preview-kicker { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; color: var(--preview-primary); font-size: 0.65rem; font-weight: 850; letter-spacing: 0.15em; }
.member-preview-kicker span { display: inline-block; width: 21px; height: 2px; background: #dc7c45; }
.member-preview-intro h1 { margin: 0; color: var(--preview-ink); font-size: clamp(2.4rem, 5vw, 4.25rem); font-weight: 900; letter-spacing: -0.1em; line-height: 1.08; }
.member-preview-intro h1 em, .member-preview-notice h2 em { color: var(--preview-primary); font-style: normal; }
.member-preview-intro__lead { margin: 24px 0 0; color: var(--preview-muted); font-size: 0.95rem; line-height: 1.85; }
.member-preview-profile { padding: 24px; border: 1px solid rgb(37 99 235 / 12%); border-radius: 17px; background: rgb(255 255 255 / 82%); box-shadow: 0 5px 20px rgb(23 32 51 / 4%); }
.member-preview-profile > span { color: var(--preview-primary); font-size: 0.67rem; font-weight: 850; letter-spacing: 0.12em; }
.member-preview-profile strong { display: block; margin-top: 18px; color: var(--preview-ink); font-size: 1.35rem; letter-spacing: -0.06em; }
.member-preview-profile p { margin: 8px 0 0; color: #526078; font-size: 0.78rem; }
.member-preview-profile small { display: block; margin-top: 26px; color: #9aa4b5; font-size: 0.67rem; line-height: 1.5; }

.member-preview-content { padding-top: 34px; padding-bottom: 72px; }
.member-preview-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.member-preview-stat { display: grid; grid-template-columns: 40px minmax(0, 1fr); align-items: center; gap: 13px; min-width: 0; min-height: 126px; padding: 18px; border: 1px solid var(--preview-line); border-radius: 17px; background: #fff; box-shadow: 0 5px 20px rgb(23 32 51 / 4%); }
.member-preview-stat__icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; font-size: 1rem; font-weight: 850; }
.member-preview-stat--blue .member-preview-stat__icon { color: #2563eb; background: #edf3ff; }
.member-preview-stat--green .member-preview-stat__icon { color: #047857; background: #ecfdf5; }
.member-preview-stat--orange .member-preview-stat__icon { color: #b45309; background: #fffbeb; }
.member-preview-stat--purple .member-preview-stat__icon { color: #7c3aed; background: #f5f3ff; }
.member-preview-stat > div:last-child { display: grid; min-width: 0; gap: 5px; }
.member-preview-stat__label { color: #7c8799; font-size: 0.74rem; font-weight: 750; line-height: 1.45; }
.member-preview-stat__value { display: flex; align-items: baseline; gap: 3px; min-width: 0; color: var(--preview-ink); font-size: 1.8rem; font-weight: 850; letter-spacing: -0.07em; line-height: 1.1; white-space: nowrap; }
.member-preview-stat__value small { color: #8b96a8; font-size: 0.76rem; font-weight: 750; letter-spacing: 0; }
.member-preview-stat em { color: #9aa4b4; font-size: 0.68rem; font-style: normal; line-height: 1.45; }

.member-preview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 18px; }
.member-preview-card { min-width: 0; height: 100%; }
.member-preview-card :deep(.el-card__body) { min-width: 0; padding: 21px; }
.member-preview-card__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; min-width: 0; margin-bottom: 18px; }
.member-preview-card__heading > * { min-width: 0; }
.member-preview-eyebrow { margin: 0 0 7px; color: var(--preview-primary); font-size: 0.66rem; font-weight: 850; letter-spacing: 0.14em; }
.member-preview-card h2 { margin: 0; color: var(--preview-ink); font-size: 1.1rem; font-weight: 850; letter-spacing: -0.065em; }
.member-preview-note-mark { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 10px; color: #7c3aed; background: #f5f3ff; font-size: 0.9rem; }
.member-preview-static-label { color: #8b96a8; font-size: 0.7rem; font-weight: 750; white-space: nowrap; }

.member-preview-workout-list, .member-preview-record-list { display: grid; gap: 10px; }
.member-preview-workout { display: grid; grid-template-columns: 35px minmax(0, 1fr) auto; align-items: center; gap: 12px; min-width: 0; padding: 13px; border: 1px solid #e9edf4; border-radius: 13px; }
.member-preview-workout__icon { display: grid; width: 35px; height: 35px; place-items: center; border-radius: 11px; color: var(--preview-primary); background: var(--preview-primary-soft); font-size: 0.82rem; font-weight: 850; }
.member-preview-workout > div { min-width: 0; }
.member-preview-workout strong { color: #33445f; font-size: 0.82rem; }
.member-preview-workout p { margin: 4px 0; overflow: hidden; color: #7c8799; font-size: 0.72rem; text-overflow: ellipsis; white-space: nowrap; }
.member-preview-workout small { color: #a0a9b7; font-size: 0.68rem; }
.member-preview-card__hint { margin: 15px 0 0; color: #8b96a8; font-size: 0.72rem; line-height: 1.65; }

.member-preview-feedback { padding: 16px; border-radius: 13px; background: #f4f7ff; }
.member-preview-feedback__meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #8b96a8; font-size: 0.7rem; }
.member-preview-feedback h3 { margin: 14px 0 8px; color: #2d4162; font-size: 0.9rem; line-height: 1.45; }
.member-preview-feedback p { margin: 0; color: #526078; font-size: 0.79rem; line-height: 1.75; }

.member-preview-progress { padding: 3px 0 0; }
.member-preview-progress__label, .member-preview-progress__meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.member-preview-progress__label { color: #526078; font-size: 0.78rem; }
.member-preview-progress__label strong { color: var(--preview-primary); font-size: 1.2rem; }
.member-preview-progress :deep(.el-progress) { margin-top: 13px; }
.member-preview-progress__meta { margin-top: 9px; color: #9aa4b4; font-size: 0.67rem; }
.member-preview-progress__meta span:nth-child(2) { color: #6f7b8f; font-weight: 750; }
.member-preview-attendance { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 28px; padding-top: 18px; border-top: 1px solid #edf0f4; }
.member-preview-attendance div { display: grid; gap: 5px; }
.member-preview-attendance strong { color: var(--preview-ink); font-size: 1.15rem; letter-spacing: -0.06em; }
.member-preview-attendance span { color: #8b96a8; font-size: 0.69rem; }

.member-preview-record { display: grid; grid-template-columns: 43px minmax(0, 1fr) auto; align-items: center; gap: 12px; min-width: 0; padding: 12px 0; border-bottom: 1px solid #edf0f4; }
.member-preview-record:first-child { padding-top: 0; }
.member-preview-record:last-child { padding-bottom: 0; border-bottom: 0; }
.member-preview-record > strong { color: #8b96a8; font-size: 0.72rem; }
.member-preview-record > div { display: grid; min-width: 0; gap: 4px; }
.member-preview-record b { overflow: hidden; color: #33445f; font-size: 0.78rem; text-overflow: ellipsis; white-space: nowrap; }
.member-preview-record span { overflow: hidden; color: #8b96a8; font-size: 0.69rem; text-overflow: ellipsis; white-space: nowrap; }

.member-preview-notice { display: flex; align-items: center; justify-content: space-between; gap: 32px; margin-top: 18px; padding: 31px; border-radius: 17px; color: #fff; background: var(--preview-ink); }
.member-preview-notice .member-preview-kicker { color: #a9c4ff; }
.member-preview-notice h2 { margin: 0; color: #fff; font-size: clamp(1.6rem, 3vw, 2.35rem); font-weight: 900; letter-spacing: -0.09em; line-height: 1.2; }
.member-preview-notice h2 em { color: #b9d1ff; }
.member-preview-notice > div:first-child > p:last-child { max-width: 520px; margin: 16px 0 0; color: #b5c0d2; font-size: 0.78rem; line-height: 1.7; }
.member-preview-notice__actions { display: flex; flex-shrink: 0; flex-wrap: wrap; gap: 9px; }
.member-preview-primary-button, .member-preview-secondary-button { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: 9px; padding: 0 16px; border-radius: 10px; font-size: 0.74rem; font-weight: 850; text-decoration: none; }
.member-preview-primary-button { color: var(--preview-ink); background: #e9f7ed; }
.member-preview-secondary-button { color: #e7edfb; border: 1px solid rgb(255 255 255 / 22%); background: rgb(255 255 255 / 7%); }
.member-preview-primary-button:hover, .member-preview-secondary-button:hover { transform: translateY(-1px); }

.member-preview-footer { border-top: 1px solid var(--preview-line); background: var(--pt-bg, #f7f7f5); }
.member-preview-footer__inner { display: flex; min-height: 72px; align-items: center; justify-content: space-between; gap: 18px; color: #8b96a8; font-size: 0.68rem; }

@media (max-width: 980px) {
  .member-preview-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .member-preview-intro__inner { gap: 40px; }
}

@media (max-width: 780px) {
  .member-preview-intro__inner { grid-template-columns: 1fr; gap: 28px; padding-top: 50px; padding-bottom: 50px; }
  .member-preview-profile { max-width: 420px; }
  .member-preview-notice { align-items: flex-start; flex-direction: column; }
  .member-preview-notice__actions { width: 100%; }
  .member-preview-primary-button, .member-preview-secondary-button { flex: 1 1 160px; }
}

@media (max-width: 680px) {
  .member-preview-container { width: min(100% - 32px, 540px); }
  .member-preview-header__inner { min-height: 68px; }
  .member-preview-brand img { width: 32px; height: 32px; }
  .member-preview-brand strong { font-size: 0.8rem; }
  .member-preview-brand small { font-size: 0.56rem; }
  .member-preview-header__actions { gap: 10px; }
  .member-preview-readonly { display: none; }
  .member-preview-header__link { font-size: 0.65rem; }
  .member-preview-intro h1 { font-size: clamp(2.6rem, 12vw, 4rem); }
  .member-preview-intro__lead { font-size: 0.86rem; }
  .member-preview-content { padding-top: 26px; padding-bottom: 52px; }
  .member-preview-grid { grid-template-columns: 1fr; }
  .member-preview-card :deep(.el-card__body) { padding: 18px; }
  .member-preview-notice { padding: 24px 20px; }
  .member-preview-footer__inner { align-items: flex-start; flex-direction: column; justify-content: center; min-height: 84px; gap: 6px; }
}

@media (max-width: 520px) {
  .member-preview-stats { grid-template-columns: 1fr; }
  .member-preview-stat { min-height: 112px; }
  .member-preview-workout { grid-template-columns: 35px minmax(0, 1fr); align-items: start; }
  .member-preview-workout .el-tag { grid-column: 2; justify-self: start; }
  .member-preview-record { grid-template-columns: 43px minmax(0, 1fr); align-items: start; }
  .member-preview-record .el-tag { grid-column: 2; justify-self: start; }
  .member-preview-progress__meta { align-items: flex-start; flex-direction: column; gap: 4px; }
  .member-preview-attendance { gap: 4px; }
  .member-preview-notice__actions { align-items: stretch; flex-direction: column; }
  .member-preview-primary-button, .member-preview-secondary-button { flex: 0 0 auto; width: 100%; }
}

@media (max-width: 380px) {
  .member-preview-header__inner { gap: 10px; }
  .member-preview-brand small { display: none; }
  .member-preview-header__link { font-size: 0.6rem; }
  .member-preview-intro h1 { font-size: 2.55rem; }
  .member-preview-card__heading { gap: 8px; }
  .member-preview-card h2 { font-size: 1rem; }
}
</style>
