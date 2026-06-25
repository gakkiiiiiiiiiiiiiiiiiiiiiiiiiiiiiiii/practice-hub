<template>
	<view class="notes-page">
		<!-- 顶部筛选栏 -->
		<view class="notes-header">
			<view class="header-top">
				<text class="header-title">我的笔记</text>
				<text class="header-count">共 {{ noteList.length }} 条</text>
			</view>
			<!-- 课程筛选 -->
			<view class="course-filter" v-if="courseList.length > 0">
				<view
					class="filter-item"
					:class="{ active: selectedCourseId === null }"
					@click="selectCourse(null)"
				>
					<text class="filter-text">全部</text>
				</view>
				<view
					v-for="course in courseList"
					:key="course.id"
					class="filter-item"
					:class="{ active: selectedCourseId === course.id }"
					@click="selectCourse(course.id)"
				>
					<text class="filter-text">{{ course.name }}</text>
				</view>
			</view>
		</view>

		<!-- 笔记列表 -->
		<scroll-view class="notes-list" scroll-y @refresherrefresh="onRefresh" refresher-enabled>
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="noteList.length === 0" class="empty-state">
				<text class="empty-icon">✏️</text>
				<text class="empty-text">暂无笔记</text>
				<text class="empty-hint">在答题页面可以添加笔记</text>
			</view>

			<!-- 笔记列表 -->
			<view v-else>
				<view
					v-for="item in noteList"
					:key="item.id"
					class="note-item"
					@click="handleReview(item)"
					@longpress="handleLongPress(item)"
				>
					<view class="item-left">
						<!-- 题目类型标签 -->
						<view class="question-type-tag" :class="`type-${getQuestionTypeName(item.question?.type)}`">
							<text class="type-text">{{ getQuestionTypeText(item.question?.type) }}</text>
						</view>
					</view>

					<view class="item-content">
						<!-- 题目内容 -->
						<text class="item-title">{{ formatQuestionStem(item.question?.stem) }}</text>
						<!-- 笔记内容预览 -->
						<text class="item-note">{{ formatNoteContent(item.content) }}</text>
						<!-- 元信息 -->
						<view class="item-meta">
							<text class="meta-item">{{ formatTime(item.update_time || item.create_time) }}</text>
							<text v-if="item.course_name" class="meta-item">· {{ item.course_name }}</text>
						</view>
					</view>

					<view class="item-actions">
						<app-icon name="arrow-right" :size="24" color="#999" />
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 长按操作菜单 -->
		<view v-if="showActionMenu" class="action-menu-mask" @click="showActionMenu = false">
			<view class="action-menu" @click.stop>
				<view class="menu-item" @click="handleEdit">
					<app-icon name="edit" :size="40" color="#007AFF" />
					<text class="menu-text">编辑笔记</text>
				</view>
				<view class="menu-item" @click="handleReview(currentItem)">
					<app-icon name="book" :size="40" color="#007AFF" />
					<text class="menu-text">查看题目</text>
				</view>
				<view class="menu-item" @click="handleDelete">
					<app-icon name="delete" :size="40" color="#FF3B30" />
					<text class="menu-text">删除笔记</text>
				</view>
				<view class="menu-item cancel" @click="showActionMenu = false">
					<text class="menu-text">取消</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getNoteList, deleteNote } from '@/api/index';
import { getAllCourses } from '@/api/index';
import { useUserStore } from '@/store/user';
import AppIcon from '@/components/app-icon/app-icon.vue';

const userStore = useUserStore();

const noteList = ref([]);
const courseList = ref([]);
const selectedCourseId = ref(null);
const loading = ref(false);
const showActionMenu = ref(false);
const currentItem = ref(null);

onMounted(() => {
	loadCourseList();
	loadNoteList();
});

// 加载课程列表
const loadCourseList = async () => {
	try {
		const res = await getAllCourses();
		// 处理API响应格式
		let data = [];
		if (res && res.data && Array.isArray(res.data)) {
			data = res.data;
		} else if (Array.isArray(res)) {
			data = res;
		}
		courseList.value = data;
	} catch (error) {
		console.error('获取课程列表失败:', error);
	}
};

// 加载笔记列表
const loadNoteList = async () => {
	if (!userStore.isLoggedIn) {
		uni.showToast({
			title: '请先登录',
			icon: 'none',
		});
		return;
	}

	loading.value = true;
	try {
		const res = await getNoteList();
		
		let data = [];
		if (res && res.data && Array.isArray(res.data)) {
			data = res.data;
		} else if (Array.isArray(res)) {
			data = res;
		}

		// 筛选课程（根据题目的 course_id）
		if (selectedCourseId.value !== null) {
			data = data.filter((item) => {
				// 优先使用 item.course_id（后端返回的）
				if (item.course_id !== undefined && item.course_id !== null) {
					return item.course_id === selectedCourseId.value;
				}
				// 如果没有 course_id，尝试从 question 中获取
				if (item.question && item.question.course_id !== undefined) {
					return item.question.course_id === selectedCourseId.value;
				}
				return false;
			});
		}

		noteList.value = data;
	} catch (error) {
		console.error('获取笔记列表失败:', error);
		uni.showToast({
			title: error.message || '获取笔记列表失败',
			icon: 'none',
		});
		noteList.value = [];
	} finally {
		loading.value = false;
	}
};

// 选择课程筛选
const selectCourse = (courseId) => {
	selectedCourseId.value = courseId;
	loadNoteList();
};

// 下拉刷新
const onRefresh = () => {
	loadNoteList();
};

// 格式化题目内容（去除HTML标签，截取前50字）
const formatQuestionStem = (stem) => {
	if (!stem) return '题目内容加载中...';
	// 去除HTML标签
	const text = stem.replace(/<[^>]+>/g, '').trim();
	// 截取前50字
	return text.length > 50 ? text.substring(0, 50) + '...' : text;
};

// 格式化笔记内容（去除HTML标签，截取前80字）
const formatNoteContent = (content) => {
	if (!content) return '';
	// 去除HTML标签
	const text = content.replace(/<[^>]+>/g, '').trim();
	// 截取前80字
	return text.length > 80 ? text.substring(0, 80) + '...' : text;
};

// 获取题目类型名称
const getQuestionTypeName = (type) => {
	const typeMap = {
		1: 'single',
		2: 'multiple',
		3: 'judge',
		4: 'fill',
		5: 'reading',
		6: 'short',
	};
	return typeMap[type] || 'single';
};

// 获取题目类型文本
const getQuestionTypeText = (type) => {
	const typeMap = {
		1: '单选',
		2: '多选',
		3: '判断',
		4: '填空',
		5: '阅读',
		6: '简答',
	};
	return typeMap[type] || '题目';
};

// 格式化时间
const formatTime = (timeStr) => {
	if (!timeStr) return '';
	const date = new Date(timeStr);
	const now = new Date();
	const diff = now - date;
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) {
		return '今天';
	} else if (days === 1) {
		return '昨天';
	} else if (days < 7) {
		return `${days}天前`;
	} else if (days < 30) {
		return `${Math.floor(days / 7)}周前`;
	} else if (days < 365) {
		return `${Math.floor(days / 30)}个月前`;
	} else {
		return `${Math.floor(days / 365)}年前`;
	}
};

// 长按处理
const handleLongPress = (item) => {
	currentItem.value = item;
	showActionMenu.value = true;
};

// 查看题目
const handleReview = (item) => {
	if (!item || !item.question_id) {
		uni.showToast({
			title: '题目信息不完整',
			icon: 'none',
		});
		return;
	}

	uni.navigateTo({
		url: `/pages/answer/index?mode=practice&questionId=${item.question_id}&from=notes`,
	});
};

// 编辑笔记
const handleEdit = () => {
	if (!currentItem.value) return;
	showActionMenu.value = false;
	handleReview(currentItem.value);
};

// 删除笔记
const handleDelete = async () => {
	if (!currentItem.value) return;

	try {
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这条笔记吗？',
			success: async (res) => {
				if (res.confirm) {
					uni.showLoading({ title: '删除中...' });
					await deleteNote(currentItem.value.id);
					uni.hideLoading();

					uni.showToast({
						title: '删除成功',
						icon: 'success',
					});

					showActionMenu.value = false;
					// 重新加载列表
					loadNoteList();
				}
			},
		});
	} catch (error) {
		uni.hideLoading();
		console.error('删除笔记失败:', error);
		uni.showToast({
			title: error.message || '删除笔记失败，请重试',
			icon: 'none',
		});
	}
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';
@import '@/uni.scss';

.notes-page {
	min-height: 100vh;
	background-color: $bg-secondary;
	font-family: $font-family-base;
}

.notes-header {
	@include glassmorphism(0.9);
	padding: $space-6 $space-8;
	padding-top: calc(var(--status-bar-height) + $space-6);
	position: sticky;
	top: 0;
	z-index: $z-sticky;
	box-shadow: $shadow-md;
}

.header-top {
	@include flex(row, space-between, center, 0);
	margin-bottom: $space-4;
}

.header-title {
	@include text(md, bold, primary);
}

.header-count {
	@include text(sm, normal, secondary);
}

.course-filter {
	@include flex(row, flex-start, center, $space-3);
	overflow-x: auto;
	padding-bottom: $space-2;

	&::-webkit-scrollbar {
		display: none;
	}
}

.filter-item {
	padding: $space-2 $space-4;
	border-radius: $radius-full;
	background-color: $color-neutral-200;
	transition: all $transition-fast;
	white-space: nowrap;
	cursor: pointer;

	&.active {
		background-color: $color-primary;
		.filter-text {
			color: $text-inverse;
		}
	}
}

.filter-text {
	@include text(xs, medium, primary);
	color: $text-secondary;
	transition: color $transition-fast;
}

.notes-list {
	padding: $space-4 $space-8;
	min-height: calc(100vh - 200rpx);
}

.loading-state,
.empty-state {
	@include flex(column, center, center, 0);
	padding: $space-32 0;
}

.empty-icon {
	font-size: 80rpx;
	margin-bottom: $space-6;
}

.empty-text {
	@include text(md, medium, primary);
	margin-bottom: $space-2;
}

.empty-hint {
	@include text(sm, normal, tertiary);
}

.note-item {
	@include card(md);
	@include flex(row, flex-start, flex-start, 0);
	margin-bottom: $space-3;
	padding: $space-5;
	cursor: pointer;

	&:active {
		opacity: 0.7;
		transform: scale(0.98);
	}
}

.item-left {
	margin-right: $space-4;
	flex-shrink: 0;
}

.question-type-tag {
	padding: $space-2 $space-3;
	border-radius: $radius-sm;
	@include text(xs, medium, primary);

	&.type-single {
		background-color: rgba($color-success, 0.1);
		color: $color-success;
	}

	&.type-multiple {
		background-color: rgba($color-primary, 0.1);
		color: $color-primary;
	}

	&.type-judge {
		background-color: rgba($color-secondary, 0.1);
		color: $color-secondary;
	}

	&.type-fill {
		background-color: rgba($color-warning, 0.1);
		color: $color-warning;
	}

	&.type-reading {
		background-color: rgba($color-error, 0.1);
		color: $color-error;
	}

	&.type-short {
		background-color: rgba($color-warning, 0.1);
		color: $color-warning-dark;
	}
}

.type-text {
	@include text(xs, medium, primary);
}

.item-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $space-2;
	min-width: 0;
}

.item-title {
	@include text(base, normal, primary);
	line-height: $line-height-relaxed;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.item-note {
	@include text(sm, normal, secondary);
	color: $color-primary;
	line-height: $line-height-relaxed;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	margin-top: $space-1;
}

.item-meta {
	display: flex;
	align-items: center;
	gap: $space-2;
	flex-wrap: wrap;
	margin-top: $space-2;
}

.meta-item {
	@include text(xs, normal, secondary);
}

.item-actions {
	margin-left: $space-4;
	flex-shrink: 0;
	display: flex;
	align-items: center;
}

/* 操作菜单 */
.action-menu-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.4);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	animation: fadeIn $transition-base;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.action-menu {
	width: 100%;
	background-color: $bg-primary;
	border-radius: $radius-2xl $radius-2xl 0 0;
	padding: $space-6;
	padding-bottom: calc($space-6 + env(safe-area-inset-bottom));
	animation: slideUp $transition-base;
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}

.menu-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $space-6;
	border-radius: $radius-lg;
	margin-bottom: $space-4;
	transition: background-color $transition-fast;

	&:active {
		background-color: $color-neutral-100;
	}

	&.cancel {
		margin-top: $ios-spacing-lg;
		padding-top: $ios-spacing-lg;
		border-top: 1rpx solid $ios-gray-2;
	}
}

.menu-text {
	@include ios-text(base, medium, primary);
	margin-top: $ios-spacing-xs;
}
</style>
