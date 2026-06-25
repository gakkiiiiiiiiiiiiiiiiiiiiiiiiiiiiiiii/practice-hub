<template>
	<view class="bank-settings-page">
		<custom-navbar title="题库设置" />

		<scroll-view class="settings-content" scroll-y>
			<!-- 字体大小设置 -->
			<view class="settings-section">
				<view class="section-header">
					<text class="section-title">字体大小</text>
					<text class="section-desc">调整题目和选项的字体大小</text>
				</view>
				<view class="font-size-options">
					<view
						v-for="size in fontSizeOptions"
						:key="size.value"
						class="font-size-option"
						:class="{ active: fontSize === size.value }"
						@click="setFontSize(size.value)"
					>
						<text class="font-size-label">{{ size.label }}</text>
						<view class="font-size-preview" :class="`preview-${size.value}`">
							<text class="preview-text">Aa</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 显示设置 -->
			<view class="settings-section">
				<view class="section-header">
					<text class="section-title">显示设置</text>
				</view>
				<view class="setting-list">
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">夜间模式</text>
							<text class="setting-desc">降低屏幕亮度，保护眼睛</text>
						</view>
						<switch :checked="nightMode" @change="toggleNightMode" color="#17C3A2" />
					</view>
				</view>
			</view>

			<!-- 练习设置 -->
			<view class="settings-section">
				<view class="section-header">
					<text class="section-title">练习设置</text>
				</view>
				<view class="setting-list">
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">答对自动下一题</text>
							<text class="setting-desc">答对后自动跳转到下一题</text>
						</view>
						<switch :checked="autoNextOnCorrect" @change="toggleAutoNextOnCorrect" color="#17C3A2" />
					</view>
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">答完自动下一题</text>
							<text class="setting-desc">答题后自动跳转到下一题（考试模式）</text>
						</view>
						<switch :checked="autoNextOnAnswer" @change="toggleAutoNextOnAnswer" color="#17C3A2" />
					</view>
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">答对自动移除错题集</text>
							<text class="setting-desc">答对后自动从错题集中移除</text>
						</view>
						<switch :checked="autoRemoveWrong" @change="toggleAutoRemoveWrong" color="#17C3A2" />
					</view>
				</view>
			</view>

			<!-- 音效设置 -->
			<view class="settings-section">
				<view class="section-header">
					<text class="section-title">音效设置</text>
				</view>
				<view class="setting-list">
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">答题音效</text>
							<text class="setting-desc">答题时播放提示音</text>
						</view>
						<switch :checked="answerSound" @change="toggleAnswerSound" color="#17C3A2" />
					</view>
				</view>
			</view>

			<!-- 重置设置 -->
			<view class="settings-section">
				<view class="section-header">
					<text class="section-title">其他</text>
				</view>
				<view class="setting-list">
					<view class="setting-row setting-row-button" @click="handleResetSettings">
						<view class="setting-info">
							<text class="setting-label">重置所有设置</text>
							<text class="setting-desc">恢复为默认设置</text>
						</view>
						<app-icon name="arrow-right" :size="20" color="#999" />
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useBankStore } from '@/store/bank';
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue';
import AppIcon from '@/components/app-icon/app-icon.vue';

const bankStore = useBankStore();

// 字体大小选项
const fontSizeOptions = [
	{ value: 'small', label: '小' },
	{ value: 'medium', label: '中' },
	{ value: 'large', label: '大' },
	{ value: 'xlarge', label: '特大' },
];

// 设置状态
const fontSize = ref(bankStore.settings.fontSize || 'medium');
const nightMode = ref(bankStore.settings.nightMode || false);
const autoNextOnCorrect = ref(bankStore.settings.autoNextOnCorrect !== false); // 默认开启
const autoNextOnAnswer = ref(bankStore.settings.autoNextOnAnswer !== false); // 默认开启
const autoRemoveWrong = ref(bankStore.settings.autoRemoveWrong || false);
const answerSound = ref(bankStore.settings.answerSound || false);

// 设置字体大小
const setFontSize = (size) => {
	fontSize.value = size;
	bankStore.updateSettings({ fontSize: size });
	uni.showToast({
		title: '字体大小已更新',
		icon: 'success',
		duration: 1500,
	});
};

// 切换夜间模式
const toggleNightMode = (e) => {
	nightMode.value = e.detail.value;
	bankStore.updateSettings({ nightMode: e.detail.value });
};

// 切换答对自动下一题
const toggleAutoNextOnCorrect = (e) => {
	autoNextOnCorrect.value = e.detail.value;
	bankStore.updateSettings({ autoNextOnCorrect: e.detail.value });
};

// 切换答完自动下一题
const toggleAutoNextOnAnswer = (e) => {
	autoNextOnAnswer.value = e.detail.value;
	bankStore.updateSettings({ autoNextOnAnswer: e.detail.value });
};

// 切换自动移除错题
const toggleAutoRemoveWrong = (e) => {
	autoRemoveWrong.value = e.detail.value;
	bankStore.updateSettings({ autoRemoveWrong: e.detail.value });
};

// 切换答题音效
const toggleAnswerSound = (e) => {
	answerSound.value = e.detail.value;
	bankStore.updateSettings({ answerSound: e.detail.value });
};

// 重置所有设置
const handleResetSettings = () => {
	uni.showModal({
		title: '确认重置',
		content: '确定要重置所有设置吗？将恢复为默认设置。',
		success: (res) => {
			if (res.confirm) {
				// 重置为默认值
				const defaultSettings = {
					fontSize: 'medium',
					nightMode: false,
					autoNextOnCorrect: true,
					autoNextOnAnswer: true,
					autoRemoveWrong: false,
					answerSound: false,
				};

				// 更新 store
				bankStore.updateSettings(defaultSettings);

				// 更新本地状态
				fontSize.value = defaultSettings.fontSize;
				nightMode.value = defaultSettings.nightMode;
				autoNextOnCorrect.value = defaultSettings.autoNextOnCorrect;
				autoNextOnAnswer.value = defaultSettings.autoNextOnAnswer;
				autoRemoveWrong.value = defaultSettings.autoRemoveWrong;
				answerSound.value = defaultSettings.answerSound;

				uni.showToast({
					title: '已重置为默认设置',
					icon: 'success',
				});
			}
		},
	});
};

onMounted(() => {
	// 从 store 同步最新设置
	fontSize.value = bankStore.settings.fontSize || 'medium';
	nightMode.value = bankStore.settings.nightMode || false;
	autoNextOnCorrect.value = bankStore.settings.autoNextOnCorrect !== false;
	autoNextOnAnswer.value = bankStore.settings.autoNextOnAnswer !== false;
	autoRemoveWrong.value = bankStore.settings.autoRemoveWrong || false;
	answerSound.value = bankStore.settings.answerSound || false;
});
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.bank-settings-page {
	min-height: 100vh;
	background-color: $bg-secondary;
}

.settings-content {
	height: calc(100vh - var(--status-bar-height) - 88rpx);
	padding: $space-8 $space-8;
	padding-top: calc(var(--status-bar-height) + 88rpx + $space-8);
	box-sizing: border-box;
	margin-top: 80rpx;
}

.settings-section {
	@include card;
	margin-bottom: $space-6;
	padding: $space-6;
}

.section-header {
	margin-bottom: $space-6;
}

.section-title {
	@include text(md, bold, primary);
	display: block;
	margin-bottom: $space-2;
}

.section-desc {
	@include text(xs, normal, secondary);
	display: block;
	color: $text-tertiary;
}

// 字体大小选项
.font-size-options {
	@include flex(row, space-between, center, $space-4);
	flex-wrap: wrap;
}

.font-size-option {
	@include flex(column, center, center, $space-2);
	flex: 1;
	min-width: 120rpx;
	padding: $space-4;
	border: 2rpx solid $border-light;
	border-radius: $radius-md;
	background-color: $bg-primary;
	transition: all $transition-base;
	cursor: pointer;

	&.active {
		border-color: $color-primary;
		background-color: $color-primary-container;
	}
}

.font-size-label {
	@include text(sm, medium, primary);
	margin-bottom: $space-2;
}

.font-size-preview {
	@include flex(row, center, center, 0);
	width: 60rpx;
	height: 60rpx;
	border-radius: $radius-sm;
	background-color: $bg-tertiary;

	&.preview-small {
		.preview-text {
			font-size: 24rpx;
		}
	}

	&.preview-medium {
		.preview-text {
			font-size: 30rpx;
		}
	}

	&.preview-large {
		.preview-text {
			font-size: 36rpx;
		}
	}

	&.preview-xlarge {
		.preview-text {
			font-size: 42rpx;
		}
	}
}

.preview-text {
	font-weight: $font-weight-bold;
	color: $text-primary;
}

// 设置列表
.setting-list {
	@include flex(column, flex-start, stretch, 0);
}

.setting-row {
	@include flex(row, space-between, center, $space-4);
	padding: $space-5 $space-4;
	border-bottom: 1rpx solid $border-light;
	transition: background-color $transition-base;

	&:last-child {
		border-bottom: none;
	}

	&:active {
		background-color: $bg-tertiary;
	}

	&.setting-row-button {
		cursor: pointer;
	}
}

.setting-info {
	@include flex(column, flex-start, flex-start, $space-1);
	flex: 1;
}

.setting-label {
	@include text(base, medium, primary);
	display: block;
}

.setting-desc {
	@include text(xs, normal, secondary);
	display: block;
	color: $text-tertiary;
	margin-top: $space-1;
}
</style>
