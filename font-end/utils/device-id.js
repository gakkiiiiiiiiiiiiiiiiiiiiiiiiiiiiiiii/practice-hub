const DEVICE_ID_STORAGE_KEY = 'app_device_id';

/**
 * 获取或创建设备唯一标识（账号登录设备数限制用）
 */
export const getOrCreateDeviceId = () => {
	let deviceId = '';
	try {
		deviceId = String(uni.getStorageSync(DEVICE_ID_STORAGE_KEY) || '').trim();
	} catch (error) {
		console.warn('读取 deviceId 失败:', error);
	}
	if (deviceId) return deviceId;

	deviceId = `d_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
	try {
		uni.setStorageSync(DEVICE_ID_STORAGE_KEY, deviceId);
	} catch (error) {
		console.warn('保存 deviceId 失败:', error);
	}
	return deviceId;
};

export const getDeviceMeta = () => {
	let platform = '';
	let deviceName = '';
	try {
		const info = uni.getSystemInfoSync();
		platform = info.platform || '';
		deviceName = [info.brand, info.model].filter(Boolean).join(' ') || info.model || '';
	} catch (error) {
		console.warn('获取设备信息失败:', error);
	}
	return {
		device_id: getOrCreateDeviceId(),
		platform,
		device_name: deviceName,
	};
};
