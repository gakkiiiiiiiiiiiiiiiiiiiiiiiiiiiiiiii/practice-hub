<template>
	<view class="category-page" :class="pageClasses">
		<!-- 顶部导航栏 -->
		<view class="category-header" :style="categoryHeaderStyle">
			<view class="header-content" :style="categoryHeaderContentStyle">
				<text class="header-title" :style="categoryHeaderTitleStyle">题库</text>
			</view>
		</view>

		<!-- 分类内容区域 -->
		<view class="category-container" :style="categoryContainerStyle">
			<!-- 左侧一级分类列表 -->
			<scroll-view class="primary-list" scroll-y>
				<view v-if="loading" class="loading-container">
					<text class="loading-text">加载中...</text>
				</view>
				<template v-else>
					<view v-if="primaryCategories.length === 0" class="empty-container">
						<text class="empty-text">暂无分类</text>
					</view>
					<view
						v-for="category in primaryCategories"
						:key="category.id"
						class="primary-item"
						:class="{ active: Number(currentCategoryId) === Number(category.id) }"
						@click="selectCategory(category.id)"
					>
						<text class="primary-text">{{ category.name }}</text>
					</view>
				</template>
			</scroll-view>

			<!-- 右侧二级分类网格 -->
			<scroll-view
				class="secondary-content"
				scroll-y
				refresher-enabled
				:refresher-threshold="55"
				:refresher-triggered="refresherTriggered"
				@refresherrefresh="onRefresh"
			>
				<!-- 加载状态 -->
				<view v-if="loading" class="loading-container">
					<text class="loading-text">加载中...</text>
				</view>

				<!-- 内容区域 -->
				<template v-else>
					<view v-if="secondaryCategories.length === 0" class="empty-container">
						<text class="empty-text">暂无分类</text>
					</view>
					<view v-else class="secondary-grid">
						<view
							v-for="subCategory in secondaryCategories"
							:key="subCategory.id"
							class="secondary-item"
							:class="{ active: Number(currentSecondaryCategoryId) === Number(subCategory.id) }"
							@click="selectSecondaryCategory(subCategory)"
						>
							<text class="secondary-text">{{ subCategory.name }}</text>
						</view>
					</view>
				</template>
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { getCourseCategories } from '@/api/index';
import { getDefaultShare, toTimelineShare } from '@/utils/share';
import { usePageClasses } from '@/composables/usePageClasses';

const pageClasses = usePageClasses();

const categoryShare = () =>
	getDefaultShare({
		title: '研刷通题库分类｜找适合你的课程',
		path: '/pages/category/index',
	});

onShareAppMessage(() => categoryShare());
onShareTimeline(() => toTimelineShare(categoryShare()));

const categories = ref([]);
const currentCategoryId = ref(null); // 当前选中的一级分类ID
const currentSecondaryCategoryId = ref(null); // 当前选中的二级分类ID
const loading = ref(false);
const refresherTriggered = ref(false);
const navbarMetrics = ref({
	height: 88,
	statusBarHeight: 0,
	contentHeight: 44,
	contentTop: 0,
	rightSafeWidth: 0,
});

const categoryHeaderStyle = computed(() => ({
	height: `${navbarMetrics.value.height}px`,
	paddingTop: `${navbarMetrics.value.statusBarHeight}px`,
}));

const categoryHeaderContentStyle = computed(() => ({
	height: `${navbarMetrics.value.contentHeight}px`,
	marginTop: `${navbarMetrics.value.contentTop}px`,
}));

const categoryHeaderTitleStyle = computed(() => ({
	maxWidth: `calc(100% - ${Math.max(160, navbarMetrics.value.rightSafeWidth * 2)}px)`,
}));

const categoryContainerStyle = computed(() => ({
	height: `calc(100vh - ${navbarMetrics.value.height}px)`,
}));

// 一级分类列表
const primaryCategories = computed(() => {
	return categories.value;
});

// 当前一级分类下的二级分类列表
const secondaryCategories = computed(() => {
	if (!currentCategoryId.value) {
		return [];
	}
	const category = categories.value.find(cat => {
		// 确保类型匹配（都转换为数字进行比较）
		const catId = Number(cat.id);
		const currentId = Number(currentCategoryId.value);
		return catId === currentId;
	});
	if (!category || !Array.isArray(category.children)) {
		return [];
	}
	return category.children;
});

onMounted(() => {
	initNavbarMetrics();
	fetchSubjectsList();
});

const initNavbarMetrics = () => {
	try {
		const systemInfo = uni.getSystemInfoSync();
		const statusBarHeight = systemInfo.statusBarHeight || 0;
		let contentHeight = 44;
		let contentTop = 0;
		let rightSafeWidth = 0;
		let navHeight = statusBarHeight + contentHeight;

		// 微信小程序胶囊按钮是自定义导航栏最可靠的安全区参考。
		// #ifdef MP-WEIXIN
		const menuButton = wx.getMenuButtonBoundingClientRect();
		contentHeight = menuButton.height;
		contentTop = Math.max(0, menuButton.top - statusBarHeight);
		rightSafeWidth = Math.max(0, (systemInfo.windowWidth || 0) - menuButton.left + 8);
		navHeight = menuButton.bottom + 8;
		// #endif

		navbarMetrics.value = {
			height: navHeight,
			statusBarHeight,
			contentHeight,
			contentTop,
			rightSafeWidth,
		};
	} catch (error) {
		console.warn('导航栏安全区计算失败，使用默认高度:', error);
	}
};

const onRefresh = async () => {
	refresherTriggered.value = true;
	try {
		await fetchSubjectsList({ silent: true });
	} catch (e) {
		console.error('下拉刷新失败:', e);
	} finally {
		refresherTriggered.value = false;
	}
};

// 选择一级分类
const selectCategory = (categoryId) => {
	currentCategoryId.value = categoryId;
	currentSecondaryCategoryId.value = null; // 重置二级分类选择
};

// 选择二级分类
const selectSecondaryCategory = (subCategory) => {
	currentSecondaryCategoryId.value = subCategory.id;
	
	// 获取当前一级分类名称
	const currentCategory = categories.value.find(cat => cat.id === currentCategoryId.value);
	const primaryCategoryName = currentCategory?.name || '';
	
	// 跳转到课程列表页面，传递一级分类和二级分类名称
	uni.navigateTo({
		url: `/pages/sub-pages/course-list/index?categoryName=${encodeURIComponent(subCategory.name)}&category=${encodeURIComponent(primaryCategoryName)}&subCategory=${encodeURIComponent(subCategory.name)}`,
	});
};

// 获取课程分类列表
const fetchSubjectsList = async (opts = {}) => {
	const silent = opts.silent === true;
	try {
		if (!silent) {
			loading.value = true;
		}
		const res = await getCourseCategories();

		// 处理返回数据：request.js 已经提取了 data 字段，所以 res 应该是数组
		let categoriesList = res;
		if (res && res.data && Array.isArray(res.data)) {
			categoriesList = res.data;
		} else if (!Array.isArray(res)) {
			console.warn('课程分类数据格式不正确:', res);
			categoriesList = [];
		}

		if (categoriesList && Array.isArray(categoriesList) && categoriesList.length > 0) {
			categories.value = categoriesList;

			// 默认选择第一个一级分类
			if (categories.value.length > 0 && !currentCategoryId.value) {
				currentCategoryId.value = categories.value[0].id;
			}
		} else {
			categories.value = [];
			currentCategoryId.value = null;
		}
	} catch (error) {
		console.error('获取课程分类失败:', error);
		categories.value = [];
		currentCategoryId.value = null;
		uni.showToast({
			title: '加载失败，请重试',
			icon: 'none',
		});
	} finally {
		if (!silent) {
			loading.value = false;
		}
	}
};

</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.category-page {
	min-height: 100vh;
	background: $bg-secondary;
	@include flex(column, flex-start, stretch, 0);
	padding-bottom: $space-24;
	box-sizing: border-box;
	overflow-x: hidden;
	width: 100%;
	font-family: $font-family-base;
}

// 主题色变量（蓝色）
$theme-color: #596c8b;
$theme-color-dark: #2563EB;
$theme-color-light: #60A5FA;

.category-header {
	background: #ffffff;
	padding: 0 $space-6;
	position: sticky;
	top: 0;
	z-index: $z-sticky;
	border-bottom: 1rpx solid $color-neutral-200;
	width: 100%;
	box-sizing: border-box;
}

.header-content {
	@include flex(row, center, space-between, $space-8);
	width: 100%;
	box-sizing: border-box;
	position: relative;
}

.header-title {
	font-size: 34rpx;
	line-height: 1.2;
	font-weight: 600;
	color: $text-primary;
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: max-content;
	text-align: center;
	@include truncate;
	pointer-events: none;
}

.category-container {
	flex: 1;
	@include flex(row, flex-start, stretch, 0);
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
}

.primary-list {
	width: 200rpx;
	background: $bg-primary;
	border-right: 1rpx solid $color-neutral-200;
	height: 100%;
	box-sizing: border-box;
	overflow-y: auto;
}

.primary-item {
	padding: 0;
	min-height: 88rpx;
	@include flex(row, center, center, 0);
	cursor: pointer;
	position: relative;
	border-bottom: 1rpx solid $color-neutral-100;
	box-sizing: border-box;
	transition: all $transition-base;

	&:last-child {
		border-bottom: none;
	}

	&.active {
		background: rgba($theme-color, 0.08);
		color: $theme-color;
		font-weight: $font-weight-bold;
		border-left: 4rpx solid $theme-color;
	}

	&:active {
		background: rgba($theme-color, 0.12);
	}
}

.primary-text {
	@include text(md, medium, primary);
	text-align: center;
	width: 100%;
	@include truncate;
	line-height: 1.5;
}

.secondary-content {
	flex: 1;
	background: $bg-secondary;
	height: 100%;
	padding: $space-4;
	box-sizing: border-box;
}

.secondary-grid {
	@include grid(2, $space-4);
	width: 100%;
	box-sizing: border-box;
}

.secondary-item {
	padding: $space-6 $space-4;
	min-height: 80rpx;
	@include flex(row, center, center, 0);
	cursor: pointer;
	transition: all $transition-base;
	background: $bg-primary;
	border: 1rpx solid $color-neutral-200;
	border-radius: $radius-md;
	box-sizing: border-box;
	box-shadow: $shadow-sm;
	position: relative;

	&:active {
		transform: scale(0.98);
		opacity: 0.8;
		box-shadow: $shadow-xs;
	}

	&.active {
		border-color: $theme-color;
		background: rgba($theme-color, 0.05);
		
		.secondary-text {
			color: $theme-color;
			font-weight: $font-weight-medium;
		}
	}

	&:hover {
		border-color: rgba($theme-color, 0.3);
	}
}

.secondary-text {
	@include text(base, normal, primary);
	text-align: center;
	width: 100%;
	@include truncate;
	transition: color $transition-base;
	line-height: 1.5;
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-text {
	@include text(sm, normal, tertiary);
}

.loading-container,
.empty-container {
	padding: $space-20 $space-8;
	@include flex(column, center, center, $space-4);
	width: 100%;
	height: 100%;
	min-height: 400rpx;
	box-sizing: border-box;
}

.loading-text {
	@include text(sm, normal, tertiary);
}

// 全局设置样式
.category-page {
	transition: background-color 0.3s, color 0.3s;
	
	&.night-mode {
		background-color: #1a1a1a;
		color: #e0e0e0;
	}
	
	&.font-size-small {
		font-size: 26rpx;
	}
	
	&.font-size-medium {
		font-size: 30rpx;
	}
	
	&.font-size-large {
		font-size: 34rpx;
	}
	
	&.font-size-xlarge {
		font-size: 38rpx;
	}
}

@media screen and (min-width: 768px) {
	.category-header {
		padding-left: 24px;
		padding-right: 24px;
	}

	.primary-list {
		width: 132px;
	}

	.primary-item {
		min-height: 58px;
	}

	.secondary-content {
		padding: 14px;
	}

	.secondary-grid {
		gap: 14px;
	}

	.secondary-item {
		min-height: 56px;
		padding: 12px 14px;
		border-radius: 10px;
	}
}
</style>
