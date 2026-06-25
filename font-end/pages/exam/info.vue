<template>
	<view class="exam-info-page">
		<view class="exam-header">
			<text class="exam-title">{{ examConfig.name || '模拟考试' }}</text>
		</view>

		<view class="exam-content">
			<view class="info-item">
				<text class="info-label">考试题目</text>
				<text class="info-value">{{ examConfig.name || '-' }}</text>
			</view>

			<view class="info-item">
				<text class="info-label">考题数量</text>
				<text class="info-value highlight">共 {{ examConfig.question_count || 0 }} 题目</text>
			</view>

			<view class="info-item">
				<text class="info-label">考试时间</text>
				<text class="info-value highlight">限时 {{ examConfig.duration || 0 }} 分钟</text>
			</view>

			<view class="info-item">
				<text class="info-label">合格标准</text>
				<text class="info-value highlight">
					满分 {{ examConfig.full_score || 0 }} 分, 及格 {{ examConfig.pass_score || 0 }} 分
				</text>
			</view>

			<view class="info-item">
				<text class="info-label">组题规则</text>
				<view class="info-value">
					<text v-if="examConfig.single_choice_count > 0" class="rule-text">
						单选题 {{ examConfig.single_choice_count }} 道, 每道 {{ examConfig.single_choice_score }} 分
					</text>
					<text v-if="examConfig.multiple_choice_count > 0" class="rule-text">
						多选题 {{ examConfig.multiple_choice_count }} 道, 每道 {{ examConfig.multiple_choice_score }} 分
					</text>
					<text v-if="examConfig.judge_count > 0" class="rule-text">
						判断题 {{ examConfig.judge_count }} 道, 每道 {{ examConfig.judge_score }} 分
					</text>
				</view>
			</view>

			<view class="info-item">
				<text class="info-label">考试规则</text>
				<text class="info-value">{{ examConfig.rules || '无' }}</text>
			</view>
		</view>

		<view class="exam-actions">
			<button class="action-btn record-btn" @click="handleViewRecords">考试记录</button>
			<button class="action-btn start-btn" @click="handleStartExam">开始答题</button>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getExamConfigDetail, startExam } from '@/api/index';

const examConfigId = ref(null);
const examConfig = ref({});

onLoad((options) => {
	if (options.id) {
		examConfigId.value = parseInt(options.id);
		loadExamConfig();
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

const loadExamConfig = async () => {
	try {
		uni.showLoading({ title: '加载中...' });
		const res = await getExamConfigDetail(examConfigId.value);
		examConfig.value = res;
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

const handleViewRecords = () => {
	uni.navigateTo({
		url: `/pages/exam/records?examConfigId=${examConfigId.value}`,
	});
};

const handleStartExam = async () => {
	try {
		uni.showLoading({ title: '准备考试中...' });
		const res = await startExam({ exam_config_id: examConfigId.value });
		console.log('startExam API 返回数据:', res);
		console.log('返回数据类型:', typeof res);
		console.log('是否有 questions:', res?.questions ? true : false);
		console.log('questions 类型:', Array.isArray(res?.questions));
		
		if (!res || !res.questions || !Array.isArray(res.questions)) {
			uni.hideLoading();
			uni.showToast({
				title: '考试数据格式错误',
				icon: 'none',
			});
			return;
		}

		uni.hideLoading();

		// 将考试数据存储到本地存储（避免 URL 参数长度限制）
		const examDataKey = `exam_data_${examConfigId.value}_${Date.now()}`;
		console.log('存储考试数据，key:', examDataKey);
		console.log('存储的数据:', res);
		uni.setStorageSync(examDataKey, res);
		
		// 验证存储是否成功
		const verifyData = uni.getStorageSync(examDataKey);
		console.log('验证存储数据:', verifyData);
		
		// 跳转到答题页面，传递考试数据 key（对 key 进行 URL 编码）
		const encodedKey = encodeURIComponent(examDataKey);
		console.log('编码后的 key:', encodedKey);
		uni.navigateTo({
			url: `/pages/answer/index?mode=exam&examConfigId=${examConfigId.value}&examDataKey=${encodedKey}`,
		});
	} catch (error) {
		uni.hideLoading();
		console.error('开始考试失败:', error);
		uni.showToast({
			title: error.msg || error.message || '开始考试失败',
			icon: 'none',
		});
	}
};
</script>

<style lang="scss" scoped>
.exam-info-page {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 40rpx;
}

.exam-header {
	padding: 40rpx 30rpx;
	background-color: #fff;
	border-bottom: 1px solid #eee;

	.exam-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
}

.exam-content {
	margin: 30rpx;
	padding: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 20rpx 0;
	border-bottom: 1px solid #f0f0f0;

	&:last-child {
		border-bottom: none;
	}

	.info-label {
		font-size: 28rpx;
		color: #666;
		min-width: 160rpx;
	}

	.info-value {
		flex: 1;
		font-size: 28rpx;
		color: #333;
		text-align: right;

		&.highlight {
			color: #007aff;
			font-weight: bold;
		}

		.rule-text {
			display: block;
			margin-bottom: 8rpx;

			&:last-child {
				margin-bottom: 0;
			}
		}
	}
}

.exam-actions {
	display: flex;
	gap: 20rpx;
	padding: 0 30rpx;
	margin-top: 40rpx;

	.action-btn {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 44rpx;
		font-size: 32rpx;
		border: none;

		&.record-btn {
			background-color: #fff;
			color: #007aff;
			border: 2rpx solid #007aff;
		}

		&.start-btn {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}
	}
}
</style>
