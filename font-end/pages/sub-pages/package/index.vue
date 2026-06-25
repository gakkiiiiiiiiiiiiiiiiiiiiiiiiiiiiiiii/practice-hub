<template>
	<view class="vip-page">
		<view v-if="loading" class="empty">加载中...</view>
		<view v-else-if="sections.length === 0" class="empty">暂无套餐</view>
		<view v-else class="list">
			<view v-for="section in sections" :key="section.id" class="package-card" @click="openDetail(section)">
				<view class="package-badge-row">
					<text class="package-badge-icon">💰</text>
					<text class="package-badge">套餐更划算</text>
				</view>
				<view class="title-row">
					<text class="package-title">{{ section.name }}</text>
					<text v-if="section.isVip || section.coversAllCourses" class="vip-tag">VIP</text>
				</view>
				<text class="package-desc">{{ sectionDescription(section) }}</text>
				<view class="package-footer">
					<view class="package-price-block">
						<text v-if="getSectionMinPrice(section) > 0" class="package-price">¥{{ getSectionMinPrice(section) }} 起</text>
						<view class="package-tag">
							<text class="package-tag-icon">✓</text>
							<text class="package-tag-text">超值精品课包</text>
						</view>
					</view>
					<view class="package-buy-btn">立即购买 ›</view>
				</view>
				<text v-if="section.subscribed" class="expire">已购买，有效期至 {{ formatDate(section.expireTime) }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getPackageSections } from '@/api/index'

const loading = ref(false)
const sections = ref([])

const loadSections = async () => {
	loading.value = true
	try {
		sections.value = await getPackageSections()
	} catch (error) {
		console.error(error)
	} finally {
		loading.value = false
	}
}

const formatDate = (value) => {
	if (!value) return ''
	const date = new Date(value)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getEnabledPlans = (section) =>
	(section?.plans || []).filter((plan) => plan.status === undefined || Number(plan.status) === 1)

const getSectionMinPrice = (section) => {
	const prices = getEnabledPlans(section).map((plan) => Number(plan.price)).filter((price) => price > 0)
	return prices.length ? Math.min(...prices) : 0
}

const sectionDescription = (section) => {
	if (section?.isVip || section?.coversAllCourses) {
		return section.description || '购买后可浏览全站全部课程'
	}
	return section.description || '购买后可浏览套餐内全部课程'
}

const openDetail = (section) => {
	uni.navigateTo({ url: `/pages/sub-pages/package-detail/index?id=${section.id}` })
}

onShow(loadSections)
</script>

<style scoped>
.vip-page {
	min-height: 100vh;
	background: #f5f7fb;
	padding: 24rpx;
}

.package-card {
	padding: 28rpx 28rpx 24rpx;
	margin-bottom: 24rpx;
	border-radius: 24rpx;
	background:
		radial-gradient(circle at 20% 15%, rgba(255, 255, 255, 0.55) 0%, transparent 42%),
		linear-gradient(145deg, #edf7fb 0%, #e4f2f8 52%, #dceef6 100%);
	box-shadow: 0 10rpx 28rpx rgba(30, 84, 126, 0.08);
}

.package-card:active {
	opacity: 0.92;
	transform: scale(0.995);
}

.package-badge-row {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 6rpx 16rpx 6rpx 12rpx;
	margin-bottom: 16rpx;
	border-radius: 999rpx;
	background: rgba(120, 144, 160, 0.16);
}

.package-badge-icon {
	font-size: 24rpx;
	line-height: 1;
}

.package-badge {
	font-size: 22rpx;
	font-weight: 500;
	color: #5f7382;
	line-height: 1.2;
}

.title-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 10rpx;
}

.package-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #111827;
	line-height: 1.3;
}

.vip-tag {
	font-size: 22rpx;
	color: #92400e;
	background: #fef3c7;
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	flex-shrink: 0;
}

.package-desc {
	display: block;
	font-size: 26rpx;
	color: #374151;
	line-height: 1.55;
	margin-bottom: 24rpx;
}

.package-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.package-price-block {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
	flex: 1;
	min-width: 0;
}

.package-price {
	font-size: 34rpx;
	font-weight: 700;
	color: #1e547e;
	line-height: 1.2;
}

.package-tag {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
}

.package-tag-icon {
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	background: rgba(120, 144, 160, 0.18);
	color: #6b8494;
	font-size: 18rpx;
	line-height: 28rpx;
	text-align: center;
	flex-shrink: 0;
}

.package-tag-text {
	font-size: 22rpx;
	color: #7b909e;
	line-height: 1.2;
}

.package-buy-btn {
	flex-shrink: 0;
	padding: 14rpx 28rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, #22c9cd 0%, #17b5b9 100%);
	box-shadow: 0 6rpx 16rpx rgba(23, 181, 185, 0.28);
	color: #fff;
	font-size: 26rpx;
	font-weight: 600;
	line-height: 1.2;
}

.expire {
	display: block;
	margin-top: 20rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid rgba(120, 144, 160, 0.12);
	font-size: 24rpx;
	color: #16a34a;
}

.empty {
	padding: 120rpx 0;
	text-align: center;
	color: #9ca3af;
}
</style>
