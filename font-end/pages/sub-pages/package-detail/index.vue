<template>
	<view class="vip-detail-page">
		<view v-if="loading" class="empty">加载中...</view>
		<view v-else-if="loadError" class="empty-state">
			<text class="empty-state-text">{{ loadError }}</text>
			<button class="empty-state-btn" @click="loadDetail">重新加载</button>
			<button v-if="!userStore.isLoggedIn" class="empty-state-btn empty-state-btn--ghost" @click="goLogin">去登录</button>
		</view>
		<view v-else-if="detail">
			<view class="header-card">
				<view class="title-row">
					<text class="name">{{ detail.name }}</text>
					<text v-if="detail.isVip || detail.coversAllCourses" class="vip-tag">VIP</text>
				</view>
				<text class="desc">{{ detailDescription }}</text>
				<text class="expire" v-if="detail.subscribed">当前已购买，有效期至 {{ formatDate(detail.expireTime) }}</text>
			</view>

			<view v-if="enabledPlans.length" class="plan-card">
				<text class="block-title">选择套餐</text>
				<view
					v-for="plan in enabledPlans"
					:key="plan.id"
					:class="['plan-item', selectedPlanId === plan.id ? 'active' : '']"
					@click="selectedPlanId = plan.id"
				>
					<text class="plan-name">{{ plan.name }}</text>
					<view class="plan-price-wrap">
						<text v-if="isPlanCouponApplied(plan)" class="plan-price plan-price-final">¥{{ getPlanPayAmount(plan) }}</text>
						<text :class="['plan-price', isPlanCouponApplied(plan) ? 'plan-price-origin' : '']">¥{{ plan.price }}</text>
					</view>
					<text class="plan-days">{{ plan.durationDays }}天</text>
				</view>
			</view>

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

			<view class="course-card" v-if="detail.courses?.length || detail.coversAllCourses">
				<view class="course-header-row">
					<text class="block-title course-block-title">
						{{ detail.coversAllCourses ? `包含课程（共 ${detail.courseCount || detail.courses.length} 门）` : `包含课程（${detail.courses.length}）` }}
					</text>
					<text v-if="coursesTotalPrice > 0" class="course-total-value">总价值 ¥{{ formatYuanDisplay(coursesTotalPrice) }}</text>
				</view>
				<text v-if="detail.coversAllCourses && detail.courseCount > detail.courses.length" class="course-tip">
					以下为部分课程，购买后可查看全站全部课程
				</text>
				<view
					v-for="course in detail.courses"
					:key="course.id"
					class="course-item"
					@click="openCourseDetail(course)"
				>
					<text class="course-name">{{ course.name }}</text>
					<text class="course-arrow">›</text>
				</view>
			</view>

			<button
				v-if="enabledPlans.length"
				class="buy-btn"
				:loading="buyLoading"
				@click="handleBuy"
			>
				{{ buyButtonText }}
			</button>
		</view>
		<view v-else-if="!loading" class="empty">套餐不存在或已下架</view>

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
							active: tempSelectedCouponId === item.id && item.usable,
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
							:class="{ checked: tempSelectedCouponId === item.id && item.usable, disabled: !item.usable }"
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
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { confirmWechatPayment, createOrder, getMyCoupons, getPackageSectionDetail } from '@/api/index'
import { formatCouponThresholdDesc, formatYuanDisplay } from '@/utils/format'
import { applyAutoCouponSelection } from '@/utils/coupon-select'
import { blockVirtualPaymentIfNotReady, formatVirtualPaymentFailMessage, invokeVirtualPayment } from '@/utils/virtual-payment'

const userStore = useUserStore()
const loading = ref(false)
const loadError = ref('')
const buyLoading = ref(false)
const sectionId = ref(0)
const detail = ref(null)
const selectedPlanId = ref(null)
const availableCoupons = ref([])
const couponOptions = ref([])
const selectedCouponId = ref(null)
const tempSelectedCouponId = ref(null)
const couponPickerVisible = ref(false)
const couponUserOptOut = ref(false)

const enabledPlans = computed(() =>
	(detail.value?.plans || []).filter((plan) => plan.status === undefined || Number(plan.status) === 1),
)

const selectedPlan = computed(() =>
	enabledPlans.value.find((plan) => plan.id === selectedPlanId.value) || null,
)

const selectedPlanPrice = computed(() => Number(selectedPlan.value?.price || 0))

const detailDescription = computed(() => {
	if (detail.value?.isVip || detail.value?.coversAllCourses) {
		return detail.value.description || '购买后可查看全站全部课程'
	}
	return detail.value?.description || '购买后可任意浏览套餐内课程'
})

const coursesTotalPrice = computed(() => Number(detail.value?.coursesTotalPrice) || 0)

const showCouponPicker = computed(() => {
	return (
		userStore.isLoggedIn &&
		!detail.value?.subscribed &&
		selectedPlanPrice.value > 0
	)
})

const selectedCoupon = computed(
	() => availableCoupons.value.find((item) => item.id === selectedCouponId.value) || null,
)

const payAmount = computed(() => {
	const price = selectedPlanPrice.value
	if (!selectedCoupon.value) return price
	return Math.max(0, Number((price - Number(selectedCoupon.value.amount || 0)).toFixed(2)))
})

const selectedCouponLabel = computed(() => {
	if (selectedCoupon.value) {
		return `-¥${selectedCoupon.value.amount}`
	}
	if (availableCoupons.value.length > 0) {
		return `${availableCoupons.value.length} 张可用`
	}
	return '暂无可用'
})

const buyButtonText = computed(() => {
	if (buyLoading.value) return '支付中...'
	return '立即购买'
})

const formatCouponDesc = (item) => formatCouponThresholdDesc(item.minAmount, item.amount)

const getPlanPayAmount = (plan) => {
	const price = Number(plan?.price || 0)
	if (!selectedCoupon.value) return price
	const minAmount = Number(selectedCoupon.value.minAmount || 0)
	if (price < minAmount) return price
	return Math.max(0, Number((price - Number(selectedCoupon.value.amount || 0)).toFixed(2)))
}

const isPlanCouponApplied = (plan) => {
	if (!selectedCoupon.value) return false
	const price = Number(plan?.price || 0)
	return price >= Number(selectedCoupon.value.minAmount || 0) && getPlanPayAmount(plan) < price
}

const loadAvailableCoupons = async () => {
	if (!showCouponPicker.value) {
		availableCoupons.value = []
		couponOptions.value = []
		selectedCouponId.value = null
		return
	}
	try {
		const list = await getMyCoupons({ status: 'unused' })
		const price = selectedPlanPrice.value
		const options = (list || [])
			.filter((item) => item.status === 'unused')
			.map((item) => {
				const minAmount = Number(item.minAmount || 0)
				const usable = price >= minAmount
				return {
					...item,
					desc: formatCouponDesc(item),
					usable,
					disabledReason: usable ? '' : `还差${formatYuanDisplay(Math.max(0, minAmount - price))}元可用`,
				}
			})
			.sort((a, b) => {
				if (a.usable !== b.usable) {
					return a.usable ? -1 : 1
				}
				return Number(b.amount) - Number(a.amount)
			})
		couponOptions.value = options
		availableCoupons.value = options.filter((item) => item.usable)
		applyAutoCouponSelection(selectedCouponId, availableCoupons.value, {
			userOptOutRef: couponUserOptOut,
		})
	} catch (error) {
		console.error('加载优惠券失败:', error)
		availableCoupons.value = []
		couponOptions.value = []
	}
}

const openCouponPicker = () => {
	tempSelectedCouponId.value = selectedCouponId.value
	couponPickerVisible.value = true
}

const closeCouponPicker = () => {
	couponPickerVisible.value = false
}

const pickTempCoupon = (item) => {
	if (item && !item.usable) {
		return
	}
	tempSelectedCouponId.value = item?.id ?? null
}

const confirmCouponPicker = () => {
	selectedCouponId.value = tempSelectedCouponId.value
	couponUserOptOut.value = tempSelectedCouponId.value == null
	closeCouponPicker()
}

const syncSelectedPlan = () => {
	const plans = enabledPlans.value
	if (!plans.length) {
		selectedPlanId.value = null
		return
	}
	if (!plans.some((plan) => plan.id === selectedPlanId.value)) {
		selectedPlanId.value = plans[0].id
	}
}

const goLogin = () => {
	uni.navigateTo({ url: '/pages/login/index' })
}

const loadDetail = async () => {
	if (!sectionId.value) {
		loadError.value = '套餐参数无效'
		return
	}
	loading.value = true
	loadError.value = ''
	try {
		detail.value = await getPackageSectionDetail(sectionId.value)
		syncSelectedPlan()
		await loadAvailableCoupons()
	} catch (error) {
		console.error(error)
		detail.value = null
		loadError.value = error?.message || '加载失败，请稍后重试'
	} finally {
		loading.value = false
	}
}

watch(selectedPlanId, () => {
	couponUserOptOut.value = false
	loadAvailableCoupons()
})

watch(
	() => userStore.isLoggedIn,
	() => {
		loadAvailableCoupons()
	},
)

const formatDate = (value) => {
	if (!value) return ''
	const date = new Date(value)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const openCourseDetail = (course) => {
	if (!course?.id) return
	uni.navigateTo({
		url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
	})
}

const handleBuy = async () => {
	if (!userStore.isLoggedIn) {
		uni.navigateTo({ url: '/pages/login/index' })
		return
	}
	if (!selectedPlanId.value || buyLoading.value) return
	try {
		buyLoading.value = true
		const order = await createOrder({
			order_type: 'package',
			package_section_id: sectionId.value,
			package_plan_id: selectedPlanId.value,
			...(selectedCouponId.value ? { coupon_id: selectedCouponId.value } : {}),
		})
		if (!order?.payment_params) {
			await userStore.fetchUserInfo()
			await loadDetail()
			uni.showToast({ title: '购买成功', icon: 'success' })
			return
		}
		if (blockVirtualPaymentIfNotReady(order)) return
		await invokeVirtualPayment(order.payment_params)
		await confirmWechatPayment({ order_no: order.order_no })
		await userStore.fetchUserInfo()
		await loadDetail()
		uni.showToast({ title: '开通成功', icon: 'success' })
	} catch (error) {
		uni.showToast({
			title: formatVirtualPaymentFailMessage(error),
			icon: 'none',
		})
	} finally {
		buyLoading.value = false
	}
}

onLoad((options) => {
	sectionId.value = Number(options?.id || 0)
	loadDetail()
})
</script>

<style scoped>
.vip-detail-page {
	min-height: 100vh;
	background: #f5f7fb;
	padding: 24rpx 24rpx 140rpx;
}
.header-card,
.plan-card,
.course-card,
.coupon-section {
	background: #fff;
	border-radius: 24rpx;
	padding: 28rpx;
	margin-bottom: 24rpx;
}
.name {
	display: block;
	font-size: 36rpx;
	font-weight: 700;
}
.title-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
}
.vip-tag {
	font-size: 22rpx;
	color: #92400e;
	background: #fef3c7;
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
}
.desc,
.expire {
	display: block;
	margin-top: 12rpx;
	font-size: 26rpx;
	color: #6b7280;
}
.block-title {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	margin-bottom: 20rpx;
}
.coupon-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}
.coupon-label {
	font-size: 28rpx;
	font-weight: 500;
	color: #111827;
}
.coupon-value-wrap {
	display: flex;
	align-items: center;
	gap: 8rpx;
}
.coupon-value {
	font-size: 28rpx;
	color: #6b7280;
}
.coupon-value.active {
	color: #ef4444;
	font-weight: 600;
}
.coupon-arrow {
	color: #9ca3af;
	font-size: 32rpx;
}
.coupon-save-tip {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #ef4444;
}
.course-header-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 20rpx;
}
.course-block-title {
	margin-bottom: 0;
	flex: 1;
	min-width: 0;
}
.course-total-value {
	flex-shrink: 0;
	font-size: 26rpx;
	font-weight: 600;
	color: #ef4444;
}
.plan-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 24rpx;
	border: 2rpx solid #e5e7eb;
	border-radius: 16rpx;
	margin-bottom: 16rpx;
}
.plan-item.active {
	border-color: #2563eb;
	background: #eff6ff;
}
.plan-name {
	flex: 1;
	font-size: 28rpx;
}
.plan-price-wrap {
	display: flex;
	align-items: baseline;
	gap: 8rpx;
	flex-shrink: 0;
}
.plan-price {
	font-size: 32rpx;
	font-weight: 700;
	color: #ef4444;
}
.plan-price-final {
	font-size: 32rpx;
}
.plan-price-origin {
	font-size: 24rpx;
	font-weight: 400;
	color: #9ca3af;
	text-decoration: line-through;
}
.plan-days {
	font-size: 24rpx;
	color: #6b7280;
}
.course-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f3f4f6;
}
.course-item:active {
	opacity: 0.7;
}
.course-name {
	flex: 1;
	font-size: 26rpx;
	color: #111827;
	line-height: 1.5;
}
.course-arrow {
	flex-shrink: 0;
	font-size: 32rpx;
	color: #9ca3af;
	line-height: 1;
}
.course-tip {
	display: block;
	margin-bottom: 16rpx;
	font-size: 24rpx;
	color: #92400e;
}
.buy-btn {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: 32rpx;
	background: #2563eb;
	color: #fff;
	border-radius: 999rpx;
}
.empty {
	padding: 120rpx 0;
	text-align: center;
	color: #9ca3af;
}

.empty-state {
	padding: 120rpx 48rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24rpx;
}

.empty-state-text {
	font-size: 28rpx;
	color: #6b7280;
	text-align: center;
	line-height: 1.6;
}

.empty-state-btn {
	min-width: 240rpx;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 999rpx;
	background: #2563eb;
	color: #fff;
	font-size: 28rpx;
}

.empty-state-btn--ghost {
	background: #fff;
	color: #2563eb;
	border: 2rpx solid #2563eb;
}

.empty-state-btn::after {
	border: none;
}
.coupon-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
}
.coupon-panel {
	width: 100%;
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}
.coupon-panel-handle {
	width: 72rpx;
	height: 8rpx;
	border-radius: 999rpx;
	background: #e5e7eb;
	margin: 16rpx auto 0;
}
.coupon-panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 32rpx 16rpx;
}
.coupon-panel-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #111827;
}
.coupon-panel-close {
	font-size: 28rpx;
	color: #6b7280;
}
.coupon-panel-list {
	max-height: 56vh;
	padding: 0 24rpx;
	box-sizing: border-box;
}
.coupon-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding: 24rpx;
	margin-bottom: 16rpx;
	border-radius: 16rpx;
	border: 2rpx solid #e5e7eb;
	background: #fff;
}
.coupon-card.active {
	border-color: #2563eb;
	background: #eff6ff;
}
.coupon-card.disabled {
	opacity: 0.55;
}
.coupon-card-no-use {
	flex: 1;
	font-size: 28rpx;
	color: #111827;
}
.coupon-card-body {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 16rpx;
	min-width: 0;
}
.coupon-card-amount {
	font-size: 36rpx;
	font-weight: 700;
	color: #ef4444;
	flex-shrink: 0;
}
.coupon-card-info {
	flex: 1;
	min-width: 0;
}
.coupon-card-desc {
	display: block;
	font-size: 26rpx;
	color: #374151;
}
.coupon-card-tip {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #9ca3af;
}
.coupon-radio {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 2rpx solid #d1d5db;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.coupon-radio.checked {
	border-color: #2563eb;
	background: #2563eb;
}
.coupon-radio.disabled {
	border-color: #e5e7eb;
}
.coupon-radio-check {
	color: #fff;
	font-size: 24rpx;
	line-height: 1;
}
.coupon-panel-footer {
	padding: 16rpx 24rpx 0;
}
.coupon-confirm-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 999rpx;
	background: #2563eb;
	color: #fff;
	font-size: 30rpx;
}
.coupon-confirm-btn::after {
	border: none;
}
.coupon-empty {
	padding: 48rpx 0;
	text-align: center;
	color: #9ca3af;
	font-size: 26rpx;
}
</style>
