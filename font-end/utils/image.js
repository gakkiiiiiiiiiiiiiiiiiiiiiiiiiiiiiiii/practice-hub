/**
 * 图片工具函数
 */
import { getApiBaseUrl } from './api-base';

/**
 * 获取完整的图片 URL
 * @param {string} url - 图片路径（相对路径或完整 URL）
 * @returns {string} 完整的图片 URL
 */
export const getImageUrl = (url) => {
	if (!url) return '';
	const value = String(url).trim();
	if (!value) return '';
	// 如果已经是完整 URL（http:// 或 https://），直接返回
	if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('cloud://')) {
		return value;
	}
	const baseUrl = getApiBaseUrl();
	if (!baseUrl) {
		return value;
	}
	const base = baseUrl.replace(/\/+$/, '');
	return value.startsWith('/') ? `${base}${value}` : `${base}/${value}`;
};
