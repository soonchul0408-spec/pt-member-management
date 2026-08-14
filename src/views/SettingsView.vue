<script setup>
import { computed, ref } from 'vue'

import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const auth = useAuthStore()
const store = usePtStore()
const resetDialogOpen = ref(false)
const savedNotice = ref(false)
const profile = ref({ name: store.currentUser.name, role: store.currentUser.role, studio: '바른움직임 스튜디오', phone: '02-0000-0000' })
const storageDescription = computed(() => {
  if (auth.authConfigured) return 'Supabase 로그인 사용자는 서버 데이터와 권한 정책을 적용받습니다. 비로그인 사용자는 공개 화면만 이용할 수 있습니다.'
  if (auth.authRequired) return '운영 보호 모드가 켜져 있습니다. Supabase 환경변수를 등록해야 로그인 후 회원 데이터를 사용할 수 있습니다.'
  return '로컬 개발에서는 샘플 데이터와 localStorage를 사용하는 데모 모드로 동작합니다. 역할 전환으로 강사와 회원 흐름을 확인할 수 있습니다.'
})

function saveProfile() {
  if (!store.canEdit) return
  store.currentUser.name = profile.value.name
  store.currentUser.role = profile.value.role
  savedNotice.value = true
  window.setTimeout(() => {
    savedNotice.value = false
  }, 2200)
}

function resetData() {
  store.resetLocalData()
  resetDialogOpen.value = false
}
</script>

<template>
  <div class="settings-page">
    <section class="page-intro"><div><p class="page-intro__eyebrow">WORKSPACE SETTINGS</p><h2>설정</h2><p>트레이너 프로필과 권한 및 데이터 환경을 관리합니다.</p></div><el-tag :type="store.canEdit ? 'success' : 'info'" effect="light">{{ store.canEdit ? auth.roleLabel : '읽기 전용' }}</el-tag></section>
    <div class="settings-grid">
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">MY PROFILE</p><h2>운영자 프로필</h2></div><el-button v-if="store.canEdit" type="primary" @click="saveProfile">저장하기</el-button></div><el-form :model="profile" :disabled="!store.canEdit" label-position="top" class="dialog-form"><div class="form-grid"><el-form-item label="이름"><el-input v-model="profile.name" /></el-form-item><el-form-item label="역할"><el-input v-model="profile.role" disabled /></el-form-item><el-form-item label="스튜디오명" class="span-2"><el-input v-model="profile.studio" /></el-form-item><el-form-item label="대표 연락처" class="span-2"><el-input v-model="profile.phone" /></el-form-item></div></el-form><el-alert v-if="savedNotice" type="success" :closable="false" title="프로필이 저장되었습니다." /><el-alert v-if="!auth.user && !auth.isLocalEditor" class="settings-alert" type="info" :closable="false" title="공개 조회 모드입니다. 프로필을 변경하려면 편집 권한으로 로그인하세요." /><el-alert v-if="auth.isLocalEditor" class="settings-alert" type="warning" :closable="false" title="로컬 개발 편집 모드입니다. 배포 사이트에는 적용되지 않습니다." /></el-card>
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">TRAINERS</p><h2>트레이너 목록</h2></div><el-tag type="info" effect="plain">{{ store.trainers.length }}명</el-tag></div><div class="settings-list"><div v-for="trainer in store.trainers" :key="trainer.id" class="settings-list__item"><div class="table-cell-with-avatar"><div class="avatar" :style="{ color: trainer.color, background: `${trainer.color}18` }">{{ trainer.name.slice(0, 1) }}</div><div><strong>{{ trainer.name }}</strong><span>{{ trainer.role }}</span></div></div><el-tag type="success" size="small" effect="light">활성</el-tag></div></div></el-card>
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">DATA STORAGE</p><h2>데이터 저장 안내</h2></div></div><p class="settings-description">{{ storageDescription }}</p><el-button v-if="store.canEdit" type="danger" plain @click="resetDialogOpen = true">샘플 데이터로 초기화</el-button></el-card>
      <el-card class="panel-card" shadow="never"><div class="section-heading"><div><p class="section-eyebrow">ACCESS CONTROL</p><h2>접근 권한</h2></div><el-tag type="info" effect="plain">RLS</el-tag></div><ul class="report-guidelines"><li>비로그인 사용자: 공개 화면만 이용</li><li>조회자(viewer): 연결된 서버 데이터 조회</li><li>편집자(editor): 회원·수업·결제 수정</li><li>관리자(admin): 역할 관리 및 운영</li></ul></el-card>
    </div>
    <el-dialog v-if="store.canEdit" v-model="resetDialogOpen" title="샘플 데이터로 초기화" width="420px"><p class="reset-description">직접 입력한 회원, 수업, 체성분, 결제 기록이 모두 샘플 데이터로 바뀝니다. 계속하시겠습니까?</p><template #footer><div class="form-actions"><el-button @click="resetDialogOpen = false">취소</el-button><el-button type="danger" @click="resetData">초기화</el-button></div></template></el-dialog>
  </div>
</template>

<style scoped>
.settings-description,
.reset-description {
  margin: 0 0 18px;
  color: #66748a;
  font-size: 0.82rem;
  line-height: 1.75;
}

.settings-alert {
  margin-top: 16px;
}
</style>
