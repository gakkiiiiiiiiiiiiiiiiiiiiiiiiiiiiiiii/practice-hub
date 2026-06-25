/**
 * 格式化工具函数
 */

/**
 * 格式化学习人数
 * @param {number} count - 学习人数
 * @returns {string} 格式化后的字符串，如 "1.2w" 或 "1234"
 */
export const formatStudyCount = (count) => {
	if (!count && count !== 0) return '0';
	const num = Number(count);
	if (isNaN(num)) return '0';
	if (num >= 10000) {
		return (num / 10000).toFixed(1) + 'w';
	}
	return num.toString();
};

/**
 * 金额展示（支持小数门槛）
 * @param {number} value
 */
export const formatYuanDisplay = (value) => {
	const amount = Number(value);
	if (!Number.isFinite(amount) || amount < 0) return '0';
	const normalized = Math.round(amount * 100) / 100;
	if (Number.isInteger(normalized)) return String(normalized);
	return normalized.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * 优惠券奖励/名称文案
 * @param {number} amount 面额（元）
 * @param {number} minAmount 使用门槛（元），0 表示无门槛
 */
export const formatCouponRewardLabel = (amount, minAmount) => {
	const couponAmount = Number(amount || 0);
	const threshold = Number(minAmount || 0);
	const amountText = formatYuanDisplay(couponAmount);
	if (threshold <= 0) {
		return `无门槛${amountText}元优惠券`;
	}
	return `${amountText}元优惠券`;
};

/**
 * 优惠券门槛文案
 */
export const formatCouponThresholdDesc = (minAmount, amount) =>
	formatCouponRewardLabel(amount, minAmount);

/**
 * 课程资料展示名称（优先使用后台配置的展示名称）
 * @param {Record<string, unknown> | null | undefined} file
 * @param {string} [fallback='未命名文件']
 */
export const getCourseFileDisplayName = (file, fallback = '未命名文件') => {
	if (!file) return fallback;
	const displayName = String(file.display_name || file.displayName || '').trim();
	if (displayName) return displayName;
	const fileName = String(file.file_name || file.fileName || '').trim();
	if (fileName) {
		const stripped = fileName.replace(/\.(pdf|docx?)$/i, '');
		return stripped || fileName;
	}
	return fallback;
};

/**
 * 格式化到期时间
 * @param {string|Date} expireTime - 到期时间
 * @returns {string} 格式化后的时间字符串，如 "2024-12-31 23:59"
 */
export const formatExpireTime = (expireTime) => {
	if (!expireTime) return '';
	const date = new Date(expireTime);
	if (isNaN(date.getTime())) return '';
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hour = String(date.getHours()).padStart(2, '0');
	const minute = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hour}:${minute}`;
};
