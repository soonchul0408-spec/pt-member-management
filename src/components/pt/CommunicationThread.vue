<script setup>
import { computed, ref } from 'vue'

import { useAuthStore } from '@/stores/authStore'
import { usePtStore } from '@/stores/ptStore'

const props = defineProps({
  memberId: {
    type: String,
    required: true,
  },
})

const auth = useAuthStore()
const store = usePtStore()
const draft = ref('')
const messageType = ref(auth.isMember ? 'question' : 'feedback')

const messages = computed(() => store.getMemberCommunications(props.memberId))
const unreadCount = computed(() => store.getUnreadCommunicationCount(props.memberId))
const canWrite = computed(() => auth.isMember || store.canEdit)

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function submitMessage() {
  if (!draft.value.trim() || !canWrite.value) return
  store.addCommunication({ memberId: props.memberId, type: messageType.value, content: draft.value.trim() })
  draft.value = ''
}

function markRead(messageId) {
  store.markCommunicationRead(messageId)
}
</script>

<template>
  <div class="communication-thread">
    <div class="communication-thread__summary">
      <div>
        <p class="section-eyebrow">SHARED COMMUNICATION</p>
        <h2>소통·피드백</h2>
        <p class="muted-text">작성자와 작성 시간을 확인하며 같은 화면에서 질문과 피드백을 주고받습니다.</p>
      </div>
      <el-tag :type="unreadCount ? 'warning' : 'info'" effect="light" round>
        {{ unreadCount ? `읽지 않은 내용 ${unreadCount}개` : '모두 확인함' }}
      </el-tag>
    </div>

    <div v-if="messages.length" class="communication-list">
      <article
        v-for="message in messages"
        :key="message.id"
        class="communication-message"
        :class="`communication-message--${message.authorType}`"
      >
        <div class="communication-message__meta">
          <div class="communication-message__author">
            <el-tag :type="message.authorType === 'instructor' ? 'primary' : 'success'" size="small" effect="light">
              {{ message.authorType === 'instructor' ? '강사 작성' : '회원 작성' }}
            </el-tag>
            <strong>{{ message.authorName }}</strong>
            <span>{{ message.type === 'question' ? '질문' : '피드백' }}</span>
          </div>
          <time>{{ formatDateTime(message.createdAt) }}</time>
        </div>
        <p>{{ message.content }}</p>
        <div v-if="message.status === 'unread' && message.authorType !== (auth.isMember ? 'member' : 'instructor')" class="communication-message__actions">
          <el-tag type="warning" size="small" effect="plain">읽지 않음</el-tag>
          <el-button text type="primary" size="small" @click="markRead(message.id)">읽음 처리</el-button>
        </div>
      </article>
    </div>
    <el-empty v-else description="아직 주고받은 내용이 없습니다." :image-size="72" />

    <div v-if="canWrite" class="communication-composer">
      <div class="communication-composer__heading">
        <strong>{{ auth.isMember ? '강사에게 질문하기' : '회원에게 피드백 작성' }}</strong>
        <el-select v-model="messageType" size="small" class="communication-composer__type">
          <el-option v-if="auth.isMember" label="질문" value="question" />
          <el-option v-if="!auth.isMember" label="피드백" value="feedback" />
          <el-option v-if="!auth.isMember" label="코칭 메모" value="coaching" />
        </el-select>
      </div>
      <el-input v-model="draft" type="textarea" :rows="3" :placeholder="auth.isMember ? '운동이나 일정에 대해 강사에게 질문해 보세요.' : '회원의 기록을 확인하고 다음 행동을 안내해 주세요.'" />
      <div class="communication-composer__footer">
        <span class="muted-text">작성 내용은 이 브라우저의 localStorage에 저장됩니다.</span>
        <el-button type="primary" :disabled="!draft.trim()" @click="submitMessage">내용 보내기</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.communication-thread {
  display: grid;
  gap: 20px;
}

.communication-thread__summary,
.communication-message__meta,
.communication-composer__heading,
.communication-composer__footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.communication-thread__summary h2 {
  margin: 4px 0 0;
}

.communication-thread__summary .muted-text {
  margin-top: 8px;
}

.communication-list {
  display: grid;
  gap: 12px;
  max-height: 540px;
  overflow-y: auto;
  padding: 2px 4px 2px 2px;
}

.communication-message {
  width: min(82%, 680px);
  padding: 15px 17px;
  border: 1px solid #e8edf5;
  border-radius: 15px;
  background: #f8fafc;
}

.communication-message--member {
  justify-self: end;
  border-color: #d7f2e5;
  background: #f1fbf6;
}

.communication-message--instructor {
  justify-self: start;
  border-color: #dbe6ff;
  background: #f5f8ff;
}

.communication-message__meta {
  align-items: center;
  color: #8b96a8;
  font-size: 0.72rem;
}

.communication-message__author {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.communication-message__author strong {
  color: #29364d;
}

.communication-message p {
  margin: 12px 0 0;
  color: #4d5b72;
  font-size: 0.85rem;
  line-height: 1.7;
  white-space: pre-wrap;
}

.communication-message__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.communication-composer {
  display: grid;
  gap: 11px;
  padding: 17px;
  border: 1px solid #e8edf5;
  border-radius: 15px;
  background: #fff;
}

.communication-composer__heading {
  align-items: center;
}

.communication-composer__type {
  width: 112px;
}

.communication-composer__footer {
  align-items: center;
}

@media (max-width: 640px) {
  .communication-message {
    width: 100%;
  }

  .communication-thread__summary,
  .communication-composer__footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
