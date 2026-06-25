<template>
	<view class="bank-page" :class="pageClasses">
		<app-tab-nav-bar title="练习" />
		<view class="bank-nav-placeholder" :style="{ height: `${navbarMetrics.height}px` }"></view>
		<!-- 顶部下拉选择 -->
		<view class="bank-header">
			<view class="header-content">
				<view class="header-selector" @click="showCoursePicker = true">
					<view class="selector-text">
						<text class="selector-text-inner">{{ currentSubject.name }}</text>
					</view>
					<view class="switch-course-btn" @click.stop="showCoursePicker = true">
						<text class="switch-course-btn-text">切换课程</text>
					</view>
				</view>
			</view>
		</view>

		<scroll-view
			class="page-content"
			scroll-y
			refresher-enabled
			:refresher-threshold="55"
			:refresher-triggered="refresherTriggered"
			@refresherrefresh="onRefresh"
		>
			<!-- 加载状态 -->
			<view v-if="bankDataLoading" class="loading-container">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 内容区域 -->
			<template v-else>
				<!-- 概览双卡 -->
				<view class="summary-stats-grid" v-if="userStore.isLoggedIn">
					<view class="summary-stat-card" @click="openCheckinCalendarFromSummary">
						<view class="summary-stat-icon summary-stat-icon--checkin">
							<app-icon name="calendar" :size="36" color="#17c3a2" />
						</view>
						<view class="summary-stat-body">
							<text class="summary-stat-title">打卡日历</text>
							<text class="summary-stat-desc">本月已打卡 {{ checkinSummaryMonthCount }} 天</text>
							<text class="summary-stat-link">去打卡 ›</text>
						</view>
					</view>
					<view class="summary-stat-card summary-stat-card--static">
						<view class="summary-stat-icon summary-stat-icon--study">
							<app-icon name="clock" :size="36" color="#2f6df0" />
						</view>
						<view class="summary-stat-body">
							<text class="summary-stat-title">今日学习</text>
							<text class="summary-stat-desc">{{ todayStudyDescText }}</text>
						</view>
					</view>
				</view>

				<!-- 文件课程：已购课程 + 当前学习文件 -->
				<view
					class="file-course-section"
					v-if="currentBank && isCurrentFileCourse && (purchasedFileCourses.length || courseFileList.length)"
				>
					<view v-if="purchasedFileCourses.length" class="section-card purchased-courses-card">
						<view class="section-card-header">
							<view class="section-card-title-row">
								<app-icon name="book" :size="32" color="#6366f1" />
								<text class="section-card-title">我的已购课程 ({{ purchasedFileCourses.length }}门)</text>
							</view>
							<view
								v-if="showPurchasedCoursesExpand"
								class="section-card-more-btn"
								@click.stop="showPurchasedFileCoursesModal = true"
							>
								<text class="section-card-more-text">查看全部 ›</text>
							</view>
						</view>
						<view
							v-for="course in previewPurchasedCourses"
							:key="course.id"
							class="purchased-course-row"
							:class="{ 'purchased-course-row--active': course.id === currentBank.id }"
							@click="handleSelectPurchasedFileCourse(course)"
						>
							<view class="purchased-course-row-icon">
								<app-icon name="file" :size="28" color="#64748b" />
							</view>
							<text class="purchased-course-row-name">{{ course.name }}</text>
							<view
								class="purchased-course-status"
								:class="`purchased-course-status--${getPurchasedCourseStatus(course).type}`"
							>
								<text class="purchased-course-status-text">{{ getPurchasedCourseStatus(course).label }}</text>
							</view>
						</view>
						<view
							v-if="showPurchasedCoursesExpand"
							class="tag-list-more-btn"
							@click.stop="showPurchasedFileCoursesModal = true"
						>
							<text class="tag-list-more-btn-text">还有 {{ hiddenPurchasedCoursesCount }} 门课程</text>
							<text class="tag-list-more-btn-arrow">›</text>
						</view>
					</view>

					<view v-if="courseFileList.length" class="section-card study-files-card">
						<view class="section-card-header">
							<view class="section-card-title-row">
								<app-icon name="book" :size="32" color="#2f6df0" />
								<text class="section-card-title">当前学习文件</text>
							</view>
						</view>
						<view
							v-for="file in previewCourseFiles"
							:key="getCourseFileKey(file)"
							class="study-file-row"
							:class="{ 'study-file-row--active': isActiveCourseFile(file) }"
							@click="handleStudyFileClick(file)"
						>
							<view class="study-file-icon-wrap">
								<text class="study-file-type">{{ (file.file_type || 'file').toUpperCase() }}</text>
							</view>
							<view class="study-file-main">
								<text class="study-file-name">{{ getCourseFileDisplayName(file, currentBank.name) }}</text>
								<text class="study-file-progress">{{ getFileProgressText(file) }}</text>
							</view>
							<text class="study-file-action">{{ getFileActionText(file) }} ›</text>
						</view>
						<view
							v-if="showCourseFilesExpand"
							class="study-files-footer"
							@click.stop="showCourseFilesModal = true"
						>
							<text class="study-files-footer-text">
								查看此课程全部文件… 和 {{ hiddenCourseFilesCount }} 个其他文件 ›
							</text>
						</view>
					</view>
				</view>

				<!-- 统计卡片 -->
				<view class="stats-card" v-if="currentBank && !isCurrentFileCourse">
					<view class="stats-left">
						<text class="stats-label">累计正确率</text>
						<text class="stats-value">{{ accuracy }}%</text>
					</view>
					<view class="stats-right">
						<text class="stats-label-small">已刷题/总题数</text>
						<text class="stats-value-small"
							>{{ currentBank?.doneCount || 0 }}
							<text class="stats-total">/ {{ currentBank?.totalCount || 0 }}</text></text
						>
					</view>
					<!-- 进度条 -->
					<view class="stats-progress">
						<view class="progress-bar" :style="{ width: accuracy + '%' }"></view>
					</view>
				</view>

				<!-- 8宫格功能 -->
				<view class="function-grid" v-if="!isCurrentFileCourse">
					<view v-for="(item, idx) in functionList" :key="idx" class="grid-item" @click="handleFunction(item.type)">
						<view class="grid-icon-wrapper" :class="`icon-${idx}`">
							<text class="grid-icon">{{ item.icon }}</text>
						</view>
						<text class="grid-text">{{ item.name }}</text>
					</view>
				</view>

				<!-- 章节列表 -->
				<view class="chapter-section" v-if="!isCurrentFileCourse && chapterList.length > 0">
					<view class="section-title">章节练习</view>
					<view class="chapter-list">
						<view
							v-for="chapter in chapterList"
							:key="chapter.id"
							class="chapter-item"
							:class="{ 'chapter-locked': chapter.status === 'locked' }"
							@click="handleChapterClick(chapter)"
						>
							<view class="chapter-info">
								<text class="chapter-name" :class="{ 'text-disabled': chapter.status === 'locked' }">{{
									chapter.name
								}}</text>
								<text class="chapter-meta" :class="{ 'text-disabled': chapter.status === 'locked' }"
									>{{ chapter.questionCount }}题</text
								>
							</view>
							<view class="chapter-status">
								<app-icon v-if="chapter.status === 'locked'" name="lock" :size="32" color="#999" class="status-icon" />
								<app-icon v-else-if="chapter.status === 'done'" name="check" :size="32" class="status-icon" />
								<text v-else class="status-progress">{{ chapter.progress || 0 }}/{{ chapter.questionCount }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 相关推荐 -->
				<view class="recommend-section" v-if="!isCurrentFileCourse && recommendedCourses.length > 0">
					<text class="section-title-small">相关推荐</text>
					<view class="recommend-list">
						<view
							v-for="course in recommendedCourses"
							:key="course.id"
							class="recommend-item"
							@click="handleRecommendClick(course)"
						>
							<image
								v-if="course.cover_img"
								:src="getImageUrl(course.cover_img)"
								class="recommend-cover"
								mode="aspectFill"
							/>
							<view class="recommend-info">
								<text class="recommend-name">{{ course.name }}</text>
								<view class="recommend-meta">
									<text v-if="course.subject" class="meta-item">{{ course.subject }}</text>
									<text v-if="course.school" class="meta-item">{{ course.school }}</text>
								</view>
								<view class="recommend-price">
									<text v-if="course.price > 0" class="price-text">¥{{ course.price }}</text>
									<text v-else class="free-text">免费</text>
									<text v-if="course.is_vip_free === 1" class="vip-tag">套餐免费</text>
								</view>
								<!-- 到期时间显示 -->
								<view v-if="course.expireTime" class="expire-time-info">
									<text class="expire-label">到期：</text>
									<text class="expire-time">{{ formatExpireTime(course.expireTime) }}</text>
								</view>
							</view>
							<text class="recommend-arrow">›</text>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view
					v-if="
						!isCurrentFileCourse &&
						!bankDataLoading &&
						currentBank &&
						paperList.length === 0 &&
						chapterList.length === 0
					"
					class="empty-container"
				>
					<text class="empty-text">暂无章节和真题</text>
				</view>
			</template>
		</scroll-view>

		<!-- 打卡日历弹窗 - 放在根节点避免被遮挡 -->
		<view v-if="showCheckinCalendarModal" class="checkin-calendar-modal-mask" @click="hideCheckinCalendarModal">
			<view class="checkin-calendar-modal" @click.stop>
				<view class="checkin-modal-header">
					<text class="checkin-modal-title">打卡日历</text>
					<text class="checkin-modal-stats-text">本月打卡 {{ checkinCalendarCurrentMonthCheckins }} 天</text>
					<view class="checkin-modal-close" @click.stop="hideCheckinCalendarModal">
						<app-icon name="close" :size="24" color="#666" />
					</view>
				</view>
				<scroll-view class="checkin-calendar-content" scroll-y :show-scrollbar="false">
					<view class="checkin-rule-card">
						<view class="checkin-rule-title-row">
							<text class="checkin-rule-icon">i</text>
							<text class="checkin-rule-title">打卡规则说明</text>
						</view>
						<text class="checkin-rule-text">
							每日在练习页累计学习满 {{ checkinRequiredMinutes }} 分钟后，可点击「打卡」完成当天打卡。
						</text>
						<text class="checkin-rule-text checkin-rule-text--highlight">
							每次打卡成功可获得 {{ checkinRewardPoints }} 积分，积分可在「积分商城」兑换优惠券。
						</text>
						<text class="checkin-rule-text"> 每天仅可打卡 1 次；绿色标记表示当天已完成，未来日期不可打卡。 </text>
					</view>
					<view class="checkin-calendar-weekdays">
						<text v-for="day in checkinWeekdays" :key="day" class="checkin-weekday">{{ day }}</text>
					</view>
					<view class="checkin-calendar-grid">
						<view v-for="n in checkinEmptyDaySlots" :key="`empty-${n}`" class="checkin-calendar-day empty"></view>
						<view
							v-for="day in checkinDayList"
							:key="day"
							class="checkin-calendar-day"
							:class="{
								today: checkinIsToday(day),
								checked: checkinIsCheckedIn(day),
								past: checkinIsPast(day),
								future: checkinIsFuture(day),
							}"
							@click.stop="checkinHandleDayClick(day)"
						>
							<text class="checkin-day-number">{{ day }}</text>
							<view v-if="checkinIsCheckedIn(day)" class="checkin-check-mark">
								<app-icon name="check-circle-fill" :size="16" color="#2ecc71" />
							</view>
						</view>
					</view>
				</scroll-view>
				<view class="checkin-modal-footer">
					<view
						class="checkin-modal-primary-btn"
						:class="{ 'checkin-modal-primary-btn--disabled': checkinHasCheckedInToday || checkinSubmitting }"
						hover-class="checkin-btn-hover"
						@click.stop="handleCheckin"
					>
						<text>{{ checkinHasCheckedInToday ? '今日已打卡' : checkinSubmitting ? '打卡中...' : '打卡' }}</text>
					</view>
					<view class="checkin-modal-footer-row">
						<view class="checkin-modal-secondary-btn" hover-class="checkin-btn-hover" @click.stop="handleGoPointsMall">
							<text>积分商城</text>
						</view>
						<view
							class="checkin-modal-close-btn"
							hover-class="checkin-btn-hover"
							@click.stop="hideCheckinCalendarModal"
						>
							<text>关闭</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 已购买文件课程弹窗 -->
		<view
			class="course-picker-mask"
			v-if="showPurchasedFileCoursesModal"
			@click="showPurchasedFileCoursesModal = false"
		>
			<view class="course-picker-popup purchased-file-course-popup" @click.stop>
				<view class="picker-header">
					<text class="picker-title">我的已购课程</text>
					<view class="picker-close-btn" @click="showPurchasedFileCoursesModal = false">
						<app-icon name="close" :size="28" color="#666" />
					</view>
				</view>
				<scroll-view class="picker-content" scroll-y>
					<view
						v-for="course in purchasedFileCourses"
						:key="course.id"
						class="picker-item"
						:class="{ active: course.id === currentBank?.id }"
						@click="handleSelectPurchasedFileCourse(course)"
					>
						<view class="item-info">
							<text class="item-name">{{ course.name }}</text>
							<view class="item-meta">
								<text v-if="course.subject" class="meta-tag">{{ course.subject }}</text>
								<text class="meta-free">资料课程</text>
							</view>
						</view>
					</view>
					<view v-if="purchasedFileCourses.length === 0" class="picker-empty">
						<text class="empty-text">暂无已购买的资料课程</text>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 课程文件弹窗 -->
		<view class="course-picker-mask" v-if="showCourseFilesModal" @click="showCourseFilesModal = false">
			<view class="course-picker-popup purchased-file-course-popup" @click.stop>
				<view class="picker-header">
					<text class="picker-title">课程文件</text>
					<view class="picker-close-btn" @click="showCourseFilesModal = false">
						<app-icon name="close" :size="28" color="#666" />
					</view>
				</view>
				<scroll-view class="picker-content" scroll-y>
					<view
						v-for="file in courseFileList"
						:key="getCourseFileKey(file)"
						class="picker-item"
						:class="{ active: isActiveCourseFile(file) }"
						@click="handleSelectCourseFileFromModal(file)"
					>
						<view class="item-info">
							<text class="item-name">{{ getCourseFileDisplayName(file, currentBank?.name) }}</text>
							<view class="item-meta">
								<text class="meta-tag">{{ (file.file_type || 'file').toUpperCase() }}</text>
							</view>
						</view>
					</view>
					<view v-if="courseFileList.length === 0" class="picker-empty">
						<text class="empty-text">暂无课程文件</text>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 课程选择弹窗 -->
		<view class="course-picker-mask" v-if="showCoursePicker" @click="showCoursePicker = false">
			<view class="course-picker-popup" @click.stop>
				<view class="picker-header">
					<text class="picker-title">切换课程</text>
					<view class="picker-close-btn" @click="showCoursePicker = false">
						<app-icon name="close" :size="28" color="#666" />
					</view>
				</view>

				<!-- 搜索框 -->
				<view class="picker-search">
					<view class="search-box">
						<app-icon name="search" :size="24" color="#999" class="search-icon" />
						<input
							class="search-input"
							v-model="courseSearchKeyword"
							placeholder="搜索课程名称"
							@input="handleSearchInput"
						/>
						<view v-if="courseSearchKeyword" class="search-clear" @click="courseSearchKeyword = ''">
							<app-icon name="close" :size="20" color="#999" />
						</view>
					</view>
				</view>

				<!-- 筛选按钮 -->
				<view class="picker-filter">
					<view class="filter-item" :class="{ active: courseFilterType === 'all' }" @click="courseFilterType = 'all'">
						<text class="filter-text">全部</text>
						<text class="filter-count">({{ allSubjects.length }})</text>
					</view>
					<view
						class="filter-item"
						:class="{ active: courseFilterType === 'purchased' }"
						@click="courseFilterType = 'purchased'"
					>
						<text class="filter-text">已购买</text>
						<text class="filter-count">({{ purchasedCoursesCount }})</text>
					</view>
				</view>

				<scroll-view class="picker-content" scroll-y>
					<view
						v-for="subject in filteredCourses"
						:key="subject.id"
						class="picker-item"
						:class="{ active: subject.id === currentSubject.id }"
						@click="handleSelectCourse(subject)"
					>
						<view class="item-info">
							<text class="item-name">{{ subject.name }}</text>
							<view class="item-meta">
								<text v-if="subject.subject" class="meta-tag">{{ subject.subject }}</text>
								<text v-if="subject.price > 0 && !subject.hasAuth" class="meta-price">¥{{ subject.price }}</text>
								<text v-else-if="subject.hasAuth" class="meta-free">已购买</text>
								<text v-else class="meta-free">免费</text>
							</view>
						</view>
					</view>
					<view v-if="filteredCourses.length === 0" class="picker-empty">
						<text class="empty-text">{{ courseSearchKeyword ? '未找到相关课程' : '暂无课程' }}</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app';
import { useBankStore } from '@/store/bank';
import { useUserStore } from '@/store/user';
import {
	getAllCourses,
	getCourseDetail,
	getChapterQuestions,
	getAnswerRecords,
	getExamConfigs,
	getCourseRecommendations,
	getCoursePreviewTicket,
	getCourseDocumentPreviewUrl,
	getFileCourseReadingProgress,
	getCheckinList,
	getCheckinMinutes,
	getTodayCheckinStatus,
	getPointsConfig,
	checkin,
} from '@/api/index';
import BankSelector from '@/components/bank-selector/bank-selector.vue';
import AppIcon from '@/components/app-icon/app-icon.vue';
import AppTabNavBar from '@/components/app-tab-nav-bar/app-tab-nav-bar.vue';
import { getApiBaseUrl } from '@/utils/api-base';
import { buildSharePath, getDefaultShare, toTimelineShare } from '@/utils/share';
import { getCourseFileDisplayName } from '@/utils/format';
import { usePageClasses } from '@/composables/usePageClasses';
import { getDailyOnlineSeconds } from '@/utils/daily-online';

const bankStore = useBankStore();
const pageClasses = usePageClasses();
const userStore = useUserStore();

// 打卡日历弹窗（与首页原逻辑一致，监听 checkin-calendar 组件的展开事件）
const showCheckinCalendarModal = ref(false);
const checkinWeekdays = ['日', '一', '二', '三', '四', '五', '六'];
const checkinCalendarYear = ref(new Date().getFullYear());
const checkinCalendarMonth = ref(new Date().getMonth() + 1);
const checkinCalendarDates = ref([]);
const checkinRequiredMinutes = ref(15);
const checkinRewardPoints = ref(50);
const checkinHasCheckedInToday = ref(false);
const checkinSubmitting = ref(false);
const checkinSummaryMonthCount = ref(0);

const PREVIEW_FILE_COUNT = 3;
const PREVIEW_PURCHASED_COUNT = 3;

const parseCheckinListResponse = (res) => {
	if (Array.isArray(res?.list)) return res.list;
	if (Array.isArray(res?.data?.list)) return res.data.list;
	return [];
};

const buildMonthCheckinDates = (list, year, month) => {
	const dates = [];
	list.forEach((checkin) => {
		if (!checkin?.checkinDate) return;
		const date = new Date(checkin.checkinDate);
		if (Number.isNaN(date.getTime())) return;
		if (date.getFullYear() === year && date.getMonth() + 1 === month) {
			dates.push(
				`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
			);
		}
	});
	return dates;
};

const checkinDaysInMonth = computed(() => {
	const lastDay = new Date(checkinCalendarYear.value, checkinCalendarMonth.value, 0);
	return lastDay.getDate();
});

const checkinStartDayOfWeek = computed(() => {
	const date = new Date(checkinCalendarYear.value, checkinCalendarMonth.value - 1, 1);
	return date.getDay();
});

const checkinDayList = computed(() => Array.from({ length: checkinDaysInMonth.value }, (_, index) => index + 1));

const checkinEmptyDaySlots = computed(() => Array.from({ length: checkinStartDayOfWeek.value }, (_, index) => index));

const checkinCalendarCurrentMonthCheckins = computed(() => checkinCalendarDates.value.length);

const checkinIsToday = (day) => {
	const today = new Date();
	return (
		checkinCalendarYear.value === today.getFullYear() &&
		checkinCalendarMonth.value === today.getMonth() + 1 &&
		day === today.getDate()
	);
};

const checkinIsCheckedIn = (day) => {
	const dateStr = `${checkinCalendarYear.value}-${String(checkinCalendarMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	return checkinCalendarDates.value.includes(dateStr);
};

const checkinIsPast = (day) => {
	const today = new Date();
	const date = new Date(checkinCalendarYear.value, checkinCalendarMonth.value - 1, day);
	return date < today && !checkinIsToday(day);
};

const checkinIsFuture = (day) => {
	const today = new Date();
	const date = new Date(checkinCalendarYear.value, checkinCalendarMonth.value - 1, day);
	return date > today;
};

const showCheckinCalendarModalHandler = async (data) => {
	checkinCalendarYear.value = data.year || new Date().getFullYear();
	checkinCalendarMonth.value = data.month || new Date().getMonth() + 1;
	checkinCalendarDates.value = Array.isArray(data.checkinDates) ? [...data.checkinDates] : [];
	showCheckinCalendarModal.value = true;
	await Promise.all([
		fetchCheckinCalendarData(),
		fetchCheckinRule(),
		fetchCheckinPointsConfig(),
		fetchTodayCheckinStatus(),
	]);
};

const hideCheckinCalendarModal = () => {
	showCheckinCalendarModal.value = false;
};

const checkinHandleDayClick = (day) => {
	if (checkinIsFuture(day)) {
		return;
	}
};

const fetchCheckinCalendarData = async () => {
	try {
		const res = await getCheckinList({ page: 1, pageSize: 100 });
		checkinCalendarDates.value = buildMonthCheckinDates(
			parseCheckinListResponse(res),
			checkinCalendarYear.value,
			checkinCalendarMonth.value,
		);
	} catch (error) {
		console.error('获取打卡记录失败:', error);
	}
};

const fetchCheckinRule = async () => {
	try {
		const res = await getCheckinMinutes();
		const minutes = Number(res?.minutes ?? res?.requiredMinutes ?? res?.data?.minutes ?? 15);
		if (Number.isFinite(minutes) && minutes > 0) {
			checkinRequiredMinutes.value = minutes;
		}
	} catch (error) {
		console.warn('获取打卡规则失败，使用默认规则:', error);
	}
};

const fetchCheckinPointsConfig = async () => {
	try {
		const res = await getPointsConfig();
		const reward = Number(res?.checkinReward ?? res?.data?.checkinReward ?? 50);
		if (Number.isFinite(reward) && reward >= 0) {
			checkinRewardPoints.value = reward;
		}
	} catch (error) {
		console.warn('获取积分配置失败，使用默认值:', error);
	}
};

const fetchTodayCheckinStatus = async () => {
	try {
		const res = await getTodayCheckinStatus();
		checkinHasCheckedInToday.value = Boolean(res?.hasCheckedIn ?? res?.data?.hasCheckedIn ?? false);
	} catch (error) {
		console.warn('获取今日打卡状态失败:', error);
		checkinHasCheckedInToday.value = false;
	}
};

const refreshCheckinSummary = async () => {
	if (!userStore.isLoggedIn) {
		checkinSummaryMonthCount.value = 0;
		return;
	}
	try {
		const res = await getCheckinList({ page: 1, pageSize: 100 });
		const now = new Date();
		checkinSummaryMonthCount.value = buildMonthCheckinDates(
			parseCheckinListResponse(res),
			now.getFullYear(),
			now.getMonth() + 1,
		).length;
	} catch (error) {
		console.warn('获取打卡概览失败:', error);
		checkinSummaryMonthCount.value = 0;
	}
};

const openCheckinCalendarFromSummary = async () => {
	const now = new Date();
	await showCheckinCalendarModalHandler({
		year: now.getFullYear(),
		month: now.getMonth() + 1,
		checkinDates: [],
	});
};

const handleCheckin = async () => {
	if (checkinHasCheckedInToday.value || checkinSubmitting.value) {
		return;
	}
	if (!userStore.isLoggedIn) {
		uni.showToast({ title: '请先登录', icon: 'none' });
		return;
	}

	const userId = userStore.userInfo?.id;
	const onlineDuration = getDailyOnlineSeconds(userId);
	const currentMinutes = Math.floor(onlineDuration / 60);
	const requiredMinutes = checkinRequiredMinutes.value;

	if (currentMinutes < requiredMinutes) {
		uni.showToast({
			title: `学习时长不足，需要${requiredMinutes}分钟，当前${currentMinutes}分钟`,
			icon: 'none',
			duration: 2000,
		});
		return;
	}

	checkinSubmitting.value = true;
	try {
		const res = await checkin({
			studyDuration: onlineDuration,
			questionCount: 0,
		});

		checkinHasCheckedInToday.value = true;
		await fetchCheckinCalendarData();
		await refreshCheckinSummary();

		const pointsEarned = Number(res?.pointsEarned || 0);
		uni.showToast({
			title: pointsEarned > 0 ? `打卡成功，+${pointsEarned}积分` : '打卡成功',
			icon: 'success',
		});
	} catch (error) {
		uni.showToast({
			title: error?.message || '打卡失败',
			icon: 'none',
		});
	} finally {
		checkinSubmitting.value = false;
	}
};

const handleGoPointsMall = () => {
	hideCheckinCalendarModal();
	setTimeout(() => {
		uni.navigateTo({
			url: '/pages/sub-pages/points-mall/index',
		});
	}, 50);
};

const currentBank = ref(null);
const paperList = ref([]);
const chapterList = ref([]);
const recommendedCourses = ref([]);
const currentSubject = ref({ id: null, name: '请选择题库' });

/** scroll-view 下拉刷新动画（与页面级 enablePullDownRefresh 无关） */
const refresherTriggered = ref(false);
/** 章节 ID 列表签名一致时，下拉可只刷新答题统计，避免 N 次章节全量题目请求 */
const cachedBankQuestionIds = ref([]);
const cachedBankChapterIdsKey = ref('');

const bankShare = () => {
	const bank = currentBank.value;
	return getDefaultShare({
		title: bank?.name ? `我在研刷通学习：${bank.name}` : '研刷通练习｜一起刷题学习',
		path: bank?.id ? buildSharePath('/pages/sub-pages/course-intro/index', { id: bank.id }) : '/pages/bank/index',
	});
};

onShareAppMessage(() => bankShare());
onShareTimeline(() => toTimelineShare(bankShare()));
const subjects = ref([]);
const allSubjects = ref([]); // 所有课程列表（未筛选）
const bankDataLoading = ref(false);
const showCoursePicker = ref(false); // 课程选择弹窗显示状态
const courseSearchKeyword = ref(''); // 课程搜索关键词
const courseFilterType = ref('all'); // 筛选类型：all-全部, purchased-已购买
const navbarMetrics = ref({
	height: 88,
	statusBarHeight: 0,
	contentHeight: 44,
	contentTop: 0,
	rightSafeWidth: 0,
});
const fileReadingRecords = ref({});
const showPurchasedFileCoursesModal = ref(false);
const showCourseFilesModal = ref(false);
const selectedCourseFileKey = ref('');

const allFunctionList = [
	{ name: '模拟考试', icon: '📝', type: 'exam', color: '#3b82f6', requireAuth: true },
	{ name: '随机练习', icon: '🔄', type: 'random', color: '#10b981', requireAuth: true },
	{ name: '练习历史', icon: '⏰', type: 'history', color: '#f59e0b', requireAuth: true },
	{ name: '错题集', icon: '❌', type: 'wrong', color: '#ef4444', requireAuth: true },
	{ name: '我的收藏', icon: '⭐', type: 'favorite', color: '#eab308', requireAuth: true },
	{ name: '我的笔记', icon: '✏️', type: 'notes', color: '#a855f7', requireAuth: true },
	{ name: '刷题排行', icon: '📊', type: 'rank', color: '#6366f1', requireAuth: true },
	{ name: '重置记录', icon: '📚', type: 'reset', color: '#6b7280', requireAuth: true },
];

// 根据权限过滤功能列表
const functionList = computed(() => {
	if (!currentBank.value) {
		return allFunctionList.filter((item) => !item.requireAuth);
	}

	const hasAuth = currentBank.value.hasAuth === true || currentBank.value.hasAuth === 1;

	// 如果有权限，显示所有功能；如果没有权限，只显示不需要权限的功能
	return allFunctionList.filter((item) => {
		if (item.requireAuth) {
			return hasAuth;
		}
		return true;
	});
});

const accuracy = computed(() => {
	if (!currentBank.value || !currentBank.value.totalCount) return 0;
	const done = currentBank.value.doneCount || 0;
	const correct = currentBank.value.correctCount || 0;
	return done > 0 ? Math.round((correct / done) * 100) : 0;
});

const isCurrentFileCourse = computed(() => currentBank.value?.content_type === 'file');

const buildCourseFileList = (course) => {
	if (!course) return [];
	if (Array.isArray(course.files) && course.files.length > 0) {
		return course.files;
	}
	if (course.file_url) {
		return [
			{
				id: null,
				display_name: course.file_display_name || course.name,
				file_name: course.file_name,
				file_url: course.file_url,
				file_type: course.file_type,
				file_size: course.file_size,
			},
		];
	}
	return [];
};

const courseFileList = computed(() => buildCourseFileList(currentBank.value));

const purchasedFileCourses = computed(() =>
	allSubjects.value.filter(
		(subject) => (subject.hasAuth === true || subject.hasAuth === 1) && subject.content_type === 'file',
	),
);

const showPurchasedCoursesExpand = computed(() => purchasedFileCourses.value.length > PREVIEW_PURCHASED_COUNT);

const hiddenPurchasedCoursesCount = computed(() => {
	const total = purchasedFileCourses.value.length;
	if (total <= PREVIEW_PURCHASED_COUNT) return 0;
	return total - PREVIEW_PURCHASED_COUNT;
});

const showCourseFilesExpand = computed(() => courseFileList.value.length > PREVIEW_FILE_COUNT);

const hiddenCourseFilesCount = computed(() => {
	const total = courseFileList.value.length;
	if (total <= PREVIEW_FILE_COUNT) return 0;
	return total - PREVIEW_FILE_COUNT;
});

const previewCourseFiles = computed(() => {
	const files = [...courseFileList.value];
	const activeKey = selectedCourseFileKey.value || (files[0] ? getCourseFileKey(files[0]) : '');
	files.sort((a, b) => {
		if (getCourseFileKey(a) === activeKey) return -1;
		if (getCourseFileKey(b) === activeKey) return 1;
		return 0;
	});
	return files.slice(0, PREVIEW_FILE_COUNT);
});

const previewPurchasedCourses = computed(() => {
	const courses = [...purchasedFileCourses.value];
	const currentId = currentBank.value?.id;
	courses.sort((a, b) => {
		if (a.id === currentId) return -1;
		if (b.id === currentId) return 1;
		return 0;
	});
	return courses.slice(0, PREVIEW_PURCHASED_COUNT);
});

const currentCourseTotalFileSeconds = computed(() =>
	Object.values(fileReadingRecords.value).reduce((sum, record) => sum + (Number(record?.totalSeconds) || 0), 0),
);

const todayStudyDescText = computed(() => {
	if (isCurrentFileCourse.value) {
		return `累计看文件 ${formatFileReadingTime(currentCourseTotalFileSeconds.value)}`;
	}
	const userId = userStore.userInfo?.id;
	const onlineDuration = getDailyOnlineSeconds(userId);
	const minutes = Math.floor(onlineDuration / 60);
	if (minutes > 0) {
		return `今日在线 ${minutes} 分钟`;
	}
	return '今日在线 0 分钟';
});

const getCourseFileKey = (file) => {
	if (file?.id) return String(file.id);
	if (file?.file_url) return String(file.file_url);
	return 'primary';
};

const activeCourseFile = computed(() => {
	const files = courseFileList.value;
	if (!files.length) return null;
	const matched = files.find((file) => getCourseFileKey(file) === selectedCourseFileKey.value);
	return matched || files[0];
});

const resetSelectedCourseFile = () => {
	const files = courseFileList.value;
	selectedCourseFileKey.value = files[0] ? getCourseFileKey(files[0]) : '';
};

const selectCourseFile = (file) => {
	selectedCourseFileKey.value = getCourseFileKey(file);
};

const isActiveCourseFile = (file) => getCourseFileKey(file) === getCourseFileKey(activeCourseFile.value);

const handleSelectPurchasedFileCourse = (course) => {
	showPurchasedFileCoursesModal.value = false;
	if (!course?.id) return;
	if (currentBank.value?.id === course.id) return;
	handleSelectCourse(course);
};

const handleSelectCourseFileFromModal = (file) => {
	showCourseFilesModal.value = false;
	selectCourseFile(file);
};

const getFileRecordKey = (file) => (file?.id ? String(file.id) : 'primary');

const getFileReadingRecordKey = (courseId, fileId) =>
	fileId ? `file_course_reading_${courseId}_${fileId}` : `file_course_reading_${courseId}`;

const emptyReadingRecord = () => ({ currentPage: 0, totalPages: 0, totalSeconds: 0 });

const getFileReadingRecord = (file) => {
	const key = getFileRecordKey(file);
	return fileReadingRecords.value[key] || emptyReadingRecord();
};

const getFileReadingPercent = (file) => {
	const record = getFileReadingRecord(file);
	const total = Number(record.totalPages) || 0;
	const current = Number(record.currentPage) || 0;
	if (!total) return 0;
	return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
};

const formatFileReadingTime = (totalSecondsRaw) => {
	const totalSeconds = Math.max(0, Number(totalSecondsRaw) || 0);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (hours > 0) {
		return `${hours}小时${minutes}分钟`;
	}
	if (minutes > 0) {
		return `${minutes}分钟`;
	}
	return `${totalSeconds}秒`;
};

const getFileReadingRecordFromStorage = (courseId, file) => {
	if (!courseId) return emptyReadingRecord();
	const storageKey = getFileReadingRecordKey(courseId, file?.id);
	return uni.getStorageSync(storageKey) || emptyReadingRecord();
};

const getFileReadingPercentForCourse = (courseId, file) => {
	const record =
		courseId === currentBank.value?.id
			? getFileReadingRecord(file)
			: getFileReadingRecordFromStorage(courseId, file);
	const total = Number(record.totalPages) || 0;
	const current = Number(record.currentPage) || 0;
	if (!total) return 0;
	return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
};

const getFileProgressText = (file) => {
	const record = getFileReadingRecord(file);
	const percent = getFileReadingPercent(file);
	const current = record.currentPage || 0;
	const total = record.totalPages || 0;
	if (percent >= 100) {
		return `100% 已全看 (${current}/${total} 页)`;
	}
	if (percent > 0 || current > 0) {
		return `进行中 (${current}/${total} 页)`;
	}
	return total > 0 ? `未开始 (0/${total} 页)` : '未开始';
};

const getFileActionText = (file) => {
	const percent = getFileReadingPercent(file);
	if (percent >= 100) return '查看文件';
	if (percent > 0) return '继续阅读';
	return '查看文件';
};

const getPurchasedCourseStatus = (course) => {
	const files = buildCourseFileList(course);
	if (!files.length) {
		return { label: '进行中', type: 'progress' };
	}
	let hasProgress = false;
	let allComplete = true;
	files.forEach((file) => {
		const percent = getFileReadingPercentForCourse(course.id, file);
		if (percent > 0) hasProgress = true;
		if (percent < 100) allComplete = false;
	});
	if (allComplete && hasProgress) {
		return { label: '已完成', type: 'done' };
	}
	return { label: '进行中', type: 'progress' };
};

const handleStudyFileClick = (file) => {
	selectCourseFile(file);
	handleViewFileCourse(file);
};

const mergeReadingRecord = (localRecord = {}, remoteRecord = {}) => ({
	currentPage: Math.max(Number(localRecord.currentPage) || 0, Number(remoteRecord.currentPage) || 0),
	totalPages: Math.max(Number(localRecord.totalPages) || 0, Number(remoteRecord.totalPages) || 0),
	totalSeconds: Math.max(Number(localRecord.totalSeconds) || 0, Number(remoteRecord.totalSeconds) || 0),
	updatedAt: Date.now(),
});

const loadFileReadingRecords = async () => {
	const id = currentBank.value?.id || bankStore.currentBankId;
	const files = courseFileList.value;
	if (!id || files.length === 0) {
		fileReadingRecords.value = {};
		return;
	}
	const nextRecords = {};
	try {
		for (const file of files) {
			const recordKey = getFileRecordKey(file);
			const storageKey = getFileReadingRecordKey(id, file.id);
			const localRecord = uni.getStorageSync(storageKey) || {};
			let remoteRecord = {};
			if (uni.getStorageSync('auth_token')) {
				try {
					remoteRecord = await getFileCourseReadingProgress(id, file.id || undefined);
				} catch (e) {
					console.warn('获取文件阅读进度失败，使用本地缓存', e);
				}
			}
			const merged = mergeReadingRecord(localRecord, remoteRecord);
			nextRecords[recordKey] = merged;
			uni.setStorageSync(storageKey, merged);
		}
		fileReadingRecords.value = nextRecords;
	} catch (e) {
		console.warn('读取文件阅读进度失败', e);
		fileReadingRecords.value = {};
	}
};

// 已购买课程数量
const purchasedCoursesCount = computed(() => {
	return allSubjects.value.filter((subject) => subject.hasAuth === true || subject.hasAuth === 1).length;
});

// 筛选后的课程列表
const filteredCourses = computed(() => {
	let courses = allSubjects.value;

	// 按筛选类型过滤
	if (courseFilterType.value === 'purchased') {
		courses = courses.filter((subject) => subject.hasAuth === true || subject.hasAuth === 1);
	}

	// 按搜索关键词过滤
	if (courseSearchKeyword.value && courseSearchKeyword.value.trim()) {
		const keyword = courseSearchKeyword.value.trim().toLowerCase();
		courses = courses.filter((subject) => {
			const name = (subject.name || '').toLowerCase();
			const subjectTag = (subject.subject || '').toLowerCase();
			const category = (subject.category || '').toLowerCase();
			const subCategory = (subject.sub_category || '').toLowerCase();
			return (
				name.includes(keyword) ||
				subjectTag.includes(keyword) ||
				category.includes(keyword) ||
				subCategory.includes(keyword)
			);
		});
	}

	return courses;
});

// 处理搜索输入
const handleSearchInput = () => {
	// 搜索逻辑已在 computed 中处理，这里可以添加防抖等优化
};

onMounted(() => {
	initNavbarMetrics();
	refreshCheckinSummary();
	// 先获取题库列表，再获取详情
	fetchSubjectsList().then(() => {
		fetchBankData();
	});
	// 监听题库切换事件
	uni.$on('bank-changed', () => {
		fetchBankData();
	});
	uni.$on('course-auth-changed', () => {
		fetchSubjectsList().then(() => fetchBankData());
	});
	uni.$on('show-checkin-calendar', showCheckinCalendarModalHandler);
});

onUnmounted(() => {
	uni.$off('show-checkin-calendar', showCheckinCalendarModalHandler);
});

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

onShow(() => {
	if (uni.getStorageSync('course_auth_changed')) {
		uni.removeStorageSync('course_auth_changed');
		fetchSubjectsList().then(() => fetchBankData());
		return;
	}
	if (isCurrentFileCourse.value) {
		refreshCurrentFileCourseState();
	}
});

const onRefresh = async () => {
	refresherTriggered.value = true;
	try {
		await fetchSubjectsList();
		await fetchBankData({ pullLight: true });
		await refreshCheckinSummary();
	} catch (e) {
		console.error('下拉刷新失败:', e);
	} finally {
		refresherTriggered.value = false;
	}
};

// 获取课程列表
const fetchSubjectsList = async () => {
	try {
		const subjectsList = await getAllCourses();
		if (subjectsList && subjectsList.length > 0) {
			const processedList = subjectsList.map((subject) => ({
				...subject,
				hasAuth:
					subject.hasAuth === true ||
					subject.hasAuth === 1 ||
					subject.is_free === 1 ||
					Number(subject.price) === 0 ||
					!subject.price,
			}));

			// 保存所有课程（未筛选）
			allSubjects.value = processedList.map((subject) => ({
				id: subject.id,
				name: subject.name,
				subject: subject.subject || '',
				category: subject.category || '',
				sub_category: subject.sub_category || '',
				sort: subject.sort || 0,
				hasAuth: subject.hasAuth,
				price: subject.price || 0,
				is_free: subject.is_free || 0,
				content_type: subject.content_type || 'normal',
				file_url: subject.file_url || '',
				file_name: subject.file_name || '',
				file_type: subject.file_type || '',
				allow_source_file: subject.allow_source_file,
				expireTime: subject.expireTime || null,
				active: subject.id === (bankStore.currentBankId || processedList[0].id),
			}));

			// 如果没有当前题库，选择第一个可用课程
			if (!bankStore.currentBankId) {
				if (allSubjects.value.length > 0) {
					bankStore.setCurrentBank(allSubjects.value[0].id);
					currentSubject.value = {
						id: allSubjects.value[0].id,
						name: allSubjects.value[0].name,
					};
				}
			} else {
				// 设置当前选中的题库
				const current = allSubjects.value.find((s) => s.id === bankStore.currentBankId);
				if (current) {
					currentSubject.value = {
						id: current.id,
						name: current.name,
					};
				} else {
					// 如果当前题库不存在，选择第一个可用课程
					if (allSubjects.value.length > 0) {
						bankStore.setCurrentBank(allSubjects.value[0].id);
						currentSubject.value = {
							id: allSubjects.value[0].id,
							name: allSubjects.value[0].name,
						};
					}
				}
			}
		} else {
			// 没有题库数据
			allSubjects.value = [];
			currentSubject.value = { id: null, name: '暂无题库' };
		}
	} catch (error) {
		console.error('获取题库列表失败:', error);
		allSubjects.value = [];
		currentSubject.value = { id: null, name: '加载失败' };
	}
};

const refreshBankAnswerStats = async (allQuestionIds) => {
	if (!allQuestionIds?.length) {
		return;
	}
	try {
		const token = uni.getStorageSync('auth_token');
		if (!token) {
			return;
		}
		const answerRecordsMap = new Map();
		const questionIdBatches = [];
		const batchSizeForRecords = 100;

		for (let i = 0; i < allQuestionIds.length; i += batchSizeForRecords) {
			questionIdBatches.push(allQuestionIds.slice(i, i + batchSizeForRecords));
		}

		const recordPromises = questionIdBatches.map(async (questionIds) => {
			try {
				const records = await getAnswerRecords({
					questionIds,
				});
				return records || [];
			} catch (error) {
				console.error('获取答题记录失败:', error);
				return [];
			}
		});

		const allRecords = await Promise.all(recordPromises);
		allRecords.flat().forEach((record) => {
			if (record.question_id) {
				answerRecordsMap.set(record.question_id, record);
			}
		});

		let doneCount = 0;
		let correctCount = 0;

		answerRecordsMap.forEach((record) => {
			const hasValidAnswer =
				(record.user_option && Array.isArray(record.user_option) && record.user_option.length > 0) ||
				(record.text_answer && record.text_answer.trim() !== '') ||
				(record.image_answer && record.image_answer.trim() !== '');

			if (hasValidAnswer) {
				doneCount++;
				if (record.is_correct === 1 || record.is_correct === true) {
					correctCount++;
				}
			}
		});

		if (currentBank.value) {
			currentBank.value.doneCount = doneCount;
			currentBank.value.correctCount = correctCount;
		}
	} catch (error) {
		console.error('统计答题记录失败:', error);
	}
};

const fetchBankData = async (options = {}) => {
	const pullLight = options.pullLight === true;

	if (!bankStore.currentBankId) {
		// 如果没有当前题库，先获取题库列表
		await fetchSubjectsList();
		if (!bankStore.currentBankId) {
			return;
		}
	}

	if (!pullLight) {
		bankDataLoading.value = true;
	}
	try {
		// 获取课程详情
		const bankDetail = await getCourseDetail(bankStore.currentBankId);

		// 确保 hasAuth 是布尔值
		const hasAuth = bankDetail.hasAuth === true || bankDetail.hasAuth === 1;
		console.log('课程权限检查:', {
			courseId: bankStore.currentBankId,
			courseName: bankDetail.name,
			hasAuth: bankDetail.hasAuth,
			hasAuthType: typeof bankDetail.hasAuth,
			hasAuthValue: hasAuth,
			price: bankDetail.price,
			is_free: bankDetail.is_free,
		});

		// 处理题库基本信息
		currentBank.value = {
			id: bankDetail.id,
			name: bankDetail.name,
			cover_img: bankDetail.cover_img,
			price: bankDetail.price || 0,
			is_free: bankDetail.is_free || 0,
			content_type: bankDetail.content_type || 'normal',
			file_url: bankDetail.file_url || '',
			file_name: bankDetail.file_name || '',
			file_type: bankDetail.file_type || '',
			files: Array.isArray(bankDetail.files) ? bankDetail.files : [],
			allow_source_file: bankDetail.allow_source_file,
			student_count: bankDetail.student_count || 0,
			hasAuth: hasAuth,
			expireTime: bankDetail.expireTime || null, // 课程到期时间
			// 统计数据（需要从用户答题记录中获取，暂时设为0）
			totalCount: 0, // 总题数，需要统计所有章节的题目数
			doneCount: 0, // 已做题数
			correctCount: 0, // 正确题数
		};

		// 处理章节数据
		paperList.value = [];
		chapterList.value = [];

		if (bankDetail.content_type === 'file') {
			recommendedCourses.value = [];
			currentBank.value.files = Array.isArray(bankDetail.files) ? bankDetail.files : [];
			await loadFileReadingRecords();
			return;
		}

		// 下拉刷新：章节结构未变时只拉详情 + 答题统计 + 推荐，跳过「每章节全量题目」接口
		if (pullLight && bankDetail.chapters && Array.isArray(bankDetail.chapters) && bankDetail.chapters.length > 0) {
			const chapterMetas = bankDetail.chapters;
			const sortedIds = [...chapterMetas].map((c) => c.id).sort((a, b) => a - b);
			const newKey = `${bankStore.currentBankId}:${sortedIds.join(',')}`;
			if (
				newKey === cachedBankChapterIdsKey.value &&
				cachedBankQuestionIds.value.length > 0 &&
				chapterList.value.length > 0
			) {
				const prevMap = new Map(chapterList.value.map((c) => [c.id, c]));
				const shapeOk = chapterMetas.every((c) => prevMap.has(c.id));
				if (shapeOk) {
					let totalQuestionCount = 0;
					const merged = chapterMetas.map((ch) => {
						const prev = prevMap.get(ch.id);
						const qc = prev?.questionCount || 0;
						totalQuestionCount += qc;
						const augmented = { ...ch, questionCount: qc };
						return {
							id: ch.id,
							name: ch.name,
							type: ch.type || 'chapter',
							is_free: ch.is_free || 0,
							sort: ch.sort || 0,
							questionCount: qc,
							progress: prev?.progress || 0,
							status: getChapterStatus(augmented, hasAuth, bankDetail.price, bankDetail.is_free),
						};
					});
					currentBank.value.totalCount = totalQuestionCount;
					currentBank.value.doneCount = 0;
					currentBank.value.correctCount = 0;
					chapterList.value = merged.sort((a, b) => (a.sort || 0) - (b.sort || 0));
					await refreshBankAnswerStats([...cachedBankQuestionIds.value]);
					try {
						const recommendations = await getCourseRecommendations(bankStore.currentBankId);
						recommendedCourses.value = (recommendations || []).map((course) => ({
							...course,
							expireTime: course.expireTime || null,
						}));
					} catch (error) {
						console.error('获取相关推荐失败:', error);
						recommendedCourses.value = [];
					}
					return;
				}
			}
		}

		if (bankDetail.chapters && Array.isArray(bankDetail.chapters)) {
			const chapters = [];

			// 并行获取每个章节的题目数量（限制并发，避免请求过多）
			const batchSize = 8; // 每批处理章节数（略增大以缩短总等待）
			let totalQuestionCount = 0;
			const allQuestionIds = []; // 收集所有题目ID

			for (let i = 0; i < bankDetail.chapters.length; i += batchSize) {
				const batch = bankDetail.chapters.slice(i, i + batchSize);
				const chapterPromises = batch.map(async (chapter) => {
					try {
						// 获取章节下的题目列表以获取题目数量
						const questions = await getChapterQuestions(chapter.id);
						const questionCount = questions ? questions.length : 0;
						totalQuestionCount += questionCount;
						// 收集题目ID
						if (questions && Array.isArray(questions)) {
							questions.forEach((q) => {
								if (q.id) {
									allQuestionIds.push(q.id);
								}
							});
						}
						return {
							...chapter,
							questionCount,
							questions: questions || [],
						};
					} catch (error) {
						console.error(`获取章节 ${chapter.id} 题目失败:`, error);
						return {
							...chapter,
							questionCount: 0,
							questions: [],
						};
					}
				});

				const chaptersWithQuestions = await Promise.all(chapterPromises);

				// 分类处理
				chaptersWithQuestions.forEach((chapter) => {
					const chapterData = {
						id: chapter.id,
						name: chapter.name,
						type: chapter.type || 'chapter',
						is_free: chapter.is_free || 0,
						sort: chapter.sort || 0,
						questionCount: chapter.questionCount || 0,
						progress: 0, // 需要从用户答题记录中获取
						status: getChapterStatus(chapter, hasAuth, bankDetail.price, bankDetail.is_free),
					};

					// 所有章节都作为章节练习
					chapters.push(chapterData);
				});
			}

			// 更新总题数
			currentBank.value.totalCount = totalQuestionCount;

			await refreshBankAnswerStats(allQuestionIds);

			const sortedChapterIds = bankDetail.chapters.map((c) => c.id).sort((a, b) => a - b);
			cachedBankChapterIdsKey.value = `${bankStore.currentBankId}:${sortedChapterIds.join(',')}`;
			cachedBankQuestionIds.value = [...allQuestionIds];

			// 按排序字段排列章节
			chapterList.value = chapters.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		}

		// 获取相关推荐
		try {
			const recommendations = await getCourseRecommendations(bankStore.currentBankId);
			// 处理推荐课程，确保包含到期时间信息
			recommendedCourses.value = (recommendations || []).map((course) => ({
				...course,
				expireTime: course.expireTime || null,
			}));
		} catch (error) {
			console.error('获取相关推荐失败:', error);
			recommendedCourses.value = [];
		}
	} catch (error) {
		console.error('获取题库数据失败:', error);

		// 如果是404错误或"不存在"错误，说明题库不存在，尝试获取题库列表并选择第一个
		const isNotFoundError =
			error.message &&
			(error.message.includes('不存在') || error.message.includes('404') || error.message.includes('Not Found'));

		if (isNotFoundError) {
			try {
				const subjectsList = await getAllCourses();
				if (subjectsList && subjectsList.length > 0) {
					// 检查当前题库ID是否在列表中
					const currentExists = subjectsList.some((s) => s.id === bankStore.currentBankId);

					if (!currentExists) {
						// 当前题库不存在，清除并选择第一个
						bankStore.setCurrentBank(subjectsList[0].id);
						currentSubject.value = {
							id: subjectsList[0].id,
							name: subjectsList[0].name,
						};
						// 递归调用，重新获取数据
						return fetchBankData();
					}
				} else {
					// 没有可用题库
					uni.showToast({
						title: '暂无可用题库',
						icon: 'none',
						duration: 2000,
					});
				}
			} catch (listError) {
				console.error('获取题库列表失败:', listError);
				uni.showToast({
					title: '获取题库列表失败',
					icon: 'none',
					duration: 2000,
				});
			}
		} else {
			// 其他错误，显示错误提示
			uni.showToast({
				title: error.message || '获取题库数据失败',
				icon: 'none',
				duration: 2000,
			});
		}

		// 接口失败时，清空数据
		currentBank.value = null;
		paperList.value = [];
		chapterList.value = [];
		cachedBankChapterIdsKey.value = '';
		cachedBankQuestionIds.value = [];
	} finally {
		if (!pullLight) {
			bankDataLoading.value = false;
		}
	}
};

const getChapterStatus = (chapter, hasAuth, coursePrice, isFree) => {
	// 判断是否为付费课程且未购买
	const isPaid = coursePrice > 0 && isFree !== 1;
	// 确保 hasAuth 是布尔值
	const hasPermission = hasAuth === true || hasAuth === 1;

	// 如果是付费课程且用户没有权限，则锁定
	if (isPaid && !hasPermission) {
		return 'locked';
	}

	// 检查进度
	const progress = chapter.progress || 0;
	if (progress >= chapter.questionCount) {
		return 'done';
	}
	return 'progress';
};

const selectSubject = (subject) => {
	if (!subject || !subject.id) {
		uni.showToast({
			title: '题库信息不完整',
			icon: 'none',
		});
		return;
	}
	if (bankStore.currentBankId === subject.id) {
		return;
	}
	currentSubject.value = { id: subject.id, name: subject.name };
	bankStore.setCurrentBank(subject.id);
	fetchBankData();
};

// 处理课程选择
const handleSelectCourse = (subject) => {
	if (!subject || !subject.id) {
		uni.showToast({
			title: '课程信息不完整',
			icon: 'none',
		});
		return;
	}

	// 如果选择的是当前课程，直接关闭弹窗
	if (bankStore.currentBankId === subject.id) {
		showCoursePicker.value = false;
		return;
	}

	// 切换课程
	selectSubject(subject);
	showCoursePicker.value = false;

	// 重置搜索和筛选
	courseSearchKeyword.value = '';
	courseFilterType.value = 'all';

	uni.showToast({
		title: `已切换到：${subject.name}`,
		icon: 'success',
		duration: 1500,
	});
};

// 监听弹窗关闭，重置搜索和筛选
watch(showCoursePicker, (newVal) => {
	if (!newVal) {
		// 弹窗关闭时重置搜索和筛选
		courseSearchKeyword.value = '';
		courseFilterType.value = 'all';
	}
});

watch(
	() => currentBank.value?.id,
	() => {
		resetSelectedCourseFile();
	},
);

watch(
	courseFileList,
	(files) => {
		if (!files.length) {
			selectedCourseFileKey.value = '';
			return;
		}
		const exists = files.some((file) => getCourseFileKey(file) === selectedCourseFileKey.value);
		if (!exists) {
			resetSelectedCourseFile();
		}
	},
	{ deep: true },
);

const openDocumentWithTempFile = (tempFilePath, fileType, done) => {
	const type = (fileType || 'pdf').toLowerCase();
	if (!['pdf', 'doc', 'docx'].includes(type)) {
		uni.showToast({ title: '暂不支持该文件类型预览', icon: 'none' });
		done?.();
		return;
	}
	uni.openDocument({
		filePath: tempFilePath,
		fileType: type,
		showMenu: true,
		success: () => done?.(),
		fail: (err) => {
			console.error('打开文件失败:', err);
			uni.showToast({ title: err.errMsg || '打开失败', icon: 'none' });
			done?.();
		},
	});
};

const normalizeFileUrl = (url) => {
	if (!url) return '';
	if (/^https?:\/\//i.test(url)) return url;
	const base = getApiBaseUrl().replace(/\/+$/, '');
	return String(url).startsWith('/') ? `${base}${url}` : `${base}/${url}`;
};

const getDocumentPreviewUrlForCourse = async (course, fileItem) => {
	if (!course?.id) return '';
	const file = fileItem || buildCourseFileList(course)[0];
	const fileUrl = file?.file_url || course.file_url;
	if (course.allow_source_file !== 0 && fileUrl) {
		return fileUrl;
	}
	const ticketRes = await getCoursePreviewTicket(course.id, file?.id || undefined);
	const previewRes = await getCourseDocumentPreviewUrl(course.id, ticketRes?.ticket, file?.id || undefined);
	return previewRes?.url || previewRes?.fileUrl || '';
};

const showLoginRequiredModal = () => {
	uni.showModal({
		title: '提示',
		content: '查看文件需要先登录，是否前往登录？',
		confirmText: '去登录',
		cancelText: '取消',
		success: (res) => {
			if (res.confirm) {
				uni.navigateTo({
					url: '/pages/login/index',
				});
			}
		},
	});
};

const syncCurrentCourseAuth = (courseDetail) => {
	if (!courseDetail?.id) return false;
	const hasAuth = courseDetail.hasAuth === true || courseDetail.hasAuth === 1;
	if (currentBank.value && currentBank.value.id === courseDetail.id) {
		currentBank.value = {
			...currentBank.value,
			price: courseDetail.price ?? currentBank.value.price,
			is_free: courseDetail.is_free ?? currentBank.value.is_free,
			content_type: courseDetail.content_type || currentBank.value.content_type,
			file_url: courseDetail.file_url ?? currentBank.value.file_url,
			file_name: courseDetail.file_name ?? currentBank.value.file_name,
			file_type: courseDetail.file_type ?? currentBank.value.file_type,
			files: Array.isArray(courseDetail.files) ? courseDetail.files : currentBank.value.files || [],
			allow_source_file: courseDetail.allow_source_file ?? currentBank.value.allow_source_file,
			hasAuth,
			expireTime: courseDetail.expireTime || currentBank.value.expireTime || null,
		};
	}
	allSubjects.value = allSubjects.value.map((subject) =>
		subject.id === courseDetail.id ? { ...subject, hasAuth } : subject,
	);
	return hasAuth;
};

const refreshCurrentFileCourseState = async () => {
	const id = currentBank.value?.id || bankStore.currentBankId;
	if (!id) return false;
	try {
		const courseDetail = await getCourseDetail(id);
		const hasAuth = syncCurrentCourseAuth(courseDetail);
		if ((courseDetail.content_type || currentBank.value?.content_type) === 'file') {
			currentBank.value.files = Array.isArray(courseDetail.files) ? courseDetail.files : currentBank.value.files || [];
			await loadFileReadingRecords();
		}
		return hasAuth;
	} catch (error) {
		console.warn('刷新文件课程状态失败:', error);
		await loadFileReadingRecords();
		return currentBank.value?.hasAuth === true || currentBank.value?.hasAuth === 1;
	}
};

const handleViewFileCourse = async (fileItem) => {
	const course = currentBank.value;
	if (!course || course.content_type !== 'file') return;

	const token = uni.getStorageSync('auth_token');
	if (!token || !userStore.isLoggedIn) {
		showLoginRequiredModal();
		return;
	}

	const isPaid = Number(course.price) > 0 && course.is_free !== 1;
	let hasAuth = course.hasAuth === true || course.hasAuth === 1;
	if (isPaid) {
		uni.showLoading({ title: '校验权限...' });
		try {
			const latestDetail = await getCourseDetail(course.id);
			hasAuth = syncCurrentCourseAuth(latestDetail);
		} catch (error) {
			console.error('刷新课程购买状态失败:', error);
			uni.showToast({ title: '获取购买状态失败，请重试', icon: 'none' });
			return;
		} finally {
			uni.hideLoading();
		}
	}
	if (isPaid && !hasAuth) {
		showCoursePurchaseModal();
		return;
	}

	const latestCourse = currentBank.value || course;
	const courseFiles = buildCourseFileList(latestCourse);
	const targetFile = fileItem || courseFiles[0];
	if (!targetFile) {
		uni.showToast({ title: '暂无课程文件', icon: 'none' });
		return;
	}
	const fileType = String(targetFile?.file_type || latestCourse.file_type || 'pdf').toLowerCase();
	if (fileType === 'pdf') {
		try {
			uni.showLoading({ title: '准备中...' });
			const res = await getCoursePreviewTicket(latestCourse.id, targetFile?.id || undefined);
			const ticket = res?.ticket;
			const resolvedFileId = res?.fileId || targetFile?.id;
			uni.hideLoading();
			if (!ticket) {
				uni.showToast({ title: '获取预览失败', icon: 'none' });
				return;
			}
			uni.setStorageSync('pdf_preview_ticket', ticket);
			const fileQuery = resolvedFileId ? `&fileId=${resolvedFileId}` : '';
			uni.navigateTo({
				url: `/pages/sub-pages/file-preview/index?courseId=${latestCourse.id}${fileQuery}`,
			});
		} catch (error) {
			uni.hideLoading();
			console.error('打开文件预览失败:', error);
			uni.showToast({ title: error?.message || '打开失败', icon: 'none' });
		}
		return;
	}

	let fileUrl = '';
	try {
		uni.showLoading({ title: '准备中...' });
		fileUrl = await getDocumentPreviewUrlForCourse(latestCourse, targetFile);
		uni.hideLoading();
	} catch (error) {
		uni.hideLoading();
		console.error('获取文档预览地址失败:', error);
		uni.showToast({ title: error?.message || '获取预览失败', icon: 'none' });
		return;
	}
	fileUrl = normalizeFileUrl(fileUrl);
	if (!/^https?:\/\//.test(fileUrl)) {
		uni.showToast({ title: '文件地址无效', icon: 'none' });
		return;
	}
	uni.showLoading({ title: '下载中...' });
	uni.downloadFile({
		url: fileUrl,
		success: (downloadRes) => {
			uni.hideLoading();
			if (downloadRes.statusCode !== 200) {
				uni.showToast({ title: '文件下载失败', icon: 'none' });
				return;
			}
			openDocumentWithTempFile(downloadRes.tempFilePath, fileType);
		},
		fail: (err) => {
			uni.hideLoading();
			console.error('文件下载失败:', err);
			uni.showToast({ title: err.errMsg || '下载失败', icon: 'none' });
		},
	});
};

const handleFunction = async (type) => {
	const routeMap = {
		exam: async () => {
			if (!bankStore.currentBankId) {
				uni.showToast({ title: '请先选择题库', icon: 'none' });
				return;
			}
			try {
				uni.showLoading({ title: '加载中...' });
				const examConfigs = await getExamConfigs(bankStore.currentBankId);
				uni.hideLoading();

				// 过滤出启用的考试配置
				const enabledConfigs = examConfigs.filter((config) => config.is_enabled === 1);

				if (enabledConfigs.length === 0) {
					uni.showToast({
						title: '该题库暂无可用考试',
						icon: 'none',
					});
					return;
				}

				// 如果只有一个考试配置，直接跳转
				if (enabledConfigs.length === 1) {
					uni.navigateTo({
						url: `/pages/exam/info?id=${enabledConfigs[0].id}`,
					});
					return;
				}

				// 如果有多个，显示选择列表
				uni.showActionSheet({
					itemList: enabledConfigs.map((config) => config.name),
					success: (res) => {
						const selectedConfig = enabledConfigs[res.tapIndex];
						uni.navigateTo({
							url: `/pages/exam/info?id=${selectedConfig.id}`,
						});
					},
				});
			} catch (error) {
				uni.hideLoading();
				console.error('获取考试配置失败:', error);
				uni.showToast({
					title: error.msg || error.message || '获取考试配置失败',
					icon: 'none',
				});
			}
		},
		random: () => {
			if (!bankStore.currentBankId) {
				uni.showToast({ title: '请先选择题库', icon: 'none' });
				return;
			}
			uni.navigateTo({
				url: `/pages/answer/index?mode=practice&bankId=${bankStore.currentBankId}&type=random`,
			});
		},
		history: () => {
			uni.showToast({ title: '练习历史功能开发中', icon: 'none' });
		},
		wrong: () => {
			uni.navigateTo({
				url: '/pages/sub-pages/wrong/index',
			});
		},
		favorite: () => {
			uni.navigateTo({
				url: '/pages/sub-pages/collection/index',
			});
		},
		rank: () => {
			uni.navigateTo({
				url: '/pages/sub-pages/rank/index',
			});
		},
		pointsMall: () => {
			uni.navigateTo({
				url: '/pages/sub-pages/points-mall/index',
			});
		},
		notes: () => {
			uni.navigateTo({
				url: '/pages/sub-pages/notes/index',
			});
		},
		reset: () => {
			uni.showModal({
				title: '提示',
				content: '确定要重置所有记录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.showToast({ title: '重置成功', icon: 'success' });
					}
				},
			});
		},
	};

	const handler = routeMap[type];
	if (handler) {
		handler();
	}
};

// 获取图片URL（处理相对路径和绝对路径）
const getImageUrl = (url) => {
	if (!url) return '';
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url;
	}
	// 如果是相对路径，可能需要添加基础URL
	return url;
};

const formatExpireTime = (expireTime) => {
	if (!expireTime) return '';
	const date = new Date(expireTime);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hour = String(date.getHours()).padStart(2, '0');
	const minute = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hour}:${minute}`;
};

const handleRecommendClick = async (course) => {
	if (!course || !course.id) {
		uni.showToast({
			title: '课程信息不完整',
			icon: 'none',
		});
		return;
	}

	try {
		// 检查是否付费课程
		const price = Number(course.price) || 0;
		const hasPackageFree = Number(course.is_vip_free) === 1;
		const isPaid = price > 0 && !hasPackageFree;

		if (isPaid && userStore.isLoggedIn) {
			// 检查实际权限
			try {
				const courseDetail = await getCourseDetail(course.id);
				if (!courseDetail.hasAuth) {
					// 付费且未购买，跳转到课程介绍页面
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
		} else if (isPaid && !userStore.isLoggedIn) {
			// 未登录且付费课程，跳转到介绍页面
			uni.navigateTo({
				url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
			});
			return;
		}

		// 文件类型课程（PDF/Word）始终进课程介绍页，不进练习页
		try {
			const courseDetail = await getCourseDetail(course.id);
			if (courseDetail && courseDetail.content_type === 'file') {
				uni.navigateTo({
					url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
				});
				return;
			}
		} catch (e) {
			console.error('获取课程类型失败:', e);
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

const handleChapterClick = (chapter) => {
	// 检查章节是否锁定（付费且未购买）
	if (chapter.status === 'locked') {
		showCoursePurchaseModal();
		return;
	}

	uni.navigateTo({
		url: `/pages/answer/index?mode=practice&chapterId=${chapter.id}&bankId=${bankStore.currentBankId}`,
	});
};

const showCoursePurchaseModal = () => {
	uni.showModal({
		title: '提示',
		content: '该课程未购买，是否前往课程详情页？',
		confirmText: '前往详情',
		cancelText: '取消',
		success: (res) => {
			if (res.confirm) {
				// 跳转到课程介绍页面
				uni.navigateTo({
					url: `/pages/sub-pages/course-intro/index?id=${bankStore.currentBankId}`,
				});
			}
		},
	});
};

const showPaymentModal = () => {
	uni.showModal({
		title: '提示',
		content: '该内容需要付费，是否前往购买？',
		confirmText: '去购买',
		success: (res) => {
			if (res.confirm) {
				uni.navigateTo({
					url: '/pages/user/index?tab=payment',
				});
			}
		},
	});
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.bank-page {
	min-height: 100vh;
	background: $bg-secondary;
	@include flex(column, flex-start, stretch, 0);
	padding-bottom: $space-24;
	box-sizing: border-box;
	overflow-x: hidden;
	width: 100%;
	font-family: $font-family-base;
}

.bank-nav-placeholder {
	width: 100%;
	flex-shrink: 0;
}

.bank-header {
	@include glassmorphism(0.9);
	padding: $space-3 $space-8;
	position: sticky;
	top: 0;
	z-index: $z-sticky - 20;
	box-shadow: $shadow-md;
	width: 100%;
	box-sizing: border-box;
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);
	transition: box-shadow $transition-base;
	overflow: hidden;

	&:hover {
		box-shadow: $shadow-lg;
	}
}

.header-content {
	display: flex;
	align-items: center;
	width: 100%;
	min-height: 88rpx;
	box-sizing: border-box;
	position: relative;
	z-index: 2;
}

.header-selector {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: $space-4;
	cursor: pointer;
	flex: 1;
	width: 100%;
	min-width: 0;
	min-height: 88rpx;
	box-sizing: border-box;
	padding: $space-3 $space-4;
	border-radius: $radius-md;
	transition: all $transition-fast;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	&:active {
		transform: scale(0.98);
		background: rgba(255, 255, 255, 0.15);
	}
}

.selector-text {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	height: 56rpx;
}

.selector-text-inner {
	@include text(md, bold, primary);
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	line-height: 1.2;
}

.switch-course-btn {
	flex-shrink: 0;
	align-self: center;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0;
	padding: 0 20rpx;
	height: 56rpx;
	border-radius: 999rpx;
	border: 1rpx solid rgba(99, 121, 154, 0.18);
	background: #f4f7fb;
	box-shadow: 0 6rpx 14rpx rgba(68, 88, 120, 0.08);
}

.switch-course-btn-text {
	font-size: 24rpx;
	font-weight: 600;
	color: #5f6f8a;
	line-height: 1;
}

.switch-course-btn:active {
	transform: scale(0.96);
	background: #edf2f8;
}

.subject-dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: $bg-primary;
	box-shadow: $shadow-xl;
	border-radius: 0 0 $radius-2xl $radius-2xl;
	overflow: hidden;
	animation: slideDown $transition-base;
	width: 100%;
	box-sizing: border-box;
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.dropdown-item {
	padding: $space-8;
	@include flex(row, space-between, center, 0);
	border-bottom: 1rpx solid $color-neutral-200;
	cursor: pointer;

	&:last-child {
		border-bottom: none;
	}

	&.active {
		background: rgba($color-primary, 0.1);
		color: $color-primary;
	}

	&:active {
		background: $color-neutral-100;
	}
}

.dropdown-empty {
	padding: $space-12;
	text-align: center;
}

.empty-text {
	@include text(sm, normal, tertiary);
}

.dropdown-text {
	@include text(md, normal, primary);
}

.dropdown-check {
	@include text(md, bold, primary);
	color: $color-primary;
}

.page-content {
	flex: 1;
	padding: $space-5 $space-8 $space-8;
	width: 100%;
	box-sizing: border-box;
	animation: fadeIn 0.4s ease-out;
}

/* 为卡片添加渐进式加载动画 */
.stats-card,
.function-grid,
.chapter-item,
.recommend-item {
	animation: scaleIn 0.3s ease-out backwards;
}

.chapter-item:nth-child(1),
.recommend-item:nth-child(1) {
	animation-delay: 0.05s;
}

.chapter-item:nth-child(2),
.recommend-item:nth-child(2) {
	animation-delay: 0.1s;
}

.chapter-item:nth-child(3),
.recommend-item:nth-child(3) {
	animation-delay: 0.15s;
}

.chapter-item:nth-child(4),
.recommend-item:nth-child(4) {
	animation-delay: 0.2s;
}

.chapter-item:nth-child(5),
.recommend-item:nth-child(5) {
	animation-delay: 0.25s;
}

/* 统计卡片 - 现代化设计 */
.stats-card {
	@include gradient(135deg, $color-primary, $color-primary-dark);
	color: $text-inverse;
	padding: $space-12;
	border-radius: $radius-2xl;
	margin-bottom: $space-8;
	box-shadow: $shadow-xl;
	width: 100%;
	box-sizing: border-box;
	position: relative;
	overflow: hidden;
	animation: scaleIn 0.4s ease-out;
	transition:
		transform $transition-base,
		box-shadow $transition-base;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
		animation: rotate 20s linear infinite;
		pointer-events: none;
	}

	&:hover {
		transform: translateY(-4rpx);
		box-shadow: $shadow-2xl;
	}
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.stats-left,
.stats-right {
	margin-bottom: $space-8;
	width: 100%;
	box-sizing: border-box;
}

.stats-label {
	display: block;
	@include text(xs, normal, inverse);
	color: rgba(255, 255, 255, 0.8);
	margin-bottom: $space-4;
	width: 100%;
	box-sizing: border-box;
	@include truncate;
}

.stats-value {
	font-size: 72rpx;
	font-weight: $font-weight-bold;
	font-family: $font-family-base;
	line-height: 1;
	width: 100%;
	box-sizing: border-box;
	word-break: break-all;
	color: $text-inverse;
}

.stats-label-small {
	display: block;
	@include text(xs, normal, inverse);
	color: rgba(255, 255, 255, 0.8);
	margin-bottom: $space-2;
	text-align: right;
	width: 100%;
	box-sizing: border-box;
	@include truncate;
}

.stats-value-small {
	@include text(md, medium, inverse);
	text-align: right;
	width: 100%;
	box-sizing: border-box;
	word-break: break-all;
}

.stats-total {
	opacity: 0.7;
	@include text(sm, normal, inverse);
}

.stats-progress {
	width: 100%;
	height: 8rpx;
	background: rgba(255, 255, 255, 0.3);
	border-radius: $radius-sm;
	overflow: hidden;
}

.progress-bar {
	height: 100%;
	background: linear-gradient(90deg, $text-inverse 0%, rgba(255, 255, 255, 0.9) 100%);
	border-radius: $radius-sm;
	transition: width $transition-slow;
	position: relative;
	overflow: hidden;
	box-shadow: 0 2rpx 8rpx rgba(255, 255, 255, 0.3);

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		animation: shimmer 2s infinite;
	}
}

.file-course-section {
	margin-bottom: $space-4;
	display: flex;
	flex-direction: column;
	gap: $space-4;
}

.summary-stats-grid {
	display: flex;
	gap: $space-4;
	margin-bottom: $space-4;
}

.summary-stat-card {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	gap: $space-3;
	padding: $space-5;
	border-radius: $radius-lg;
	background: #fff;
	box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.06);
	box-sizing: border-box;
}

.summary-stat-card--static {
	pointer-events: none;
}

.summary-stat-icon {
	flex-shrink: 0;
	width: 64rpx;
	height: 64rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.summary-stat-icon--checkin {
	background: rgba(23, 195, 162, 0.12);
}

.summary-stat-icon--study {
	background: rgba(47, 109, 240, 0.1);
}

.summary-stat-body {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.summary-stat-title {
	font-size: 28rpx;
	font-weight: 700;
	color: $text-primary;
	line-height: 1.3;
}

.summary-stat-desc {
	font-size: 22rpx;
	color: $text-secondary;
	line-height: 1.4;
}

.summary-stat-link {
	margin-top: 4rpx;
	font-size: 22rpx;
	font-weight: 600;
	color: #17c3a2;
	line-height: 1.4;
}

.section-card {
	padding: $space-5;
	border-radius: $radius-lg;
	background: #fff;
	box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.06);
	box-sizing: border-box;
}

.section-card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: $space-3;
	margin-bottom: $space-4;
}

.section-card-title-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
	flex: 1;
	min-width: 0;
}

.section-card-title {
	font-size: 28rpx;
	font-weight: 700;
	color: $text-primary;
	line-height: 1.3;
}

.section-card-more-btn {
	flex-shrink: 0;
	padding: 4rpx 0 4rpx 12rpx;
}

.section-card-more-text {
	font-size: 24rpx;
	font-weight: 600;
	color: #2f6df0;
	line-height: 1.4;
}

.study-file-row {
	display: flex;
	align-items: center;
	gap: $space-3;
	padding: $space-4;
	margin-bottom: $space-3;
	border-radius: $radius-md;
	background: #f8fafc;
	border: 1rpx solid transparent;
	box-sizing: border-box;
}

.study-file-row:last-of-type {
	margin-bottom: 0;
}

.study-file-row--active {
	background: rgba(47, 109, 240, 0.08);
	border-color: rgba(47, 109, 240, 0.18);
}

.study-file-icon-wrap {
	flex-shrink: 0;
	width: 72rpx;
	height: 72rpx;
	border-radius: 12rpx;
	background: #eef2f8;
	display: flex;
	align-items: center;
	justify-content: center;
}

.study-file-type {
	font-size: 20rpx;
	font-weight: 700;
	color: #64748b;
	line-height: 1;
}

.study-file-main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.study-file-name {
	font-size: 26rpx;
	font-weight: 600;
	color: $text-primary;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.study-file-progress {
	font-size: 22rpx;
	color: $text-secondary;
	line-height: 1.4;
}

.study-file-action {
	flex-shrink: 0;
	font-size: 22rpx;
	font-weight: 600;
	color: #2f6df0;
	line-height: 1.4;
	max-width: 140rpx;
	text-align: right;
}

.study-files-footer {
	margin-top: $space-4;
	padding-top: $space-4;
	border-top: 1rpx solid rgba(15, 23, 42, 0.06);
	text-align: center;
}

.study-files-footer-text {
	font-size: 22rpx;
	color: $text-secondary;
	line-height: 1.5;
}

.purchased-course-row {
	display: flex;
	align-items: center;
	gap: $space-3;
	padding: $space-4 0;
	border-bottom: 1rpx solid rgba(15, 23, 42, 0.06);
}

.purchased-course-row:last-of-type {
	border-bottom: none;
	padding-bottom: 0;
}

.purchased-course-row--active .purchased-course-row-name {
	color: #2f6df0;
	font-weight: 600;
}

.purchased-course-row-icon {
	flex-shrink: 0;
	width: 56rpx;
	height: 56rpx;
	border-radius: 12rpx;
	background: #f3f5f9;
	display: flex;
	align-items: center;
	justify-content: center;
}

.purchased-course-row-name {
	flex: 1;
	min-width: 0;
	font-size: 26rpx;
	color: $text-primary;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.purchased-course-status {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	min-height: 40rpx;
	padding: 0 16rpx;
	border-radius: 999rpx;
}

.purchased-course-status--progress {
	background: rgba(23, 195, 162, 0.12);
}

.purchased-course-status--done {
	background: rgba(47, 109, 240, 0.1);
}

.purchased-course-status-text {
	font-size: 22rpx;
	font-weight: 600;
	line-height: 22rpx;
}

.purchased-course-status--progress .purchased-course-status-text {
	color: #0f9f84;
}

.purchased-course-status--done .purchased-course-status-text {
	color: #2f6df0;
}

.purchased-courses-card .tag-list-more-btn {
	margin-top: $space-4;
}

.tag-list-more-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 18rpx 24rpx;
	border-radius: 12rpx;
	background: #eef2f8;
	border: 1rpx solid #d8dee8;
}

.tag-list-more-btn-text {
	font-size: 26rpx;
	font-weight: 600;
	color: #1a56db;
	line-height: 1.4;
}

.tag-list-more-btn-arrow {
	font-size: 28rpx;
	font-weight: 600;
	color: #1a56db;
	line-height: 1;
}

.file-course-card {
	@include card(lg);
	position: relative;
	min-height: 360rpx;
	padding: 32rpx 32rpx 36rpx;
	margin-bottom: $space-5;
	background: linear-gradient(135deg, #4868a8 0%, #2f6df0 100%);
	color: #fff;
	box-shadow: $shadow-xl;

	&:last-child {
		margin-bottom: 0;
	}
}

.file-course-header {
	@include flex(row, space-between, flex-start, $space-4);
	margin-bottom: 36rpx;
}

.file-course-label,
.file-meta-label {
	display: block;
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.78);
	margin-bottom: 10rpx;
}

.file-course-title {
	display: block;
	max-width: 470rpx;
	font-size: 34rpx;
	font-weight: 700;
	line-height: 1.35;
	color: #fff;
}

.file-course-type {
	flex: 0 0 auto;
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.16);
	font-size: 22rpx;
	font-weight: 700;
	color: #fff;
}

.file-progress-main {
	@include flex(row, space-between, flex-end, $space-4);
	margin-bottom: 24rpx;
}

.file-progress-value {
	font-size: 76rpx;
	font-weight: 800;
	line-height: 1;
	color: #fff;
}

.file-progress-desc {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.86);
}

.file-progress-bar {
	margin-bottom: 32rpx;
}

.file-meta-row {
	@include flex(row, flex-start, center, $space-4);
	padding-right: 260rpx;
}

.file-meta-item {
	min-width: 0;
}

.file-meta-value {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #fff;
}

.file-view-btn {
	position: absolute;
	right: 32rpx;
	bottom: 36rpx;
	height: 76rpx;
	line-height: 76rpx;
	padding: 0 34rpx;
	border-radius: 999rpx;
	background: #fff;
	color: #2f6df0;
	font-size: 28rpx;
	font-weight: 700;
	box-shadow: 0 12rpx 28rpx rgba(20, 45, 100, 0.18);
}

.file-view-btn::after {
	border: none;
}

@media screen and (min-width: 768px) {
	.bank-page {
		align-items: center;
		background: #f4f6fb;
	}

	.bank-header,
	.page-content {
		width: 100%;
		max-width: 520px;
		margin-left: auto;
		margin-right: auto;
	}

	.bank-header {
		padding: 10px 16px;
	}

	.page-content {
		padding: 16px 18px 28px;
	}

	.header-selector {
		min-height: 56px;
		padding: 8px 10px;
	}

	.selector-text {
		height: 40px;
	}

	.selector-text-inner {
		font-size: 22px;
		line-height: 1.2;
	}

	.switch-course-btn {
		height: 40px;
		padding: 0 18px;
	}

	.switch-course-btn-text {
		font-size: 15px;
	}

	.file-course-card {
		min-height: 250px;
		padding: 24px 24px 28px;
		border-radius: 18px;
	}

	.file-course-header {
		margin-bottom: 28px;
	}

	.file-course-label,
	.file-meta-label {
		font-size: 15px;
		margin-bottom: 8px;
	}

	.file-course-title {
		max-width: 360px;
		font-size: 24px;
		line-height: 1.35;
	}

	.file-course-type {
		padding: 6px 12px;
		font-size: 14px;
	}

	.file-progress-main {
		margin-bottom: 18px;
	}

	.file-progress-value {
		font-size: 58px;
	}

	.file-progress-desc {
		font-size: 20px;
	}

	.file-progress-bar {
		margin-bottom: 24px;
	}

	.file-meta-row {
		padding-right: 180px;
	}

	.file-meta-value {
		font-size: 24px;
	}

	.file-view-btn {
		right: 24px;
		bottom: 28px;
		height: 54px;
		line-height: 54px;
		padding: 0 26px;
		font-size: 19px;
	}

	.summary-stats-grid {
		margin-bottom: 14px;
	}
}

@keyframes shimmer {
	0% {
		left: -100%;
	}
	100% {
		left: 100%;
	}
}

/* 8宫格功能 - 现代化设计 */
.function-grid {
	@include grid(4, $space-4);
	@include card(md);
	margin-bottom: $space-8;
	width: 100%;
	box-sizing: border-box;
	padding: $space-6;
}

.grid-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $space-4;
	transition: all $transition-base;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	cursor: pointer;
	padding: $space-4;
	border-radius: $radius-md;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba($color-primary, 0.05) 0%, transparent 100%);
		opacity: 0;
		transition: opacity $transition-base;
		border-radius: $radius-md;
		pointer-events: none;
	}

	&:hover {
		transform: translateY(-4rpx);
		background: rgba($color-primary, 0.03);

		&::before {
			opacity: 1;
		}

		.grid-icon-wrapper {
			transform: scale(1.1) rotate(5deg);
			box-shadow: $shadow-md;
		}
	}

	&:active {
		opacity: 0.85;
		transform: scale(0.95) translateY(0);

		.grid-icon-wrapper {
			transform: scale(1.05) rotate(0deg);
		}
	}
}

.grid-icon-wrapper {
	width: 80rpx;
	height: 80rpx;
	border-radius: $radius-full;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $color-neutral-200;
	transition: all $transition-base;
	box-shadow: $shadow-xs;
	border: 2rpx solid transparent;

	&.icon-0 {
		background: rgba(0, 122, 255, 0.1);
		border-color: rgba(0, 122, 255, 0.2);
	}
	&.icon-1 {
		background: rgba(52, 199, 89, 0.1);
		border-color: rgba(52, 199, 89, 0.2);
	}
	&.icon-2 {
		background: rgba(255, 204, 0, 0.1);
		border-color: rgba(255, 204, 0, 0.2);
	}
	&.icon-3 {
		background: rgba(255, 59, 48, 0.1);
		border-color: rgba(255, 59, 48, 0.2);
	}
	&.icon-4 {
		background: rgba(255, 204, 0, 0.1);
		border-color: rgba(255, 204, 0, 0.2);
	}
	&.icon-5 {
		background: rgba(175, 82, 222, 0.1);
		border-color: rgba(175, 82, 222, 0.2);
	}
	&.icon-6 {
		background: rgba(88, 86, 214, 0.1);
		border-color: rgba(88, 86, 214, 0.2);
	}
	&.icon-7 {
		background: $color-neutral-200;
		border-color: $color-neutral-300;
	}
}

.grid-icon {
	font-size: 40rpx;
}

.grid-text {
	@include text(xs, normal, tertiary);
	text-align: center;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	box-sizing: border-box;
}

/* 相关推荐 - 现代化设计 */
.recommend-section {
	margin-bottom: $space-10;
	width: 100%;
	box-sizing: border-box;
}

.section-title-small {
	@include text(sm, medium, secondary);
	margin-bottom: $space-4;
	display: block;
	width: 100%;
	box-sizing: border-box;
}

.recommend-list {
	@include flex(column, flex-start, stretch, $space-4);
	width: 100%;
	box-sizing: border-box;
}

.recommend-item {
	@include card(md);
	@include flex(row, flex-start, center, 0);
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	padding: $space-6;
	cursor: pointer;
	transition: all $transition-base;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transition: left 0.5s;
		pointer-events: none;
	}

	&:hover {
		transform: translateY(-4rpx);
		box-shadow: $shadow-lg;

		&::after {
			left: 100%;
		}

		.recommend-cover {
			transform: scale(1.05);
		}

		.recommend-arrow {
			transform: translateX(8rpx);
			color: $color-primary;
		}
	}

	&:active {
		transform: scale(0.98) translateY(0);
		box-shadow: $shadow-sm;
	}
}

.recommend-cover {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-md;
	margin-right: $space-6;
	flex-shrink: 0;
	background-color: $bg-tertiary;
	transition: transform $transition-base;
	box-shadow: $shadow-sm;
	object-fit: cover;
}

.recommend-info {
	flex: 1;
	min-width: 0;
	@include flex(column, flex-start, flex-start, $space-2);
}

.recommend-name {
	@include text(md, bold, primary);
	@include truncate;
	width: 100%;
	box-sizing: border-box;
}

.recommend-meta {
	@include flex(row, flex-start, center, $space-3);
	width: 100%;
	box-sizing: border-box;
}

.meta-item {
	@include text(xs, normal, tertiary);
	padding: $space-1 $space-3;
	background-color: $bg-tertiary;
	border-radius: $radius-sm;
}

.recommend-price {
	@include flex(row, flex-start, center, $space-3);
	width: 100%;
	box-sizing: border-box;
}

.price-text {
	@include text(sm, bold, error);
	color: $color-error;
}

.free-text {
	@include text(sm, bold, success);
	color: $color-success;
}

.vip-tag {
	@include text(xs, medium, primary);
	padding: $space-1 $space-3;
	background-color: $color-primary-container;
	border-radius: $radius-sm;
	color: $color-primary;
}

.expire-time-info {
	@include flex(row, flex-start, center, $space-2);
	margin-top: $space-2;
	padding: $space-2 $space-3;
	background-color: rgba($color-warning, 0.1);
	border-radius: $radius-sm;
	border-left: 3rpx solid $color-warning;
}

.expire-label {
	@include text(xs, medium, warning);
	color: $color-warning;
}

.expire-time {
	@include text(xs, medium, warning);
	font-weight: 600;
}

.recommend-arrow {
	font-size: 48rpx;
	color: $color-neutral-300;
	font-weight: 300;
	flex-shrink: 0;
	margin-left: $space-4;
	transition: all $transition-base;
}

.chapter-section {
	margin-bottom: $space-10;
	width: 100%;
	box-sizing: border-box;
}

.section-title {
	@include text(md, bold, primary);
	margin-bottom: $space-6;
	display: block;
	width: 100%;
	box-sizing: border-box;
	position: relative;
	padding-left: $space-6;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 6rpx;
		height: 32rpx;
		background: $color-primary;
		border-radius: $radius-sm;
	}
}

.chapter-list {
	@include flex(column, flex-start, stretch, $space-4);
	width: 100%;
	box-sizing: border-box;
}

.chapter-item {
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

		.chapter-status {
			transform: translateX(4rpx);
		}
	}

	&:active {
		transform: scale(0.98) translateX(0);
		box-shadow: $shadow-sm;
	}

	&.chapter-locked {
		background-color: $bg-tertiary;
		opacity: 0.7;
		cursor: not-allowed;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: repeating-linear-gradient(
				45deg,
				transparent,
				transparent 10rpx,
				rgba(0, 0, 0, 0.03) 10rpx,
				rgba(0, 0, 0, 0.03) 20rpx
			);
			pointer-events: none;
		}

		&:hover {
			transform: none;
			box-shadow: $shadow-md;

			&::before {
				transform: scaleY(0);
			}
		}
	}
}

.chapter-info {
	flex: 1;
	min-width: 0;
}

.chapter-name {
	@include text(md, medium, primary);
	margin-bottom: $space-2;
	display: block;
	@include truncate;
	width: 100%;
	box-sizing: border-box;

	&.text-disabled {
		color: $text-tertiary;
	}
}

.chapter-meta {
	@include text(xs, normal, tertiary);
	@include truncate;
	width: 100%;
	box-sizing: border-box;

	&.text-disabled {
		color: $text-tertiary;
	}
}

.chapter-status {
	@include flex(row, flex-start, center, 0);
	transition: transform $transition-base;

	.status-icon {
		transition: transform $transition-fast;
	}

	.status-progress {
		@include text(sm, medium, secondary);
		padding: $space-2 $space-4;
		background: rgba($color-primary, 0.1);
		border-radius: $radius-full;
		color: $color-primary;
		transition: all $transition-fast;
	}
}

/* 加载和空状态 - 现代化设计 */
.loading-container,
.empty-container {
	padding: $space-20 $space-8;
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

@keyframes scaleIn {
	from {
		transform: scale(0.9);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

// 全局设置样式
.bank-page {
	transition:
		background-color 0.3s,
		color 0.3s;

	&.night-mode {
		background-color: #1a1a1a;
		color: #e0e0e0;

		.chapter-card,
		.course-card {
			background-color: #2a2a2a;
			color: #e0e0e0;
		}

		.chapter-name,
		.course-name {
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

/* 课程选择弹窗 */
.course-picker-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	animation: fadeIn 0.3s ease-out;
	backdrop-filter: blur(4rpx);
	-webkit-backdrop-filter: blur(4rpx);
}

.course-picker-popup {
	width: 100%;
	background-color: $white;
	border-radius: 24rpx 24rpx 0 0;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	animation: slideUp 0.3s ease-out;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.15);
}

.picker-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	padding-bottom: 24rpx;
	border-bottom: 1px solid #f0f0f0;
	flex-shrink: 0;
}

/* 搜索框 */
.picker-search {
	padding: 24rpx 32rpx;
	border-bottom: 1px solid #f0f0f0;
	flex-shrink: 0;
}

.search-box {
	display: flex;
	align-items: center;
	background-color: #f5f5f5;
	border-radius: $radius-lg;
	padding: $space-3 $space-4;
	gap: $space-3;
	transition: all $transition-fast;

	&:focus-within {
		background-color: #fff;
		box-shadow: 0 0 0 2rpx rgba($color-primary, 0.2);
	}
}

.search-icon {
	flex-shrink: 0;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #333;
	background: transparent;
	border: none;
	outline: none;
	min-height: 40rpx;
}

.search-clear {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	border-radius: $radius-full;
	transition: all $transition-fast;
	flex-shrink: 0;

	&:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	&:active {
		transform: scale(0.9);
	}
}

/* 筛选按钮 */
.picker-filter {
	display: flex;
	align-items: center;
	gap: $space-4;
	padding: 24rpx 32rpx;
	border-bottom: 1px solid #f0f0f0;
	flex-shrink: 0;
}

.filter-item {
	display: flex;
	align-items: center;
	gap: $space-2;
	padding: $space-2 $space-6;
	border-radius: $radius-full;
	background-color: #f5f5f5;
	cursor: pointer;
	transition: all $transition-fast;

	&:hover {
		background-color: #e8e8e8;
	}

	&:active {
		transform: scale(0.95);
	}

	&.active {
		background-color: rgba($color-primary, 0.1);
		border: 2rpx solid $color-primary;

		.filter-text {
			color: $color-primary;
			font-weight: $font-weight-medium;
		}

		.filter-count {
			color: $color-primary;
		}
	}
}

.filter-text {
	font-size: 28rpx;
	color: #666;
	transition: color $transition-fast;
}

.filter-count {
	font-size: 24rpx;
	color: #999;
	transition: color $transition-fast;
}

.picker-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333;
}

.picker-close-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	border-radius: $radius-md;
	transition: all $transition-fast;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
		transform: scale(1.1);
	}

	&:active {
		transform: scale(0.95);
	}
}

.picker-content {
	flex: 1;
	height: calc(80vh - 120rpx);
	width: 100%;
}

.picker-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1px solid #f0f0f0;
	cursor: pointer;
	transition: all $transition-fast;

	&:hover {
		background-color: rgba($color-primary, 0.05);
	}

	&:active {
		background-color: rgba($color-primary, 0.1);
	}

	&.active {
		background-color: rgba($color-primary, 0.08);
		border-left: 4rpx solid $color-primary;
	}
}

.item-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: $space-2;
}

.item-name {
	font-size: 32rpx;
	font-weight: 500;
	color: #333;
	@include truncate;
}

.item-meta {
	display: flex;
	align-items: center;
	gap: $space-3;
	flex-wrap: wrap;
}

.meta-tag {
	font-size: 24rpx;
	color: #666;
	padding: $space-1 $space-3;
	background-color: #f5f5f5;
	border-radius: $radius-sm;
}

.meta-price {
	font-size: 24rpx;
	color: $color-error;
	font-weight: 500;
}

.meta-free {
	font-size: 24rpx;
	color: $color-success;
	font-weight: 500;
}

.picker-empty {
	padding: $space-20;
	text-align: center;
}

.empty-text {
	@include text(sm, normal, tertiary);
}

/* 打卡日历弹窗 - 放在根节点避免被遮挡 */
.checkin-calendar-modal-mask {
	position: fixed !important;
	top: 0 !important;
	left: 0 !important;
	right: 0 !important;
	bottom: 0 !important;
	width: 100vw !important;
	height: 100vh !important;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 999999 !important;
	display: flex !important;
	align-items: center;
	justify-content: center;
	animation: fadeIn 0.3s ease;
	backdrop-filter: blur(4rpx);
	padding: 30rpx 20rpx;
	box-sizing: border-box;
	overflow: hidden;
	pointer-events: auto !important;
	isolation: isolate !important;
	transform: translateZ(0) !important;
}

.checkin-calendar-modal {
	width: 85% !important;
	max-width: 650rpx !important;
	background: #fff;
	border-radius: $radius-lg;
	overflow: hidden !important;
	animation: slideUp 0.3s ease;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
	max-height: 75vh;
	display: flex !important;
	flex-direction: column;
	position: relative !important;
	z-index: 1000000 !important;
	margin: 0 auto;
	box-sizing: border-box;
	pointer-events: auto !important;
	contain: none !important;
	isolation: isolate !important;
	transform: translateZ(0) !important;
}

.checkin-modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $space-4 $space-5;
	border-bottom: 1rpx solid #f0f0f0;
	position: relative;
	flex-shrink: 0;
	gap: $space-3;
	width: 100%;
	box-sizing: border-box;
}

.checkin-modal-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	flex-shrink: 0;
	white-space: nowrap;
}

.checkin-modal-stats-text {
	flex: 1;
	min-width: 0;
	font-size: $font-size-sm;
	color: $color-primary;
	font-weight: $font-weight-medium;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.checkin-modal-close {
	flex-shrink: 0;
	width: 56rpx;
	height: 56rpx;
	border-radius: $radius-md;
	transition: all $transition-fast;
	display: flex;
	align-items: center;
	justify-content: center;

	&:active {
		background: rgba(0, 0, 0, 0.05);
		transform: scale(0.95);
	}
}

.checkin-modal-footer {
	padding: $space-4 $space-5 $space-5;
	border-top: 1rpx solid #f0f0f0;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	gap: $space-3;
	position: relative;
	z-index: 10;
	background: #fff;
}

.checkin-btn-hover {
	opacity: 0.85;
	transform: scale(0.98);
}

.checkin-modal-primary-btn {
	width: 100%;
	height: 80rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, $color-primary 0%, #2ecc71 100%);
	color: #fff;
	font-size: $font-size-base;
	font-weight: $font-weight-semibold;
	display: flex;
	align-items: center;
	justify-content: center;

	&--disabled {
		background: #e8edf3;
		color: #999;
	}
}

.checkin-modal-footer-row {
	display: flex;
	gap: $space-3;
}

.checkin-modal-secondary-btn,
.checkin-modal-close-btn {
	flex: 1;
	height: 72rpx;
	border-radius: 999rpx;
	font-size: $font-size-sm;
	font-weight: $font-weight-medium;
	display: flex;
	align-items: center;
	justify-content: center;
}

.checkin-modal-secondary-btn {
	background: rgba($color-primary, 0.1);
	color: $color-primary;
}

.checkin-modal-close-btn {
	background: #f5f7fa;
	color: $text-primary;
}

.checkin-calendar-content {
	width: 100%;
	padding: $space-4 $space-4 $space-6;
	box-sizing: border-box;
	height: 52vh;
	max-height: 680rpx;
}

.checkin-calendar-weekdays {
	display: flex;
	justify-content: space-between;
	margin-bottom: $space-2;
	width: 100%;
	box-sizing: border-box;
	padding: 0;
}

.checkin-weekday {
	flex: 0 0 14.285714%;
	width: 14.285714%;
	min-width: 0;
	max-width: 14.285714%;
	text-align: center;
	font-size: $font-size-xs;
	color: $text-secondary;
	font-weight: $font-weight-medium;
	padding: $space-1;
	box-sizing: border-box;
}

.checkin-calendar-grid {
	display: flex;
	flex-wrap: wrap;
	width: 100%;
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	contain: none !important;
}

.checkin-rule-card {
	margin-bottom: $space-4;
	padding: $space-4;
	border-radius: $radius-lg;
	background: linear-gradient(135deg, rgba($color-primary, 0.08) 0%, rgba(46, 204, 113, 0.08) 100%);
	border: 1rpx solid rgba($color-primary, 0.12);
}

.checkin-rule-title-row {
	display: flex;
	align-items: center;
	gap: $space-2;
	margin-bottom: $space-2;
}

.checkin-rule-icon {
	width: 28rpx;
	height: 28rpx;
	line-height: 28rpx;
	text-align: center;
	border-radius: 50%;
	background: $color-primary;
	color: #fff;
	font-size: 20rpx;
	font-weight: $font-weight-semibold;
	font-family: serif;
}

.checkin-rule-title {
	font-size: $font-size-sm;
	font-weight: $font-weight-semibold;
	color: $text-primary;
}

.checkin-rule-text {
	display: block;
	font-size: $font-size-xs;
	line-height: 1.7;
	color: $text-secondary;
}

.checkin-rule-text--highlight {
	margin-top: $space-1;
	color: $color-primary;
	font-weight: $font-weight-medium;
}

.checkin-calendar-day {
	flex: 0 0 14.285714%;
	width: 14.285714%;
	min-width: 0;
	max-width: 14.285714%;
	height: 76rpx;
	min-height: 76rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 6rpx 2rpx;
	cursor: pointer;
	border-radius: $radius-md;
	transition: all $transition-fast;
	box-sizing: border-box;

	&.empty {
		cursor: default;
	}

	&.today {
		background: rgba($color-primary, 0.1);

		.checkin-day-number {
			color: $color-primary;
			font-weight: $font-weight-semibold;
		}
	}

	&.checked {
		background: rgba(46, 204, 113, 0.1);

		.checkin-day-number {
			color: #2ecc71;
			font-weight: $font-weight-medium;
		}
	}

	&.past {
		.checkin-day-number {
			color: $text-secondary;
		}
	}

	&.future {
		.checkin-day-number {
			color: #ddd;
		}
	}

	&:not(.empty):not(.future):active {
		background: rgba($color-primary, 0.15);
		transform: scale(0.95);
	}
}

.checkin-day-number {
	font-size: $font-size-sm;
	color: $text-primary;
	transition: all $transition-fast;
}

.checkin-check-mark {
	position: absolute;
	top: 2rpx;
	right: 2rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.night-mode {
	.checkin-calendar-modal {
		background: #2a2a2a;
	}

	.checkin-modal-header {
		border-bottom-color: #3a3a3a;
	}

	.checkin-modal-title {
		color: #e0e0e0;
	}

	.checkin-modal-stats-text {
		color: #17c3a2;
	}

	.checkin-modal-close {
		&:active {
			background: rgba(255, 255, 255, 0.1);
		}
	}

	.checkin-weekday {
		color: #999;
	}

	.checkin-calendar-day {
		&.today {
			background: rgba(23, 195, 162, 0.2);

			.checkin-day-number {
				color: #17c3a2;
			}
		}

		&.checked {
			background: rgba(46, 204, 113, 0.2);

			.checkin-day-number {
				color: #2ecc71;
			}
		}

		&.past {
			.checkin-day-number {
				color: #999;
			}
		}

		&.future {
			.checkin-day-number {
				color: #555;
			}
		}
	}

	.checkin-rule-card {
		background: linear-gradient(135deg, rgba(23, 195, 162, 0.14) 0%, rgba(46, 204, 113, 0.12) 100%);
		border-color: rgba(23, 195, 162, 0.22);
	}

	.checkin-rule-title {
		color: #e0e0e0;
	}

	.checkin-rule-text {
		color: #aaa;
	}

	.checkin-rule-text--highlight {
		color: #17c3a2;
	}
}
</style>
