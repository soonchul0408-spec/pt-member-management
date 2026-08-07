<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultMemberId: { type: String, default: '' },
  members: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])
const form = ref(createForm())

function createForm() {
  return {
    memberId: props.defaultMemberId || props.members[0]?.id || '',
    measuredAt: new Date().toISOString().slice(0, 10),
    weight: '',
    muscleMass: '',
    bodyFat: '',
  }
}

watch(
  () => [props.modelValue, props.defaultMemberId],
  () => {
    if (props.modelValue) form.value = { ...createForm(), memberId: props.defaultMemberId || props.members[0]?.id || '' }
  },
  { immediate: true },
)

function submit() {
  if (!form.value.memberId || !form.value.measuredAt) return
  emit('save', {
    ...form.value,
    weight: Number(form.value.weight),
    muscleMass: Number(form.value.muscleMass),
    bodyFat: Number(form.value.bodyFat),
  })
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog :model-value="modelValue" title="체성분 기록 추가" width="520px" destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <el-form :model="form" label-position="top" class="dialog-form">
      <el-form-item label="회원">
        <el-select v-model="form.memberId" class="full-width">
          <el-option v-for="member in members" :key="member.id" :label="member.name" :value="member.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="측정일">
        <el-date-picker v-model="form.measuredAt" type="date" value-format="YYYY-MM-DD" class="full-width" />
      </el-form-item>
      <div class="form-grid">
        <el-form-item label="체중(kg)"><el-input-number v-model="form.weight" :min="0" :precision="1" class="full-width" /></el-form-item>
        <el-form-item label="골격근량(kg)"><el-input-number v-model="form.muscleMass" :min="0" :precision="1" class="full-width" /></el-form-item>
        <el-form-item label="체지방률(%)" class="span-2"><el-input-number v-model="form.bodyFat" :min="0" :precision="1" class="full-width" /></el-form-item>
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
