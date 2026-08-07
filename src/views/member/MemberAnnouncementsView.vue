<script setup>
import { computed } from 'vue'

import { usePtStore } from '@/stores/ptStore'

const store = usePtStore()
const announcements = computed(() => store.getAnnouncements())

function formatDate(value) {
  return value ? new Date(value).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'
}
</script>

<template>
  <div class="member-page">
    <div class="page-intro"><div><p class="section-eyebrow">ANNOUNCEMENTS</p><h2>강사 공지사항</h2><p>센터와 강사가 등록한 공지사항을 확인하세요.</p></div><el-tag type="success" effect="light" round>회원 화면</el-tag></div>
    <el-card class="panel-card announcements-card" shadow="never">
      <div v-if="announcements.length" class="announcement-list"><article v-for="announcement in announcements" :key="announcement.id" class="announcement-item"><div class="announcement-item__meta"><el-tag type="info" size="small" effect="light">공지</el-tag><span>{{ formatDate(announcement.createdAt) }} · {{ announcement.author }}</span></div><h3>{{ announcement.title }}</h3><p>{{ announcement.content }}</p></article></div>
      <el-empty v-else description="등록된 공지사항이 없습니다." :image-size="100" />
    </el-card>
  </div>
</template>

<style scoped>
.page-intro { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-intro h2 { margin: 4px 0 0; color: #1e2f4d; font-size: 1.5rem; }
.page-intro p:not(.section-eyebrow) { margin: 9px 0 0; color: #7c8799; font-size: 0.86rem; }
.announcements-card { margin-top: 18px; }
.announcement-list { display: grid; gap: 12px; }
.announcement-item { padding: 17px; border: 1px solid #e8edf5; border-radius: 14px; background: #fff; }
.announcement-item__meta { display: flex; align-items: center; gap: 9px; color: #8b96a8; font-size: 0.72rem; }
.announcement-item h3 { margin: 13px 0 7px; color: #34445e; font-size: 0.92rem; }
.announcement-item p { margin: 0; color: #617087; font-size: 0.82rem; line-height: 1.7; }
@media (max-width: 520px) { .page-intro { flex-direction: column; } }
</style>
