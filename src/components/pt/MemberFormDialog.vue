<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  member: { type: Object, default: null },
  trainers: { type: Array, default: () => [] },
  statuses: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])
const formRef = ref()
const form = ref(createBlankForm())

function createBlankForm() {
  return {
    name: '',
    phone: '',
    email: '',
    birthYear: '',
    gender: '남성',
    joinedAt: new Date().toISOString().slice(0, 10),
    trainerId: props.trainers[0]?.id ?? '',
    goal: '',
    caution: '',
    status: '활성',
  }
}

watch(
  () => [props.member, props.modelValue],
  () => {
    if (props.member && props.modelValue) form.value = { ...props.member }
    if (!props.member && props.modelValue) form.value = createBlankForm()
  },
  { immediate: true },
)

const rules = {
  name: [{ required: true, message: '회원명을 입력하세요.', trigger: 'blur' }],
  phone: [{ required: true, message: '연락처를 입력하세요.', trigger: 'blur' }],
  trainerId: [{ required: true, message: '담당 트레이너를 선택하세요.', trigger: 'change' }],
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('save', { ...form.value })
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="member ? '회원 정보 수정' : '새 회원 등록'"
    width="620px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="dialog-form">
      <div class="form-grid">
        <el-form-item label="회원명" prop="name">
          <el-input v-model="form.name" placeholder="이름을 입력하세요" />
        </el-form-item>
        <el-form-item label="연락처" prop="phone">
          <el-input v-model="form.phone" placeholder="010-0000-0000" />
        </el-form-item>
        <el-form-item label="이메일">
          <el-input v-model="form.email" placeholder="example@email.com" />
        </el-form-item>
        <el-form-item label="출생연도">
          <el-input v-model="form.birthYear" placeholder="1990" />
        </el-form-item>
        <el-form-item label="성별">
          <el-select v-model="form.gender" class="full-width">
            <el-option label="남성" value="남성" />
            <el-option label="여성" value="여성" />
            <el-option label="기타" value="기타" />
          </el-select>
        </el-form-item>
        <el-form-item label="등록일">
          <el-date-picker v-model="form.joinedAt" type="date" value-format="YYYY-MM-DD" class="full-width" />
        </el-form-item>
        <el-form-item label="담당 트레이너" prop="trainerId">
          <el-select v-model="form.trainerId" class="full-width">
            <el-option v-for="trainer in trainers" :key="trainer.id" :label="trainer.name" :value="trainer.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="회원 상태">
          <el-select v-model="form.status" class="full-width">
            <el-option v-for="status in statuses" :key="status" :label="status" :value="status" />
          </el-select>
        </el-form-item>
        <el-form-item label="운동 목표" class="span-2">
          <el-input v-model="form.goal" placeholder="회원이 기대하는 목표를 작성하세요" />
        </el-form-item>
        <el-form-item label="주의사항·컨디션 메모" class="span-2">
          <el-input v-model="form.caution" type="textarea" :rows="3" placeholder="부상 이력, 주의 동작 등을 기록하세요" />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="form-actions">
        <el-button @click="emit('update:modelValue', false)">취소</el-button>
        <el-button type="primary" @click="submit">저장하기</el-button>
      </div>
    </template>
  </el-dialog>
</template>
