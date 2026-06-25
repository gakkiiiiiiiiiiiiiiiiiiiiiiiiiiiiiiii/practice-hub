<template>
	<view class="user-page" :class="pageClasses">
		<!-- 头部用户信息 -->
		<view class="user-header">
			<view class="header-bg"></view>
			<text class="user-page-title">我的</text>
			<view class="user-info" v-if="userStore.isLoggedIn">
				<image
					class="user-avatar"
					:src="userStore.userInfo?.avatar || defaultAvatar"
					@click="handleAvatarClick"
				></image>
				<view class="user-details">
					<view class="user-name-row">
						<text class="user-name">{{ userStore.userInfo?.nickname || '用户' }}</text>
						<view class="user-inline-badges">
							<view v-if="userTitle" class="title-badge" :class="`title-badge--${userTitle.tierStyle}`">
								<text class="title-badge-text" :style="titleBadgeTextStyle">{{ userTitle.name }}</text>
							</view>
							<text class="admin-badge" v-if="isAppAdmin">小程序超管</text>
							<text class="bank-admin-badge" v-else-if="isBankAdmin">题库管理员</text>
							<view v-if="showVipTag" class="member-tag member-tag--vip">
								<text class="member-tag-sparkle">✦</text>
								<text class="member-tag-text">VIP</text>
							</view>
							<text class="trial-badge" v-if="showNormalUserBadge">普通用户</text>
						</view>
					</view>
					<view v-if="packageTags.length" class="user-package-row">
						<view v-for="tag in packageTags" :key="tag.id" class="member-tag member-tag--package">
							<text class="member-tag-text">{{ tag.name }}</text>
						</view>
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
				<view class="status-icon-shell pending">
					<app-icon name="clock" :size="42" class="status-icon" color="#ff8a00" />
				</view>
				<text class="status-text">待支付</text>
				<text class="status-badge" v-if="orderCounts.pending > 0">{{ orderCounts.pending }}</text>
			</view>
			<view class="status-item" @click="handleOrderStatus('paid')">
				<view class="status-icon-shell paid">
					<app-icon name="check-circle-fill" :size="42" class="status-icon" color="#16a34a" />
				</view>
				<text class="status-text">支付完成</text>
			</view>
			<view class="status-item" @click="handleOrderStatus('after_sale')">
				<view class="status-icon-shell after-sale">
					<app-icon name="service" :size="42" class="status-icon" color="#4f46e5" />
				</view>
				<text class="status-text">售后</text>
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
				<view class="menu-item" @click="handleCart">
					<view class="menu-left">
						<text class="menu-emoji">🛒</text>
						<text class="menu-text">购物车</text>
						<text v-if="cartCount > 0" class="menu-badge">{{ cartCount > 99 ? '99+' : cartCount }}</text>
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
				<view class="menu-item" @click="handleCollection">
					<view class="menu-left">
						<app-icon name="star-fill" :size="40" class="menu-icon" />
						<text class="menu-text">我的收藏</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
				<view class="menu-item" @click="handlePointsMall">
					<view class="menu-left">
						<text class="menu-emoji">🎁</text>
						<text class="menu-text">积分商城</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
				<view class="menu-item" @click="handleDistributor">
					<view class="menu-left">
						<app-icon name="gift" :size="40" class="menu-icon" />
						<text class="menu-text">分销中心</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
				<view class="menu-item" @click="handleInvite">
					<view class="menu-left">
						<app-icon name="share" :size="40" class="menu-icon" />
						<text class="menu-text">邀请好友</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
				<view class="menu-item" @click="handleCoupons">
					<view class="menu-left">
						<app-icon name="ticket" :size="40" class="menu-icon" />
						<text class="menu-text">我的优惠券</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
				<view class="menu-item" @click="handlePackage">
					<view class="menu-left">
						<app-icon name="star-fill" :size="40" class="menu-icon" />
						<text class="menu-text">优惠套餐</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="menu-arrow" />
				</view>
			</view>

			<view class="menu-group" v-if="canUploadCourse">
				<view class="menu-item" @click="handleCourseUpload">
					<view class="menu-left">
						<app-icon name="upload" :size="40" class="menu-icon" />
						<text class="menu-text">上传课程</text>
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
				<view class="menu-item" @click="handleFeedback">
					<view class="menu-left">
						<app-icon name="info" :size="40" class="menu-icon" />
						<text class="menu-text">功能反馈</text>
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
import { ref, computed, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { useCartStore } from '@/store/cart';
import { getOrderCounts, getPackageSections } from '@/api/index';
import AppIcon from '@/components/app-icon/app-icon.vue';
import { getDefaultShare, toTimelineShare } from '@/utils/share';
import { usePageClasses } from '@/composables/usePageClasses';

const userStore = useUserStore();
const cartStore = useCartStore();
const pageClasses = usePageClasses();
const cartCount = computed(() => cartStore.count);

const userShare = () =>
	getDefaultShare({
		title: '研刷通｜考研刷题与课程资料',
		path: '/pages/index/index',
	});

onShareAppMessage(() => userShare());
onShareTimeline(() => toTimelineShare(userShare()));

const defaultAvatar = '/static/default-avatar.png';
const orderCounts = ref({
	pending: 0,
	paid: 0,
	after_sale: 0,
});
const isAppAdmin = computed(() => userStore.userInfo?.is_admin === true || userStore.userInfo?.role === 'admin');
const isBankAdmin = computed(
	() => userStore.userInfo?.is_bank_admin === true || userStore.userInfo?.role === 'bank_admin',
);
const canUploadCourse = computed(() => isAppAdmin.value || isBankAdmin.value);
const packageSections = ref([]);

const subscribedSections = computed(() => (packageSections.value || []).filter((section) => section?.subscribed));

const showVipTag = computed(() =>
	subscribedSections.value.some((section) => section?.isVip || section?.coversAllCourses),
);

const userTitle = computed(() => userStore.userInfo?.user_title || null);

const titleBadgeTextStyle = computed(() => {
	const color = userTitle.value?.textColor;
	if (!color) return {};
	return { color };
});

const packageTags = computed(() => {
	return subscribedSections.value.map((section) => ({
		id: section.id,
		name: section.name || '套餐',
	}));
});

const showNormalUserBadge = computed(() => {
	if (!userStore.isLoggedIn || isAppAdmin.value || isBankAdmin.value) return false;
	return !showVipTag.value && packageTags.value.length === 0;
});

const loadPackageSections = async () => {
	if (!userStore.isLoggedIn) {
		packageSections.value = [];
		return;
	}
	try {
		packageSections.value = (await getPackageSections()) || [];
	} catch (error) {
		console.error('获取套餐信息失败:', error);
		packageSections.value = [];
	}
};

onMounted(() => {
	if (userStore.isLoggedIn) {
		fetchOrderCounts();
		loadPackageSections();
		userStore.fetchUserInfo().catch((err) => {
			console.error('获取用户信息失败:', err);
		});
	}
});

onShow(() => {
	if (userStore.isLoggedIn) {
		loadPackageSections();
	}
});

const fetchOrderCounts = async () => {
	try {
		const res = await getOrderCounts();
		orderCounts.value = res || { pending: 0, paid: 0, after_sale: 0 };
	} catch (error) {
		console.error('获取订单数量失败:', error);
		// 失败时使用默认值
		orderCounts.value = { pending: 0, paid: 0, after_sale: 0 };
	}
};

const handleLogin = () => {
	uni.navigateTo({
		url: '/pages/login/index',
	});
};

const handleAvatarClick = () => {
	if (!userStore.isLoggedIn) {
		handleLogin();
		return;
	}
	uni.navigateTo({
		url: '/pages/sub-pages/profile/index',
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

const handleCollection = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/collection/index',
	});
};

const handlePointsMall = () => requireLoginNavigate('/pages/sub-pages/points-mall/index');

const handleDistributor = () => {
	// 检查是否登录
	if (!userStore.isLoggedIn) {
		uni.showToast({
			title: '请先登录',
			icon: 'none',
		});
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/index',
			});
		}, 1500);
		return;
	}
	uni.navigateTo({
		url: '/pages/distributor/index',
	});
};

const requireLoginNavigate = (url) => {
	if (!userStore.isLoggedIn) {
		uni.showToast({ title: '请先登录', icon: 'none' });
		setTimeout(() => {
			uni.navigateTo({ url: '/pages/login/index' });
		}, 1500);
		return;
	}
	uni.navigateTo({ url });
};

const handleInvite = () => requireLoginNavigate('/pages/sub-pages/invite/index');
const handleCart = () => uni.navigateTo({ url: '/pages/sub-pages/cart/index' });
const handleCoupons = () => requireLoginNavigate('/pages/sub-pages/coupon/index');
const handlePackage = () => requireLoginNavigate('/pages/sub-pages/package/index');

const handleCourseUpload = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/course-upload/index',
	});
};

const handleSettings = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/settings/index',
	});
};

const handleFeedback = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/feedback/index',
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

// 下拉刷新（尽快结束系统动画，避免用户感觉「卡住」）
onPullDownRefresh(async () => {
	if (!userStore.isLoggedIn) {
		uni.stopPullDownRefresh();
		return;
	}
	try {
		await Promise.all([fetchOrderCounts(), userStore.fetchUserInfo(), loadPackageSections()]);
	} catch (err) {
		console.error('刷新失败:', err);
		uni.showToast({
			title: '刷新失败',
			icon: 'none',
		});
	} finally {
		uni.stopPullDownRefresh();
	}
});
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.user-page {
	min-height: 100vh;
	background-color: $bg-secondary;
	font-family: $font-family-base;
}

.user-header {
	position: relative;
	padding: $space-8 $space-8;
	padding-top: calc(var(--status-bar-height) + $space-8);
	@include gradient(135deg, $color-primary, $color-primary-dark);
	margin-bottom: $space-6;
}

.user-page-title {
	position: relative;
	z-index: 1;
	display: block;
	text-align: center;
	font-size: 34rpx;
	font-weight: 600;
	color: #ffffff;
	margin-bottom: $space-4;
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
	@include flex(row, flex-start, center, $space-4);
}

.user-avatar,
.default-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-full;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
	background-color: rgba(255, 255, 255, 0.2);
}

.user-details {
	flex: 1;
	@include flex(column, flex-start, flex-start, $space-2);
}

.user-name {
	@include text(lg, semibold, inverse);
	color: $text-inverse;
	flex-shrink: 0;
	max-width: 280rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.user-name-row {
	width: 100%;
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
}

.user-inline-badges {
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
	gap: 10rpx;
	flex: 1;
	min-width: 0;
}

.user-package-row {
	width: 100%;
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
	gap: 10rpx;
}

.title-badge {
	display: inline-flex;
	align-items: center;
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
	border: 1rpx solid transparent;
	box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.12);
}

.title-badge-text {
	font-size: 20rpx;
	font-weight: 700;
	line-height: 1.2;
	letter-spacing: 1rpx;
}

.title-badge--bronze {
	background: linear-gradient(135deg, #f0d0b4 0%, #c9a27b 100%);
	border-color: rgba(92, 61, 46, 0.28);
}

.title-badge--silver {
	background: linear-gradient(135deg, #f8fafc 0%, #b8c4d4 100%);
	border-color: rgba(61, 74, 92, 0.22);
}

.title-badge--gold {
	background: linear-gradient(135deg, #fff1c7 0%, #e8c468 100%);
	border-color: rgba(107, 78, 22, 0.3);
}

.title-badge--platinum {
	background: linear-gradient(135deg, #e8fbff 0%, #8ed8e8 100%);
	border-color: rgba(15, 76, 92, 0.24);
}

.title-badge--diamond {
	background: linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%);
	border-color: rgba(30, 58, 138, 0.26);
}

.title-badge--king {
	background: linear-gradient(135deg, #fde68a 0%, #c084fc 55%, #7c3aed 100%);
	border-color: rgba(124, 58, 237, 0.38);
	box-shadow: 0 4rpx 14rpx rgba(124, 58, 237, 0.28);
}

.user-badges {
	@include flex(row, flex-start, center, $space-2);
	flex-wrap: wrap;
}

.admin-badge,
.bank-admin-badge,
.trial-badge {
	padding: $space-1 $space-3;
	border-radius: $radius-sm;
	@include text(xs, medium, inverse);
}

.member-tag {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
	padding: 6rpx 16rpx;
	border-radius: 999rpx;
	max-width: 100%;
}

.member-tag--vip {
	background:
		linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%),
		linear-gradient(155deg, #3d4349 0%, #2a2e33 42%, #1c1f23 100%);
	border: 1rpx solid rgba(245, 215, 142, 0.45);
	box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.18);
}

.member-tag-sparkle {
	font-size: 20rpx;
	line-height: 1;
	color: #f5d78e;
}

.member-tag--vip .member-tag-text {
	font-size: 22rpx;
	font-weight: 700;
	color: #f5d78e;
	letter-spacing: 2rpx;
	line-height: 1.2;
}

.member-tag--package {
	background: rgba(255, 255, 255, 0.18);
	border: 1rpx solid rgba(255, 255, 255, 0.32);
	backdrop-filter: blur(4rpx);
}

.member-tag--package .member-tag-text {
	font-size: 22rpx;
	font-weight: 500;
	color: #ffffff;
	line-height: 1.2;
	max-width: 220rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.admin-badge {
	background-color: rgba(128, 90, 213, 0.35);
	color: #f0e7ff;
}

.bank-admin-badge {
	background-color: rgba(37, 99, 235, 0.28);
	color: #dbeafe;
}

.trial-badge {
	background-color: rgba(255, 255, 255, 0.3);
	color: $text-inverse;
}

.login-text {
	@include text(base, medium, inverse);
	color: $text-inverse;
}

.order-status {
	@include flex(row, space-around, center, 0);
	padding: $space-6;
	@include card(md);
	margin: 0 $space-8 $space-6;
}

.status-item {
	@include flex(column, center, center, $space-2);
	position: relative;
	min-width: 150rpx;
	transition:
		opacity $transition-fast,
		transform $transition-fast;

	&:active {
		opacity: 0.7;
		transform: translateY(2rpx);
	}
}

.status-icon-shell {
	@include flex(row, center, center, 0);
	width: 68rpx;
	height: 68rpx;
	border-radius: 24rpx;
	margin-bottom: 4rpx;
	box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.08);

	&.pending {
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
	}

	&.paid {
		background: linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%);
	}

	&.after-sale {
		background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
	}
}

.status-icon {
	font-size: 42rpx;
}

.status-text {
	@include text(sm, normal, primary);
}

.status-badge {
	position: absolute;
	top: -10rpx;
	right: 36rpx;
	min-width: 32rpx;
	height: 32rpx;
	line-height: 32rpx;
	text-align: center;
	padding: 0 $space-2;
	background-color: $color-error;
	color: $text-inverse;
	border-radius: $radius-full;
	border: 4rpx solid #fff;
	@include text(xs, medium, inverse);
}

.menu-list {
	padding: 0 $space-8;
}

.menu-group {
	@include card(md);
	margin-bottom: $space-4;
	overflow: hidden;
}

.menu-item {
	@include flex(row, space-between, center, 0);
	padding: $space-6;
	border-bottom: 1rpx solid $color-neutral-200;
	transition: background-color $transition-fast;
	cursor: pointer;

	&:last-child {
		border-bottom: none;
	}

	&.logout {
		color: $color-error;
	}

	&:active {
		background-color: $color-neutral-100;
	}
}

.menu-left {
	@include flex(row, flex-start, center, $space-4);
	flex: 1;
}

.menu-icon {
	font-size: 40rpx;
}

.menu-emoji {
	font-size: 36rpx;
	line-height: 1;
}

.menu-badge {
	margin-left: 12rpx;
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 8rpx;
	border-radius: 999rpx;
	background: #ef4444;
	color: #fff;
	font-size: 20rpx;
	line-height: 32rpx;
	text-align: center;
}

// 全局设置样式
.user-page {
	transition:
		background-color 0.3s,
		color 0.3s;

	&.night-mode {
		background-color: #1a1a1a;
		color: #e0e0e0;

		.user-header,
		.menu-group {
			background-color: #2a2a2a;
			color: #e0e0e0;
		}

		.user-name,
		.menu-text {
			color: #e0e0e0;
		}
	}

	&.font-size-small {
		font-size: 26rpx;
	}

	&.font-size-medium {
		font-size: 30rpx;
	}

	&.font-size-large {
		font-size: 34rpx;
	}

	&.font-size-xlarge {
		font-size: 38rpx;
	}
}

.menu-text {
	@include text(base, normal, primary);
}

.menu-arrow {
	@include text(base, normal, secondary);
}
</style>
