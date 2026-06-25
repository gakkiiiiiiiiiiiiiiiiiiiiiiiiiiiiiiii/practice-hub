/**
 * 统一 API 根地址（用于拼接图片、下载等完整 URL）
 * 构建时注入 VITE_API_BASE_URL（如 https://你的云托管公网域名/api）
 * 微信小程序：必须配置为云托管公网地址，不使用本地地址
 */
export function getApiBaseUrl() {
	let base = '';
	try {
		if (typeof import.meta !== 'undefined' && import.meta.env) {
			base = String(
				import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL || '',
			).trim();
		}
	} catch (e) {}
	if (!base) {
		try {
			if (typeof process !== 'undefined' && process.env) {
				base = String(process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || '').trim();
			}
		} catch (e) {}
	}
	// #ifdef MP-WEIXIN
	// 微信云托管环境：仅使用构建时注入的地址，不落回本地
	if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(base)) {
		base = '';
	}
	base = base || '';
	// #endif
	// #ifndef MP-WEIXIN
	base = base || 'http://127.0.0.1:3333';
	// #endif
	// 去掉末尾斜杠，去掉 /api 后缀，得到 origin
	base = base.replace(/\/+$/, '').replace(/\/api\/?$/, '');
	return base;
}

/** 返回带 /api 前缀的 base，用于拼接接口路径（保证无重复斜杠） */
export function getApiPrefix() {
	const base = getApiBaseUrl();
	return base ? `${base}/api` : '/api';
}
