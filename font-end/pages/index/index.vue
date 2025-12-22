<template>
	<view class="index-page">
		<!-- 顶部蓝色渐变区域 -->
		<view class="top-header">
			<view class="header-content">
				<view class="header-top">
					<text class="app-title">考研刷题Pro</text>
					<view class="online-status">
						<view class="status-dot"></view>
						<text class="status-text">在线</text>
					</view>
				</view>

				<!-- AI 每日一句 -->
				<view class="ai-quote" v-if="dailyQuote || quoteLoading">
					<text class="quote-icon">✨</text>
					<text class="quote-text" v-if="!quoteLoading">{{ dailyQuote }}</text>
					<text class="quote-loading" v-else>✨ AI 正在酝酿今日鼓励...</text>
				</view>
			</view>
			<!-- 装饰圆形 -->
			<view class="decorative-circle"></view>
		</view>

		<view class="page-content">
			<!-- 快速操作按钮 -->
			<view class="quick-actions">
				<view class="action-btn" @click="handleActivation">
					<text class="action-icon">📱</text>
					<text class="action-text">使用激活码</text>
				</view>
				<view class="action-btn" @click="handleBankSettings">
					<text class="action-icon">⚙️</text>
					<text class="action-text">题库设置</text>
				</view>
			</view>

			<!-- 动态推荐板块 -->
			<template v-for="(category, categoryIdx) in recommendCategories" :key="category?.id || categoryIdx">
				<view v-if="category && category.items && Array.isArray(category.items)" class="section">
					<view class="section-header">
						<view class="section-title-wrapper">
							<view class="title-border" :class="{ purple: categoryIdx % 2 === 1 }"></view>
							<text class="section-title">{{ category.name || '推荐板块' }}</text>
						</view>
						<text class="section-more" v-if="category.items.length > 0" @click="viewMore(category.id)">
							查看全部{{ category.items.length }}
						</text>
					</view>

					<!-- 加载状态 -->
					<view v-if="homeDataLoading && category.items.length === 0" class="loading-state">
						<text class="loading-text">加载中...</text>
					</view>

					<!-- 空状态 -->
					<view v-else-if="!homeDataLoading && category.items.length === 0" class="empty-state">
						<text class="empty-text">暂无推荐内容</text>
					</view>

					<!-- 课程列表 - 根据板块类型或内容数量决定显示方式 -->
					<view v-else-if="category.items.length > 0">
						<!-- 网格布局（适用于公共课等，3列） -->
						<view
							v-if="category.display_type === 'grid' || (!category.display_type && category.items.length <= 6)"
							class="public-course-grid"
						>
							<view
								v-for="(course, idx) in category.items"
								:key="course?.id || idx"
								class="public-course-item"
								:class="`course-${idx}`"
								@click="handleCourseClick(course)"
							>
								<view class="course-icon-wrapper" :class="`icon-${idx % 3}`">
									<text class="course-icon">{{ getCourseIcon(idx) }}</text>
								</view>
								<text class="course-name-small">{{ course?.name || '' }}</text>
								<text class="course-count">{{ formatStudyCount(course?.studyCount || 0) }}人学</text>
							</view>
						</view>

						<!-- 列表布局（适用于专业课等，单列） -->
						<view v-else class="major-course-list">
							<view
								v-for="course in category.items"
								:key="course?.id"
								class="major-course-item"
								@click="handleCourseClick(course)"
							>
								<view class="major-course-left">
									<view class="major-course-icon">
										<text class="major-icon">🏆</text>
									</view>
									<view class="major-course-info">
										<text class="major-course-name">{{ course?.name || '' }}</text>
										<view class="major-course-tags" v-if="course?.tags && course.tags.length > 0">
											<text
												v-for="(tag, tagIdx) in course.tags"
												:key="tagIdx"
												class="course-tag"
												:class="tagIdx === 0 ? 'yellow' : 'gray'"
												>{{ tag }}</text
											>
										</view>
										<view class="major-course-tags" v-else>
											<text class="course-tag yellow">高端通关</text>
											<text class="course-tag gray">真题全解</text>
										</view>
									</view>
								</view>
								<view class="major-course-btn">去刷题</view>
							</view>
						</view>
					</view>
				</view>
			</template>
		</view>

		<!-- 引导收藏气泡 -->
		<view class="guide-bubble" v-if="showGuideBubble" @click="closeGuideBubble">
			<text class="bubble-text">添加到"我的小程序" ↗</text>
			<view class="bubble-arrow"></view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad, onReady, onShow } from '@dcloudio/uni-app';
import { useBankStore } from '@/store/bank';
import AppCountdown from '@/components/app-countdown/app-countdown.vue';
import { getHomeConfig, getDailyQuote, getRecommendCategories } from '@/api/index';

const bankStore = useBankStore();

onLoad((options) => {
	console.log('页面 onLoad 执行', options);
});

onReady(() => {
	console.log('页面 onReady 执行');
});

onShow(() => {
	console.log('页面 onShow 执行');
});

const countdownConfig = ref({
	targetDate: '2024-12-25', // 默认考研日期
	label: '距离考研还有',
});

const countdownDays = ref(0);
const dailyQuote = ref('');
const quoteLoading = ref(false);

// 推荐板块列表，从接口动态获取
const recommendCategories = ref([]);
const showGuideBubble = ref(true);
const homeDataLoading = ref(false);

onMounted(() => {
	console.log('首页 Vue onMounted 执行');
	checkGuideBubble();
	calculateCountdown();
	// 并行获取首页数据
	fetchHomeData();
	fetchDailyQuote();
});

const calculateCountdown = () => {
	const targetDate = new Date(countdownConfig.value.targetDate);
	const now = new Date();
	const diff = targetDate.getTime() - now.getTime();
	countdownDays.value = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

const formatStudyCount = (count) => {
	if (count >= 10000) {
		return (count / 10000).toFixed(1) + 'w';
	}
	return count.toString();
};

const getCourseIcon = (idx) => {
	const icons = ['📕', '📘', '📗'];
	return icons[idx] || '📚';
};

const fetchDailyQuote = async () => {
	quoteLoading.value = true;
	try {
		const res = await getDailyQuote();
		if (res && res.quote) {
			dailyQuote.value = res.quote;
		} else if (res && typeof res === 'string') {
			dailyQuote.value = res;
		} else {
			dailyQuote.value = '研途漫漫，终抵群星。';
		}
	} catch (error) {
		console.error('获取每日一句失败:', error);
		dailyQuote.value = '研途漫漫，终抵群星。';
	} finally {
		quoteLoading.value = false;
	}
};

const checkGuideBubble = () => {
	const hasClosed = uni.getStorageSync('guide_bubble_closed');
	showGuideBubble.value = !hasClosed;
};

const closeGuideBubble = () => {
	showGuideBubble.value = false;
	uni.setStorageSync('guide_bubble_closed', 'true');
};

const fetchHomeData = async () => {
	homeDataLoading.value = true;
	try {
		// 获取首页配置（倒计时等）
		const configRes = await getHomeConfig();
		if (configRes) {
			// 处理倒计时配置
			if (configRes.countdown) {
				countdownConfig.value = {
					targetDate: configRes.countdown.targetDate || configRes.countdown.date || '2024-12-25',
					label: configRes.countdown.label || '距离考研还有',
				};
				calculateCountdown();
			}
		}

		// 获取首页推荐板块（动态获取所有板块）
		const layoutRes = await getRecommendCategories();
		if (layoutRes) {
			// 重置推荐板块列表
			recommendCategories.value = [];

			// 后端返回格式: [{ id, name, items: [...] }, ...]
			if (Array.isArray(layoutRes)) {
				recommendCategories.value = layoutRes
					.map((category) => {
						// 确保 category 存在
						if (!category) {
							return null;
						}

						// 确保 items 是数组
						const items = Array.isArray(category.items) ? category.items : [];

						// 处理题库数据，确保字段映射正确
						// 后端返回的 Subject 实体字段：id, name, cover_img, description, price 等
						const processedItems = items
							.filter((item) => item != null) // 过滤掉 null/undefined
							.map((item) => ({
								id: item.id,
								name: item.name || item.title || '',
								description: item.description || item.desc || '',
								cover: item.cover_img || item.cover || item.image || '',
								studyCount: item.studyCount || item.student_count || item.studentCount || 0,
								isVip: item.is_vip_free === 1 || item.is_vip || false,
								price: item.price || 0,
								tags: item.tags || [],
								...item, // 保留其他字段
							}));

						return {
							id: category.id || 0,
							name: category.name || '推荐板块',
							items: processedItems,
							display_type: category.display_type || (processedItems.length > 6 ? 'list' : 'grid'),
							sort: category.sort || 0,
						};
					})
					.filter((category) => category != null && category.items && category.items.length > 0); // 只显示有内容的板块
			}
			// 兼容其他格式（向后兼容）
			else if (layoutRes.categories && Array.isArray(layoutRes.categories)) {
				recommendCategories.value = layoutRes.categories
					.map((category) => {
						if (!category) return null;
						return {
							id: category.id || 0,
							name: category.name || '推荐板块',
							items: Array.isArray(category.items) ? category.items : [],
							display_type: category.display_type || 'grid',
						};
					})
					.filter((category) => category != null && category.items && category.items.length > 0);
			}
		}
	} catch (error) {
		console.error('获取首页数据失败:', error);
		// 接口失败时，保持空数组，页面显示空状态
		recommendCategories.value = [];
	} finally {
		homeDataLoading.value = false;
	}
};

const handleActivation = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/activation/index',
	});
};

const handleBankSettings = () => {
	uni.showToast({
		title: '题库设置功能开发中',
		icon: 'none',
	});
};

const handleCourseClick = async (course) => {
	if (!course || !course.id) {
		uni.showToast({
			title: '题库信息不完整',
			icon: 'none',
		});
		return;
	}

	try {
		// 切换到对应题库
		bankStore.setCurrentBank(course.id);
		// 跳转到题库详情页
		uni.switchTab({
			url: '/pages/bank/index',
		});
	} catch (error) {
		console.error('切换题库失败:', error);
		uni.showToast({
			title: '切换题库失败，请重试',
			icon: 'none',
		});
	}
};

const viewMore = (categoryId) => {
	// 跳转到题库页面，可以传递分类ID用于筛选
	uni.switchTab({
		url: '/pages/bank/index',
	});
};

const handleImageError = (e) => {
	console.log('图片加载失败:', e);
};
</script>

<style lang="scss" scoped>
.index-page {
	width: 100%;
	min-height: 100vh;
	background: #f5f5f5;
	padding: 0;
	padding-bottom: 120rpx;
	box-sizing: border-box;
	overflow-x: hidden;
}

/* 顶部蓝色渐变区域 */
.top-header {
	background: #2563eb;
	color: #ffffff;
	padding: 48rpx 32rpx 48rpx;
	padding-top: calc(var(--status-bar-height) + 48rpx);
	border-radius: 0 0 60rpx 60rpx;
	position: relative;
	overflow: visible;
	box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.3);
	z-index: 10;
	width: 100%;
	box-sizing: border-box;
}

.header-content {
	position: relative;
	z-index: 10;
	width: 100%;
	box-sizing: border-box;
}

.header-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32rpx;
	width: 100%;
	box-sizing: border-box;
}

.app-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #ffffff;
}

.online-status {
	display: flex;
	align-items: center;
	background: rgba(59, 130, 246, 0.5);
	padding: 8rpx 16rpx;
	border-radius: 40rpx;
	font-size: 24rpx;
}

.status-dot {
	width: 16rpx;
	height: 16rpx;
	background: #10b981;
	border-radius: 50%;
	margin-right: 8rpx;
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

.status-text {
	color: #ffffff;
}

.ai-quote {
	margin-top: 0;
	background: rgba(59, 130, 246, 0.3);
	border-radius: 16rpx;
	padding: 16rpx;
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	width: 100%;
	box-sizing: border-box;
}

.quote-icon {
	font-size: 28rpx;
	flex-shrink: 0;
	margin-top: 4rpx;
}

.quote-text {
	flex: 1;
	font-style: italic;
	line-height: 1.5;
	min-width: 0;
	word-break: break-word;
}

.quote-loading {
	flex: 1;
	animation: pulse 1.5s infinite;
}

.decorative-circle {
	position: absolute;
	top: -80rpx;
	right: -80rpx;
	width: 320rpx;
	height: 320rpx;
	background: rgba(59, 130, 246, 0.3);
	border-radius: 50%;
}

.page-content {
	width: 100%;
	padding: 0 32rpx;
	padding-top: 0;
	margin-top: -24rpx;
	position: relative;
	z-index: 20;
	box-sizing: border-box;
}

/* 快速操作按钮 */
.quick-actions {
	display: flex;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 64rpx;
	width: 100%;
	box-sizing: border-box;
}

.action-btn {
	background: #ffffff;
	padding: 24rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	transition: all 0.3s ease;
	box-sizing: border-box;

	&:active {
		transform: scale(0.95);
	}
}

.action-icon {
	font-size: 64rpx;
	margin-bottom: 16rpx;
}

.action-text {
	font-size: 28rpx;
	color: #374151;
	font-weight: 500;
}

/* 公共课推荐 */
.section {
	margin-bottom: 64rpx;
	width: 100%;
	box-sizing: border-box;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
	width: 100%;
	box-sizing: border-box;
}

.section-title-wrapper {
	display: flex;
	align-items: center;
}

.title-border {
	width: 8rpx;
	height: 32rpx;
	background: #2563eb;
	border-radius: 4rpx;
	margin-right: 16rpx;

	&.purple {
		background: #9333ea;
	}
}

.section-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #1f2937;
}

.section-more {
	font-size: 24rpx;
	color: #9ca3af;
}

.public-course-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16rpx;
	width: 100%;
	box-sizing: border-box;
}

.public-course-item {
	background: #ffffff;
	padding: 24rpx 16rpx;
	border-radius: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	border: 2rpx solid #f3f4f6;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 200rpx;
	transition: all 0.3s ease;
	box-sizing: border-box;
	width: 100%;
	overflow: hidden;

	&:active {
		background: #f9fafb;
		transform: scale(0.98);
	}
}

.course-icon-wrapper {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16rpx;

	&.icon-0 {
		background: #fecaca;
	}

	&.icon-1 {
		background: #e0e7ff;
	}

	&.icon-2 {
		background: #d1fae5;
	}
}

.course-icon {
	font-size: 40rpx;
}

.course-name-small {
	font-size: 28rpx;
	font-weight: 500;
	color: #374151;
	margin-bottom: 8rpx;
	text-align: center;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	box-sizing: border-box;
}

.course-count {
	font-size: 20rpx;
	color: #9ca3af;
}

/* 专业课精选 */
.major-course-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	width: 100%;
	box-sizing: border-box;
}

.major-course-item {
	background: #ffffff;
	padding: 32rpx;
	border-radius: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	border: 2rpx solid #f3f4f6;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all 0.3s ease;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;

	&:active {
		transform: scale(0.99);
	}
}

.major-course-left {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.major-course-icon {
	width: 96rpx;
	height: 96rpx;
	background: #f3e8ff;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
}

.major-icon {
	font-size: 48rpx;
}

.major-course-info {
	flex: 1;
	min-width: 0;
}

.major-course-name {
	font-size: 32rpx;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 12rpx;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
	box-sizing: border-box;
}

.major-course-tags {
	display: flex;
	gap: 16rpx;
	flex-wrap: wrap;
}

.course-tag {
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;

	&.yellow {
		background: #fef3c7;
		color: #92400e;
	}

	&.gray {
		background: #f3f4f6;
		color: #6b7280;
	}
}

.major-course-btn {
	background: #dbeafe;
	color: #2563eb;
	padding: 12rpx 24rpx;
	border-radius: 40rpx;
	font-size: 24rpx;
	font-weight: 500;
	flex-shrink: 0;
	margin-left: 16rpx;
	white-space: nowrap;
	box-sizing: border-box;
}

/* 引导气泡 */
.guide-bubble {
	position: absolute;
	top: 140rpx;
	right: 32rpx;
	background: #374151;
	color: #ffffff;
	font-size: 24rpx;
	padding: 12rpx 20rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
	z-index: 100;
	animation: bounce 2s infinite;
	max-width: 240rpx;
}

@keyframes bounce {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-8rpx);
	}
}

.bubble-text {
	color: #ffffff;
	font-size: 24rpx;
	line-height: 1.4;
}

.bubble-arrow {
	position: absolute;
	top: -6rpx;
	right: 32rpx;
	width: 12rpx;
	height: 12rpx;
	background: #374151;
	transform: rotate(45deg);
}

/* 加载和空状态 */
.loading-state,
.empty-state {
	padding: 80rpx 0;
	text-align: center;
	width: 100%;
	box-sizing: border-box;
}

.loading-text,
.empty-text {
	font-size: 28rpx;
	color: #9ca3af;
}
</style>
