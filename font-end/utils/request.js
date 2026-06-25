/**
 * 请求封装
 * 统一处理请求拦截、响应拦截、错误处理
 * 微信小程序使用微信云服务 callContainer
 */

import { CLOUD_CONFIG, ensureCloudInit, formatCloudFailMessage } from './cloud-config';
import { handleUnauthorized } from './auth-session';

const DEFAULT_REQUEST_TIMEOUT = 30000;

// API 基础地址（微信小程序中不使用，因为使用云服务）
// 仅在降级方案（非微信环境或开发者工具）中使用
// #ifndef MP-WEIXIN
const API_BASE_URL = 'http://127.0.0.1:3333/api';
// #endif

export { CLOUD_CONFIG };

// 请求拦截器
const requestInterceptor = (config) => {
	// 后端接口需要 token，如果有 token 就发送（但不进行权限校验）
	const token = uni.getStorageSync('auth_token');
	if (token) {
		config.header = {
			...config.header,
			Authorization: `Bearer ${token}`,
		};
	}

	// 设置默认 header
	config.header = {
		'Content-Type': 'application/json',
		...config.header,
	};

	return config;
};

// 响应拦截器
const responseInterceptor = (response) => {
	const { statusCode, data } = response;

	// 处理响应数据为空的情况
	if (!data) {
		console.warn('响应数据为空:', response);
		return Promise.reject(new Error('服务器返回数据为空'));
	}

	// HTTP 状态码处理（200 和 201 都视为成功）
	if (statusCode === 200 || statusCode === 201) {
		// 业务状态码处理
		// 兼容不同的响应格式
		const code = data.code || data.statusCode || 200;
		const message = data.message || data.msg || '请求失败';

		if (code === 200 || code === 0 || !data.hasOwnProperty('code')) {
			// 成功：返回 data 字段或整个 data
			return Promise.resolve(data.data !== undefined ? data.data : data);
		} else if (code === 401) {
			handleUnauthorized(message || '登录已过期，请重新登录');
			return Promise.reject(new Error(message || '未授权，请先登录'));
		} else {
			// 其他业务错误
			return Promise.reject(new Error(message || '请求失败'));
		}
	} else if (statusCode === 401) {
		// 尝试从多种可能的响应格式中提取错误信息
		let errorMsg = '登录已过期，请重新登录';

		if (data) {
			// 后端异常过滤器格式: { code: 401, msg: "错误信息", data: null }
			if (data.msg) {
				errorMsg = data.msg;
			}
			// NestJS 异常响应格式: { statusCode: 401, message: "错误信息" }
			else if (data.message) {
				errorMsg = data.message;
			}
			// 字符串格式
			else if (typeof data === 'string') {
				errorMsg = data;
			}
			// 嵌套错误对象
			else if (data.error) {
				errorMsg = typeof data.error === 'string' ? data.error : data.error.message || data.error.msg || '未授权，请先登录';
			}
		}

		console.warn('401 错误响应详情:', {
			statusCode,
			data,
			errorMsg,
			dataKeys: data ? Object.keys(data) : [],
		});

		handleUnauthorized(errorMsg);
		return Promise.reject(new Error(errorMsg));
	} else if (statusCode === 404) {
		// 资源不存在
		const errorMsg = data?.message || data?.msg || '请求的资源不存在';
		return Promise.reject(new Error(errorMsg));
	} else {
		// 其他 HTTP 错误（包括 500 服务器内部错误）
		// 尝试从响应数据中提取错误信息
		let errorMsg = '服务器内部错误';

		if (data) {
			// 尝试多种可能的错误信息字段
			errorMsg =
				data.message ||
				data.msg ||
				data.error ||
				data.errorMessage ||
				(typeof data === 'string' ? data : `请求失败 (${statusCode})`);
		} else {
			errorMsg = `请求失败 (${statusCode})`;
		}

		console.error('HTTP 错误响应:', {
			statusCode,
			data,
			errorMsg,
		});

		return Promise.reject(new Error(errorMsg));
	}
};

/**
 * 通用请求方法
 * 使用微信云服务 callContainer
 */
const request = (options) => {
	return new Promise((resolve, reject) => {
		// 请求拦截
		const config = requestInterceptor({
			url: options.url,
			method: options.method || 'GET',
			data: options.data || {},
			header: options.header || {},
			timeout: Number(options.timeout) > 0 ? Number(options.timeout) : DEFAULT_REQUEST_TIMEOUT,
		});

		// 处理 URL：转换为云服务路径格式（必须以 /api 开头）
		let path = config.url;
		if (path.startsWith('http')) {
			// 如果是完整 URL，提取路径部分
			try {
				const urlObj = new URL(path);
				path = urlObj.pathname + urlObj.search;
			} catch (e) {
				// 如果解析失败，尝试手动提取
				const match = path.match(/\/api(\/.*)/);
				path = match ? `/api${match[1]}` : path;
			}
		} else {
			// 如果是相对路径，确保以 /api 开头
			if (!path.startsWith('/api')) {
				path = '/api' + (path.startsWith('/') ? path : '/' + path);
			} else if (!path.startsWith('/')) {
				path = '/' + path;
			}
		}

		// 在微信小程序环境中使用云服务
		// #ifdef MP-WEIXIN
		ensureCloudInit();
		if (typeof wx !== 'undefined' && wx.cloud && wx.cloud.callContainer) {
			const cloudConfig = {
				config: {
					env: CLOUD_CONFIG.env,
				},
				path: path,
				header: {
					'X-WX-SERVICE': CLOUD_CONFIG.service,
					'Content-Type': 'application/json',
					...config.header,
				},
				method: config.method,
				data: config.data,
				timeout: config.timeout,
			};

			console.log('调用微信云服务:', cloudConfig);

			wx.cloud.callContainer({
				...cloudConfig,
				success: (res) => {
					console.log('云服务响应:', res);
					try {
						let statusCode = res.statusCode || 200;
						let responseData = res.data;

						if (![200, 201].includes(statusCode)) {
							console.error('云服务错误响应详情:', {
								statusCode,
								responseData,
								rawData: JSON.stringify(responseData),
								message: responseData?.message || responseData?.msg || responseData?.error,
							});
						}

						if (typeof responseData === 'string') {
							try {
								responseData = JSON.parse(responseData);
							} catch (e) {
								console.warn('响应数据不是有效的 JSON:', responseData);
							}
						}

						if (responseData && typeof responseData.statusCode === 'number') {
							statusCode = responseData.statusCode;
							responseData = responseData.data || responseData;
						}

						const standardRes = {
							statusCode: statusCode,
							data: responseData,
						};

						console.log('转换后的响应:', standardRes);
						responseInterceptor(standardRes).then(resolve).catch(reject);
					} catch (error) {
						console.error('响应处理错误:', error);
						reject(error);
					}
				},
				fail: (err) => {
					console.error('云服务请求失败:', err);
					reject(new Error(formatCloudFailMessage(err)));
				},
			});
		} else {
			// 开发者工具等环境：云服务 API 不可用时降级本地调试
			console.warn('微信云服务不可用，使用 uni.request 降级方案');
			const localApiBase = 'http://127.0.0.1:3333/api';
			const fullUrl = config.url.startsWith('http')
				? config.url
				: config.url.startsWith('/')
				? `${localApiBase}${config.url}`
				: `${localApiBase}/${config.url}`;
			uni.request({
				url: fullUrl,
				method: config.method,
				data: config.data,
				header: config.header,
				timeout: config.timeout,
				success: (res) => {
					try {
						responseInterceptor(res).then(resolve).catch(reject);
					} catch (error) {
						console.error('响应处理错误:', error);
						reject(error);
					}
				},
				fail: (err) => {
					console.error('网络请求失败:', err);
					reject(err);
				},
			});
		}
		// #endif

		// #ifndef MP-WEIXIN
		// 非微信环境使用 uni.request
		// 构建完整 URL
		const fullUrl = config.url.startsWith('http')
			? config.url
			: config.url.startsWith('/')
			? `${API_BASE_URL}${config.url}`
			: `${API_BASE_URL}/${config.url}`;
		uni.request({
			url: fullUrl,
			method: config.method,
			data: config.data,
			header: config.header,
			timeout: config.timeout,
			success: (res) => {
				try {
					responseInterceptor(res).then(resolve).catch(reject);
				} catch (error) {
					console.error('响应处理错误:', error);
					reject(error);
				}
			},
			fail: (err) => {
				console.error('网络请求失败:', err);
				reject(err);
			},
		});
		// #endif
	});
};

/**
 * 请求二进制数据（如图片），走 callContainer，不依赖 downloadFile 合法域名
 * @param {string} url - 请求路径，如 /app/courses/6/preview-page/1?ticket=xxx
 * @returns {Promise<ArrayBuffer>}
 */
export const requestBinary = (url, options = {}) => {
	return new Promise((resolve, reject) => {
		const requestTimeout = Number(options.timeout) > 0 ? Number(options.timeout) : 30000;
		const config = requestInterceptor({
			url,
			method: 'GET',
			data: {},
			header: {},
			timeout: requestTimeout,
		});

		let path = config.url;
		if (path.startsWith('http')) {
			try {
				const urlObj = new URL(path);
				path = urlObj.pathname + urlObj.search;
			} catch (e) {
				const match = path.match(/\/api(\/.*)/);
				path = match ? `/api${match[1]}` : path;
			}
		} else {
			if (!path.startsWith('/api')) {
				path = '/api' + (path.startsWith('/') ? path : '/' + path);
			} else if (!path.startsWith('/')) {
				path = '/' + path;
			}
		}

		// #ifdef MP-WEIXIN
		ensureCloudInit();
		if (typeof wx !== 'undefined' && wx.cloud && wx.cloud.callContainer) {
			wx.cloud.callContainer({
				config: { env: CLOUD_CONFIG.env },
				path,
				header: {
					'X-WX-SERVICE': CLOUD_CONFIG.service,
					...config.header,
				},
				method: 'GET',
				responseType: 'arraybuffer',
					timeout: config.timeout,
					success: (res) => {
						const statusCode = res.statusCode || 200;
						if (statusCode === 401) {
							const msg = res.data?.message ?? res.data?.msg ?? '登录已过期，请重新登录';
							handleUnauthorized(typeof msg === 'string' ? msg : '登录已过期，请重新登录');
							reject(new Error(typeof msg === 'string' ? msg : '登录已过期，请重新登录'));
							return;
						}
						if (statusCode !== 200) {
							const msg = res.data?.message ?? res.data?.msg ?? `请求失败 (${statusCode})`;
							reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)));
							return;
						}
						const raw = pickBinaryPayload(res);
						if (raw == null) {
							reject(new Error('响应数据为空'));
							return;
						}
						if (raw instanceof ArrayBuffer) {
						resolve(raw);
						return;
					}
						if (typeof raw === 'string') {
							resolve(raw);
							return;
						}
						if (Array.isArray(raw)) {
							resolve(new Uint8Array(raw).buffer);
							return;
						}
						if (raw && raw.type === 'Buffer' && Array.isArray(raw.data)) {
							resolve(new Uint8Array(raw.data).buffer);
							return;
						}
						if (typeof raw === 'object' && raw.data != null) {
							resolve(raw.data);
							return;
						}
					reject(new Error('不支持的响应格式'));
				},
				fail: (err) => {
					reject(new Error(formatCloudFailMessage(err)));
				},
			});
		} else {
			const base = 'http://127.0.0.1:3333/api';
			const fullUrl = config.url.startsWith('http')
				? config.url
				: config.url.startsWith('/')
					? `${base}${config.url}`
					: `${base}/${config.url}`;
			uni.request({
				url: fullUrl,
				method: 'GET',
				header: config.header,
				timeout: 30000,
				responseType: 'arraybuffer',
				success: (res) => {
					if (res.statusCode === 401) {
						handleUnauthorized('登录已过期，请重新登录');
						reject(new Error('登录已过期，请重新登录'));
						return;
					}
					if (res.statusCode === 200 && res.data != null) resolve(res.data);
					else reject(new Error(`请求失败 (${res.statusCode})`));
				},
				fail: (err) => reject(err),
			});
		}
		// #endif

		// #ifndef MP-WEIXIN
		const fullUrl = config.url.startsWith('http')
			? config.url
			: config.url.startsWith('/')
				? `${API_BASE_URL}${config.url}`
				: `${API_BASE_URL}/${config.url}`;
		uni.request({
			url: fullUrl,
			method: 'GET',
			header: config.header,
			timeout: 30000,
			responseType: 'arraybuffer',
			success: (res) => {
				if (res.statusCode === 401) {
					handleUnauthorized('登录已过期，请重新登录');
					reject(new Error('登录已过期，请重新登录'));
					return;
				}
				if (res.statusCode === 200 && res.data != null) resolve(res.data);
				else reject(new Error(`请求失败 (${res.statusCode})`));
			},
			fail: (err) => reject(err),
		});
		// #endif
	});
};

const hasBinaryPayload = (value) => {
	if (value == null) return false;
	if (value instanceof ArrayBuffer) return value.byteLength > 0;
	if (typeof value === 'string') return value.length > 0;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === 'object') {
		if (value.type === 'Buffer' && Array.isArray(value.data)) return value.data.length > 0;
		if (value.data != null) return hasBinaryPayload(value.data);
		if (value.body != null) return hasBinaryPayload(value.body);
	}
	return false;
};

const pickBinaryPayload = (res) => {
	const candidates = [
		res?.data,
		res?.responseData,
		res?.rawData,
		res?.data?.data,
		res?.data?.body,
		res?.responseData?.data,
		res?.responseData?.body,
	];
	return candidates.find(hasBinaryPayload) ?? null;
};

/**
 * GET 请求
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项，可以是 { params: {...} } 或直接是查询参数对象
 */
export const get = (url, options = {}) => {
	// 兼容两种调用方式：
	// 1. get(url, { params: {...} }) - axios 风格
	// 2. get(url, { chapterId: 1 }) - 直接传查询参数
	let params = {};
	if (options && typeof options === 'object') {
		if (options.params && typeof options.params === 'object') {
			// axios 风格：第二个参数是 { params: {...} }
			params = options.params;
		} else {
			// 直接传查询参数：第二个参数就是查询参数对象
			params = options;
		}
	}

	// 构建查询字符串，正确处理数组和对象
	const queryParts = [];
	Object.keys(params).forEach((key) => {
		const value = params[key];
		if (value === undefined || value === null || value === '') {
			return; // 跳过空值
		}
		if (Array.isArray(value)) {
			// 数组参数：questionIds[]=1&questionIds[]=2
			value.forEach((item) => {
				queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`);
			});
		} else {
			// 普通参数
			queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
		}
	});

	const queryString = queryParts.join('&');
	const fullUrl = queryString ? `${url}?${queryString}` : url;

	return request({
		url: fullUrl,
		method: 'GET',
	});
};

/**
 * POST 请求
 */
export const post = (url, data = {}, options = {}) => {
	return request({
		url,
		method: 'POST',
		data,
		timeout: options.timeout,
	});
};

/**
 * PUT 请求
 */
export const put = (url, data = {}) => {
	return request({
		url,
		method: 'PUT',
		data,
	});
};

/**
 * DELETE 请求
 */
export const del = (url, data = {}) => {
	return request({
		url,
		method: 'DELETE',
		data,
	});
};

export default {
	get,
	post,
	put,
	delete: del,
	requestBinary,
};
