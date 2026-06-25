function formatDateKey(date = new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getStorageKey(userId) {
	return `daily_online_${userId}_${formatDateKey()}`;
}

function getDailyOnlineRecord(userId) {
	if (!userId) {
		return { totalSeconds: 0, sessionStart: null };
	}
	try {
		const record = uni.getStorageSync(getStorageKey(userId));
		if (record && typeof record === 'object') {
			return {
				totalSeconds: Number(record.totalSeconds) || 0,
				sessionStart: record.sessionStart || null,
			};
		}
	} catch (error) {
		console.warn('读取每日在线时长失败:', error);
	}
	return { totalSeconds: 0, sessionStart: null };
}

function saveDailyOnlineRecord(userId, record) {
	uni.setStorageSync(getStorageKey(userId), record);
}

/** 获取今日累计在线时长（秒），含当前前台会话 */
export function getDailyOnlineSeconds(userId) {
	const record = getDailyOnlineRecord(userId);
	let total = record.totalSeconds;
	if (record.sessionStart) {
		total += Math.max(0, Math.floor((Date.now() - record.sessionStart) / 1000));
	}
	return total;
}

/** App 进入前台时开始/续接在线计时 */
export function beginDailyOnlineSession(userId) {
	if (!userId) return;
	const record = getDailyOnlineRecord(userId);
	if (!record.sessionStart) {
		record.sessionStart = Date.now();
		saveDailyOnlineRecord(userId, record);
	}
}

/** App 进入后台时暂停在线计时并累加 */
export function endDailyOnlineSession(userId) {
	if (!userId) return;
	const record = getDailyOnlineRecord(userId);
	if (!record.sessionStart) return;
	record.totalSeconds += Math.max(0, Math.floor((Date.now() - record.sessionStart) / 1000));
	record.sessionStart = null;
	saveDailyOnlineRecord(userId, record);
}
