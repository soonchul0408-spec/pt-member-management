<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  members: { type: Array, default: () => [] },
  memberships: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])
const form = ref(createForm())

function createForm() {
  return {
    memberId: props.members[0]?.id || '',
    membershipId: props.memberships[0]?.id || '',
    paidAt: new Date().toISOString().slice(0, 10),
    amount: 0,
    method: '카드',
    status: '결제 완료',
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = createForm()
  },
)

function submit() {
  if (!form.value.memberId || !form.value.amount) return
  emit('save', { ...form.value, amount: Number(form.value.amount) })
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog :model-value="modelValue" title="결제 기록 추가" width="520px" destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <el-form :model="form" label-position="top" class="dialog-form">
      <el-form-item label="회원">
        <el-select v-model="form.memberId" class="full-width">
          <el-option v-for="member in members" :key="member.id" :label="member.name" :value="member.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="회원권">
        <el-select v-model="form.membershipId" class="full-width">
          <el-option v-for="membership in memberships" :key="membership.id" :label="membership.type" :value="membership.id" />
        </el-select>
      </el-form-item>
      <div class="form-grid">
        <el-form-item label="결제일"><el-date-picker v-model="form.paidAt" type="date" value-format="YYYY-MM-DD" class="full-width" /></el-form-item>
        <el-form-item label="금액"><el-input-number v-model="form.amount" :min="0" :step="10000" class="full-width" /></el-form-item>
        <el-form-item label="결제 수단"><el-select v-model="form.method" class="full-width"><el-option label="카드" value="카드" /><el-option label="계좌이체" value="계좌이체" /><el-option label="현금" value="현금" /></el-select></el-form-item>
        <el-form-item label="상태"><el-select v-model="form.status" class="full-width"><el-option label="결제 완료" value="결제 완료" /><el-option label="분납 중" value="분납 중" /></el-select></el-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="form-actions">
        <el-button @click="emit('update:modelValue', false)">취소</el-button>
        <el-button type="primary" @click="submit">기록 저장</el-button>
      </div>
    </template>
  </el-dialog>
</template>
