<template>
	<view class="profile-page" :class="pageClasses">
		<!-- 头部背景 -->
		<view class="profile-header">
			<view class="header-bg"></view>
			<view class="header-content">
				<!-- 头像 -->
				<view class="avatar-section">
					<image
						class="avatar"
						:src="formData.avatar || defaultAvatar"
						mode="aspectFill"
						@click="handleChooseAvatar"
					></image>
					<view class="avatar-edit-icon">
						<text class="edit-icon-text">📷</text>
					</view>
					<text class="avatar-tip"></text>
				</view>
			</view>
		</view>

		<!-- 表单内容 -->
		<view class="profile-content">
			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-title">基本信息</view>
				<view class="form-item">
					<view class="form-label-wrapper">
						<app-icon name="user" :size="32" color="#667eea" class="form-icon" />
						<text class="form-label">昵称</text>
					</view>
					<input
						class="form-input"
						v-model="formData.nickname"
						placeholder="请输入昵称"
						maxlength="20"
						placeholder-style="color: #999"
					/>
				</view>
				<view class="form-item" v-if="userStore.userInfo?.phone">
					<view class="form-label-wrapper">
						<text class="form-icon-emoji">📱</text>
						<text class="form-label">手机号</text>
					</view>
					<text class="form-value">{{ formatPhone(userStore.userInfo.phone) }}</text>
					<text class="form-hint">已绑定</text>
				</view>
				<!-- <view class="form-item" v-else>
					<view class="form-label-wrapper">
						<text class="form-icon-emoji">📱</text>
						<text class="form-label">手机号</text>
					</view>
					<text class="form-hint">未绑定</text>
					<text class="form-link" @click="handleBindPhone">去绑定</text>
				</view> -->
			</view>

			<!-- 会员信息 -->
			<view class="form-section" v-if="userStore.isLoggedIn">
				<view class="section-title">会员信息</view>
				<view class="form-item">
					<view class="form-label-wrapper">
						<text class="form-icon-emoji">👑</text>
						<text class="form-label">会员状态</text>
					</view>
					<view class="vip-status" :class="{ active: userStore.hasPackage }">
						<text class="vip-text">{{ membershipText }}</text>
						<text class="vip-expire" v-if="userStore.hasPackage && userStore.userInfo?.package_expire_time">
							{{ formatVipExpire(userStore.userInfo.package_expire_time) }}
						</text>
					</view>
				</view>
			</view>

			<!-- 账号信息 -->
			<view class="form-section">
				<view class="section-title">账号信息</view>
				<view class="form-item">
					<view class="form-label-wrapper">
						<text class="form-icon-emoji">🆔</text>
						<text class="form-label">用户ID</text>
					</view>
					<text class="form-value">{{ userStore.userInfo?.id || '-' }}</text>
				</view>
			</view>

			<!-- 已购买课程 -->
			<view class="form-section" v-if="userStore.isLoggedIn">
				<view class="section-title section-title-row">
					<text>已购买课程</text>
					<text class="section-count">{{ purchasedCourses.length }} 门</text>
				</view>
				<view v-if="purchasedLoading" class="course-loading">
					<text class="course-loading-text">加载中...</text>
				</view>
				<view v-else-if="purchasedCourses.length === 0" class="empty-courses">
					<text class="empty-course-title">暂无已购买课程</text>
					<text class="empty-course-desc">购买或激活课程后会显示在这里</text>
				</view>
				<view v-else class="purchased-course-list">
					<view
						v-for="course in purchasedCourses"
						:key="course.id"
						class="purchased-course-item"
						@click="handleCourseClick(course)"
					>
						<image
							v-if="course.cover_img"
							class="course-cover"
							:src="getImageUrl(course.cover_img)"
							mode="aspectFill"
						/>
						<view v-else class="course-cover-placeholder">
							<text class="course-cover-icon">📘</text>
						</view>
						<view class="course-info">
							<text class="course-name">{{ course.name }}</text>
							<view class="course-tags">
								<text v-if="course.category" class="course-tag">{{ course.category }}</text>
								<text v-if="course.sub_category" class="course-tag">{{ course.sub_category }}</text>
								<text v-if="course.content_type === 'file'" class="course-tag file-tag">文件课</text>
							</view>
							<text v-if="course.expireTime" class="course-expire">{{ formatVipExpire(course.expireTime) }}</text>
						</view>
						<text class="course-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 保存按钮 -->
		<view class="button-section">
			<button class="save-button" @click="handleSave" :loading="saving" :disabled="saving">
				{{ saving ? '保存中...' : '保存' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { useBankStore } from '@/store/bank';
import { getAllCourses, getCourseDetail, updateUserProfile, uploadImage } from '@/api/index';
import { getImageUrl } from '@/utils/image';
import AppIcon from '@/components/app-icon/app-icon.vue';

const userStore = useUserStore();
const bankStore = useBankStore();

// 页面类名，用于应用全局设置
const pageClasses = computed(() => {
	const classes = [];
	if (bankStore.settings.nightMode) {
		classes.push('night-mode');
	}
	if (bankStore.settings.fontSize) {
		classes.push(`font-size-${bankStore.settings.fontSize}`);
	}
	return classes.join(' ');
});

const defaultAvatar = '/static/default-avatar.png';
const isAppAdmin = computed(() => userStore.userInfo?.is_admin === true || userStore.userInfo?.role === 'admin');
const isBankAdmin = computed(() => userStore.userInfo?.is_bank_admin === true || userStore.userInfo?.role === 'bank_admin');
const membershipText = computed(() => {
	if (isAppAdmin.value) return '小程序超级管理员';
	if (isBankAdmin.value) return '题库管理员';
	return userStore.hasPackage ? '套餐会员' : '普通用户';
});
const saving = ref(false);
const purchasedLoading = ref(false);
const purchasedCourses = ref([]);

const formData = ref({
	avatar: '',
	nickname: '',
});

onMounted(() => {
	// 加载用户信息
	if (userStore.userInfo) {
		formData.value = {
			avatar: userStore.userInfo.avatar || '',
			nickname: userStore.userInfo.nickname || '',
		};
	}
	loadPurchasedCourses();
});

const loadPurchasedCourses = async () => {
	if (!userStore.isLoggedIn || purchasedLoading.value) return;
	purchasedLoading.value = true;
	try {
		const courses = await getAllCourses();
		const list = Array.isArray(courses) ? courses : [];
		const details = await Promise.all(
			list.map(async (course) => {
				try {
					const detail = await getCourseDetail(course.id);
					const hasAuth = detail?.hasAuth === true || detail?.hasAuth === 1;
					return hasAuth ? { ...course, ...detail } : null;
				} catch (error) {
					console.warn(`加载课程 ${course.id} 购买状态失败`, error);
					return null;
				}
			}),
		);
		purchasedCourses.value = details.filter(Boolean).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
	} catch (error) {
		console.error('加载已购买课程失败:', error);
		uni.showToast({
			title: '已购课程加载失败',
			icon: 'none',
		});
	} finally {
		purchasedLoading.value = false;
	}
};

const handleCourseClick = (course) => {
	if (!course?.id) return;
	uni.navigateTo({
		url: `/pages/sub-pages/course-intro/index?id=${course.id}`,
	});
};

const handleChooseAvatar = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async (res) => {
			const tempFilePath = res.tempFilePaths[0];
			try {
				// 上传图片到服务器
				uni.showLoading({ title: '上传中...' });
				const uploadRes = await uploadImage(tempFilePath);
				if (uploadRes && uploadRes.url) {
					const avatarUrl = uploadRes.url;
					formData.value.avatar = avatarUrl;
					const nextNickname = formData.value.nickname?.trim() || userStore.userInfo?.nickname || '微信用户';
					const updatedUser = await updateUserProfile({
						nickname: nextNickname,
						avatar: avatarUrl,
					});
					userStore.setUserInfo({
						...(userStore.userInfo || {}),
						...(updatedUser || {}),
						nickname: updatedUser?.nickname || nextNickname,
						avatar: updatedUser?.avatar || avatarUrl,
					});
					uni.hideLoading();
					uni.showToast({
						title: '头像上传成功',
						icon: 'success',
					});
				} else {
					throw new Error('上传失败');
				}
			} catch (error) {
				console.error('上传头像失败:', error);
				uni.hideLoading();
				uni.showToast({
					title: error?.message || '上传失败，请重试',
					icon: 'none',
				});
			}
		},
		fail: (err) => {
			console.error('选择头像失败:', err);
			uni.showToast({
				title: '选择头像失败',
				icon: 'none',
			});
		},
	});
};

const handleSave = async () => {
	if (!formData.value.nickname || formData.value.nickname.trim() === '') {
		uni.showToast({
			title: '请输入昵称',
			icon: 'none',
		});
		return;
	}

	saving.value = true;
	try {
		// 更新用户信息
		const res = await updateUserProfile({
			nickname: formData.value.nickname.trim(),
			avatar: formData.value.avatar,
		});

		// 更新 store 中的用户信息
		userStore.setUserInfo({
			...userStore.userInfo,
			nickname: formData.value.nickname.trim(),
			avatar: formData.value.avatar,
		});

		uni.showToast({
			title: '保存成功',
			icon: 'success',
		});

		setTimeout(() => {
			uni.navigateBack();
		}, 1500);
	} catch (error) {
		console.error('保存失败:', error);
		uni.showToast({
			title: error?.message || '保存失败',
			icon: 'none',
		});
	} finally {
		saving.value = false;
	}
};

const handleBindPhone = () => {
	uni.showModal({
		title: '绑定手机号',
		content: '该功能开发中，敬请期待',
		showCancel: false,
	});
};

const formatPhone = (phone) => {
	if (!phone) return '';
	// 显示前3位和后4位，中间用*代替
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

const formatVipExpire = (expireTime) => {
	if (!expireTime) return '';
	const date = new Date(expireTime);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `有效期至 ${year}-${month}-${day}`;
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.profile-page {
	min-height: 100vh;
	background-color: #f5f5f5;
}

.profile-header {
	position: relative;
	width: 100%;
	height: 400rpx;
	overflow: hidden;
}

.header-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-content {
	position: relative;
	z-index: 1;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
}

.avatar {
	width: 200rpx;
	height: 200rpx;
	border-radius: 50%;
	border: 6rpx solid rgba(255, 255, 255, 0.3);
	background-color: #fff;
	position: relative;
}

.avatar-edit-icon {
	position: absolute;
	bottom: 0;
	right: 0;
	width: 64rpx;
	height: 64rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 4rpx solid #fff;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.edit-icon-text {
	font-size: 28rpx;
}

.avatar-tip {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
}

.profile-content {
	padding: 32rpx;
	margin-top: -40rpx;
	position: relative;
	z-index: 2;
}

.form-section {
	background-color: #fff;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 24rpx;
	padding-bottom: 16rpx;
	border-bottom: 1rpx solid #eee;
}

.section-title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.section-count {
	font-size: 24rpx;
	font-weight: 500;
	color: #667eea;
}

.form-item {
	display: flex;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f0f0f0;

	&:last-child {
		border-bottom: none;
	}
}

.form-label-wrapper {
	display: flex;
	align-items: center;
	gap: 16rpx;
	min-width: 160rpx;
}

.form-icon {
	color: #667eea;
}

.form-icon-emoji {
	font-size: 32rpx;
	width: 32rpx;
	height: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.form-label {
	font-size: 30rpx;
	color: #333;
	font-weight: 500;
}

.form-input {
	flex: 1;
	font-size: 30rpx;
	color: #333;
	text-align: right;
	padding: 0;
}

.form-value {
	flex: 1;
	font-size: 30rpx;
	color: #333;
	text-align: right;
}

.form-hint {
	font-size: 26rpx;
	color: #999;
	margin-left: 16rpx;
}

.form-link {
	font-size: 28rpx;
	color: #667eea;
	margin-left: 16rpx;
}

.vip-status {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8rpx;
	flex: 1;

	&.active {
		.vip-text {
			color: #f59e0b;
			font-weight: 600;
		}
	}
}

.vip-text {
	font-size: 30rpx;
	color: #666;
}

.vip-expire {
	font-size: 24rpx;
	color: #999;
}

.course-loading,
.empty-courses {
	padding: 32rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

.course-loading-text,
.empty-course-desc {
	font-size: 26rpx;
	color: #999;
}

.empty-course-title {
	font-size: 28rpx;
	color: #666;
	font-weight: 500;
}

.purchased-course-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.purchased-course-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx;
	border-radius: 20rpx;
	background: #f8f9ff;
	border: 1rpx solid rgba(102, 126, 234, 0.1);

	&:active {
		transform: scale(0.98);
		opacity: 0.9;
	}
}

.course-cover,
.course-cover-placeholder {
	width: 112rpx;
	height: 112rpx;
	border-radius: 16rpx;
	flex-shrink: 0;
	background: #eef2ff;
}

.course-cover-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
}

.course-cover-icon {
	font-size: 44rpx;
}

.course-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.course-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	line-height: 1.35;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.course-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
}

.course-tag {
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(102, 126, 234, 0.12);
	color: #667eea;
	font-size: 22rpx;
}

.file-tag {
	background: rgba(16, 185, 129, 0.12);
	color: #10b981;
}

.course-expire {
	font-size: 22rpx;
	color: #999;
}

.course-arrow {
	font-size: 42rpx;
	color: #bbb;
	flex-shrink: 0;
}

.button-section {
	padding: 32rpx;
	padding-bottom: 60rpx;
}

.save-button {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	text-align: center;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);

	&:active {
		opacity: 0.8;
		transform: scale(0.98);
	}

	&[disabled] {
		opacity: 0.6;
	}
}

/* 夜间模式 */
.profile-page.night-mode {
	background-color: #1a1a1a;

	.form-section {
		background-color: #2a2a2a;
	}

	.section-title {
		color: #e0e0e0;
		border-bottom-color: #444;
	}

	.form-item {
		border-bottom-color: #333;
	}

	.form-label {
		color: #e0e0e0;
	}

	.form-input {
		color: #e0e0e0;
	}

	.form-value {
		color: #e0e0e0;
	}

	.form-hint {
		color: #888;
	}

	.vip-text {
		color: #aaa;
	}

	.vip-expire {
		color: #888;
	}

	.empty-course-title,
	.course-name {
		color: #e0e0e0;
	}

	.purchased-course-item {
		background: #242424;
		border-color: #333;
	}

	.course-cover-placeholder {
		background: #333;
	}
}

/* 字体大小 */
.profile-page.font-size-small {
	.section-title {
		font-size: 30rpx !important;
	}

	.form-label {
		font-size: 28rpx !important;
	}

	.form-input,
	.form-value {
		font-size: 28rpx !important;
	}
}

.profile-page.font-size-large {
	.section-title {
		font-size: 36rpx !important;
	}

	.form-label {
		font-size: 34rpx !important;
	}

	.form-input,
	.form-value {
		font-size: 34rpx !important;
	}
}
</style>
