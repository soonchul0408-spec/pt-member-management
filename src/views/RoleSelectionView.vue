<script setup>
import { useRouter } from 'vue-router'

import brandMark from '@/assets/good-habit-pt-mark.png'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const auth = useAuthStore()

function chooseRole(role) {
  if (role === 'member') {
    auth.switchDemoRole('member', 'member-notion-1')
    router.push('/pt/member/dashboard')
    return
  }

  auth.switchDemoRole('instructor')
  router.push('/pt/dashboard')
}
</script>

<template>
  <main class="role-selection-page">
    <section class="role-selection-shell" aria-label="좋은 습관 PT 역할 선택">
      <div class="role-selection-brand">
        <img class="role-selection-brand__mark" :src="brandMark" alt="좋은 습관 PT 로고" />
        <div>
          <strong>좋은 습관 PT</strong>
          <span>회원관리 workspace</span>
        </div>
      </div>

      <div class="role-choice-grid">
        <button class="role-choice role-choice--instructor" type="button" @click="chooseRole('instructor')">
          <span class="role-choice__icon" aria-hidden="true">⌂</span>
          <strong class="role-choice__label">강사 화면</strong>
          <span class="role-choice__arrow" aria-hidden="true">→</span>
        </button>

        <button class="role-choice role-choice--member" type="button" @click="chooseRole('member')">
          <span class="role-choice__icon" aria-hidden="true">◎</span>
          <strong class="role-choice__label">회원 화면</strong>
          <span class="role-choice__arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.role-selection-page {
  display: grid;
  min-height: 100vh;
  padding: 32px 20px;
  place-items: center;
  background: linear-gradient(145deg, #f7f8fb 0%, #eef3ff 100%);
}

.role-selection-shell {
  width: min(920px, 100%);
  padding: clamp(28px, 6vw, 64px);
  border: 1px solid #e4e9f2;
  border-radius: 28px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 24px 70px rgb(36 62 107 / 12%);
}

.role-selection-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-selection-brand__mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  object-fit: cover;
}

.role-selection-brand strong {
  color: #1e2f4d;
  font-size: 1rem;
}

.role-selection-brand span {
  margin-top: 3px;
  color: #9aa4b5;
  font-size: 0.7rem;
}

.role-selection-brand strong,
.role-selection-brand span {
  display: block;
}

.role-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 34px;
}

.role-choice {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  min-height: 174px;
  padding: 24px;
  border: 1px solid #e3e8f2;
  border-radius: 20px;
  color: #2d3d59;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.role-choice:hover,
.role-choice:focus-visible {
  outline: none;
  border-color: #9eb8f5;
  box-shadow: 0 12px 28px rgb(37 99 235 / 12%);
  transform: translateY(-3px);
}

.role-choice--instructor {
  background: #f5f8ff;
}

.role-choice--member {
  background: #f3fbf8;
}

.role-choice__icon {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 16px;
  font-size: 1.35rem;
  font-weight: 850;
}

.role-choice--instructor .role-choice__icon {
  color: #2563eb;
  background: #e4edff;
}

.role-choice--member .role-choice__icon {
  color: #0f766e;
  background: #d8f5e9;
}

.role-choice__label {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #253752;
  white-space: normal;
  word-break: keep-all;
  font-size: 1.18rem;
}

.role-choice__arrow {
  color: #91a0b5;
  font-size: 1.25rem;
}

@media (max-width: 640px) {
  .role-selection-page {
    padding: 16px;
  }

  .role-selection-shell {
    padding: 26px 18px 30px;
    border-radius: 22px;
  }

  .role-choice-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 26px;
  }

  .role-choice {
    min-height: 142px;
    padding: 18px;
  }
}
</style>
