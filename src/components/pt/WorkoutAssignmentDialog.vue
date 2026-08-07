<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultMemberId: { type: String, default: '' },
  members: { type: Array, default: () => [] },
  trainers: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])
const form = ref(createForm())

function createForm() {
  return {
    memberId: props.defaultMemberId || props.members[0]?.id || '',
    trainerId: props.trainers[0]?.id || 'trainer-1',
    date: new Date().toISOString().slice(0, 10),
    title: '',
    description: '',
    exercisesText: '',
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
  if (!form.value.memberId || !form.value.title.trim() || !form.value.date) return
  emit('save', {
    memberId: form.value.memberId,
    trainerId: form.value.trainerId,
    date: form.value.date,
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    exercises: form.value.exercisesText.split('\n').map((item) => item.trim()).filter(Boolean),
  })
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog :model-value="modelValue" title="회원 운동 과제 등록" width="620px" destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <el-form :model="form" label-position="top" class="dialog-form">
      <div class="form-grid">
        <el-form-item label="회원">
          <el-select v-model="form.memberId" class="full-width">
            <el-option v-for="member in members" :key="member.id" :label="member.name" :value="member.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="담당 트레이너">
          <el-select v-model="form.trainerId" class="full-width">
            <el-option v-for="trainer in trainers" :key="trainer.id" :label="trainer.name" :value="trainer.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="과제일" class="span-2">
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" class="full-width" />
        </el-form-item>
        <el-form-item label="운동 과제명" class="span-2">
          <el-input v-model="form.title" placeholder="예: 하체 근력 루틴" />
        </el-form-item>
        <el-form-item label="과제 설명" class="span-2">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="회원이 확인할 운동 목표와 주의사항을 작성하세요." />
        </el-form-item>
        <el-form-item label="운동 목록" class="span-2">
          <el-input v-model="form.exercisesText" type="textarea" :rows="5" placeholder="한 줄에 한 가지 운동을 입력하세요.&#10;예: 고블릿 스쿼트 3세트" />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="form-actions">
        <el-button @click="emit('update:modelValue', false)">취소</el-button>
        <el-button type="primary" @click="submit">운동 과제 저장</el-button>
      </div>
    </template>
  </el-dialog>
</template>
