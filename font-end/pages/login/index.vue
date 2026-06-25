<template>
	<view class="login-page">
		<view class="login-container">
			<view class="login-header">
				<text class="login-title">欢迎使用</text>
				<text class="login-subtitle">考研刷题小程序</text>
			</view>

			<view class="login-content">
				<view class="login-mode-tabs">
					<text
						class="mode-tab"
						:class="{ active: loginMode === 'wechat' }"
						@click="loginMode = 'wechat'"
					>
						微信登录
					</text>
					<text
						class="mode-tab"
						:class="{ active: loginMode === 'account' }"
						@click="loginMode = 'account'"
					>
						账号登录
					</text>
				</view>

				<template v-if="loginMode === 'wechat'">
				<!-- 微信登录 -->
				<button class="login-btn wx-login" @click="handleWxLogin">
					<text class="btn-icon">💬</text>
					<text class="btn-text">微信一键登录</text>
				</button>
				<button
					class="login-btn phone-quick-login"
					open-type="getPhoneNumber"
					@getphonenumber="handlePhoneQuickLogin"
				>
					<text class="btn-icon">📱</text>
					<text class="btn-text">手机号快捷登录</text>
				</button>
				</template>

				<view v-else class="account-login-panel">
					<input
						class="account-input"
						v-model="accountUsername"
						placeholder="请输入用户名（4-20位字母数字下划线）"
						placeholder-style="color: #999"
						maxlength="20"
					/>
					<input
						class="account-input"
						v-model="accountPassword"
						password
						placeholder="请输入密码（至少6位）"
						placeholder-style="color: #999"
						maxlength="32"
					/>
					<input
						v-if="isRegisterMode"
						class="account-input"
						v-model="accountNickname"
						placeholder="昵称（可选）"
						placeholder-style="color: #999"
						maxlength="50"
					/>
					<button
						class="login-btn account-submit"
						:loading="accountLoading"
						@click="isRegisterMode ? handleAccountRegister() : handleAccountLogin()"
					>
						<text class="btn-text">{{ isRegisterMode ? '注册并登录' : '账号登录' }}</text>
					</button>
					<view class="account-switch-row">
						<text class="account-switch-text" @click="isRegisterMode = !isRegisterMode">
							{{ isRegisterMode ? '已有账号？去登录' : '没有账号？立即注册' }}
						</text>
					</view>
					<text class="account-tip">账号登录最多支持 3 台设备同时在线</text>
				</view>

				<!-- 手机号登录 -->
				<!-- <view class="login-form" v-if="showPhoneLogin">
					<input class="form-input" type="number" placeholder="请输入手机号" v-model="phone" maxlength="11" />
					<input class="form-input" type="number" placeholder="请输入验证码" v-model="code" maxlength="6" />
					<view class="code-row">
						<input class="form-input code-input" v-model="code" />
						<button class="code-btn" :disabled="codeCountdown > 0" @click="sendCode">
							{{ codeCountdown > 0 ? `${codeCountdown}秒` : '获取验证码' }}
						</button>
					</view>
					<button class="login-btn phone-login" @click="handlePhoneLogin">
						<text class="btn-text">登录</text>
					</button>
				</view> -->

				<!-- 切换登录方式 -->
				<!-- <view class="login-switch">
					<text class="switch-text" @click="showPhoneLogin = !showPhoneLogin">
						{{ showPhoneLogin ? '使用微信登录' : '使用手机号登录' }}
					</text>
				</view> -->

				<!-- 协议 -->
				<view class="login-agreement">
					<checkbox-group @change="handleAgreementChange">
						<label class="agreement-item">
							<checkbox value="agree" :checked="agreed" />
							<text class="agreement-text">
								我已阅读并同意
								<text class="agreement-link" @click.stop="showAgreement('privacy')">《隐私政策》</text>
								和
								<text class="agreement-link" @click.stop="showAgreement('terms')">《用户协议》</text>
							</text>
						</label>
					</checkbox-group>
				</view>
			</view>
		</view>
		<view v-if="showProfileModal" class="profile-modal-mask">
			<view class="profile-modal">
				<text class="modal-title">完善个人资料</text>
				<text class="modal-desc">选择微信头像或填写昵称，方便识别学习记录</text>
				<button class="avatar-picker modal-avatar-picker" open-type="chooseAvatar" @chooseavatar="handleChooseWechatAvatar">
					<image class="wechat-avatar" :src="wechatAvatar || userStore.userInfo?.avatar || defaultAvatar" mode="aspectFill" />
				</button>
				<input
					class="nickname-input"
					type="nickname"
					v-model="wechatNickname"
					placeholder="请输入微信昵称"
					placeholder-style="color: #999"
				/>
				<view class="modal-actions">
					<button class="modal-btn skip-btn" @click="handleSkipProfile">稍后再说</button>
					<button class="modal-btn save-profile-btn" :loading="profileSaving" @click="handleSaveProfile">
						保存
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { appLogin, appPhoneLogin, appRegister, appPasswordLogin, updateUserProfile, uploadImage } from '@/api/index';
import {
	getPendingReferralUserId,
	clearPendingReferralUserId,
	captureReferralFromEnterOptions,
} from '@/utils/referral';
import { formatLoginCloudErrorMessage } from '@/utils/cloud-config';
import { getDeviceMeta } from '@/utils/device-id';

const userStore = useUserStore();

onShow(() => {
	captureReferralFromEnterOptions();
});

const showPhoneLogin = ref(false);
const phone = ref('');
const code = ref('');
const codeCountdown = ref(0);
const agreed = ref(false);
const defaultAvatar = '/static/default-avatar.png';
const wechatAvatar = ref('');
const wechatNickname = ref('');
const showProfileModal = ref(false);
const profileSaving = ref(false);
const pendingNavigateAfterProfile = ref(false);
const loginMode = ref('wechat');
const isRegisterMode = ref(false);
const accountUsername = ref('');
const accountPassword = ref('');
const accountNickname = ref('');
const accountLoading = ref(false);

let countdownTimer = null;

const handleChooseWechatAvatar = (e) => {
	const avatarUrl = e?.detail?.avatarUrl || '';
	if (avatarUrl) {
		wechatAvatar.value = avatarUrl;
	}
};

const isValidationError = (error) => {
	const message = error?.message || error?.msg || error?.errMsg || '';
	return message.includes('请求参数验证失败');
};

const showLoginError = (error) => {
	const message = formatLoginCloudErrorMessage(error);
	if (message.includes('连接云服务')) {
		uni.showModal({
			title: '登录失败',
			content: message.replace(/^登录失败：?/, ''),
			showCancel: false,
			confirmText: '我知道了',
		});
		return;
	}
	uni.showToast({
		title: message,
		icon: 'none',
		duration: message.length > 14 ? 3500 : 3000,
	});
};

const validateAccountForm = () => {
	const username = accountUsername.value.trim();
	const password = accountPassword.value;
	if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
		uni.showToast({ title: '用户名需为4-20位字母数字下划线', icon: 'none' });
		return null;
	}
	if (!password || password.length < 6) {
		uni.showToast({ title: '密码至少6位', icon: 'none' });
		return null;
	}
	return { username, password };
};

const finishAccountAuth = async (res) => {
	persistLoginResult(res);
	uni.hideLoading();
	uni.showToast({
		title: '登录成功',
		icon: 'success',
		duration: 1500,
	});
	if (!(await promptProfileCompletionIfNeeded(res))) {
		navigateAfterLogin();
	}
};

const handleAccountLogin = async () => {
	if (!agreed.value) {
		uni.showToast({ title: '请先同意用户协议', icon: 'none' });
		return;
	}
	const form = validateAccountForm();
	if (!form) return;

	try {
		accountLoading.value = true;
		uni.showLoading({ title: '登录中...' });
		const res = await appPasswordLogin({
			username: form.username,
			password: form.password,
			...getDeviceMeta(),
		});
		await finishAccountAuth(res);
	} catch (error) {
		console.error('账号登录失败:', error);
		uni.hideLoading();
		showLoginError(error);
	} finally {
		accountLoading.value = false;
	}
};

const handleAccountRegister = async () => {
	if (!agreed.value) {
		uni.showToast({ title: '请先同意用户协议', icon: 'none' });
		return;
	}
	const form = validateAccountForm();
	if (!form) return;

	try {
		accountLoading.value = true;
		uni.showLoading({ title: '注册中...' });
		const payload = {
			username: form.username,
			password: form.password,
			...getDeviceMeta(),
		};
		const nickname = accountNickname.value.trim();
		if (nickname) payload.nickname = nickname;
		const pendingReferralUserId = getPendingReferralUserId();
		if (pendingReferralUserId) payload.referral_user_id = pendingReferralUserId;
		const res = await appRegister(payload);
		clearPendingReferralUserId(pendingReferralUserId);
		await finishAccountAuth(res);
	} catch (error) {
		console.error('账号注册失败:', error);
		uni.hideLoading();
		showLoginError(error);
	} finally {
		accountLoading.value = false;
	}
};

const getWxLoginCode = async () => {
	// #ifdef MP-WEIXIN
	const loginRes = await wx.login();
	// #endif
	// #ifndef MP-WEIXIN
	const loginRes = await uni.login({ provider: 'weixin' });
	// #endif

	if (!loginRes.code) {
		throw new Error('获取微信登录凭证失败');
	}
	return loginRes.code;
};

const getPendingDistributorCode = () => uni.getStorageSync('pending_distributor_code') || '';

const clearPendingDistributorCode = (pendingDistributorCode) => {
	if (pendingDistributorCode) {
		uni.removeStorageSync('pending_distributor_code');
	}
};

const persistLoginResult = (res) => {
	if (res.token) {
		uni.setStorageSync('auth_token', res.token);
		userStore.setToken(res.token);
	}
	if (res.user) {
		uni.setStorageSync('user_info', res.user);
		userStore.setUserInfo(res.user);
	}
};

const needsProfileCompletion = (userInfo = userStore.userInfo) => {
	const nickname = String(userInfo?.nickname || '').trim();
	const avatar = String(userInfo?.avatar || '').trim();
	return !avatar || !nickname || nickname === '新用户' || nickname === '微信用户';
};

const saveSelectedWechatProfile = async (res) => {
	if (!res?.token) return;
	const nickname = wechatNickname.value.trim();
	if (!wechatAvatar.value && !nickname) return;

	try {
		let avatarUrl = userStore.userInfo?.avatar || res.user?.avatar || '';
		if (wechatAvatar.value) {
			const uploadRes = await uploadImage(wechatAvatar.value);
			avatarUrl = uploadRes?.url || uploadRes?.imageUrl || avatarUrl;
		}
		await updateUserProfile({
			nickname: nickname || userStore.userInfo?.nickname || res.user?.nickname || '微信用户',
			avatar: avatarUrl,
		});
		const nextUserInfo = {
			...(userStore.userInfo || res.user || {}),
			nickname: nickname || userStore.userInfo?.nickname || res.user?.nickname || '微信用户',
			avatar: avatarUrl,
		};
		uni.setStorageSync('user_info', nextUserInfo);
		userStore.setUserInfo(nextUserInfo);
	} catch (avatarError) {
		console.warn('微信资料保存失败，可在个人资料中重新设置:', avatarError);
	}
};

const promptProfileCompletionIfNeeded = async (res) => {
	if (!needsProfileCompletion(res?.user || userStore.userInfo)) {
		return false;
	}
	wechatNickname.value = userStore.userInfo?.nickname && !['新用户', '微信用户'].includes(userStore.userInfo.nickname)
		? userStore.userInfo.nickname
		: '';
	showProfileModal.value = true;
	pendingNavigateAfterProfile.value = true;
	return true;
};

const navigateAfterLogin = () => {
	setTimeout(() => {
		try {
			const pages = getCurrentPages();
			console.log(
				'当前页面栈:',
				pages.length,
				pages.map((p) => p.route),
			);

			if (pages.length > 1) {
				uni.navigateBack({
					delta: 1,
					fail: () => {
						uni.switchTab({
							url: '/pages/index/index',
						});
					},
				});
			} else {
				uni.switchTab({
					url: '/pages/index/index',
					fail: () => {
						uni.reLaunch({
							url: '/pages/index/index',
						});
					},
				});
			}
		} catch (error) {
			console.error('页面跳转异常:', error);
			uni.reLaunch({
				url: '/pages/index/index',
			});
		}
	}, 1500);
};

const handleWxLogin = async () => {
	if (!agreed.value) {
		uni.showToast({
			title: '请先同意用户协议',
			icon: 'none',
		});
		return;
	}
	try {
		uni.showLoading({ title: '登录中...' });
		const loginCode = await getWxLoginCode();
		console.log('获取到微信 code:', loginCode);

		// 调用后端登录接口。扫码进入时会在首页缓存分销商编号，登录时带给后端绑定关系。
		const pendingDistributorCode = getPendingDistributorCode();
		const pendingReferralUserId = getPendingReferralUserId();
		const loginPayload = {
			code: loginCode,
			...(pendingDistributorCode ? { distributor_code: pendingDistributorCode } : {}),
			...(pendingReferralUserId ? { referral_user_id: pendingReferralUserId } : {}),
		};
		let res;
		try {
			res = await appLogin(loginPayload);
		} catch (error) {
			if (!isValidationError(error)) {
				throw error;
			}
			console.warn('登录资料字段暂未被后端接受，降级为基础登录:', error);
			res = await appLogin({
				code: loginCode,
				...(pendingDistributorCode ? { distributor_code: pendingDistributorCode } : {}),
				...(pendingReferralUserId ? { referral_user_id: pendingReferralUserId } : {}),
			});
		}
		clearPendingDistributorCode(pendingDistributorCode);
		clearPendingReferralUserId(pendingReferralUserId);

		console.log('登录接口返回:', res);

		persistLoginResult(res);

		uni.hideLoading();
		uni.showToast({
			title: '登录成功',
			icon: 'success',
			duration: 1500,
		});

		if (!(await promptProfileCompletionIfNeeded(res))) {
			navigateAfterLogin();
		}
	} catch (error) {
		console.error('登录失败:', error);
		console.error('错误详情:', {
			message: error.message,
			stack: error.stack,
			error: error,
		});
		uni.hideLoading();

		showLoginError(error);
	}
};

const handlePhoneQuickLogin = async (e) => {
	if (!agreed.value) {
		uni.showToast({
			title: '请先同意用户协议',
			icon: 'none',
		});
		return;
	}
	const phoneCode = e?.detail?.code || '';
	if (!phoneCode) {
		uni.showToast({
			title: e?.detail?.errMsg?.includes('deny') ? '已取消手机号授权' : '获取手机号失败',
			icon: 'none',
		});
		return;
	}

	try {
		uni.showLoading({ title: '登录中...' });
		const loginCode = await getWxLoginCode();
		const pendingDistributorCode = getPendingDistributorCode();
		const pendingReferralUserId = getPendingReferralUserId();
		const res = await appPhoneLogin({
			loginCode,
			phoneCode,
			...(pendingDistributorCode ? { distributor_code: pendingDistributorCode } : {}),
			...(pendingReferralUserId ? { referral_user_id: pendingReferralUserId } : {}),
			...(wechatNickname.value.trim() ? { nickname: wechatNickname.value.trim() } : {}),
		});
		clearPendingDistributorCode(pendingDistributorCode);
		clearPendingReferralUserId(pendingReferralUserId);
		persistLoginResult(res);
		uni.hideLoading();
		uni.showToast({
			title: '登录成功',
			icon: 'success',
			duration: 1500,
		});
		if (!(await promptProfileCompletionIfNeeded(res))) {
			navigateAfterLogin();
		}
	} catch (error) {
		console.error('手机号快捷登录失败:', error);
		uni.hideLoading();
		showLoginError(error);
	}
};

const handleSkipProfile = () => {
	showProfileModal.value = false;
	if (pendingNavigateAfterProfile.value) {
		pendingNavigateAfterProfile.value = false;
		navigateAfterLogin();
	}
};

const handleSaveProfile = async () => {
	if (!wechatAvatar.value && !wechatNickname.value.trim()) {
		uni.showToast({
			title: '请选择头像或填写昵称',
			icon: 'none',
		});
		return;
	}
	profileSaving.value = true;
	try {
		await saveSelectedWechatProfile({ token: userStore.token, user: userStore.userInfo });
		showProfileModal.value = false;
		uni.showToast({
			title: '保存成功',
			icon: 'success',
		});
		if (pendingNavigateAfterProfile.value) {
			pendingNavigateAfterProfile.value = false;
			navigateAfterLogin();
		}
	} finally {
		profileSaving.value = false;
	}
};

const sendCode = async () => {
	if (!phone.value || phone.value.length !== 11) {
		uni.showToast({
			title: '请输入正确的手机号',
			icon: 'none',
		});
		return;
	}

	try {
		// 调用发送验证码接口
		// await post('/auth/send-code', { phone: phone.value })

		uni.showToast({
			title: '验证码已发送',
			icon: 'success',
		});

		// 开始倒计时
		codeCountdown.value = 60;
		countdownTimer = setInterval(() => {
			codeCountdown.value--;
			if (codeCountdown.value <= 0) {
				clearInterval(countdownTimer);
			}
		}, 1000);
	} catch (error) {
		uni.showToast({
			title: '发送失败，请重试',
			icon: 'none',
		});
	}
};

const handlePhoneLogin = async () => {
	if (!agreed.value) {
		uni.showToast({
			title: '请先同意用户协议',
			icon: 'none',
		});
		return;
	}

	if (!phone.value || phone.value.length !== 11) {
		uni.showToast({
			title: '请输入正确的手机号',
			icon: 'none',
		});
		return;
	}

	if (!code.value || code.value.length !== 6) {
		uni.showToast({
			title: '请输入验证码',
			icon: 'none',
		});
		return;
	}

	try {
		uni.showLoading({ title: '登录中...' });

		await userStore.login({
			phone: phone.value,
			code: code.value,
		});

		uni.hideLoading();
		uni.showToast({
			title: '登录成功',
			icon: 'success',
		});

		setTimeout(() => {
			const pages = getCurrentPages();
			if (pages.length > 1) {
				uni.navigateBack();
			} else {
				uni.switchTab({
					url: '/pages/index/index',
				});
			}
		}, 1500);
	} catch (error) {
		uni.hideLoading();
		uni.showToast({
			title: error.message || '登录失败',
			icon: 'none',
		});
	}
};

const handleAgreementChange = (e) => {
	agreed.value = e.detail.value.includes('agree');
};

const showAgreement = (type) => {
	uni.navigateTo({
		url: `/pages/sub-pages/agreement/index?type=${type}`,
	});
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.login-page {
	min-height: 100vh;
	@include gradient(135deg, $color-primary, $color-primary-dark);
	@include flex(row, center, center, 0);
	padding: $space-8;
	font-family: $font-family-base;
}

.login-container {
	width: 100%;
	max-width: 600rpx;
	@include card(lg);
	padding: $space-12;
	animation: scaleIn $transition-base;
}

.login-header {
	text-align: center;
	margin-bottom: $space-12;
}

.login-title {
	display: block;
	@include text(xl, bold, primary);
	margin-bottom: $space-4;
}

.login-subtitle {
	display: block;
	@include text(base, normal, secondary);
}

.login-content {
	margin-bottom: $space-6;
}

.login-mode-tabs {
	display: flex;
	justify-content: center;
	gap: $space-8;
	margin-bottom: $space-8;
}

.mode-tab {
	font-size: 30rpx;
	color: rgba(255, 255, 255, 0.75);
	padding-bottom: 8rpx;
	border-bottom: 4rpx solid transparent;

	&.active {
		color: #fff;
		font-weight: 600;
		border-bottom-color: #fff;
	}
}

.account-login-panel {
	display: flex;
	flex-direction: column;
	gap: $space-4;
}

.account-input {
	width: 100%;
	height: 88rpx;
	box-sizing: border-box;
	padding: 0 $space-5;
	border-radius: 44rpx;
	background: rgba(255, 255, 255, 0.95);
	font-size: 30rpx;
	color: $text-primary;
}

.account-submit {
	background: #1677ff;
	color: $text-inverse;
	margin-top: $space-2;
}

.account-switch-row {
	text-align: center;
}

.account-switch-text {
	font-size: 26rpx;
	color: $color-primary;
	text-decoration: underline;
}

.account-tip {
	font-size: 24rpx;
	color: $text-tertiary;
	text-align: center;
	line-height: 1.5;
}

.profile-modal-mask {
	position: fixed;
	inset: 0;
	z-index: 50;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx;
	background: rgba(0, 0, 0, 0.45);
}

.profile-modal {
	width: 100%;
	max-width: 620rpx;
	box-sizing: border-box;
	padding: 48rpx 36rpx 36rpx;
	border-radius: 32rpx;
	background: #fff;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24rpx;
	box-shadow: 0 24rpx 70rpx rgba(0, 0, 0, 0.22);
}

.modal-title {
	font-size: 36rpx;
	font-weight: 700;
	color: $text-primary;
}

.modal-desc {
	font-size: 26rpx;
	color: $text-secondary;
	text-align: center;
	line-height: 1.5;
}

.modal-avatar-picker {
	margin-top: 8rpx;
}

.modal-actions {
	width: 100%;
	display: flex;
	gap: 20rpx;
	margin-top: 8rpx;
}

.modal-btn {
	flex: 1;
	height: 78rpx;
	line-height: 78rpx;
	margin: 0;
	padding: 0;
	border-radius: 999rpx;
	font-size: 28rpx;
}

.skip-btn {
	background: #f2f3f5;
	color: #666;
}

.save-profile-btn {
	background: #07c160;
	color: #fff;
}

.avatar-picker {
	width: 144rpx;
	height: 144rpx;
	padding: 0;
	margin: 0;
	border-radius: 50%;
	background: transparent;
	overflow: hidden;

	&::after {
		border: none;
	}
}

.wechat-avatar {
	width: 144rpx;
	height: 144rpx;
	border-radius: 50%;
	background: #f2f3f5;
	border: 4rpx solid rgba(255, 255, 255, 0.9);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.profile-tip {
	@include text(xs, normal, secondary);
}

.nickname-input {
	width: 100%;
	height: 76rpx;
	box-sizing: border-box;
	padding: 0 $space-4;
	border-radius: 38rpx;
	background: rgba(255, 255, 255, 0.92);
	text-align: center;
	font-size: 30rpx;
	color: $text-primary;
}

.login-btn {
	@include button-base;
	width: 100%;
	height: 88rpx;
	@include flex(row, center, center, $space-4);
	margin-bottom: $space-4;

	&.wx-login {
		background: #07c160;
		color: $text-inverse;
		box-shadow: $shadow-md;

		&:hover {
			background: #06ad56;
			box-shadow: $shadow-lg;
		}
	}

	&.phone-login {
		@include button-primary;
	}

	&.phone-quick-login {
		background: #1677ff;
		color: $text-inverse;
		box-shadow: $shadow-md;

		&:hover {
			background: #0f67e8;
			box-shadow: $shadow-lg;
		}
	}
}

.btn-icon {
	font-size: 40rpx;
}

.btn-text {
	@include text(base, semibold, inherit);
}

.login-form {
	@include flex(column, flex-start, stretch, $space-4);
	margin-bottom: $space-4;
}

.form-input {
	@include input-base;
	height: 88rpx;
}

.code-row {
	@include flex(row, space-between, stretch, $space-4);
}

.code-input {
	flex: 1;
}

.code-btn {
	@include button-secondary;
	width: 200rpx;
	height: 88rpx;
	white-space: nowrap;

	&[disabled] {
		opacity: 0.5;
		background-color: $color-neutral-300;
		color: $text-disabled;
		cursor: not-allowed;
	}
}

.login-switch {
	text-align: center;
	margin-bottom: $space-6;
}

.switch-text {
	@include text(sm, normal, primary);
	color: $color-primary;
	text-decoration: underline;
	cursor: pointer;
	transition: opacity $transition-fast;

	&:active {
		opacity: 0.7;
	}
}

.login-agreement {
	margin-top: $space-8;
}

.agreement-item {
	@include flex(row, flex-start, flex-start, $space-2);
}

.agreement-text {
	@include text(xs, normal, secondary);
	line-height: $line-height-relaxed;
	flex: 1;
}

.agreement-link {
	color: $color-primary;
	cursor: pointer;
	transition: opacity $transition-fast;

	&:active {
		opacity: 0.7;
	}
}
</style>
