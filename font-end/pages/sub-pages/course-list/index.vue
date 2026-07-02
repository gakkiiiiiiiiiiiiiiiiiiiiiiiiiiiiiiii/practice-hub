<template>
	<view class="course-list-page">
		<!-- 顶部蓝色导航栏 -->
		<view class="top-header" :style="headerStyle">
			<view class="header-content" :style="headerContentStyle">
				<view class="header-left" @click="handleBack">
					<app-icon name="arrow-left" :size="40" color="#ffffff" />
				</view>
				<text class="header-title" :style="headerTitleStyle">{{ categoryName || '课程列表' }}</text>
			</view>
		</view>

		<view class="search-section" :style="searchSectionStyle">
			<view class="search-box">
				<app-icon name="search" :size="28" color="#9ca3af" />
				<input
					v-model="searchKeyword"
					class="search-input"
					placeholder="搜索课程名称"
					confirm-type="search"
					@input="handleSearchInput"
					@confirm="handleSearchConfirm"
				/>
				<view v-if="searchKeyword" class="search-clear" @click="clearSearch">
					<app-icon name="close" :size="24" color="#9ca3af" />
				</view>
			</view>
			<view
				v-if="showCategoryBundleEntry"
				class="category-bundle-card"
				:class="{ owned: categoryBundleInfo.hasPurchasedAll }"
				@click="handleBuyCategoryBundle"
			>
				<view class="category-bundle-visual">
					<view class="bundle-stack-card bundle-stack-card-one"></view>
					<view class="bundle-stack-card bundle-stack-card-two"></view>
					<view class="bundle-stack-card bundle-stack-card-main">
						<view class="bundle-stack-grid">
							<view class="bundle-stack-tile"></view>
							<view class="bundle-stack-tile"></view>
							<view class="bundle-stack-tile"></view>
							<view class="bundle-stack-tile"></view>
						</view>
						<text class="bundle-stack-label">合集</text>
					</view>
					<text class="bundle-stack-count">{{ categoryBundleCourseCountText }}</text>
				</view>
				<view class="category-bundle-content">
					<text class="category-bundle-title">{{ categoryBundleTitle }}</text>
					<text class="category-bundle-meta">{{ categoryBundleMetaText }}</text>
					<view class="category-bundle-tags">
						<text class="category-bundle-tag">优质资料</text>
						<text class="category-bundle-tag">{{ categoryBundleStatusText }}</text>
					</view>
				</view>
				<view
					class="category-bundle-action"
					:class="{ disabled: categoryBundleInfo.hasPurchasedAll || categoryBundleBuying }"
					@click.stop="handleBuyCategoryBundle"
				>
					<text class="category-bundle-price">{{ categoryBundlePriceText }}</text>
					<view class="category-bundle-button">
						<text>{{ categoryBundleActionText }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 排序筛选栏 -->
		<view class="filter-bar" :style="filterBarStyle">
			<view class="filter-main">
				<view
					class="filter-item"
					:class="{ active: sortDropdownOpen || (currentSort !== 'default' && currentSort !== 'sales') }"
					@click="toggleSortDropdown"
				>
					<text class="filter-text">{{ currentSortLabel }}</text>
					<app-icon
						name="arrow-down"
						:size="22"
						:color="sortDropdownOpen || (currentSort !== 'default' && currentSort !== 'sales') ? '#1767f2' : '#8b95a1'"
					/>
				</view>
				<view class="filter-item" :class="{ active: currentSort === 'sales' }" @click="selectSort('sales')">
					<text class="filter-text">销量优先</text>
				</view>
				<view class="filter-item" :class="{ active: typeDropdownOpen || selectedCourseTypeId }" @click="toggleTypeDropdown">
					<text class="filter-text">{{ selectedCourseTypeName || '课程类型' }}</text>
					<app-icon name="arrow-down" :size="22" :color="typeDropdownOpen || selectedCourseTypeId ? '#1767f2' : '#8b95a1'" />
				</view>
			</view>
			<view v-if="sortDropdownOpen" class="filter-dropdown">
				<view
					v-for="option in sortOptions"
					:key="option.value"
					class="dropdown-option"
					:class="{ active: currentSort === option.value }"
					@click="selectSort(option.value)"
				>
					{{ option.label }}
				</view>
			</view>
			<view v-if="typeDropdownOpen" class="filter-dropdown type-dropdown">
				<view class="dropdown-option" :class="{ active: !selectedCourseTypeId }" @click="selectCourseType(null)">
					全部类型
				</view>
				<view
					v-for="type in courseTypes"
					:key="type.id"
					class="dropdown-option"
					:class="{ active: selectedCourseTypeId === type.id }"
					@click="selectCourseType(type)"
				>
					{{ type.name }}
				</view>
			</view>
		</view>

		<!-- 课程列表 -->
		<scroll-view
			class="course-list-container"
			:style="courseListContainerStyle"
			scroll-y
			@scrolltolower="handleLoadMore"
		>
			<view v-if="loading && courseList.length === 0" class="loading-container">
				<text class="loading-text">加载中...</text>
			</view>
			<view v-else-if="courseList.length === 0" class="empty-container">
				<text class="empty-text">暂无课程</text>
			</view>
			<view v-else class="course-list">
				<view
					v-for="course in courseList"
					:key="course.id"
					class="course-item"
					@click="handleCourseClick(course)"
				>
					<view class="course-thumbnail">
						<image
							v-if="course.cover_img"
							:src="getImageUrl(course.cover_img)"
							class="thumbnail-image"
							mode="aspectFill"
						/>
						<view v-else class="thumbnail-placeholder">
							<app-icon name="book" :size="80" color="#ccc" />
						</view>
					</view>
					<view class="course-info">
						<view class="course-title-wrapper">
							<text class="course-title">{{ course.name }}</text>
						</view>
						<text v-if="course.description && course.description !== course.name" class="course-desc">{{ course.description }}</text>
						<text class="course-subtitle">{{ formatCourseSubtitle(course) }}</text>
						<view class="course-tags-row">
							<text v-if="course.courseType?.name" class="course-type-tag">{{ course.courseType.name }}</text>
							<text v-if="formatCourseValidity(course)" class="validity-tag" :class="{ owned: course.hasAuth }">
								{{ formatCourseValidity(course) }}
							</text>
						</view>
						<view class="course-footer">
							<view class="course-price">
								<text v-if="Number(course.is_free) === 1 || Number(course.price) === 0" class="price-free">免费</text>
								<text v-else class="price-current">¥{{ Number(course.price).toFixed(2) }}</text>
								<text v-if="course.agent_price && Number(course.agent_price) > Number(course.price)" class="price-original">
									¥{{ Number(course.agent_price).toFixed(2) }}
								</text>
							</view>
							<view class="course-buy-btn" :class="{ owned: course.hasAuth }" @click.stop="handleCourseClick(course)">
								<text>{{ course.hasAuth ? '去学习' : '去购买' }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			<view v-if="loading && courseList.length > 0" class="load-more">
				<text class="load-more-text">加载中...</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import {
	getAllCourses,
	getCategoryBundleInfo,
	getCourseTypes,
	createOrder,
	confirmWechatPayment,
} from '@/api/index';
import { useUserStore } from '@/store/user';
import { getImageUrl } from '@/utils/image';
import { buildSharePath, getDefaultShare, toTimelineShare } from '@/utils/share';
import {
	blockVirtualPaymentIfNotReady,
	formatVirtualPaymentFailMessage,
	invokeVirtualPayment,
} from '@/utils/virtual-payment';

const userStore = useUserStore();

// 页面参数
const categoryName = ref('');
const category = ref('');
const subCategory = ref('');

const courseListShare = () =>
	getDefaultShare({
		title: categoryName.value ? `研刷通课程｜${categoryName.value}` : '研刷通课程列表',
		path: buildSharePath('/pages/sub-pages/course-list/index', {
			categoryName: categoryName.value,
			category: category.value,
			subCategory: subCategory.value,
		}),
	});

onShareAppMessage(() => courseListShare());
onShareTimeline(() => toTimelineShare(courseListShare()));

// 搜索与筛选
const sortOptions = [
	{ label: '综合', value: 'default' },
	{ label: '价格从高到低', value: 'price_desc' },
	{ label: '价格从低到高', value: 'price_asc' },
	{ label: '最新题库', value: 'latest' },
];
const currentSort = ref('default');
const searchKeyword = ref('');
const searchTimer = ref(null);
const sortDropdownOpen = ref(false);
const typeDropdownOpen = ref(false);
const courseTypes = ref([]);
const selectedCourseTypeId = ref(null);
const selectedCourseTypeName = ref('');
const categoryBundleInfo = ref(null);
const categoryBundleLoading = ref(false);
const categoryBundleBuying = ref(false);

// 课程列表
const courseList = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const page = ref(1);
const pageSize = 20;
const navbarMetrics = ref({
	height: 88,
	statusBarHeight: 0,
	contentHeight: 44,
	contentTop: 0,
	rightSafeWidth: 0,
});

const headerStyle = computed(() => ({
	height: `${navbarMetrics.value.height}px`,
	paddingTop: `${navbarMetrics.value.statusBarHeight}px`,
}));

const headerContentStyle = computed(() => ({
	height: `${navbarMetrics.value.contentHeight}px`,
	marginTop: `${navbarMetrics.value.contentTop}px`,
	paddingRight: `${navbarMetrics.value.rightSafeWidth}px`,
}));

const headerTitleStyle = computed(() => ({
	maxWidth: `calc(100% - ${Math.max(176, navbarMetrics.value.rightSafeWidth * 2)}px)`,
}));

const showCategoryBundleEntry = computed(() => {
	const info = categoryBundleInfo.value;
	return !!(info?.available && Number(info.courseCount || 0) > 0);
});

const categoryBundleExtraHeight = computed(() => (showCategoryBundleEntry.value ? 188 : 0));

const filterBarStyle = computed(() => ({
	top: `${navbarMetrics.value.height + uni.upx2px(128 + categoryBundleExtraHeight.value)}px`,
}));

const searchSectionStyle = computed(() => ({
	top: `${navbarMetrics.value.height}px`,
}));

const courseListContainerStyle = computed(() => ({
	height: `calc(100vh - ${navbarMetrics.value.height}px - ${224 + categoryBundleExtraHeight.value}rpx)`,
}));

const currentSortLabel = computed(() => {
	if (currentSort.value === 'sales') return '综合';
	return sortOptions.find((item) => item.value === currentSort.value)?.label || '综合';
});

const categoryBundleTitle = computed(() => {
	const info = categoryBundleInfo.value || {};
	const name = info.subCategory || info.categoryName || subCategory.value || categoryName.value || '当前分类';
	return `${name}全部课程`;
});

const categoryBundleStatusText = computed(() => {
	const info = categoryBundleInfo.value || {};
	const courseCount = Number(info.courseCount || 0);
	const purchasedCount = Number(info.purchasedCount || 0);
	if (info.hasPurchasedAll) {
		return '已拥有';
	}
	if (purchasedCount > 0) {
		return `已拥有 ${purchasedCount}/${courseCount}`;
	}
	return '未购买';
});

const categoryBundleMetaText = computed(() => {
	const info = categoryBundleInfo.value || {};
	const courseCount = Number(info.courseCount || 0);
	return `${courseCount} 门课程 · 系统复习更高效`;
});

const categoryBundleCourseCountText = computed(() => {
	const info = categoryBundleInfo.value || {};
	const courseCount = Number(info.courseCount || 0);
	return `${courseCount}门`;
});

const categoryBundlePriceText = computed(() => {
	const info = categoryBundleInfo.value || {};
	const price = Number(info.price ?? 30);
	return price > 0 ? `¥${price.toFixed(0)}` : '免费';
});

const categoryBundleActionText = computed(() => {
	const info = categoryBundleInfo.value || {};
	if (categoryBundleBuying.value) return '处理中';
	if (categoryBundleLoading.value) return '加载中';
	if (info.hasPurchasedAll) return '已拥有';
	return Number(info.price ?? 30) > 0 ? '购买合集' : '立即开通';
});

const normalizeCategoryText = (value) => String(value || '').trim();

const isPlaceholderCategoryName = (value) => !normalizeCategoryText(value) || normalizeCategoryText(value) === '课程列表';

const addUniqueCategoryCandidate = (list, candidate) => {
	const normalized = {
		category: normalizeCategoryText(candidate?.category),
		subCategory: normalizeCategoryText(candidate?.subCategory),
	};
	if (!normalized.category && !normalized.subCategory) return;
	const key = `${normalized.category}__${normalized.subCategory}`;
	if (list.some((item) => `${item.category}__${item.subCategory}` === key)) return;
	list.push(normalized);
};

const getCourseListCategoryParams = () => {
	const params = {
		category: normalizeCategoryText(category.value),
		subCategory: normalizeCategoryText(subCategory.value),
	};
	const title = normalizeCategoryText(categoryName.value);
	if (!params.category && !params.subCategory && !isPlaceholderCategoryName(title)) {
		params.category = title;
	}
	return params;
};

const getInferredCourseCategoryCandidate = () => {
	const courses = Array.isArray(courseList.value) ? courseList.value : [];
	if (courses.length === 0) return null;
	const categories = Array.from(new Set(courses.map((course) => normalizeCategoryText(course.category)).filter(Boolean)));
	const subCategories = Array.from(
		new Set(courses.map((course) => normalizeCategoryText(course.sub_category || course.subCategory)).filter(Boolean)),
	);
	if (categories.length !== 1 && subCategories.length !== 1) return null;
	return {
		category: categories.length === 1 ? categories[0] : '',
		subCategory: subCategories.length === 1 ? subCategories[0] : '',
	};
};

const getCategoryBundleParamCandidates = () => {
	const candidates = [];
	const title = normalizeCategoryText(categoryName.value);
	const primary = normalizeCategoryText(category.value);
	const secondary = normalizeCategoryText(subCategory.value);
	const listParams = getCourseListCategoryParams();

	if (primary && !secondary && !isPlaceholderCategoryName(title) && title !== primary) {
		addUniqueCategoryCandidate(candidates, { category: primary, subCategory: title });
	}

	addUniqueCategoryCandidate(candidates, listParams);
	addUniqueCategoryCandidate(candidates, { category: primary, subCategory: secondary });
	if (!secondary && !isPlaceholderCategoryName(title)) {
		addUniqueCategoryCandidate(candidates, { category: '', subCategory: title });
	}

	addUniqueCategoryCandidate(candidates, getInferredCourseCategoryCandidate());
	return candidates;
};

const initNavbarMetrics = () => {
	try {
		const systemInfo = uni.getSystemInfoSync();
		const statusBarHeight = systemInfo.statusBarHeight || 0;
		let contentHeight = 44;
		let contentTop = 0;
		let rightSafeWidth = 0;
		let navHeight = statusBarHeight + contentHeight;

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

// 获取课程列表
const fetchCourseList = async (reset = false) => {
	if (loading.value) return;
	
	try {
		loading.value = true;
		if (reset) {
			page.value = 1;
			courseList.value = [];
			hasMore.value = true;
		}

		const params = {};
		const categoryParams = getCourseListCategoryParams();
		
		// 设置分类筛选参数（只传递有值的参数）
		if (categoryParams.category) {
			params.category = categoryParams.category;
		}
		if (categoryParams.subCategory) {
			params.subCategory = categoryParams.subCategory;
		}

		// 处理排序
		if (currentSort.value !== 'default') {
			params.sortBy = currentSort.value;
		}
		if (searchKeyword.value.trim()) {
			params.keyword = searchKeyword.value.trim();
		}
		if (selectedCourseTypeId.value) {
			params.courseTypeId = selectedCourseTypeId.value;
		}

		console.log('获取课程列表参数:', params);

		const res = await getAllCourses(params);
		console.log('课程列表接口返回:', res);
		
		// 处理返回数据：request.js 已经提取了 data 字段，所以 res 应该是数组
		// 但为了兼容，也检查 res.data 的情况
		let newCourses = res;
		if (res && res.data && Array.isArray(res.data)) {
			newCourses = res.data;
		} else if (!Array.isArray(res)) {
			console.warn('课程列表数据格式不正确:', res);
			newCourses = [];
		}
		
		console.log('处理后的课程列表:', newCourses);

		// /app/courses 当前返回的是完整分类结果，不是分页结果。
		// 触底时不能继续追加同一批数据，否则会造成列表无限重复加载。
		courseList.value = newCourses;
		hasMore.value = false;
	} catch (error) {
		console.error('获取课程列表失败:', error);
		uni.showToast({
			title: '加载失败，请重试',
			icon: 'none',
		});
	} finally {
		loading.value = false;
	}
};

const fetchCategoryBundleInfo = async () => {
	const candidates = getCategoryBundleParamCandidates();
	if (candidates.length === 0) {
		categoryBundleInfo.value = null;
		return;
	}
	categoryBundleLoading.value = true;
	try {
		let matchedInfo = null;
		for (const params of candidates) {
			const res = await getCategoryBundleInfo(params);
			if (res?.available && Number(res.courseCount || 0) > 0) {
				matchedInfo = res;
				break;
			}
		}
		categoryBundleInfo.value = matchedInfo;
	} catch (error) {
		console.warn('获取分类整包信息失败:', error);
		categoryBundleInfo.value = null;
	} finally {
		categoryBundleLoading.value = false;
	}
};

const refreshAfterCategoryBundlePaid = async () => {
	await Promise.all([fetchCategoryBundleInfo(), fetchCourseList(true)]);
};

const handleBuyCategoryBundle = async () => {
	const info = categoryBundleInfo.value;
	if (!info?.available || categoryBundleBuying.value || info.hasPurchasedAll) return;
	if (!userStore.isLoggedIn) {
		uni.showToast({
			title: '请先登录',
			icon: 'none',
		});
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/index',
			});
		}, 800);
		return;
	}

	try {
		categoryBundleBuying.value = true;
		const order = await createOrder({
			order_type: 'category',
			category_id: Number(info.categoryId),
		});

		if (!order?.payment_params) {
			await userStore.fetchUserInfo();
			await refreshAfterCategoryBundlePaid();
			uni.showToast({ title: '购买成功', icon: 'success' });
			return;
		}

		if (blockVirtualPaymentIfNotReady(order)) {
			return;
		}
		await invokeVirtualPayment(order.payment_params);
		await confirmWechatPayment({
			order_no: order.order_no,
		});
		await userStore.fetchUserInfo();
		await refreshAfterCategoryBundlePaid();
		uni.showToast({ title: '购买成功', icon: 'success' });
	} catch (error) {
		console.error('购买分类课程失败:', error);
		const errMsg = formatVirtualPaymentFailMessage(error);
		uni.showToast({
			title: errMsg,
			icon: 'none',
			duration: errMsg.includes('10 分钟') ? 3500 : 2000,
		});
	} finally {
		categoryBundleBuying.value = false;
	}
};

const closeDropdowns = () => {
	sortDropdownOpen.value = false;
	typeDropdownOpen.value = false;
};

const toggleSortDropdown = () => {
	sortDropdownOpen.value = !sortDropdownOpen.value;
	typeDropdownOpen.value = false;
};

const toggleTypeDropdown = () => {
	typeDropdownOpen.value = !typeDropdownOpen.value;
	sortDropdownOpen.value = false;
};

const selectSort = (value) => {
	currentSort.value = value;
	closeDropdowns();
	fetchCourseList(true);
};

const selectCourseType = (type) => {
	selectedCourseTypeId.value = type?.id || null;
	selectedCourseTypeName.value = type?.name || '';
	closeDropdowns();
	fetchCourseList(true);
};

const handleSearchInput = () => {
	if (searchTimer.value) clearTimeout(searchTimer.value);
	searchTimer.value = setTimeout(() => {
		fetchCourseList(true);
	}, 350);
};

const handleSearchConfirm = () => {
	if (searchTimer.value) clearTimeout(searchTimer.value);
	fetchCourseList(true);
};

const clearSearch = () => {
	searchKeyword.value = '';
	if (searchTimer.value) clearTimeout(searchTimer.value);
	fetchCourseList(true);
};

const fetchCourseTypes = async () => {
	try {
		const res = await getCourseTypes();
		courseTypes.value = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
	} catch (error) {
		console.warn('获取课程类型失败:', error);
		courseTypes.value = [];
	}
};

const formatRemainingDays = (expireTime) => {
	if (!expireTime) return '';
	const expire = new Date(expireTime).getTime();
	if (!Number.isFinite(expire)) return '';
	const diffDays = Math.ceil((expire - Date.now()) / 86400000);
	if (diffDays <= 0) return '已过期';
	return `剩余${diffDays}天`;
};

const formatCourseValidity = (course) => {
	const isFree = Number(course.is_free) === 1 || Number(course.price) === 0;
	if (isFree) return '';
	if (course.hasAuth) {
		return formatRemainingDays(course.expireTime) || '永久有效';
	}
	if (course.validity_days === null || course.validity_days === undefined) {
		return '永久有效';
	}
	const days = Number(course.validity_days);
	return Number.isFinite(days) && days > 0 ? `有效期${days}天` : '';
};

const formatCourseSubtitle = (course) => {
	const primary = course.category || category.value || '';
	const secondary = course.sub_category || course.subCategory || subCategory.value || '';
	return [primary, secondary].filter(Boolean).join(' · ') || course.description || course.name || '';
};

// 网格切换（暂时不做处理）
const handleGridToggle = () => {
	// TODO: 实现网格/列表切换
};

// 返回
const handleBack = () => {
	uni.navigateBack();
};

// 分享
const handleShare = () => {
	uni.showToast({
		title: '请点击右上角分享',
		icon: 'none',
	});
};

// 加载更多
const handleLoadMore = () => {
	if (loading.value || !hasMore.value) return;
	page.value++;
	fetchCourseList(false);
};

// 课程点击
const handleCourseClick = (course) => {
	uni.navigateTo({
		url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
	});
};

// 初始化
onMounted(() => {
	initNavbarMetrics();
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1];
	const options = currentPage.options || {};

	categoryName.value = decodeURIComponent(options.categoryName || options.subCategory || '课程列表');
	category.value = options.category ? decodeURIComponent(options.category) : '';
	subCategory.value = options.subCategory ? decodeURIComponent(options.subCategory) : '';

	console.log('课程列表页面参数:', {
		categoryName: categoryName.value,
		category: category.value,
		subCategory: subCategory.value,
	});

	fetchCourseTypes();
	fetchCourseList(true).finally(() => {
		fetchCategoryBundleInfo();
	});
});
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.course-list-page {
	width: 100%;
	min-height: 100vh;
	background-color: #f5f7fb;
}

// 主题色变量（蓝色）
$theme-color: #3f7ff5;
$theme-color-dark: #1767f2;
$theme-color-light: #7eb2ff;

// 顶部蓝色导航栏
.top-header {
	width: 100%;
	background: linear-gradient(135deg, $theme-color 0%, $theme-color-dark 100%);
	position: sticky;
	top: 0;
	z-index: 100;
	box-sizing: border-box;
}

.header-content {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	width: 100%;
	padding: 0 $space-6;
	box-sizing: border-box;
}

.header-left,
.header-right {
	width: 64rpx;
	height: 64rpx;
	@include flex(row, center, center, 0);
	position: absolute;
	left: $space-2;
	top: 50%;
	transform: translateY(-50%);
	z-index: 2;
}

.header-title {
	@include text(md, semibold, inverse);
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: max-content;
	text-align: center;
	@include truncate;
	pointer-events: none;
}

// 排序筛选栏
.search-section {
	position: sticky;
	z-index: 99;
	padding: 20rpx 28rpx 24rpx;
	background: #ffffff;
	box-sizing: border-box;
}

.search-box {
	height: 72rpx;
	padding: 0 28rpx;
	border-radius: 36rpx;
	background: #f8faff;
	border: 1rpx solid #dbe5f7;
	display: flex;
	align-items: center;
	gap: 14rpx;
	box-sizing: border-box;
}

.search-input {
	flex: 1;
	min-width: 0;
	height: 72rpx;
	font-size: 26rpx;
	color: $text-primary;
}

.search-clear {
	width: 44rpx;
	height: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.category-bundle-card {
	margin-top: 20rpx;
	height: 168rpx;
	padding: 20rpx 28rpx 20rpx 22rpx;
	border-radius: 24rpx;
	background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
	border: 1rpx solid #d9e8ff;
	box-shadow: 0 14rpx 34rpx rgba(28, 93, 190, 0.1);
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 22rpx;
	box-sizing: border-box;
	position: relative;
	overflow: hidden;

	&.owned {
		background: linear-gradient(135deg, #fbfffc 0%, #f1fbf5 100%);
		border-color: rgba(22, 163, 74, 0.18);
	}
}

.category-bundle-visual {
	width: 150rpx;
	height: 128rpx;
	position: relative;
	flex-shrink: 0;
}

.bundle-stack-card {
	position: absolute;
	border-radius: 20rpx;
	box-shadow: 0 12rpx 24rpx rgba(47, 109, 240, 0.18);
	box-sizing: border-box;
}

.bundle-stack-card-one {
	left: 42rpx;
	top: 8rpx;
	width: 86rpx;
	height: 92rpx;
	background: linear-gradient(145deg, #dbeaff 0%, #8dbaff 100%);
	transform: rotate(10deg);
	opacity: 0.7;
}

.bundle-stack-card-two {
	left: 24rpx;
	top: 16rpx;
	width: 92rpx;
	height: 98rpx;
	background: linear-gradient(145deg, #bdd7ff 0%, #5d93f7 100%);
	transform: rotate(-7deg);
	opacity: 0.82;
}

.bundle-stack-card-main {
	left: 8rpx;
	top: 26rpx;
	width: 112rpx;
	height: 96rpx;
	padding: 14rpx 14rpx 12rpx;
	background: linear-gradient(145deg, #6fa7ff 0%, #2f6df0 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
}

.bundle-stack-grid {
	width: 64rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 6rpx;
}

.bundle-stack-tile {
	width: 29rpx;
	height: 20rpx;
	border-radius: 5rpx;
	background: rgba(255, 255, 255, 0.9);
}

.bundle-stack-label {
	color: #ffffff;
	font-size: 21rpx;
	line-height: 1;
	font-weight: 800;
}

.bundle-stack-count {
	position: absolute;
	right: 0;
	bottom: 12rpx;
	min-width: 54rpx;
	height: 34rpx;
	padding: 0 10rpx;
	border-radius: 999rpx;
	background: #ffffff;
	border: 1rpx solid #cfe0ff;
	color: #2f6df0;
	font-size: 20rpx;
	line-height: 34rpx;
	font-weight: 800;
	text-align: center;
	box-shadow: 0 8rpx 16rpx rgba(47, 109, 240, 0.16);
	box-sizing: border-box;
}

.category-bundle-content {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10rpx;
}

.category-bundle-tags {
	display: flex;
	align-items: center;
	gap: 10rpx;
	max-width: 100%;
}

.category-bundle-title {
	max-width: 300rpx;
	font-size: 31rpx;
	line-height: 1.2;
	font-weight: 700;
	color: $text-primary;
	@include truncate;
}

.category-bundle-meta {
	max-width: 300rpx;
	font-size: 23rpx;
	line-height: 1.2;
	color: #667085;
	@include truncate;
}

.category-bundle-tag {
	max-width: 148rpx;
	height: 42rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: #eaf3ff;
	color: #2f6df0;
	font-size: 22rpx;
	line-height: 42rpx;
	box-sizing: border-box;
	@include truncate;
}

.category-bundle-action {
	width: 132rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 14rpx;
	flex-shrink: 0;
	box-sizing: border-box;

	&.disabled {
		.category-bundle-price {
			color: #6b7280;
		}

		.category-bundle-button {
			background: #e5e7eb;
			color: #6b7280;
		}
	}
}

.category-bundle-price {
	font-size: 34rpx;
	line-height: 1;
	font-weight: 800;
	color: #f04b1f;
}

.category-bundle-button {
	width: 126rpx;
	height: 56rpx;
	border-radius: 16rpx;
	background: linear-gradient(135deg, #ff7a2f 0%, #ff3d18 100%);
	color: #fff;
	font-size: 23rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 10rpx 20rpx rgba(255, 82, 31, 0.22);
}

.filter-bar {
	padding: 0;
	background-color: #ffffff;
	position: sticky;
	z-index: 99;
	min-height: 96rpx;
	box-sizing: border-box;
	border-radius: 18rpx 18rpx 0 0;
	box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.07);
	overflow: visible;
}

.filter-main {
	height: 96rpx;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	padding: 0 52rpx;
	gap: 72rpx;
	box-sizing: border-box;
}

.filter-item {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	min-width: 96rpx;
	height: 96rpx;
	position: relative;

	&.active {
		.filter-text {
			color: #1767f2;
			font-weight: 700;
		}

		&::after {
			content: '';
			position: absolute;
			left: 50%;
			bottom: 12rpx;
			width: 40rpx;
			height: 5rpx;
			border-radius: 999rpx;
			background: #1767f2;
			transform: translateX(-50%);
		}
	}
}

.filter-text {
	@include text(sm, normal, secondary);
	font-size: 28rpx;
}

.filter-dropdown {
	position: absolute;
	top: 96rpx;
	left: 0;
	right: 0;
	background: #fff;
	box-shadow: 0 16rpx 32rpx rgba(15, 23, 42, 0.12);
	z-index: 120;
}

.type-dropdown {
	max-height: 520rpx;
	overflow-y: auto;
}

.dropdown-option {
	height: 96rpx;
	padding: 0 44rpx;
	display: flex;
	align-items: center;
	font-size: 30rpx;
	color: #6b7280;
	border-bottom: 1rpx solid #f0f2f5;
	box-sizing: border-box;

	&.active {
		color: #1767f2;
		font-weight: 700;
	}
}

// 课程列表
.course-list-container {
	width: 100%;
	background: #f5f7fb;
}

.course-list {
	padding: 20rpx 22rpx 28rpx;
}

.course-item {
	display: flex;
	align-items: stretch;
	gap: 28rpx;
	padding: 22rpx;
	margin-bottom: 20rpx;
	border-radius: 20rpx;
	background-color: #ffffff;
	box-shadow: 0 10rpx 26rpx rgba(15, 23, 42, 0.08);
	cursor: pointer;
	transition: all $transition-base;
	box-sizing: border-box;

	&:active {
		transform: scale(0.98);
		box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.08);
	}
}

.course-thumbnail {
	width: 190rpx;
	height: 190rpx;
	border-radius: 14rpx;
	overflow: hidden;
	flex-shrink: 0;
	background-color: $bg-tertiary;
}

.thumbnail-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.thumbnail-placeholder {
	width: 100%;
	height: 100%;
	@include flex(row, center, center, 0);
	background-color: $bg-tertiary;
}

.course-info {
	flex: 1;
	min-width: 0;
	min-height: 190rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: flex-start;
	gap: 8rpx;
}

.course-title-wrapper {
	width: 100%;
	text-align: left;
}

.course-title {
	@include text(lg, bold, primary);
	@include line-clamp(2);
	width: 100%;
	line-height: 1.34;
	font-size: 31rpx;
	color: #101828;
	text-align: left;
}

.course-desc {
	@include text(sm, normal, tertiary);
	@include line-clamp(1);
	width: 100%;
	line-height: 1.3;
	color: #667085;
	text-align: left;
}

.course-subtitle {
	width: 100%;
	font-size: 24rpx;
	line-height: 1.25;
	color: #667085;
	@include truncate;
}

.course-tags-row {
	width: 100%;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	gap: 8rpx;
	flex-wrap: wrap;
}

.course-type-tag,
.validity-tag {
	max-width: 100%;
	padding: 7rpx 18rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	line-height: 1.25;
	color: #596c8b;
	background: rgba(89, 108, 139, 0.1);
	box-sizing: border-box;
}

.validity-tag {
	color: #c76a17;
	background: #fff0de;

	&.owned {
		color: #16a34a;
		background: rgba(34, 197, 94, 0.12);
	}
}

.course-footer {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 14rpx;
	margin-top: 4rpx;
}

.course-price {
	display: flex;
	align-items: baseline;
	justify-content: flex-end;
	gap: 8rpx;
	min-width: 100rpx;
	flex-shrink: 0;
}

.price-free {
	@include text(lg, bold, success);
	font-size: 32rpx;
	color: $color-success;
}

.price-current {
	@include text(lg, bold, error);
	font-size: 34rpx;
	color: #ff3434;
}

.price-original {
	@include text(sm, normal, tertiary);
	text-decoration: line-through;
	color: $text-tertiary;
}

.course-buy-btn {
	width: 94rpx;
	height: 48rpx;
	border-radius: 999rpx;
	border: 1rpx solid #ff3434;
	color: #ff3434;
	font-size: 24rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-sizing: border-box;

	&.owned {
		border-color: #16a34a;
		color: #16a34a;
		background: rgba(34, 197, 94, 0.08);
	}
}

// 加载状态
.loading-container,
.empty-container {
	@include flex(column, center, center, $space-4);
	padding: $space-32;
}

.loading-text,
.empty-text {
	@include text(base, normal, tertiary);
}

.load-more {
	@include flex(row, center, center, 0);
	padding: $space-6;
}

.load-more-text {
	@include text(sm, normal, tertiary);
}
</style>
