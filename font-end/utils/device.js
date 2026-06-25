const TABLET_MIN_WIDTH = 768;
const PAD_COMPACT_MAX_WIDTH = 768;

export function getSystemInfoSafe() {
	try {
		if (typeof uni !== 'undefined' && typeof uni.getSystemInfoSync === 'function') {
			return uni.getSystemInfoSync();
		}
	} catch (error) {
		console.warn('获取系统信息失败:', error);
	}
	return {};
}

export function getScreenWidth(systemInfo = getSystemInfoSafe()) {
	return Number(systemInfo.windowWidth || systemInfo.screenWidth || 0);
}

/** 平板设备（含 iPad 全屏与手机框模式） */
export function detectTablet(systemInfo = getSystemInfoSafe()) {
	const { deviceType } = systemInfo;
	if (deviceType === 'pad') {
		return true;
	}
	return getScreenWidth(systemInfo) >= TABLET_MIN_WIDTH;
}

/**
 * iPad 手机框 / 窄逻辑宽度：rpx 按窄屏换算，正文会偏小，需要 px 放大。
 * 宽屏平板（>=768）不要覆盖 rpx，否则会反而变小。
 */
export function detectPadCompact(systemInfo = getSystemInfoSafe()) {
	const { deviceType } = systemInfo;
	const width = getScreenWidth(systemInfo);
	const screenWidth = Number(systemInfo.screenWidth || 0);

	if (width <= 0) {
		return false;
	}

	if (width >= PAD_COMPACT_MAX_WIDTH) {
		return false;
	}

	if (deviceType === 'pad') {
		return true;
	}

	// 部分 iPad 未返回 deviceType=pad，但物理屏宽明显大于逻辑宽（手机框模式）
	if (screenWidth >= TABLET_MIN_WIDTH) {
		return true;
	}

	return false;
}

/** 自定义导航栏安全区（兼容 Android 上 statusBarHeight 为 0 的情况） */
export function getNavbarMetrics(systemInfo = getSystemInfoSafe()) {
	const windowWidth = getScreenWidth(systemInfo) || 375;
	const safeAreaTop = Number(systemInfo.safeArea?.top || 0);
	let statusBarHeight = Number(systemInfo.statusBarHeight || 0);
	if (!statusBarHeight && safeAreaTop > 0) {
		statusBarHeight = safeAreaTop;
	}

	let contentHeight = 44;
	let contentTop = 0;
	let navHeight = statusBarHeight + contentHeight;
	let menuButtonRight = 0;
	let menuButtonLeft = 0;
	let menuButtonTop = 0;
	let menuButtonBottom = 0;
	let menuButtonWidth = 0;
	let menuButtonHeight = 0;

	// #ifdef MP-WEIXIN
	try {
		const menuButton = wx.getMenuButtonBoundingClientRect();
		if (menuButton?.height) {
			contentHeight = menuButton.height;
			contentTop = Math.max(0, menuButton.top - statusBarHeight);
			navHeight = menuButton.bottom + contentTop;
			menuButtonRight = Math.max(0, windowWidth - menuButton.left + 8);
			menuButtonLeft = Number(menuButton.left || 0);
			menuButtonTop = Number(menuButton.top || 0);
			menuButtonBottom = Number(menuButton.bottom || 0);
			menuButtonWidth = Number(menuButton.width || 0);
			menuButtonHeight = Number(menuButton.height || 0);
		}
	} catch (error) {
		console.warn('获取胶囊按钮位置失败:', error);
	}
	// #endif

	return {
		statusBarHeight,
		contentHeight,
		contentTop,
		navHeight,
		menuButtonRight,
		menuButtonLeft,
		menuButtonTop,
		menuButtonBottom,
		menuButtonWidth,
		menuButtonHeight,
		windowWidth,
	};
}

export function isAndroidPlatform(systemInfo = getSystemInfoSafe()) {
	return String(systemInfo.platform || '').toLowerCase() === 'android';
}

export function applyTabletTabBar(systemInfo = getSystemInfoSafe()) {
	const isPadDevice = systemInfo.deviceType === 'pad';
	const isWideTablet = getScreenWidth(systemInfo) >= TABLET_MIN_WIDTH;
	if (!isPadDevice && !isWideTablet) {
		return;
	}

	// #ifdef MP-WEIXIN
	try {
		uni.setTabBarStyle({
			fontSize: isPadDevice ? '17px' : '15px',
			height: isPadDevice ? '64px' : '60px',
			iconWidth: isPadDevice ? '29px' : '27px',
			spacing: '6px',
		});
	} catch (error) {
		console.warn('设置 TabBar 样式失败:', error);
	}
	// #endif
}
