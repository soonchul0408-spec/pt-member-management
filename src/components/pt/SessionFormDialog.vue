<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  session: { type: Object, default: null },
  defaultMemberId: { type: String, default: '' },
  members: { type: Array, default: () => [] },
  trainers: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])
const form = ref(createBlankForm())

function today() {
  return new Date().toISOString().slice(0, 10)
}

function createBlankForm() {
  return {
    memberId: props.defaultMemberId || props.members[0]?.id || '',
    trainerId: props.trainers[0]?.id || '',
    date: today(),
    startTime: '10:00',
    duration: 60,
    status: '예정',
    focus: '',
    exercises: '',
    condition: '보통',
    memo: '',
    nextPlan: '',
    videoUrl: '',
  }
}

watch(
  () => [props.session, props.modelValue, props.defaultMemberId],
  () => {
    if (props.session && props.modelValue) form.value = { ...props.session }
    if (!props.session && props.modelValue) form.value = { ...createBlankForm(), memberId: props.defaultMemberId || props.members[0]?.id || '' }
  },
  { immediate: true },
)

function submit() {
  if (!form.value.memberId || !form.value.trainerId || !form.value.date) return
  emit('save', { ...form.value, duration: Number(form.value.duration) })
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="session ? '수업 기록 수정' : 'PT 수업 등록'"
    width="680px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
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
        <el-form-item label="수업일">
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" class="full-width" />
        </el-form-item>
        <el-form-item label="시작 시간">
          <el-time-picker v-model="form.startTime" format="HH:mm" value-format="HH:mm" class="full-width" />
        </el-form-item>
        <el-form-item label="수업 시간(분)">
          <el-input-number v-model="form.duration" :min="20" :max="180" class="full-width" />
        </el-form-item>
        <el-form-item label="상태">
          <el-select v-model="form.status" class="full-width">
            <el-option label="예정" value="예정" />
            <el-option label="완료" value="완료" />
            <el-option label="취소" value="취소" />
          </el-select>
        </el-form-item>
        <el-form-item label="운동 부위·초점" class="span-2">
          <el-input v-model="form.focus" placeholder="예: 하체 근력, 코어·자세 교정" />
        </el-form-item>
        <el-form-item label="진행한 운동" class="span-2">
          <el-input v-model="form.exercises" type="textarea" :rows="2" placeholder="운동명, 세트·횟수·중량을 기록하세요" />
        </el-form-item>
        <el-form-item label="회원 컨디션">
          <el-select v-model="form.condition" class="full-width">
            <el-option label="좋음" value="좋음" />
            <el-option label="보통" value="보통" />
            <el-option label="피로함" value="피로함" />
          </el-select>
        </el-form-item>
        <el-form-item label="다음 수업 계획">
          <el-input v-model="form.nextPlan" placeholder="다음 수업에서 확인할 내용" />
        </el-form-item>
        <el-form-item label="트레이너 메모" class="span-2">
          <el-input v-model="form.memo" type="textarea" :rows="3" placeholder="수업 후 회원 반응과 관찰 내용을 작성하세요" />
        </el-form-item>
        <el-form-item label="웹에서 재생할 수업 영상 URL" class="span-2">
          <el-input v-model="form.videoUrl" placeholder="MP4, YouTube 또는 Vimeo 영상 주소를 입력하세요" />
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
