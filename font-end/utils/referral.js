const STORAGE_KEY = 'pending_referral_user_id';

export const parseReferralUserId = (options = {}) => {
	const scene = options.scene ? decodeURIComponent(String(options.scene)) : '';
	const rawReferral = options.referral_uid || options.referralUid || '';
	if (rawReferral) {
		const parsed = Number(rawReferral);
		return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : '';
	}
	if (!scene) return '';
	for (const pair of String(scene).split('&')) {
		const [key, value = ''] = pair.split('=');
		if (key === 'referral_uid') {
			const parsed = Number(decodeURIComponent(value));
			return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : '';
		}
	}
	return '';
};

export const savePendingReferralUserId = (referralUserId) => {
	if (!referralUserId) return;
	uni.setStorageSync(STORAGE_KEY, String(referralUserId));
};

export const captureReferralFromOptions = (options = {}) => {
	const referralUserId = parseReferralUserId(options);
	if (referralUserId) {
		savePendingReferralUserId(referralUserId);
	}
	return referralUserId;
};

export const captureReferralFromEnterOptions = () => {
	try {
		const enterOptions = typeof uni.getEnterOptionsSync === 'function' ? uni.getEnterOptionsSync() : null;
		if (enterOptions?.query) {
			return captureReferralFromOptions(enterOptions.query);
		}
	} catch (error) {
		console.warn('读取进入参数失败:', error);
	}

	try {
		const launchOptions = typeof uni.getLaunchOptionsSync === 'function' ? uni.getLaunchOptionsSync() : null;
		if (launchOptions?.query) {
			return captureReferralFromOptions(launchOptions.query);
		}
	} catch (error) {
		console.warn('读取启动参数失败:', error);
	}

	return '';
};

export const getPendingReferralUserId = () => uni.getStorageSync(STORAGE_KEY) || '';

export const clearPendingReferralUserId = (pendingReferralUserId) => {
	if (pendingReferralUserId) {
		uni.removeStorageSync(STORAGE_KEY);
	}
};
