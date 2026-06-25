<template>
	<view class="exam-result-page">
		<view class="result-header">
			<text class="result-title">考试结果</text>
		</view>

		<view class="result-content">
			<!-- 成绩卡片 -->
			<view class="score-card" :class="{ passed: examResult.is_passed === 1, failed: examResult.is_passed === 0 }">
				<view class="score-main">
					<text class="score-label">总分</text>
					<text class="score-value">{{ examResult.total_score }}/{{ examResult.full_score }}</text>
				</view>
				<view class="score-status">
					<text class="status-text">{{ examResult.is_passed === 1 ? '及格' : '不及格' }}</text>
				</view>
			</view>

			<!-- 统计信息 -->
			<view class="stats-section">
				<view class="stat-item">
					<text class="stat-value">{{ examResult.correct_count }}</text>
					<text class="stat-label">答对题目</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ examResult.total_count }}</text>
					<text class="stat-label">总题目数</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ examResult.accuracy }}%</text>
					<text class="stat-label">正确率</text>
				</view>
			</view>

			<!-- 考试用时 -->
			<view class="time-section">
				<text class="time-label">考试用时</text>
				<text class="time-value">{{ formatDuration(examResult.duration_seconds) }}</text>
			</view>

			<!-- 操作按钮 -->
			<view class="action-buttons">
				<button class="action-btn view-btn" @click="handleViewDetail">查看详情</button>
				<button class="action-btn retry-btn" @click="handleRetry">再次考试</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getExamRecordDetail } from '@/api/index';

const recordId = ref(null);
const examResult = ref({
	total_score: 0,
	full_score: 0,
	correct_count: 0,
	total_count: 0,
	accuracy: 0,
	is_passed: 0,
	duration_seconds: 0,
});

onLoad((options) => {
	if (options.recordId) {
		recordId.value = parseInt(options.recordId);
		loadExamResult();
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

const loadExamResult = async () => {
	try {
		uni.showLoading({ title: '加载中...' });
		const res = await getExamRecordDetail(recordId.value);
		// 计算满分（如果没有返回，从题目得分计算）
		const questionScores = res.question_scores || {};
		const fullScore = res.full_score || Object.values(questionScores).reduce((sum, score) => sum + Number(score || 0), 0);
		examResult.value = {
			total_score: Number(res.total_score || 0),
			full_score: Number(fullScore),
			correct_count: res.correct_count || 0,
			total_count: res.questions?.length || 0,
			accuracy: Number(res.accuracy || 0),
			is_passed: res.is_passed || 0,
			duration_seconds: res.duration_seconds || 0,
		};
		uni.hideLoading();
	} catch (error) {
		uni.hideLoading();
		uni.showToast({
			title: error.msg || '加载失败',
			icon: 'none',
		});
		setTimeout(() => {
			uni.navigateBack();
		}, 1500);
	}
};

const formatDuration = (seconds) => {
	if (!seconds) return '0分钟';
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}小时${minutes}分钟${secs}秒`;
	} else if (minutes > 0) {
		return `${minutes}分钟${secs}秒`;
	} else {
		return `${secs}秒`;
	}
};

const handleViewDetail = () => {
	// 跳转到考试详情页面（可以查看每道题的答案和解析）
	uni.navigateTo({
		url: `/pages/exam/detail?recordId=${recordId.value}`,
	});
};

const handleRetry = async () => {
	// 获取考试配置ID，跳转到考试信息页面
	try {
		const res = await getExamRecordDetail(recordId.value);
		if (res.exam_config_id) {
			uni.redirectTo({
				url: `/pages/exam/info?id=${res.exam_config_id}`,
			});
		} else {
			uni.navigateBack();
		}
	} catch (error) {
		uni.navigateBack();
	}
};
</script>

<style lang="scss" scoped>
.exam-result-page {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 40rpx;
}

.result-header {
	padding: 40rpx 30rpx;
	background-color: #fff;
	border-bottom: 1px solid #eee;

	.result-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
}

.result-content {
	padding: 30rpx;
}

.score-card {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 60rpx 30rpx;
	text-align: center;
	margin-bottom: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

	&.passed {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;

		.score-label,
		.score-value,
		.status-text {
			color: #fff;
		}
	}

	&.failed {
		background-color: #fff;
		border: 2rpx solid #ff6b6b;

		.score-value {
			color: #ff6b6b;
		}

		.status-text {
			color: #ff6b6b;
		}
	}

	.score-main {
		margin-bottom: 20rpx;

		.score-label {
			display: block;
			font-size: 28rpx;
			margin-bottom: 10rpx;
		}

		.score-value {
			display: block;
			font-size: 72rpx;
			font-weight: bold;
		}
	}

	.score-status {
		.status-text {
			font-size: 32rpx;
			font-weight: bold;
		}
	}
}

.stats-section {
	display: flex;
	justify-content: space-around;
	background-color: #fff;
	border-radius: 16rpx;
	padding: 40rpx 20rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

	.stat-item {
		text-align: center;

		.stat-value {
			display: block;
			font-size: 48rpx;
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

.time-section {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

	.time-label {
		font-size: 28rpx;
		color: #666;
	}

	.time-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
}

.action-buttons {
	display: flex;
	gap: 20rpx;

	.action-btn {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 44rpx;
		font-size: 32rpx;
		border: none;

		&.view-btn {
			background-color: #fff;
			color: #007aff;
			border: 2rpx solid #007aff;
		}

		&.retry-btn {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}
	}
}
</style>
