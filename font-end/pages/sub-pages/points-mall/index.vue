<template>
	<view class="points-mall-page">
		<view class="points-header">
			<text class="points-label">我的积分</text>
			<text class="points-value">{{ balance }}</text>
			<text class="points-tip">刷题打卡成功可获得 {{ config.checkinReward || 0 }} 积分</text>
		</view>

		<view class="section-card">
			<view class="section-title">积分兑换</view>
			<view v-if="exchangeItems.length === 0" class="empty-text">暂无可兑换优惠券</view>
			<view v-else class="exchange-list">
				<view v-for="item in exchangeItems" :key="item.id" class="exchange-card">
					<view class="exchange-left">
						<text v-if="item.name" class="coupon-name">{{ item.name }}</text>
						<text class="coupon-amount">¥{{ item.couponAmount || 0 }}</text>
						<text class="coupon-desc">{{ getCouponDesc(item) }}</text>
					</view>
					<view class="exchange-right">
						<text class="exchange-cost">{{ item.points || 0 }} 积分</text>
						<button
							class="exchange-btn"
							:disabled="!canExchangeItem(item) || exchangingId === item.id"
							:loading="exchangingId === item.id"
							@click="handleExchange(item)"
						>
							立即兑换
						</button>
					</view>
				</view>
			</view>
		</view>

		<view class="section-card">
			<view class="section-title">积分明细</view>
			<view v-if="loadingLogs" class="empty-text">加载中...</view>
			<view v-else-if="logs.length === 0" class="empty-text">暂无积分记录</view>
			<view v-else class="log-list">
				<view v-for="item in logs" :key="item.id" class="log-item">
					<view class="log-main">
						<text class="log-title">{{ logTitle(item) }}</text>
						<text class="log-time">{{ formatTime(item.createTime) }}</text>
					</view>
					<text :class="['log-amount', item.changeAmount >= 0 ? 'plus' : 'minus']">
						{{ item.changeAmount >= 0 ? '+' : '' }}{{ item.changeAmount }}
					</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
	getPointsConfig,
	getPointsBalance,
	getPointsLogs,
	exchangePointsCoupon,
} from '@/api/index'
import { useUserStore } from '@/store/user'
import { formatCouponRewardLabel } from '@/utils/format'

const userStore = useUserStore()
const balance = ref(0)
const logs = ref([])
const loadingLogs = ref(false)
const exchangingId = ref('')
const config = ref({
	enabled: true,
	checkinReward: 50,
	exchangeItems: [],
})

const exchangeItems = computed(() => {
	const list = Array.isArray(config.value.exchangeItems) ? config.value.exchangeItems : []
	return list.filter((item) => item && item.id)
})

const getCouponDesc = (item) =>
	formatCouponRewardLabel(item.couponAmount, item.couponMinAmount)

const canExchangeItem = (item) => {
	return config.value.enabled && balance.value >= Number(item.points || 0)
}

const ensureLogin = () => {
	if (userStore.isLoggedIn) return true
	uni.showToast({ title: '请先登录', icon: 'none' })
	setTimeout(() => {
		uni.navigateTo({ url: '/pages/login/index' })
	}, 1200)
	return false
}

const loadConfig = async () => {
	try {
		const res = await getPointsConfig()
		const items = Array.isArray(res.exchangeItems)
			? res.exchangeItems
			: res.exchangePoints
				? [{
					id: 'legacy',
					name: '',
					points: res.exchangePoints ?? 500,
					couponAmount: res.exchangeCouponAmount ?? 5,
					couponMinAmount: res.exchangeCouponMinAmount ?? 0,
				}]
				: []
		config.value = {
			enabled: res.enabled !== false,
			checkinReward: res.checkinReward ?? 50,
			exchangeItems: items,
		}
	} catch (error) {
		console.error(error)
	}
}

const loadBalance = async () => {
	if (!userStore.isLoggedIn) {
		balance.value = 0
		return
	}
	try {
		const res = await getPointsBalance()
		balance.value = res.balance ?? 0
	} catch (error) {
		console.error(error)
	}
}

const loadLogs = async () => {
	if (!userStore.isLoggedIn) {
		logs.value = []
		return
	}
	loadingLogs.value = true
	try {
		const res = await getPointsLogs({ page: 1, pageSize: 30 })
		logs.value = res.list || []
	} catch (error) {
		console.error(error)
	} finally {
		loadingLogs.value = false
	}
}

const refreshPage = async () => {
	await loadConfig()
	if (userStore.isLoggedIn) {
		await Promise.all([loadBalance(), loadLogs(), userStore.fetchUserInfo()])
	} else {
		balance.value = 0
		logs.value = []
	}
}

const handleExchange = async (item) => {
	if (!ensureLogin()) return
	if (!canExchangeItem(item)) {
		uni.showToast({ title: '积分不足', icon: 'none' })
		return
	}

	exchangingId.value = item.id
	try {
		const res = await exchangePointsCoupon(item.id ? { itemId: item.id } : {})
		balance.value = res.balance ?? balance.value
		uni.showToast({
			title: `兑换成功，获得${formatCouponRewardLabel(
				res.couponAmount || item.couponAmount,
				res.couponMinAmount ?? item.couponMinAmount,
			)}`,
			icon: 'success',
		})
		await Promise.all([loadLogs(), userStore.fetchUserInfo()])
	} catch (error) {
		uni.showToast({ title: error?.message || '兑换失败', icon: 'none' })
	} finally {
		exchangingId.value = ''
	}
}

const logTitle = (item) => {
	if (item.remark) return item.remark
	const map = {
		checkin: '刷题打卡奖励',
		exchange: '积分兑换优惠券',
		adjust: '积分调整',
	}
	return map[item.type] || '积分变动'
}

const formatTime = (value) => {
	const date = new Date(value)
	const pad = (num) => String(num).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

onShow(refreshPage)
</script>

<style scoped>
.points-mall-page {
	min-height: 100vh;
	background: #f5f7fb;
	padding: 24rpx;
	box-sizing: border-box;
}

.points-header {
	padding: 40rpx 32rpx;
	border-radius: 24rpx;
	background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	color: #fff;
	margin-bottom: 24rpx;
	box-shadow: 0 12rpx 32rpx rgba(37, 99, 235, 0.24);
}

.points-label {
	display: block;
	font-size: 26rpx;
	opacity: 0.9;
}

.points-value {
	display: block;
	margin-top: 12rpx;
	font-size: 72rpx;
	font-weight: 700;
	line-height: 1.1;
}

.points-tip {
	display: block;
	margin-top: 16rpx;
	font-size: 24rpx;
	opacity: 0.85;
}

.section-card {
	background: #fff;
	border-radius: 24rpx;
	padding: 28rpx;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #111827;
	margin-bottom: 20rpx;
}

.exchange-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.exchange-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	padding: 24rpx;
	border-radius: 20rpx;
	background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
	border: 1rpx solid #fed7aa;
}

.exchange-left {
	flex: 1;
	min-width: 0;
}

.coupon-name {
	display: block;
	margin-bottom: 8rpx;
	font-size: 24rpx;
	color: #9a3412;
}

.coupon-amount {
	display: block;
	font-size: 44rpx;
	font-weight: 700;
	color: #ea580c;
	line-height: 1.2;
}

.coupon-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #9a3412;
}

.exchange-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 12rpx;
	flex-shrink: 0;
}

.exchange-cost {
	font-size: 24rpx;
	color: #7c2d12;
}

.exchange-btn {
	margin: 0;
	padding: 0 28rpx;
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 999rpx;
	background: #2563eb;
	color: #fff;
	font-size: 26rpx;
}

.exchange-btn[disabled] {
	background: #cbd5e1;
	color: #fff;
}

.empty-text {
	padding: 40rpx 0;
	text-align: center;
	color: #9ca3af;
	font-size: 26rpx;
}

.log-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.log-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #f3f4f6;
}

.log-item:last-child {
	padding-bottom: 0;
	border-bottom: none;
}

.log-main {
	flex: 1;
	min-width: 0;
}

.log-title {
	display: block;
	font-size: 28rpx;
	color: #111827;
}

.log-time {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #9ca3af;
}

.log-amount {
	font-size: 32rpx;
	font-weight: 700;
}

.log-amount.plus {
	color: #16a34a;
}

.log-amount.minus {
	color: #ef4444;
}
</style>
