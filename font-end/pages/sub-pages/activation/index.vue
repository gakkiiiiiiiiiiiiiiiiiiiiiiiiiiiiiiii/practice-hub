<template>
	<view class="activation-page">
		<view class="activation-container">
			<view class="activation-header">
				<text class="header-title">激活码兑换</text>
				<text class="header-desc">请输入您的激活码，解锁更多题库内容</text>
			</view>

			<view class="activation-form">
				<input
					class="activation-input"
					type="text"
					placeholder="请输入激活码"
					v-model="activationCode"
					maxlength="20"
				/>
				<button class="activation-btn" :disabled="!activationCode || loading" @click="handleActivate">
					{{ loading ? '激活中...' : '立即激活' }}
				</button>
			</view>

			<view class="activation-tips">
				<text class="tips-title">使用说明：</text>
				<text class="tips-item">1. 激活码由字母和数字组成，不区分大小写</text>
				<text class="tips-item">2. 每个激活码仅可使用一次</text>
				<text class="tips-item">3. 激活成功后，相关题库将立即解锁</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import { useBankStore } from '@/store/bank';
import { previewRedeemCode, redeemCode } from '@/api/index';

const userStore = useUserStore();
const bankStore = useBankStore();

const activationCode = ref('');
const loading = ref(false);

const getPreviewTargetText = (preview) => {
	if (preview?.target_type === 'package') {
		const packageName = preview.package_name || preview.package?.name || '套餐/VIP';
		const planName = preview.plan_name || preview.package?.plan?.name || '';
		const days = preview.duration_days || preview.package?.plan?.duration_days;
		return {
			title: '确认激活套餐',
			content: `该激活码将激活「${packageName}${planName ? ` / ${planName}` : ''}」${days ? `，有效期${days}天` : ''}，确认使用吗？`,
		};
	}
	const courseName = preview.course_name || preview.course?.name || '该课程';
	return {
		title: '确认激活课程',
		content: `该激活码将激活「${courseName}」，确认使用吗？`,
	};
};

const handleActivate = async () => {
	if (!activationCode.value.trim()) {
		uni.showToast({
			title: '请输入激活码',
			icon: 'none',
		});
		return;
	}

	try {
		loading.value = true;
		const code = activationCode.value.trim().toUpperCase();
		const preview = await previewRedeemCode({ code });
		const targetText = getPreviewTargetText(preview);
		const confirmRes = await uni.showModal({
			title: targetText.title,
			content: targetText.content,
			confirmText: '确认激活',
			cancelText: '取消',
		});
		if (!confirmRes.confirm) {
			return;
		}
		const res = await redeemCode({
			code,
		});

		// 更新用户权限和课程信息
		if (res.course_id) {
			bankStore.setCurrentBank(res.course_id);
			uni.setStorageSync('course_auth_changed', Date.now());
			uni.$emit('course-auth-changed', { courseId: res.course_id });
		} else if (res.target_type === 'package') {
			uni.setStorageSync('course_auth_changed', Date.now());
			uni.$emit('course-auth-changed', { packageActivated: true });
		}
		if (userStore.fetchUserInfo) {
			userStore.fetchUserInfo();
		}

		uni.showToast({
			title: res.message || '激活成功',
			icon: 'success',
		});

		// 清空输入框
		activationCode.value = '';

		// 延迟返回
		setTimeout(() => {
			uni.navigateBack();
		}, 1500);
	} catch (error) {
		uni.showToast({
			title: error.message || '激活失败，请检查激活码',
			icon: 'none',
		});
	} finally {
		loading.value = false;
	}
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.activation-page {
	min-height: 100vh;
	background-color: $bg-secondary;
	padding: $space-8;
	box-sizing: border-box;
}

.activation-container {
	@include card(md);
	padding: $space-8;
	box-sizing: border-box;
	width: 100%;
	overflow: hidden;
}

.activation-header {
	text-align: center;
	margin-bottom: $space-8;
}

.header-title {
	@include text(lg, bold, primary);
	display: block;
	margin-bottom: $space-4;
}

.header-desc {
	@include text(sm, normal, secondary);
	display: block;
	line-height: $line-height-relaxed;
}

.activation-form {
	margin-bottom: $space-8;
	width: 100%;
	box-sizing: border-box;
}

.activation-input {
	width: 100%;
	height: 88rpx;
	padding: 0 $space-6;
	background-color: $bg-tertiary;
	border-radius: $radius-lg;
	@include text(md, medium, primary);
	text-align: center;
	letter-spacing: 4rpx;
	margin-bottom: $space-6;
	border: 2rpx solid transparent;
	box-sizing: border-box;
	overflow: hidden;
	text-overflow: ellipsis;
	transition: all $transition-fast;

	&:focus {
		border-color: $color-primary;
		background-color: $bg-primary;
	}
}

.activation-btn {
	@include button-primary;
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	text-align: center;

	&[disabled] {
		background-color: $bg-secondary;
		color: $text-tertiary;
		opacity: 0.6;
	}
}

.activation-tips {
	padding: $space-6;
	background-color: $bg-tertiary;
	border-radius: $radius-lg;
}

.tips-title {
	@include text(md, bold, primary);
	display: block;
	margin-bottom: $space-4;
}

.tips-item {
	@include text(sm, normal, secondary);
	display: block;
	line-height: $line-height-relaxed;
	margin-bottom: $space-2;
}
</style>
