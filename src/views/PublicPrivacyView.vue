<script setup>
import brandMark from '@/assets/good-habit-pt-mark.png'
</script>

<template>
  <div class="public-privacy-page">
    <header class="public-privacy-header">
      <router-link class="public-privacy-brand" to="/" aria-label="좋은 습관 PT 홈으로 이동">
        <img :src="brandMark" alt="좋은 습관 PT 로고" />
        <span><strong>좋은 습관 PT</strong><small>개인정보 수집·이용 안내</small></span>
      </router-link>
      <router-link to="/pt/consultation">상담 신청으로 돌아가기</router-link>
    </header>

    <main class="public-privacy-content">
      <p class="public-privacy-eyebrow">PRIVACY NOTICE TEMPLATE</p>
      <h1>개인정보 수집·이용 안내</h1>
      <p class="public-privacy-lead">상담 신청 화면에서 수집하는 정보와 이용 목적을 안내하는 기본 틀입니다. 실제 운영 전 법률 검토와 담당자·연락처 입력이 필요합니다.</p>

      <section class="public-privacy-card" aria-labelledby="privacy-items-title">
        <h2 id="privacy-items-title">상담 신청 시 확인하는 내용</h2>
        <dl>
          <div><dt>수집 항목</dt><dd>이름, 연락처, 운동 목표</dd></div>
          <div><dt>이용 목적</dt><dd>신규 회원 상담 방향 확인과 상담 연락</dd></div>
          <div><dt>보관 기간</dt><dd>서비스 설정에 따른 보관 기간 동안 보관 후 파기 또는 익명화</dd></div>
          <div><dt>제공 여부</dt><dd>상담 관리를 담당하는 강사 화면에서만 확인하며 제3자 제공은 운영 정책에 따릅니다.</dd></div>
        </dl>
      </section>

      <section class="public-privacy-card" aria-labelledby="privacy-demo-title">
        <h2 id="privacy-demo-title">현재 데모의 한계</h2>
        <p>개발 환경에서는 브라우저 데모 저장을 사용할 수 있습니다. 운영 환경에서는 서버 저장, 접근 권한, 보존·삭제 정책을 적용해야 하며 이 안내문을 실제 개인정보 처리방침으로 사용하면 안 됩니다.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.public-privacy-page { min-height: 100vh; color: #172033; background: #f7f7f5; }
.public-privacy-header { display: flex; width: min(960px, calc(100% - 40px)); min-height: 76px; margin: 0 auto; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid #e7e8ec; }
.public-privacy-header a:last-child { color: #2563eb; font-size: 0.75rem; font-weight: 800; text-decoration: none; }
.public-privacy-brand { display: inline-flex; min-width: 0; align-items: center; gap: 10px; color: inherit; text-decoration: none; }
.public-privacy-brand img { width: 36px; height: 36px; border-radius: 11px; object-fit: cover; }
.public-privacy-brand span { display: grid; gap: 2px; }
.public-privacy-brand strong { font-size: 0.9rem; font-weight: 850; letter-spacing: -0.05em; }
.public-privacy-brand small { color: #9aa4b5; font-size: 0.63rem; }
.public-privacy-content { width: min(760px, calc(100% - 40px)); margin: 0 auto; padding: 68px 0 80px; }
.public-privacy-eyebrow { margin: 0 0 13px; color: #2563eb; font-size: 0.66rem; font-weight: 850; letter-spacing: 0.14em; }
.public-privacy-content h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.2rem); letter-spacing: -0.09em; line-height: 1.12; }
.public-privacy-lead { margin: 19px 0 0; color: #6f7b8f; font-size: 0.84rem; line-height: 1.8; }
.public-privacy-card { margin-top: 28px; padding: 24px; border: 1px solid #e7e8ec; border-radius: 16px; background: #fff; }
.public-privacy-card h2 { margin: 0; font-size: 1rem; letter-spacing: -0.05em; }
.public-privacy-card dl { display: grid; gap: 15px; margin: 22px 0 0; }
.public-privacy-card dl div { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 14px; }
.public-privacy-card dt { color: #9aa4b4; font-size: 0.75rem; }
.public-privacy-card dd, .public-privacy-card p { margin: 0; color: #526078; font-size: 0.78rem; line-height: 1.7; }
@media (max-width: 560px) {
  .public-privacy-header { width: min(100% - 32px, 540px); min-height: 68px; }
  .public-privacy-header a:last-child { font-size: 0.64rem; }
  .public-privacy-brand img { width: 32px; height: 32px; }
  .public-privacy-brand strong { font-size: 0.8rem; }
  .public-privacy-brand small { font-size: 0.56rem; }
  .public-privacy-content { width: min(100% - 32px, 540px); padding-top: 48px; }
  .public-privacy-card { padding: 19px; }
  .public-privacy-card dl div { grid-template-columns: 1fr; gap: 4px; }
}
</style>
