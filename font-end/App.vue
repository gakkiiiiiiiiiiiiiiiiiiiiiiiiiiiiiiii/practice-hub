<template>
	<view id="app">
		<view class="app-container">
			<!-- 全局组件可以在这里放置 -->
		</view>
	</view>
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
	console.log('========== App Launch ==========');
	// 安全获取系统信息，避免初始化时 API 未就绪
	try {
		if (uni && typeof uni.getSystemInfoSync === 'function') {
			const systemInfo = uni.getSystemInfoSync();
			console.log('uni-app 系统信息:', systemInfo);
		} else {
			console.log('uni API 尚未就绪，稍后获取系统信息');
		}
	} catch (error) {
		console.warn('获取系统信息失败:', error);
	}
	// 初始化逻辑，如检查登录状态
});

onShow(() => {
	console.log('========== App Show ==========');
});

onHide(() => {
	console.log('========== App Hide ==========');
});
</script>

<style lang="scss">
@import './uni.scss';

page {
  background-color: $bg-color;
  font-size: $font-size-base;
  color: $text-color;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
