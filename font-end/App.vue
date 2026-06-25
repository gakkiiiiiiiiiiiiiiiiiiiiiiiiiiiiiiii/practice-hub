<template>
	<view id="app" :class="appClasses">
		<view class="app-container">
			<!-- 全局组件可以在这里放置 -->
		</view>
	</view>
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { computed } from 'vue';
import { useBankStore } from '@/store/bank';
import { useDeviceStore } from '@/store/device';
import { useUserStore } from '@/store/user';
import { enableWeChatShareMenu } from '@/utils/share';
import { ensureCloudInit } from '@/utils/cloud-config';
import { checkAppVersionUpdate } from '@/utils/app-update';
import { captureReferralFromEnterOptions, captureReferralFromOptions } from '@/utils/referral';
import { beginDailyOnlineSession, endDailyOnlineSession } from '@/utils/daily-online';

const bankStore = useBankStore();
const deviceStore = useDeviceStore();
const userStore = useUserStore();

const syncDailyOnlineSession = (active) => {
	const userId = userStore.userInfo?.id;
	if (!userStore.isLoggedIn || !userId) return;
	if (active) {
		beginDailyOnlineSession(userId);
		return;
	}
	endDailyOnlineSession(userId);
};

// 全局类名，用于应用夜间模式和字体大小
const appClasses = computed(() => {
	const classes = [];
	if (bankStore.settings.nightMode) {
		classes.push('night-mode');
	}
	if (bankStore.settings.fontSize) {
		classes.push(`font-size-${bankStore.settings.fontSize}`);
	}
	return classes.join(' ');
});

onLaunch((options) => {
	deviceStore.init();
	console.log('========== App Launch ==========');
	captureReferralFromOptions(options?.query || {});
	captureReferralFromEnterOptions();
	checkAppVersionUpdate();
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
	
	// 初始化微信云服务
	// #ifdef MP-WEIXIN
	ensureCloudInit();
	// #endif
	
	// 初始化逻辑，如检查登录状态
	enableWeChatShareMenu();
});

onShow(() => {
	deviceStore.refresh();
	console.log('========== App Show ==========');
	captureReferralFromEnterOptions();
	checkAppVersionUpdate();
	enableWeChatShareMenu();
	syncDailyOnlineSession(true);
});

onHide(() => {
	console.log('========== App Hide ==========');
	syncDailyOnlineSession(false);
});
</script>

<style lang="scss">
@import './uni.scss';
@import './styles/design-system.scss';
@import './styles/tablet-adaptation.scss';

page {
  /* 兜底：Android 部分机型未注入 --status-bar-height 时避免 calc 失效 */
  --status-bar-height: 44px;
  background-color: $bg-color;
  font-size: $font-size-base;
  color: $text-color;
  transition: background-color 0.3s, color 0.3s;
}

#app {
  width: 100%;
  min-height: 100vh;
  transition: background-color 0.3s, color 0.3s;
}

// 全局夜间模式样式
#app.night-mode {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

// 全局字体大小样式
#app.font-size-small {
  font-size: 26rpx;
}

#app.font-size-medium {
  font-size: 30rpx;
}

#app.font-size-large {
  font-size: 34rpx;
}

#app.font-size-xlarge {
  font-size: 38rpx;
}
</style>
