<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { consultationRepository, getConsultationErrorMessage } from '@/services/consultationRepository'

import brandMark from '@/assets/good-habit-pt-mark.png'

const inquiry = ref({
  name: '',
  contact: '',
  goal: '',
  privacyConsent: false,
})
const submitted = ref(false)
const submitError = ref('')
const isSubmitting = ref(false)
const auth = useAuthStore()
const canViewConsultationManagement = computed(() => Boolean(auth.user) && auth.isInstructor)
const isRemoteMode = computed(() => consultationRepository.isRemote)
const storageLabel = computed(() => (isRemoteMode.value ? '서버 저장' : '브라우저 데모 저장'))

async function handleSubmit() {
  const normalizedInquiry = {
    name: inquiry.value.name.trim(),
    contact: inquiry.value.contact.trim(),
    goal: inquiry.value.goal.trim(),
    privacyConsent: inquiry.value.privacyConsent === true,
  }

  if (!normalizedInquiry.name || !normalizedInquiry.contact || !normalizedInquiry.goal) {
    submitError.value = '이름, 연락처, 운동 목표를 모두 입력해 주세요.'
    return
  }

  if (!normalizedInquiry.privacyConsent) {
    submitError.value = '개인정보 수집·이용 안내를 확인하고 동의해 주세요.'
    return
  }

  isSubmitting.value = true
  try {
    const savedConsultation = await consultationRepository.create(normalizedInquiry)
    if (!savedConsultation) {
      submitError.value = isRemoteMode.value
        ? '상담 신청을 서버에 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
        : '이 브라우저에 상담 정보를 저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.'
      return
    }

    inquiry.value = normalizedInquiry
    submitError.value = ''
    submitted.value = true
  } catch (error) {
    submitError.value = getConsultationErrorMessage(error, '상담 신청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  } finally {
    isSubmitting.value = false
  }
}

function editInquiry() {
  submitted.value = false
  submitError.value = ''
}
</script>

<template>
  <div class="public-consultation-page">
    <header class="public-consultation-header">
      <div class="public-consultation-container public-consultation-header__inner">
        <router-link class="public-consultation-brand" to="/" aria-label="좋은 습관 PT 홈으로 이동">
          <img :src="brandMark" alt="좋은 습관 PT 로고" />
          <span>
            <strong>좋은 습관 PT</strong>
            <small>신규 회원 상담</small>
          </span>
        </router-link>

        <router-link class="public-consultation-header__link" to="/">메인으로 돌아가기</router-link>
      </div>
    </header>

    <main class="public-consultation-container public-consultation-main">
      <section class="public-consultation-intro">
        <div>
          <p class="public-consultation-kicker"><span></span> NEW MEMBER CONSULTATION</p>
          <h1>꾸준히 운동하는 방법,<br /><em>상담부터 시작해 보세요.</em></h1>
          <p class="public-consultation-intro__lead">
            현재 운동 목표와 고민을 간단히 남겨주시면<br />
            어떤 방식으로 관리가 시작되는지 함께 정리해 드립니다.
          </p>
        </div>

        <div class="public-consultation-guide">
          <span>상담 신청 기본 틀</span>
          <strong>목표를 알고,<br />맞는 루틴을 찾습니다.</strong>
          <p v-if="isRemoteMode">상담 정보는 안전한 서버 저장 구조로 전달되며, 강사 전용 화면에서만 확인합니다.</p>
          <p v-else>현재 개발 데모입니다. 입력 내용은 이 브라우저에서만 확인할 수 있습니다.</p>
        </div>
      </section>

      <section class="public-consultation-form-card" aria-labelledby="consultation-form-title">
        <div v-if="!submitted">
          <div class="public-consultation-card-heading">
            <div>
              <p class="public-consultation-eyebrow">START WITH YOUR GOAL</p>
              <h2 id="consultation-form-title">신규 회원 상담 신청</h2>
            </div>
            <span class="public-consultation-readonly">{{ storageLabel }}</span>
          </div>

          <p class="public-consultation-form-description">기본 정보만 남겨주시면 상담 방향을 정리하는 데 도움이 됩니다.</p>
          <p v-if="submitError" class="public-consultation-form-error" role="alert">{{ submitError }}</p>

          <form class="public-consultation-form" novalidate @submit.prevent="handleSubmit">
            <label for="consultation-name">
              <span>이름</span>
              <input id="consultation-name" v-model="inquiry.name" type="text" name="name" autocomplete="name" maxlength="50" placeholder="이름을 입력해 주세요" required />
            </label>

            <label for="consultation-contact">
              <span>연락처</span>
              <input id="consultation-contact" v-model="inquiry.contact" type="tel" name="contact" autocomplete="tel" maxlength="100" placeholder="연락 가능한 수단을 입력해 주세요" required />
            </label>

            <label class="public-consultation-form__full" for="consultation-goal">
              <span>운동 목표</span>
              <textarea id="consultation-goal" v-model="inquiry.goal" name="goal" rows="5" maxlength="500" placeholder="예: 체력 향상, 자세 교정, 꾸준한 운동 습관 만들기" required></textarea>
            </label>

            <label class="public-consultation-consent public-consultation-form__full">
              <input v-model="inquiry.privacyConsent" type="checkbox" name="privacy-consent" required />
              <span><router-link to="/privacy" target="_blank" rel="noopener">개인정보 수집·이용 안내</router-link>를 확인했으며 상담을 위해 입력 정보를 제공하는 데 동의합니다.</span>
            </label>

            <div class="public-consultation-form__footer">
              <p v-if="isRemoteMode">상담 정보는 강사 상담 관리 목적에만 사용됩니다.</p>
              <p v-else>개발 데모 · 상담 정보는 이 브라우저에만 저장됩니다.</p>
              <button type="submit" :disabled="isSubmitting">{{ isSubmitting ? '저장 중…' : '상담 신청하기' }} <span>→</span></button>
            </div>
          </form>
        </div>

        <div v-else class="public-consultation-complete" role="status" aria-live="polite">
          <span class="public-consultation-complete__mark" aria-hidden="true">✓</span>
          <p class="public-consultation-eyebrow">{{ isRemoteMode ? 'REQUEST RECEIVED' : 'DEMO SAVED' }}</p>
          <h2>{{ isRemoteMode ? '상담 신청이 접수되었습니다.' : '상담 신청이 저장되었습니다.' }}</h2>
          <p v-if="isRemoteMode">상담 신청이 서버에 접수되었습니다. 강사 전용 상담 관리 화면에서 확인할 수 있습니다.</p>
          <p v-else>현재 개발 데모 버전입니다. 상담 정보는 이 브라우저의 localStorage에만 저장되며 외부로 전송되지 않습니다.</p>
          <div class="public-consultation-complete__actions">
            <button type="button" class="public-consultation-secondary-button" @click="editInquiry">내용 다시 보기</button>
            <router-link v-if="canViewConsultationManagement" class="public-consultation-primary-button" to="/pt/consultations">강사 상담 관리 화면 보기</router-link>
            <router-link class="public-consultation-secondary-button" to="/">메인으로 돌아가기</router-link>
          </div>
        </div>
      </section>

      <p class="public-consultation-login-note">회원 화면과 강사 화면은 상담 신청과 분리된 기존 관리 화면입니다.</p>
    </main>

    <footer class="public-consultation-footer">
      <div class="public-consultation-container public-consultation-footer__inner">
        <span>좋은 습관 PT · 신규 회원 상담</span>
        <router-link to="/pt/member/preview">회원 화면 미리보기 보기 →</router-link>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.public-consultation-page {
  --consultation-ink: var(--pt-ink, #172033);
  --consultation-muted: var(--pt-muted, #6f7b8f);
  --consultation-line: var(--pt-border, #e7e8ec);
  --consultation-primary: var(--pt-blue, #2563eb);
  --consultation-primary-soft: var(--pt-blue-soft, #eef3ff);
  min-width: 0;
  min-height: 100vh;
  color: var(--consultation-ink);
  background: var(--pt-bg, #f7f7f5);
}

.public-consultation-container { width: min(1080px, calc(100% - 48px)); margin: 0 auto; }

.public-consultation-header { border-bottom: 1px solid var(--consultation-line); background: rgb(247 247 245 / 94%); }
.public-consultation-header__inner { display: flex; min-height: 76px; align-items: center; justify-content: space-between; gap: 20px; }
.public-consultation-brand { display: inline-flex; min-width: 0; align-items: center; gap: 10px; color: var(--consultation-ink); text-decoration: none; }
.public-consultation-brand img { width: 36px; height: 36px; border-radius: 11px; object-fit: cover; }
.public-consultation-brand span { display: grid; min-width: 0; gap: 2px; }
.public-consultation-brand strong { font-size: 0.93rem; font-weight: 850; letter-spacing: -0.05em; }
.public-consultation-brand small { color: #9aa4b5; font-size: 0.63rem; }
.public-consultation-header__link { color: var(--consultation-primary); font-size: 0.73rem; font-weight: 850; text-decoration: none; }
.public-consultation-header__link:hover { text-decoration: underline; }

.public-consultation-main { padding-top: 68px; padding-bottom: 72px; }
.public-consultation-intro { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 0.58fr); align-items: center; gap: 64px; }
.public-consultation-kicker { display: flex; align-items: center; gap: 8px; margin: 0 0 17px; color: var(--consultation-primary); font-size: 0.65rem; font-weight: 850; letter-spacing: 0.15em; }
.public-consultation-kicker span { display: inline-block; width: 21px; height: 2px; background: #dc7c45; }
.public-consultation-intro h1 { margin: 0; color: var(--consultation-ink); font-size: clamp(2.45rem, 5vw, 4.35rem); font-weight: 900; letter-spacing: -0.1em; line-height: 1.08; }
.public-consultation-intro h1 em { color: var(--consultation-primary); font-style: normal; }
.public-consultation-intro__lead { margin: 25px 0 0; color: var(--consultation-muted); font-size: 0.95rem; line-height: 1.85; }
.public-consultation-guide { padding: 25px; border: 1px solid rgb(37 99 235 / 12%); border-radius: 17px; background: linear-gradient(145deg, #eef3ff, #fff); box-shadow: 0 5px 20px rgb(23 32 51 / 4%); }
.public-consultation-guide > span { color: var(--consultation-primary); font-size: 0.67rem; font-weight: 850; letter-spacing: 0.12em; }
.public-consultation-guide strong { display: block; margin-top: 20px; color: var(--consultation-ink); font-size: 1.35rem; letter-spacing: -0.07em; line-height: 1.3; }
.public-consultation-guide p { margin: 20px 0 0; color: #8190a6; font-size: 0.71rem; line-height: 1.65; }

.public-consultation-form-card { max-width: 760px; margin: 48px auto 0; padding: 30px; border: 1px solid var(--consultation-line); border-radius: 17px; background: #fff; box-shadow: 0 5px 20px rgb(23 32 51 / 4%); }
.public-consultation-card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
.public-consultation-eyebrow { margin: 0 0 7px; color: var(--consultation-primary); font-size: 0.66rem; font-weight: 850; letter-spacing: 0.14em; }
.public-consultation-card-heading h2, .public-consultation-complete h2 { margin: 0; color: var(--consultation-ink); font-size: 1.45rem; font-weight: 850; letter-spacing: -0.065em; }
.public-consultation-readonly { padding: 7px 9px; border-radius: 8px; color: #67748a; background: var(--consultation-primary-soft); font-size: 0.66rem; font-weight: 800; white-space: nowrap; }
.public-consultation-form-description { margin: 13px 0 0; color: var(--consultation-muted); font-size: 0.8rem; line-height: 1.7; }
.public-consultation-form-error { margin: 12px 0 0; padding: 10px 12px; border-radius: 9px; color: #b42318; background: #fff1f0; font-size: 0.75rem; line-height: 1.55; }
.public-consultation-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 28px; }
.public-consultation-form label { display: grid; min-width: 0; gap: 8px; }
.public-consultation-form label > span { color: #526078; font-size: 0.76rem; font-weight: 800; }
.public-consultation-form input, .public-consultation-form textarea { width: 100%; border: 1px solid #e4e8ef; border-radius: 10px; outline: 0; color: var(--consultation-ink); background: #fbfcff; font-size: 0.8rem; transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease; }
.public-consultation-form input { height: 46px; padding: 0 13px; }
.public-consultation-form textarea { min-height: 120px; padding: 12px 13px; resize: vertical; line-height: 1.65; }
.public-consultation-form input::placeholder, .public-consultation-form textarea::placeholder { color: #aab3c1; }
.public-consultation-form input:focus, .public-consultation-form textarea:focus { border-color: #9bb8ff; background: #fff; box-shadow: 0 0 0 3px rgb(37 99 235 / 10%); }
.public-consultation-form__full { grid-column: 1 / -1; }
.public-consultation-consent { display: flex !important; grid-template-columns: none; align-items: flex-start; gap: 9px !important; }
.public-consultation-consent input { flex: 0 0 auto; width: 17px; height: 17px; margin: 1px 0 0; accent-color: var(--consultation-primary); }
.public-consultation-consent span { color: #7c8799 !important; font-size: 0.71rem !important; font-weight: 500 !important; line-height: 1.6; }
.public-consultation-consent a { color: var(--consultation-primary); font-weight: 800; }
.public-consultation-form__footer { display: flex; grid-column: 1 / -1; align-items: center; justify-content: space-between; gap: 18px; margin-top: 2px; }
.public-consultation-form__footer p { margin: 0; color: #9aa4b4; font-size: 0.69rem; line-height: 1.5; }
.public-consultation-form__footer button, .public-consultation-primary-button, .public-consultation-secondary-button { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; gap: 9px; padding: 0 17px; border-radius: 10px; font-size: 0.76rem; font-weight: 850; text-decoration: none; }
.public-consultation-form__footer button, .public-consultation-primary-button { border: 0; color: #fff; background: var(--consultation-primary); box-shadow: 0 5px 12px rgb(37 99 235 / 12%); cursor: pointer; }
.public-consultation-form__footer button:hover, .public-consultation-primary-button:hover { background: #172033; }
.public-consultation-form__footer button:disabled { cursor: wait; opacity: 0.65; }
.public-consultation-form__footer button span { font-size: 1rem; }

.public-consultation-complete { text-align: center; }
.public-consultation-complete__mark { display: grid; width: 48px; height: 48px; margin: 0 auto 20px; place-items: center; border-radius: 14px; color: #047857; background: #ecfdf5; font-size: 1.35rem; font-weight: 900; }
.public-consultation-complete .public-consultation-eyebrow { margin-bottom: 9px; }
.public-consultation-complete > p:not(.public-consultation-eyebrow) { max-width: 450px; margin: 15px auto 0; color: var(--consultation-muted); font-size: 0.8rem; line-height: 1.75; }
.public-consultation-complete__actions { display: flex; justify-content: center; gap: 9px; margin-top: 28px; }
.public-consultation-secondary-button { border: 1px solid var(--consultation-line); color: #526078; background: #fff; cursor: pointer; }
.public-consultation-secondary-button:hover { border-color: #c3d2f3; background: #f7f9ff; }

.public-consultation-login-note { margin: 20px 0 0; color: #9aa4b4; font-size: 0.7rem; text-align: center; }
.public-consultation-footer { border-top: 1px solid var(--consultation-line); background: var(--pt-bg, #f7f7f5); }
.public-consultation-footer__inner { display: flex; min-height: 76px; align-items: center; justify-content: space-between; gap: 18px; color: #8b96a8; font-size: 0.68rem; }
.public-consultation-footer__inner a { color: var(--consultation-primary); font-weight: 800; text-decoration: none; }
.public-consultation-footer__inner a:hover { text-decoration: underline; }

@media (max-width: 820px) {
  .public-consultation-intro { grid-template-columns: 1fr; gap: 30px; }
  .public-consultation-guide { max-width: 420px; }
}

@media (max-width: 680px) {
  .public-consultation-container { width: min(100% - 32px, 540px); }
  .public-consultation-header__inner { min-height: 68px; }
  .public-consultation-brand img { width: 32px; height: 32px; }
  .public-consultation-brand strong { font-size: 0.8rem; }
  .public-consultation-brand small { font-size: 0.56rem; }
  .public-consultation-header__link { font-size: 0.64rem; }
  .public-consultation-main { padding-top: 48px; padding-bottom: 52px; }
  .public-consultation-intro h1 { font-size: clamp(2.6rem, 12vw, 4rem); }
  .public-consultation-intro__lead { font-size: 0.86rem; }
  .public-consultation-form-card { margin-top: 34px; padding: 22px 18px; }
  .public-consultation-form { grid-template-columns: 1fr; gap: 16px; }
  .public-consultation-form__full, .public-consultation-form__footer { grid-column: auto; }
  .public-consultation-form__footer { align-items: stretch; flex-direction: column; gap: 13px; }
  .public-consultation-form__footer button { width: 100%; }
  .public-consultation-complete__actions { align-items: stretch; flex-direction: column; }
  .public-consultation-complete__actions > * { width: 100%; }
  .public-consultation-footer__inner { align-items: flex-start; flex-direction: column; justify-content: center; min-height: 88px; gap: 7px; }
}

@media (max-width: 380px) {
  .public-consultation-header__inner { gap: 10px; }
  .public-consultation-brand small { display: none; }
  .public-consultation-header__link { font-size: 0.6rem; }
  .public-consultation-intro h1 { font-size: 2.55rem; }
  .public-consultation-card-heading { gap: 10px; }
  .public-consultation-card-heading h2 { font-size: 1.25rem; }
  .public-consultation-complete__actions { align-items: stretch; flex-direction: column; }
}
</style>
