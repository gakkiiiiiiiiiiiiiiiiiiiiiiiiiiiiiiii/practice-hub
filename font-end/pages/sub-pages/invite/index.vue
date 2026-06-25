<template>
	<view class="invite-page">
		<view class="hero-card">
			<text class="title">邀请好友得优惠券</text>
			<text class="desc" v-if="config.enabled">
				每邀请 {{ config.inviteCountPerReward }} 位新用户，可获得 {{ couponRewardText }}，最多 {{ config.maxCouponsPerUser }} 张
			</text>
			<text class="desc" v-else>拉新活动暂未开启</text>
		</view>

		<view class="stats-card" v-if="userStore.isLoggedIn">
			<view class="stat-item">
				<text class="stat-value">{{ stats.referralCount || 0 }}</text>
				<text class="stat-label">已邀请人数</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ stats.unusedCouponCount || 0 }}</text>
				<text class="stat-label">可用优惠券</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ stats.progressInCycle || 0 }}/{{ config.inviteCountPerReward || 3 }}</text>
				<text class="stat-label">本轮进度</text>
			</view>
		</view>

		<button class="share-btn" open-type="share" :disabled="!userStore.isLoggedIn || !config.enabled">
			{{ userStore.isLoggedIn ? '分享给好友' : '请先登录' }}
		</button>

		<view class="link-row" @click="goCoupons">
			<text>查看我的优惠券</text>
			<text class="arrow">›</text>
		</view>
	</view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { formatCouponRewardLabel } from '@/utils/format'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getReferralConfig, getReferralStats } from '@/api/index'
import { getReferralShare, toTimelineShare } from '@/utils/share'

const userStore = useUserStore()
const config = ref({
	enabled: true,
	inviteCountPerReward: 3,
	couponAmount: 5,
	couponMinAmount: 0,
	maxCouponsPerUser: 10,
})
const stats = ref({})

const couponRewardText = computed(() =>
	formatCouponRewardLabel(config.value.couponAmount, config.value.couponMinAmount),
)

const loadData = async () => {
	try {
		const configRes = await getReferralConfig()
		config.value = { ...config.value, ...(configRes || {}) }
	} catch (error) {
		console.error(error)
	}
	if (userStore.isLoggedIn) {
		try {
			stats.value = await getReferralStats()
		} catch (error) {
			console.error(error)
		}
	}
}

const goCoupons = () => {
	uni.navigateTo({ url: '/pages/sub-pages/coupon/index' })
}

onShareAppMessage(() => getReferralShare(userStore.userInfo?.id))
onShareTimeline(() => toTimelineShare(getReferralShare(userStore.userInfo?.id)))

onMounted(loadData)
</script>

<style scoped>
.invite-page {
	min-height: 100vh;
	padding: 32rpx;
	background: #f5f7fb;
}
.hero-card,
.stats-card {
	background: #fff;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
}
.title {
	display: block;
	font-size: 36rpx;
	font-weight: 700;
	color: #111827;
}
.desc {
	display: block;
	margin-top: 16rpx;
	font-size: 28rpx;
	color: #6b7280;
	line-height: 1.6;
}
.stats-card {
	display: flex;
	justify-content: space-between;
}
.stat-item {
	flex: 1;
	text-align: center;
}
.stat-value {
	display: block;
	font-size: 40rpx;
	font-weight: 700;
	color: #2563eb;
}
.stat-label {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #6b7280;
}
.share-btn {
	margin-top: 8rpx;
	background: #2563eb;
	color: #fff;
	border-radius: 999rpx;
}
.link-row {
	margin-top: 32rpx;
	display: flex;
	justify-content: space-between;
	padding: 28rpx 32rpx;
	background: #fff;
	border-radius: 20rpx;
	color: #374151;
}
.arrow {
	color: #9ca3af;
}
</style>
