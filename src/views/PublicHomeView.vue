<script setup>
import brandMark from '@/assets/good-habit-pt-mark.png'

const trainerProfile = [
  { label: '관리 초점', value: '기초 체력 · 자세 · 운동 습관' },
  { label: '관리 대상', value: '운동을 시작하고 꾸준함을 만들고 싶은 회원' },
  { label: '지도 방식', value: '상담 → 상태 파악 → 맞춤 계획 → 기록과 피드백' },
]

const managementSteps = [
  { number: '01', title: '상담하고 목표를 정합니다', description: '현재 운동 경험과 원하는 변화를 먼저 확인합니다.' },
  { number: '02', title: '지금 상태를 파악합니다', description: '움직임과 생활 습관을 살펴 시작점을 정합니다.' },
  { number: '03', title: '나에게 맞게 계획합니다', description: '무리하지 않고 이어갈 수 있는 운동 순서를 구성합니다.' },
  { number: '04', title: '수업과 일상을 기록합니다', description: '수업 내용과 운동·컨디션을 간단히 남깁니다.' },
  { number: '05', title: '피드백으로 조정합니다', description: '기록을 바탕으로 다음 운동 방향을 바꿉니다.' },
  { number: '06', title: '진도를 함께 확인합니다', description: '출석·운동 기록·목표 변화를 주기적으로 살펴봅니다.' },
]

const memberFeatures = [
  { number: '01', title: '오늘의 운동', description: '오늘 어떤 운동을 할지 과제와 일정으로 확인합니다.' },
  { number: '02', title: '지난 운동 기록', description: '이전에 어떤 운동을 했는지 흐름으로 확인합니다.' },
  { number: '03', title: '트레이너 피드백', description: '수업 후 코칭 메모와 다음 운동 방향을 확인합니다.' },
  { number: '04', title: '출석·진도·다음 수업', description: '내 진행 상황과 앞으로의 운동 계획을 한눈에 봅니다.' },
]

const managementPrinciples = [
  { number: '01', title: '수업 내용이 기록됩니다', description: '그날 무엇을 했는지 남겨 다음 운동을 준비하는 기준으로 삼습니다.' },
  { number: '02', title: '계획이 회원마다 달라집니다', description: '현재 상태와 생활 리듬을 바탕으로 운동 방향을 조정합니다.' },
  { number: '03', title: '변화를 직접 확인합니다', description: '회원 화면에서 기록·출석·진도를 확인하며 꾸준함을 이어갑니다.' },
]
</script>

<template>
  <div class="public-home-page">
    <header class="simple-home-header">
      <div class="simple-home-container simple-home-header__inner">
        <router-link class="simple-home-brand" to="/" aria-label="좋은 습관 PT 홈으로 이동">
          <img :src="brandMark" alt="좋은 습관 PT 로고" />
          <span>
            <strong>좋은 습관 PT</strong>
            <small>운동이 습관이 되는 관리</small>
          </span>
        </router-link>

        <div class="simple-home-header__links">
          <router-link class="simple-home-text-link" to="/pt/member/dashboard">회원 로그인</router-link>
          <router-link class="simple-home-solid-link" to="/pt/dashboard">강사 로그인</router-link>
        </div>
      </div>
    </header>

    <main>
      <section class="simple-home-hero">
        <div class="simple-home-container simple-home-hero__inner">
          <div class="simple-home-hero__copy">
            <p class="simple-home-kicker"><span></span> GOOD HABIT PT</p>
            <h1>운동이 습관이 되는<br /><em>PT 관리</em></h1>
            <p class="simple-home-hero__lead">
              수업에서 끝나지 않습니다.<br />
              기록하고, 피드백하고, 다음 운동으로 이어갑니다.
            </p>
            <div class="simple-home-hero__actions">
              <router-link class="simple-home-primary-button" to="/pt/consultation">상담 시작하기 <span>→</span></router-link>
              <a class="simple-home-secondary-button" href="#process">관리 방식 보기</a>
            </div>
            <p class="simple-home-hero__note">1:1 맞춤 PT · 기록 기반 코칭 · 회원 전용 관리</p>
          </div>

          <div class="simple-home-hero__visual" role="img" aria-label="운동 기록이 습관으로 이어지는 모습을 표현한 그래픽">
            <div class="simple-home-hero__visual-ring"></div>
            <div class="simple-home-hero__visual-copy">
              <span>ONE DAY</span>
              <strong>오늘<br />1%</strong>
              <p>작은 기록이<br />좋은 습관이 됩니다.</p>
            </div>
            <div class="simple-home-hero__visual-check">✓</div>
            <div class="simple-home-hero__visual-line simple-home-hero__visual-line--one"><span>운동</span><i></i></div>
            <div class="simple-home-hero__visual-line simple-home-hero__visual-line--two"><span>기록</span><i></i></div>
            <div class="simple-home-hero__visual-line simple-home-hero__visual-line--three"><span>변화</span><i></i></div>
          </div>
        </div>
      </section>

      <section id="trainer" class="simple-home-section simple-home-trainer">
        <div class="simple-home-container simple-home-trainer__inner">
          <div class="simple-home-section-heading">
            <p class="simple-home-kicker"><span></span> TRAINER INTRODUCTION</p>
            <h2>회원의 목표를 듣고,<br /><em>다음 운동을 준비합니다.</em></h2>
            <p>좋은 습관 PT는 한 번의 수업보다, 회원의 현재와 다음 과정을 이어서 보는 관리에 집중합니다.</p>
          </div>

          <div class="simple-home-trainer__profile">
            <span class="simple-home-trainer__label">담당 트레이너</span>
            <strong>좋은 습관 PT 트레이너</strong>
            <p>회원의 운동 목표와 생활 패턴을 함께 살피며, 기록을 바탕으로 이어갈 수 있는 운동을 설계합니다.</p>
            <dl>
              <div v-for="item in trainerProfile" :key="item.label">
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>
            <small>※ 트레이너 이름과 실제 전문 분야는 운영 정보에 맞게 교체할 수 있는 소개 문구 예시입니다.</small>
          </div>
        </div>
      </section>

      <section id="process" class="simple-home-section simple-home-process">
        <div class="simple-home-container">
          <div class="simple-home-section-heading">
            <p class="simple-home-kicker"><span></span> HOW IT WORKS</p>
            <h2>상담부터 진도 확인까지,<br /><em>관리의 흐름</em>을 함께 만듭니다.</h2>
            <p>운동을 시작한 뒤 어떤 과정을 거치는지, 큰 흐름으로 먼저 확인해 보세요.</p>
          </div>

          <div class="simple-home-step-grid">
            <article v-for="step in managementSteps" :key="step.number" class="simple-home-step">
              <span>{{ step.number }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="member-care" class="simple-home-section simple-home-member">
        <div class="simple-home-container">
          <div class="simple-home-section-heading simple-home-section-heading--center">
            <p class="simple-home-kicker"><span></span> FOR MEMBERS</p>
            <h2>회원 화면에서 <em>관리의 흐름</em>을 확인합니다.</h2>
            <p>오늘 할 운동부터 지난 기록, 피드백과 다음 수업까지 한 화면에서 이어집니다.</p>
          </div>

          <div class="simple-home-feature-grid">
            <article v-for="feature in memberFeatures" :key="feature.number" class="simple-home-feature">
              <span class="simple-home-feature__number">{{ feature.number }}</span>
              <div>
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.description }}</p>
              </div>
              <span class="simple-home-feature__mark">✓</span>
            </article>
          </div>

          <div class="simple-home-member__footer">
            <span>실제 회원 화면을 개인정보 없이 샘플로 미리 확인해 보세요.</span>
            <div class="simple-home-member__actions">
              <router-link to="/pt/member/preview">회원 화면 미리보기 <span>→</span></router-link>
              <router-link to="/pt/consultation">상담 신청하기 <span>→</span></router-link>
            </div>
          </div>
        </div>
      </section>

      <section class="simple-home-section simple-home-principles">
        <div class="simple-home-container">
          <div class="simple-home-section-heading simple-home-section-heading--center">
            <p class="simple-home-kicker"><span></span> WHY THIS FLOW</p>
            <h2>운동만 시키는 것이 아니라,<br /><em>다음 선택까지</em> 함께 봅니다.</h2>
            <p>실제 성과를 과장하지 않고, 관리가 이어지는 방법 자체를 보여드립니다.</p>
          </div>

          <div class="simple-home-principles-grid">
            <article v-for="principle in managementPrinciples" :key="principle.number" class="simple-home-principle">
              <span>{{ principle.number }}</span>
              <h3>{{ principle.title }}</h3>
              <p>{{ principle.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" class="simple-home-contact">
        <div class="simple-home-container simple-home-contact__inner">
          <div>
            <p class="simple-home-kicker simple-home-kicker--light"><span></span> NEW MEMBER CONSULTATION</p>
            <h2>내 운동에 맞는 관리가<br /><em>궁금하다면</em></h2>
            <p>운동 목표와 현재 고민을 남겨주시면, 좋은 습관 PT의 관리 방식과 시작 방법을 안내해 드립니다.</p>
          </div>
          <router-link class="simple-home-contact__button" to="/pt/consultation">신규 회원 상담 <span>→</span></router-link>
        </div>
      </section>
    </main>

    <footer class="simple-home-footer">
      <div class="simple-home-container simple-home-footer__inner">
        <div class="simple-home-footer__brand">
          <img :src="brandMark" alt="" />
          <span><strong>좋은 습관 PT</strong><small>운동이 습관이 되는 관리</small></span>
        </div>
        <div class="simple-home-footer__links">
          <router-link to="/pt/member/dashboard">회원 로그인</router-link>
          <router-link to="/pt/dashboard">강사 로그인</router-link>
          <router-link to="/pt/login">로그인</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.public-home-page {
  --simple-ink: var(--pt-ink, #172033);
  --simple-muted: var(--pt-muted, #6f7b8f);
  --simple-line: var(--pt-border, #e7e8ec);
  --simple-primary: var(--pt-blue, #2563eb);
  --simple-primary-soft: var(--pt-blue-soft, #eef3ff);
  --simple-moss: var(--pt-green, #0f766e);
  --simple-moss-dark: #172033;
  --simple-mint: var(--pt-bg, #f7f7f5);
  --simple-orange: #dc7c45;
  min-height: 100vh;
  color: var(--simple-ink);
  background: var(--simple-mint);
}

.simple-home-container { width: min(1080px, calc(100% - 48px)); margin: 0 auto; }

.simple-home-header { border-bottom: 1px solid var(--simple-line); background: rgb(247 247 245 / 94%); }
.simple-home-header__inner { display: flex; min-height: 76px; align-items: center; justify-content: space-between; gap: 20px; }
.simple-home-brand, .simple-home-footer__brand { display: inline-flex; min-width: 0; align-items: center; gap: 10px; color: var(--simple-ink); text-decoration: none; }
.simple-home-brand img, .simple-home-footer__brand img { width: 36px; height: 36px; border-radius: 11px; object-fit: cover; }
.simple-home-brand span, .simple-home-footer__brand span { display: grid; min-width: 0; gap: 2px; }
.simple-home-brand strong, .simple-home-footer__brand strong { font-size: 0.93rem; font-weight: 850; letter-spacing: -0.05em; }
.simple-home-brand small, .simple-home-footer__brand small { color: #9aa4b5; font-size: 0.63rem; }
.simple-home-header__links { display: flex; flex-shrink: 0; align-items: center; gap: 16px; }
.simple-home-text-link, .simple-home-solid-link { font-size: 0.73rem; font-weight: 800; text-decoration: none; }
.simple-home-text-link { color: #67748a; }
.simple-home-text-link:hover { color: var(--simple-primary); }
.simple-home-solid-link { display: inline-flex; min-height: 35px; align-items: center; padding: 0 14px; border-radius: 10px; color: #fff; background: var(--simple-primary); box-shadow: 0 5px 12px rgb(37 99 235 / 12%); }

.simple-home-hero { overflow: hidden; background: linear-gradient(120deg, #f7f7f5 10%, #eef3ff 100%); }
.simple-home-hero__inner { display: grid; grid-template-columns: minmax(0, 1fr) minmax(330px, 0.72fr); align-items: center; gap: 74px; min-height: 610px; padding-top: 64px; padding-bottom: 64px; }
.simple-home-hero__copy { position: relative; z-index: 1; }
.simple-home-kicker { display: flex; align-items: center; gap: 8px; margin: 0 0 17px; color: var(--simple-primary); font-size: 0.65rem; font-weight: 850; letter-spacing: 0.15em; }
.simple-home-kicker span { display: inline-block; width: 21px; height: 2px; background: var(--simple-orange); }
.simple-home-hero h1 { margin: 0; color: var(--simple-ink); font-size: clamp(3rem, 6vw, 5.1rem); font-weight: 900; letter-spacing: -0.1em; line-height: 1.08; }
.simple-home-hero h1 em, .simple-home-section h2 em { color: var(--simple-primary); font-style: normal; }
.simple-home-hero__lead { margin: 28px 0 0; color: var(--simple-muted); font-size: 1rem; line-height: 1.85; }
.simple-home-hero__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 31px; }
.simple-home-primary-button, .simple-home-secondary-button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 12px; padding: 0 18px; border-radius: 9px; font-size: 0.78rem; font-weight: 850; text-decoration: none; transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease; }
.simple-home-primary-button:hover, .simple-home-secondary-button:hover, .simple-home-contact__button:hover { transform: translateY(-2px); }
.simple-home-primary-button { color: #fff; background: var(--simple-primary); box-shadow: 0 5px 12px rgb(37 99 235 / 12%); }
.simple-home-primary-button:hover { background: var(--simple-moss-dark); }
.simple-home-secondary-button { color: #526078; border: 1px solid var(--simple-line); background: rgb(255 255 255 / 70%); }
.simple-home-secondary-button:hover { background: #fff; }
.simple-home-primary-button span, .simple-home-contact__button span { font-size: 1rem; }
.simple-home-hero__note { margin: 29px 0 0; color: #86a094; font-size: 0.66rem; letter-spacing: 0.02em; }

.simple-home-hero__visual { position: relative; display: grid; width: min(100%, 370px); min-height: 420px; place-items: center; justify-self: end; overflow: hidden; border-radius: 17px; color: #fff; background: linear-gradient(145deg, var(--simple-primary), var(--simple-moss)); box-shadow: 0 16px 34px rgb(23 32 51 / 12%); }
.simple-home-hero__visual::before { position: absolute; top: -105px; right: -96px; width: 310px; height: 310px; border: 1px solid rgb(255 255 255 / 24%); border-radius: 50%; content: ''; }
.simple-home-hero__visual::after { position: absolute; right: -125px; bottom: -175px; width: 380px; height: 380px; border: 1px solid rgb(255 255 255 / 18%); border-radius: 50%; content: ''; }
.simple-home-hero__visual-ring { position: absolute; width: 258px; height: 258px; border: 1px solid rgb(255 255 255 / 28%); border-radius: 50%; transform: rotate(-24deg); }
.simple-home-hero__visual-copy { position: relative; z-index: 1; width: 208px; }
.simple-home-hero__visual-copy span { display: block; margin-bottom: 20px; color: #cbdcff; font-size: 0.61rem; font-weight: 850; letter-spacing: 0.17em; }
.simple-home-hero__visual-copy strong { display: block; font-size: 3.9rem; font-weight: 900; letter-spacing: -0.12em; line-height: 0.9; }
.simple-home-hero__visual-copy p { margin: 25px 0 0; color: #d8e4ff; font-size: 0.83rem; line-height: 1.7; }
.simple-home-hero__visual-check { position: absolute; z-index: 2; top: 86px; right: 62px; display: grid; width: 45px; height: 45px; place-items: center; border-radius: 10px; color: var(--simple-primary); background: #fff; font-size: 1.4rem; font-weight: 900; transform: rotate(10deg); }
.simple-home-hero__visual-line { position: absolute; z-index: 2; display: flex; align-items: center; gap: 8px; color: #c3e5cf; font-size: 0.63rem; }
.simple-home-hero__visual-line i { display: block; width: 36px; height: 1px; background: rgb(255 255 255 / 45%); }
.simple-home-hero__visual-line--one { top: 160px; left: 36px; }
.simple-home-hero__visual-line--two { right: 33px; bottom: 126px; flex-direction: row-reverse; }
.simple-home-hero__visual-line--three { bottom: 45px; left: 48px; }

.simple-home-trainer { background: var(--simple-mint); }
.simple-home-trainer__inner { display: grid; grid-template-columns: minmax(0, 1fr) minmax(330px, 0.72fr); align-items: center; gap: 72px; }
.simple-home-trainer__profile { padding: 29px; border: 1px solid var(--simple-line); border-radius: 17px; background: #fff; box-shadow: 0 5px 20px rgb(23 32 51 / 4%); }
.simple-home-trainer__label { display: block; color: var(--simple-primary); font-size: 0.66rem; font-weight: 850; letter-spacing: 0.14em; }
.simple-home-trainer__profile > strong { display: block; margin-top: 17px; color: var(--simple-ink); font-size: 1.35rem; letter-spacing: -0.07em; }
.simple-home-trainer__profile > p { margin: 13px 0 0; color: var(--simple-muted); font-size: 0.8rem; line-height: 1.75; }
.simple-home-trainer__profile dl { display: grid; gap: 0; margin: 25px 0 0; border-top: 1px solid var(--simple-line); }
.simple-home-trainer__profile dl > div { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--simple-line); }
.simple-home-trainer__profile dt { color: #9aa4b4; font-size: 0.69rem; }
.simple-home-trainer__profile dd { margin: 0; color: #526078; font-size: 0.75rem; line-height: 1.55; word-break: keep-all; }
.simple-home-trainer__profile > small { display: block; margin-top: 17px; color: #aab3c1; font-size: 0.65rem; line-height: 1.55; }

.simple-home-section { scroll-margin-top: 76px; padding: 106px 0; }
.simple-home-process { background: #fff; }
.simple-home-section-heading { max-width: 670px; }
.simple-home-section-heading h2 { margin: 0; color: var(--simple-ink); font-size: clamp(2rem, 4vw, 3.15rem); font-weight: 900; letter-spacing: -0.09em; line-height: 1.2; }
.simple-home-section-heading > p:last-child { max-width: 440px; margin: 19px 0 0; color: var(--simple-muted); font-size: 0.84rem; line-height: 1.8; }
.simple-home-section-heading--center { margin: 0 auto; text-align: center; }
.simple-home-section-heading--center .simple-home-kicker { justify-content: center; }
.simple-home-section-heading--center > p:last-child { margin-right: auto; margin-left: auto; }
.simple-home-step-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 52px; }
.simple-home-step { min-height: 176px; padding: 23px 21px; border: 1px solid var(--simple-line); border-radius: 17px; background: #fbfcff; box-shadow: 0 5px 20px rgb(23 32 51 / 3%); }
.simple-home-step > span { color: var(--simple-primary); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.08em; }
.simple-home-step h3 { margin: 22px 0 10px; color: #315948; font-size: 1rem; letter-spacing: -0.055em; line-height: 1.4; }
.simple-home-step p { max-width: 240px; margin: 0; color: var(--simple-muted); font-size: 0.76rem; line-height: 1.75; word-break: keep-all; }

.simple-home-member { background: #eef3ff; }
.simple-home-feature-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 52px; }
.simple-home-feature { display: grid; min-height: 174px; grid-template-columns: auto 1fr auto; align-items: start; gap: 17px; padding: 23px 20px; border: 1px solid var(--simple-line); border-radius: 17px; background: #fff; box-shadow: 0 5px 20px rgb(23 32 51 / 4%); }
.simple-home-feature__number { color: var(--simple-primary); font-size: 0.65rem; font-weight: 900; letter-spacing: 0.06em; }
.simple-home-feature h3 { margin: 0 0 9px; color: #315948; font-size: 0.95rem; letter-spacing: -0.05em; }
.simple-home-feature p { margin: 0; color: var(--simple-muted); font-size: 0.75rem; line-height: 1.7; word-break: keep-all; }
.simple-home-feature__mark { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 8px; color: #fff; background: var(--simple-primary); font-size: 0.73rem; font-weight: 900; }

.simple-home-member__footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 26px; color: #73809a; font-size: 0.74rem; }
.simple-home-member__actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 16px; }
.simple-home-member__footer a { display: inline-flex; align-items: center; gap: 6px; color: var(--simple-primary); font-size: 0.74rem; font-weight: 850; text-decoration: none; }
.simple-home-member__footer a:hover { text-decoration: underline; }

.simple-home-principles { background: #fff; }
.simple-home-principles-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 52px; }
.simple-home-principle { min-height: 185px; padding: 24px 22px; border: 1px solid var(--simple-line); border-radius: 17px; background: var(--simple-mint); }
.simple-home-principle > span { color: var(--simple-primary); font-size: 0.67rem; font-weight: 900; letter-spacing: 0.08em; }
.simple-home-principle h3 { margin: 27px 0 10px; color: #315948; font-size: 1rem; letter-spacing: -0.055em; line-height: 1.4; }
.simple-home-principle p { margin: 0; color: var(--simple-muted); font-size: 0.76rem; line-height: 1.75; word-break: keep-all; }

.simple-home-contact { padding: 82px 0; color: #fff; background: var(--simple-moss-dark); }
.simple-home-contact__inner { display: flex; align-items: center; justify-content: space-between; gap: 35px; }
.simple-home-kicker--light { color: #a3d4b8; }
.simple-home-contact h2 { margin: 0; color: #fff; font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; letter-spacing: -0.09em; line-height: 1.2; }
.simple-home-contact h2 em { color: #b9d1ff; font-style: normal; }
.simple-home-contact__inner > div > p:last-child { max-width: 430px; margin: 18px 0 0; color: #b5d8c4; font-size: 0.82rem; line-height: 1.8; }
.simple-home-contact__button { display: inline-flex; min-height: 52px; align-items: center; justify-content: center; gap: 12px; min-width: 170px; padding: 0 20px; border-radius: 10px; color: var(--simple-moss-dark); background: #e9f7ed; font-size: 0.79rem; font-weight: 900; text-decoration: none; transition: transform 160ms ease; }

.simple-home-footer { border-top: 1px solid var(--simple-line); background: var(--simple-mint); }
.simple-home-footer__inner { display: flex; min-height: 90px; align-items: center; gap: 25px; }
.simple-home-footer__brand img { width: 30px; height: 30px; border-radius: 9px; }
.simple-home-footer__brand strong { font-size: 0.77rem; }
.simple-home-footer__brand small { font-size: 0.57rem; }
.simple-home-footer__links { display: flex; gap: 18px; margin-left: auto; }
.simple-home-footer__links a { color: #71867b; font-size: 0.67rem; font-weight: 750; text-decoration: none; }
.simple-home-footer__links a:hover { color: var(--simple-moss); }

@media (max-width: 980px) {
  .simple-home-step-grid, .simple-home-feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 820px) {
  .simple-home-hero__inner { grid-template-columns: 1fr; gap: 48px; min-height: auto; padding-top: 75px; padding-bottom: 75px; }
  .simple-home-hero__copy { text-align: center; }
  .simple-home-hero__copy .simple-home-kicker, .simple-home-hero__actions { justify-content: center; }
  .simple-home-hero__lead { margin-right: auto; margin-left: auto; }
  .simple-home-hero__visual { justify-self: center; }
  .simple-home-trainer__inner { grid-template-columns: 1fr; gap: 44px; }
  .simple-home-trainer__profile { max-width: 560px; }
}

@media (max-width: 680px) {
  .simple-home-container { width: min(100% - 32px, 540px); }
  .simple-home-header__inner { min-height: 68px; }
  .simple-home-brand img { width: 32px; height: 32px; }
  .simple-home-brand strong { font-size: 0.8rem; }
  .simple-home-brand small { font-size: 0.56rem; }
  .simple-home-header__links { gap: 10px; }
  .simple-home-text-link, .simple-home-solid-link { font-size: 0.62rem; }
  .simple-home-solid-link { min-height: 32px; padding: 0 10px; }
  .simple-home-hero h1 { font-size: clamp(2.7rem, 12vw, 4rem); }
  .simple-home-hero__lead { font-size: 0.86rem; }
  .simple-home-hero__visual { width: min(100%, 340px); min-height: 370px; }
  .simple-home-hero__visual-check { top: 72px; right: 45px; }
  .simple-home-section { padding: 78px 0; }
  .simple-home-step-grid, .simple-home-feature-grid { grid-template-columns: 1fr; margin-top: 38px; }
  .simple-home-trainer__profile { padding: 22px; }
  .simple-home-step { min-height: auto; padding: 20px; }
  .simple-home-step h3 { margin-top: 17px; }
  .simple-home-feature { min-height: auto; }
  .simple-home-member__footer { align-items: flex-start; flex-direction: column; gap: 10px; }
  .simple-home-member__actions { justify-content: flex-start; gap: 12px; }
  .simple-home-principles-grid { grid-template-columns: 1fr; margin-top: 38px; }
  .simple-home-contact { padding: 65px 0; }
  .simple-home-contact__inner { display: block; }
  .simple-home-contact__button { margin-top: 30px; }
  .simple-home-footer__inner { display: grid; gap: 16px; padding-top: 24px; padding-bottom: 24px; }
  .simple-home-footer__links { margin-left: 0; }
}

@media (max-width: 380px) {
  .simple-home-header__inner { gap: 10px; }
  .simple-home-brand small { display: none; }
  .simple-home-header__links { gap: 7px; }
  .simple-home-text-link, .simple-home-solid-link { font-size: 0.58rem; }
  .simple-home-solid-link { padding: 0 8px; }
  .simple-home-hero__actions { display: grid; }
  .simple-home-primary-button, .simple-home-secondary-button { width: 100%; }
  .simple-home-hero__visual { min-height: 340px; }
  .simple-home-hero__visual-copy strong { font-size: 3.3rem; }
  .simple-home-hero__visual-check { top: 58px; right: 33px; }
}
</style>
