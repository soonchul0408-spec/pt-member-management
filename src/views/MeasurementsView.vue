<script setup>
import { computed, ref } from 'vue'

import MeasurementFormDialog from '@/components/pt/MeasurementFormDialog.vue'
import { usePtStore } from '@/stores/ptStore'

const store = usePtStore()
const memberFilter = ref('전체')
const dialogOpen = ref(false)

const measurements = computed(() => store.measurements.filter((item) => memberFilter.value === '전체' || item.memberId === memberFilter.value).sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)))
const activeMeasurementCount = computed(() => new Set(store.measurements.map((item) => item.memberId)).size)

function memberName(memberId) {
  return store.getMember(memberId)?.name ?? '-'
}

function saveMeasurement(payload) {
  if (!store.canEdit) return
  store.addMeasurement(payload)
}
</script>

<template>
  <div class="measurements-page">
    <section class="page-intro"><div><p class="page-intro__eyebrow">GOALS & MEASUREMENTS</p><h2>운동 목표·체성분</h2><p>회원별 운동 목표와 체성분 변화를 기록하고 다음 수업 방향을 잡습니다.</p></div><el-button v-if="store.canEdit" type="primary" @click="dialogOpen = true">+ 체성분 기록 추가</el-button></section>
    <section class="stat-grid">
      <el-card class="stat-card" shadow="never"><div class="stat-card__top"><span class="stat-card__label">측정 기록</span><span class="stat-card__symbol">↗</span></div><div class="stat-card__value-row"><strong class="stat-card__value">{{ store.measurements.length }}</strong><span class="stat-card__unit">건</span></div><p class="stat-card__caption">전체 측정 데이터</p></el-card>
      <el-card class="stat-card" shadow="never"><div class="stat-card__top"><span class="stat-card__label">측정 회원</span><span class="stat-card__symbol">◎</span></div><div class="stat-card__value-row"><strong class="stat-card__value">{{ activeMeasurementCount }}</strong><span class="stat-card__unit">명</span></div><p class="stat-card__caption">최근 기록이 있는 회원</p></el-card>
      <el-card class="stat-card" shadow="never"><div class="stat-card__top"><span class="stat-card__label">목표 관리 회원</span><span class="stat-card__symbol">✓</span></div><div class="stat-card__value-row"><strong class="stat-card__value">{{ store.activeMembers.length }}</strong><span class="stat-card__unit">명</span></div><p class="stat-card__caption">활성 회원 기준</p></el-card>
      <el-card class="stat-card" shadow="never"><div class="stat-card__top"><span class="stat-card__label">기록 방식</span><span class="stat-card__symbol">⌁</span></div><div class="stat-card__value-row"><strong class="stat-card__value" style="font-size: 1.25rem">개인별</strong></div><p class="stat-card__caption">회원 상세에서 변화 확인</p></el-card>
    </section>
    <section class="page-toolbar"><div class="page-toolbar__filters"><el-select v-model="memberFilter" style="width: 180px"><el-option label="전체 회원" value="전체" /><el-option v-for="member in store.members" :key="member.id" :label="member.name" :value="member.id" /></el-select></div><span class="muted-text">{{ measurements.length }}건 표시 중</span></section>
    <el-card class="page-card" shadow="never"><div v-if="measurements.length" class="data-table-wrap"><table class="data-table"><thead><tr><th>측정일</th><th>회원</th><th>운동 목표</th><th>체중</th><th>골격근량</th><th>체지방률</th><th></th></tr></thead><tbody><tr v-for="item in measurements" :key="item.id" class="is-clickable" @click="$router.push(`/pt/members/${item.memberId}`)"><td>{{ item.measuredAt.replaceAll('-', '.') }}</td><td><div class="table-cell-with-avatar"><div class="member-avatar" :style="{ background: store.getMember(item.memberId)?.avatarColor }">{{ memberName(item.memberId).slice(0, 1) }}</div><strong>{{ memberName(item.memberId) }}</strong></div></td><td>{{ store.getMember(item.memberId)?.goal }}</td><td><strong>{{ item.weight }}kg</strong></td><td>{{ item.muscleMass }}kg</td><td>{{ item.bodyFat }}%</td><td><el-button text type="primary" @click.stop="$router.push(`/pt/members/${item.memberId}`)">상세</el-button></td></tr></tbody></table></div><el-empty v-else description="체성분 기록이 없습니다." :image-size="90" /></el-card>
    <MeasurementFormDialog v-if="store.canEdit" v-model="dialogOpen" :members="store.members" @save="saveMeasurement" />
  </div>
</template>
