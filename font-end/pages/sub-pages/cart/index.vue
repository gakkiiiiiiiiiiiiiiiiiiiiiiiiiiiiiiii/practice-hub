<template>
	<view class="cart-page">
		<view v-if="cartStore.items.length === 0" class="empty-wrap">
			<text class="empty-icon">🛒</text>
			<text class="empty-title">购物车还是空的</text>
			<text class="empty-desc">去题库挑选想买的课程吧</text>
			<button class="empty-btn" @click="goBrowse">去逛逛</button>
		</view>

		<template v-else>
			<view class="toolbar">
				<text class="toolbar-count">共 {{ cartStore.items.length }} 门课程</text>
				<text class="toolbar-action" @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</text>
			</view>

			<scroll-view scroll-y class="cart-list">
				<view v-for="item in cartStore.items" :key="item.courseId" class="cart-item">
					<view class="cart-check" @click="cartStore.toggleSelect(item.courseId)">
						<view class="check-circle" :class="{ checked: cartStore.isSelected(item.courseId) }">
							<text v-if="cartStore.isSelected(item.courseId)" class="check-mark">✓</text>
						</view>
					</view>
					<image class="cart-cover" :src="getCover(item.coverImg)" mode="aspectFill" @click="goCourse(item.courseId)" />
					<view class="cart-info" @click="goCourse(item.courseId)">
						<text class="cart-name">{{ item.name }}</text>
						<text class="cart-type">{{ formatCourseTypeLabel(item.contentType) }}</text>
						<text class="cart-price">¥{{ item.price }}</text>
					</view>
					<text class="cart-remove" @click="removeItem(item.courseId)">删除</text>
				</view>
			</scroll-view>

			<view v-if="showCouponPicker" class="coupon-row" @click="openCouponPicker">
				<text class="coupon-label">优惠券</text>
				<view class="coupon-value-wrap">
					<text :class="['coupon-value', selectedCoupon ? 'active' : '']">{{ selectedCouponLabel }}</text>
					<text class="coupon-arrow">›</text>
				</view>
			</view>

			<view class="cart-footer">
				<view class="footer-total">
					<text class="total-label">合计</text>
					<text class="total-price">¥{{ payAmount }}</text>
					<text v-if="discountAmount > 0" class="total-discount">已减 ¥{{ discountAmount }}</text>
				</view>
				<button class="checkout-btn" :loading="checkoutLoading" :disabled="cartStore.selectedCount === 0" @click="handleCheckout">
					结算({{ cartStore.selectedCount }})
				</button>
			</view>
		</template>

		<view v-if="couponPickerVisible" class="coupon-mask" @click="closeCouponPicker">
			<view class="coupon-panel" @click.stop>
				<view class="coupon-panel-handle" />
				<view class="coupon-panel-header">
					<text class="coupon-panel-title">选择优惠券</text>
					<text class="coupon-panel-close" @click="closeCouponPicker">关闭</text>
				</view>
				<scroll-view scroll-y class="coupon-panel-list">
					<view class="coupon-card" :class="{ active: tempSelectedCouponId === null }" @click="tempSelectedCouponId = null">
						<text class="coupon-card-no-use">不使用优惠券</text>
						<view class="coupon-radio" :class="{ checked: tempSelectedCouponId === null }">
							<text v-if="tempSelectedCouponId === null" class="coupon-radio-check">✓</text>
						</view>
					</view>
					<view
						v-for="item in couponOptions"
						:key="item.id"
						class="coupon-card"
						:class="{ active: tempSelectedCouponId === item.id, disabled: !item.usable }"
						@click="pickTempCoupon(item)"
					>
						<view class="coupon-card-body">
							<text class="coupon-card-amount">¥{{ item.amount }}</text>
							<view class="coupon-card-info">
								<text class="coupon-card-desc">{{ item.desc }}</text>
								<text v-if="!item.usable" class="coupon-card-tip">{{ item.disabledReason }}</text>
							</view>
						</view>
						<view class="coupon-radio" :class="{ checked: tempSelectedCouponId === item.id, disabled: !item.usable }">
							<text v-if="tempSelectedCouponId === item.id && item.usable" class="coupon-radio-check">✓</text>
						</view>
					</view>
				</scroll-view>
				<view class="coupon-panel-footer">
					<button class="coupon-confirm-btn" @click="confirmCouponPicker">确定使用</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCartStore } from '@/store/cart'
import { useUserStore } from '@/store/user'
import { createCartOrder, confirmWechatPayment, getMyCoupons } from '@/api/index'
import { getApiBaseUrl } from '@/utils/api-base'
import { formatCouponThresholdDesc, formatYuanDisplay } from '@/utils/format'
import { applyAutoCouponSelection } from '@/utils/coupon-select'
import {
	chooseWechatShippingAddress,
	formatCourseTypeLabel,
	PAPER_EXAM_CONTENT_TYPE,
} from '@/utils/wechat-address'
import {
	blockVirtualPaymentIfNotReady,
	formatVirtualPaymentFailMessage,
	invokeVirtualPayment,
} from '@/utils/virtual-payment'

const cartStore = useCartStore()
const userStore = useUserStore()
const checkoutLoading = ref(false)
const couponPickerVisible = ref(false)
const couponOptions = ref([])
const selectedCouponId = ref(null)
const tempSelectedCouponId = ref(null)
const couponUserOptOut = ref(false)

const isAllSelected = computed(
	() => cartStore.items.length > 0 && cartStore.selectedCount === cartStore.items.length,
)

const selectedTotal = computed(() => cartStore.selectedTotal)

const selectedCoupon = computed(
	() => couponOptions.value.find((item) => item.id === selectedCouponId.value && item.usable) || null,
)

const discountAmount = computed(() => {
	if (!selectedCoupon.value) return 0
	return Math.min(selectedTotal.value, Number(selectedCoupon.value.amount || 0))
})

const payAmount = computed(() => Math.max(0, selectedTotal.value - discountAmount.value))

const showCouponPicker = computed(() => userStore.isLoggedIn && selectedTotal.value > 0)
const selectedHasPaperExam = computed(() =>
	cartStore.selectedItems.some((item) => item.contentType === PAPER_EXAM_CONTENT_TYPE),
)

const selectedCouponLabel = computed(() => {
	if (selectedCoupon.value) {
		return `-¥${selectedCoupon.value.amount}`
	}
	const usableCount = couponOptions.value.filter((item) => item.usable).length
	return usableCount > 0 ? `${usableCount} 张可用` : '暂无可用'
})

const getCover = (url) => {
	if (!url) return '/static/default-course.png'
	if (url.startsWith('http://') || url.startsWith('https://')) return url
	const base = getApiBaseUrl().replace(/\/+$/, '')
	return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}

const formatCouponDesc = (item) => formatCouponThresholdDesc(item.minAmount, item.amount)

const loadCoupons = async () => {
	if (!userStore.isLoggedIn || selectedTotal.value <= 0) {
		couponOptions.value = []
		selectedCouponId.value = null
		return
	}
	try {
		const list = await getMyCoupons({ status: 'unused' })
		const total = selectedTotal.value
		couponOptions.value = (list || [])
			.filter((item) => item.status === 'unused')
			.map((item) => {
				const minAmount = Number(item.minAmount || 0)
				const usable = total >= minAmount
				return {
					...item,
					desc: formatCouponDesc(item),
					usable,
					disabledReason: usable ? '' : `还差${formatYuanDisplay(Math.max(0, minAmount - total))}元可用`,
				}
			})
			.sort((a, b) => {
				if (a.usable !== b.usable) return a.usable ? -1 : 1
				return Number(b.amount) - Number(a.amount)
			})
		const usableCoupons = couponOptions.value.filter((item) => item.usable)
		applyAutoCouponSelection(selectedCouponId, usableCoupons, {
			userOptOutRef: couponUserOptOut,
		})
	} catch (error) {
		console.error('加载优惠券失败:', error)
		couponOptions.value = []
	}
}

const toggleSelectAll = () => {
	if (isAllSelected.value) {
		cartStore.clearSelection()
	} else {
		cartStore.selectAll()
	}
}

const removeItem = (courseId) => {
	uni.showModal({
		title: '提示',
		content: '确定从购物车移除该课程吗？',
		success: (res) => {
			if (res.confirm) {
				cartStore.removeCourse(courseId)
			}
		},
	})
}

const goBrowse = () => {
	uni.switchTab({ url: '/pages/category/index' })
}

const goCourse = (courseId) => {
	uni.navigateTo({ url: `/pages/sub-pages/course-intro/index?id=${courseId}` })
}

const openCouponPicker = async () => {
	await loadCoupons()
	tempSelectedCouponId.value = selectedCouponId.value
	couponPickerVisible.value = true
}

const closeCouponPicker = () => {
	couponPickerVisible.value = false
}

const pickTempCoupon = (item) => {
	if (item && !item.usable) return
	tempSelectedCouponId.value = item?.id ?? null
}

const confirmCouponPicker = () => {
	selectedCouponId.value = tempSelectedCouponId.value
	couponUserOptOut.value = tempSelectedCouponId.value == null
	closeCouponPicker()
}

const handleCheckout = async () => {
	if (!userStore.isLoggedIn) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		setTimeout(() => uni.navigateTo({ url: '/pages/login/index' }), 800)
		return
	}
	if (cartStore.selectedCount === 0 || checkoutLoading.value) return

	const courseIds = cartStore.selectedItems.map((item) => item.courseId)
	checkoutLoading.value = true
	try {
		const shippingAddress = selectedHasPaperExam.value ? await chooseWechatShippingAddress() : null
		const order = await createCartOrder({
			course_ids: courseIds,
			...(selectedCouponId.value ? { coupon_id: selectedCouponId.value } : {}),
			...(shippingAddress ? { shipping_address: shippingAddress } : {}),
		})

		if (!order?.payment_params) {
			cartStore.removeCourses(courseIds)
			await userStore.fetchUserInfo()
			uni.showToast({ title: '购买成功', icon: 'success' })
			return
		}

		if (blockVirtualPaymentIfNotReady(order)) return
		await invokeVirtualPayment(order.payment_params)
		await confirmWechatPayment({ order_no: order.order_no })
		cartStore.removeCourses(courseIds)
		await userStore.fetchUserInfo()
		uni.showToast({ title: '购买成功', icon: 'success' })
	} catch (error) {
		console.error('结算失败:', error)
		const errMsg = formatVirtualPaymentFailMessage(error)
		uni.showToast({
			title: errMsg,
			icon: 'none',
			duration: errMsg.includes('10 分钟') ? 3500 : 2000,
		})
	} finally {
		checkoutLoading.value = false
	}
}

watch(selectedTotal, () => {
	couponUserOptOut.value = false
	if (userStore.isLoggedIn && selectedTotal.value > 0) {
		loadCoupons()
	}
})

onShow(() => {
	cartStore.syncSelectedIds()
	if (userStore.isLoggedIn) {
		loadCoupons()
	}
})
</script>

<style scoped lang="scss">
.cart-page {
	min-height: 100vh;
	background: #f5f7fb;
	padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
}

.empty-wrap {
	padding: 180rpx 48rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.empty-icon {
	font-size: 96rpx;
}

.empty-title {
	margin-top: 24rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #111827;
}

.empty-desc {
	margin-top: 12rpx;
	font-size: 28rpx;
	color: #6b7280;
}

.empty-btn {
	margin-top: 40rpx;
	width: 280rpx;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 999rpx;
	background: #2563eb;
	color: #fff;
	font-size: 30rpx;
}

.toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 32rpx 8rpx;
}

.toolbar-count {
	font-size: 26rpx;
	color: #6b7280;
}

.toolbar-action {
	font-size: 26rpx;
	color: #2563eb;
}

.cart-list {
	max-height: calc(100vh - 360rpx);
	padding: 0 24rpx;
	box-sizing: border-box;
}

.cart-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	background: #fff;
	border-radius: 20rpx;
}

.cart-check {
	flex-shrink: 0;
}

.check-circle {
	width: 40rpx;
	height: 40rpx;
	border: 2rpx solid #d1d5db;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.check-circle.checked {
	background: #2563eb;
	border-color: #2563eb;
}

.check-mark {
	color: #fff;
	font-size: 24rpx;
	font-weight: 700;
}

.cart-cover {
	width: 140rpx;
	height: 140rpx;
	border-radius: 16rpx;
	background: #eef2f7;
	flex-shrink: 0;
}

.cart-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.cart-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #111827;
	line-height: 1.4;
}

.cart-type {
	font-size: 22rpx;
	color: #9ca3af;
}

.cart-price {
	font-size: 34rpx;
	font-weight: 700;
	color: #ef4444;
}

.cart-remove {
	flex-shrink: 0;
	font-size: 24rpx;
	color: #9ca3af;
	padding: 8rpx;
}

.coupon-row {
	margin: 8rpx 24rpx 0;
	padding: 28rpx 32rpx;
	background: #fff;
	border-radius: 20rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.coupon-label {
	font-size: 28rpx;
	color: #374151;
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

.cart-footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
	background: #fff;
	box-shadow: 0 -8rpx 28rpx rgba(15, 23, 42, 0.08);
}

.footer-total {
	flex: 1;
	min-width: 0;
}

.total-label {
	font-size: 24rpx;
	color: #6b7280;
}

.total-price {
	display: block;
	font-size: 40rpx;
	font-weight: 700;
	color: #ef4444;
	line-height: 1.2;
}

.total-discount {
	display: block;
	margin-top: 4rpx;
	font-size: 22rpx;
	color: #ef4444;
}

.checkout-btn {
	flex-shrink: 0;
	min-width: 240rpx;
	height: 88rpx;
	line-height: 88rpx;
	margin: 0;
	padding: 0 36rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #ff3f45 0%, #ff6b70 100%);
	color: #fff;
	font-size: 30rpx;
	font-weight: 700;
}

.checkout-btn[disabled] {
	opacity: 0.6;
}

.checkout-btn::after {
	border: none;
}

.coupon-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 1000;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
}

.coupon-panel {
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
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
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 32rpx 24rpx;
}

.coupon-panel-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #111827;
}

.coupon-panel-close {
	font-size: 28rpx;
	color: #6b7280;
}

.coupon-panel-list {
	flex: 1;
	max-height: 52vh;
	padding: 0 32rpx;
	box-sizing: border-box;
}

.coupon-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
	padding: 28rpx 32rpx;
	border: 2rpx solid #e5e7eb;
	border-radius: 20rpx;
	background: #fff;
}

.coupon-card.active {
	border-color: #2563eb;
	background: #eff6ff;
}

.coupon-card.disabled {
	opacity: 0.72;
}

.coupon-card-no-use {
	flex: 1;
	font-size: 28rpx;
	font-weight: 500;
	color: #111827;
}

.coupon-card-body {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 20rpx;
	min-width: 0;
}

.coupon-card-amount {
	font-size: 40rpx;
	font-weight: 700;
	color: #ef4444;
	min-width: 96rpx;
}

.coupon-card-info {
	flex: 1;
	min-width: 0;
}

.coupon-card-desc {
	font-size: 28rpx;
	color: #111827;
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
	border: 2rpx solid #d1d5db;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	background: #fff;
	flex-shrink: 0;
}

.coupon-radio.checked {
	border-color: #2563eb;
	background: #2563eb;
}

.coupon-radio.disabled {
	border-color: #e5e7eb;
	background: #f9fafb;
}

.coupon-radio-check {
	color: #fff;
	font-size: 24rpx;
	font-weight: 700;
}

.coupon-panel-footer {
	padding: 16rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
	border-top: 2rpx solid #f3f4f6;
}

.coupon-confirm-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 999rpx;
	background: #2563eb;
	color: #fff;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
}

.coupon-confirm-btn::after {
	border: none;
}
</style>
