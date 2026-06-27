<template>
	<view class="course-intro-page">
		<!-- 自定义导航栏 -->
		<custom-navbar title="课程介绍" :show-back="true" />

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-state">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 课程信息 -->
		<view v-else-if="courseInfo" class="course-content">
			<!-- 课程头部 -->
			<view class="course-header">
				<image
					v-if="courseInfo.cover_img"
					:src="getImageUrl(courseInfo.cover_img)"
					class="course-cover"
					mode="aspectFill"
				/>
				<view class="course-header-info">
					<text class="course-name">{{ courseInfo.name }}</text>
					<view class="course-meta">
						<text v-if="courseInfo.subject" class="meta-item">{{ courseInfo.subject }}</text>
						<text v-if="courseInfo.school" class="meta-item">{{ courseInfo.school }}</text>
						<text v-if="courseInfo.major" class="meta-item">{{ courseInfo.major }}</text>
					</view>
					<view class="course-price-info">
						<view class="course-price-left">
							<text v-if="courseInfo.price > 0 && payAmount < Number(courseInfo.price)" class="course-price final-price">¥{{ payAmount }}</text>
							<text v-if="courseInfo.price > 0" :class="['course-price', payAmount < Number(courseInfo.price) ? 'origin-price' : '']">
								¥{{ courseInfo.price }}
							</text>
							<text v-else class="course-free">免费</text>
							<text v-if="hasAuth" class="purchased-tag">已购买</text>
							<text v-if="courseInfo.is_free === 1" class="free-tag">免费</text>
							<text v-if="courseValidityText" class="validity-tag" :class="{ owned: hasAuth }">
								{{ courseValidityText }}
							</text>
						</view>
						<button v-if="showAddToCartBtn" class="header-add-cart-btn" @click="handleAddToCart">加入购物车</button>
					</view>
				</view>
			</view>

			<!-- 文件课程：资料列表 + 预览入口 -->
			<view v-if="isFileCourse && courseFileList.length" class="intro-section file-course-tip">
				<text class="section-title">资料列表</text>
				<view class="course-file-list">
					<view
						v-for="file in courseFileList"
						:key="file.id || file.file_url"
						class="course-file-item"
						@click="handleOpenCourseFile(file)"
					>
						<text class="course-file-type">{{ fileTypeLabel(file.file_type) }}</text>
						<text class="course-file-name">{{ getCourseFileDisplayName(file) }}</text>
						<text class="course-file-action">查看 ›</text>
					</view>
				</view>
				<view v-if="hasMultipleCourseFiles" class="form-tip file-list-tip">
					点击上方资料项可分别预览；阅读进度按文件单独记录
				</view>
				<!-- 单文件 PDF 仍展示首页缩略图 -->
				<view v-if="!hasMultipleCourseFiles && isPdfFileType" class="file-preview-thumbs">
					<view v-if="pdfThumbLoading" class="thumb-loading-row">
						<view class="thumb-skeleton" />
					</view>
					<view v-else-if="pdfThumbSrcs.length" class="thumb-list">
						<image
							v-for="(src, idx) in pdfThumbSrcs"
							:key="idx"
							:src="src"
							mode="widthFix"
							class="thumb-img"
							@click="openPdfThumbPreview(idx)"
						/>
					</view>
				</view>
				<view v-if="!hasMultipleCourseFiles" class="preview-actions">
					<button
						v-if="hasAuth && canViewSourceFile"
						class="preview-btn primary"
						:loading="fileOpening"
						@click="handleOpenFile"
					>
						{{ fileOpening ? '打开中...' : '查看完整文件' }}
					</button>
					<button
						v-if="
							(hasAuth || courseInfo.price === 0 || courseInfo.is_free === 1) &&
							(courseInfo.file_type || '').toLowerCase() === 'pdf'
						"
						class="preview-btn secondary"
						:loading="embedLoading"
						@click="handleEmbedPreview"
					>
						{{ embedLoading ? '准备中...' : '点击查看资料详情' }}
					</button>
					<button
						v-else-if="
							isWordFileType &&
							!canViewSourceFile &&
							(hasAuth || courseInfo.price === 0 || courseInfo.is_free === 1)
						"
						class="preview-btn secondary"
						:loading="fileOpening"
						@click="handleDocumentPreview"
					>
						{{ fileOpening ? '打开中...' : '点击查看资料详情' }}
					</button>
					<button
						v-else-if="courseInfo.price > 0 && isPdfFileType"
						class="preview-btn secondary"
						:loading="previewOpening"
						@click="handlePreviewFirst2Pages"
					>
						{{ previewOpening ? '打开中...' : '试读前 3 页' }}
					</button>
					<button
						v-else-if="courseInfo.price > 0 && isPdfFileType"
						class="preview-btn outline"
						:loading="embedLoading"
						@click="handleEmbedPreview"
					>
						{{ embedLoading ? '准备中...' : '小程序内试读' }}
					</button>
					<button
						v-else-if="!hasAuth && canViewSourceFile && (courseInfo.price === 0 || courseInfo.is_free === 1)"
						class="preview-btn primary"
						:loading="fileOpening"
						@click="handleOpenFile"
					>
						{{ fileOpening ? '打开中...' : '查看文件' }}
					</button>
				</view>
			</view>

			<!-- 套餐购买提示 -->
			<view v-if="showPackagePrompt" class="vip-promo-section">
				<view
					v-for="section in availablePackageSections"
					:key="section.id"
					:class="['vip-promo-card', isVipSection(section) ? 'vip-promo-card--vip' : 'vip-promo-card--package']"
					@click="goPackageDetail(section.id)"
				>
					<image
						v-if="isVipSection(section)"
						class="vip-promo-crown"
						src="/static/vip/crown.svg"
						mode="aspectFit"
					/>
					<view class="vip-promo-content">
						<view class="vip-promo-badge-row">
							<text v-if="isVipSection(section)" class="vip-promo-sparkle">✦</text>
							<text v-else class="vip-promo-badge-icon">💰</text>
							<text class="vip-promo-badge">{{ getVipCardBadge(section) }}</text>
						</view>
						<text class="vip-promo-title">{{ getVipCardTitle(section) }}</text>
						<text class="vip-promo-desc">{{ getPackageCardDesc(section) }}</text>
						<view class="vip-promo-footer">
							<view class="vip-promo-price-block">
								<text v-if="getSectionMinPrice(section) > 0" class="vip-promo-price">¥{{ getSectionMinPrice(section) }} 起</text>
								<view class="vip-promo-tag">
									<view class="vip-promo-tag-icon">✓</view>
									<text class="vip-promo-tag-text">超值精品课包</text>
								</view>
							</view>
							<view class="vip-promo-btn">
								<template v-if="isVipSection(section)">
									<text class="vip-promo-btn-sparkle">✦</text>
									<text class="vip-promo-btn-text">立即开通</text>
								</template>
								<text v-else class="vip-promo-btn-text">立即购买 ›</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 优惠券选择 -->
			<view v-if="showCouponPicker" class="coupon-section">
				<view class="coupon-row" @click="openCouponPicker">
					<text class="coupon-label">优惠券</text>
					<view class="coupon-value-wrap">
						<text :class="['coupon-value', selectedCoupon ? 'active' : '']">{{ selectedCouponLabel }}</text>
						<text class="coupon-arrow">›</text>
					</view>
				</view>
				<text v-if="selectedCoupon" class="coupon-save-tip">已优惠 ¥{{ selectedCoupon.amount }}</text>
			</view>

			<!-- 课程介绍 -->
			<view class="intro-section">
				<text class="section-title">课程介绍</text>
				<view v-if="courseInfo.introduction" class="intro-content">
					<rich-text :nodes="courseInfo.introduction"></rich-text>
				</view>
				<view v-else class="empty-intro">
					<text class="empty-text">暂无课程介绍</text>
				</view>
			</view>

			<!-- 激活码区域 -->
			<view v-if="!hasAuth && courseInfo.price > 0" class="activation-section">
				<view class="activation-header">
					<text class="activation-title">使用激活码</text>
					<text class="activation-desc">如果您有激活码，可以在此输入激活</text>
				</view>
				<view class="activation-form">
					<input
						class="activation-input"
						type="text"
						placeholder="请输入激活码"
						v-model="activationCode"
						maxlength="20"
						:disabled="activationLoading"
					/>
					<button class="activation-btn" :disabled="!activationCode || activationLoading" @click="handleActivate">
						{{ activationLoading ? '激活中...' : '立即激活' }}
					</button>
				</view>
			</view>

			<!-- 底部操作栏 -->
			<view class="course-bottom-bar">
				<button class="bottom-action-item" @click="handleGoHome">
					<app-icon name="home" :size="44" color="#111111" />
					<text>首页</text>
				</button>
				<button class="bottom-action-item share-action" open-type="share">
					<app-icon name="share" :size="44" color="#111111" />
					<text>分享</text>
				</button>
				<button v-if="showBuyActions" class="bottom-action-item cart-action" @click="handleGoCart">
					<text class="cart-action-icon">🛒</text>
					<text>购物车</text>
					<view v-if="cartCount > 0" class="cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</view>
				</button>
				<template v-if="showBuyActions">
					<button
						class="bottom-primary-btn"
						:loading="buyLoading"
						:disabled="buyLoading"
						@click="handleBuy"
					>
						{{ buyButtonText }}
					</button>
				</template>
				<button
					v-else
					class="bottom-primary-btn"
					:loading="primaryActionLoading"
					:disabled="isPrimaryActionDisabled"
					@click="handlePrimaryAction"
				>
					{{ primaryActionText }}
				</button>
			</view>
		</view>

		<!-- 错误状态 -->
		<view v-else class="error-state">
			<text class="error-text">加载失败</text>
			<button class="retry-btn" @click="loadCourseInfo">重试</button>
		</view>

		<!-- 优惠券选择弹层 -->
		<view v-if="couponPickerVisible" class="coupon-mask" @click="closeCouponPicker">
			<view class="coupon-panel" @click.stop>
				<view class="coupon-panel-handle" />
				<view class="coupon-panel-header">
					<text class="coupon-panel-title">选择优惠券</text>
					<text class="coupon-panel-close" @click="closeCouponPicker">关闭</text>
				</view>
				<scroll-view scroll-y class="coupon-panel-list">
					<view
						class="coupon-card"
						:class="{ active: tempSelectedCouponId === null }"
						@click="pickTempCoupon(null)"
					>
						<text class="coupon-card-no-use">不使用优惠券</text>
						<view class="coupon-radio" :class="{ checked: tempSelectedCouponId === null }">
							<text v-if="tempSelectedCouponId === null" class="coupon-radio-check">✓</text>
						</view>
					</view>
					<view
						v-for="item in couponOptions"
						:key="item.id"
						class="coupon-card"
						:class="{
							active: tempSelectedCouponId === item.id,
							disabled: !item.usable,
						}"
						@click="pickTempCoupon(item)"
					>
						<view class="coupon-card-body">
							<text class="coupon-card-amount">¥{{ item.amount }}</text>
							<view class="coupon-card-info">
								<text class="coupon-card-desc">{{ item.desc }}</text>
								<text v-if="!item.usable" class="coupon-card-tip">{{ item.disabledReason }}</text>
							</view>
						</view>
						<view
							class="coupon-radio"
							:class="{ checked: tempSelectedCouponId === item.id, disabled: !item.usable }"
						>
							<text v-if="tempSelectedCouponId === item.id && item.usable" class="coupon-radio-check">✓</text>
						</view>
					</view>
					<view v-if="couponOptions.length === 0" class="coupon-empty">暂无优惠券</view>
				</scroll-view>
				<view class="coupon-panel-footer">
					<button class="coupon-confirm-btn" @click="confirmCouponPicker">确定使用</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import {
	getCourseDetail,
	previewRedeemCode,
	redeemCode,
	getCoursePreviewTicket,
	getCourseDocumentPreviewUrl,
	createOrder,
	confirmWechatPayment,
	getMyCoupons,
} from '@/api/index';
import { fetchCoursePdfPageImageSrc } from '@/utils/course-pdf-preview-thumb';
import { useBankStore } from '@/store/bank';
import { useUserStore } from '@/store/user';
import { useCartStore } from '@/store/cart';
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue';
import AppIcon from '@/components/app-icon/app-icon.vue';
import { getApiBaseUrl } from '@/utils/api-base';
import {
	blockVirtualPaymentIfNotReady,
	formatVirtualPaymentFailMessage,
	invokeVirtualPayment,
} from '@/utils/virtual-payment';
import { buildSharePath, getDefaultShare, toTimelineShare } from '@/utils/share';
import { getCourseFileDisplayName, formatCouponThresholdDesc, formatYuanDisplay } from '@/utils/format';
import { applyAutoCouponSelection } from '@/utils/coupon-select';
import { chooseWechatShippingAddress, isPaperExamCourse as isPaperExamCourseType } from '@/utils/wechat-address';

const bankStore = useBankStore();
const userStore = useUserStore();
const cartStore = useCartStore();

const courseId = ref(null);
const courseInfo = ref(null);
const hasAuth = ref(false);
const loading = ref(true);
const activationCode = ref('');
const activationLoading = ref(false);
const fileOpening = ref(false);
const previewOpening = ref(false);
const embedLoading = ref(false);
const buyLoading = ref(false);
const relatedPackageSections = ref([]);
const availableCoupons = ref([]);
const couponOptions = ref([]);
const selectedCouponId = ref(null);
const tempSelectedCouponId = ref(null);
const couponPickerVisible = ref(false);
const couponUserOptOut = ref(false);
/** PDF 课程介绍区：前 3 页预览图本地路径 / URL */
const pdfThumbSrcs = ref([]);
const pdfThumbLoading = ref(false);

const isFileCourse = computed(() => courseInfo.value && courseInfo.value.content_type === 'file');
const isPaperExamCourse = computed(() => isPaperExamCourseType(courseInfo.value));
const courseFileList = computed(() => {
	const course = courseInfo.value;
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
});
const hasMultipleCourseFiles = computed(() => courseFileList.value.length > 1);
const primaryCourseFile = computed(() => courseFileList.value[0] || null);
const normalizedFileType = computed(() =>
	(primaryCourseFile.value?.file_type || courseInfo.value?.file_type || '').toLowerCase(),
);
const isPdfFileType = computed(() => normalizedFileType.value === 'pdf');
const isWordFileType = computed(() => ['doc', 'docx'].includes(normalizedFileType.value));
const fileTypeLabel = (fileType) => {
	const type = String(fileType || '').toLowerCase();
	if (type === 'pdf') return 'PDF';
	if (type === 'doc' || type === 'docx') return 'Word';
	return '文件';
};
const canViewSourceFile = computed(() => {
	const course = courseInfo.value;
	return !!(course && course.allow_source_file !== 0 && course.file_url);
});

const availablePackageSections = computed(() =>
	(relatedPackageSections.value || []).filter((section) => !section.subscribed),
);
const showPackagePrompt = computed(() => !hasAuth.value && availablePackageSections.value.length > 0);
const showCouponPicker = computed(() => {
	const course = courseInfo.value;
	return userStore.isLoggedIn && !hasAuth.value && course && Number(course.price) > 0 && course.is_free !== 1;
});
const showBuyActions = computed(() => showCouponPicker.value);
const showAddToCartBtn = computed(() => {
	const course = courseInfo.value;
	return !hasAuth.value && course && Number(course.price) > 0 && course.is_free !== 1;
});
const cartCount = computed(() => cartStore.count);
const buyButtonText = computed(() => {
	if (!courseInfo.value) return '购买';
	if (buyLoading.value) return '支付中...';
	return '立即购买';
});
const selectedCoupon = computed(
	() => availableCoupons.value.find((item) => item.id === selectedCouponId.value) || null,
);
const payAmount = computed(() => {
	const price = Number(courseInfo.value?.price || 0);
	if (!selectedCoupon.value) return price;
	return Math.max(0, Number((price - Number(selectedCoupon.value.amount || 0)).toFixed(2)));
});
const courseValidityText = computed(() => {
	const course = courseInfo.value;
	if (!course || Number(course.is_free) === 1 || Number(course.price || 0) <= 0) return '';
	if (isPaperExamCourse.value) return '';
	if (hasAuth.value) {
		const expireTime = course.expireTime || course.expire_time;
		if (!expireTime) return '永久有效';
		const diffDays = Math.ceil((new Date(expireTime).getTime() - Date.now()) / 86400000);
		if (!Number.isFinite(diffDays)) return '';
		return diffDays > 0 ? `剩余${diffDays}天` : '已过期';
	}
	if (course.validity_days === null || course.validity_days === undefined) return '永久有效';
	const days = Number(course.validity_days);
	return Number.isFinite(days) && days > 0 ? `有效期${days}天` : '';
});
const selectedCouponLabel = computed(() => {
	if (selectedCoupon.value) {
		return `-¥${selectedCoupon.value.amount}`;
	}
	if (availableCoupons.value.length > 0) {
		return `${availableCoupons.value.length} 张可用`;
	}
	return '暂无可用';
});

const getCourseShare = () => {
	const course = courseInfo.value;
	const title = course?.name ? `推荐课程：${course.name}` : '研刷通课程资料';
	return getDefaultShare({
		title,
		path: buildSharePath('/pages/sub-pages/course-intro/index', {
			id: courseId.value,
		}),
	});
};

onShareAppMessage(() => getCourseShare());
onShareTimeline(() => toTimelineShare(getCourseShare()));

onLoad((options) => {
	if (options.id) {
		courseId.value = parseInt(options.id);
		loadCourseInfo();
	} else {
		uni.showToast({
			title: '参数错误',
			icon: 'none',
		});
		setTimeout(() => {
			uni.navigateBack();
		}, 1500);
	}
});

const loadCourseInfo = async () => {
	try {
		loading.value = true;
		const res = await getCourseDetail(courseId.value);
		courseInfo.value = res;
		hasAuth.value = res.hasAuth || false;
		relatedPackageSections.value = res.relatedPackageSections || [];
		selectedCouponId.value = null;
		await loadAvailableCoupons();
		if (res.content_type === 'file' && !hasMultipleCourseFiles.value) {
			const firstPdf = courseFileList.value.find(
				(file) => String(file.file_type || '').toLowerCase() === 'pdf',
			);
			if (firstPdf) {
				loadPdfIntroThumbnails(firstPdf.id);
			}
		} else {
			pdfThumbSrcs.value = [];
			pdfThumbLoading.value = false;
		}
	} catch (error) {
		console.error('加载课程信息失败:', error);
		pdfThumbSrcs.value = [];
		pdfThumbLoading.value = false;
		uni.showToast({
			title: error.msg || '加载失败',
			icon: 'none',
		});
	} finally {
		loading.value = false;
	}
};

const primaryActionLoading = computed(() => buyLoading.value || embedLoading.value || fileOpening.value);
const isPrimaryActionDisabled = computed(() => primaryActionLoading.value || (isPaperExamCourse.value && hasAuth.value));
const primaryActionText = computed(() => {
	const course = courseInfo.value;
	if (!course) return '立即购买';
	if (!hasAuth.value && Number(course.price) > 0) {
		if (buyLoading.value) return '支付中...';
		return '立即购买';
	}
	if (isPaperExamCourse.value) {
		return hasAuth.value ? '已购买' : '立即购买';
	}
	if (isFileCourse.value) {
		return primaryActionLoading.value ? '打开中...' : '查看资料';
	}
	return hasAuth.value ? '开始学习' : '免费学习';
});

const handleGoHome = () => {
	uni.switchTab({
		url: '/pages/index/index',
	});
};

const handleGoCart = () => {
	uni.navigateTo({ url: '/pages/sub-pages/cart/index' });
};

const handleAddToCart = () => {
	const course = courseInfo.value;
	if (!course) return;
	if (!userStore.isLoggedIn) {
		uni.showToast({ title: '请先登录', icon: 'none' });
		setTimeout(() => uni.navigateTo({ url: '/pages/login/index' }), 800);
		return;
	}
	if (hasAuth.value) {
		uni.showToast({ title: '您已拥有该课程', icon: 'none' });
		return;
	}
	const added = cartStore.addCourse({
		id: course.id,
		name: course.name,
		cover_img: course.cover_img,
		price: course.price,
		content_type: course.content_type,
	});
	if (added) {
		uni.showToast({ title: '已加入购物车', icon: 'success' });
		return;
	}
	uni.showToast({ title: '课程已在购物车中', icon: 'none' });
};

const formatCouponDesc = (item) => formatCouponThresholdDesc(item.minAmount, item.amount);

const loadAvailableCoupons = async () => {
	if (!userStore.isLoggedIn) {
		availableCoupons.value = [];
		couponOptions.value = [];
		return;
	}
	const course = courseInfo.value;
	if (!course || Number(course.price) <= 0 || course.is_free === 1 || hasAuth.value) {
		availableCoupons.value = [];
		couponOptions.value = [];
		return;
	}
	try {
		const list = await getMyCoupons({ status: 'unused' });
		const price = Number(course.price || 0);
		const options = (list || [])
			.filter((item) => item.status === 'unused')
			.map((item) => {
				const minAmount = Number(item.minAmount || 0);
				const usable = price >= minAmount;
				return {
					...item,
					desc: formatCouponDesc(item),
					usable,
					disabledReason: usable ? '' : `还差${formatYuanDisplay(Math.max(0, minAmount - price))}元可用`,
				};
			})
			.sort((a, b) => {
				if (a.usable !== b.usable) {
					return a.usable ? -1 : 1;
				}
				return Number(b.amount) - Number(a.amount);
			});
		couponOptions.value = options;
		availableCoupons.value = options.filter((item) => item.usable);
		applyAutoCouponSelection(selectedCouponId, availableCoupons.value, {
			userOptOutRef: couponUserOptOut,
		});
	} catch (error) {
		console.error('加载优惠券失败:', error);
		availableCoupons.value = [];
		couponOptions.value = [];
	}
};

const openCouponPicker = () => {
	tempSelectedCouponId.value = selectedCouponId.value;
	couponPickerVisible.value = true;
};

const closeCouponPicker = () => {
	couponPickerVisible.value = false;
};

const pickTempCoupon = (item) => {
	if (item && !item.usable) {
		return;
	}
	tempSelectedCouponId.value = item?.id ?? null;
};

const confirmCouponPicker = () => {
	selectedCouponId.value = tempSelectedCouponId.value;
	couponUserOptOut.value = tempSelectedCouponId.value == null;
	closeCouponPicker();
};

const getSectionMinPrice = (section) => {
	if (section?.minPrice != null && Number(section.minPrice) > 0) {
		return Number(section.minPrice);
	}
	const prices = (section?.plans || []).map((plan) => Number(plan.price)).filter((price) => price > 0);
	return prices.length ? Math.min(...prices) : 0;
};

const getPackageCardDesc = (section) => {
	if (section?.coversAllCourses || section?.isVip) {
		return '购买后可浏览本课程及全站全部课程';
	}
	return '购买后可浏览本课程及套餐内全部课程';
};

const isVipSection = (section) => !!(section?.isVip || section?.coversAllCourses);

const getVipCardTitle = (section) => {
	if (isVipSection(section)) return 'VIP会员';
	return section?.name || '精品套餐';
};

const getVipCardBadge = (section) => {
	if (isVipSection(section)) return '品牌最强权益';
	return '套餐更划算';
};

const goPackageDetail = (sectionId) => {
	uni.navigateTo({ url: `/pages/sub-pages/package-detail/index?id=${sectionId}` });
};

const handlePrimaryAction = () => {
	const course = courseInfo.value;
	if (!course) return;
	if (!hasAuth.value && Number(course.price) > 0) {
		handleBuy();
		return;
	}
	if (isPaperExamCourse.value) {
		uni.showToast({ title: '已购买，等待发货', icon: 'none' });
		return;
	}
	if (isFileCourse.value) {
		if (isPdfFileType.value) {
			handleEmbedPreview();
			return;
		}
		if (isWordFileType.value) {
			handleDocumentPreview();
			return;
		}
		if (canViewSourceFile.value) {
			handleOpenFile();
			return;
		}
		uni.showToast({ title: '暂不支持该文件预览', icon: 'none' });
		return;
	}
	handleStart();
};

/** 拉取 PDF 首页缩略图（完整预览页内再逐页加载，避免课程详情首屏超时） */
const loadPdfIntroThumbnails = async (targetFileId) => {
	if (!courseId.value) return;
	pdfThumbLoading.value = true;
	pdfThumbSrcs.value = [];
	try {
		const ticketRes = await getCoursePreviewTicket(courseId.value, targetFileId || undefined);
		const ticket = ticketRes?.ticket;
		if (!ticket) return;
		const cacheVersion =
			courseInfo.value?.updated_at || courseInfo.value?.update_time || courseInfo.value?.file_url || 'course-intro';
		const src = await fetchCoursePdfPageImageSrc(courseId.value, 1, ticket, cacheVersion);
		pdfThumbSrcs.value = src ? [src] : [];
	} catch (e) {
		console.error('加载课程预览缩略图失败', e);
	} finally {
		pdfThumbLoading.value = false;
	}
};

const openPdfThumbPreview = (index) => {
	const urls = pdfThumbSrcs.value.filter(Boolean);
	if (!urls.length) return;
	uni.previewImage({
		current: urls[index] || urls[0],
		urls,
	});
};

const getImageUrl = (url) => {
	if (!url) return '';
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url;
	}
	const baseUrl = getApiBaseUrl();
	const base = baseUrl.replace(/\/+$/, '');
	return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
};

const normalizeFileUrl = (url) => getImageUrl(url);

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

const handleBuy = async () => {
	if (!userStore.isLoggedIn) {
		uni.showToast({
			title: '请先登录',
			icon: 'none',
		});
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/index',
			});
		}, 1500);
		return;
	}

	if (!courseId.value || buyLoading.value) return;

	try {
		buyLoading.value = true;
		const shippingAddress = isPaperExamCourse.value ? await chooseWechatShippingAddress() : null;
		const order = await createOrder({
			course_id: courseId.value,
			...(selectedCouponId.value ? { coupon_id: selectedCouponId.value } : {}),
			...(shippingAddress ? { shipping_address: shippingAddress } : {}),
		});

		if (!order?.payment_params) {
			await userStore.fetchUserInfo();
			await loadCourseInfo();
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
		await loadCourseInfo();
		uni.showToast({ title: '购买成功', icon: 'success' });
	} catch (error) {
		console.error('购买失败:', error);
		const errMsg = formatVirtualPaymentFailMessage(error);
		uni.showToast({
			title: errMsg,
			icon: 'none',
			duration: errMsg.includes('10 分钟') ? 3500 : 2000,
		});
	} finally {
		buyLoading.value = false;
	}
};

const handleStart = () => {
	// 切换到对应题库并跳转
	bankStore.setCurrentBank(courseId.value);
	uni.switchTab({
		url: '/pages/bank/index',
	});
};

const openDocumentWithTempFile = (tempFilePath, fileType, done) => {
	const openTypes = ['pdf', 'doc', 'docx'];
	const type = (fileType || 'pdf').toLowerCase();
	if (!openTypes.includes(type)) {
		uni.showToast({ title: '暂不支持该文件类型预览', icon: 'none' });
		done();
		return;
	}
	uni.openDocument({
		filePath: tempFilePath,
		fileType: type === 'docx' ? 'docx' : type,
		showMenu: true,
		success: () => done(),
		fail: (err) => {
			console.error('打开文档失败', err);
			uni.showToast({ title: err.errMsg || '打开失败', icon: 'none' });
			done();
		},
	});
};

const handleOpenCourseFile = async (file) => {
	if (!file) return;
	const fileType = String(file.file_type || '').toLowerCase();
	if (fileType === 'pdf') {
		await handleEmbedPreview(file.id || undefined);
		return;
	}
	if (['doc', 'docx'].includes(fileType)) {
		await handleDocumentPreview(file);
		return;
	}
	if (courseInfo.value?.allow_source_file !== 0 && file.file_url) {
		handleOpenFile(file);
		return;
	}
	uni.showToast({ title: '暂不支持该文件预览', icon: 'none' });
};

const handleOpenFile = (fileItem) => {
	const course = courseInfo.value;
	const file = fileItem || primaryCourseFile.value;
	const fileUrl = file?.file_url || course?.file_url;
	if (!course || !fileUrl || course.allow_source_file === 0) {
		uni.showToast({ title: '暂无课程文件', icon: 'none' });
		return;
	}
	const fileType = (file?.file_type || course.file_type || 'pdf').toLowerCase();
	fileOpening.value = true;
	uni.downloadFile({
		url: normalizeFileUrl(fileUrl),
		success: (downloadRes) => {
			if (downloadRes.statusCode !== 200) {
				uni.showToast({ title: '文件下载失败', icon: 'none' });
				fileOpening.value = false;
				return;
			}
			openDocumentWithTempFile(downloadRes.tempFilePath, fileType, () => {
				fileOpening.value = false;
			});
		},
		fail: (err) => {
			console.error('下载失败', err);
			uni.showToast({ title: err.errMsg || '下载失败', icon: 'none' });
			fileOpening.value = false;
		},
	});
};

const handleDocumentPreview = async (fileItem) => {
	const course = courseInfo.value;
	if (!course || !courseId.value) return;
	const file = fileItem || primaryCourseFile.value;
	const fileType = String(file?.file_type || normalizedFileType.value || 'docx').toLowerCase();
	if (!['doc', 'docx'].includes(fileType)) {
		uni.showToast({ title: '暂不支持该文件类型预览', icon: 'none' });
		return;
	}

	fileOpening.value = true;
	try {
		let fileUrl = course.allow_source_file !== 0 ? file?.file_url || course.file_url : '';
		if (!fileUrl) {
			const ticketRes = await getCoursePreviewTicket(courseId.value, file?.id || undefined);
			const previewRes = await getCourseDocumentPreviewUrl(
				courseId.value,
				ticketRes?.ticket,
				file?.id || undefined,
			);
			fileUrl = previewRes?.url || previewRes?.fileUrl || '';
		}
		if (!fileUrl) {
			throw new Error('文件地址为空');
		}
		uni.downloadFile({
			url: normalizeFileUrl(fileUrl),
			success: (downloadRes) => {
				if (downloadRes.statusCode !== 200) {
					uni.showToast({ title: '文件下载失败', icon: 'none' });
					fileOpening.value = false;
					return;
				}
				openDocumentWithTempFile(downloadRes.tempFilePath, fileType, () => {
					fileOpening.value = false;
				});
			},
			fail: (err) => {
				console.error('文档预览下载失败', err);
				uni.showToast({ title: err.errMsg || '下载失败', icon: 'none' });
				fileOpening.value = false;
			},
		});
	} catch (error) {
		console.error('打开文档预览失败', error);
		uni.showToast({ title: error?.message || '打开失败', icon: 'none' });
		fileOpening.value = false;
	}
};

/** 小程序内嵌预览（web-view + PDF.js，仅 PDF） */
const handleEmbedPreview = async (targetFileId) => {
	if (!courseId.value || !courseInfo.value) return;
	embedLoading.value = true;
	try {
		const res = await getCoursePreviewTicket(courseId.value, targetFileId || undefined);
		const ticket = res?.ticket;
		const resolvedFileId = res?.fileId || targetFileId;
		if (!ticket) {
			uni.showToast({ title: '获取预览链接失败', icon: 'none' });
			return;
		}
		uni.setStorageSync('pdf_preview_ticket', ticket);
		const fileQuery = resolvedFileId ? `&fileId=${resolvedFileId}` : '';
		uni.navigateTo({
			url: `/pages/sub-pages/file-preview/index?courseId=${courseId.value}${fileQuery}`,
		});
	} catch (e) {
		console.error('内嵌预览失败', e);
		uni.showToast({ title: e?.message || '获取预览失败', icon: 'none' });
	} finally {
		embedLoading.value = false;
	}
};

/** 试读前 3 页（付费未购买时，仅 PDF 支持） */
const handlePreviewFirst2Pages = async () => {
	const course = courseInfo.value;
	const previewUrl = course?.file_preview_url;
	if (!previewUrl) {
		uni.showToast({ title: '暂不支持试读', icon: 'none' });
		return;
	}
	previewOpening.value = true;
	try {
		await handleEmbedPreview();
	} catch (err) {
		console.error('试读打开失败', err);
		uni.showToast({ title: err?.errMsg || err?.message || '试读加载失败', icon: 'none' });
	} finally {
		previewOpening.value = false;
	}
};

const getActivationPreviewText = (preview) => {
	if (preview?.target_type === 'package') {
		const packageName = preview.package_name || preview.package?.name || '套餐/VIP';
		const planName = preview.plan_name || preview.package?.plan?.name || '';
		const days = preview.duration_days || preview.package?.plan?.duration_days;
		return {
			title: '确认激活套餐',
			content: `该激活码将激活「${packageName}${planName ? ` / ${planName}` : ''}」${days ? `，有效期${days}天` : ''}，确认使用吗？`,
		};
	}
	const courseName = preview.course_name || preview.course?.name || '该课程';
	return {
		title: '确认激活课程',
		content: `该激活码将激活「${courseName}」，确认使用吗？`,
	};
};

const handleActivate = async () => {
	if (!activationCode.value.trim()) {
		uni.showToast({
			title: '请输入激活码',
			icon: 'none',
		});
		return;
	}

	// 检查是否登录
	if (!userStore.isLoggedIn) {
		uni.showToast({
			title: '请先登录',
			icon: 'none',
		});
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/index',
			});
		}, 1500);
		return;
	}

	try {
		activationLoading.value = true;
		const code = activationCode.value.trim().toUpperCase();
		const preview = await previewRedeemCode({ code });
		const targetText = getActivationPreviewText(preview);
		const confirmRes = await uni.showModal({
			title: targetText.title,
			content: targetText.content,
			confirmText: '确认激活',
			cancelText: '取消',
		});
		if (!confirmRes.confirm) {
			return;
		}
		const res = await redeemCode({
			code,
		});

		// API 返回格式: { success: true, target_type, course_id? }
		const activatedCourseId = res.course_id || res.data?.course_id;
		const activatedTargetType = res.target_type || res.data?.target_type;

		// 检查激活的课程是否匹配当前课程
		if (activatedCourseId && activatedCourseId === courseId.value) {
			// 激活成功，刷新用户权限信息
			await userStore.fetchUserInfo();

			// 刷新课程信息
			await loadCourseInfo();

			uni.showToast({
				title: '激活成功',
				icon: 'success',
				duration: 1500,
			});

			// 清空输入框
			activationCode.value = '';

			// 延迟跳转到刷题页面
			setTimeout(() => {
				handleStart();
			}, 1500);
		} else if (activatedTargetType === 'package') {
			await userStore.fetchUserInfo();
			await loadCourseInfo();
			uni.setStorageSync('course_auth_changed', Date.now());
			uni.$emit('course-auth-changed', { packageActivated: true });
			uni.showToast({
				title: '套餐激活成功',
				icon: 'success',
				duration: 1500,
			});
			activationCode.value = '';
		} else if (activatedCourseId) {
			// 激活了其他课程
			uni.showToast({
				title: '激活成功，但此激活码不是当前课程的',
				icon: 'success',
				duration: 2000,
			});
			activationCode.value = '';
		} else {
			uni.showToast({
				title: res.message || res.msg || '激活成功',
				icon: 'success',
			});
			activationCode.value = '';
		}
	} catch (error) {
		console.error('激活失败:', error);
		uni.showToast({
			title: error.msg || error.message || '激活失败，请检查激活码',
			icon: 'none',
		});
	} finally {
		activationLoading.value = false;
	}
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.course-intro-page {
	min-height: 100vh;
	background-color: $bg-secondary;
	padding-top: calc(var(--status-bar-height) + 88rpx + $space-8);
}

.loading-state,
.error-state {
	@include flex(column, center, center, $space-8);
	min-height: 60vh;
}

.loading-text,
.error-text {
	@include text(md, normal, secondary);
}

.retry-btn {
	@include button-primary;
	margin-top: $space-4;
}

.course-content {
	padding: $space-8;
	padding-top: $space-12;
	padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.course-header {
	@include card(md);
	@include flex(row, flex-start, flex-start, $space-6);
	padding: $space-8;
	margin-bottom: $space-8;
}

.course-cover {
	width: 200rpx;
	height: 200rpx;
	border-radius: $radius-lg;
	flex-shrink: 0;
}

.course-header-info {
	flex: 1;
	min-width: 0;
}

.course-name {
	@include text(lg, bold, primary);
	display: block;
	margin-bottom: $space-4;
	@include truncate;
}

.course-meta {
	@include flex(row, flex-start, center, $space-4);
	flex-wrap: wrap;
	margin-bottom: $space-4;
}

.meta-item {
	@include text(sm, normal, secondary);
	padding: $space-1 $space-3;
	background-color: rgba($color-primary, 0.1);
	border-radius: $radius-sm;
	color: $color-primary;
}

.course-price-info {
	@include flex(row, space-between, center, $space-4);
	width: 100%;
}

.course-price-left {
	@include flex(row, flex-start, center, $space-4);
	flex-wrap: wrap;
	flex: 1;
	min-width: 0;
}

.header-add-cart-btn {
	flex-shrink: 0;
	height: 56rpx;
	line-height: 56rpx;
	padding: 0 24rpx;
	margin: 0;
	border-radius: 999rpx;
	background: #fff1f2;
	color: #ef4444;
	font-size: 24rpx;
	font-weight: 600;
	border: 2rpx solid #fecdd3;
}

.header-add-cart-btn::after {
	border: none;
}

.header-add-cart-btn:active {
	opacity: 0.88;
}

.course-price {
	@include text(xl, bold, error);
}

.course-price.final-price {
	color: $color-error;
}

.course-price.origin-price {
	@include text(md, normal, tertiary);
	text-decoration: line-through;
	color: $text-tertiary;
	font-weight: normal;
}

.vip-promo-section {
	display: flex;
	flex-direction: column;
	gap: $space-6;
	margin-bottom: $space-8;
}

.vip-promo-card {
	position: relative;
	padding: 28rpx 28rpx 24rpx;
	border-radius: 24rpx;
	overflow: hidden;
}

.vip-promo-card--package {
	background:
		radial-gradient(circle at 20% 15%, rgba(255, 255, 255, 0.55) 0%, transparent 42%),
		linear-gradient(145deg, #edf7fb 0%, #e4f2f8 52%, #dceef6 100%);
	box-shadow: 0 10rpx 28rpx rgba(30, 84, 126, 0.08);
}

.vip-promo-card--vip {
	padding: 32rpx 28rpx 28rpx;
	border-radius: 28rpx;
	background:
		linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, transparent 42%),
		radial-gradient(ellipse 85% 65% at 22% 12%, rgba(255, 255, 255, 0.16) 0%, transparent 58%),
		linear-gradient(155deg, #3d4349 0%, #2a2e33 36%, #1c1f23 72%, #16181b 100%);
	border: 1rpx solid rgba(255, 255, 255, 0.12);
	box-shadow:
		0 16rpx 40rpx rgba(0, 0, 0, 0.32),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.14);
}

.vip-promo-crown {
	position: absolute;
	top: 8rpx;
	right: 12rpx;
	width: 168rpx;
	height: 136rpx;
	opacity: 0.96;
	pointer-events: none;
}

.vip-promo-content {
	position: relative;
	z-index: 1;
}

.vip-promo-badge-row {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 6rpx 16rpx 6rpx 12rpx;
	margin-bottom: 16rpx;
	border-radius: 999rpx;
}

.vip-promo-card--package .vip-promo-badge-row {
	background: rgba(120, 144, 160, 0.16);
}

.vip-promo-card--vip .vip-promo-badge-row {
	padding: 8rpx 18rpx 8rpx 14rpx;
	margin-bottom: 20rpx;
	background: rgba(255, 255, 255, 0.12);
	border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.vip-promo-badge-icon {
	font-size: 24rpx;
	line-height: 1;
}

.vip-promo-sparkle {
	font-size: 20rpx;
	line-height: 1;
	color: rgba(255, 255, 255, 0.92);
}

.vip-promo-badge {
	font-size: 22rpx;
	font-weight: 500;
	line-height: 1.2;
}

.vip-promo-card--package .vip-promo-badge {
	color: #5f7382;
}

.vip-promo-card--vip .vip-promo-badge {
	color: rgba(255, 255, 255, 0.88);
}

.vip-promo-title {
	display: block;
	font-weight: 700;
	line-height: 1.3;
	margin-bottom: 10rpx;
}

.vip-promo-card--package .vip-promo-title {
	font-size: 40rpx;
	color: #111827;
}

.vip-promo-card--vip .vip-promo-title {
	font-size: 44rpx;
	color: #ffffff;
	line-height: 1.25;
	margin-bottom: 12rpx;
	letter-spacing: 1rpx;
}

.vip-promo-desc {
	display: block;
	font-size: 26rpx;
	line-height: 1.55;
	margin-bottom: 24rpx;
}

.vip-promo-card--package .vip-promo-desc {
	color: #374151;
}

.vip-promo-card--vip .vip-promo-desc {
	max-width: 68%;
	color: rgba(255, 255, 255, 0.72);
	margin-bottom: 28rpx;
}

.vip-promo-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.vip-promo-price-block {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
	flex: 1;
	min-width: 0;
}

.vip-promo-price {
	font-weight: 700;
	line-height: 1.2;
}

.vip-promo-card--package .vip-promo-price {
	font-size: 34rpx;
	color: #1e547e;
}

.vip-promo-card--vip .vip-promo-price {
	font-size: 36rpx;
	color: #ffffff;
}

.vip-promo-tag {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
}

.vip-promo-card--vip .vip-promo-tag {
	gap: 8rpx;
}

.vip-promo-tag-icon {
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	font-size: 18rpx;
	line-height: 28rpx;
	text-align: center;
	flex-shrink: 0;
}

.vip-promo-card--package .vip-promo-tag-icon {
	background: rgba(120, 144, 160, 0.18);
	color: #6b8494;
}

.vip-promo-card--vip .vip-promo-tag-icon {
	background: rgba(255, 255, 255, 0.14);
	color: rgba(255, 255, 255, 0.72);
}

.vip-promo-tag-text {
	font-size: 22rpx;
	line-height: 1.2;
}

.vip-promo-card--package .vip-promo-tag-text {
	color: #7b909e;
}

.vip-promo-card--vip .vip-promo-tag-text {
	color: rgba(255, 255, 255, 0.55);
}

.vip-promo-btn {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	border-radius: 999rpx;
}

.vip-promo-card--package .vip-promo-btn {
	padding: 14rpx 28rpx;
	background: linear-gradient(180deg, #22c9cd 0%, #17b5b9 100%);
	box-shadow: 0 6rpx 16rpx rgba(23, 181, 185, 0.28);
}

.vip-promo-card--package .vip-promo-btn-text {
	font-size: 26rpx;
	font-weight: 600;
	color: #fff;
	line-height: 1.2;
}

.vip-promo-card--vip .vip-promo-btn {
	padding: 16rpx 32rpx;
	background: linear-gradient(180deg, #f5f7fa 0%, #dce3ea 48%, #c8d0d8 100%);
	box-shadow:
		0 0 0 2rpx rgba(47, 120, 255, 0.32),
		0 8rpx 24rpx rgba(47, 120, 255, 0.42),
		0 2rpx 8rpx rgba(0, 0, 0, 0.18);
}

.vip-promo-btn-sparkle {
	font-size: 22rpx;
	line-height: 1;
	color: #2f78ff;
}

.vip-promo-card--vip .vip-promo-btn-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #2f78ff;
	line-height: 1.2;
}

.vip-promo-card:active {
	opacity: 0.94;
	transform: scale(0.995);
}

.coupon-section {
	@include card(md);
	padding: $space-6 $space-8;
	margin-bottom: $space-8;
}

.coupon-row {
	@include flex(row, space-between, center, $space-4);
}

.coupon-label {
	@include text(md, medium, primary);
}

.coupon-value-wrap {
	@include flex(row, flex-end, center, $space-2);
}

.coupon-value {
	@include text(md, normal, secondary);
}

.coupon-value.active {
	color: $color-error;
	font-weight: 600;
}

.coupon-arrow {
	color: $text-tertiary;
	font-size: 32rpx;
}

.coupon-save-tip {
	display: block;
	margin-top: $space-3;
	@include text(sm, normal, secondary);
	color: $color-error;
}

.coupon-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 1000;
	@include flex(column, flex-end, stretch, 0);
}

.coupon-panel {
	background: $bg-primary;
	border-radius: $radius-xl $radius-xl 0 0;
	max-height: 78vh;
	display: flex;
	flex-direction: column;
}

.coupon-panel-handle {
	width: 64rpx;
	height: 8rpx;
	margin: 16rpx auto 8rpx;
	border-radius: 999rpx;
	background: #d1d5db;
}

.coupon-panel-header {
	@include flex(row, space-between, center, $space-4);
	padding: $space-4 $space-8 $space-6;
}

.coupon-panel-title {
	@include text(lg, bold, primary);
}

.coupon-panel-close {
	@include text(md, normal, secondary);
	padding: 8rpx 0;
}

.coupon-panel-list {
	flex: 1;
	max-height: 52vh;
	padding: 0 $space-8;
	box-sizing: border-box;
}

.coupon-card {
	@include flex(row, space-between, center, $space-4);
	margin-bottom: $space-5;
	padding: 28rpx 32rpx;
	border: 2rpx solid #e5e7eb;
	border-radius: 20rpx;
	background: #fff;
	transition: border-color 0.2s ease, background-color 0.2s ease;
}

.coupon-card.active {
	border-color: $color-primary-dark;
	background: #eff6ff;
}

.coupon-card.disabled {
	opacity: 0.72;
}

.coupon-card-no-use {
	flex: 1;
	@include text(md, medium, primary);
}

.coupon-card-body {
	flex: 1;
	min-width: 0;
	@include flex(row, flex-start, center, $space-5);
}

.coupon-card-amount {
	flex-shrink: 0;
	font-size: 40rpx;
	font-weight: 700;
	line-height: 1;
	color: $color-error;
	min-width: 96rpx;
}

.coupon-card-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.coupon-card-desc {
	@include text(md, medium, primary);
	line-height: 1.4;
}

.coupon-card-tip {
	font-size: 22rpx;
	color: #9ca3af;
	line-height: 1.3;
}

.coupon-radio {
	flex-shrink: 0;
	width: 40rpx;
	height: 40rpx;
	border: 2rpx solid #d1d5db;
	border-radius: 50%;
	@include flex(row, center, center, 0);
	box-sizing: border-box;
	background: #fff;
}

.coupon-radio.checked {
	border-color: $color-primary-dark;
	background: $color-primary-dark;
}

.coupon-radio.disabled {
	border-color: #e5e7eb;
	background: #f9fafb;
}

.coupon-radio-check {
	color: #fff;
	font-size: 24rpx;
	line-height: 1;
	font-weight: 700;
}

.coupon-panel-footer {
	padding: $space-4 $space-8 calc($space-6 + env(safe-area-inset-bottom));
	border-top: 2rpx solid $border-light;
	background: $bg-primary;
}

.coupon-confirm-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 999rpx;
	background: $color-primary-dark;
	color: #fff;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
}

.coupon-confirm-btn::after {
	border: none;
}

.coupon-confirm-btn:active {
	opacity: 0.9;
}

.coupon-empty {
	padding: $space-8 0 $space-12;
	text-align: center;
	@include text(md, normal, tertiary);
}

.course-free {
	@include text(xl, bold, success);
}

.free-tag {
	@include text(xs, medium, inverse);
	padding: $space-1 $space-3;
	background-color: $color-warning;
	border-radius: $radius-sm;
	color: #ffffff;
}

.purchased-tag {
	@include text(xs, medium, success);
	padding: $space-1 $space-3;
	background-color: rgba($color-success, 0.12);
	border: 2rpx solid rgba($color-success, 0.28);
	border-radius: $radius-sm;
	color: $color-success;
}

.validity-tag {
	@include text(xs, medium, warning);
	padding: $space-1 $space-3;
	background-color: rgba($color-warning, 0.12);
	border: 2rpx solid rgba($color-warning, 0.24);
	border-radius: $radius-sm;
	color: #d97706;

	&.owned {
		color: $color-success;
		background-color: rgba($color-success, 0.12);
		border-color: rgba($color-success, 0.28);
	}
}

.expire-time-info {
	@include flex(row, flex-start, center, $space-2);
	margin-top: $space-4;
	padding: $space-3 $space-4;
	background-color: rgba($color-warning, 0.1);
	border-radius: $radius-md;
	border-left: 4rpx solid $color-warning;
}

.expire-label {
	@include text(sm, medium, warning);
	color: $color-warning;
}

.expire-time {
	@include text(sm, medium, warning);
	font-weight: 600;
}

.intro-section {
	@include card(md);
	padding: $space-8;
	margin-bottom: $space-8;

	&.file-course-tip {
		.course-file-list {
			display: flex;
			flex-direction: column;
			gap: $space-3;
			margin-bottom: $space-5;
		}
		.course-file-item {
			display: flex;
			align-items: center;
			gap: $space-3;
			padding: $space-4 $space-5;
			border-radius: $radius-md;
			background: $bg-secondary;
		}
		.course-file-type {
			flex-shrink: 0;
			font-size: $font-size-xs;
			color: $color-primary;
			font-weight: 600;
		}
		.course-file-name {
			flex: 1;
			font-size: $font-size-base;
			color: $text-primary;
		}
		.course-file-action {
			flex-shrink: 0;
			font-size: $font-size-sm;
			color: $text-tertiary;
		}
		.file-list-tip {
			margin-bottom: $space-4;
			font-size: $font-size-xs;
			color: $text-tertiary;
		}
		.file-preview-thumbs {
			margin-bottom: $space-6;
		}
		.thumb-loading-row {
			display: flex;
			flex-direction: column;
			gap: $space-4;
		}
		.thumb-skeleton {
			width: 100%;
			height: 280rpx;
			border-radius: $radius-md;
			background: linear-gradient(90deg, $bg-tertiary 25%, rgba($color-primary, 0.08) 50%, $bg-tertiary 75%);
			background-size: 200% 100%;
			animation: thumb-shimmer 1.2s ease-in-out infinite;
		}
		.thumb-list {
			display: flex;
			flex-direction: column;
			gap: $space-4;
		}
		.thumb-img {
			width: 100%;
			display: block;
			border-radius: $radius-md;
			background-color: $bg-tertiary;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
		}
		.preview-actions {
			margin-top: 0;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			align-items: stretch;
			gap: $space-3;
		}
		.preview-btn {
			flex: 1;
			min-width: 0;
			height: 80rpx;
			line-height: 80rpx;
			border-radius: $radius-lg;
			font-size: 26rpx;
			padding: 0 $space-2;
			box-sizing: border-box;
			&.primary {
				background: linear-gradient(135deg, $color-primary 0%, $color-secondary 100%);
				color: #fff;
			}
			&.secondary {
				background: $bg-tertiary;
				color: $color-primary;
				border: 2rpx solid $color-primary;
			}
			&.outline {
				background: transparent;
				color: $color-primary;
				border: 2rpx solid $color-primary;
			}
		}
	}
}

.section-title {
	@include text(lg, bold, primary);
	display: block;
	margin-bottom: $space-6;
}

.intro-content {
	@include text(md, normal, primary);
	line-height: $line-height-relaxed;

	:deep(rich-text) {
		word-break: break-word;
	}
}

.empty-intro {
	@include flex(column, center, center, 0);
	padding: $space-16 0;
}

.empty-text {
	@include text(md, normal, tertiary);
}

.activation-section {
	@include card(md);
	padding: $space-8;
	margin-bottom: $space-8;
	box-sizing: border-box;
	width: 100%;
	overflow: hidden;
}

.activation-header {
	margin-bottom: $space-6;
}

.activation-title {
	@include text(md, bold, primary);
	display: block;
	margin-bottom: $space-2;
}

.activation-desc {
	@include text(sm, normal, secondary);
	display: block;
}

.activation-form {
	@include flex(column, flex-start, stretch, $space-4);
	width: 100%;
	box-sizing: border-box;
}

.activation-input {
	width: 100%;
	height: 88rpx;
	padding: 0 $space-6;
	background-color: $bg-tertiary;
	border-radius: $radius-lg;
	@include text(md, medium, primary);
	text-align: center;
	letter-spacing: 4rpx;
	border: 2rpx solid transparent;
	transition: all $transition-fast;
	box-sizing: border-box;
	overflow: hidden;
	text-overflow: ellipsis;

	&:focus {
		border-color: $color-primary;
		background-color: $bg-primary;
	}

	&[disabled] {
		background-color: $bg-secondary;
		color: $text-tertiary;
	}
}

.activation-btn {
	@include button-primary;
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	text-align: center;

	&[disabled] {
		background-color: $bg-secondary;
		color: $text-tertiary;
		opacity: 0.6;
	}
}

.course-bottom-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 98;
	display: flex;
	align-items: center;
	gap: 18rpx;
	height: 108rpx;
	padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
	background: #ffffff;
	box-shadow: 0 -8rpx 28rpx rgba(15, 23, 42, 0.1);
	box-sizing: content-box;
}

.bottom-action-item {
	width: 112rpx;
	height: 88rpx;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4rpx;
	background: transparent;
	color: #555555;
	font-size: 22rpx;
	line-height: 1.2;
	border: none;
	position: relative;
}

.cart-action-icon {
	font-size: 36rpx;
	line-height: 1;
}

.cart-badge {
	position: absolute;
	top: 2rpx;
	right: 8rpx;
	min-width: 28rpx;
	height: 28rpx;
	padding: 0 6rpx;
	border-radius: 999rpx;
	background: #ef4444;
	color: #fff;
	font-size: 18rpx;
	line-height: 28rpx;
	text-align: center;
	box-sizing: border-box;
}

.bottom-primary-btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	margin: 0;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #ff3f45 0%, #ff6b70 100%);
	color: #ffffff;
	font-size: 34rpx;
	font-weight: 700;
	letter-spacing: 2rpx;
	box-shadow: 0 10rpx 24rpx rgba(255, 63, 69, 0.24);
}

.bottom-primary-btn[disabled] {
	opacity: 0.72;
}

.bottom-action-item::after,
.bottom-primary-btn::after {
	border: none;
}

@keyframes thumb-shimmer {
	0% {
		background-position: 200% 0;
	}
	100% {
		background-position: -200% 0;
	}
}
</style>
