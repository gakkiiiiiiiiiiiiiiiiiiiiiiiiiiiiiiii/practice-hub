<template>
	<view class="faq-page">
		<view class="faq-hero">
			<text class="faq-title">常见问题</text>
			<text class="faq-subtitle">这里整理了使用课程、激活码和学习记录时最常遇到的问题</text>
		</view>

		<view v-if="loading" class="state-card">
			<text class="state-text">加载中...</text>
		</view>
		<view v-else-if="faqList.length === 0" class="state-card">
			<text class="state-text">暂无常见问题</text>
		</view>
		<view v-else class="faq-list">
			<view v-for="(item, index) in faqList" :key="index" class="faq-card">
				<view class="faq-question-row" @click="toggle(index)">
					<text class="faq-question">{{ item.question }}</text>
					<text class="faq-arrow" :class="{ open: activeIndex === index }">⌄</text>
				</view>
				<text v-if="activeIndex === index" class="faq-answer">{{ item.answer }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFaqList } from '@/api/index';

const loading = ref(false);
const faqList = ref([]);
const activeIndex = ref(0);

const loadFaqs = async () => {
	loading.value = true;
	try {
		const res = await getFaqList();
		faqList.value = Array.isArray(res) ? res : [];
	} catch (error) {
		console.error('加载常见问题失败:', error);
		uni.showToast({ title: '加载失败', icon: 'none' });
		faqList.value = [];
	} finally {
		loading.value = false;
	}
};

const toggle = (index) => {
	activeIndex.value = activeIndex.value === index ? -1 : index;
};

onMounted(loadFaqs);
</script>

<style lang="scss" scoped>
.faq-page {
	min-height: 100vh;
	background: #f5f7fb;
	padding: 32rpx;
	box-sizing: border-box;
}

.faq-hero {
	padding: 36rpx 34rpx;
	border-radius: 30rpx;
	background: linear-gradient(135deg, #326eff 0%, #6a8dff 100%);
	color: #fff;
	box-shadow: 0 18rpx 40rpx rgba(50, 110, 255, 0.22);
	margin-bottom: 28rpx;
}

.faq-title {
	display: block;
	font-size: 42rpx;
	font-weight: 800;
	margin-bottom: 12rpx;
}

.faq-subtitle {
	display: block;
	font-size: 26rpx;
	line-height: 1.55;
	color: rgba(255, 255, 255, 0.86);
}

.faq-list {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.faq-card,
.state-card {
	border-radius: 24rpx;
	background: #fff;
	padding: 28rpx;
	box-shadow: 0 8rpx 24rpx rgba(20, 32, 60, 0.06);
}

.faq-question-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.faq-question {
	flex: 1;
	font-size: 30rpx;
	font-weight: 700;
	color: #1f2937;
	line-height: 1.45;
}

.faq-arrow {
	width: 42rpx;
	height: 42rpx;
	border-radius: 50%;
	background: #eef3ff;
	color: #326eff;
	text-align: center;
	line-height: 42rpx;
	font-size: 28rpx;
	transition: transform 0.2s ease;
}

.faq-arrow.open {
	transform: rotate(180deg);
}

.faq-answer {
	display: block;
	margin-top: 22rpx;
	padding-top: 22rpx;
	border-top: 1rpx solid #eef0f5;
	font-size: 27rpx;
	line-height: 1.7;
	color: #5d6678;
	white-space: pre-wrap;
}

.state-card {
	text-align: center;
	padding: 80rpx 20rpx;
}

.state-text {
	font-size: 28rpx;
	color: #8a94a6;
}
</style>
