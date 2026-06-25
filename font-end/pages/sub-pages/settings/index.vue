<template>
	<view class="settings-page">
		<view class="settings-list">
			<!-- 显示设置 -->
			<view class="settings-group">
				<view class="group-title">显示设置</view>
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-label">字体大小</text>
					</view>
					<picker
						mode="selector"
						:range="fontSizeOptions"
						:range-key="'label'"
						:value="fontSizeIndex"
						@change="handleFontSizeChange"
					>
						<view class="setting-value">{{ fontSizeOptions[fontSizeIndex].label }}</view>
					</picker>
				</view>
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-label">夜间模式</text>
					</view>
					<switch :checked="settings.nightMode" @change="handleNightModeChange" color="#007AFF" />
				</view>
			</view>

			<!-- 答题设置 -->
			<view class="settings-group">
				<view class="group-title">答题设置</view>
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-label">答对自动下一题</text>
						<text class="setting-desc">答对题目后自动跳转到下一题</text>
					</view>
					<switch :checked="settings.autoNextOnCorrect" @change="handleAutoNextOnCorrectChange" color="#007AFF" />
				</view>
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-label">选择答案后自动显示解析</text>
						<text class="setting-desc">选择答案后立即显示解析</text>
					</view>
					<switch :checked="settings.autoShowAnalysis" @change="handleAutoShowAnalysisChange" color="#007AFF" />
				</view>
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-label">答对后自动移除错题</text>
						<text class="setting-desc">答对后自动从错题集中移除</text>
					</view>
					<switch :checked="settings.autoRemoveWrong" @change="handleAutoRemoveWrongChange" color="#007AFF" />
				</view>
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-label">答题音效</text>
						<text class="setting-desc">答题时播放提示音</text>
					</view>
					<switch :checked="settings.answerSound" @change="handleAnswerSoundChange" color="#007AFF" />
				</view>
			</view>

			<!-- 其他设置 -->
			<view class="settings-group">
				<view class="group-title">其他</view>
				<view class="setting-item" @click="handleResetSettings">
					<view class="setting-left">
						<text class="setting-label">重置设置</text>
						<text class="setting-desc">恢复为默认设置</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="setting-arrow" />
				</view>
				<view class="setting-item" @click="handleClearCache">
					<view class="setting-left">
						<text class="setting-label">清除缓存</text>
						<text class="setting-desc">清除本地缓存数据</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="setting-arrow" />
				</view>
				<view class="setting-item" @click="handleAbout">
					<view class="setting-left">
						<text class="setting-label">关于我们</text>
						<text class="setting-desc">版本信息与帮助</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="setting-arrow" />
				</view>
				<view class="setting-item" @click="handlePrivacy">
					<view class="setting-left">
						<text class="setting-label">隐私政策</text>
						<text class="setting-desc">查看隐私政策</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="setting-arrow" />
				</view>
				<view class="setting-item" @click="handleTerms">
					<view class="setting-left">
						<text class="setting-label">用户协议</text>
						<text class="setting-desc">查看用户协议</text>
					</view>
					<app-icon name="arrow-right" :size="24" class="setting-arrow" />
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useBankStore } from '@/store/bank';
import AppIcon from '@/components/app-icon/app-icon.vue';

const bankStore = useBankStore();

const fontSizeOptions = [
	{ label: '小', value: 'small' },
	{ label: '中', value: 'medium' },
	{ label: '大', value: 'large' },
	{ label: '超大', value: 'xlarge' },
];

const settings = ref({
	fontSize: 'medium',
	nightMode: false,
	autoNextOnCorrect: true,
	autoNextOnAnswer: true,
	autoShowAnalysis: false,
	autoRemoveWrong: false,
	answerSound: false,
});

const fontSizeIndex = computed(() => {
	return fontSizeOptions.findIndex((item) => item.value === settings.value.fontSize);
});

onMounted(() => {
	// 从 store 加载设置
	settings.value = { ...bankStore.settings };
});

const handleFontSizeChange = (e) => {
	const index = e.detail.value;
	settings.value.fontSize = fontSizeOptions[index].value;
	bankStore.updateSettings({ fontSize: settings.value.fontSize });
	uni.showToast({
		title: '设置已保存',
		icon: 'success',
		duration: 1500,
	});
};

const handleNightModeChange = (e) => {
	settings.value.nightMode = e.detail.value;
	bankStore.updateSettings({ nightMode: settings.value.nightMode });
	uni.showToast({
		title: '设置已保存',
		icon: 'success',
		duration: 1500,
	});
};

const handleAutoNextOnCorrectChange = (e) => {
	settings.value.autoNextOnCorrect = e.detail.value;
	bankStore.updateSettings({ autoNextOnCorrect: settings.value.autoNextOnCorrect });
};

const handleAutoNextOnAnswerChange = (e) => {
	settings.value.autoNextOnAnswer = e.detail.value;
	bankStore.updateSettings({ autoNextOnAnswer: settings.value.autoNextOnAnswer });
};

const handleAutoShowAnalysisChange = (e) => {
	settings.value.autoShowAnalysis = e.detail.value;
	bankStore.updateSettings({ autoShowAnalysis: settings.value.autoShowAnalysis });
};

const handleAutoRemoveWrongChange = (e) => {
	settings.value.autoRemoveWrong = e.detail.value;
	bankStore.updateSettings({ autoRemoveWrong: settings.value.autoRemoveWrong });
};

const handleAnswerSoundChange = (e) => {
	settings.value.answerSound = e.detail.value;
	bankStore.updateSettings({ answerSound: settings.value.answerSound });
};

const handleResetSettings = () => {
	uni.showModal({
		title: '提示',
		content: '确定要重置所有设置吗？',
		success: (res) => {
			if (res.confirm) {
				// 重置为默认设置
				const defaultSettings = {
					fontSize: 'medium',
					nightMode: false,
					autoNextOnCorrect: true,
					autoNextOnAnswer: true,
					autoShowAnalysis: false,
					autoRemoveWrong: false,
					answerSound: false,
				};
				bankStore.updateSettings(defaultSettings);
				settings.value = { ...defaultSettings };
				uni.showToast({
					title: '设置已重置',
					icon: 'success',
				});
			}
		},
	});
};

const handleClearCache = () => {
	uni.showModal({
		title: '提示',
		content: '确定要清除缓存吗？清除后需要重新登录。',
		success: (res) => {
			if (res.confirm) {
				// 清除所有本地存储
				uni.clearStorageSync();
				uni.showToast({
					title: '缓存已清除',
					icon: 'success',
				});
				setTimeout(() => {
					uni.reLaunch({
						url: '/pages/login/index',
					});
				}, 1500);
			}
		},
	});
};

const handleAbout = () => {
	uni.showModal({
		title: '关于我们',
		content: '考研刷题小程序\n版本：v1.0.0\n\n致力于为考研学子提供优质的刷题体验，助力考研成功！',
		showCancel: false,
		confirmText: '知道了',
	});
};

const handlePrivacy = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/agreement/index?type=privacy',
	});
};

const handleTerms = () => {
	uni.navigateTo({
		url: '/pages/sub-pages/agreement/index?type=terms',
	});
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.settings-page {
	min-height: 100vh;
	background-color: $bg-secondary;
	padding: $space-4;
}

.settings-list {
	padding-bottom: $space-8;
}

.settings-group {
	@include card(md);
	margin-bottom: $space-4;
	overflow: hidden;
}

.group-title {
	padding: $space-4 $space-6;
	@include text(sm, semibold, secondary);
	color: $text-secondary;
	background-color: $bg-tertiary;
	border-bottom: 1rpx solid $color-neutral-200;
}

.setting-item {
	@include flex(row, space-between, center, 0);
	padding: $space-6;
	border-bottom: 1rpx solid $color-neutral-200;
	transition: background-color $transition-fast;

	&:last-child {
		border-bottom: none;
	}

	&:active {
		background-color: $color-neutral-100;
	}
}

.setting-left {
	@include flex(column, flex-start, flex-start, $space-1);
	flex: 1;
}

.setting-label {
	@include text(base, normal, primary);
}

.setting-desc {
	@include text(xs, normal, secondary);
	color: $text-secondary;
}

.setting-value {
	@include text(base, normal, secondary);
	color: $text-secondary;
	padding: $space-2 $space-4;
}

.setting-arrow {
	color: $text-secondary;
}
</style>
