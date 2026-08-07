<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const router = useRouter()
const auth = useAuthStore()
const store = usePtStore()
const selectedMemberId = ref(auth.activeMemberId)

const selectedRole = computed({
  get: () => auth.currentRole,
  set: (nextRole) => switchRole(nextRole),
})

function switchRole(nextRole) {
  if (nextRole === 'member') {
    auth.switchDemoRole('member', selectedMemberId.value)
    router.push('/pt/member/dashboard')
    return
  }

  auth.switchDemoRole('instructor')
  router.push('/pt/dashboard')
}

function switchMember(memberId) {
  selectedMemberId.value = memberId
  auth.setDemoMember(memberId)
  router.push('/pt/member/dashboard')
}
</script>

<template>
  <div v-if="auth.isDemoMode" class="role-switcher">
    <span class="role-switcher__label">테스트 역할</span>
    <el-select v-model="selectedRole" size="small" aria-label="테스트 역할 선택">
      <el-option label="강사 화면" value="instructor" />
      <el-option label="회원 화면" value="member" />
    </el-select>
    <el-select
      v-if="auth.currentRole === 'member'"
      :model-value="selectedMemberId"
      size="small"
      aria-label="테스트 회원 선택"
      @update:model-value="switchMember"
    >
      <el-option v-for="member in store.members" :key="member.id" :label="member.name" :value="member.id" />
    </el-select>
  </div>
</template>
