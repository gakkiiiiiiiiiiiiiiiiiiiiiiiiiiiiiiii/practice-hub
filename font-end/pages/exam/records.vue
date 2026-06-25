<template>
	<view class="exam-records-page">
		<view class="records-header">
			<text class="header-title">考试记录</text>
		</view>

		<view class="records-list" v-if="records.length > 0">
			<view class="record-item" v-for="record in records" :key="record.id" @click="handleViewDetail(record.id)">
				<view class="record-header">
					<text class="record-name">{{ record.exam_name }}</text>
					<text class="record-status" :class="{ passed: record.is_passed === 1, failed: record.is_passed === 0 }">
						{{ record.is_passed === 1 ? '及格' : '不及格' }}
					</text>
				</view>
				<view class="record-info">
					<text class="info-text">得分：{{ record.total_score }} 分</text>
					<text class="info-text">正确：{{ record.correct_count }} 题</text>
					<text class="info-text">正确率：{{ record.accuracy }}%</text>
				</view>
				<view class="record-time">
					<text class="time-text">{{ formatTime(record.submit_time) }}</text>
				</view>
			</view>
		</view>

		<view class="empty-tip" v-else>
			<text>暂无考试记录</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getExamRecords } from '@/api/index';

const examConfigId = ref(null);
const records = ref([]);

onLoad((options) => {
	if (options.examConfigId) {
		examConfigId.value = parseInt(options.examConfigId);
	}
	loadRecords();
});

const loadRecords = async () => {
	try {
		uni.showLoading({ title: '加载中...' });
		const res = await getExamRecords(examConfigId.value ? { examConfigId: examConfigId.value } : {});
		records.value = res || [];
		uni.hideLoading();
	} catch (error) {
		uni.hideLoading();
		uni.showToast({
			title: error.msg || '加载失败',
			icon: 'none',
		});
	}
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

const handleViewDetail = (recordId) => {
	uni.navigateTo({
		url: `/pages/exam/detail?recordId=${recordId}`,
	});
};
</script>

<style lang="scss" scoped>
.exam-records-page {
	min-height: 100vh;
	background-color: #f5f5f5;
}

.records-header {
	padding: 40rpx 30rpx;
	background-color: #fff;
	border-bottom: 1px solid #eee;

	.header-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
}

.records-list {
	padding: 30rpx;
}

.record-item {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

	.record-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;

		.record-name {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}

		.record-status {
			font-size: 24rpx;
			padding: 8rpx 16rpx;
			border-radius: 8rpx;

			&.passed {
				background-color: #e8f5e9;
				color: #4caf50;
			}

			&.failed {
				background-color: #ffebee;
				color: #f44336;
			}
		}
	}

	.record-info {
		display: flex;
		gap: 30rpx;
		margin-bottom: 20rpx;

		.info-text {
			font-size: 26rpx;
			color: #666;
		}
	}

	.record-time {
		.time-text {
			font-size: 24rpx;
			color: #999;
		}
	}
}

.empty-tip {
	text-align: center;
	padding: 100rpx 0;
	color: #999;
	font-size: 28rpx;
}
</style>
