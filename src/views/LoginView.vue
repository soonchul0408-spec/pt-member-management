<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import brandMark from '@/assets/good-habit-pt-mark.png'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loginMode = ref('member')
const memberForm = reactive({ password: '' })
const instructorForm = reactive({ email: '', password: '' })

async function submit() {
  const success = loginMode.value === 'member'
    ? await auth.signInMember(memberForm.password)
    : await auth.signIn(instructorForm.email.trim(), instructorForm.password)

  if (success) {
    const defaultRoute = loginMode.value === 'member' ? '/pt/member/dashboard' : '/pt/dashboard'
    router.replace(String(route.query.redirect || defaultRoute))
  }
}

function goBack() {
  router.push('/pt/dashboard')
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="never">
      <div class="login-card__brand"><img class="pt-brand__mark" :src="brandMark" alt="좋은 습관 PT 로고" /><div><strong>좋은 습관 PT</strong><span>회원·강사 전용 로그인</span></div></div>
      <div class="login-card__heading"><p class="page-intro__eyebrow">PRIVATE WORKSPACE</p><h1>회원·강사 로그인</h1><p>회원 기록은 로그인한 본인과 연결된 강사만 조회할 수 있습니다.</p></div>

      <el-alert v-if="!auth.authConfigured" type="warning" :closable="false" show-icon title="Supabase 연결이 필요합니다.">
        배포 환경에 Supabase URL과 Publishable key를 등록한 뒤 로그인할 수 있습니다. 보호 모드에서는 로그인 전 개인 데이터를 표시하지 않습니다.
      </el-alert>
      <el-alert v-if="auth.error" class="login-card__alert" type="error" :closable="false" show-icon :title="auth.error" />

      <el-radio-group v-model="loginMode" class="login-mode" size="large">
        <el-radio-button label="member">회원 접속</el-radio-button>
        <el-radio-button label="instructor">강사 로그인</el-radio-button>
      </el-radio-group>

      <el-alert v-if="loginMode === 'member' && auth.authConfigured && !auth.memberLoginConfigured" class="login-card__alert" type="warning" :closable="false" show-icon title="회원 로그인 설정이 필요합니다.">
        배포 환경에 회원 계정 식별자를 등록한 뒤 사용할 수 있습니다. 회원 이메일은 화면에 표시하지 않습니다.
      </el-alert>

      <el-form v-if="loginMode === 'member'" :model="memberForm" label-position="top" class="login-form" @submit.prevent="submit">
        <el-form-item label="회원 비밀번호"><el-input v-model="memberForm.password" type="password" autocomplete="current-password" show-password placeholder="회원 비밀번호 입력" @keyup.enter="submit" /></el-form-item>
        <el-button type="primary" size="large" class="full-width" :loading="auth.loading" :disabled="!memberForm.password || !auth.memberLoginConfigured" @click="submit">회원으로 접속</el-button>
      </el-form>

      <el-form v-else :model="instructorForm" label-position="top" class="login-form" @submit.prevent="submit">
        <el-form-item label="이메일"><el-input v-model="instructorForm.email" type="email" autocomplete="username" placeholder="trainer@example.com" /></el-form-item>
        <el-form-item label="비밀번호"><el-input v-model="instructorForm.password" type="password" autocomplete="current-password" show-password placeholder="비밀번호 입력" @keyup.enter="submit" /></el-form-item>
        <el-button type="primary" size="large" class="full-width" :loading="auth.loading" :disabled="!instructorForm.email || !instructorForm.password" @click="submit">강사로 로그인</el-button>
      </el-form>

      <el-button v-if="!auth.authRequired" class="full-width login-card__back" plain @click="goBack">공개 화면으로 돌아가기</el-button>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f4f7fb;
}

.login-card {
  width: min(100%, 460px);
  border: 1px solid #e7edf5;
  border-radius: 22px;
}

.login-card__brand,
.login-card__heading {
  display: flex;
}

.login-card__brand {
  align-items: center;
  gap: 11px;
  margin-bottom: 34px;
}

.login-card__brand strong,
.login-card__brand span {
  display: block;
}

.login-card__brand strong {
  color: #172033;
  font-size: 0.95rem;
}

.login-card__brand span {
  margin-top: 3px;
  color: #8b96a8;
  font-size: 0.7rem;
}

.login-card__heading {
  flex-direction: column;
  gap: 8px;
  margin-bottom: 23px;
}

.login-card__heading h1 {
  margin: 0;
  color: #172033;
  font-size: 1.7rem;
}

.login-card__heading p:last-child {
  margin: 0;
  color: #6d7a8f;
  font-size: 0.82rem;
  line-height: 1.7;
}

.login-card__alert {
  margin-top: 14px;
}

.login-form {
  margin-top: 22px;
}

.login-mode {
  display: flex;
  width: 100%;
  margin-top: 4px;
}

.login-mode :deep(.el-radio-button) {
  flex: 1;
}

.login-mode :deep(.el-radio-button__inner) {
  width: 100%;
}

.full-width {
  width: 100%;
}

.login-card__back {
  margin-top: 11px;
}
</style>
