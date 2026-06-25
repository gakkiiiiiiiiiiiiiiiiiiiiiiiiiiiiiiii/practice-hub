<template>
	<view class="file-preview-page">
		<view v-if="error" class="error-wrap">
			<text class="error-text">{{ error }}</text>
		</view>
		<view v-else-if="totalPages === 0" class="loading-wrap">
			<text class="loading-text">加载中…</text>
		</view>
		<view v-else class="swiper-wrap">
			<swiper
				:current="currentIndex"
				class="swiper"
				:duration="280"
				:disable-touch="isZoomed"
				@change="onSwiperChange"
			>
				<swiper-item v-for="n in totalPages" :key="n" class="swiper-item">
					<view class="page-stage" @tap="toggleControls">
						<movable-area
							v-if="pageSrcs[n - 1]"
							class="zoom-area"
							scale-area
						>
							<movable-view
								class="zoom-view"
								:key="`${n}-${zoomViewKey}`"
								direction="all"
								:scale="true"
								:scale-min="minZoom"
								:scale-max="maxZoom"
								:scale-value="zoomControlScale"
								:out-of-bounds="true"
								@scale="onZoomScale"
							>
								<image
									:src="pageSrcs[n - 1]"
									mode="aspectFit"
									class="page-image"
									@error="onImageError(n)"
									@load="onImageLoad(n)"
								/>
							</movable-view>
						</movable-area>
						<view
							v-else
							class="page-placeholder"
							@tap.stop="reloadPage(n)"
							@click.stop="reloadPage(n)"
						>
							<text class="placeholder-text">{{
								pageLoading[n - 1] ? '加载中…' : pageErrors[n - 1] ? '加载失败，点击重试' : '点击加载'
							}}</text>
							<text v-if="pageErrors[n - 1]" class="placeholder-error">
								{{ pageErrors[n - 1] }}
							</text>
						</view>
					</view>
				</swiper-item>
			</swiper>
		</view>
		<view v-if="!error && totalPages > 0" class="page-footer">
			<text class="page-footer-num">{{ currentPage }}/{{ totalPages }}</text>
			<button class="page-footer-jump" @click="openJumpModal">跳转页面</button>
		</view>
		<view v-if="!error && totalPages > 0 && controlsVisible" class="preview-toolbar">
			<view class="zoom-controls">
				<button class="zoom-btn" :disabled="zoomDisplayScale <= minZoom" @click="zoomOut">-</button>
				<button class="zoom-value" @click="resetZoom">{{ zoomPercent }}%</button>
				<button class="zoom-btn" :disabled="zoomDisplayScale >= maxZoom" @click="zoomIn">+</button>
			</view>
		</view>
		<view v-if="jumpModalVisible" class="jump-mask" @tap="closeJumpModal">
			<view class="jump-dialog" @tap.stop>
				<text class="jump-title">跳转到指定页</text>
				<view class="jump-input-row">
					<input
						class="jump-input"
						type="number"
						:value="jumpPageInput"
						:maxlength="jumpInputMaxLength"
						placeholder="页码"
						focus
						@input="onJumpPageInput"
						@confirm="confirmJumpPage"
					/>
					<text class="jump-total">/ {{ totalPages }}</text>
				</view>
				<view class="jump-actions">
					<button class="jump-action jump-cancel" @click="closeJumpModal">取消</button>
					<button class="jump-action jump-confirm" @click="confirmJumpPage">跳转</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onHide, onLoad, onShareAppMessage, onShareTimeline, onShow, onUnload } from '@dcloudio/uni-app';
import { getCoursePreviewPagesInfo, reportFileCourseReadingProgress } from '@/api/index';
import { requestBinary } from '@/utils/request';
import { getApiPrefix } from '@/utils/api-base';
import { deleteCachedPdfPreviewPage, getCachedPdfPreviewPage, savePdfPreviewPage } from '@/utils/pdf-preview-cache';
import { buildSharePath, getDefaultShare, toTimelineShare } from '@/utils/share';

const courseId = ref('');
const fileId = ref('');
const ticket = ref('');
const cacheVersion = ref('');
const totalPages = ref(0);
const error = ref('');
/** 当前页码（1-based），左右滑动切换 */
const currentPage = ref(1);
const currentIndex = computed(() => Math.max(0, currentPage.value - 1));
const minZoom = 1;
const maxZoom = 3;
const zoomStep = 0.25;
const zoomControlScale = ref(1);
const zoomDisplayScale = ref(1);
const zoomViewKey = ref(0);
const jumpModalVisible = ref(false);
const jumpPageInput = ref('');
const controlsVisible = ref(false);
let lastZoomDisplayUpdateAt = 0;
const isZoomed = computed(() => zoomDisplayScale.value > 1.02);
const zoomPercent = computed(() => Math.round(zoomDisplayScale.value * 100));
const jumpInputMaxLength = computed(() => String(Math.max(1, totalPages.value || 1)).length);
/** 每页图片的本地路径或 base64，下标 0 为第 1 页 */
const pageSrcs = ref([]);
/** 每页是否在加载中 */
const pageLoading = ref([]);
/** 每页加载失败提示 */
const pageErrors = ref([]);
const pageRetryCounts = ref([]);
const sessionStartAt = ref(0);
let readingReportTimer = null;

const PAGE_LOAD_CONCURRENCY = 1;
const PAGE_FETCH_MAX_RETRY = 3;
const PAGE_FETCH_TIMEOUT_MS = 90000;
const pageLoadQueue = [];
let pageLoadActive = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPreviewPageUrl = (pageNum) => {
	const cid = courseId.value;
	const t = ticket.value;
	if (!cid || !t) return '';
	const params = [`ticket=${encodeURIComponent(t)}`];
	if (fileId.value) {
		params.push(`fileId=${encodeURIComponent(fileId.value)}`);
	}
	return `/app/courses/${cid}/preview-page/${pageNum}?${params.join('&')}`;
};

const isRetryablePreviewError = (error) => /502|503|504|超时|timeout|请求失败/i.test(String(error?.message || error));

const schedulePageLoad = (pageNum) => {
	const total = totalPages.value;
	if (pageNum < 1 || pageNum > total) return;
	if (pageSrcs.value[pageNum - 1]) return;
	if (pageLoading.value[pageNum - 1] && !pageErrors.value[pageNum - 1]) return;
	if (pageLoadQueue.includes(pageNum)) return;
	pageLoadQueue.push(pageNum);
	runPageLoadQueue();
};

const runPageLoadQueue = async () => {
	if (pageLoadActive >= PAGE_LOAD_CONCURRENCY) return;
	const pageNum = pageLoadQueue.shift();
	if (!pageNum) return;
	pageLoadActive += 1;
	try {
		await loadPageImage(pageNum);
	} finally {
		pageLoadActive -= 1;
		if (pageLoadQueue.length) {
			runPageLoadQueue();
		}
	}
};

const filePreviewShare = () =>
	getDefaultShare({
		title: `我正在研刷通查看课程资料${currentPage.value ? `（第 ${currentPage.value} 页）` : ''}`,
		path: buildSharePath('/pages/sub-pages/course-intro/index', {
			id: courseId.value,
		}),
	});

onShareAppMessage(() => filePreviewShare());
onShareTimeline(() => toTimelineShare(filePreviewShare()));

const toggleControls = () => {
	controlsVisible.value = !controlsVisible.value;
};

function getReadingRecordKey(cid, fid) {
	return fid ? `file_course_reading_${cid}_${fid}` : `file_course_reading_${cid}`;
}

function getStoredReadingRecord() {
	try {
		return uni.getStorageSync(getReadingRecordKey(courseId.value, fileId.value)) || {};
	} catch (_) {
		return {};
	}
}

function persistReadingProgress(includeElapsed = false) {
	const cid = courseId.value;
	if (!cid) return;
	const previous = getStoredReadingRecord();
	const now = Date.now();
	const elapsed = includeElapsed && sessionStartAt.value ? Math.max(0, Math.floor((now - sessionStartAt.value) / 1000)) : 0;
	const nextPage = Math.max(Number(previous.currentPage) || 0, currentPage.value);
	const next = {
		...previous,
		currentPage: nextPage,
		totalPages: totalPages.value,
		totalSeconds: Math.max(0, Number(previous.totalSeconds) || 0) + elapsed,
		updatedAt: now,
	};
	uni.setStorageSync(getReadingRecordKey(cid, fileId.value), next);
	if (includeElapsed) {
		sessionStartAt.value = 0;
		reportReadingProgress(elapsed, nextPage);
	}
}

function reportReadingProgress(durationSeconds = 0, page = currentPage.value) {
	const cid = courseId.value;
	if (!cid || !uni.getStorageSync('auth_token')) return;
	reportFileCourseReadingProgress(cid, {
		currentPage: Math.max(0, Number(page) || 0),
		totalPages: Math.max(0, Number(totalPages.value) || 0),
		durationSeconds: Math.max(0, Number(durationSeconds) || 0),
		fileId: fileId.value ? Number(fileId.value) : undefined,
	}).catch((e) => {
		console.warn('文件阅读进度上报失败', e);
	});
}

function startReadingReportTimer() {
	stopReadingReportTimer();
	readingReportTimer = setInterval(() => {
		persistReadingProgress(true);
		sessionStartAt.value = Date.now();
	}, 15000);
}

function stopReadingReportTimer() {
	if (readingReportTimer) {
		clearInterval(readingReportTimer);
		readingReportTimer = null;
	}
}

function clampZoom(value) {
	const next = Number(value) || minZoom;
	return Math.min(maxZoom, Math.max(minZoom, Number(next.toFixed(2))));
}

function onZoomScale(e) {
	const next = clampZoom(e?.detail?.scale);
	const now = Date.now();
	// 不把手势缩放值回写到 scale-value，避免微信 movable-view 受控值和手势值互相拉扯导致抖动。
	if (now - lastZoomDisplayUpdateAt > 80 || Math.abs(next - zoomDisplayScale.value) >= 0.08) {
		zoomDisplayScale.value = next;
		lastZoomDisplayUpdateAt = now;
	}
}

function zoomIn() {
	const next = clampZoom(zoomDisplayScale.value + zoomStep);
	zoomControlScale.value = next;
	zoomDisplayScale.value = next;
}

function zoomOut() {
	const next = clampZoom(zoomDisplayScale.value - zoomStep);
	zoomControlScale.value = next;
	zoomDisplayScale.value = next;
}

function resetZoom() {
	zoomControlScale.value = minZoom;
	zoomDisplayScale.value = minZoom;
	zoomViewKey.value++;
}

function openJumpModal() {
	jumpPageInput.value = String(currentPage.value || 1);
	jumpModalVisible.value = true;
}

function closeJumpModal() {
	jumpModalVisible.value = false;
}

function onJumpPageInput(e) {
	jumpPageInput.value = String(e?.detail?.value || '').replace(/[^\d]/g, '');
}

function confirmJumpPage() {
	const page = Number.parseInt(jumpPageInput.value, 10);
	if (!Number.isInteger(page) || page < 1 || page > totalPages.value) {
		uni.showToast({
			title: `请输入 1-${totalPages.value} 页`,
			icon: 'none',
		});
		return;
	}
	currentPage.value = page;
	resetZoom();
	persistReadingProgress(false);
	closeJumpModal();
	setTimeout(ensureCurrentPageLoaded, 60);
}

/** 确保某页已加载（未加载则按需拉取），用于当前页及前后预加载 */
function ensurePageLoaded(pageNum) {
	schedulePageLoad(pageNum);
}

function ensureCurrentPageLoaded() {
	if (!courseId.value || !ticket.value || totalPages.value <= 0) return;
	schedulePageLoad(currentPage.value);
	preloadPageLater(currentPage.value - 1, 900);
	preloadPageLater(currentPage.value + 1, 1400);
}

async function reloadPage(pageNum) {
	if (pageNum < 1 || pageNum > totalPages.value) return;
	const srcNext = [...pageSrcs.value];
	srcNext[pageNum - 1] = '';
	pageSrcs.value = srcNext;
	const errorNext = [...pageErrors.value];
	errorNext[pageNum - 1] = '';
	pageErrors.value = errorNext;
	const loadingNext = [...pageLoading.value];
	loadingNext[pageNum - 1] = false;
	pageLoading.value = loadingNext;
	await deleteCachedPdfPreviewPage(courseId.value, cacheVersion.value, pageNum);
	schedulePageLoad(pageNum);
}

function preloadPageLater(pageNum, delay = 500) {
	setTimeout(() => {
		ensurePageLoaded(pageNum);
	}, delay);
}

/** 通过 callContainer 拉取单页图片并写入临时文件，返回本地路径 */
async function loadPageImage(pageNum) {
	const cid = courseId.value;
	const t = ticket.value;
	if (!cid || !t) return;
	if (pageSrcs.value[pageNum - 1]) return;

	const cachedSrc = await getCachedPdfPreviewPage(cid, cacheVersion.value, pageNum);
	if (cachedSrc) {
		const srcNext = [...pageSrcs.value];
		srcNext[pageNum - 1] = cachedSrc;
		pageSrcs.value = srcNext;
		clearPageError(pageNum);
		return;
	}

	// 标记加载中，避免重复请求
	const loadingNext = [...pageLoading.value];
	loadingNext[pageNum - 1] = true;
	pageLoading.value = loadingNext;
	clearPageError(pageNum);

	const url = buildPreviewPageUrl(pageNum);
	if (!url) return;
	try {
		let buf = null;
		let lastError = null;
		for (let attempt = 0; attempt < PAGE_FETCH_MAX_RETRY; attempt += 1) {
			try {
				buf = await requestBinary(url, { timeout: PAGE_FETCH_TIMEOUT_MS });
				lastError = null;
				break;
			} catch (fetchError) {
				lastError = fetchError;
				if (!isRetryablePreviewError(fetchError) || attempt >= PAGE_FETCH_MAX_RETRY - 1) {
					throw fetchError;
				}
				await sleep(1200 * (attempt + 1));
			}
		}
		if (!buf) {
			throw lastError || new Error('图片数据为空');
		}
		// callContainer 可能返回 base64 字符串而非 ArrayBuffer，需统一为 ArrayBuffer
		buf = ensureArrayBuffer(buf);
		if (!buf || buf.byteLength < 8) {
			throw new Error('图片数据为空');
		}
		const imageMeta = detectImageMeta(buf);
		// 校验图片魔数，避免把 JSON 错误体当成图片写入
		if (!imageMeta) {
			const msg = tryParseErrorMessage(buf);
			throw new Error(msg || '返回的不是有效图片');
		}
		// #ifdef MP-WEIXIN
		// 使用 base64 写入更可靠（微信文档推荐 base64 时只传内容，不含 data: 前缀）
		const base64 = arrayBufferToBase64(buf);
		const filePath = await savePdfPreviewPage(
			cid,
			cacheVersion.value,
			pageNum,
			imageMeta.ext,
			base64,
		);
		const next = [...pageSrcs.value];
		next[pageNum - 1] = filePath || `data:${imageMeta.mime};base64,${base64}`;
		pageSrcs.value = next;
		clearPageError(pageNum);
		// #endif
		// #ifndef MP-WEIXIN
		// 非微信环境（如 H5）可转 base64 显示
		const base64 = arrayBufferToBase64(buf);
		const next = [...pageSrcs.value];
		next[pageNum - 1] = `data:${imageMeta.mime};base64,${base64}`;
		pageSrcs.value = next;
		clearPageError(pageNum);
		// #endif
	} catch (e) {
		console.error('拉取预览页失败', pageNum, e);
		// 降级：使用直接图片 URL（需在后台配置 downloadFile 合法域名或本地开发）
		const fallbackUrl = getPageDirectUrl(pageNum);
		if (fallbackUrl) {
			const next = [...pageSrcs.value];
			next[pageNum - 1] = fallbackUrl;
			pageSrcs.value = next;
			clearPageError(pageNum);
		} else {
			setPageError(pageNum, e?.message || '加载失败');
		}
	} finally {
		const loadNext = [...pageLoading.value];
		loadNext[pageNum - 1] = false;
		pageLoading.value = loadNext;
	}
}

function clearPageError(pageNum) {
	const next = [...pageErrors.value];
	next[pageNum - 1] = '';
	pageErrors.value = next;
}

function setPageError(pageNum, message) {
	const next = [...pageErrors.value];
	next[pageNum - 1] = message || '加载失败';
	pageErrors.value = next;
}

/** 直接图片地址，用于 callContainer 失败时的降级（需配置 downloadFile 合法域名） */
function getPageDirectUrl(pageNum) {
	const cid = courseId.value;
	const t = ticket.value;
	if (!cid || !t) return '';
	const prefix = getApiPrefix().replace(/\/+$/, '');
	// 仅当为云托管公网完整地址时使用（小程序不落回本地地址）
	if (!prefix || !prefix.startsWith('http')) return '';
	const params = [`ticket=${encodeURIComponent(t)}`];
	if (fileId.value) {
		params.push(`fileId=${encodeURIComponent(fileId.value)}`);
	}
	const path = `app/courses/${cid}/preview-page/${pageNum}`;
	return `${prefix}/${path}?${params.join('&')}`;
}

/** 将 requestBinary 返回值统一为 ArrayBuffer（兼容 callContainer 返回 base64 字符串） */
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
	if (!buf || buf.byteLength < 8) return false;
	const arr = new Uint8Array(buf);
	if (
		arr[0] === 0x89 &&
		arr[1] === 0x50 &&
		arr[2] === 0x4e &&
		arr[3] === 0x47 &&
		arr[4] === 0x0d &&
		arr[5] === 0x0a &&
		arr[6] === 0x1a &&
		arr[7] === 0x0a
	) {
		return { ext: 'png', mime: 'image/png' };
	}
	if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
		return { ext: 'jpg', mime: 'image/jpeg' };
	}
	return null;
}

/** 若返回体是 JSON 错误，解析出 message 便于提示 */
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

watch(
	totalPages,
	(val) => {
		if (val <= 0) return;
			pageSrcs.value = new Array(val).fill('');
			pageLoading.value = new Array(val).fill(false);
			pageErrors.value = new Array(val).fill('');
			pageRetryCounts.value = new Array(val).fill(0);
			const storedPage = Number(getStoredReadingRecord().currentPage) || 1;
			currentPage.value = Math.min(val, Math.max(1, storedPage));
			// 首屏只加载当前页，避免首次进入时并发转图过多导致偶发失败
			setTimeout(ensureCurrentPageLoaded, 80);
		},
		{ immediate: true },
	);

watch(
	[currentPage, ticket, totalPages],
	() => {
		setTimeout(ensureCurrentPageLoaded, 60);
	},
);

function onSwiperChange(e) {
	const index = e.detail.current ?? 0;
	currentPage.value = index + 1;
	resetZoom();
	persistReadingProgress(false);
	// 当前页优先加载，邻页稍后预加载，降低首次快速滑动时的并发压力
	ensureCurrentPageLoaded();
}

onLoad(async (options) => {
	const cid = options.courseId;
	const fid = options.fileId ? String(options.fileId) : '';
	const t = uni.getStorageSync('pdf_preview_ticket');
	uni.removeStorageSync('pdf_preview_ticket');
	if (!cid || !t) {
		error.value = '缺少预览参数，请从课程介绍页重新进入';
		return;
	}
	courseId.value = cid;
	fileId.value = fid;
	ticket.value = t;
	sessionStartAt.value = Date.now();
	startReadingReportTimer();
	try {
		const res = await getCoursePreviewPagesInfo(cid, t, fid ? Number(fid) : undefined);
		const total = res?.totalPages ?? 0;
		cacheVersion.value = res?.cacheVersion || '';
		totalPages.value = Math.max(0, Number(total));
		persistReadingProgress(false);
		if (totalPages.value === 0) {
			error.value = '暂无预览页';
		}
	} catch (e) {
		console.error('获取预览页数失败', e);
		error.value = e?.message || '加载失败，请重试';
	}
});

const onImageError = async (n) => {
	console.error('图片加载失败 page', n);
	await deleteCachedPdfPreviewPage(courseId.value, cacheVersion.value, n);
	const retries = Number(pageRetryCounts.value[n - 1]) || 0;
	if (retries < 1) {
		const retryNext = [...pageRetryCounts.value];
		retryNext[n - 1] = retries + 1;
		pageRetryCounts.value = retryNext;
		await reloadPage(n);
		return;
	}
	const next = [...pageLoading.value];
	next[n - 1] = false;
	pageLoading.value = next;
	setPageError(n, '图片加载失败');
};

const onImageLoad = (n) => {
	const next = [...pageLoading.value];
	next[n - 1] = false;
	pageLoading.value = next;
	clearPageError(n);
};

onHide(() => {
	persistReadingProgress(true);
	stopReadingReportTimer();
});

onShow(() => {
	if (courseId.value && !sessionStartAt.value) {
		sessionStartAt.value = Date.now();
	}
	if (courseId.value && !readingReportTimer) {
		startReadingReportTimer();
	}
	setTimeout(ensureCurrentPageLoaded, 80);
});

onUnload(() => {
	persistReadingProgress(true);
	stopReadingReportTimer();
});
</script>

<style lang="scss" scoped>
.file-preview-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #000;
	overflow: hidden;
}

.swiper-wrap {
	flex: 1;
	width: 100%;
	height: 100vh;
	box-sizing: border-box;
}

.swiper {
	height: 100%;
	width: 100%;
}

.swiper-item {
	height: 100%;
	width: 100%;
	background: #000;
}

.page-stage {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #000;
}

.zoom-area {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.zoom-view {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.page-image {
	width: 100%;
	height: 100%;
	display: block;
	background: transparent;
}

.page-placeholder {
	width: 72%;
	max-width: 640rpx;
	height: 72%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #1a1a1a;
	border-radius: 12rpx;
}
.placeholder-text {
	font-size: 26rpx;
	color: #999;
}

.placeholder-error {
	margin-top: 14rpx;
	max-width: 560rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: #777;
	text-align: center;
	word-break: break-all;
}
.error-wrap,
.loading-wrap {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: calc(var(--status-bar-height) + 44px) 32rpx 32rpx;
	background: #000;
}

.error-text {
	color: #f44;
	font-size: 28rpx;
	text-align: center;
}

.loading-text {
	color: rgba(255, 255, 255, 0.55);
	font-size: 28rpx;
}

.page-footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 24rpx;
	min-height: 48px;
	padding: 10rpx 32rpx calc(10rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	background: #000;
}

.page-footer-num {
	color: rgba(255, 255, 255, 0.92);
	font-size: 30rpx;
	font-weight: 500;
	letter-spacing: 1rpx;
	flex-shrink: 0;
}

.page-footer-jump {
	margin: 0;
	padding: 0 28rpx;
	height: 56rpx;
	line-height: 56rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.14);
	color: #fff;
	font-size: 26rpx;
	font-weight: 500;
	flex-shrink: 0;
}

.page-footer-jump::after {
	border: 0;
}

.preview-toolbar {
	position: fixed;
	left: 50%;
	bottom: calc(96rpx + env(safe-area-inset-bottom));
	transform: translateX(-50%);
	z-index: 22;
	display: flex;
	align-items: center;
	gap: 10rpx;
	max-width: calc(100vw - 24rpx);
	box-sizing: border-box;
	padding: 10rpx;
	border-radius: 999rpx;
	background: rgba(34, 34, 34, 0.78);
	box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.28);
	backdrop-filter: blur(12rpx);
}

.zoom-controls {
	display: flex;
	align-items: center;
	gap: 10rpx;
	flex-shrink: 0;
	padding: 0;
	border-radius: 999rpx;
	background: transparent;
}

.zoom-btn,
.zoom-value {
	margin: 0;
	padding: 0;
	height: 56rpx;
	line-height: 56rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.96);
	color: #333;
	font-size: 28rpx;
}

.zoom-btn {
	width: 56rpx;
	font-weight: 700;
}

.zoom-value {
	min-width: 92rpx;
	padding: 0 18rpx;
	font-size: 24rpx;
}

.zoom-btn[disabled] {
	opacity: 0.45;
}

.jump-mask {
	position: fixed;
	inset: 0;
	z-index: 50;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx;
	background: rgba(0, 0, 0, 0.54);
}

.jump-dialog {
	width: 100%;
	max-width: 560rpx;
	box-sizing: border-box;
	padding: 36rpx 32rpx 28rpx;
	border-radius: 20rpx;
	background: #fff;
}

.jump-title {
	display: block;
	text-align: center;
	font-size: 32rpx;
	font-weight: 600;
	color: #1f2937;
}

.jump-input-row {
	margin-top: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14rpx;
}

.jump-input {
	width: 180rpx;
	height: 72rpx;
	box-sizing: border-box;
	border: 2rpx solid #d8dce4;
	border-radius: 12rpx;
	text-align: center;
	font-size: 34rpx;
	font-weight: 600;
	color: #111827;
}

.jump-total {
	font-size: 28rpx;
	color: #6b7280;
}

.jump-actions {
	margin-top: 34rpx;
	display: flex;
	gap: 18rpx;
}

.jump-action {
	flex: 1;
	height: 72rpx;
	line-height: 72rpx;
	margin: 0;
	padding: 0;
	border-radius: 12rpx;
	font-size: 28rpx;
}

.jump-action::after {
	border: 0;
}

.jump-cancel {
	background: #f3f4f6;
	color: #374151;
}

.jump-confirm {
	background: #2f6fed;
	color: #fff;
}

@media screen and (min-width: 768px) {
	.page-placeholder {
		max-width: min(680px, calc(100vw - 96px));
		min-height: calc(100vh - 250px);
	}

	.page-footer-jump {
		height: 40px;
		line-height: 40px;
		font-size: 14px;
	}

	.preview-toolbar {
		gap: 8px;
		padding: 8px;
		bottom: calc(72px + env(safe-area-inset-bottom));
		max-width: calc(100vw - 80px);
	}

	.zoom-controls {
		gap: 8px;
	}

	.zoom-btn,
	.zoom-value {
		height: 40px;
		line-height: 40px;
		font-size: 20px;
	}

	.zoom-btn {
		width: 40px;
	}

	.zoom-value {
		min-width: 70px;
		padding: 0 14px;
		font-size: 15px;
	}

	.jump-dialog {
		max-width: 360px;
		padding: 26px 24px 22px;
		border-radius: 16px;
	}

	.jump-title {
		font-size: 20px;
	}

	.jump-input-row {
		margin-top: 24px;
	}

	.jump-input {
		width: 120px;
		height: 48px;
		font-size: 22px;
	}

	.jump-total {
		font-size: 17px;
	}

	.jump-actions {
		margin-top: 24px;
		gap: 12px;
	}

	.jump-action {
		height: 48px;
		line-height: 48px;
		font-size: 17px;
	}
}
</style>
