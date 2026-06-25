<template>
	<view class="app-tab-nav-bar" :class="navClasses" :style="wrapStyle">
		<view class="app-tab-nav-bar__content" :style="contentStyle">
			<text class="app-tab-nav-bar__title" :style="titleStyle">{{ title }}</text>
		</view>
	</view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useDeviceStore } from '@/store/device';

const props = defineProps({
	title: {
		type: String,
		default: '',
	},
	backgroundColor: {
		type: String,
		default: '#f8f8f8',
	},
	textColor: {
		type: String,
		default: '#000000',
	},
});

const deviceStore = useDeviceStore();

const navbarMetrics = ref({
	height: 88,
	statusBarHeight: 0,
	contentHeight: 44,
	contentTop: 0,
});

const navClasses = computed(() => ({
	'is-pad-compact': deviceStore.isPadCompact,
	'is-tablet': deviceStore.isTablet,
}));

const wrapStyle = computed(() => ({
	height: `${navbarMetrics.value.height}px`,
	paddingTop: `${navbarMetrics.value.statusBarHeight}px`,
	backgroundColor: props.backgroundColor,
}));

const contentStyle = computed(() => ({
	height: `${navbarMetrics.value.contentHeight}px`,
	marginTop: `${navbarMetrics.value.contentTop}px`,
}));

const titleStyle = computed(() => {
	let fontSize = '17px';
	if (deviceStore.isPadCompact) {
		fontSize = '22px';
	} else if (deviceStore.isTablet) {
		fontSize = '20px';
	}
	return {
		color: props.textColor,
		fontSize,
		lineHeight: '1.2',
	};
});

const initNavbarMetrics = () => {
	try {
		const systemInfo = uni.getSystemInfoSync();
		const statusBarHeight = systemInfo.statusBarHeight || 0;
		let contentHeight = 44;
		let contentTop = 0;
		let navHeight = statusBarHeight + contentHeight;

		// #ifdef MP-WEIXIN
		const menuButton = wx.getMenuButtonBoundingClientRect();
		contentHeight = menuButton.height;
		contentTop = Math.max(0, menuButton.top - statusBarHeight);
		navHeight = menuButton.bottom + contentTop;
		// #endif

		navbarMetrics.value = {
			height: navHeight,
			statusBarHeight,
			contentHeight,
			contentTop,
		};
	} catch (error) {
		console.warn('Tab 导航栏高度计算失败:', error);
	}
};

onMounted(() => {
	initNavbarMetrics();
});

defineExpose({
	getHeight: () => navbarMetrics.value.height,
});
</script>

<style lang="scss" scoped>
.app-tab-nav-bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	box-sizing: border-box;
}

.app-tab-nav-bar__content {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	box-sizing: border-box;
}

.app-tab-nav-bar__title {
	font-weight: 600;
	text-align: center;
}
</style>
