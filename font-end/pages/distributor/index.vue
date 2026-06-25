<template>
	<view class="distributor-page">
		<view class="distributor-header">
			<text class="header-title">分销中心</text>
		</view>

		<!-- 分销状态卡片 -->
		<view class="status-card" v-if="distributorInfo">
			<view class="status-header">
				<text class="status-label">分销状态</text>
				<text class="status-value" :class="getStatusClass(distributorInfo.status)">
					{{ getStatusText(distributorInfo.status) }}
				</text>
				</view>
				<view class="distributor-code" v-if="!isAppAdmin">
					<text class="code-label">分销商编号：</text>
					<text class="code-value">{{ distributorInfo.distributor_code }}</text>
					<text class="copy-btn" @click="copyCode">复制</text>
				</view>
				<view class="distributor-code" v-else>
					<text class="code-label">当前身份：</text>
					<text class="code-value">小程序超级管理员</text>
				</view>
		</view>

		<!-- 申请分销 -->
		<view class="apply-card" v-if="!distributorInfo">
			<text class="apply-title">成为分销用户</text>
			<text class="apply-desc">分享专属二维码，邀请好友注册购买，即可获得分成收益</text>
			<button class="apply-btn" @click="handleApply">立即申请</button>
		</view>

		<!-- Tab 切换 -->
		<view class="tab-container" v-if="distributorInfo && distributorInfo.status === 1">
			<view class="tab-header">
					<view class="tab-item" :class="{ active: activeTab === 'qr' }" @click="activeTab = 'qr'">
						<text class="tab-text">二维码分享</text>
					</view>
					<view class="tab-item" :class="{ active: activeTab === 'codes' }" @click="activeTab = 'codes'">
						<text class="tab-text">{{ isAppAdmin ? '生成激活码' : '激活码购买' }}</text>
					</view>
			</view>
		</view>

		<!-- 数据统计 -->
		<view class="stats-section" v-if="activeTab === 'qr' && distributorInfo && distributorInfo.status === 1">
			<view class="stats-title">数据统计</view>
			<view class="stats-grid">
				<view class="stat-item">
					<text class="stat-value">{{ statsData.total_earnings || 0 }}</text>
					<text class="stat-label">累计收益（元）</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ statsData.withdrawable_amount || 0 }}</text>
					<text class="stat-label">可提现（元）</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ statsData.subordinate_count || 0 }}</text>
					<text class="stat-label">下级用户</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ statsData.total_orders || 0 }}</text>
					<text class="stat-label">推广订单</text>
				</view>
			</view>
		</view>

		<!-- Tab 内容：二维码分享 -->
		<view v-if="activeTab === 'qr' && distributorInfo && distributorInfo.status === 1">
			<!-- 专属二维码 -->
			<view class="qr-section">
				<view class="qr-title">专属二维码</view>
				<view class="qr-container">
					<image
						v-if="qrCodeUrl"
						:src="qrCodeUrl"
						class="qr-image"
						mode="aspectFit"
						@error="handleImageError"
						@load="handleImageLoad"
					/>
					<view v-else class="qr-loading">
						<text>生成中...</text>
					</view>
				</view>
				<text class="qr-tip">分享二维码给好友，好友扫码注册后将成为您的下级</text>
				<button class="share-btn" open-type="share" @click="handleShareButtonClick">分享二维码</button>
				<button class="regenerate-btn" @click="loadQRCode(true)">重新生成</button>
			</view>

			<!-- 收益记录 -->
			<view class="commission-section">
				<view class="section-title">收益记录</view>
				<view class="commission-list" v-if="commissions && commissions.length > 0">
					<view class="commission-item" v-for="item in commissions" :key="item.order_id">
						<view class="commission-info">
							<text class="commission-amount">+{{ item.commission_amount }}元</text>
							<text class="commission-level">{{ item.level }}级分成</text>
						</view>
						<view class="commission-detail">
							<text class="commission-order">订单：{{ item.order_id }}</text>
							<text class="commission-time">{{ formatTime(item.create_time) }}</text>
						</view>
					</view>
				</view>
				<view class="empty-tip" v-else>
					<text>暂无收益记录</text>
				</view>
			</view>
		</view>

		<!-- Tab 内容：激活码购买 -->
		<view v-if="activeTab === 'codes' && distributorInfo && distributorInfo.status === 1">
			<!-- 激活码统计 -->
			<view class="code-stats-section">
				<view class="stats-title">激活码统计</view>
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-value">{{ codeStats.total_count || 0 }}</text>
							<text class="stat-label">{{ isAppAdmin ? '已生成' : '已购买' }}</text>
					</view>
					<view class="stat-item">
						<text class="stat-value stat-used">{{ codeStats.used_count || 0 }}</text>
						<text class="stat-label">已激活</text>
					</view>
						<view class="stat-item">
							<text class="stat-value stat-pending">{{ codeStats.pending_count || 0 }}</text>
							<text class="stat-label">未激活</text>
						</view>
						<view class="stat-item">
							<text class="stat-value stat-invalid">{{ codeStats.invalid_count || 0 }}</text>
							<text class="stat-label">已作废</text>
						</view>
					</view>
				</view>

			<!-- 购买激活码 -->
				<view class="buy-code-section">
					<view class="section-title">{{ isAppAdmin ? '生成激活码' : '购买激活码' }}</view>
					<view class="buy-code-card">
						<text class="buy-code-desc">
							{{ isAppAdmin ? '管理员可直接生成激活码，不受购买数量限制' : '购买激活码后，可以赠送给下级用户或直接销售' }}
						</text>
						<button class="buy-code-btn" @click="showBuyCodeModal = true">
							{{ isAppAdmin ? '生成激活码' : '购买激活码' }}
						</button>
					</view>
				</view>

			<!-- 激活码列表 -->
			<view class="code-list-section">
				<view class="section-header">
						<text class="section-title">{{ isAppAdmin ? '已生成激活码' : '已购买激活码' }}</text>
					<view class="filter-tabs">
						<text class="filter-tab" :class="{ active: codeFilterStatus === null }" @click="codeFilterStatus = null">
							全部
						</text>
						<text class="filter-tab" :class="{ active: codeFilterStatus === 0 }" @click="codeFilterStatus = 0">
							待用
						</text>
							<text class="filter-tab" :class="{ active: codeFilterStatus === 1 }" @click="codeFilterStatus = 1">
								已用
							</text>
							<text class="filter-tab" :class="{ active: codeFilterStatus === 2 }" @click="codeFilterStatus = 2">
								作废
							</text>
						</view>
					</view>
				<scroll-view class="code-list-scroll" scroll-y @scrolltolower="loadMoreCodes">
					<view v-if="codeListLoading" class="loading-state">
						<text class="loading-text">加载中...</text>
					</view>
					<view v-else-if="codeList.length === 0" class="empty-state">
						<text class="empty-text">暂无激活码</text>
					</view>
					<view v-else>
						<!-- 按批次分组显示 -->
						<view v-for="(batch, batchId) in groupedCodes" :key="batchId" class="code-batch">
							<view class="batch-header" @click="toggleBatch(batchId)">
								<view class="batch-info">
									<text class="batch-id">批次：{{ batchId }}</text>
									<text class="batch-course">{{ batch[0]?.course_name || '-' }}</text>
									<text class="batch-count">共 {{ batch.length }} 个</text>
								</view>
								<text class="batch-toggle">{{ expandedBatches.has(batchId) ? '▼' : '▶' }}</text>
							</view>
							<view v-if="expandedBatches.has(batchId)" class="batch-codes">
								<view
									v-for="code in batch"
										:key="code.id"
										class="code-item"
										:class="{ 'code-used': code.status === 1, 'code-invalid': code.status === 2 }"
									>
									<view class="code-info">
										<view class="code-value-wrapper">
											<text class="code-value">{{ code.code }}</text>
											<view class="code-copy-btn" @click.stop="copyActivationCode(code.code)">
												<app-icon name="copy" :size="20" color="#17c3a2" />
												<text class="copy-text">复制</text>
											</view>
										</view>
										<view class="code-meta">
											<text class="code-status" :class="getCodeStatusClass(code.status)">
												{{ code.status_text }}
											</text>
											<text class="code-time">{{ formatTime(code.create_time) }}</text>
										</view>
									</view>
									<view v-if="code.status === 1 && code.used_by_name" class="code-used-info">
										<text class="used-label">已激活</text>
											<text class="used-user">用户：{{ code.used_by_name }}</text>
											<text class="used-time">{{ formatTime(code.used_time) }}</text>
											<button class="invalidate-code-btn" @click.stop="handleInvalidateCode(code)">禁用并撤销课程</button>
										</view>
									</view>
							</view>
						</view>
					</view>
					<view v-if="hasMoreCodes && !codeListLoading" class="load-more">
						<text class="load-more-text">上拉加载更多</text>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 购买激活码弹窗 -->
		<view class="buy-code-mask" v-if="showBuyCodeModal" @click="showBuyCodeModal = false">
			<view class="buy-code-popup" @click.stop>
				<view class="popup-header">
						<text class="popup-title">{{ isAppAdmin ? '生成激活码' : '购买激活码' }}</text>
					<view class="popup-close" @click="showBuyCodeModal = false">
						<text>✕</text>
					</view>
				</view>
				<view class="popup-content">
					<view v-if="isAppAdmin" class="target-type-tabs">
						<view
							class="target-type-tab"
							:class="{ active: activationTargetType === 'course' }"
							@click="switchActivationTargetType('course')"
						>
							课程
						</view>
						<view
							class="target-type-tab"
							:class="{ active: activationTargetType === 'package' }"
							@click="switchActivationTargetType('package')"
						>
							套餐/VIP
						</view>
					</view>
					<view class="form-item">
						<text class="form-label">{{ activationTargetType === 'package' ? '选择套餐/VIP' : '选择课程' }}</text>
						<input
							v-if="activationTargetType === 'course'"
							class="course-search-input"
							v-model="courseSearchKeyword"
							placeholder="搜索课程名称/分类"
							placeholder-class="course-search-placeholder"
						/>
						<view v-if="selectedActivationTarget" class="selected-course-view">
							<text class="selected-course-text">{{ selectedActivationTargetText }}</text>
						</view>
						<view v-if="activationTargetType === 'course'" class="course-cascade">
							<scroll-view class="cascade-column" scroll-y v-if="!courseSearchKeyword">
								<view
									v-for="(category, index) in primaryCategories"
									:key="category.name"
									class="cascade-item"
									:class="{ active: activePrimaryIndex === index }"
									@click="handlePrimaryCategorySelect(index)"
								>
									<text>{{ category.name }}</text>
								</view>
							</scroll-view>
							<scroll-view class="cascade-column" scroll-y v-if="!courseSearchKeyword">
								<view
									v-for="(subCategory, index) in currentSubCategories"
									:key="subCategory.name"
									class="cascade-item"
									:class="{ active: activeSubIndex === index }"
									@click="handleSubCategorySelect(index)"
								>
									<text>{{ subCategory.name }}</text>
								</view>
							</scroll-view>
							<scroll-view class="cascade-column course-column" scroll-y>
								<view
									v-for="course in visibleCourseOptions"
									:key="course.id"
									class="cascade-item course-option"
									:class="{ active: selectedCourse && selectedCourse.id === course.id }"
									@click="handleCourseSelect(course)"
								>
									<text class="course-option-name">{{ course.name }}</text>
									<text class="course-option-price" v-if="!isAppAdmin">¥{{ course.agent_price || course.price || 0 }}</text>
								</view>
								<view v-if="visibleCourseOptions.length === 0" class="cascade-empty">
									<text>暂无课程</text>
								</view>
							</scroll-view>
						</view>
						<view v-else class="course-cascade package-cascade">
							<scroll-view class="cascade-column package-section-column" scroll-y>
								<view
									v-for="(section, index) in packageSections"
									:key="section.id"
									class="cascade-item"
									:class="{ active: activePackageSectionIndex === index }"
									@click="handlePackageSectionSelect(index)"
								>
									<text>{{ section.isVip ? 'VIP' : '套餐' }} · {{ section.name }}</text>
								</view>
								<view v-if="packageSections.length === 0" class="cascade-empty">
									<text>暂无套餐/VIP</text>
								</view>
							</scroll-view>
							<scroll-view class="cascade-column course-column" scroll-y>
								<view
									v-for="plan in visiblePackagePlans"
									:key="plan.id"
									class="cascade-item course-option"
									:class="{ active: selectedPackagePlan && selectedPackagePlan.id === plan.id }"
									@click="handlePackagePlanSelect(plan)"
								>
									<text class="course-option-name">{{ plan.name }} · {{ plan.durationDays }}天</text>
									<text class="course-option-price">¥{{ plan.price || 0 }}</text>
								</view>
								<view v-if="visiblePackagePlans.length === 0" class="cascade-empty">
									<text>暂无可用计划</text>
								</view>
							</scroll-view>
						</view>
					</view>
					<view class="form-item">
						<text class="form-label">购买数量</text>
						<view class="quantity-control">
							<button class="quantity-btn" @click="decreaseQuantity">-</button>
							<input
								class="quantity-input"
								type="number"
								v-model="buyQuantity"
									:min="1"
									:max="quantityMax"
									@input="handleQuantityInput"
								/>
							<button class="quantity-btn" @click="increaseQuantity">+</button>
						</view>
					</view>
						<view class="form-item" v-if="selectedCourse && !isAppAdmin">
							<text class="form-label">单价</text>
							<text class="form-value">¥{{ selectedCourse.agent_price || selectedCourse.price || 0 }}</text>
						</view>
						<view class="form-item" v-if="!isAppAdmin">
							<text class="form-label">总价</text>
							<text class="form-value total-price">¥{{ totalPrice }}</text>
						</view>
						<view class="form-item" v-else>
							<text class="form-label">生成方式</text>
							<text class="form-value">管理员免费生成</text>
						</view>
					</view>
					<view class="popup-footer">
						<button class="cancel-btn" @click="showBuyCodeModal = false">取消</button>
						<button class="confirm-btn" @click="handleBuyCodes" :disabled="!canBuy">
							{{ isAppAdmin ? '确认生成' : '确认购买' }}
						</button>
					</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import {
	applyDistributor,
	getDistributorInfo,
	generateQRCode,
	getDistributorStats,
		getAllCourses,
		getCourseCategories,
		getPackageSections,
		buyActivationCodes,
		generateAdminActivationCodes,
		invalidateActivationCode,
		getDistributorCodes,
		confirmWechatPayment,
	} from '@/api/index';
import { useUserStore } from '@/store/user';
import { buildSharePath, getDefaultShare, toTimelineShare } from '@/utils/share';
import {
	blockVirtualPaymentIfNotReady,
	formatVirtualPaymentFailMessage,
	invokeVirtualPayment,
} from '@/utils/virtual-payment';

const userStore = useUserStore();
const distributorInfo = ref(null);
const qrCodeUrl = ref('');
const statsData = ref({});
const commissions = ref([]);
const showBuyCodeModal = ref(false);
const courseList = ref([]);
const selectedCourseIndex = ref(-1);
const courseCategoryTree = ref([]);
const courseSearchKeyword = ref('');
const activePrimaryIndex = ref(0);
const activeSubIndex = ref(0);
const activationTargetType = ref('course');
const packageSections = ref([]);
const activePackageSectionIndex = ref(0);
const selectedPackagePlanId = ref(null);
const buyQuantity = ref(1);
const activeTab = ref('qr'); // 'qr' 或 'codes'
const codeList = ref([]);
const codeListLoading = ref(false);
const codePage = ref(1);
const codePageSize = ref(20);
const codeTotal = ref(0);
const codeFilterStatus = ref(null); // null-全部, 0-待用, 1-已用
const expandedBatches = ref(new Set());
const codeStats = ref({
	total_count: 0,
	used_count: 0,
		pending_count: 0,
		invalid_count: 0,
	});

	const isAppAdmin = computed(
		() =>
			!!distributorInfo.value?.is_app_admin ||
			userStore.userInfo?.is_admin === true ||
			userStore.userInfo?.role === 'admin',
	);
	const quantityMax = computed(() => (isAppAdmin.value ? 999999 : 1000));

	const getDistributorShare = () => {
		const distributorCode = distributorInfo.value?.distributor_code || '';
		return getDefaultShare({
			title: '研刷通｜一起刷题学习，兑换课程资料',
			path: buildSharePath('/pages/index/index', {
				distributor_code: distributorCode,
			}),
			imageUrl: qrCodeUrl.value || undefined,
		});
	};

	onShareAppMessage(() => getDistributorShare());
	onShareTimeline(() => toTimelineShare(getDistributorShare()));

onMounted(() => {
	loadDistributorInfo();
	loadCourseList();
	loadPackageSections();
});

// 监听tab切换
	watch(activeTab, (newTab) => {
		if (newTab === 'codes' && distributorInfo.value && distributorInfo.value.status === 1) {
			loadCodeList();
	}
});

// 监听筛选状态变化
watch(codeFilterStatus, () => {
	codePage.value = 1;
	codeList.value = [];
	loadCodeList();
});

// 按批次分组激活码
const groupedCodes = computed(() => {
	const groups = {};
	codeList.value.forEach((code) => {
		const batchId = code.batch_id || 'unknown';
		if (!groups[batchId]) {
			groups[batchId] = [];
		}
		groups[batchId].push(code);
	});
	return groups;
});

const hasMoreCodes = computed(() => {
	return codeList.value.length < codeTotal.value;
});

// 切换批次展开/收起
const toggleBatch = (batchId) => {
	if (expandedBatches.value.has(batchId)) {
		expandedBatches.value.delete(batchId);
	} else {
		expandedBatches.value.add(batchId);
	}
};

// 获取激活码状态样式类
const getCodeStatusClass = (status) => {
	const classMap = {
		0: 'status-pending',
		1: 'status-used',
		2: 'status-invalid',
	};
	return classMap[status] || '';
};

// 加载激活码列表
const loadCodeList = async (loadMore = false) => {
	if (codeListLoading.value) return;

	codeListLoading.value = true;
	try {
		const page = loadMore ? codePage.value + 1 : 1;
		const res = await getDistributorCodes({
			page,
			pageSize: codePageSize.value,
			status: codeFilterStatus.value,
		});

		if (loadMore) {
			codeList.value = [...codeList.value, ...(res.list || [])];
			codePage.value = page;
		} else {
			codeList.value = res.list || [];
			codePage.value = 1;
			// 默认展开第一个批次
			if (codeList.value.length > 0) {
				const firstBatchId = codeList.value[0].batch_id;
				if (firstBatchId) {
					expandedBatches.value.add(firstBatchId);
				}
			}
		}
		codeTotal.value = res.total || 0;

		// 更新统计数据
		if (res.stats) {
			codeStats.value = {
					total_count: res.stats.total_count || 0,
					used_count: res.stats.used_count || 0,
					pending_count: res.stats.pending_count || 0,
					invalid_count: res.stats.invalid_count || 0,
				};
			}
	} catch (error) {
		console.error('加载激活码列表失败:', error);
		uni.showToast({
			title: error.msg || '加载失败',
			icon: 'none',
		});
	} finally {
		codeListLoading.value = false;
	}
};

// 加载更多激活码
const loadMoreCodes = () => {
	if (hasMoreCodes.value && !codeListLoading.value) {
		loadCodeList(true);
	}
};

// 计算属性
const selectedCourse = computed(() => {
	if (selectedCourseIndex.value >= 0 && courseList.value[selectedCourseIndex.value]) {
		return courseList.value[selectedCourseIndex.value];
	}
	return null;
});

const selectedPackageSection = computed(() => packageSections.value[activePackageSectionIndex.value] || null);

const visiblePackagePlans = computed(() => {
	const plans = selectedPackageSection.value?.plans;
	return Array.isArray(plans) ? plans : [];
});

const selectedPackagePlan = computed(() => {
	for (const section of packageSections.value) {
		const plan = (section.plans || []).find((item) => String(item.id) === String(selectedPackagePlanId.value));
		if (plan) {
			return {
				...plan,
				sectionId: section.id,
				sectionName: section.name,
				isVip: !!section.isVip,
			};
		}
	}
	return null;
});

const selectedActivationTarget = computed(() => {
	return activationTargetType.value === 'package' ? selectedPackagePlan.value : selectedCourse.value;
});

const selectedActivationTargetText = computed(() => {
	if (activationTargetType.value === 'package') {
		if (!selectedPackagePlan.value) return '';
		return `${selectedPackagePlan.value.isVip ? 'VIP' : '套餐'} / ${selectedPackagePlan.value.sectionName} / ${selectedPackagePlan.value.name}`;
	}
	if (!selectedCourse.value) return '';
	return `${selectedCourse.value.category || '未分类'} / ${selectedCourse.value.sub_category || '未分组'} / ${selectedCourse.value.name}`;
});

const categoryCourseTree = computed(() => {
	const tree = Array.isArray(courseCategoryTree.value) ? JSON.parse(JSON.stringify(courseCategoryTree.value)) : [];
	const categoryMap = new Map();
	tree.forEach((category) => {
		category.children = Array.isArray(category.children) ? category.children : [];
		category.children.forEach((child) => {
			child.courses = [];
			categoryMap.set(`${category.name}__${child.name}`, child);
		});
	});

	const uncategorized = { name: '未分类', children: [{ name: '未分组', courses: [] }] };
	courseList.value.forEach((course) => {
		const key = `${course.category || ''}__${course.sub_category || ''}`;
		const target = categoryMap.get(key);
		if (target) {
			target.courses.push(course);
		} else {
			uncategorized.children[0].courses.push(course);
		}
	});

	const normalized = tree
		.map((category) => ({
			...category,
			children: category.children.filter((child) => child.courses && child.courses.length > 0),
		}))
		.filter((category) => category.children.length > 0);

	if (uncategorized.children[0].courses.length > 0) {
		normalized.push(uncategorized);
	}

	return normalized;
});

const primaryCategories = computed(() => categoryCourseTree.value);

const currentSubCategories = computed(() => {
	const category = primaryCategories.value[activePrimaryIndex.value];
	return category?.children || [];
});

const visibleCourseOptions = computed(() => {
	const keyword = courseSearchKeyword.value.trim().toLowerCase();
	if (keyword) {
		return courseList.value.filter((course) => {
			return [course.name, course.category, course.sub_category, course.subject]
				.some((value) => String(value || '').toLowerCase().includes(keyword));
		});
	}
	return currentSubCategories.value[activeSubIndex.value]?.courses || [];
});

	const totalPrice = computed(() => {
		if (isAppAdmin.value) return '0.00';
		if (!selectedCourse.value) return 0;
		const price = selectedCourse.value.agent_price || selectedCourse.value.price || 0;
		return (price * buyQuantity.value).toFixed(2);
	});

	const canBuy = computed(() => {
		return selectedActivationTarget.value && buyQuantity.value > 0 && (isAppAdmin.value || buyQuantity.value <= 1000);
	});

// 加载课程列表
const loadCourseList = async () => {
	try {
		const [courses, categories] = await Promise.all([getAllCourses(), getCourseCategories()]);
		courseList.value = courses || [];
		courseCategoryTree.value = categories || [];
	} catch (error) {
		console.error('加载课程列表失败:', error);
		uni.showToast({
			title: '加载课程列表失败',
			icon: 'none',
		});
	}
};

const loadPackageSections = async () => {
	try {
		const sections = await getPackageSections();
		packageSections.value = Array.isArray(sections) ? sections.filter((section) => (section.plans || []).length > 0) : [];
	} catch (error) {
		console.error('加载套餐/VIP列表失败:', error);
		packageSections.value = [];
	}
};

const switchActivationTargetType = (type) => {
	if (activationTargetType.value === type) return;
	activationTargetType.value = type;
	buyQuantity.value = 1;
};

const handlePrimaryCategorySelect = (index) => {
	activePrimaryIndex.value = index;
	activeSubIndex.value = 0;
};

const handleSubCategorySelect = (index) => {
	activeSubIndex.value = index;
};

// 处理课程选择
const handleCourseSelect = (course) => {
	selectedCourseIndex.value = courseList.value.findIndex((item) => item.id === course.id);
	buyQuantity.value = 1; // 重置数量
};

const handlePackageSectionSelect = (index) => {
	activePackageSectionIndex.value = index;
	selectedPackagePlanId.value = null;
	buyQuantity.value = 1;
};

const handlePackagePlanSelect = (plan) => {
	selectedPackagePlanId.value = plan?.id || null;
	buyQuantity.value = 1;
};

const resetBuyCodeForm = () => {
	selectedCourseIndex.value = -1;
	courseSearchKeyword.value = '';
	activePrimaryIndex.value = 0;
	activeSubIndex.value = 0;
	activationTargetType.value = 'course';
	activePackageSectionIndex.value = 0;
	selectedPackagePlanId.value = null;
	buyQuantity.value = 1;
};

// 增加数量
	const increaseQuantity = () => {
		if (buyQuantity.value < quantityMax.value) {
			buyQuantity.value++;
		}
	};

// 减少数量
const decreaseQuantity = () => {
	if (buyQuantity.value > 1) {
		buyQuantity.value--;
	}
};

// 处理数量输入
const handleQuantityInput = (e) => {
		let value = parseInt(e.detail.value) || 1;
		if (value < 1) value = 1;
		if (value > quantityMax.value) value = quantityMax.value;
		buyQuantity.value = value;
	};

// 购买激活码
const handleBuyCodes = async () => {
	if (!canBuy.value) {
		uni.showToast({
			title: `请选择${activationTargetType.value === 'package' ? '套餐/VIP' : '课程'}并输入数量`,
			icon: 'none',
		});
		return;
	}

		try {
			uni.showLoading({ title: isAppAdmin.value ? '生成中...' : '购买中...' });
			const payload =
				isAppAdmin.value && activationTargetType.value === 'package'
					? {
							target_type: 'package',
							target_id: selectedPackagePlan.value.id,
							count: buyQuantity.value,
						}
					: {
							target_type: 'course',
							target_id: selectedCourse.value.id,
							course_id: selectedCourse.value.id,
							count: buyQuantity.value,
						};
			const result = isAppAdmin.value ? await generateAdminActivationCodes(payload) : await buyActivationCodes(payload);

			if (!isAppAdmin.value && result?.payment_params) {
				uni.hideLoading();
				if (blockVirtualPaymentIfNotReady(result)) {
					return;
				}
				try {
					await invokeVirtualPayment(result.payment_params);
					uni.showLoading({ title: '确认支付中...' });
					await confirmWechatPayment({
						order_no: result.order_no,
					});
				} catch (payError) {
					uni.showToast({
						title: formatVirtualPaymentFailMessage(payError),
						icon: 'none',
						duration: 3500,
					});
					return;
				}
			}
		uni.hideLoading();

			uni.showModal({
				title: isAppAdmin.value ? '生成成功' : '购买成功',
				content: `${isAppAdmin.value ? '成功生成' : '成功购买'} ${buyQuantity.value} 个激活码，批次号：${result.batch_no || 'N/A'}`,
				showCancel: false,
			confirmText: '确定',
			success: () => {
				showBuyCodeModal.value = false;
				resetBuyCodeForm();
				// 刷新激活码列表
				if (activeTab.value === 'codes') {
					loadCodeList();
				}
			},
		});
	} catch (error) {
		uni.hideLoading();
		console.error('购买激活码失败:', error);
		const errMsg = error?.errMsg || error?.message || error?.msg || '购买失败';
		const isCancel = errMsg.includes('cancel') || errMsg.includes('取消');
		uni.showToast({
			title: isCancel ? '已取消支付' : errMsg,
			icon: 'none',
			duration: 3000,
		});
	}
};

const loadDistributorInfo = async () => {
	try {
			const res = await getDistributorInfo();
			distributorInfo.value = res;
				if (res.status === 1) {
					// 已通过审核，加载二维码和统计数据
					if (activeTab.value === 'qr') {
					loadQRCode();
			}
			loadStats();
			// 如果当前在激活码tab，加载激活码列表
			if (activeTab.value === 'codes') {
				loadCodeList();
			}
		}
	} catch (error) {
		if (error.code === 404 && isAppAdmin.value) {
				distributorInfo.value = {
					status: 1,
					is_app_admin: true,
				};
				activeTab.value = 'qr';
				loadQRCode();
		} else if (error.code === 404) {
			// 还不是分销用户
			distributorInfo.value = null;
		} else {
			uni.showToast({
				title: error.msg || '加载失败',
				icon: 'none',
			});
		}
	}
};

const loadQRCode = async (refresh = false) => {
	try {
		uni.showLoading({ title: '生成二维码中...' });
		const res = await generateQRCode(refresh ? { refresh: 1 } : {});
		console.log('二维码生成响应:', res);

		// 处理不同的响应格式
		let qrUrl = '';
		if (res && res.qr_code_url) {
			qrUrl = res.qr_code_url;
		} else if (res && typeof res === 'string') {
			// 如果返回的是字符串（base64 或 URL）
			qrUrl = res;
		} else if (res && res.data && res.data.qr_code_url) {
			// 嵌套的 data 字段
			qrUrl = res.data.qr_code_url;
		} else {
			console.error('二维码响应格式错误:', res);
			uni.hideLoading();
			uni.showToast({
				title: '二维码格式错误',
				icon: 'none',
			});
			return;
		}

		// 检查是否是错误信息（微信 API 错误时可能返回 base64 编码的 JSON）
		if (qrUrl && qrUrl.startsWith('data:image/png;base64,')) {
			try {
				// 尝试解码 base64，检查是否是错误信息
				const base64Data = qrUrl.replace('data:image/png;base64,', '');
				const decoded = atob(base64Data);
				// 检查是否是 JSON 格式的错误信息
				if (decoded.startsWith('{') && decoded.includes('errcode')) {
					const errorData = JSON.parse(decoded);
					console.error('二维码生成错误:', errorData);
					uni.hideLoading();
					uni.showToast({
						title: errorData.errmsg || '生成二维码失败',
						icon: 'none',
						duration: 3000,
					});
					qrCodeUrl.value = '';
					return;
				}
			} catch (e) {
				// 不是 JSON 错误，继续处理
			}
		}

		// 处理 base64 格式（如果不是完整的 data URL）
		if (qrUrl && !qrUrl.startsWith('http') && !qrUrl.startsWith('data:') && !qrUrl.startsWith('/')) {
			// 可能是 base64 字符串，添加前缀
			if (qrUrl.length > 100) {
				// base64 通常很长
				// 先检查是否是错误信息
				try {
					const decoded = atob(qrUrl);
					if (decoded.startsWith('{') && decoded.includes('errcode')) {
						const errorData = JSON.parse(decoded);
						console.error('二维码生成错误:', errorData);
						uni.hideLoading();
						uni.showToast({
							title: errorData.errmsg || '生成二维码失败',
							icon: 'none',
							duration: 3000,
						});
						qrCodeUrl.value = '';
						return;
					}
				} catch (e) {
					// 不是 JSON 错误，继续处理为图片
				}
				qrUrl = `data:image/png;base64,${qrUrl}`;
			}
		}

		qrCodeUrl.value = qrUrl;
		console.log('二维码URL:', qrCodeUrl.value);
		uni.hideLoading();
	} catch (error) {
		uni.hideLoading();
		console.error('生成二维码失败:', error);
		const errorMsg = error.message || error.msg || '生成二维码失败';
		uni.showToast({
			title: errorMsg,
			icon: 'none',
			duration: 3000,
		});
	}
};

const loadStats = async () => {
	try {
		const res = await getDistributorStats();
		statsData.value = res.distributor || {};
		commissions.value = res.commissions || [];
	} catch (error) {
		console.error('加载统计数据失败:', error);
	}
};

const handleApply = async () => {
	try {
		uni.showLoading({ title: '申请中...' });
		await applyDistributor();
		uni.hideLoading();
		uni.showToast({
			title: '申请已提交，等待审核',
			icon: 'success',
		});
		// 重新加载信息
		setTimeout(() => {
			loadDistributorInfo();
		}, 1000);
	} catch (error) {
		uni.hideLoading();
		uni.showToast({
			title: error.msg || '申请失败',
			icon: 'none',
		});
	}
};

const copyCode = () => {
	if (distributorInfo.value && distributorInfo.value.distributor_code) {
		uni.setClipboardData({
			data: distributorInfo.value.distributor_code,
			success: () => {
				uni.showToast({
					title: '已复制',
					icon: 'success',
				});
			},
		});
	}
};

// 复制激活码
	const copyActivationCode = (code) => {
	if (!code) {
		uni.showToast({
			title: '激活码为空',
			icon: 'none',
		});
		return;
	}

	uni.setClipboardData({
		data: code,
		success: () => {
			uni.showToast({
				title: '已复制',
				icon: 'success',
				duration: 1500,
			});
		},
		fail: () => {
			uni.showToast({
				title: '复制失败',
				icon: 'none',
			});
		},
	});
	};

	const handleInvalidateCode = (code) => {
		if (!code || code.status !== 1) return;
		uni.showModal({
			title: '禁用激活码',
			content: '禁用后该用户对应课程权限会被撤销，确定继续吗？',
			confirmText: '确认禁用',
			confirmColor: '#f44336',
			success: async (res) => {
				if (!res.confirm) return;
				try {
					uni.showLoading({ title: '处理中...' });
					await invalidateActivationCode(code.id);
					uni.hideLoading();
					uni.showToast({
						title: '已禁用',
						icon: 'success',
					});
					loadCodeList();
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: error?.msg || error?.message || '禁用失败',
						icon: 'none',
					});
				}
			},
		});
	};

const handleShareButtonClick = () => {
	if (!qrCodeUrl.value) {
		uni.showToast({
			title: '二维码生成中，请稍候',
			icon: 'none',
		});
		return;
	}

	// #ifndef MP-WEIXIN
	uni.showToast({
		title: '请长按二维码保存后分享',
		icon: 'none',
	});
	// #endif
};

const getStatusText = (status) => {
	const statusMap = {
		0: '待审核',
		1: '已通过',
		2: '已拒绝',
		3: '已禁用',
	};
	return statusMap[status] || '未知';
};

const getStatusClass = (status) => {
	const classMap = {
		0: 'status-pending',
		1: 'status-approved',
		2: 'status-rejected',
		3: 'status-disabled',
	};
	return classMap[status] || '';
};

const formatTime = (time) => {
	if (!time) return '';
	const date = new Date(time);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hour = String(date.getHours()).padStart(2, '0');
	const minute = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hour}:${minute}`;
};

const handleImageError = (e) => {
	console.error('二维码图片加载失败:', e);
	qrCodeUrl.value = '';
	loadQRCode(true);
};

const handleImageLoad = () => {
	console.log('二维码图片加载成功');
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';
.distributor-page {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 40rpx;
}

.distributor-header {
	padding: 40rpx 30rpx;
	background-color: #fff;
	border-bottom: 1px solid #eee;

	.header-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
}

.status-card,
.apply-card {
	margin: 30rpx;
	padding: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.status-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;

	.status-label {
		font-size: 28rpx;
		color: #666;
	}

	.status-value {
		font-size: 28rpx;
		font-weight: bold;

		&.status-pending {
			color: #ff9800;
		}

		&.status-approved {
			color: #4caf50;
		}

		&.status-rejected {
			color: #f44336;
		}

		&.status-disabled {
			color: #999;
		}
	}
}

.distributor-code {
	display: flex;
	align-items: center;
	font-size: 26rpx;
	color: #333;

	.code-label {
		color: #666;
	}

	.code-value {
		flex: 1;
		margin-left: 10rpx;
		font-weight: bold;
	}

	.copy-btn {
		padding: 8rpx 20rpx;
		background-color: #007aff;
		color: #fff;
		border-radius: 8rpx;
		font-size: 24rpx;
	}
}

.apply-card {
	text-align: center;

	.apply-title {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.apply-desc {
		display: block;
		font-size: 26rpx;
		color: #666;
		margin-bottom: 30rpx;
		line-height: 1.6;
	}

	.apply-btn {
		width: 200rpx;
		height: 80rpx;
		line-height: 80rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border-radius: 40rpx;
		font-size: 28rpx;
		border: none;
	}
}

/* Tab 切换 */
.tab-container {
	margin: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
	overflow: hidden;
}

.tab-header {
	display: flex;
	border-bottom: 2rpx solid #f0f0f0;
}

.tab-item {
	flex: 1;
	padding: 24rpx 0;
	text-align: center;
	position: relative;
	cursor: pointer;
	transition: all $transition-fast;

	&:active {
		opacity: 0.7;
	}

	&.active {
		.tab-text {
			color: #17c3a2;
			font-weight: 600;
		}

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 60rpx;
			height: 4rpx;
			background-color: #17c3a2;
			border-radius: 2rpx;
		}
	}
}

.tab-text {
	font-size: 28rpx;
	color: #666;
	transition: color $transition-fast;
}

.stats-section {
	margin: 30rpx;
	padding: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;

	.stats-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;

		.stat-item {
			padding: 30rpx;
			background-color: #f8f9fa;
			border-radius: 12rpx;
			text-align: center;

			.stat-value {
				display: block;
				font-size: 36rpx;
				font-weight: bold;
				color: #007aff;
				margin-bottom: 10rpx;
			}

			.stat-label {
				font-size: 24rpx;
				color: #666;
			}
		}
	}
}

.qr-section {
	margin: 30rpx;
	padding: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
	text-align: center;

	.qr-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
	}

	.qr-container {
		width: 400rpx;
		height: 400rpx;
		margin: 0 auto 20rpx;
		background-color: #f8f9fa;
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;

		.qr-image {
			width: 100%;
			height: 100%;
		}

		.qr-loading {
			color: #999;
			font-size: 26rpx;
		}
	}

	.qr-tip {
		display: block;
		font-size: 24rpx;
		color: #666;
		margin-bottom: 30rpx;
		line-height: 1.6;
	}

	.share-btn,
	.regenerate-btn {
		width: 200rpx;
		height: 80rpx;
		line-height: 80rpx;
		background-color: #007aff;
		color: #fff;
		border-radius: 40rpx;
		font-size: 28rpx;
		border: none;
		margin: 0 auto;
		display: block;
	}

	.regenerate-btn {
		background-color: $color-secondary;
		margin-top: $space-4;
	}
}

.commission-section {
	margin: 30rpx;
	padding: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
	}

	.commission-list {
		.commission-item {
			padding: 20rpx 0;
			border-bottom: 1px solid #eee;

			&:last-child {
				border-bottom: none;
			}

			.commission-info {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10rpx;

				.commission-amount {
					font-size: 32rpx;
					font-weight: bold;
					color: #4caf50;
				}

				.commission-level {
					font-size: 24rpx;
					color: #999;
					background-color: #f0f0f0;
					padding: 4rpx 12rpx;
					border-radius: 8rpx;
				}
			}

			.commission-detail {
				display: flex;
				justify-content: space-between;
				font-size: 24rpx;
				color: #999;
			}
		}
	}

	.empty-tip {
		text-align: center;
		padding: 60rpx 0;
		color: #999;
		font-size: 26rpx;
	}
}

/* 购买激活码区域 */
.buy-code-section {
	margin: 30rpx;
	padding: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
}

.buy-code-card {
	text-align: center;
	padding: 20rpx 0;
}

.buy-code-desc {
	display: block;
	font-size: 26rpx;
	color: #666;
	margin-bottom: 30rpx;
	line-height: 1.6;
}

.buy-code-btn {
	width: 200rpx;
	height: 80rpx;
	line-height: 80rpx;
	background: linear-gradient(135deg, #17c3a2 0%, #14a085 100%);
	color: #fff;
	border-radius: 40rpx;
	font-size: 28rpx;
	border: none;
	margin: 0 auto;
}

/* 购买激活码弹窗 */
.buy-code-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: fadeIn 0.3s ease-out;
}

.buy-code-popup {
	width: 90%;
	max-width: 600rpx;
	background-color: #fff;
	border-radius: 24rpx;
	overflow: hidden;
	animation: slideUp 0.3s ease-out;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1px solid #f0f0f0;
}

.popup-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333;
}

.popup-close {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	color: #999;
	cursor: pointer;
}

.popup-content {
	padding: 32rpx;
}

.target-type-tabs {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12rpx;
	padding: 8rpx;
	margin-bottom: 28rpx;
	border-radius: 14rpx;
	background: #f4f7fb;
}

.target-type-tab {
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 10rpx;
	text-align: center;
	font-size: 26rpx;
	font-weight: 600;
	color: #697386;
}

.target-type-tab.active {
	background: #ffffff;
	color: #17c3a2;
	box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.08);
}

.form-item {
	margin-bottom: 32rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 16rpx;
}

.form-value {
	font-size: 32rpx;
	color: #333;
	font-weight: 500;

	&.total-price {
		color: #17c3a2;
		font-size: 36rpx;
		font-weight: 600;
	}
}

.course-search-input {
	height: 72rpx;
	padding: 0 24rpx;
	margin-bottom: 16rpx;
	border-radius: 12rpx;
	background: #f5f7fb;
	font-size: 26rpx;
	color: #333;
}

.course-search-placeholder {
	color: #a0a6b3;
}

.selected-course-view {
	padding: 16rpx 20rpx;
	margin-bottom: 16rpx;
	border-radius: 12rpx;
	background: rgba(23, 195, 162, 0.08);
}

.selected-course-text {
	font-size: 24rpx;
	color: #14a085;
	line-height: 1.5;
}

.course-cascade {
	display: flex;
	height: 360rpx;
	overflow: hidden;
	border: 1rpx solid #eef0f4;
	border-radius: 16rpx;
	background: #fff;
}

.package-cascade .package-section-column {
	width: 44%;
}

.cascade-column {
	width: 32%;
	height: 360rpx;
	border-right: 1rpx solid #eef0f4;
	background: #fafafa;
}

.cascade-column:last-child,
.course-column {
	flex: 1;
	width: auto;
	border-right: none;
	background: #fff;
}

.cascade-item {
	min-height: 72rpx;
	padding: 18rpx 16rpx;
	box-sizing: border-box;
	font-size: 24rpx;
	color: #596273;
	line-height: 1.35;
	border-bottom: 1rpx solid rgba(238, 240, 244, 0.7);

	&.active {
		background: #fff;
		color: #17c3a2;
		font-weight: 600;
	}
}

.course-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
}

.course-option-name {
	flex: 1;
	min-width: 0;
}

.course-option-price {
	flex-shrink: 0;
	color: #ff8a00;
	font-size: 22rpx;
}

.cascade-empty {
	padding: 80rpx 20rpx;
	text-align: center;
	font-size: 24rpx;
	color: #999;
}

.picker-view {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx;
	background-color: #f5f5f5;
	border-radius: 12rpx;
}

.picker-text {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

.picker-arrow {
	font-size: 32rpx;
	color: #999;
}

.quantity-control {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.quantity-btn {
	width: 60rpx;
	height: 60rpx;
	line-height: 60rpx;
	text-align: center;
	background-color: #f5f5f5;
	border-radius: 8rpx;
	font-size: 32rpx;
	color: #333;
	border: none;
}

.quantity-input {
	flex: 1;
	height: 60rpx;
	text-align: center;
	font-size: 28rpx;
	color: #333;
	background-color: #f5f5f5;
	border-radius: 8rpx;
	border: none;
}

.popup-footer {
	display: flex;
	gap: 20rpx;
	padding: 32rpx;
	border-top: 1px solid #f0f0f0;
}

.cancel-btn,
.confirm-btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	text-align: center;
	border-radius: 12rpx;
	font-size: 32rpx;
	border: none;
}

.cancel-btn {
	background-color: #f5f5f5;
	color: #666;
}

.confirm-btn {
	background-color: #17c3a2;
	color: #fff;

	&:disabled {
		background-color: #ccc;
		color: #999;
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes slideUp {
	from {
		transform: translateY(100rpx);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

/* 激活码统计区域 */
.code-stats-section {
	margin: 30rpx;
	padding: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
}

.code-stats-section .stats-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 30rpx;
}

	.code-stats-section .stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20rpx;
	}

.code-stats-section .stat-item {
	padding: 30rpx 20rpx;
	background-color: #f8f9fa;
	border-radius: 12rpx;
	text-align: center;
}

.code-stats-section .stat-value {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	color: #007aff;
	margin-bottom: 10rpx;

	&.stat-used {
		color: #4caf50;
	}

		&.stat-pending {
			color: #ff9800;
		}

		&.stat-invalid {
			color: #f44336;
		}
	}

.code-stats-section .stat-label {
	font-size: 24rpx;
	color: #666;
}

/* 激活码列表区域 */
.code-list-section {
	margin: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
	overflow: hidden;
}

.section-header {
	padding: 30rpx;
	border-bottom: 1px solid #f0f0f0;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.filter-tabs {
	display: flex;
	gap: 20rpx;
}

.filter-tab {
	padding: 8rpx 16rpx;
	font-size: 24rpx;
	color: #666;
	border-radius: 8rpx;
	cursor: pointer;
	transition: all $transition-fast;

	&:active {
		opacity: 0.7;
	}

	&.active {
		background-color: rgba(23, 195, 162, 0.1);
		color: #17c3a2;
		font-weight: 500;
	}
}

.code-list-scroll {
	max-height: calc(100vh - 600rpx);
}

.loading-state,
.empty-state {
	padding: 60rpx 0;
	text-align: center;
}

.loading-text,
.empty-text {
	font-size: 26rpx;
	color: #999;
}

.code-batch {
	border-bottom: 1px solid #f0f0f0;

	&:last-child {
		border-bottom: none;
	}
}

.batch-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 30rpx;
	cursor: pointer;
	transition: background-color $transition-fast;

	&:active {
		background-color: #f5f5f5;
	}
}

.batch-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.batch-id {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
}

.batch-course {
	font-size: 24rpx;
	color: #666;
}

.batch-count {
	font-size: 24rpx;
	color: #999;
}

.batch-toggle {
	font-size: 24rpx;
	color: #999;
}

.batch-codes {
	padding: 0 30rpx 20rpx;
	background-color: #f9f9f9;
}

.code-item {
	padding: 20rpx;
	margin-top: 16rpx;
	background-color: #fff;
	border-radius: 12rpx;
	border-left: 4rpx solid #17c3a2;

		&.code-used {
			border-left-color: #4caf50;
		}

		&.code-invalid {
			border-left-color: #f44336;
			opacity: 0.72;
		}
	}

.code-info {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.code-value-wrapper {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.code-value {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	font-family: monospace;
	flex: 1;
	word-break: break-all;
}

.code-copy-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 16rpx;
	background-color: rgba(23, 195, 162, 0.1);
	border-radius: 8rpx;
	cursor: pointer;
	transition: all $transition-fast;
	flex-shrink: 0;

	&:hover {
		background-color: rgba(23, 195, 162, 0.2);
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
		background-color: rgba(23, 195, 162, 0.15);
	}
}

.copy-text {
	font-size: 24rpx;
	color: #17c3a2;
	font-weight: 500;
}

.code-meta {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4rpx;
}

.code-status {
	font-size: 24rpx;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;

	&.status-pending {
		background-color: rgba(255, 152, 0, 0.1);
		color: #ff9800;
	}

	&.status-used {
		background-color: rgba(76, 175, 80, 0.1);
		color: #4caf50;
	}

	&.status-invalid {
		background-color: rgba(244, 67, 54, 0.1);
		color: #f44336;
	}
}

.code-time {
	font-size: 22rpx;
	color: #999;
}

.code-used-info {
	padding-top: 12rpx;
	border-top: 1px solid #f0f0f0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.used-label {
	font-size: 24rpx;
	color: #4caf50;
	font-weight: 500;
}

.used-user {
	font-size: 24rpx;
	color: #666;
}

	.used-time {
		font-size: 22rpx;
		color: #999;
	}

	.invalidate-code-btn {
		align-self: flex-start;
		height: 56rpx;
		line-height: 56rpx;
		margin: 8rpx 0 0;
		padding: 0 18rpx;
		border: 1px solid rgba(244, 67, 54, 0.32);
		border-radius: 28rpx;
		background-color: rgba(244, 67, 54, 0.08);
		color: #f44336;
		font-size: 24rpx;
	}

.load-more {
	padding: 30rpx 0;
	text-align: center;
}

.load-more-text {
	font-size: 24rpx;
	color: #999;
}
</style>
