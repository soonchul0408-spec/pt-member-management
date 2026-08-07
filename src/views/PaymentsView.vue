<script setup>
import { computed, ref } from 'vue'

import PaymentFormDialog from '@/components/pt/PaymentFormDialog.vue'
import { usePtStore } from '@/stores/ptStore'

const store = usePtStore()
const statusFilter = ref('전체')
const dialogOpen = ref(false)

const payments = computed(() => store.payments.filter((payment) => statusFilter.value === '전체' || payment.status === statusFilter.value).sort((a, b) => b.paidAt.localeCompare(a.paidAt)))
const pendingAmount = computed(() => store.payments.filter((payment) => payment.status === '분납 중').reduce((sum, payment) => sum + payment.amount, 0))
const formatCurrency = (value) => `${Number(value).toLocaleString('ko-KR')}원`

function memberName(memberId) {
  return store.getMember(memberId)?.name ?? '-'
}

function savePayment(payload) {
  if (!store.canEdit) return
  store.addPayment(payload)
}
</script>

<template>
  <div class="payments-page">
    <section class="page-intro"><div><p class="page-intro__eyebrow">MEMBERSHIP & PAYMENTS</p><h2>회원권·결제</h2><p>회원권 기간과 수업 잔여 횟수, 결제 상태를 함께 확인합니다.</p></div><el-button v-if="store.canEdit" type="primary" @click="dialogOpen = true">+ 결제 기록 추가</el-button></section>
    <section class="payment-summary"><div class="payment-summary__item"><span>결제 완료 누적</span><strong>{{ formatCurrency(store.totalRevenue) }}</strong></div><div class="payment-summary__item"><span>분납·확인 필요 금액</span><strong>{{ formatCurrency(pendingAmount) }}</strong></div><div class="payment-summary__item"><span>이용 중 회원권</span><strong>{{ store.activeMemberships.length }}건</strong></div><div class="payment-summary__item"><span>만료 임박·휴식</span><strong>{{ store.expiringMemberships.length }}건</strong></div></section>
    <section class="page-toolbar"><div class="page-toolbar__filters"><el-select v-model="statusFilter" style="width: 150px"><el-option label="전체 결제 상태" value="전체" /><el-option label="결제 완료" value="결제 완료" /><el-option label="분납 중" value="분납 중" /></el-select></div><span class="muted-text">{{ payments.length }}건 표시 중</span></section>
    <el-card class="page-card" shadow="never"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>결제일</th><th>회원</th><th>회원권</th><th>금액</th><th>결제 수단</th><th>회원권 기간</th><th>상태</th></tr></thead><tbody><tr v-for="payment in payments" :key="payment.id" class="is-clickable" @click="$router.push(`/pt/members/${payment.memberId}`)"><td>{{ payment.paidAt.replaceAll('-', '.') }}</td><td><strong>{{ memberName(payment.memberId) }}</strong></td><td>{{ store.memberships.find((item) => item.id === payment.membershipId)?.type ?? '-' }}</td><td><strong>{{ formatCurrency(payment.amount) }}</strong></td><td>{{ payment.method }}</td><td>{{ store.memberships.find((item) => item.id === payment.membershipId)?.startDate?.replaceAll('-', '.') }} ~ {{ store.memberships.find((item) => item.id === payment.membershipId)?.endDate?.replaceAll('-', '.') }}</td><td><el-tag :type="payment.status === '결제 완료' ? 'success' : 'warning'" size="small" effect="light">{{ payment.status }}</el-tag></td></tr></tbody></table></div><el-empty v-if="!payments.length" description="결제 기록이 없습니다." :image-size="90" /></el-card>
    <PaymentFormDialog v-if="store.canEdit" v-model="dialogOpen" :members="store.members" :memberships="store.memberships" @save="savePayment" />
  </div>
</template>
