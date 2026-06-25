/**
 * 拉取课程 PDF 单页预览图并转为小程序可用的本地路径 / H5 的 data URL
 * 逻辑与 pages/sub-pages/file-preview 中 loadPageImage 一致，供课程介绍页展示缩略图复用
 */
import { requestBinary } from '@/utils/request';
import { getApiPrefix } from '@/utils/api-base';
import { getCachedPdfPreviewPage, savePdfPreviewPage } from '@/utils/pdf-preview-cache';

function ensureArrayBuffer(data) {
	if (data instanceof ArrayBuffer) return data;
	if (typeof data === 'string') {
		return base64ToArrayBuffer(stripDataUrlPrefix(data));
	}
	if (Array.isArray(data)) {
		return new Uint8Array(data).buffer;
	}
	if (data && data.type === 'Buffer' && Array.isArray(data.data)) {
		return new Uint8Array(data.data).buffer;
	}
	if (data && typeof data === 'object' && data.data != null) {
		return ensureArrayBuffer(data.data);
	}
	if (data && typeof data === 'object' && data.body != null) {
		return ensureArrayBuffer(data.body);
	}
	if (data && typeof data === 'object' && data.byteLength !== undefined) {
		return data.buffer instanceof ArrayBuffer ? data.buffer : data;
	}
	return null;
}

function stripDataUrlPrefix(value) {
	if (typeof value !== 'string') return value;
	const match = value.match(/^data:[^;]+;base64,(.+)$/);
	return match ? match[1] : value;
}

function base64ToArrayBuffer(base64) {
	if (typeof uni !== 'undefined' && typeof uni.base64ToArrayBuffer === 'function') {
		return uni.base64ToArrayBuffer(base64);
	}
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

function detectImageMeta(buf) {
	if (!buf || buf.byteLength < 8) return null;
	const arr = new Uint8Array(buf);
	if (
		arr[0] === 0x89 &&
		arr[1] === 0x50 &&
		arr[2] === 0x4e &&
		arr[3] === 0x47
	) {
		return { ext: 'png', mime: 'image/png' };
	}
	if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
		return { ext: 'jpg', mime: 'image/jpeg' };
	}
	return null;
}

function tryParseErrorMessage(buf) {
	try {
		const str =
			typeof buf === 'string'
				? buf
				: new TextDecoder().decode(new Uint8Array(buf));
		const obj = JSON.parse(str);
		return obj.message || obj.msg || obj.error || null;
	} catch (_) {
		return null;
	}
}

function arrayBufferToBase64(buffer) {
	if (typeof uni !== 'undefined' && typeof uni.arrayBufferToBase64 === 'function') {
		return uni.arrayBufferToBase64(buffer);
	}
	let binary = '';
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function getPageDirectUrl(courseId, pageNum, ticket) {
	if (!courseId || !ticket) return '';
	const prefix = getApiPrefix().replace(/\/+$/, '');
	if (!prefix || !prefix.startsWith('http')) return '';
	const path = `app/courses/${courseId}/preview-page/${pageNum}`;
	return `${prefix}/${path}?ticket=${encodeURIComponent(ticket)}`;
}

/**
 * @param {string|number} courseId
 * @param {number} pageNum 1-based
 * @param {string} ticket 预览凭证
 * @param {string} [cacheVersion='']
 * @param {string|number} [fileId]
 * @returns {Promise<string>} 本地路径或 data URL 或可下载的 https 地址
 */
export async function fetchCoursePdfPageImageSrc(courseId, pageNum, ticket, cacheVersion = '', fileId = '') {
	const cachedSrc = await getCachedPdfPreviewPage(courseId, cacheVersion, pageNum);
	if (cachedSrc) return cachedSrc;

	const params = [`ticket=${encodeURIComponent(ticket)}`];
	if (fileId) {
		params.push(`fileId=${encodeURIComponent(String(fileId))}`);
	}
	const url = `/app/courses/${courseId}/preview-page/${pageNum}?${params.join('&')}`;
	let buf = null;
	let lastError = null;
	for (let attempt = 0; attempt < 3; attempt += 1) {
		try {
			buf = await requestBinary(url, { timeout: 90000 });
			lastError = null;
			break;
		} catch (fetchError) {
			lastError = fetchError;
			if (!/502|503|504|超时|timeout|请求失败/i.test(String(fetchError?.message || fetchError)) || attempt >= 2) {
				throw fetchError;
			}
			await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
		}
	}
	if (!buf) {
		throw lastError || new Error('图片数据为空');
	}
	buf = ensureArrayBuffer(buf);
	if (!buf || buf.byteLength < 8) {
		throw new Error('图片数据为空');
	}
	const imageMeta = detectImageMeta(buf);
	if (!imageMeta) {
		const msg = tryParseErrorMessage(buf);
		throw new Error(msg || '返回的不是有效图片');
	}

	// #ifdef MP-WEIXIN
	const base64 = arrayBufferToBase64(buf);
	const cachedPath = await savePdfPreviewPage(courseId, cacheVersion, pageNum, imageMeta.ext, base64);
	if (cachedPath) return cachedPath;
	const fallback = getPageDirectUrl(courseId, pageNum, ticket);
	if (fallback) return fallback;
	throw new Error('无法写入预览缓存');
	// #endif

	// #ifndef MP-WEIXIN
	const previewBase64 = arrayBufferToBase64(buf);
	return `data:${imageMeta.mime};base64,${previewBase64}`;
	// #endif
}
