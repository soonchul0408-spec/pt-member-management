<script setup>
import { computed, ref, watch } from 'vue'

import {
  EXPERIENCE_LEVELS,
  PREFERRED_TIMES,
  WEEKLY_FREQUENCIES,
} from '@/services/memberOnboarding'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  onboarding: { type: Object, default: () => ({}) },
  isSample: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])
const formRef = ref()
const form = ref(createForm())
const completionRequested = ref(false)

function createForm() {
  return {
    exerciseGoal: '',
    experienceLevel: '',
    weeklyFrequency: '',
    preferredTime: '',
    trainerNote: '',
  }
}

function resetForm() {
  form.value = {
    ...createForm(),
    exerciseGoal: props.onboarding?.exerciseGoal || '',
    experienceLevel: props.onboarding?.experienceLevel || '',
    weeklyFrequency: props.onboarding?.weeklyFrequency || '',
    preferredTime: props.onboarding?.preferredTime || '',
    trainerNote: props.onboarding?.trainerNote || '',
  }
  completionRequested.value = props.onboarding?.onboardingStatus === '관리 시작 준비 완료'
}

watch(
  () => [props.modelValue, props.onboarding],
  () => {
    if (props.modelValue) resetForm()
  },
  { immediate: true },
)

const rules = computed(() => (completionRequested.value
  ? { exerciseGoal: [{ required: true, message: '온보딩을 완료하려면 운동 목표를 입력하세요.', trigger: 'blur' }] }
  : {}))

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  emit('save', {
    ...form.value,
    onboardingCompleted: completionRequested.value,
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="초기 관리 정보 설정"
    width="620px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="onboarding-dialog__intro">상담에서 확인한 목표를 바탕으로 회원을 어떤 방향으로 관리할지 정리합니다. 저장 후에도 강사가 수정할 수 있습니다.</p>
    <el-alert v-if="isSample" type="info" :closable="false" show-icon title="샘플 회원입니다.">샘플 데이터는 실제 회원 정보로 저장하지 않습니다.</el-alert>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="dialog-form" :disabled="isSample">
      <el-form-item label="운동 목표" prop="exerciseGoal">
        <el-input v-model="form.exerciseGoal" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="회원과 확인한 운동 목표를 입력하세요" />
      </el-form-item>

      <div class="form-grid">
        <el-form-item label="현재 운동 경험">
          <el-select v-model="form.experienceLevel" class="full-width" clearable placeholder="선택하세요">
            <el-option v-for="level in EXPERIENCE_LEVELS" :key="level" :label="level" :value="level" />
          </el-select>
        </el-form-item>
        <el-form-item label="주당 희망 운동 횟수">
          <el-select v-model="form.weeklyFrequency" class="full-width" clearable placeholder="선택하세요">
            <el-option v-for="frequency in WEEKLY_FREQUENCIES" :key="frequency" :label="frequency" :value="frequency" />
          </el-select>
        </el-form-item>
        <el-form-item label="선호 운동 시간대">
          <el-select v-model="form.preferredTime" class="full-width" clearable placeholder="선택하세요">
            <el-option v-for="time in PREFERRED_TIMES" :key="time" :label="time" :value="time" />
          </el-select>
        </el-form-item>
        <el-form-item label="온보딩 상태">
          <el-checkbox v-model="completionRequested">이번 저장을 ‘관리 시작 준비 완료’로 표시</el-checkbox>
        </el-form-item>
      </div>

      <el-form-item label="트레이너 관리 메모">
        <el-input v-model="form.trainerNote" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="회원에게 바로 노출하지 않을 내부 관리 메모를 작성하세요" />
        <small class="onboarding-dialog__hint">이 메모는 강사 화면에서만 확인할 수 있습니다.</small>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="form-actions">
        <el-button @click="emit('update:modelValue', false)">취소</el-button>
        <el-button type="primary" :disabled="isSample" @click="submit">온보딩 정보 저장</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.onboarding-dialog__intro {
  margin: -4px 0 18px;
  color: #68768b;
  font-size: 0.8rem;
  line-height: 1.7;
}

.onboarding-dialog__hint {
  display: block;
  margin-top: 5px;
  color: #8b96a8;
  font-size: 0.7rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .onboarding-dialog__intro {
    font-size: 0.76rem;
  }
}
</style>
