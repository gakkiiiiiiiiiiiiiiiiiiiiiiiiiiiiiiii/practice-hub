<template>
	<view class="user-page">
		<!-- 头部用户信息 -->
		<view class="user-header">
			<view class="header-bg"></view>
			<view class="user-info" v-if="userStore.isLoggedIn">
				<image
					class="user-avatar"
					:src="userStore.userInfo?.avatar || defaultAvatar"
					@click="handleAvatarClick"
				></image>
				<view class="user-details">
					<text class="user-name">{{ userStore.userInfo?.nickname || '用户' }}</text>
					<view class="user-badges">
						<text class="vip-badge" v-if="userStore.isVip">VIP</text>
						<text class="trial-badge" v-else>试用版</text>
					</view>
				</view>
			</view>
			<view class="login-prompt" v-else @click="handleLogin">
				<image class="default-avatar" :src="defaultAvatar"></image>
				<text class="login-text">点击登录</text>
			</view>
		</view>

		<!-- 订单状态栏 -->
		<view class="order-status" v-if="userStore.isLoggedIn">
			<view class="status-item" @click="handleOrderStatus('pending')">
				<app-icon name="clock" :size="48" class="status-icon" />
				<text class="status-text">待支付</text>
				<text class="status-badge" v-if="orderCounts.pending > 0">{{ orderCounts.pending }}</text>
			</view>
			<view class="status-item" @click="handleOrderStatus('paid')">
				<app-icon name="check" :size="48" class="status-icon" />
				<text class="status-text">已完成</text>
			</view>
			<view class="status-item" @click="handleOrderStatus('refund')">
				<app-icon name="arrow-right" :size="48" class="status-icon" style="transform: rotate(180deg)" />
				<text class="status-text">退款</text>
			</view>
		</view>

		<!-- 列表菜单 -->
		<view class="menu-list">
			<view class="menu-group">
				<view class="menu-item" @click="handleActivation">
					<view class="menu-left">
						<app-icon name="ticket" :size="40" class="menu-icon" />
						<text class="menu-text">使用激活码</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
				<view class="menu-item" @click="handleMyBanks">
					<view class="menu-left">
						<app-icon name="book" :size="40" class="menu-icon" />
						<text class="menu-text">我的题库</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
				<view class="menu-item" @click="handleTrajectory">
					<view class="menu-left">
						<app-icon name="chart" :size="40" class="menu-icon" />
						<text class="menu-text">学习轨迹</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
			</view>

			<view class="menu-group">
				<view class="menu-item" @click="handleSettings">
					<view class="menu-left">
						<app-icon name="settings" :size="40" class="menu-icon" />
						<text class="menu-text">设置</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
				<view class="menu-item" @click="handleAbout">
					<view class="menu-left">
						<app-icon name="info" :size="40" class="menu-icon" />
						<text class="menu-text">关于我们</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
			</view>

			<view class="menu-group" v-if="userStore.isLoggedIn">
				<view class="menu-item logout" @click="handleLogout">
					<view class="menu-left">
						<app-icon name="logout" :size="40" class="menu-icon" />
						<text class="menu-text">退出登录</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { get } from '@/utils/request';
import { useUserStore } from '@/store/user';
import AppIcon from '@/components/app-icon/app-icon.vue';

const userStore = useUserStore();

const defaultAvatar = '/static/default-avatar.png';
const orderCounts = ref({
	pending: 0,
	paid: 0,
	refund: 0,
});

onMounted(() => {
	if (userStore.isLoggedIn) {
		fetchOrderCounts();
	}
});

const fetchOrderCounts = async () => {
	try {
		const res = await get('/order/counts');
		orderCounts.value = res;
	} catch (error) {
		console.error('获取订单数量失败:', error);
	}
};

const handleLogin = () => {
	uni.navigateTo({
		url: '/pages/login/index',
	});
};

const handleAvatarClick = () => {
	// 可以跳转到个人资料编辑页
	uni.showToast({
		title: '个人资料功能开发中',
		icon: 'none',
	});
};

const handleOrderStatus = (status) => {
	uni.navigateTo({
		url: `/pages/sub-pages/order/index?status=${status}`,
	});
};

const handleActivation = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/activation/index',
	});
};

const handleMyBanks = () => {
	uni.switchTab({
		url: '/pages/bank/index',
	});
};

const handleTrajectory = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/trajectory/index',
	});
};

const handleSettings = () => {
	uni.showToast({
		title: '设置功能开发中',
		icon: 'none',
	});
};

const handleAbout = () => {
	uni.showModal({
		title: '关于我们',
		content: '考研刷题小程序 v1.0.0\n\n致力于为考研学子提供优质的刷题体验。',
		showCancel: false,
	});
};

const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (res.confirm) {
				userStore.logout();
			}
		},
	});
};
</script>

<style lang="scss" scoped>
.user-page {
	min-height: 100vh;
	background-color: $bg-color;
}

.user-header {
	position: relative;
	padding: $spacing-xl $page-padding;
	padding-top: calc(var(--status-bar-height) + $spacing-xl);
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	margin-bottom: $spacing-lg;
}

.header-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	opacity: 0.1;
	background-image: url('~@/static/pattern.png');
	background-repeat: repeat;
}

.user-info,
.login-prompt {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: $spacing-md;
}

.user-avatar,
.default-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
	background-color: rgba(255, 255, 255, 0.2);
}

.user-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
}

.user-name {
	font-size: $font-size-lg;
	font-weight: 600;
	color: $white;
}

.user-badges {
	display: flex;
	gap: $spacing-xs;
}

.vip-badge,
.trial-badge {
	padding: 4rpx 12rpx;
	border-radius: 4rpx;
	font-size: $font-size-xs;
	font-weight: 500;
}

.vip-badge {
	background-color: rgba(255, 215, 0, 0.3);
	color: #ffd700;
}

.trial-badge {
	background-color: rgba(255, 255, 255, 0.3);
	color: $white;
}

.login-text {
	font-size: $font-size-base;
	color: $white;
	font-weight: 500;
}

.order-status {
	display: flex;
	justify-content: space-around;
	padding: $spacing-lg;
	background-color: $white;
	margin: 0 $page-padding $spacing-lg;
	border-radius: $card-radius;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.status-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-xs;
	position: relative;
}

.status-icon {
	font-size: 48rpx;
}

.status-text {
	font-size: $font-size-sm;
	color: $text-color;
}

.status-badge {
	position: absolute;
	top: -8rpx;
	right: -8rpx;
	min-width: 32rpx;
	height: 32rpx;
	line-height: 32rpx;
	text-align: center;
	padding: 0 8rpx;
	background-color: $error-color;
	color: $white;
	border-radius: 16rpx;
	font-size: $font-size-xs;
}

.menu-list {
	padding: 0 $page-padding;
}

.menu-group {
	background-color: $white;
	border-radius: $card-radius;
	margin-bottom: $spacing-md;
	overflow: hidden;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-lg;
	border-bottom: 1px solid $border-color;

	&:last-child {
		border-bottom: none;
	}

	&.logout {
		color: $error-color;
	}
}

.menu-left {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	flex: 1;
}

.menu-icon {
	font-size: 40rpx;
}

.menu-text {
	font-size: $font-size-base;
	color: $text-color;
}

.menu-arrow {
	font-size: $font-size-base;
	color: $text-color-secondary;
}
</style>
