import { defineStore } from 'pinia';
import {
	detectPadCompact,
	detectTablet,
	getScreenWidth,
	getSystemInfoSafe,
	getNavbarMetrics,
	isAndroidPlatform,
	applyTabletTabBar,
} from '@/utils/device';

export const useDeviceStore = defineStore('device', {
	state: () => ({
		isTablet: false,
		isPadCompact: false,
		isAndroid: false,
		windowWidth: 0,
		navbarMetrics: getNavbarMetrics(),
	}),
	actions: {
		init() {
			const systemInfo = getSystemInfoSafe();
			this.windowWidth = getScreenWidth(systemInfo);
			this.isTablet = detectTablet(systemInfo);
			this.isPadCompact = detectPadCompact(systemInfo);
			this.isAndroid = isAndroidPlatform(systemInfo);
			this.navbarMetrics = getNavbarMetrics(systemInfo);
			applyTabletTabBar(systemInfo);
		},
		refresh() {
			this.init();
		},
	},
});
