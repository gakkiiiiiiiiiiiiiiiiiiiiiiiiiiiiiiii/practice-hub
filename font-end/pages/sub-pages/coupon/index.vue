<template>
	<view class="coupon-page">
		<view class="tabs">
			<text :class="['tab', status === '' ? 'active' : '']" @click="switchStatus('')">全部</text>
			<text :class="['tab', status === 'unused' ? 'active' : '']" @click="switchStatus('unused')">未使用</text>
			<text :class="['tab', status === 'used' ? 'active' : '']" @click="switchStatus('used')">已使用</text>
		</view>

		<view v-if="loading" class="empty">加载中...</view>
		<view v-else-if="coupons.length === 0" class="empty">暂无优惠券</view>
		<view v-else class="list">
			<view v-for="item in coupons" :key="item.id" class="coupon-card">
				<view class="left">
					<text class="amount">¥{{ item.amount }}</text>
					<text class="label">{{ item.label }}</text>
				</view>
				<view class="right">
					<text class="status">{{ statusText(item.status) }}</text>
					<text class="expire" v-if="item.expireTime">有效期至 {{ formatDate(item.expireTime) }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMyCoupons } from '@/api/index'

const loading = ref(false)
const status = ref('')
const coupons = ref([])

const loadCoupons = async () => {
	loading.value = true
	try {
		coupons.value = await getMyCoupons(status.value ? { status: status.value } : {})
	} catch (error) {
		console.error(error)
	} finally {
		loading.value = false
	}
}

const switchStatus = (next) => {
	status.value = next
	loadCoupons()
}

const statusText = (value) => {
	const map = { unused: '未使用', used: '已使用', expired: '已过期' }
	return map[value] || value
}

const formatDate = (value) => {
	const date = new Date(value)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onShow(loadCoupons)
</script>

<style scoped>
.coupon-page {
	min-height: 100vh;
	background: #f5f7fb;
}
.tabs {
	display: flex;
	background: #fff;
	padding: 16rpx 24rpx;
	gap: 24rpx;
}
.tab {
	padding: 12rpx 24rpx;
	border-radius: 999rpx;
	color: #6b7280;
	background: #f3f4f6;
	font-size: 26rpx;
}
.tab.active {
	background: #dbeafe;
	color: #2563eb;
}
.list {
	padding: 24rpx;
}
.coupon-card {
	display: flex;
	justify-content: space-between;
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx;
	margin-bottom: 20rpx;
}
.amount {
	display: block;
	font-size: 44rpx;
	font-weight: 700;
	color: #ef4444;
}
.label,
.expire,
.status {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #6b7280;
}
.empty {
	padding: 80rpx 0;
	text-align: center;
	color: #9ca3af;
}
</style>
