const CACHE_INDEX_KEY = 'pdf_preview_page_cache_index';
const MAX_CACHE_ENTRIES = 12;
const MAX_CACHE_BYTES = 24 * 1024 * 1024;

function getCacheIndex() {
	try {
		const index = uni.getStorageSync(CACHE_INDEX_KEY);
		return index && typeof index === 'object' ? index : {};
	} catch (e) {
		return {};
	}
}

function setCacheIndex(index) {
	try {
		uni.setStorageSync(CACHE_INDEX_KEY, index);
	} catch (e) {
		console.warn('写入 PDF 预览缓存索引失败', e);
	}
}

function getCacheKey(courseId, cacheVersion, pageNum) {
	return `${courseId}:${cacheVersion || 'default'}:${pageNum}`;
}

function getFs() {
	if (typeof uni === 'undefined' || typeof uni.getFileSystemManager !== 'function') {
		return null;
	}
	return uni.getFileSystemManager();
}

function accessFile(fs, filePath) {
	return new Promise((resolve) => {
		fs.access({
			path: filePath,
			success: () => resolve(true),
			fail: () => resolve(false),
		});
	});
}

function readFile(fs, filePath) {
	return new Promise((resolve) => {
		fs.readFile({
			filePath,
			success: (res) => resolve(res.data),
			fail: () => resolve(null),
		});
	});
}

function isValidImageBuffer(data) {
	if (!data) return false;
	const arr = data instanceof ArrayBuffer ? new Uint8Array(data) : Array.isArray(data) ? new Uint8Array(data) : data?.data ? new Uint8Array(data.data) : null;
	if (!arr || arr.length < 8) return false;
	const isPng =
		arr[0] === 0x89 &&
		arr[1] === 0x50 &&
		arr[2] === 0x4e &&
		arr[3] === 0x47 &&
		arr[4] === 0x0d &&
		arr[5] === 0x0a &&
		arr[6] === 0x1a &&
		arr[7] === 0x0a;
	const isJpg = arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff;
	return isPng || isJpg;
}

function writeFile(fs, filePath, base64) {
	return new Promise((resolve, reject) => {
		fs.writeFile({
			filePath,
			data: base64,
			encoding: 'base64',
			success: () => resolve(filePath),
			fail: reject,
		});
	});
}

function estimateBase64Bytes(base64) {
	if (!base64 || typeof base64 !== 'string') return 0;
	const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
	return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function unlinkFile(fs, filePath) {
	return new Promise((resolve) => {
		if (!filePath) {
			resolve();
			return;
		}
		fs.unlink({
			filePath,
			success: resolve,
			fail: resolve,
		});
	});
}

async function trimCache(index) {
	const entries = Object.entries(index)
		.filter(([, item]) => item && item.filePath)
		.sort((a, b) => (b[1].lastAccessed || 0) - (a[1].lastAccessed || 0));
	const fs = getFs();
	const keep = {};
	let totalBytes = 0;
	let keptCount = 0;
	for (let i = 0; i < entries.length; i += 1) {
		const [key, item] = entries[i];
		const size = Number(item.size) || 0;
		if (keptCount < MAX_CACHE_ENTRIES && totalBytes + size <= MAX_CACHE_BYTES) {
			keep[key] = item;
			totalBytes += size;
			keptCount += 1;
		} else if (fs) {
			await unlinkFile(fs, item.filePath);
		}
	}
	return keep;
}

async function trimCacheForNewFile(index, incomingSize) {
	const entries = Object.entries(index)
		.filter(([, item]) => item && item.filePath)
		.sort((a, b) => (b[1].lastAccessed || 0) - (a[1].lastAccessed || 0));
	const fs = getFs();
	const keep = {};
	let totalBytes = 0;
	let keptCount = 0;
	const targetMaxBytes = Math.max(8 * 1024 * 1024, MAX_CACHE_BYTES - incomingSize);

	for (const [key, item] of entries) {
		const size = Number(item.size) || 0;
		if (keptCount < Math.max(2, MAX_CACHE_ENTRIES - 1) && totalBytes + size <= targetMaxBytes) {
			keep[key] = item;
			totalBytes += size;
			keptCount += 1;
		} else if (fs) {
			await unlinkFile(fs, item.filePath);
		}
	}
	return keep;
}

async function clearPreviewCache(index = getCacheIndex()) {
	const fs = getFs();
	if (fs) {
		await Promise.all(
			Object.values(index)
				.filter((item) => item?.filePath)
				.map((item) => unlinkFile(fs, item.filePath)),
		);
	}
	setCacheIndex({});
	return {};
}

export async function getCachedPdfPreviewPage(courseId, cacheVersion, pageNum) {
	// #ifdef MP-WEIXIN
	const fs = getFs();
	if (!fs) return '';
	const key = getCacheKey(courseId, cacheVersion, pageNum);
	const index = getCacheIndex();
	const item = index[key];
	if (!item?.filePath) return '';
	const exists = await accessFile(fs, item.filePath);
	if (!exists || !isValidImageBuffer(await readFile(fs, item.filePath))) {
		await unlinkFile(fs, item.filePath);
		delete index[key];
		setCacheIndex(index);
		return '';
	}
	index[key] = {
		...item,
		lastAccessed: Date.now(),
	};
	setCacheIndex(index);
	return item.filePath;
	// #endif
	// #ifndef MP-WEIXIN
	return '';
	// #endif
}

export async function deleteCachedPdfPreviewPage(courseId, cacheVersion, pageNum) {
	// #ifdef MP-WEIXIN
	const fs = getFs();
	if (!fs) return;
	const key = getCacheKey(courseId, cacheVersion, pageNum);
	const index = getCacheIndex();
	const item = index[key];
	if (item?.filePath) {
		await unlinkFile(fs, item.filePath);
	}
	delete index[key];
	setCacheIndex(index);
	// #endif
}

export async function savePdfPreviewPage(courseId, cacheVersion, pageNum, ext, base64) {
	// #ifdef MP-WEIXIN
	const fs = getFs();
	const dir = typeof wx !== 'undefined' && wx.env ? wx.env.USER_DATA_PATH : '';
	if (!fs || !dir) return '';
	const safeVersion = cacheVersion || 'default';
	const filePath = `${dir}/pdf_preview_${courseId}_${safeVersion}_${pageNum}.${ext}`;
	const size = estimateBase64Bytes(base64);
	let index = await trimCacheForNewFile(getCacheIndex(), size);
	setCacheIndex(index);
	try {
		await writeFile(fs, filePath, base64);
	} catch (error) {
		const errMsg = error?.errMsg || error?.message || '';
		if (/maximum size|storage limit|quota|exceeded/i.test(errMsg)) {
			index = await clearPreviewCache(index);
			try {
				await writeFile(fs, filePath, base64);
			} catch (retryError) {
				console.warn('写入 PDF 预览缓存失败，降级为不落盘显示', retryError);
				return '';
			}
		} else {
			throw error;
		}
	}

	const key = getCacheKey(courseId, cacheVersion, pageNum);
	index = await trimCache({
		...index,
		[key]: {
			courseId: String(courseId),
			cacheVersion: safeVersion,
			pageNum,
			filePath,
			size,
			lastAccessed: Date.now(),
		},
	});
	setCacheIndex(index);
	return filePath;
	// #endif
	// #ifndef MP-WEIXIN
	return '';
	// #endif
}
