/**
 * 微信云托管 callContainer 配置（与 App.vue wx.cloud.init 保持一致）
 */
export const CLOUD_CONFIG = {
	env: 'prod-d1gguk4ie589126ba',
	service: 'prod',
};

/** 是否已执行 wx.cloud.init */
let cloudInitialized = false;

/**
 * 初始化微信云（幂等，可在 App.onLaunch 与首次请求前调用）
 */
export const ensureCloudInit = () => {
	// #ifdef MP-WEIXIN
	if (cloudInitialized) return true;
	try {
		if (typeof wx !== 'undefined' && wx.cloud && typeof wx.cloud.init === 'function') {
			wx.cloud.init({
				env: CLOUD_CONFIG.env,
				traceUser: true,
			});
			cloudInitialized = true;
			return true;
		}
	} catch (error) {
		console.error('微信云服务初始化失败:', error);
	}
	return false;
	// #endif
	// #ifndef MP-WEIXIN
	return false;
	// #endif
};

/** callContainer 系统级错误（如平板真机 errCode 103006） */
export const isCloudContainerSystemError = (err) => {
	if (!err) return false;
	const code = err.errCode ?? err.code;
	const msg = String(err.errMsg || err.message || '');
	return (
		code === 103006 ||
		code === -1 ||
		msg.includes('103006') ||
		/system error/i.test(msg) ||
		/callContainer:fail/i.test(msg)
	);
};

/**
 * 将 callContainer 原始错误转为用户可读提示（不暴露技术细节）
 */
export const formatCloudFailMessage = (err) => {
	const rawMsg = String(err?.errMsg || err?.message || '');
	if (err?.errCode === -606001 || rawMsg.includes('-606001')) {
		return '请求数据过大，请稍后再试';
	}
	if (isCloudContainerSystemError(err)) {
		return '连接云服务失败，请检查网络与系统时间是否正确，并更新微信至最新版后重试';
	}
	if (/callContainer:fail/i.test(rawMsg)) {
		return '连接云服务失败，请检查网络后重试';
	}
	return rawMsg || '网络请求失败，请稍后重试';
};

/** 登录页专用错误文案 */
export const formatLoginCloudErrorMessage = (error) => {
	const message = String(error?.message || error?.msg || error?.errMsg || '').trim();
	if (
		isCloudContainerSystemError(error) ||
		message.includes('103006') ||
		/callContainer:fail/i.test(message) ||
		message.includes('连接云服务失败')
	) {
		return '登录失败：当前设备连接云服务异常，请检查网络、确认系统时间准确，或换用手机微信重试';
	}
	return message || '登录失败，请稍后重试';
};
