<template>
	<view class="course-upload-page">
		<view class="hero-card">
			<view>
				<text class="eyebrow">课程上传权限</text>
				<text class="hero-title">上传文件课程</text>
				<text class="hero-desc">支持从微信聊天记录选择 PDF、Word 文件，上传后会自动创建文件类课程。</text>
			</view>
			<view class="hero-icon">
				<app-icon name="upload" :size="50" color="#2563eb" />
			</view>
		</view>

		<view class="section-card">
			<view class="file-card">
				<view class="file-icon">
					<app-icon name="file" :size="58" color="#2563eb" />
				</view>
				<view class="file-info">
					<text class="file-title">{{ selectedFile?.name || '请选择课程文件' }}</text>
					<text class="file-meta">{{ selectedFile ? `${formatFileSize(selectedFile.size)} · ${selectedFile.sourceLabel}` : '支持 .pdf / .doc / .docx' }}</text>
				</view>
			</view>
			<view class="file-source-grid">
				<button class="file-source-btn primary" @click="chooseChatFile">
					<app-icon name="share" :size="34" color="#2563eb" />
					<text>微信聊天文件</text>
				</button>
				<button class="file-source-btn" @click="chooseLocalFile">
					<app-icon name="upload" :size="34" color="#0f766e" />
					<text>本地文件</text>
				</button>
			</view>
		</view>

		<view class="section-card">
			<view class="section-title">课程信息</view>
			<view class="form-item">
				<text class="label">课程</text>
				<input class="input" v-model.trim="form.name" placeholder="请输入课程" />
			</view>
			<view class="form-item">
				<text class="label">课程分类</text>
				<picker
					mode="multiSelector"
					:range="categoryPickerRange"
					:value="categoryPickerValue"
					:disabled="categoryLoading || primaryCategoryNames.length === 0"
					@columnchange="handleCategoryColumnChange"
					@change="handleCategoryChange"
				>
					<view class="picker-field" :class="{ placeholder: !form.category }">
						<text>{{ categoryDisplayText }}</text>
						<app-icon name="arrow-down" :size="26" color="#94a3b8" />
					</view>
				</picker>
			</view>
			<view class="form-item">
				<text class="label">学校</text>
				<input class="input" v-model.trim="form.school" placeholder="请输入学校（如：北京大学等）" />
			</view>
			<view class="form-item">
				<text class="label">专业</text>
				<input class="input" v-model.trim="form.major" placeholder="请输入专业（如：计算机科学与技术等）" />
			</view>
			<view class="form-grid">
				<view class="form-item compact">
					<text class="label">真题年份</text>
					<input class="input" v-model.trim="form.exam_year" placeholder="请输入真题年份（如：2024）" />
				</view>
				<view class="form-item compact">
					<text class="label">答案年份</text>
					<input class="input" v-model.trim="form.answer_year" placeholder="请输入答案年份（如：2024）" />
				</view>
			</view>
			<view class="form-grid">
				<view class="form-item compact">
					<text class="label">价格</text>
					<input class="input" v-model="form.price" type="digit" placeholder="0.5" />
				</view>
				<view class="form-item compact">
					<text class="label">代理价</text>
					<input class="input" v-model="form.agent_price" type="digit" placeholder="0.1" />
				</view>
			</view>
			<view class="form-grid">
				<view class="form-item compact">
					<text class="label">有效期</text>
					<input class="input" v-model="form.validity_days" type="number" placeholder="365" />
				</view>
				<view class="switch-row">
					<text class="label">允许查看源文件</text>
					<switch :checked="form.allow_source_file === 1" color="#2563eb" @change="toggleSourceFile" />
				</view>
			</view>
			<view class="form-item">
				<text class="label">课程介绍</text>
				<textarea class="textarea" v-model.trim="form.introduction" maxlength="500" placeholder="可选，未填写时使用后台默认模板" />
			</view>
		</view>

		<view class="upload-panel" v-if="uploading || uploadProgress > 0">
			<view class="progress-head">
				<text>{{ uploadStage }}</text>
				<text>{{ uploadProgress }}%</text>
			</view>
			<view class="progress-track">
				<view class="progress-bar" :style="{ width: `${uploadProgress}%` }"></view>
			</view>
		</view>

		<view class="bottom-safe"></view>
		<view class="submit-bar">
			<button class="submit-btn" :disabled="uploading" @click="submitCourse">
				{{ uploading ? '正在上传...' : '上传并创建课程' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import AppIcon from '@/components/app-icon/app-icon.vue';
import { useUserStore } from '@/store/user';
import { getAppCourseFileCloudPath, createAppFileCourse, getCourseCategories } from '@/api/index';
import { getDefaultShare, toTimelineShare } from '@/utils/share';

const userStore = useUserStore();
const selectedFile = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStage = ref('等待上传');
const categoryTree = ref([]);
const categoryLoading = ref(false);
const selectedPrimaryIndex = ref(-1);
const selectedSubIndex = ref(-1);

const form = reactive({
	name: '',
	category: '',
	sub_category: '',
	school: '',
	major: '',
	exam_year: '',
	answer_year: '',
	price: '0.5',
	agent_price: '0.1',
	validity_days: '365',
	introduction: '',
	allow_source_file: 0,
});

const isAppAdmin = computed(() => userStore.userInfo?.is_admin === true || userStore.userInfo?.role === 'admin');
const isBankAdmin = computed(() => userStore.userInfo?.is_bank_admin === true || userStore.userInfo?.role === 'bank_admin');
const canUploadCourse = computed(() => isAppAdmin.value || isBankAdmin.value);
const primaryCategoryNames = computed(() => categoryTree.value.map((item) => item.name).filter(Boolean));
const activePrimaryCategory = computed(() => categoryTree.value[selectedPrimaryIndex.value] || null);
const subCategoryNames = computed(() => {
	const children = activePrimaryCategory.value?.children || activePrimaryCategory.value?.subCategories || [];
	return children.map((item) => item.name).filter(Boolean);
});
const categoryPickerRange = computed(() => [primaryCategoryNames.value, subCategoryNames.value.length ? subCategoryNames.value : ['无二级分类']]);
const categoryPickerValue = computed(() => [Math.max(selectedPrimaryIndex.value, 0), Math.max(selectedSubIndex.value, 0)]);
const categoryDisplayText = computed(() => {
	if (categoryLoading.value) return '加载分类中...';
	if (!form.category) return '请选择课程分类';
	return form.sub_category ? `${form.category} / ${form.sub_category}` : form.category;
});

const pageShare = () =>
	getDefaultShare({
		title: '上传文件课程｜研刷通',
		path: '/pages/index/index',
	});

onShareAppMessage(() => pageShare());
onShareTimeline(() => toTimelineShare(pageShare()));

onMounted(async () => {
	if (userStore.isLoggedIn) {
		await userStore.fetchUserInfo().catch(() => {});
	}
	if (!userStore.isLoggedIn || !canUploadCourse.value) {
		uni.showModal({
			title: '无权限',
			content: '该功能仅小程序超级管理员或题库管理员可使用',
			showCancel: false,
			success: () => uni.navigateBack(),
		});
		return;
	}
	await loadCategoryTree();
});

const chooseChatFile = async () => {
	try {
		const file = await chooseMessageFile();
		handleSelectedFile({ ...file, sourceLabel: '微信聊天文件' });
	} catch (error) {
		if (error?.message !== 'cancel') {
			uni.showToast({ title: error?.message || '选择文件失败', icon: 'none' });
		}
	}
};

const chooseLocalFile = async () => {
	try {
		const file = await chooseDeviceFile();
		handleSelectedFile({ ...file, sourceLabel: '本地文件' });
	} catch (error) {
		if (error?.message !== 'cancel') {
			uni.showToast({ title: error?.message || '选择本地文件失败', icon: 'none', duration: 2600 });
		}
	}
};

const handleSelectedFile = (file) => {
	validateFile(file);
	selectedFile.value = file;
	if (!form.name) {
		form.name = stripExt(file.name);
	}
	uploadProgress.value = 0;
	uploadStage.value = '等待上传';
};

const chooseMessageFile = () =>
	new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		if (typeof wx === 'undefined' || !wx.chooseMessageFile) {
			reject(new Error('当前微信版本不支持选择聊天文件'));
			return;
		}
		wx.chooseMessageFile({
			count: 1,
			type: 'file',
			extension: ['pdf', 'doc', 'docx'],
			success: (res) => {
				const file = res?.tempFiles?.[0];
				if (!file) {
					reject(new Error('未选择文件'));
					return;
				}
				resolve({
					name: file.name || 'course-file.pdf',
					size: file.size || 0,
					path: file.path,
				});
			},
			fail: (err) => {
				reject(new Error(err?.errMsg?.includes('cancel') ? 'cancel' : err?.errMsg || '选择文件失败'));
			},
		});
		// #endif
		// #ifndef MP-WEIXIN
		reject(new Error('请在微信小程序中使用聊天文件上传'));
		// #endif
	});

const chooseDeviceFile = () =>
	new Promise((resolve, reject) => {
		if (typeof uni !== 'undefined' && uni.chooseFile) {
			uni.chooseFile({
				count: 1,
				type: 'all',
				extension: ['.pdf', '.doc', '.docx', 'pdf', 'doc', 'docx'],
				success: (res) => {
					const file = res?.tempFiles?.[0];
					if (!file) {
						reject(new Error('未选择文件'));
						return;
					}
					resolve({
						name: file.name || file.path?.split('/').pop() || 'course-file.pdf',
						size: file.size || 0,
						path: file.path || file.tempFilePath,
					});
				},
				fail: (err) => {
					reject(new Error(err?.errMsg?.includes('cancel') ? 'cancel' : err?.errMsg || '选择本地文件失败'));
				},
			});
			return;
		}
		reject(new Error('当前环境不支持直接选择本地文档，请先把文件发送到微信聊天后选择'));
	});

const loadCategoryTree = async () => {
	categoryLoading.value = true;
	try {
		const res = await getCourseCategories();
		const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
		categoryTree.value = list.filter((item) => item?.name);
	} catch (error) {
		console.error('加载课程分类失败:', error);
		categoryTree.value = [];
		uni.showToast({ title: '分类加载失败，可稍后重试', icon: 'none' });
	} finally {
		categoryLoading.value = false;
	}
};

const handleCategoryColumnChange = (event) => {
	const column = Number(event?.detail?.column);
	const value = Number(event?.detail?.value);
	if (column !== 0 || !Number.isInteger(value) || !categoryTree.value[value]) return;
	selectedPrimaryIndex.value = value;
	selectedSubIndex.value = 0;
};

const handleCategoryChange = (event) => {
	const [primaryIndex = 0, subIndex = 0] = event?.detail?.value || [];
	const primary = categoryTree.value[Number(primaryIndex)];
	if (!primary) return;
	const children = primary.children || primary.subCategories || [];
	const sub = children[Number(subIndex)];
	selectedPrimaryIndex.value = Number(primaryIndex);
	selectedSubIndex.value = sub ? Number(subIndex) : -1;
	form.category = primary.name || '';
	form.sub_category = sub?.name || '';
};

const validateFile = (file) => {
	if (!file?.path || !file?.name) {
		throw new Error('文件信息不完整');
	}
	if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
		throw new Error('仅支持 PDF、Word（.doc/.docx）文件');
	}
	const maxSize = 300 * 1024 * 1024;
	if (file.size > maxSize) {
		throw new Error('文件不能超过 300MB');
	}
};

const submitCourse = async () => {
	if (uploading.value) return;
	if (!selectedFile.value) {
		uni.showToast({ title: '请先选择课程文件', icon: 'none' });
		return;
	}
	if (!form.name) {
		uni.showToast({ title: '请填写课程名称', icon: 'none' });
		return;
	}
	if (!form.category) {
		uni.showToast({ title: '请选择一级分类', icon: 'none' });
		return;
	}
	if (subCategoryNames.value.length > 0 && !form.sub_category) {
		uni.showToast({ title: '请选择二级分类', icon: 'none' });
		return;
	}
	try {
		uploading.value = true;
		uploadProgress.value = 1;
		uploadStage.value = '正在准备云存储路径';
		const uploadMeta = await getAppCourseFileCloudPath(selectedFile.value.name);
		await uploadToCloud(selectedFile.value.path, uploadMeta.cloudPath);
		uploadStage.value = '正在创建课程';
		uploadProgress.value = 98;
		const course = await createAppFileCourse({
			name: form.name,
			category: form.category,
			sub_category: form.sub_category,
			school: form.school,
			major: form.major,
			exam_year: form.exam_year,
			answer_year: form.answer_year,
			price: Number(form.price || 0.5),
			agent_price: Number(form.agent_price || 0.1),
			validity_days: Number(form.validity_days || 365),
			introduction: form.introduction,
			file_url: uploadMeta.fileUrl,
			file_name: uploadMeta.fileName || selectedFile.value.name,
			file_type: uploadMeta.fileType || getExt(selectedFile.value.name),
			file_size: selectedFile.value.size || 0,
			allow_source_file: form.allow_source_file,
		});
		uploadProgress.value = 100;
		uploadStage.value = '上传完成';
		uni.showModal({
			title: '上传成功',
			content: '课程已创建，是否查看课程详情？',
			confirmText: '查看',
			cancelText: '返回',
			success: (res) => {
				if (res.confirm && course?.id) {
					uni.navigateTo({ url: `/pages/sub-pages/course-intro/index?id=${course.id}` });
				} else {
					uni.navigateBack();
				}
			},
		});
	} catch (error) {
		console.error('上传课程失败:', error);
		uni.showToast({ title: error?.message || '上传失败', icon: 'none' });
	} finally {
		uploading.value = false;
	}
};

const uploadToCloud = (filePath, cloudPath) =>
	new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		if (typeof wx === 'undefined' || !wx.cloud?.uploadFile) {
			reject(new Error('微信云存储不可用'));
			return;
		}
		const task = wx.cloud.uploadFile({
			cloudPath,
			filePath,
			success: (res) => {
				if (!res?.fileID) {
					reject(new Error('云存储未返回文件ID'));
					return;
				}
				resolve(res);
			},
			fail: (err) => reject(new Error(err?.errMsg || '文件上传失败')),
		});
		task?.onProgressUpdate?.((res) => {
			uploadProgress.value = Math.max(2, Math.min(95, Number(res?.progress) || 2));
			uploadStage.value = '正在上传到云存储';
		});
		// #endif
		// #ifndef MP-WEIXIN
		reject(new Error('请在微信小程序中上传课程文件'));
		// #endif
	});

const toggleSourceFile = (event) => {
	form.allow_source_file = event.detail.value ? 1 : 0;
};

const stripExt = (name) => String(name || '').replace(/\.(pdf|doc|docx)$/i, '');
const getExt = (name) => String(name || '').toLowerCase().match(/\.(pdf|doc|docx)$/)?.[1] || 'pdf';

const formatFileSize = (size = 0) => {
	if (size >= 1024 * 1024) {
		return `${(size / 1024 / 1024).toFixed(1)} MB`;
	}
	if (size >= 1024) {
		return `${Math.ceil(size / 1024)} KB`;
	}
	return `${size || 0} B`;
};
</script>

<style lang="scss" scoped>
.course-upload-page {
	min-height: 100vh;
	padding: 24rpx;
	padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
	background: linear-gradient(180deg, #eef5ff 0%, #f7f8fb 42%, #f7f8fb 100%);
	box-sizing: border-box;
}

.hero-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 34rpx;
	border-radius: 32rpx;
	color: #fff;
	background: linear-gradient(135deg, #1d4ed8, #38bdf8);
	box-shadow: 0 18rpx 44rpx rgba(37, 99, 235, 0.22);
}

.eyebrow,
.hero-title,
.hero-desc {
	display: block;
}

.eyebrow {
	font-size: 22rpx;
	opacity: 0.8;
	margin-bottom: 12rpx;
}

.hero-title {
	font-size: 42rpx;
	font-weight: 800;
	letter-spacing: 1rpx;
}

.hero-desc {
	max-width: 500rpx;
	margin-top: 14rpx;
	font-size: 25rpx;
	line-height: 1.55;
	opacity: 0.9;
}

.hero-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96rpx;
	height: 96rpx;
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.92);
}

.section-card {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 28rpx;
	background: #fff;
	box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.07);
}

.file-card {
	display: flex;
	align-items: center;
	gap: 22rpx;
	margin-bottom: 24rpx;
}

.file-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 104rpx;
	height: 104rpx;
	border-radius: 28rpx;
	background: #eff6ff;
}

.file-info {
	flex: 1;
	min-width: 0;
}

.file-title,
.file-meta {
	display: block;
}

.file-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #111827;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.file-meta {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #64748b;
}

.file-source-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 18rpx;
}

.file-source-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	height: 78rpx;
	border-radius: 22rpx;
	border: 2rpx solid #ccfbf1;
	background: #f0fdfa;
	color: #0f766e;
	font-size: 26rpx;
	font-weight: 800;
	line-height: 1;

	&::after {
		border: none;
	}

	&.primary {
		border-color: #bfdbfe;
		background: #eff6ff;
		color: #2563eb;
	}
}

.section-title {
	margin-bottom: 22rpx;
	font-size: 32rpx;
	font-weight: 800;
	color: #111827;
}

.form-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 18rpx;
}

.form-item {
	margin-bottom: 22rpx;
}

.form-item.compact {
	min-width: 0;
}

.label {
	display: block;
	margin-bottom: 12rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #475569;
}

.input,
.textarea {
	width: 100%;
	box-sizing: border-box;
	border: 2rpx solid #e2e8f0;
	border-radius: 20rpx;
	background: #f8fafc;
	color: #111827;
}

.input {
	height: 78rpx;
	padding: 0 22rpx;
	font-size: 28rpx;
}

.picker-field {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 78rpx;
	padding: 0 22rpx;
	box-sizing: border-box;
	border: 2rpx solid #e2e8f0;
	border-radius: 20rpx;
	background: #f8fafc;
	color: #111827;
	font-size: 28rpx;

	text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&.placeholder {
		color: #94a3b8;
	}
}

.textarea {
	height: 150rpx;
	padding: 20rpx 22rpx;
	font-size: 27rpx;
	line-height: 1.5;
}

.switch-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 118rpx;
	padding: 0 2rpx;
}

.upload-panel {
	margin-top: 24rpx;
	padding: 24rpx;
	border-radius: 24rpx;
	background: #0f172a;
	color: #e0f2fe;
}

.progress-head {
	display: flex;
	justify-content: space-between;
	font-size: 24rpx;
	margin-bottom: 16rpx;
}

.progress-track {
	height: 14rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.16);
	overflow: hidden;
}

.progress-bar {
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, #60a5fa, #34d399);
	transition: width 0.2s ease;
}

.submit-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 20;
	padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
	background: rgba(255, 255, 255, 0.94);
	backdrop-filter: blur(18rpx);
	box-shadow: 0 -10rpx 30rpx rgba(15, 23, 42, 0.08);
}

.submit-btn {
	height: 88rpx;
	border-radius: 999rpx;
	font-size: 30rpx;
	font-weight: 800;
	color: #fff;
	background: linear-gradient(135deg, #2563eb, #06b6d4);
}

.submit-btn[disabled] {
	opacity: 0.7;
}

.bottom-safe {
	height: 40rpx;
}
</style>
