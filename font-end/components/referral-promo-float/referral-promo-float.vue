<template>
	<view v-if="visible" class="referral-promo-float" :class="{ 'is-enter': entered }">
		<view class="referral-promo-chip">
			<view class="referral-promo-main" @click="handleClick">
				<view class="referral-promo-icon-wrap">
					<text class="referral-promo-icon">🎁</text>
				</view>
				<view class="referral-promo-copy">
					<text class="referral-promo-title">邀请新用户</text>
					<text class="referral-promo-sub">{{ promoSubText }}</text>
				</view>
				<text class="referral-promo-arrow">›</text>
			</view>
			<view class="referral-promo-close" @click.stop="handleClose">
				<app-icon name="close" :size="18" color="#b45309" />
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import AppIcon from '@/components/app-icon/app-icon.vue';
import { useUserStore } from '@/store/user';
import { getReferralConfig } from '@/api/index';
import { formatCouponRewardLabel } from '@/utils/format';

const props = defineProps({
	hidden: {
		type: Boolean,
		default: false,
	},
});

const userStore = useUserStore();
const entered = ref(false);
const dismissed = ref(false);
const configLoaded = ref(false);
const config = ref({
	enabled: true,
	inviteCountPerReward: 3,
	couponAmount: 5,
	couponMinAmount: 0,
	maxCouponsPerUser: 10,
});

const promoSubText = computed(() => {
	const rewardLabel = formatCouponRewardLabel(
		config.value.couponAmount,
		config.value.couponMinAmount,
	);
	return `得${rewardLabel}`;
});

const visible = computed(
	() => !props.hidden && configLoaded.value && config.value.enabled && !dismissed.value,
);

const loadConfig = async () => {
	try {
		const res = await getReferralConfig();
		config.value = { ...config.value, ...(res || {}) };
	} catch (error) {
		console.warn('拉新配置加载失败:', error);
	} finally {
		configLoaded.value = true;
	}
};

const handleClose = () => {
	dismissed.value = true;
};

const handleClick = () => {
	if (!userStore.isLoggedIn) {
		uni.showToast({ title: '请先登录', icon: 'none' });
		setTimeout(() => {
			uni.navigateTo({ url: '/pages/login/index' });
		}, 800);
		return;
	}
	uni.navigateTo({ url: '/pages/sub-pages/invite/index' });
};

watch(visible, (show) => {
	if (show) {
		setTimeout(() => {
			entered.value = true;
		}, 60);
	} else {
		entered.value = false;
	}
});

onMounted(() => {
	// 清理旧版本持久化关闭标记，关闭状态仅当前页面会话有效
	uni.removeStorageSync('home_referral_promo_closed');
	loadConfig();
});

defineExpose({ reload: loadConfig });
</script>

<style scoped lang="scss">
.referral-promo-float {
	position: fixed;
	right: 20rpx;
	bottom: calc(140rpx + env(safe-area-inset-bottom));
	z-index: 980;
	pointer-events: none;
	opacity: 0;
	transform: translateY(16rpx);
	transition: opacity 0.28s ease, transform 0.28s ease;
}

.referral-promo-float.is-enter {
	opacity: 1;
	transform: translateY(0);
}

.referral-promo-chip {
	position: relative;
	pointer-events: auto;
	max-width: 360rpx;
	padding: 18rpx 18rpx 14rpx 14rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
	border: 1rpx solid rgba(251, 146, 60, 0.35);
	box-shadow: 0 8rpx 28rpx rgba(249, 115, 22, 0.18);
	animation: referralPromoPulse 2.8s ease-in-out infinite;
}

.referral-promo-main {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.referral-promo-icon-wrap {
	width: 52rpx;
	height: 52rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.92);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.referral-promo-icon {
	font-size: 28rpx;
	line-height: 1;
}

.referral-promo-copy {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.referral-promo-title {
	font-size: 26rpx;
	font-weight: 700;
	color: #c2410c;
	line-height: 1.2;
}

.referral-promo-sub {
	margin-top: 2rpx;
	font-size: 20rpx;
	color: #ea580c;
	line-height: 1.3;
}

.referral-promo-arrow {
	font-size: 32rpx;
	color: #fb923c;
	line-height: 1;
	flex-shrink: 0;
}

.referral-promo-close {
	position: absolute;
	top: 4rpx;
	right: 4rpx;
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.referral-promo-close:active,
.referral-promo-main:active {
	opacity: 0.88;
}

@keyframes referralPromoPulse {
	0%,
	100% {
		box-shadow: 0 8rpx 28rpx rgba(249, 115, 22, 0.18);
	}
	50% {
		box-shadow: 0 10rpx 32rpx rgba(249, 115, 22, 0.28);
	}
}
</style>
