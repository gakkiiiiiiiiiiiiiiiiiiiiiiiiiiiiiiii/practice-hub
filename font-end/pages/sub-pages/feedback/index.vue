<template>
	<view class="feedback-page">
		<view class="form-container">
			<!-- 反馈类型 -->
			<view class="form-item">
				<view class="form-label">反馈类型 <text class="required">*</text></view>
				<view class="type-selector">
					<view
						v-for="type in feedbackTypes"
						:key="type.value"
						class="type-item"
						:class="{ active: formData.type === type.value }"
						@click="formData.type = type.value"
					>
						<text class="type-icon">{{ type.icon }}</text>
						<text class="type-text">{{ type.label }}</text>
					</view>
				</view>
			</view>

			<!-- 微信联系方式 -->
			<view class="form-item">
				<view class="form-label">微信联系方式</view>
				<input
					v-model="formData.wechat_contact"
					class="contact-input"
					placeholder="请输入微信号或手机号，方便客服联系（选填）"
					maxlength="64"
				/>
			</view>

			<!-- 问题描述 -->
			<view class="form-item">
				<view class="form-label">问题描述 <text class="required">*</text></view>
				<textarea
					v-model="formData.description"
					class="description-input"
					placeholder="请详细描述您遇到的问题或建议（至少5个字符）"
					maxlength="2000"
					:show-confirm-bar="false"
				/>
				<view class="char-count">{{ formData.description.length }}/2000</view>
			</view>

			<!-- 图片上传 -->
			<view class="form-item">
				<view class="form-label">相关图片（可选）</view>
				<view class="image-upload">
					<view
						v-for="(image, index) in imageList"
						:key="index"
						class="image-item"
					>
						<image :src="image" mode="aspectFill" class="uploaded-image" />
						<view class="delete-btn" @click="removeImage(index)">
							<text class="delete-icon">×</text>
						</view>
					</view>
					<view
						v-if="imageList.length < 9"
						class="upload-btn"
						@click="chooseImage"
					>
						<text class="upload-icon">+</text>
						<text class="upload-text">添加图片</text>
					</view>
				</view>
				<view class="upload-tip">最多可上传9张图片，每张不超过5MB</view>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-section">
				<button
					class="submit-btn"
					:class="{ disabled: !canSubmit }"
					:loading="submitting"
					@click="handleSubmit"
				>
					提交反馈
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createFeedback } from '@/api/index';

const formData = ref({
	type: 'bug',
	wechat_contact: '',
	description: '',
});

const imageList = ref([]);
const submitting = ref(false);

const feedbackTypes = [
	{ value: 'bug', label: '缺陷', icon: '🐛' },
	{ value: 'style', label: '样式优化', icon: '🎨' },
	{ value: 'feature', label: '功能需求', icon: '💡' },
];

const canSubmit = computed(() => {
	return formData.value.type && formData.value.description.trim().length >= 5;
});

const chooseImage = () => {
	uni.chooseImage({
		count: 9 - imageList.value.length,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async (res) => {
			for (const tempFilePath of res.tempFilePaths) {
				// 上传图片
				try {
					uni.showLoading({ title: '上传中...' });
					const uploadRes = await uploadFeedbackImage(tempFilePath);
					if (uploadRes.url || uploadRes.imageUrl) {
						imageList.value.push(uploadRes.url || uploadRes.imageUrl);
					}
				} catch (error) {
					console.error('图片上传失败:', error);
					uni.showToast({
						title: error?.message || '图片上传失败',
						icon: 'none',
					});
				} finally {
					uni.hideLoading();
				}
			}
		},
	});
};

// 上传反馈图片
const uploadFeedbackImage = (filePath) => {
	return new Promise((resolve, reject) => {
		// 微信小程序使用云服务上传
		// #ifdef MP-WEIXIN
		if (typeof wx !== 'undefined' && wx.cloud && wx.cloud.callContainer) {
			// 使用微信云服务上传文件
			const cloudPath = `feedback/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
			wx.cloud.uploadFile({
				cloudPath: cloudPath,
				filePath: filePath,
				success: (res) => {
					// 获取文件ID后，需要调用后端接口保存
					// 这里直接使用云存储的临时URL
					resolve({
						url: res.fileID,
						imageUrl: res.fileID,
					});
				},
				fail: (err) => {
					console.error('云存储上传失败:', err);
					// 降级到直接调用后端接口
					uploadToBackend(filePath).then(resolve).catch(reject);
				},
			});
		} else {
			// 降级方案：直接调用后端接口
			uploadToBackend(filePath).then(resolve).catch(reject);
		}
		// #endif

		// #ifndef MP-WEIXIN
		// 非微信环境直接调用后端接口
		uploadToBackend(filePath).then(resolve).catch(reject);
		// #endif
	});
};

// 上传到后端接口
const uploadToBackend = (filePath) => {
	return new Promise((resolve, reject) => {
		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:3333/api';
		const uploadUrl = `${API_BASE_URL}/app/upload/image`;

		uni.uploadFile({
			url: uploadUrl,
			filePath: filePath,
			name: 'file',
			header: {
				Authorization: `Bearer ${uni.getStorageSync('auth_token')}`,
			},
			success: (res) => {
				try {
					const data = JSON.parse(res.data);
					if (data.code === 200 || data.code === 0) {
						resolve(data.data);
					} else {
						reject(new Error(data.message || data.msg || '上传失败'));
					}
				} catch (e) {
					reject(new Error('解析响应失败'));
				}
			},
			fail: (error) => {
				reject(error);
			},
		});
	});
};

const removeImage = (index) => {
	imageList.value.splice(index, 1);
};

const handleSubmit = async () => {
	if (!canSubmit.value) {
		uni.showToast({
			title: '请填写完整信息',
			icon: 'none',
		});
		return;
	}

	const wechatContact = formData.value.wechat_contact?.trim() || '';
	if (wechatContact && wechatContact.length < 2) {
		uni.showToast({
			title: '微信联系方式至少2个字符',
			icon: 'none',
		});
		return;
	}

	submitting.value = true;
	try {
		await createFeedback({
			type: formData.value.type,
			description: formData.value.description.trim(),
			wechat_contact: wechatContact || undefined,
			images: imageList.value,
		});

		uni.showToast({
			title: '提交成功',
			icon: 'success',
		});

		// 清空表单
		formData.value = {
			type: 'bug',
			wechat_contact: '',
			description: '',
		};
		imageList.value = [];

		// 延迟返回上一页
		setTimeout(() => {
			uni.navigateBack();
		}, 1500);
	} catch (error) {
		console.error('提交反馈失败:', error);
		uni.showToast({
			title: error?.message || '提交失败，请重试',
			icon: 'none',
		});
	} finally {
		submitting.value = false;
	}
};

onLoad((options = {}) => {
	if (options.type && feedbackTypes.some((item) => item.value === options.type)) {
		formData.value.type = options.type;
	}
	const title = options.title ? decodeURIComponent(options.title) : '功能反馈';
	uni.setNavigationBarTitle({
		title,
	});
});
</script>

<style scoped lang="scss">
.feedback-page {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx 20rpx 40rpx;
	padding-bottom: calc(40rpx + env(safe-area-inset-bottom));

	.form-container {
		background: #fff;
		border-radius: 16rpx;
		padding: 32rpx;
	}

	.form-item {
		margin-bottom: 40rpx;

		.form-label {
			font-size: 28rpx;
			font-weight: 500;
			color: #333;
			margin-bottom: 20rpx;

			.required {
				color: #ff4d4f;
			}
		}
	}

	.type-selector {
		display: flex;
		gap: 20rpx;

		.type-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 24rpx;
			background: #f5f5f5;
			border-radius: 12rpx;
			border: 2rpx solid transparent;
			transition: all 0.3s;

			&.active {
				background: #e6f7ff;
				border-color: #1890ff;
			}

			.type-icon {
				font-size: 48rpx;
				margin-bottom: 8rpx;
			}

			.type-text {
				font-size: 24rpx;
				color: #333;
			}
		}
	}

	.contact-input {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		padding: 0 20rpx;
		background: #f5f5f5;
		border-radius: 12rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.description-input {
		width: 100%;
		min-height: 200rpx;
		padding: 20rpx;
		background: #f5f5f5;
		border-radius: 12rpx;
		font-size: 28rpx;
		line-height: 1.6;
		box-sizing: border-box;
	}

	.char-count {
		text-align: right;
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.image-upload {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;

		.image-item {
			position: relative;
			width: 200rpx;
			height: 200rpx;
			border-radius: 12rpx;
			overflow: hidden;

			.uploaded-image {
				width: 100%;
				height: 100%;
			}

			.delete-btn {
				position: absolute;
				top: -10rpx;
				right: -10rpx;
				width: 40rpx;
				height: 40rpx;
				background: #ff4d4f;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;

				.delete-icon {
					color: #fff;
					font-size: 32rpx;
					line-height: 1;
				}
			}
		}

		.upload-btn {
			width: 200rpx;
			height: 200rpx;
			background: #f5f5f5;
			border: 2rpx dashed #d9d9d9;
			border-radius: 12rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;

			.upload-icon {
				font-size: 48rpx;
				color: #999;
				margin-bottom: 8rpx;
			}

			.upload-text {
				font-size: 24rpx;
				color: #999;
			}
		}
	}

	.upload-tip {
		font-size: 24rpx;
		color: #999;
		margin-top: 12rpx;
	}

	.submit-section {
		margin-top: 60rpx;
		padding-bottom: 20rpx;

		.submit-btn {
			width: 100%;
			height: 88rpx;
			line-height: 88rpx;
			background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
			border-radius: 44rpx;
			color: #fff;
			font-size: 32rpx;
			font-weight: 500;
			border: none;
			box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);

			&.disabled {
				background: #d9d9d9;
				color: #999;
				box-shadow: none;
			}
		}
	}
}
</style>
