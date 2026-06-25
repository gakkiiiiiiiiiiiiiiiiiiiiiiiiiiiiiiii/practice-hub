<template>
	<view class="custom-navbar" :style="navbarStyle">
		<view class="navbar-content" :style="navbarContentStyle">
			<view class="navbar-left" v-if="showBack" @click="handleBack">
				<app-icon name="arrow-right" :size="24" color="#FFFFFF" style="transform: rotate(180deg)" />
			</view>
			<view class="navbar-left-placeholder" v-else></view>
			<view class="navbar-center">
				<text class="navbar-title" :style="navbarTitleStyle">{{ title }}</text>
			</view>
			<view class="navbar-right">
				<slot name="right"></slot>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppIcon from '@/components/app-icon/app-icon.vue';

const props = defineProps({
	title: {
		type: String,
		default: '',
	},
	showBack: {
		type: Boolean,
		default: true,
	},
});

const navbarMetrics = ref({
	height: 88,
	statusBarHeight: 0,
	contentHeight: 44,
	contentTop: 0,
	rightSafeWidth: 0,
});

const navbarStyle = computed(() => ({
	height: `${navbarMetrics.value.height}px`,
	paddingTop: `${navbarMetrics.value.statusBarHeight}px`,
}));

const navbarContentStyle = computed(() => ({
	height: `${navbarMetrics.value.contentHeight}px`,
	marginTop: `${navbarMetrics.value.contentTop}px`,
}));

const navbarTitleStyle = computed(() => ({
	maxWidth: `calc(100% - ${Math.max(160, navbarMetrics.value.rightSafeWidth * 2)}px)`,
}));

onMounted(() => {
	initNavbarMetrics();
});

const initNavbarMetrics = () => {
	try {
		const systemInfo = uni.getSystemInfoSync();
		const statusBarHeight = systemInfo.statusBarHeight || 0;
		let contentHeight = 44;
		let contentTop = 0;
		let rightSafeWidth = 0;
		let navHeight = statusBarHeight + contentHeight;

		// #ifdef MP-WEIXIN
		const menuButton = wx.getMenuButtonBoundingClientRect();
		contentHeight = menuButton.height;
		contentTop = Math.max(0, menuButton.top - statusBarHeight);
		rightSafeWidth = Math.max(0, (systemInfo.windowWidth || 0) - menuButton.left + 8);
		navHeight = menuButton.bottom + 8;
		// #endif

		navbarMetrics.value = {
			height: navHeight,
			statusBarHeight,
			contentHeight,
			contentTop,
			rightSafeWidth,
		};
	} catch (error) {
		console.warn('导航栏安全区计算失败，使用默认高度:', error);
	}
};

const handleBack = () => {
	uni.navigateBack();
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.custom-navbar {
	box-sizing: border-box;
	padding: 0 $space-8;
	background-color: $color-primary;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: $z-sticky;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.navbar-content {
	@include flex(row, space-between, center, 0);
	width: 100%;
	box-sizing: border-box;
	position: relative;
}

.navbar-left,
.navbar-left-placeholder {
	display: flex;
	align-items: center;
	width: 80rpx;
	flex-shrink: 0;
}

.navbar-center {
	flex: 1;
	min-width: 0;
	@include flex(row, center, center, 0);
}

.navbar-title {
	@include text(md, bold, inverse);
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	color: #ffffff;
	width: max-content;
	@include truncate;
	text-align: center;
	pointer-events: none;
}

.navbar-right {
	@include flex(row, flex-end, center, 0);
	width: 80rpx;
	flex-shrink: 0;
}

@media screen and (min-width: 768px) {
	.custom-navbar {
		padding-left: 24px;
		padding-right: 24px;
	}

	.navbar-left,
	.navbar-left-placeholder,
	.navbar-right {
		width: 56px;
	}

	.navbar-title {
		font-size: 20px;
		line-height: 1.2;
		font-weight: 700;
	}
}
</style>
