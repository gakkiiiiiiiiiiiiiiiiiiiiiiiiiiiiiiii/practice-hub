<template>
	<page-meta :page-style="pageMetaStyle" />
	<view class="index-page" :class="indexPageClasses">
		<!-- 顶部蓝色渐变区域 -->
		<view class="top-header" :style="topHeaderStyle">
			<view class="header-content">
				<view class="header-top" :style="headerTopStyle">
					<view class="app-brand">
						<text class="app-brand-title">研刷通</text>
						<text class="app-brand-subtitle">考研题库，课程资料</text>
					</view>
					<view class="header-mode-controls">
						<view
							class="professional-switch"
							:class="{ active: professionalModeEnabled }"
							@click="toggleProfessionalMode"
						>
							<view class="professional-switch-track">
								<view class="professional-switch-thumb"></view>
							</view>
							<text class="professional-switch-text">{{ professionalModeEnabled ? '专业' : '普通' }}</text>
						</view>
						<view class="professional-settings-btn" @click="openProfessionalSettings">
							<view class="professional-settings-icon-wrap">
								<app-icon name="major" :size="28" color="#ffffff" custom-class="professional-settings-icon" />
							</view>
						</view>
					</view>
				</view>

				<view class="ai-quote" v-if="safeDailyQuotesLength > 0 || quoteLoading">
					<swiper
						class="quote-swiper"
						:autoplay="true"
						:interval="4000"
						:duration="500"
						:circular="true"
						:vertical="true"
						:indicator-dots="false"
						indicator-color="rgba(255, 255, 255, 0.3)"
						indicator-active-color="rgba(255, 255, 255, 0.8)"
						v-if="!quoteLoading && safeDailyQuotesLength > 0"
					>
						<swiper-item v-for="(quote, index) in safeDailyQuotes || []" :key="index" class="quote-swiper-item">
							<view class="quote-item">
								<text class="quote-icon">✨</text>
								<text class="quote-text">{{ quote }}</text>
							</view>
						</swiper-item>
					</swiper>
					<view v-else class="quote-loading">
						<text class="quote-icon">✨</text>
						<text class="quote-text">✨ AI 正在酝酿今日鼓励...</text>
					</view>
				</view>

				<!-- 搜索框 -->
				<view class="search-box" @click="handleSearchClick">
					<app-icon name="search" :size="32" color="rgba(255, 255, 255, 0.7)" />
					<text class="search-placeholder">搜索课程...</text>
				</view>
			</view>

			<view class="decorative-circle"></view>
		</view>

		<view class="page-content">
			<!-- 搜索结果 -->
			<view v-if="showSearchResults" class="search-results-section">
				<view class="search-results-header">
					<view class="search-input-wrapper">
						<app-icon name="search" :size="32" color="#999" />
						<input
							class="search-input"
							v-model="searchKeyword"
							placeholder="搜索课程名称..."
							@input="handleSearchInput"
							@confirm="handleSearchConfirm"
							:focus="showSearchResults"
						/>
						<view v-if="searchKeyword" class="search-clear-btn" @click="clearSearch">
							<app-icon name="close" :size="28" color="#999" />
						</view>
					</view>
					<view class="search-close-btn" @click="closeSearchResults">
						<text class="close-text">取消</text>
					</view>
				</view>

				<!-- 搜索结果列表 -->
				<view v-if="searchLoading" class="search-loading">
					<text class="loading-text">搜索中...</text>
				</view>
				<view v-else-if="searchResults.length === 0" class="search-empty">
					<text class="empty-icon">🔍</text>
					<text class="empty-text">未找到相关课程</text>
					<text class="empty-hint">试试其他关键词吧</text>
				</view>
				<view v-else class="search-results-list">
					<view
						v-for="course in searchResults"
						:key="course.id"
						class="search-result-item"
						@click="handleCourseClick(course)"
					>
						<image
							v-if="course.cover_img"
							:src="getImageUrl(course.cover_img)"
							class="result-course-image"
							mode="aspectFill"
						/>
						<view v-else class="result-course-image-placeholder">
							<app-icon name="book" :size="48" color="#ccc" />
						</view>
						<view class="result-course-info">
							<text class="result-course-name">{{ course.name }}</text>
							<view class="result-course-meta">
								<text class="result-course-price" v-if="Number(course.price) > 0 && Number(course.is_free) !== 1">
									¥{{ Number(course.price).toFixed(2) }}
								</text>
								<text class="result-course-free" v-else>免费</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 加载状态 -->
			<view v-if="homeDataLoading && !showSearchResults" class="loading-container">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 空状态提示 -->
			<view
				v-else-if="
					!homeDataLoading && !showSearchResults && safeRecommendCategoriesLength === 0 && safeBannersLength === 0
				"
				class="empty-container"
			>
				<text class="empty-text">暂无内容，请稍后再试</text>
			</view>

			<view v-if="!homeDataLoading && !showSearchResults" class="home-quick-actions">
				<view class="quick-action-card activation-action" @click="handleUseActivation">
					<view class="quick-action-icon">
						<app-icon name="ticket" :size="34" color="#2f6df0" />
					</view>
					<text class="quick-action-title">使用激活码</text>
				</view>
				<view class="quick-action-card service-action" @click="handleContactService">
					<view class="quick-action-icon">
						<app-icon name="service" :size="34" color="#16a085" />
					</view>
					<text class="quick-action-title">联系客服</text>
				</view>
				<view class="quick-action-card faq-action" @click="handleFaq">
					<view class="quick-action-icon">
						<app-icon name="info" :size="34" color="#f59e0b" />
					</view>
					<text class="quick-action-title">常见问题</text>
				</view>
			</view>

			<!-- 轮播图 -->
			<view class="banner-section" v-if="!homeDataLoading && !showSearchResults && safeBannersLength > 0">
				<swiper
					class="banner-swiper"
					:indicator-dots="false"
					:autoplay="true"
					:interval="3000"
					:duration="500"
					:circular="true"
				>
					<swiper-item
						v-for="(banner, index) in safeBanners || []"
						:key="banner.id || index"
						@click="handleBannerClick(banner)"
					>
						<image :src="getImageUrl(banner.image)" class="banner-image" mode="aspectFill" @error="handleImageError" />
						<view v-if="banner.title" class="banner-title">{{ banner.title }}</view>
					</swiper-item>
				</swiper>
			</view>

			<!-- 动态推荐板块 -->
			<template
				v-if="!showSearchResults"
				v-for="(category, categoryIdx) in safeRecommendCategories || []"
				:key="category?.id || categoryIdx"
			>
				<view v-if="category && category.items && Array.isArray(category.items)" class="section">
					<view class="section-header">
						<view class="section-title-wrapper">
							<view class="title-border" :class="{ purple: categoryIdx % 2 === 1 }"></view>
							<text class="section-title">{{ category.name || '推荐板块' }}</text>
						</view>
						<text
							class="section-more"
							v-if="Array.isArray(category.items) && category.items.length > 0"
							@click="viewMore(category)"
						>
							查看全部
						</text>
					</view>

					<!-- 加载状态 -->
					<view
						v-if="homeDataLoading && Array.isArray(category.items) && category.items.length === 0"
						class="loading-state"
					>
						<text class="loading-text">加载中...</text>
					</view>

					<!-- 空状态 -->
					<view
						v-else-if="!homeDataLoading && Array.isArray(category.items) && category.items.length === 0"
						class="empty-state"
					>
						<text class="empty-text">暂无推荐内容</text>
					</view>

					<!-- 课程列表 - 根据板块类型或内容数量决定显示方式 -->
					<view v-else-if="Array.isArray(category.items) && category.items.length > 0">
						<!-- 分类板块：展示一级分类下的二级分类 -->
						<view
							v-if="category.type === 'category' || category.display_type === 'category-grid'"
							class="sub-category-grid"
							:style="getRecommendGridStyle(category)"
						>
							<view
								v-for="(subCategory, idx) in Array.isArray(category.items) ? category.items : []"
								:key="subCategory?.id || idx"
								class="sub-category-card"
								@click="handleSubCategoryClick(subCategory)"
							>
								<view class="sub-category-cover" :class="`sub-cover-${idx % 4}`">
									<image
										v-if="getCategoryCoverUrl(subCategory)"
										:src="getCategoryCoverUrl(subCategory)"
										class="sub-category-cover-image"
										mode="aspectFill"
									/>
									<text v-else class="sub-category-placeholder">{{ getCategoryInitial(subCategory?.name) }}</text>
								</view>
								<view class="sub-category-info">
									<text class="sub-category-name">{{ subCategory?.name || '' }}</text>
									<text class="sub-category-count">{{ subCategory?.course_count || 0 }} 个课程</text>
								</view>
							</view>
						</view>

						<!-- 网格布局（适用于公共课等，2列） -->
						<view
							v-else-if="
								category.display_type === 'grid' ||
								(!category.display_type && Array.isArray(category.items) && category.items.length <= 6)
							"
							class="public-course-grid"
							:style="getRecommendGridStyle(category)"
						>
							<view
								v-for="(course, idx) in Array.isArray(category.items) ? category.items : []"
								:key="course?.id || idx"
								class="public-course-item"
								:class="`course-${idx}`"
								@click="handleCourseClick(course)"
							>
								<view class="course-icon-wrapper" :class="`icon-${idx % 3}`">
									<image
										v-if="course?.cover"
										:src="getCourseCoverUrl(course)"
										class="course-cover-image"
										mode="aspectFit"
										@error="handleCourseCoverError(course, $event)"
									/>
									<text v-else class="course-icon">{{ getCourseIcon(idx) }}</text>
									<!-- 付费未购买标识 -->
									<view v-if="course?.isPaidAndNotPurchased" class="paid-badge">
										<app-icon name="lock" :size="24" color="#ffffff" />
									</view>
								</view>
								<text v-if="formatCourseCategory(course)" class="course-category-line">
									{{ formatCourseCategory(course) }}
								</text>
							</view>
						</view>

						<!-- 列表布局（适用于专业课等，单列） -->
						<view v-else class="major-course-list">
							<view
								v-for="course in Array.isArray(category.items) ? category.items : []"
								:key="course?.id"
								class="major-course-item"
								@click="handleCourseClick(course)"
							>
								<view class="major-course-left">
									<view class="major-course-icon">
										<image
											v-if="course?.cover"
											:src="getCourseCoverUrl(course)"
											class="major-course-cover-image"
											mode="aspectFill"
											@error="handleCourseCoverError(course, $event)"
										/>
										<text v-else class="major-icon">🏆</text>
										<!-- 付费未购买标识 -->
										<view v-if="course?.isPaidAndNotPurchased" class="paid-badge">
											<app-icon name="lock" :size="24" color="#ffffff" />
										</view>
									</view>
									<view class="major-course-info">
										<text class="major-course-name">{{ course?.name || '' }}</text>
										<text v-if="formatCourseCategory(course)" class="major-course-category">
											{{ formatCourseCategory(course) }}
										</text>
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
		<view class="guide-bubble" v-if="showGuideBubble" :style="guideBubbleStyle" @click="closeGuideBubble">
			<text class="bubble-text">添加到"我的小程序" ↗</text>
			<view class="bubble-arrow"></view>
		</view>

		<referral-promo-float :hidden="showSearchResults" />

		<view v-if="showProfessionalPicker" class="professional-picker-mask" @click="closeProfessionalPicker">
			<view class="professional-picker-panel" @click.stop>
				<view class="professional-picker-header">
					<view class="professional-picker-title-wrap">
						<text class="professional-picker-title">专业模式</text>
						<text v-if="professionalModeEnabled" class="professional-picker-current">
							{{ professionalModeLabel }}
						</text>
					</view>
					<view class="professional-picker-close" @click="closeProfessionalPicker">
						<app-icon name="close" :size="30" color="#7c8798" />
					</view>
				</view>

				<view class="professional-picker-intro">
					<view class="professional-picker-intro-icon">
						<app-icon name="major" :size="28" color="#7c3aed" />
					</view>
					<view class="professional-picker-intro-content">
						<text class="professional-picker-intro-title">{{ professionalPickerTitle }}</text>
						<text class="professional-picker-intro-text">
							{{ professionalPickerDescription }}
						</text>
					</view>
				</view>

				<view v-if="professionalCategoriesLoading" class="professional-picker-loading">
					<text class="loading-text">加载中...</text>
				</view>
				<view v-else-if="professionalPrimaryCategories.length === 0" class="professional-picker-empty">
					<text class="empty-text">暂无分类</text>
				</view>
				<view v-else class="professional-picker-body">
					<scroll-view class="professional-primary-list" scroll-y>
						<view
							v-for="category in professionalPrimaryCategories"
							:key="category.id || category.name"
							class="professional-primary-item"
							:class="{ active: isProfessionalPrimaryActive(category) }"
							@click="selectProfessionalPrimaryTab(category)"
						>
							<text class="professional-primary-text">{{ category.name }}</text>
						</view>
					</scroll-view>

					<scroll-view class="professional-secondary-list" scroll-y>
						<view
							v-if="currentProfessionalSecondaryCategories.length === 0"
							class="professional-secondary-empty"
						>
							<text class="empty-text">该类目暂无二级类目</text>
						</view>
						<view
							v-for="subCategory in currentProfessionalSecondaryCategories"
							:key="subCategory.id || subCategory.name"
							class="professional-secondary-item"
							:class="{ active: isProfessionalSubCategorySelected(currentProfessionalPrimary, subCategory) }"
							@click="toggleProfessionalSubCategory(currentProfessionalPrimary, subCategory)"
						>
							<view class="professional-secondary-content">
								<text class="professional-secondary-title">{{ subCategory.name }}</text>
								<text class="professional-secondary-count">{{ subCategory.course_count || subCategory.courseCount || 0 }} 个课程</text>
							</view>
							<view class="professional-secondary-check">
								<app-icon
									v-if="isProfessionalSubCategorySelected(currentProfessionalPrimary, subCategory)"
									name="check"
									:size="22"
									color="#ffffff"
								/>
							</view>
						</view>
					</scroll-view>
				</view>

				<view class="professional-picker-footer">
					<button
						class="professional-confirm-btn"
						:class="{ disabled: !professionalModeEnabled }"
						:disabled="!professionalModeEnabled"
						@click="confirmProfessionalSelection"
					>
						完成{{ selectedProfessionalCount ? `（${selectedProfessionalCount}）` : '' }}
					</button>
					<button
						v-if="professionalModeEnabled || professionalPickerOpenedWithSelection"
						class="professional-clear-btn"
						@click="clearProfessionalMode"
					>
						切换普通模式
					</button>
				</view>
			</view>
		</view>

		<!-- 首页弹窗 -->
		<view v-if="showHomePopup" class="home-popup-mask" @click="closeHomePopup">
			<view class="home-popup-card" @click.stop>
				<view class="home-popup-header">
					<text class="home-popup-title">{{ currentHomePopupPage?.title || homePopupConfig?.title || '公告' }}</text>
					<view class="home-popup-close" @click="closeHomePopup">
						<text>×</text>
					</view>
				</view>
				<view class="home-popup-body">
						<swiper
							v-if="homePopupPages.length"
							class="home-popup-swiper"
							:style="homePopupSwiperStyle"
							:current="homePopupCurrentIndex"
							:indicator-dots="hasHomePopupCarousel"
						:autoplay="hasHomePopupCarousel"
						:circular="hasHomePopupCarousel"
						:interval="3500"
						:duration="500"
						indicator-color="rgba(124, 58, 237, 0.2)"
						indicator-active-color="#7c3aed"
						@change="handleHomePopupSwiperChange"
					>
						<swiper-item v-for="page in homePopupPages" :key="page.id" class="home-popup-swiper-item">
							<scroll-view scroll-y class="home-popup-page-scroll">
								<image
									v-if="page.image"
									:src="getImageUrl(page.image)"
									class="home-popup-image"
									mode="widthFix"
								/>
								<rich-text
									v-if="getHomePopupPageHtml(page)"
									class="home-popup-rich-text"
									:nodes="getHomePopupPageHtml(page)"
								/>
							</scroll-view>
						</swiper-item>
					</swiper>
				</view>
				<view class="home-popup-footer">
					<button class="home-popup-btn" @click="closeHomePopup">
						{{ homePopupConfig?.buttonText?.trim() || '我知道了' }}
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app';
import { useBankStore } from '@/store/bank';
import { useUserStore } from '@/store/user';
import AppCountdown from '@/components/app-countdown/app-countdown.vue';
import AppIcon from '@/components/app-icon/app-icon.vue';
import ReferralPromoFloat from '@/components/referral-promo-float/referral-promo-float.vue';
import { getImageUrl } from '@/utils/image';
import { formatHtmlForMpRichText } from '@/utils/rich-text';
import { requestBinary } from '@/utils/request';
import { getDefaultShare, toTimelineShare } from '@/utils/share';
import { captureReferralFromOptions, captureReferralFromEnterOptions } from '@/utils/referral';
import {
	getHomeConfig,
	getDailyQuote,
	getRecommendCategories,
	getCourseDetail,
	getAllCourses,
	getCourseCategories,
} from '@/api/index';
import { usePageClasses } from '@/composables/usePageClasses';
import { useDeviceStore } from '@/store/device';

const bankStore = useBankStore();
const userStore = useUserStore();
const deviceStore = useDeviceStore();
const pageClasses = usePageClasses();

const indexPageClasses = computed(() => {
	const classes = [pageClasses.value];
	if (deviceStore.isAndroid) {
		classes.push('is-android');
	}
	return classes.filter(Boolean).join(' ');
});

const pageMetaStyle = computed(() => {
	const statusBarHeight = deviceStore.navbarMetrics?.statusBarHeight || 0;
	return `--status-bar-height: ${statusBarHeight}px;`;
});

const topHeaderStyle = computed(() => {
	const metrics = deviceStore.navbarMetrics || {};
	const extraTop = uni.upx2px(16);
	return {
		paddingTop: `${(metrics.statusBarHeight || 0) + extraTop}px`,
	};
});

/** 仅标题行避让微信胶囊，避免搜索栏/语录栏右侧留白 */
const headerTopStyle = computed(() => {
	const metrics = deviceStore.navbarMetrics || {};
	if (!metrics.menuButtonLeft || !metrics.menuButtonBottom) return {};
	const headerHorizontalPadding = uni.upx2px(32);
	const headerTopPadding = (metrics.statusBarHeight || 0) + uni.upx2px(16);
	const estimatedControlsWidth = uni.upx2px(208);
	const maxModeCenterX = Math.max(
		estimatedControlsWidth / 2,
		(metrics.windowWidth || 0) - uni.upx2px(4) - estimatedControlsWidth / 2
	);
	const modeTop = Math.max(uni.upx2px(42), metrics.menuButtonBottom - headerTopPadding + uni.upx2px(8));
	const modeCenterX = Math.min(metrics.menuButtonLeft + (metrics.menuButtonWidth || 0) / 2, maxModeCenterX) - headerHorizontalPadding;
	const minHeight = modeTop + uni.upx2px(58);
	return {
		'--header-mode-left': `${modeCenterX}px`,
		'--header-mode-top': `${modeTop}px`,
		'--header-top-min-height': `${minHeight}px`,
	};
});

const guideBubbleStyle = computed(() => {
	const navHeight = deviceStore.navbarMetrics?.navHeight || uni.upx2px(140);
	return {
		top: `${navHeight + uni.upx2px(12)}px`,
	};
});

const homeShare = () =>
	getDefaultShare({
		title: '研刷通｜考研刷题与课程资料',
		path: '/pages/index/index',
	});

onShareAppMessage(() => homeShare());
onShareTimeline(() => toTimelineShare(homeShare()));

onLoad((options) => {
	const distributorCode = parseDistributorScene(options);
	if (distributorCode) {
		uni.setStorageSync('pending_distributor_code', distributorCode);
	}
	captureReferralFromOptions(options);
	if (options && options.keyword) {
		showSearchResults.value = true;
		searchKeyword.value = decodeURIComponent(options.keyword);
		performSearch(searchKeyword.value);
	}
});

const parseDistributorScene = (options = {}) => {
	const scene = options.scene ? decodeURIComponent(options.scene) : '';
	const raw = scene || options.inviterid || options.distributor_code || '';
	if (!raw) return '';
	const pairs = String(raw).split('&');
	for (const pair of pairs) {
		const [key, value = ''] = pair.split('=');
		if (key === 'inviterid' || key === 'distributor_code') {
			return decodeURIComponent(value);
		}
	}
	return raw;
};

onShow(() => {
	captureReferralFromEnterOptions();
	// 页面显示时刷新数据，确保激活后的状态更新
	// 无论是否登录都要刷新首页数据，因为首页内容对所有用户可见
	fetchHomeData();
	fetchDailyQuote();
});

const countdownConfig = ref({
	targetDate: '2024-12-25', // 默认考研日期
	label: '距离考研还有',
});

const countdownDays = ref(0);
// 初始化时确保是数组，避免 undefined 错误
const dailyQuotes = ref(['研途漫漫，终抵群星。']);
const quoteLoading = ref(false);

// 推荐板块列表，从接口动态获取
const recommendCategories = ref([]);
const coverRetryTicks = ref({});
const homeRecommendCoverNoCacheKey = ref(Date.now());
let coverResolveQueue = Promise.resolve();
let homeDataFetchPromise = null;
let homePopupShownInCurrentLaunch = false;
const courseDetailCache = new Map();
const COURSE_DETAIL_CACHE_TTL = 60 * 1000;
const showGuideBubble = ref(true);
const HOME_POPUP_DISMISSED_KEY = 'home_popup_dismissed_version';
const PROFESSIONAL_MODE_KEY = 'home_professional_mode_selection';
const homePopupConfig = ref(null);
const showHomePopup = ref(false);
const homePopupCurrentIndex = ref(0);
const homeDataLoading = ref(false);
const showProfessionalPicker = ref(false);
const professionalPickerSource = ref('settings');
const professionalPickerOpenedWithSelection = ref(false);
const professionalCategories = ref([]);
const professionalCategoriesLoading = ref(false);
const selectedProfessionalPrimaryId = ref(null);
const professionalModeSelection = ref(null);
// 轮播图数据
const banners = ref([]);

const getCountdownDaysFromToken = (dateToken) => {
	if (!/^\d{8}$/.test(dateToken)) return dateToken;
	const year = Number(dateToken.slice(0, 4));
	const month = Number(dateToken.slice(4, 6));
	const day = Number(dateToken.slice(6, 8));
	const target = new Date(year, month - 1, day);
	if (
		Number.isNaN(target.getTime()) ||
		target.getFullYear() !== year ||
		target.getMonth() !== month - 1 ||
		target.getDate() !== day
	) {
		return dateToken;
	}
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const diffDays = Math.ceil((target.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
	return String(Math.max(0, diffDays));
};

const renderQuoteTemplate = (quote) => {
	return String(quote || '').replace(/\{\{(\d{8})\}\}/g, (_, dateToken) => getCountdownDaysFromToken(dateToken));
};

// 搜索相关
const showSearchResults = ref(false);
const searchKeyword = ref('');
const searchResults = ref([]);
const searchLoading = ref(false);

const normalizeHomePopupPages = (config) => {
	if (!config) return [];
	const templates = Array.isArray(config.templates) ? config.templates : [];
	const activeTemplate =
		templates.find((template) => template?.id === config.activeTemplateId) ||
		templates.find((template) => template?.id === config.active_template_id) ||
		templates[0] ||
		null;
	const templatePages = Array.isArray(activeTemplate?.pages) ? activeTemplate.pages : [];
	const topLevelPages = Array.isArray(config.pages) ? config.pages : [];
	const pages = templatePages.length > topLevelPages.length ? templatePages : topLevelPages;
	if (pages.length > 0) {
		return pages.map((page, index) => ({
			id: page?.id || `popup_page_${index}`,
			title: String(page?.title || '').trim(),
			content: String(page?.content || '').trim(),
			image: String(page?.image || '').trim(),
		}));
	}
	return [
		{
			id: 'popup_page_legacy',
			title: String(config.title || '').trim(),
			content: String(config.content || '').trim(),
			image: String(config.image || '').trim(),
		},
	];
};

const homePopupPages = computed(() => normalizeHomePopupPages(homePopupConfig.value));
const hasHomePopupCarousel = computed(() => homePopupPages.value.length > 1);

const currentHomePopupPage = computed(() => {
	const pages = homePopupPages.value;
	return pages[homePopupCurrentIndex.value] || pages[0] || null;
});

const getHomePopupPageHtml = (page) => formatHtmlForMpRichText(page?.content);

const homePopupHtmlContent = computed(() => getHomePopupPageHtml(currentHomePopupPage.value));

// 确保所有 ref 变量在初始化时都是有效的数组
if (!Array.isArray(dailyQuotes.value)) {
	dailyQuotes.value = ['研途漫漫，终抵群星。'];
}
if (!Array.isArray(recommendCategories.value)) {
	recommendCategories.value = [];
}
if (!Array.isArray(banners.value)) {
	banners.value = [];
}

// 使用计算属性确保数组访问安全
const safeDailyQuotes = computed(() => {
	try {
		// 多重检查确保安全
		if (!dailyQuotes) {
			return ['研途漫漫，终抵群星。'];
		}
		const rawValue = dailyQuotes.value;
		if (rawValue === undefined || rawValue === null) {
			return ['研途漫漫，终抵群星。'];
		}
		if (!Array.isArray(rawValue)) {
			return ['研途漫漫，终抵群星。'];
		}
		return rawValue.map((quote) => renderQuoteTemplate(quote));
	} catch (e) {
		console.error('[safeDailyQuotes] Error:', e);
		return ['研途漫漫，终抵群星。'];
	}
});

const safeBanners = computed(() => {
	try {
		if (professionalModeEnabled.value) {
			return [];
		}
		if (!banners) {
			return [];
		}
		const value = banners.value;
		if (value === undefined || value === null || !Array.isArray(value)) {
			return [];
		}
		return value;
	} catch (e) {
		console.error('[safeBanners] Error:', e);
		return [];
	}
});

const safeRecommendCategories = computed(() => {
	try {
		// 多重检查确保安全
		if (!recommendCategories) {
			return [];
		}
		const rawValue = recommendCategories.value;
		if (rawValue === undefined || rawValue === null) {
			return [];
		}
		if (!Array.isArray(rawValue)) {
			return [];
		}
		return filterRecommendCategoriesByProfessional(rawValue);
	} catch (e) {
		console.error('[safeRecommendCategories] Error:', e);
		return [];
	}
});

const normalizeProfessionalSelectionItems = (selection) => {
	if (!selection) return [];
	const sourceItems = Array.isArray(selection.items) ? selection.items : [];
	const legacyItem = selection.category && selection.subCategory
		? [
				{
					categoryId: selection.categoryId,
					category: selection.category,
					subCategoryId: selection.subCategoryId,
					subCategory: selection.subCategory,
					label: selection.label || selection.subCategory,
				},
			]
		: [];
	const items = sourceItems.length ? sourceItems : legacyItem;
	const uniqueMap = new Map();
	items.forEach((item) => {
		const category = normalizeCategoryName(item?.category);
		const subCategory = normalizeCategoryName(item?.subCategory || item?.sub_category || item?.name);
		if (!category || !subCategory) return;
		const categoryId = item?.categoryId || item?.category_id || '';
		const subCategoryId = item?.subCategoryId || item?.sub_category_id || item?.id || '';
		const key = `${categoryId || category}__${subCategoryId || subCategory}`;
		uniqueMap.set(key, {
			categoryId,
			category,
			subCategoryId,
			subCategory,
			label: normalizeCategoryName(item?.label || subCategory),
		});
	});
	return Array.from(uniqueMap.values());
};

const selectedProfessionalItems = computed(() => normalizeProfessionalSelectionItems(professionalModeSelection.value));
const selectedProfessionalCount = computed(() => selectedProfessionalItems.value.length);

const professionalModeEnabled = computed(() => {
	return selectedProfessionalCount.value > 0;
});

const professionalModeLabel = computed(() => {
	const items = selectedProfessionalItems.value;
	if (!items.length) return '专业模式';
	if (items.length === 1) return items[0].label || items[0].subCategory;
	const names = items.map((item) => item.label || item.subCategory).filter(Boolean);
	return names.length <= 2 ? names.join('、') : `${names.slice(0, 2).join('、')}等${items.length}个专业`;
});

const professionalModeHint = computed(() => {
	if (!professionalModeEnabled.value) {
		return '当前为普通模式，首页展示全部推荐内容。';
	}
	return `专业模式已开启，仅展示已选二级类目相关内容。`;
});

const professionalPickerTitle = computed(() => {
	if (!professionalModeEnabled.value && professionalPickerSource.value === 'switch') {
		return '选择二级类目';
	}
	return '专业模式';
});

const professionalPickerDescription = computed(() => {
	if (!professionalModeEnabled.value && professionalPickerSource.value === 'switch') {
		return '专业模式会根据你选择的二级类目筛选首页内容，可同时选择多个方向。';
	}
	if (professionalModeEnabled.value) {
		return `当前已选择 ${selectedProfessionalCount.value} 个二级类目，可继续增减或切换普通模式。`;
	}
	return '专业模式用于聚焦二级类目，开启后首页只展示所选方向相关内容。';
});

const professionalPrimaryCategories = computed(() => {
	const value = professionalCategories.value;
	return Array.isArray(value) ? value : [];
});

const currentProfessionalPrimary = computed(() => {
	const categories = professionalPrimaryCategories.value;
	if (!categories.length) return null;
	const selectedId = selectedProfessionalPrimaryId.value;
	return categories.find((category) => String(category.id) === String(selectedId)) || categories[0] || null;
});

const currentProfessionalSecondaryCategories = computed(() => {
	const primary = currentProfessionalPrimary.value;
	return Array.isArray(primary?.children) ? primary.children : [];
});

const normalizeCategoryName = (value) => String(value || '').trim();

const getRecommendItemPrimary = (item) => {
	if (!item) return '';
	return normalizeCategoryName(
		item.category || item.primaryCategory || item.primary_category || item.bind_category_name || item.parent_name || '',
	);
};

const getRecommendItemSecondary = (item) => {
	if (!item) return '';
	return normalizeCategoryName(
		item.sub_category ||
			item.subCategory ||
			item.secondaryCategory ||
			(item.item_type === 'sub_category' ? item.name : '') ||
			'',
	);
};

const isRecommendItemInProfessionalMode = (item) => {
	const selectedItems = selectedProfessionalItems.value;
	if (!selectedItems.length) return true;
	const primary = getRecommendItemPrimary(item);
	const secondary = getRecommendItemSecondary(item);
	return selectedItems.some((selection) => primary === selection.category && secondary === selection.subCategory);
};

const getProfessionalSectionName = (category) => {
	const label = professionalModeLabel.value;
	if (!professionalModeEnabled.value) return category?.name || '推荐板块';
	if (category?.type === 'category' || category?.display_type === 'category-grid') return label;
	return `${label}推荐`;
};

const filterRecommendCategoriesByProfessional = (categories) => {
	if (!professionalModeEnabled.value) return categories;
	return categories
		.map((category) => {
			const items = Array.isArray(category?.items) ? category.items.filter(isRecommendItemInProfessionalMode) : [];
			if (!items.length) return null;
			return {
				...category,
				name: getProfessionalSectionName(category),
				items,
			};
		})
		.filter(Boolean);
};

// 添加 length 计算属性，避免在模板中直接访问 .length
const safeDailyQuotesLength = computed(() => {
	const quotes = safeDailyQuotes.value;
	return Array.isArray(quotes) ? quotes.length : 0;
});

const safeBannersLength = computed(() => {
	const bannerList = safeBanners.value;
	return Array.isArray(bannerList) ? bannerList.length : 0;
});

const safeRecommendCategoriesLength = computed(() => {
	const categories = safeRecommendCategories.value;
	return Array.isArray(categories) ? categories.length : 0;
});

const normalizeRecommendColumns = (columns) => {
	const value = Number(columns || 3);
	if (!Number.isFinite(value)) return 3;
	return Math.min(4, Math.max(1, Math.round(value)));
};

const getRecommendGridStyle = (category) => {
	const columns = normalizeRecommendColumns(category?.columns);
	return `grid-template-columns: repeat(${columns}, minmax(0, 1fr));`;
};

const normalizeProfessionalCategoriesResponse = (res) => {
	if (Array.isArray(res)) return res;
	if (Array.isArray(res?.data)) return res.data;
	return [];
};

const loadProfessionalModeSelection = () => {
	try {
		const cached = uni.getStorageSync(PROFESSIONAL_MODE_KEY);
		const items = normalizeProfessionalSelectionItems(cached);
		if (items.length) {
			professionalModeSelection.value = {
				level: 'secondary_multi',
				items,
			};
			selectedProfessionalPrimaryId.value = items[0].categoryId || null;
			uni.setStorageSync(PROFESSIONAL_MODE_KEY, professionalModeSelection.value);
		} else if (cached) {
			uni.removeStorageSync(PROFESSIONAL_MODE_KEY);
		}
	} catch (error) {
		console.warn('读取专业模式选择失败:', error);
	}
};

const fetchProfessionalCategories = async () => {
	if (professionalCategoriesLoading.value) return;
	if (professionalPrimaryCategories.value.length > 0) return;
	professionalCategoriesLoading.value = true;
	try {
		const res = await getCourseCategories();
		const categories = normalizeProfessionalCategoriesResponse(res);
		professionalCategories.value = categories;
		if (!selectedProfessionalPrimaryId.value && categories.length > 0) {
			selectedProfessionalPrimaryId.value = selectedProfessionalItems.value[0]?.categoryId || categories[0].id;
		}
	} catch (error) {
		console.error('获取专业模式分类失败:', error);
		professionalCategories.value = [];
		uni.showToast({
			title: '分类加载失败',
			icon: 'none',
		});
	} finally {
		professionalCategoriesLoading.value = false;
	}
};

const openProfessionalPicker = async (source = 'settings') => {
	professionalPickerSource.value = source;
	professionalPickerOpenedWithSelection.value = professionalModeEnabled.value;
	showProfessionalPicker.value = true;
	await fetchProfessionalCategories();
	const firstSelectedItem = selectedProfessionalItems.value[0];
	if (firstSelectedItem?.categoryId) {
		selectedProfessionalPrimaryId.value = firstSelectedItem.categoryId;
	}
};

const closeProfessionalPicker = () => {
	showProfessionalPicker.value = false;
};

const selectProfessionalPrimaryTab = (category) => {
	selectedProfessionalPrimaryId.value = category?.id || null;
};

const persistProfessionalSelection = (selection) => {
	const items = normalizeProfessionalSelectionItems(selection);
	if (!items.length) {
		professionalModeSelection.value = null;
		uni.removeStorageSync(PROFESSIONAL_MODE_KEY);
		return;
	}
	const nextSelection = {
		level: 'secondary_multi',
		items,
	};
	professionalModeSelection.value = nextSelection;
	uni.setStorageSync(PROFESSIONAL_MODE_KEY, nextSelection);
};

const buildProfessionalSelectionItem = (primary, secondary) => {
	const category = normalizeCategoryName(primary?.name);
	const subCategory = normalizeCategoryName(secondary?.name);
	if (!category || !subCategory) return null;
	return {
		categoryId: primary?.id || '',
		category,
		subCategoryId: secondary?.id || '',
		subCategory,
		label: subCategory,
	};
};

const getProfessionalSelectionKey = (item) => `${item?.categoryId || item?.category}__${item?.subCategoryId || item?.subCategory}`;

const isProfessionalSubCategorySelected = (primary, secondary) => {
	const item = buildProfessionalSelectionItem(primary, secondary);
	if (!item) return false;
	const key = getProfessionalSelectionKey(item);
	return selectedProfessionalItems.value.some((selected) => getProfessionalSelectionKey(selected) === key);
};

const toggleProfessionalSubCategory = (primary, secondary) => {
	const item = buildProfessionalSelectionItem(primary, secondary);
	if (!item) return;
	const key = getProfessionalSelectionKey(item);
	const currentItems = selectedProfessionalItems.value;
	const exists = currentItems.some((selected) => getProfessionalSelectionKey(selected) === key);
	const nextItems = exists
		? currentItems.filter((selected) => getProfessionalSelectionKey(selected) !== key)
		: [...currentItems, item];
	selectedProfessionalPrimaryId.value = primary.id || null;
	persistProfessionalSelection({ items: nextItems });
};

const confirmProfessionalSelection = () => {
	if (!professionalModeEnabled.value) return;
	closeProfessionalPicker();
	fetchHomeData({ force: true });
	uni.showToast({
		title: `已选择${selectedProfessionalCount.value}个专业`,
		icon: 'none',
	});
};

const clearProfessionalMode = () => {
	professionalModeSelection.value = null;
	professionalPickerOpenedWithSelection.value = false;
	uni.removeStorageSync(PROFESSIONAL_MODE_KEY);
	closeProfessionalPicker();
	fetchHomeData({ force: true });
	uni.showToast({
		title: '已切换普通模式',
		icon: 'none',
	});
};

const switchToNormalMode = () => {
	if (!professionalModeEnabled.value) return;
	clearProfessionalMode();
};

const toggleProfessionalMode = () => {
	if (professionalModeEnabled.value) {
		switchToNormalMode();
		return;
	}
	openProfessionalPicker('switch');
};

const openProfessionalSettings = () => {
	openProfessionalPicker('settings');
};

const isProfessionalPrimaryActive = (category) => {
	return String(selectedProfessionalPrimaryId.value) === String(category?.id);
};

const getProfessionalCourseListUrl = () => {
	const selection = selectedProfessionalItems.value[0];
	if (!selection) return '';
	const params = [
		`categoryName=${encodeURIComponent(selection.label || selection.subCategory || selection.category)}`,
		`category=${encodeURIComponent(selection.category)}`,
		`subCategory=${encodeURIComponent(selection.subCategory)}`,
	];
	return `/pages/sub-pages/course-list/index?${params.join('&')}`;
};

const getProfessionalRecommendParams = () => {
	const items = selectedProfessionalItems.value;
	if (!items.length) return {};
	return {
		mode: 'professional',
		professionalScopes: JSON.stringify(
			items.map((item) => ({
				category: item.category,
				subCategory: item.subCategory,
			})),
		),
	};
};

onMounted(() => {
	deviceStore.refresh();
	loadProfessionalModeSelection();
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

const formatCourseCategory = (course) => {
	if (!course) return '';
	const primary = course.category || course.primaryCategory || course.primary_category || '';
	const secondary = course.sub_category || course.subCategory || course.secondaryCategory || '';
	return [primary, secondary].filter(Boolean).join(' / ');
};

const appendImageQuery = (url, params) => {
	if (!url || url.startsWith('cloud://')) return url;
	const validParams = Object.entries(params || {}).filter(
		([, value]) => value !== undefined && value !== null && value !== '',
	);
	if (!validParams.length) return url;
	const hashIndex = url.indexOf('#');
	const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
	const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
	const joiner = base.includes('?') ? '&' : '?';
	const query = validParams
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join('&');
	return `${base}${joiner}${query}${hash}`;
};

const isLocalImagePath = (url) => {
	return /^wxfile:\/\//.test(url) || /^file:\/\//.test(url) || /^http:\/\/tmp\//.test(url);
};

const getCourseCoverUrl = (course) => {
	if (!course?.cover) return '';
	if (isLocalImagePath(course.cover)) return course.cover;
	const baseUrl = getImageUrl(course.cover);
	const retryTick = coverRetryTicks.value[course.id] || '';
	return appendImageQuery(baseUrl, {
		_nc: homeRecommendCoverNoCacheKey.value,
		_rt: retryTick,
	});
};

const getCategoryCoverUrl = (category) => {
	const cover = category?.cover || category?.cover_img || category?.image || category?.imageUrl || '';
	if (!cover) return '';
	if (isLocalImagePath(cover)) return cover;
	return appendImageQuery(getImageUrl(cover), {
		_nc: homeRecommendCoverNoCacheKey.value,
	});
};

const getCategoryInitial = (name) => String(name || '课').slice(0, 1);

const ensureArrayBuffer = (data) => {
	if (data instanceof ArrayBuffer) return data;
	if (typeof data === 'string') {
		return uni.base64ToArrayBuffer ? uni.base64ToArrayBuffer(data.replace(/^data:[^;]+;base64,/, '')) : null;
	}
	if (Array.isArray(data)) return new Uint8Array(data).buffer;
	if (data && data.type === 'Buffer' && Array.isArray(data.data)) return new Uint8Array(data.data).buffer;
	if (data && typeof data === 'object' && data.data != null) return ensureArrayBuffer(data.data);
	return null;
};

const arrayBufferToBase64 = (buffer) => {
	if (typeof uni !== 'undefined' && typeof uni.arrayBufferToBase64 === 'function') {
		return uni.arrayBufferToBase64(buffer);
	}
	let binary = '';
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < bytes.byteLength; i += 1) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
};

const detectImageExt = (buffer) => {
	const arr = new Uint8Array(buffer || []);
	if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) return 'jpg';
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
		return 'png';
	}
	if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46) return 'gif';
	if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[8] === 0x57 && arr[9] === 0x45) return 'webp';
	return 'png';
};

const writeCoverTempFile = (courseId, buffer) => {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		const fs = uni.getFileSystemManager?.();
		const dir = typeof wx !== 'undefined' && wx.env ? wx.env.USER_DATA_PATH : '';
		if (!fs || !dir) {
			resolve('');
			return;
		}
		const ext = detectImageExt(buffer);
		const filePath = `${dir}/home_recommend_cover_${courseId}_${Date.now()}.${ext}`;
		fs.writeFile({
			filePath,
			data: arrayBufferToBase64(buffer),
			encoding: 'base64',
			success: () => resolve(filePath),
			fail: reject,
		});
		// #endif
		// #ifndef MP-WEIXIN
		resolve('');
		// #endif
	});
};

const resolveHomeRecommendCover = async (course) => {
	const remoteCover = course?.cover ? getImageUrl(course.cover) : '';
	if (!remoteCover || !/^https?:\/\//.test(remoteCover)) return course?.cover || '';

	// #ifdef MP-WEIXIN
	try {
		const proxyPath = `/app/recommend/image-proxy?url=${encodeURIComponent(remoteCover)}`;
		const raw = await requestBinary(proxyPath);
		const buffer = ensureArrayBuffer(raw);
		if (!buffer || buffer.byteLength < 8) {
			throw new Error('代理图片数据为空');
		}
		const localPath = await writeCoverTempFile(course.id, buffer);
		return localPath || course.cover;
	} catch (error) {
		console.warn('首页推荐封面代理加载失败，回退原图:', {
			courseId: course?.id,
			cover: remoteCover,
			error,
		});
		return course.cover;
	}
	// #endif
	// #ifndef MP-WEIXIN
	return course.cover;
	// #endif
};

const updateRecommendCourseCover = (courseId, localPath) => {
	if (!courseId || !localPath) return;
	recommendCategories.value = recommendCategories.value.map((category) => ({
		...category,
		items: Array.isArray(category.items)
			? category.items.map((course) => (course.id === courseId ? { ...course, cover: localPath } : course))
			: category.items,
	}));
};

const queueHomeRecommendCoverResolve = (course) => {
	if (!course?.cover || isLocalImagePath(course.cover)) return;
	coverResolveQueue = coverResolveQueue
		.catch(() => {})
		.then(async () => {
			const localPath = await resolveHomeRecommendCover(course);
			if (localPath && localPath !== course.cover) {
				updateRecommendCourseCover(course.id, localPath);
			}
		});
};

const normalizeBoolean = (value, fallback = false) => {
	if (value === true || value === 1 || value === '1') return true;
	if (value === false || value === 0 || value === '0') return false;
	return fallback;
};

const getKnownCourseAuth = (course) => {
	if (!course) return undefined;
	if (course.hasAuth !== undefined && course.hasAuth !== null) return normalizeBoolean(course.hasAuth);
	if (course.has_auth !== undefined && course.has_auth !== null) return normalizeBoolean(course.has_auth);
	return undefined;
};

const getCachedCourseDetail = async (courseId, options = {}) => {
	const id = Number(courseId);
	if (!id) return null;
	const now = Date.now();
	const cached = courseDetailCache.get(id);
	if (!options.force && cached) {
		if (cached.data && now - cached.time < COURSE_DETAIL_CACHE_TTL) {
			return cached.data;
		}
		if (cached.promise) {
			return cached.promise;
		}
	}

	const promise = getCourseDetail(id)
		.then((detail) => {
			courseDetailCache.set(id, { data: detail, time: Date.now(), promise: null });
			return detail;
		})
		.catch((error) => {
			courseDetailCache.delete(id);
			throw error;
		});
	courseDetailCache.set(id, { data: cached?.data || null, time: cached?.time || 0, promise });
	return promise;
};

// 简化每日一句处理逻辑
const fetchDailyQuote = async () => {
	quoteLoading.value = true;
	try {
		const res = await getDailyQuote();
		let quotesArr = [];
		if (res) {
			// 处理不同的返回格式
			if (Array.isArray(res.quotes) && res.quotes.length > 0) {
				// 格式: { quotes: ['quote1', 'quote2'] }
				quotesArr = res.quotes;
			} else if (Array.isArray(res) && res.length > 0) {
				// 格式: ['quote1', 'quote2'] (直接返回数组)
				quotesArr = res;
			} else if (typeof res.quote === 'string' && res.quote) {
				// 格式: { quote: 'quote1' }
				quotesArr = [res.quote];
			} else if (typeof res === 'string' && res) {
				// 格式: 'quote1' (直接返回字符串)
				quotesArr = [res];
			}
		}
		dailyQuotes.value = quotesArr.length > 0 ? quotesArr : ['研途漫漫，终抵群星。'];
	} catch (error) {
		console.error('获取每日一句失败:', error);
		dailyQuotes.value = ['研途漫漫，终抵群星。'];
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

const stripRichText = (html) =>
	String(html || '')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.trim();

const estimateHomePopupPageHeight = (page) => {
	if (!page) return 180;
	const plainText = stripRichText(page.content || page.title || '');
	const lineCount = Math.max(1, Math.ceil(plainText.length / 18));
	const textHeight = lineCount * 48;
	const imageHeight = page.image ? 360 : 0;
	const indicatorHeight = hasHomePopupCarousel.value ? 48 : 0;
	return Math.min(640, Math.max(180, textHeight + imageHeight + indicatorHeight + 52));
};

const homePopupSwiperStyle = computed(() => ({
	height: `${estimateHomePopupPageHeight(currentHomePopupPage.value)}rpx`,
}));

const checkAndShowHomePopup = () => {
	const config = homePopupConfig.value;
	if (homePopupShownInCurrentLaunch) return;

	if (!config?.enabled) {
		showHomePopup.value = false;
		return;
	}

	const hasContent = homePopupPages.value.some((page) => page.title || stripRichText(page.content) || page.image);
	if (!hasContent) {
		showHomePopup.value = false;
		return;
	}

	if (config.showMode === 'once') {
		const dismissed = Number(uni.getStorageSync(HOME_POPUP_DISMISSED_KEY) || 0);
		if (dismissed >= Number(config.version || 0)) {
			showHomePopup.value = false;
			return;
		}
	}

	showHomePopup.value = true;
	homePopupShownInCurrentLaunch = true;
};

const handleHomePopupSwiperChange = (event) => {
	homePopupCurrentIndex.value = Number(event?.detail?.current || 0);
};

const closeHomePopup = () => {
	showHomePopup.value = false;
	const config = homePopupConfig.value;
	if (config?.showMode === 'once') {
		uni.setStorageSync(HOME_POPUP_DISMISSED_KEY, String(config.version || 0));
	}
};

const HOME_DATA_MAX_ATTEMPTS = 2;
const HOME_DATA_RETRY_DELAY_MS = 800;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error) =>
	String(error?.message || error?.msg || error?.errMsg || error || '').trim();

const isRetryableHomeDataError = (error) => {
	const code = Number(error?.statusCode ?? error?.errCode ?? error?.code);
	const message = getErrorMessage(error);
	return (
		[408, 429, 500, 502, 503, 504, -1, 103006].includes(code) ||
		/超时|timeout|timed out|网络|network|连接云服务失败|callContainer:fail|system error|ECONNRESET|ETIMEDOUT|502|503|504/i.test(
			message,
		)
	);
};

const fetchHomeDataSection = async (label, loader, errors) => {
	let lastError = null;
	for (let attempt = 1; attempt <= HOME_DATA_MAX_ATTEMPTS; attempt += 1) {
		try {
			return await loader();
		} catch (error) {
			lastError = error;
			const canRetry = attempt < HOME_DATA_MAX_ATTEMPTS && isRetryableHomeDataError(error);
			console.warn(`${label}请求失败${canRetry ? '，准备重试' : ''}:`, {
				attempt,
				message: getErrorMessage(error),
			});
			if (!canRetry) break;
			await wait(HOME_DATA_RETRY_DELAY_MS);
		}
	}
	errors.push({ label, error: lastError });
	return undefined;
};

const fetchHomeData = async (options = {}) => {
	if (homeDataFetchPromise && !options.force) {
		return homeDataFetchPromise;
	}
	homeDataFetchPromise = fetchHomeDataInner().finally(() => {
		homeDataFetchPromise = null;
	});
	return homeDataFetchPromise;
};

const fetchHomeDataInner = async () => {
	homeDataLoading.value = true;
	homeRecommendCoverNoCacheKey.value = Date.now();
	const homeDataErrors = [];
	try {
		// 获取首页配置（倒计时、轮播图等）
		const configRes = await fetchHomeDataSection('首页配置', getHomeConfig, homeDataErrors);
		if (configRes) {
			// 处理倒计时配置
			if (configRes.countdown) {
				countdownConfig.value = {
					targetDate: configRes.countdown.targetDate || configRes.countdown.date || '2024-12-25',
					label: configRes.countdown.label || '距离考研还有',
				};
				calculateCountdown();
			}

			// 处理轮播图配置
			if (configRes.banners && Array.isArray(configRes.banners)) {
				banners.value = configRes.banners.filter((banner) => banner && banner.image);
			} else if (configRes.banner && Array.isArray(configRes.banner)) {
				banners.value = configRes.banner.filter((banner) => banner && banner.image);
			} else {
				banners.value = [];
			}

			if (configRes.popup) {
				homePopupConfig.value = configRes.popup;
				homePopupCurrentIndex.value = 0;
			} else {
				homePopupConfig.value = null;
				homePopupCurrentIndex.value = 0;
			}
			checkAndShowHomePopup();
		}

		// 获取首页推荐板块（动态获取所有板块）
		const recommendParams = getProfessionalRecommendParams();
		const layoutRes = await fetchHomeDataSection(
			'推荐板块',
			() => getRecommendCategories(recommendParams),
			homeDataErrors,
		);

		if (layoutRes !== undefined) {
			// 重置推荐板块列表
			recommendCategories.value = [];

			// 处理返回数据：可能是数组，也可能是 { data: [...] } 格式
			let categoriesData = layoutRes;
			if (layoutRes && layoutRes.data && Array.isArray(layoutRes.data)) {
				categoriesData = layoutRes.data;
			} else if (!Array.isArray(layoutRes)) {
				console.warn('推荐板块数据格式不正确:', layoutRes);
				categoriesData = [];
			}

			if (categoriesData && Array.isArray(categoriesData) && categoriesData.length > 0) {
				// 后端返回格式: [{ id, name, items: [课程列表] }, ...] - 首页推荐管理中设置的版块
				if (Array.isArray(categoriesData)) {
					recommendCategories.value = await Promise.all(
						categoriesData.map(async (category) => {
						// 确保 category 存在
						if (!category) {
							return null;
						}

						// 直接使用 items 字段（首页推荐管理中设置的课程列表）
						const items = Array.isArray(category.items) ? category.items : [];

						// 处理题库数据，确保字段映射正确
						// 后端返回的 Subject 实体字段：id, name, cover_img, description, price 等
						// 注意：对于付费课程，需要检查用户是否已购买（如果已登录）
						const processedItems = Array.isArray(items)
							? await Promise.all(
									items
										.filter((item) => item != null) // 过滤掉 null/undefined
										.map(async (item) => {
											// 确保价格和免费状态为正确的类型
											if (item.item_type === 'sub_category') {
												const cover = item.cover_img || item.cover || item.image || item.imageUrl || '';
												return {
													...item,
													item_type: 'sub_category',
													id: item.id,
													name: item.name || item.title || '',
													cover,
													cover_img: item.cover_img || cover,
													category: item.category || '',
													sub_category: item.sub_category || item.name || '',
													course_count: Number(item.course_count) || 0,
												};
											}

											// 确保价格和免费状态为正确的类型
											const price = Number(item.price) || 0;
											const isFree = Number(item.is_free) === 1;

											// 判断是否付费课程（价格大于0且不是免费）
											const isPaid = price > 0 && !isFree;

											const knownHasAuth = getKnownCourseAuth(item);
											const hasAuth = knownHasAuth !== undefined ? knownHasAuth : !isPaid ? true : undefined;
											const expireTime = item.expireTime || item.expire_time || null;
											const isPaidAndNotPurchased = isPaid && userStore.isLoggedIn ? hasAuth !== true : isPaid;

											// 构建返回对象，确保 isPaidAndNotPurchased 字段正确设置
											const courseData = {
												...item, // 先展开原始字段
												id: item.id,
												name: item.name || item.title || '',
												description: item.description || item.desc || '',
												cover: item.cover_img || item.cover || item.image || '',
												coverVersion: item.update_time || item.updated_at || item.create_time || item.id || '',
												category: item.category || item.primaryCategory || item.primary_category || '',
												sub_category: item.sub_category || item.subCategory || item.secondaryCategory || '',
												studyCount: item.studyCount || item.student_count || item.studentCount || 0,
												isFree: isFree,
												price: price,
												is_free: item.is_free, // 保留原始字段
												hasAuth,
												tags: item.tags || [],
												isPaidAndNotPurchased, // 付费且未购买标识（最后设置，确保不被覆盖）
												expireTime, // 到期时间
											};

											return courseData;
										}),
								)
							: [];
						// 确保 safeFinalItems 始终是数组
						const safeFinalItems = Array.isArray(processedItems) ? processedItems : [];
						// 使用后端返回的 id 和 name
						const categoryName = category.name || '推荐板块';
						return {
							id: category.id || categoryName, // 使用后端返回的 id
							name: categoryName,
							type: category.type || 'course',
							bind_category_id: category.bind_category_id || null,
							bind_category_name: category.bind_category_name || '',
							columns: normalizeRecommendColumns(category.columns),
							items: safeFinalItems,
							display_type: category.display_type || (safeFinalItems.length > 6 ? 'list' : 'grid'),
							sort: category.sort || 0,
						};
						}),
					);
					// 过滤掉空板块
					recommendCategories.value = recommendCategories.value.filter((category) => {
						return category != null && Array.isArray(category.items) && category.items.length > 0;
					});
					recommendCategories.value.forEach((category) => {
						if (category.type !== 'category') {
							(category.items || []).forEach((course) => queueHomeRecommendCoverResolve(course));
						}
					});
				}
				// 兼容其他格式（向后兼容）
				else if (categoriesData && categoriesData.categories && Array.isArray(categoriesData.categories)) {
					recommendCategories.value = categoriesData.categories
						.map((category) => {
							if (!category) return null;
							// 兼容旧格式：直接使用 items
							// 兼容新格式：合并 subCategories 下的 courses
							let items = [];
							if (Array.isArray(category.items)) {
								items = category.items;
							} else if (Array.isArray(category.subCategories)) {
								items = category.subCategories.reduce((acc, subCategory) => {
									const courses = Array.isArray(subCategory.courses) ? subCategory.courses : [];
									return acc.concat(courses);
								}, []);
							}
							const categoryName = category.name || '推荐板块';
							return {
								id: category.id || categoryName,
								name: categoryName,
								type: category.type || 'course',
								bind_category_id: category.bind_category_id || null,
								bind_category_name: category.bind_category_name || '',
								columns: normalizeRecommendColumns(category.columns),
								items: items,
								display_type: category.display_type || 'grid',
							};
						})
						.filter((category) => {
							return category != null && Array.isArray(category.items) && category.items.length > 0;
						});
				}
			}
		}

		if (homeDataErrors.length > 0) {
			console.warn('首页部分数据加载失败:', homeDataErrors);
			if (recommendCategories.value.length === 0 && banners.value.length === 0) {
				uni.showToast({
					title: '加载首页数据失败',
					icon: 'none',
					duration: 2000,
				});
			}
		}
	} catch (error) {
		console.error('获取首页数据失败:', error);
		console.error('错误详情:', error.message, error.stack);
		if (recommendCategories.value.length === 0 && banners.value.length === 0) {
			uni.showToast({
				title: '加载首页数据失败',
				icon: 'none',
				duration: 2000,
			});
		}
	} finally {
		homeDataLoading.value = false;
	}
};

const handleBannerClick = (banner) => {
	if (!banner || !banner.link) return;

	// 判断链接类型
	if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
		// 外部链接，使用 web-view 或复制链接
		uni.showModal({
			title: '提示',
			content: '是否打开外部链接？',
			success: (res) => {
				if (res.confirm) {
					// #ifdef H5
					window.open(banner.link);
					// #endif
					// #ifndef H5
					uni.setClipboardData({
						data: banner.link,
						success: () => {
							uni.showToast({
								title: '链接已复制',
								icon: 'success',
							});
						},
					});
					// #endif
				}
			},
		});
	} else if (banner.link.startsWith('/pages')) {
		// 小程序内部页面路径，使用智能跳转
		// TabBar 页面列表
		const TABBAR_PAGES = ['/pages/index/index', '/pages/bank/index', '/pages/user/index'];

		// 检查是否是 tabBar 页面（需要精确匹配，因为可能有参数）
		const linkPath = banner.link.split('?')[0]; // 去掉参数部分
		const isTabBarPage = TABBAR_PAGES.includes(linkPath);

		if (isTabBarPage) {
			// 使用 switchTab 跳转到 tabBar 页面（注意：switchTab 不支持参数）
			uni.switchTab({
				url: linkPath,
				fail: (err) => {
					console.error('跳转 tabBar 页面失败:', err);
					uni.showToast({
						title: '跳转失败',
						icon: 'none',
					});
				},
			});
		} else {
			// 使用 navigateTo 跳转到普通页面（支持参数）
			uni.navigateTo({
				url: banner.link,
				fail: (err) => {
					console.error('跳转页面失败:', err);
					uni.showToast({
						title: '跳转失败',
						icon: 'none',
					});
				},
			});
		}
	} else {
		// 其他格式的链接，尝试作为页面路径处理
		const pagePath = banner.link.startsWith('/') ? banner.link : `/pages/${banner.link}`;
		uni.navigateTo({
			url: pagePath,
			fail: () => {
				uni.switchTab({
					url: pagePath,
					fail: () => {
						console.error('跳转失败:', banner.link);
						uni.showToast({
							title: '跳转失败',
							icon: 'none',
						});
					},
				});
			},
		});
	}
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
		// 检查是否付费课程（确保类型正确）
		const price = Number(course.price) || 0;
		const isFree = Number(course.is_free) === 1;
		const isPaid = price > 0 && !isFree;

		let courseDetail = null;
		const knownHasAuth = getKnownCourseAuth(course);
		if (isPaid && userStore.isLoggedIn) {
			// 首页推荐接口已返回权限时直接使用；老数据缺少权限字段时才补一次详情。
			if (knownHasAuth === false) {
				uni.navigateTo({
					url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
				});
				return;
			}
			if (knownHasAuth === undefined) {
				try {
					courseDetail = await getCachedCourseDetail(course.id);
					if (!courseDetail?.hasAuth) {
						uni.navigateTo({
							url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
						});
						return;
					}
				} catch (e) {
					console.error('检查课程权限失败:', e);
					// 如果检查失败，也跳转到介绍页面（安全起见）
					uni.navigateTo({
						url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
					});
					return;
				}
			}
		} else if (isPaid && !userStore.isLoggedIn) {
			// 未登录且付费课程，跳转到介绍页面
			uni.navigateTo({
				url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
			});
			return;
		}

		let contentType =
			course.content_type || course.contentType || courseDetail?.content_type || courseDetail?.contentType;
		if (!contentType) {
			try {
				courseDetail = courseDetail || (await getCachedCourseDetail(course.id));
				contentType = courseDetail?.content_type || courseDetail?.contentType;
			} catch (e) {
				console.error('获取课程类型失败:', e);
			}
		}
		// 文件课程和纸质真题始终进课程介绍页，不进练习页
		if (contentType === 'file' || contentType === 'paper_exam') {
			uni.navigateTo({
				url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
			});
			return;
		}

		// 切换到对应题库（仅普通题库课程）
		bankStore.setCurrentBank(course.id);
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

const viewMore = (category) => {
	if (professionalModeEnabled.value) {
		const url = getProfessionalCourseListUrl();
		if (url) {
			uni.navigateTo({ url });
		}
		return;
	}
	if (category?.type === 'category') {
		const primaryName = category.bind_category_name || category.items?.[0]?.category || category.name || '';
		uni.navigateTo({
			url: `/pages/sub-pages/course-list/index?categoryName=${encodeURIComponent(category.name || primaryName || '课程列表')}&category=${encodeURIComponent(primaryName)}`,
		});
		return;
	}
	uni.switchTab({ url: '/pages/bank/index' });
};

const handleImageError = () => {};

const handleCourseCoverError = (course) => {
	if (!course?.id) return;
	if (coverRetryTicks.value[course.id]) return;
	coverRetryTicks.value = {
		...coverRetryTicks.value,
		[course.id]: Date.now(),
	};
};

const handleSubCategoryClick = (subCategory) => {
	if (!subCategory) return;
	uni.navigateTo({
		url: `/pages/sub-pages/course-list/index?categoryName=${encodeURIComponent(subCategory.name || '课程列表')}&category=${encodeURIComponent(subCategory.category || '')}&subCategory=${encodeURIComponent(subCategory.sub_category || subCategory.name || '')}`,
	});
};

// 搜索相关功能
const handleSearchClick = () => {
	showSearchResults.value = true;
	// 聚焦到搜索输入框
	uni.nextTick(() => {
		// 在小程序中可能需要特殊处理
	});
};

// 搜索输入处理（防抖）
let searchTimer = null;
const handleSearchInput = (e) => {
	searchKeyword.value = e.detail.value;
	// 清除之前的定时器
	if (searchTimer) {
		clearTimeout(searchTimer);
	}
	// 防抖：500ms后执行搜索
	searchTimer = setTimeout(() => {
		performSearch(searchKeyword.value);
	}, 500);
};

// 搜索确认
const handleSearchConfirm = () => {
	if (searchTimer) {
		clearTimeout(searchTimer);
	}
	performSearch(searchKeyword.value);
};

// 执行搜索
const performSearch = async (keyword) => {
	if (!keyword || !keyword.trim()) {
		searchResults.value = [];
		return;
	}

	searchLoading.value = true;

	try {
		const res = await getAllCourses({ keyword: keyword.trim() });
		let data = [];
		if (res && res.data && Array.isArray(res.data)) {
			data = res.data;
		} else if (Array.isArray(res)) {
			data = res;
		}
		searchResults.value = data;
	} catch (error) {
		console.error('搜索课程失败:', error);
		uni.showToast({
			title: error.message || '搜索失败',
			icon: 'none',
		});
		searchResults.value = [];
	} finally {
		searchLoading.value = false;
	}
};

// 清空搜索
const clearSearch = () => {
	searchKeyword.value = '';
	searchResults.value = [];
	if (searchTimer) {
		clearTimeout(searchTimer);
	}
};

// 关闭搜索结果
const closeSearchResults = () => {
	showSearchResults.value = false;
	searchKeyword.value = '';
	searchResults.value = [];
	if (searchTimer) {
		clearTimeout(searchTimer);
	}
};

const ensureLoggedIn = (message = '请先登录') => {
	if (userStore.isLoggedIn) return true;
	uni.showModal({
		title: '提示',
		content: message,
		confirmText: '去登录',
		success: (res) => {
			if (res.confirm) {
				uni.navigateTo({ url: '/pages/login/index' });
			}
		},
	});
	return false;
};

const handleUseActivation = () => {
	if (!ensureLoggedIn('使用激活码需要先登录，是否前往登录？')) return;
	uni.navigateTo({ url: '/pages/sub-pages/activation/index' });
};

const handleContactService = () => {
	if (!ensureLoggedIn('联系客服需要先登录，是否前往登录？')) return;
	uni.navigateTo({ url: '/pages/sub-pages/feedback/index?type=feature&title=联系客服' });
};

const handleFaq = () => {
	uni.navigateTo({ url: '/pages/sub-pages/faq/index' });
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';
@import '@/uni.scss';

.index-page {
	width: 100%;
	min-height: 100vh;
	background: $bg-secondary;
	padding: 0;
	padding-bottom: $space-24;
	box-sizing: border-box;
	overflow-x: hidden;
	font-family: $font-family-base;
	transition:
		background-color 0.3s,
		color 0.3s;
	position: relative;
	z-index: 0;

	&.night-mode {
		background: #1a1a1a;
		color: #e0e0e0;

		.course-card,
		.category-section {
			background-color: #2a2a2a;
			color: #e0e0e0;
		}

		.course-title,
		.category-title {
			color: #e0e0e0;
		}
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

/* 顶部渐变区域 - 现代化设计 */
.top-header {
	@include gradient(135deg, $color-primary, $color-primary-dark);
	color: $text-inverse;
	padding: $space-6 $space-8 $space-6;
	border-radius: 0 0 $radius-2xl $radius-2xl;
	position: relative;
	overflow: visible;
	box-shadow: $shadow-xl;
	z-index: $z-sticky;
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
	@include flex(row, space-between, center, 0);
	margin-bottom: $space-5;
	width: 100%;
	min-height: var(--header-top-min-height, 110rpx);
	box-sizing: border-box;
	position: relative;
}

.header-mode-controls {
	position: absolute;
	left: var(--header-mode-left, auto);
	top: var(--header-mode-top, 72rpx);
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	z-index: 2;
}

.professional-switch {
	height: 58rpx;
	min-width: 132rpx;
	padding: 0 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.18);
	border: 1rpx solid rgba(255, 255, 255, 0.28);
	display: flex;
	align-items: center;
	gap: 8rpx;
	box-sizing: border-box;
}

.professional-switch.active {
	background: rgba(255, 255, 255, 0.92);
	border-color: rgba(255, 255, 255, 0.78);
	box-shadow: 0 8rpx 24rpx rgba(38, 26, 94, 0.18);
}

.professional-switch-track {
	width: 48rpx;
	height: 28rpx;
	padding: 3rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.45);
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.professional-switch.active .professional-switch-track {
	background: rgba(124, 58, 237, 0.18);
	justify-content: flex-end;
}

.professional-switch-thumb {
	width: 22rpx;
	height: 22rpx;
	border-radius: 50%;
	background: #ffffff;
	box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.2);
}

.professional-switch.active .professional-switch-thumb {
	background: #7c3aed;
}

.professional-switch-text {
	font-size: 23rpx;
	line-height: 1;
	font-weight: 800;
	color: #ffffff;
	white-space: nowrap;
}

.professional-switch.active .professional-switch-text {
	color: #6d28d9;
}

.professional-settings-btn {
	width: 58rpx;
	height: 58rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	position: relative;
}

.professional-settings-icon-wrap {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 28rpx;
	height: 28rpx;
	transform: translate(-50%, -50%);
	display: flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
}

.professional-settings-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
	width: 28rpx;
	height: 28rpx;
}

.professional-switch:active,
.professional-settings-btn:active {
	transform: scale(0.96);
	opacity: 0.88;
}

.home-quick-actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin: 0 0 24rpx;
}

.quick-action-card {
	min-height: 122rpx;
	padding: 20rpx 8rpx;
	border-radius: 24rpx;
	background: #ffffff;
	box-shadow: 0 10rpx 28rpx rgba(25, 46, 87, 0.08);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	position: relative;
	overflow: hidden;
	border: 1rpx solid rgba(92, 113, 150, 0.08);
}

.quick-action-card::before {
	content: '';
	position: absolute;
	left: 18rpx;
	right: 18rpx;
	top: 0;
	height: 4rpx;
	border-radius: 999rpx;
	opacity: 0.8;
}

.activation-action::before {
	background: linear-gradient(90deg, #2f6df0, #7aa7ff);
}

.service-action::before {
	background: linear-gradient(90deg, #16a085, #51d6bd);
}

.faq-action::before {
	background: linear-gradient(90deg, #f59e0b, #ffd166);
}

.quick-action-card:active {
	transform: scale(0.98);
	opacity: 0.86;
}

.quick-action-icon {
	width: 56rpx;
	height: 56rpx;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.65);
}

.activation-action .quick-action-icon {
	background: linear-gradient(135deg, rgba(47, 109, 240, 0.14), rgba(122, 167, 255, 0.2));
}

.service-action .quick-action-icon {
	background: linear-gradient(135deg, rgba(22, 160, 133, 0.14), rgba(81, 214, 189, 0.2));
}

.faq-action .quick-action-icon {
	background: linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(255, 209, 102, 0.22));
}

.quick-action-title {
	max-width: 100%;
	font-size: 23rpx;
	font-weight: 700;
	color: #263247;
	letter-spacing: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.app-brand {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	gap: 8rpx;
	flex: 1;
	min-width: 0;
	max-width: 58%;
}

.app-brand-title {
	font-family: $font-family-brand;
	font-size: 54rpx;
	font-weight: 700;
	line-height: 1.15;
	letter-spacing: 0;
	color: #ffffff;
	white-space: nowrap;
	text-shadow:
		0 4rpx 16rpx rgba(13, 48, 120, 0.38),
		0 1rpx 0 rgba(255, 255, 255, 0.5);
}

.app-brand-subtitle {
	font-size: 22rpx;
	font-weight: 500;
	line-height: 1.3;
	letter-spacing: 1rpx;
	color: rgba(255, 255, 255, 0.82);
}

.ai-quote {
	margin-top: 0;
	@include glassmorphism(0.3);
	border-radius: $radius-lg;
	padding: 0;
	display: block;
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	transition: all $transition-base;
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);

	&:hover {
		background: rgba(255, 255, 255, 0.35);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}
}

.quote-swiper {
	width: 100%;
	height: 100rpx;
}

.quote-swiper-item {
	height: 100rpx;
	width: 100%;
}

.quote-item {
	@include flex(row, flex-start, center, $space-4);
	padding: $space-4 $space-5;
	width: 100%;
	height: 100%;
	box-sizing: border-box;
}

.quote-icon {
	font-size: $font-size-md;
	flex-shrink: 0;
	margin-top: $space-1;
	color: rgba(255, 255, 255, 0.9);
}

.quote-text {
	flex: 1;
	font-style: italic;
	line-height: $line-height-relaxed;
	min-width: 0;
	word-break: break-word;
	@include text(sm, normal, inverse);
	color: rgba(255, 255, 255, 0.9);
}

.quote-loading {
	@include flex(row, flex-start, flex-start, $space-4);
	padding: $space-4;
	width: 100%;
	box-sizing: border-box;
	animation: pulse 1.5s infinite;

	.quote-icon {
		font-size: $font-size-md;
		flex-shrink: 0;
		margin-top: $space-1;
	}

	.quote-text {
		flex: 1;
		@include text(sm, normal, inverse);
	}
}

/* 搜索框样式 */
.search-box {
	@include glassmorphism(0.3);
	@include flex(row, flex-start, center, $space-3);
	display: flex;
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	padding: $space-4 $space-5;
	border-radius: $radius-full;
	margin-top: $space-4;
	cursor: pointer;
	transition: all $transition-base;
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);

	&:hover {
		background: rgba(255, 255, 255, 0.35);
		transform: translateY(-2rpx);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
	}

	&:active {
		opacity: 0.9;
		transform: scale(0.97) translateY(0);
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
	}
}

.search-placeholder {
	@include text(sm, normal, inverse);
	color: rgba(255, 255, 255, 0.7);
	flex: 1;
}

/* 搜索结果样式 */
.search-results-section {
	width: 100%;
	padding: $space-6 0;
}

.search-results-header {
	@include flex(row, space-between, center, $space-4);
	margin-bottom: $space-6;
	padding: 0 $space-4;
}

.search-input-wrapper {
	@include flex(row, flex-start, center, $space-3);
	flex: 1;
	background-color: #f5f5f5;
	border-radius: $radius-full;
	padding: $space-3 $space-4;
}

.search-input {
	flex: 1;
	font-size: $font-size-base;
	color: $text-primary;
	background: transparent;
	border: none;
	outline: none;
}

.search-clear-btn {
	padding: $space-1;
	cursor: pointer;
	transition: all $transition-fast;
	border-radius: $radius-full;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
		transform: scale(1.1);
	}

	&:active {
		transform: scale(0.95);
	}
}

.search-close-btn {
	padding: $space-2 $space-4;
	cursor: pointer;
	transition: all $transition-fast;
	border-radius: $radius-md;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	&:active {
		transform: scale(0.95);
	}
}

.close-text {
	@include text(base, medium, primary);
	color: $color-primary;
}

.search-loading {
	@include flex(column, center, center, $space-4);
	padding: $space-32 0;
	animation: fadeIn 0.3s ease-in;

	.loading-text {
		position: relative;

		&::after {
			content: '...';
			animation: dots 1.5s steps(4, end) infinite;
		}
	}
}

.search-empty {
	@include flex(column, center, center, $space-4);
	padding: $space-32 0;
	animation: fadeIn 0.3s ease-in;
}

.search-empty {
	.empty-icon {
		font-size: 80rpx;
		margin-bottom: $space-4;
	}

	.empty-text {
		@include text(md, medium, primary);
		margin-bottom: $space-2;
	}

	.empty-hint {
		@include text(sm, normal, tertiary);
	}
}

.search-results-list {
	@include flex(column, flex-start, stretch, $space-4);
}

.search-result-item {
	@include card(md);
	@include flex(row, flex-start, center, $space-4);
	padding: $space-5;
	cursor: pointer;
	transition: all $transition-base;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transition: left 0.5s;
	}

	&:hover {
		transform: translateY(-4rpx);
		box-shadow: $shadow-lg;

		&::before {
			left: 100%;
		}
	}

	&:active {
		opacity: 0.85;
		transform: scale(0.98) translateY(0);
		box-shadow: $shadow-sm;
	}
}

.result-course-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-md;
	object-fit: cover;
	flex-shrink: 0;
}

.result-course-image-placeholder {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-md;
	background-color: #f5f5f5;
	@include flex(row, center, center, 0);
	flex-shrink: 0;
}

.result-course-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $space-2;
	min-width: 0;
}

.result-course-name {
	@include text(base, medium, primary);
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

.result-course-meta {
	display: flex;
	align-items: center;
	gap: $space-2;
}

.result-course-price {
	@include text(sm, medium, error);
	color: $color-error;
}

.result-course-free {
	@include text(sm, medium, success);
	color: $color-success;
}

.decorative-circle {
	position: absolute;
	top: -80rpx;
	right: -80rpx;
	width: 320rpx;
	height: 320rpx;
	background: rgba($color-primary, 0.2);
	border-radius: 50%;
}

.page-content {
	width: 100%;
	padding: 0 $space-8;
	// margin-top: 80rpx;
	position: relative;
	z-index: $z-base;
	box-sizing: border-box;
}

/* 轮播图 - 现代化设计 */
.banner-section {
	margin-bottom: $space-12;
	width: 100%;
	box-sizing: border-box;
	border-radius: $radius-xl;
	overflow: hidden;
	box-shadow: $shadow-lg;
	transition:
		transform $transition-base,
		box-shadow $transition-base;
	cursor: pointer;
	position: relative;
	z-index: $z-base;

	&:hover {
		transform: translateY(-4rpx);
		box-shadow: $shadow-xl;
	}

	&:active {
		transform: translateY(-2rpx);
		box-shadow: $shadow-md;
	}
}

.banner-swiper {
	width: 100%;
	height: 320rpx;
	border-radius: $radius-xl;
	overflow: hidden;
	position: relative;
	z-index: $z-base;
}

.banner-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform $transition-slow;

	.banner-section:hover & {
		transform: scale(1.02);
	}
}

.banner-title {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
	padding: $space-6 $space-8;
	z-index: 1;
	@include text(md, bold, inverse);
	color: $text-inverse;
	text-align: left;
}

/* 推荐板块 - 现代化设计 */
.section {
	margin-bottom: $space-12;
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	overflow: hidden;
}

.section-header {
	@include flex(row, space-between, center, 0);
	margin-bottom: $space-4;
	width: 100%;
	box-sizing: border-box;
}

.section-title-wrapper {
	@include flex(row, flex-start, center, 0);
}

.title-border {
	width: 6rpx;
	height: 32rpx;
	background: $color-primary;
	border-radius: $radius-sm;
	margin-right: $space-4;

	&.purple {
		background: $color-secondary;
	}
}

.section-title {
	@include text(md, bold, primary);
}

.section-more {
	@include text(xs, normal, secondary);
	cursor: pointer;
	transition: all $transition-fast;
	padding: $space-2 $space-4;
	border-radius: $radius-md;
	position: relative;

	&::after {
		content: '→';
		margin-left: $space-2;
		transition: transform $transition-fast;
		display: inline-block;
	}

	&:hover {
		color: $color-primary;
		background: rgba($color-primary, 0.08);

		&::after {
			transform: translateX(4rpx);
		}
	}

	&:active {
		color: $color-primary;
		transform: scale(0.95);
		background: rgba($color-primary, 0.12);
	}
}

.public-course-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $space-4;
	width: 100%;
	box-sizing: border-box;
}

.sub-category-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $space-4;
	width: 100%;
	box-sizing: border-box;
}

.sub-category-card {
	@include card(sm);
	padding: $space-4;
	background: #ffffff;
	transition: all $transition-base;

	&:active {
		transform: scale(0.98);
		box-shadow: $shadow-xs;
	}
}

.sub-category-cover {
	width: 100%;
	aspect-ratio: 1.35;
	border-radius: 22rpx;
	overflow: hidden;
	@include flex(row, center, center, 0);
	background: linear-gradient(135deg, rgba($color-primary, 0.16), rgba($color-secondary, 0.12));

	&.sub-cover-1 {
		background: linear-gradient(135deg, rgba($color-success, 0.16), rgba($color-primary, 0.12));
	}

	&.sub-cover-2 {
		background: linear-gradient(135deg, rgba($color-warning, 0.18), rgba($color-error, 0.1));
	}

	&.sub-cover-3 {
		background: linear-gradient(135deg, rgba($color-secondary, 0.16), rgba($color-primary, 0.1));
	}
}

.sub-category-cover-image {
	width: 100%;
	height: 100%;
	display: block;
}

.sub-category-placeholder {
	font-size: 56rpx;
	font-weight: 800;
	color: rgba($color-primary, 0.72);
}

.sub-category-info {
	padding-top: $space-3;
}

.sub-category-name {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: $text-primary;
	line-height: 1.35;
	@include truncate;
}

.sub-category-count {
	display: block;
	margin-top: $space-1;
	font-size: 22rpx;
	color: $text-tertiary;
}

.public-course-item {
	@include card(sm);
	@include flex(column, flex-start, stretch, $space-3);
	min-height: 0;
	width: 100%;
	max-width: 100%;
	overflow: hidden;
	padding: $space-4;
	cursor: pointer;
	box-sizing: border-box;
	transition: all $transition-base;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba($color-primary, 0.05) 0%, transparent 100%);
		opacity: 0;
		transition: opacity $transition-base;
		pointer-events: none;
	}

	&:hover {
		transform: translateY(-6rpx);
		box-shadow: $shadow-lg;

		&::after {
			opacity: 1;
		}

		.course-icon-wrapper {
			transform: scale(1.05) rotate(2deg);
		}
	}

	&:active {
		transform: scale(0.97) translateY(0);
		box-shadow: $shadow-sm;

		&::after {
			opacity: 0.5;
		}
	}
}

.course-icon-wrapper {
	position: relative;
	width: 100%;
	aspect-ratio: 1;
	height: auto;
	flex: 0 0 auto;
	border-radius: 20rpx;
	@include flex(row, center, center, 0);
	transition: all $transition-base;
	box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.08);
	background: #ffffff;
	overflow: hidden;

	&.icon-0 {
		border: 2rpx solid rgba($color-error, 0.12);
	}

	&.icon-1 {
		border: 2rpx solid rgba($color-primary, 0.12);
	}

	&.icon-2 {
		border: 2rpx solid rgba($color-success, 0.12);
	}

	.public-course-item:hover & {
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);
	}
}

.course-icon {
	font-size: 40rpx;
}

.course-cover-image {
	width: 100%;
	height: 100%;
	border-radius: 20rpx;
	background: #ffffff;
}

.course-category-line {
	display: block;
	width: 100%;
	min-height: 34rpx;
	box-sizing: border-box;
	padding: 0 $space-1;
	font-size: 22rpx;
	line-height: 1.35;
	color: $text-secondary;
	text-align: center;
	@include truncate;
}

.paid-badge {
	position: absolute;
	top: -8rpx;
	right: -8rpx;
	width: 48rpx;
	height: 48rpx;
	background: linear-gradient(135deg, $color-error 0%, $color-secondary 100%);
	border-radius: 50%;
	@include flex(row, center, center, 0);
	box-shadow: 0 4rpx 12rpx rgba($color-error, 0.3);
	z-index: 10;
}

/* 专业课精选 - 现代化设计 */
.major-course-list {
	@include flex(column, flex-start, stretch, $space-6);
	width: 100%;
	box-sizing: border-box;
}

.major-course-item {
	@include card(md);
	@include flex(row, space-between, center, 0);
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	padding: $space-8;
	cursor: pointer;
	transition: all $transition-base;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6rpx;
		background: $color-primary;
		transform: scaleY(0);
		transition: transform $transition-base;
		transform-origin: top;
	}

	&:hover {
		transform: translateX(4rpx);
		box-shadow: $shadow-lg;

		&::before {
			transform: scaleY(1);
		}

		.major-course-icon {
			transform: scale(1.08);
		}

		.major-course-btn {
			background: rgba($color-primary, 0.15);
			transform: translateX(4rpx);
		}
	}

	&:active {
		transform: scale(0.98) translateX(0);
		box-shadow: $shadow-sm;

		.major-course-btn {
			transform: translateX(0) scale(0.95);
		}
	}
}

.major-course-left {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.major-course-icon {
	position: relative;
	width: 96rpx;
	height: 96rpx;
	background: rgba(175, 82, 222, 0.1);
	border-radius: $ios-radius-md;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: $ios-spacing-lg;
	transition: all $transition-base;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
	border: 2rpx solid rgba(175, 82, 222, 0.15);
}

.major-icon {
	font-size: 48rpx;
}

.major-course-cover-image {
	width: 100%;
	height: 100%;
	border-radius: $ios-radius-md;
}

.major-course-info {
	flex: 1;
	min-width: 0;
}

.major-course-name {
	@include text(md, bold, primary);
	margin-bottom: $space-2;
	display: block;
	@include truncate;
	width: 100%;
	box-sizing: border-box;
}

.major-course-category {
	display: block;
	width: 100%;
	margin-bottom: $space-3;
	font-size: 22rpx;
	color: $text-tertiary;
	@include truncate;
}

.major-course-tags {
	@include flex(row, flex-start, center, $space-4);
	flex-wrap: wrap;
}

.course-tag {
	@include text(xs, normal, primary);
	padding: $space-1 $space-3;
	border-radius: $radius-sm;

	&.yellow {
		background: rgba($color-warning, 0.2);
		color: $color-warning-dark;
	}

	&.gray {
		background: $color-neutral-200;
		color: $color-neutral-600;
	}
}

.major-course-btn {
	background: rgba($color-primary, 0.1);
	color: $color-primary;
	padding: $space-3 $space-6;
	border-radius: $radius-full;
	@include text(xs, medium, primary);
	flex-shrink: 0;
	margin-left: $space-4;
	white-space: nowrap;
	box-sizing: border-box;
	transition: all $transition-base;
	cursor: pointer;
	border: 1rpx solid rgba($color-primary, 0.2);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba($color-primary, 0.2);
		transform: translate(-50%, -50%);
		transition:
			width 0.3s,
			height 0.3s;
	}

	&:hover {
		background: rgba($color-primary, 0.15);
		border-color: rgba($color-primary, 0.3);
		box-shadow: 0 2rpx 8rpx rgba($color-primary, 0.2);

		&::before {
			width: 200%;
			height: 200%;
		}
	}

	&:active {
		background: rgba($color-primary, 0.2);
		transform: scale(0.95);
	}
}

/* 引导气泡 - 现代化设计 */
.index-page.is-android {
	.ai-quote,
	.search-box {
		background: rgba(255, 255, 255, 0.28);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	.course-icon-wrapper,
	.sub-category-cover {
		min-height: 160rpx;
	}
}

.guide-bubble {
	position: absolute;
	right: $space-8;
	background: $color-neutral-900;
	color: $text-inverse;
	@include text(xs, normal, inverse);
	padding: $space-3 20rpx;
	border-radius: $radius-lg;
	box-shadow: $shadow-xl;
	z-index: $z-tooltip;
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
	color: $text-inverse;
	@include text(xs, normal, inverse);
	line-height: $line-height-normal;
}

.bubble-arrow {
	position: absolute;
	top: -6rpx;
	right: $space-8;
	width: 12rpx;
	height: 12rpx;
	background: $color-neutral-900;
	transform: rotate(45deg);
}

/* 加载和空状态 - 现代化设计 */
.loading-state,
.empty-state {
	padding: $space-20 0;
	text-align: center;
	width: 100%;
	box-sizing: border-box;
	animation: fadeIn 0.3s ease-in;
}

.loading-text {
	@include text(sm, normal, tertiary);
	position: relative;
	display: inline-block;

	&::after {
		content: '...';
		animation: dots 1.5s steps(4, end) infinite;
	}
}

.empty-text {
	@include text(sm, normal, tertiary);
}

@keyframes dots {
	0%,
	20% {
		content: '.';
	}
	40% {
		content: '..';
	}
	60%,
	100% {
		content: '...';
	}
}

.loading-container,
.empty-container {
	padding: $space-20 0;
	text-align: center;
	width: 100%;
	box-sizing: border-box;
	margin-top: $space-12;
	animation: fadeIn 0.3s ease-in;
}

.professional-picker-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 1190;
	background: rgba(15, 23, 42, 0.42);
	display: flex;
	align-items: flex-end;
	justify-content: center;
}

.professional-picker-panel {
	width: 100%;
	max-height: 78vh;
	background: #ffffff;
	border-radius: 28rpx 28rpx 0 0;
	overflow: hidden;
	box-shadow: 0 -20rpx 60rpx rgba(15, 23, 42, 0.18);
}

.professional-picker-header {
	height: 112rpx;
	padding: 0 28rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #eef1f6;
	box-sizing: border-box;
}

.professional-picker-title-wrap {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.professional-picker-title {
	font-size: 32rpx;
	line-height: 1.25;
	font-weight: 800;
	color: #192235;
}

.professional-picker-current {
	max-width: 520rpx;
	font-size: 23rpx;
	line-height: 1.25;
	color: #7c3aed;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.professional-picker-close {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f4f6fa;
	flex: 0 0 auto;
}

.professional-picker-intro {
	margin: 20rpx 24rpx 0;
	padding: 20rpx;
	border-radius: 18rpx;
	background: rgba(124, 58, 237, 0.08);
	border: 1rpx solid rgba(124, 58, 237, 0.16);
	display: flex;
	align-items: flex-start;
	gap: 14rpx;
	box-sizing: border-box;
}

.professional-picker-intro-icon {
	width: 50rpx;
	height: 50rpx;
	border-radius: 16rpx;
	background: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	box-shadow: 0 6rpx 16rpx rgba(124, 58, 237, 0.12);
}

.professional-picker-intro-content {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.professional-picker-intro-title {
	font-size: 27rpx;
	line-height: 1.3;
	font-weight: 800;
	color: #4c1d95;
}

.professional-picker-intro-text {
	font-size: 24rpx;
	line-height: 1.45;
	color: #6d28d9;
}

.professional-picker-loading,
.professional-picker-empty {
	min-height: 420rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.professional-picker-body {
	height: 560rpx;
	display: flex;
	background: #f6f8fc;
}

.professional-primary-list {
	width: 210rpx;
	height: 100%;
	background: #ffffff;
	border-right: 1rpx solid #edf1f7;
	box-sizing: border-box;
}

.professional-primary-item {
	min-height: 92rpx;
	padding: 0 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	box-sizing: border-box;
}

.professional-primary-item.active {
	background: rgba(124, 58, 237, 0.08);
}

.professional-primary-item.active::before {
	content: '';
	position: absolute;
	left: 0;
	top: 24rpx;
	bottom: 24rpx;
	width: 6rpx;
	border-radius: 999rpx;
	background: #7c3aed;
}

.professional-primary-text {
	width: 100%;
	font-size: 26rpx;
	line-height: 1.35;
	font-weight: 700;
	color: #334155;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.professional-primary-item.active .professional-primary-text {
	color: #6d28d9;
}

.professional-secondary-list {
	flex: 1;
	height: 100%;
	padding: 20rpx;
	box-sizing: border-box;
}

.professional-secondary-item {
	min-height: 92rpx;
	padding: 18rpx 22rpx;
	margin-bottom: 16rpx;
	border-radius: 16rpx;
	background: #ffffff;
	border: 1rpx solid #e8edf5;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	box-sizing: border-box;
}

.professional-secondary-item.active {
	border-color: rgba(124, 58, 237, 0.42);
	background: rgba(124, 58, 237, 0.08);
}

.professional-secondary-empty {
	min-height: 240rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.professional-secondary-content {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.professional-secondary-title {
	min-width: 0;
	font-size: 28rpx;
	line-height: 1.35;
	font-weight: 700;
	color: #1f2937;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.professional-secondary-count {
	flex: 0 0 auto;
	font-size: 22rpx;
	color: #8490a4;
	white-space: nowrap;
}

.professional-secondary-check {
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	border: 2rpx solid #d7deea;
	background: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	box-sizing: border-box;
}

.professional-secondary-item.active .professional-secondary-check {
	border-color: #7c3aed;
	background: #7c3aed;
}

.professional-picker-footer {
	padding: 18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));
	background: #ffffff;
	border-top: 1rpx solid #eef1f6;
	display: flex;
	gap: 18rpx;
}

.professional-confirm-btn,
.professional-clear-btn {
	flex: 1;
	height: 76rpx;
	line-height: 76rpx;
	border-radius: 16rpx;
	font-size: 26rpx;
	font-weight: 700;
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

.professional-confirm-btn {
	background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
	color: #ffffff;
	box-shadow: 0 10rpx 22rpx rgba(109, 40, 217, 0.2);
}

.professional-confirm-btn.disabled {
	background: #e5e9f0;
	color: #94a3b8;
	box-shadow: none;
}

.professional-clear-btn {
	background: #f4f6fa;
	color: #475569;
}

.professional-confirm-btn::after,
.professional-clear-btn::after {
	border: none;
}

.home-popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1200;
	background: rgba(0, 0, 0, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx 32rpx;
	box-sizing: border-box;
}

.home-popup-card {
	width: 100%;
	max-width: 620rpx;
	max-height: 80vh;
	background: #fff;
	border-radius: 24rpx;
	overflow: hidden;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.home-popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid #f0f0f0;
	box-sizing: border-box;
}

.home-popup-title {
	flex: 1;
	min-width: 0;
	font-size: 34rpx;
	font-weight: 600;
	color: #111827;
}

.home-popup-close {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 44rpx;
	color: #9ca3af;
	flex-shrink: 0;
}

.home-popup-body {
	flex: 1;
	min-height: 0;
	max-height: 56vh;
	padding: 24rpx 32rpx;
	box-sizing: border-box;
	position: relative;
	overflow: hidden;
}

.home-popup-image {
	width: 100%;
	border-radius: 12rpx;
	margin-bottom: 20rpx;
}

.home-popup-swiper {
	width: 100%;
	max-height: 56vh;
}

.home-popup-swiper-item {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
}

.home-popup-page-scroll {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	padding-bottom: 48rpx;
}

.home-popup-rich-text {
	display: block;
	font-size: 28rpx;
	line-height: 1.7;
	color: #374151;
	word-break: break-word;
}

.home-popup-rich-text :deep(img) {
	max-width: 100%;
	height: auto;
}

.home-popup-footer {
	padding: 20rpx 32rpx 32rpx;
	box-sizing: border-box;
}

.home-popup-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	margin: 0;
	padding: 0;
	background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
	color: #fff;
	font-size: 30rpx;
	font-weight: 500;
	border: none;
	border-radius: 44rpx;

	&::after {
		border: none;
	}
}

/* 添加淡入动画 */
@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 添加平滑滚动 */
.page-content {
	animation: fadeIn 0.4s ease-out;
}

/* 优化课程卡片加载动画 */
.public-course-item,
.major-course-item,
.search-result-item {
	animation: scaleIn 0.3s ease-out backwards;
}

/* 为前10个卡片添加渐进式延迟动画 */
.public-course-item:nth-child(1),
.major-course-item:nth-child(1),
.search-result-item:nth-child(1) {
	animation-delay: 0.05s;
}

.public-course-item:nth-child(2),
.major-course-item:nth-child(2),
.search-result-item:nth-child(2) {
	animation-delay: 0.1s;
}

.public-course-item:nth-child(3),
.major-course-item:nth-child(3),
.search-result-item:nth-child(3) {
	animation-delay: 0.15s;
}

.public-course-item:nth-child(4),
.major-course-item:nth-child(4),
.search-result-item:nth-child(4) {
	animation-delay: 0.2s;
}

.public-course-item:nth-child(5),
.major-course-item:nth-child(5),
.search-result-item:nth-child(5) {
	animation-delay: 0.25s;
}
</style>
