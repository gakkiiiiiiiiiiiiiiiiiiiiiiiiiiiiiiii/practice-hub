<template>
	<view class="bank-page">
		<!-- 顶部下拉选择 -->
		<view class="bank-header">
			<view class="header-selector" @click="showSubjectMenu = !showSubjectMenu">
				<text class="selector-text">{{ currentSubject.name }}</text>
				<text class="selector-arrow" :class="{ 'arrow-up': showSubjectMenu }">▼</text>
			</view>
			
			<!-- 下拉菜单 -->
			<view class="subject-dropdown" v-if="showSubjectMenu">
				<view
					v-for="subject in subjects"
					:key="subject.id"
					class="dropdown-item"
					:class="{ 'active': currentSubject.id === subject.id }"
					@click="selectSubject(subject)"
				>
					<text class="dropdown-text">{{ subject.name }}</text>
					<text class="dropdown-check" v-if="currentSubject.id === subject.id">✓</text>
				</view>
			</view>
		</view>

		<scroll-view class="page-content" scroll-y @refresherrefresh="onRefresh" refresher-enabled>
			<!-- 加载状态 -->
			<view v-if="bankDataLoading" class="loading-container">
				<text class="loading-text">加载中...</text>
			</view>
			
			<!-- 内容区域 -->
			<template v-else>
				<!-- 统计卡片 -->
				<view class="stats-card" v-if="currentBank">
					<view class="stats-left">
						<text class="stats-label">累计正确率</text>
						<text class="stats-value">{{ accuracy }}%</text>
					</view>
					<view class="stats-right">
						<text class="stats-label-small">已刷题/总题数</text>
						<text class="stats-value-small">{{ currentBank?.doneCount || 0 }} <text class="stats-total">/ {{ currentBank?.totalCount || 0 }}</text></text>
					</view>
					<!-- 进度条 -->
					<view class="stats-progress">
						<view class="progress-bar" :style="{ width: accuracy + '%' }"></view>
					</view>
				</view>

			<!-- 8宫格功能 -->
			<view class="function-grid">
				<view
					v-for="(item, idx) in functionList"
					:key="idx"
					class="grid-item"
					@click="handleFunction(item.type)"
				>
					<view class="grid-icon-wrapper" :class="`icon-${idx}`">
						<text class="grid-icon">{{ item.icon }}</text>
					</view>
					<text class="grid-text">{{ item.name }}</text>
				</view>
			</view>

			<!-- 历年真题 -->
			<view class="paper-section" v-if="paperList.length > 0">
				<text class="section-title-small">历年真题</text>
				<view class="paper-list">
					<view
						v-for="paper in paperList"
						:key="paper.id"
						class="paper-item"
						@click="handlePaperClick(paper)"
					>
						<view class="paper-left">
							<view class="paper-icon-wrapper" :class="{ 'locked': paper.status === 'locked' }">
								<text class="paper-icon" v-if="paper.status === 'locked'">🔒</text>
								<text class="paper-icon" v-else>🔓</text>
							</view>
							<view class="paper-info">
								<text class="paper-name">{{ paper.name || (paper.year ? paper.year + '年真题试卷' : '真题试卷') }}</text>
								<text class="paper-meta">进度: {{ paper.progress || 0 }}/{{ paper.questionCount }} | 正确率: {{ paper.accuracy || '0%' }}</text>
							</view>
						</view>
						<text class="paper-arrow">›</text>
					</view>
				</view>
			</view>

			<!-- 章节列表 -->
			<view class="chapter-section" v-if="chapterList.length > 0">
				<view class="section-title">章节练习</view>
				<view class="chapter-list">
					<view
						v-for="chapter in chapterList"
						:key="chapter.id"
						class="chapter-item"
						@click="handleChapterClick(chapter)"
					>
						<view class="chapter-info">
							<text class="chapter-name">{{ chapter.name }}</text>
							<text class="chapter-meta">{{ chapter.questionCount }}题</text>
						</view>
						<view class="chapter-status">
							<app-icon v-if="chapter.status === 'locked'" name="lock" :size="32" class="status-icon" />
							<app-icon v-else-if="chapter.status === 'done'" name="check" :size="32" class="status-icon" />
							<text v-else class="status-progress">{{ chapter.progress || 0 }}/{{ chapter.questionCount }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view v-if="!bankDataLoading && currentBank && paperList.length === 0 && chapterList.length === 0" class="empty-container">
				<text class="empty-text">暂无章节和真题</text>
			</view>
			</template>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useBankStore } from '@/store/bank';
import { useUserStore } from '@/store/user';
import { getAllSubjects, getSubjectDetail, getChapterQuestions } from '@/api/index';
import BankSelector from '@/components/bank-selector/bank-selector.vue';
import AppIcon from '@/components/app-icon/app-icon.vue';

const bankStore = useBankStore();
const userStore = useUserStore();

const currentBank = ref(null);
const paperList = ref([]);
const chapterList = ref([]);
const showSubjectMenu = ref(false);
const currentSubject = ref({ id: null, name: '请选择题库' });
const subjects = ref([]);
const bankDataLoading = ref(false);

const functionList = ref([
	{ name: '模拟考试', icon: '📝', type: 'exam', color: '#3b82f6' },
	{ name: '随机练习', icon: '🔄', type: 'random', color: '#10b981' },
	{ name: '练习历史', icon: '⏰', type: 'history', color: '#f59e0b' },
	{ name: '错题集', icon: '❌', type: 'wrong', color: '#ef4444' },
	{ name: '我的收藏', icon: '⭐', type: 'favorite', color: '#eab308' },
	{ name: '我的笔记', icon: '✏️', type: 'notes', color: '#a855f7' },
	{ name: '刷题排行', icon: '📊', type: 'rank', color: '#6366f1' },
	{ name: '重置记录', icon: '📚', type: 'reset', color: '#6b7280' },
]);

const accuracy = computed(() => {
	if (!currentBank.value || !currentBank.value.totalCount) return 0;
	const done = currentBank.value.doneCount || 0;
	const correct = currentBank.value.correctCount || 0;
	return done > 0 ? Math.round((correct / done) * 100) : 0;
});

onMounted(() => {
	// 先获取题库列表，再获取详情
	fetchSubjectsList().then(() => {
		fetchBankData();
	});
	// 监听题库切换事件
	uni.$on('bank-changed', () => {
		fetchBankData();
	});
});

const onRefresh = () => {
	fetchBankData().finally(() => {
		uni.stopPullDownRefresh();
	});
};

// 获取题库列表
const fetchSubjectsList = async () => {
	try {
		const subjectsList = await getAllSubjects();
		if (subjectsList && subjectsList.length > 0) {
			subjects.value = subjectsList.map((subject) => ({
				id: subject.id,
				name: subject.name,
				active: subject.id === (bankStore.currentBankId || subjectsList[0].id),
			}));
			
			// 如果没有当前题库，选择第一个
			if (!bankStore.currentBankId) {
				bankStore.setCurrentBank(subjectsList[0].id);
				currentSubject.value = {
					id: subjectsList[0].id,
					name: subjectsList[0].name,
				};
			} else {
				// 设置当前选中的题库
				const current = subjectsList.find(s => s.id === bankStore.currentBankId);
				if (current) {
					currentSubject.value = {
						id: current.id,
						name: current.name,
					};
				} else {
					// 如果当前题库不存在，选择第一个
					bankStore.setCurrentBank(subjectsList[0].id);
					currentSubject.value = {
						id: subjectsList[0].id,
						name: subjectsList[0].name,
					};
				}
			}
		} else {
			// 没有题库数据
			subjects.value = [];
			currentSubject.value = { id: null, name: '暂无题库' };
		}
	} catch (error) {
		console.error('获取题库列表失败:', error);
		subjects.value = [];
		currentSubject.value = { id: null, name: '加载失败' };
	}
};

const fetchBankData = async () => {
	if (!bankStore.currentBankId) {
		// 如果没有当前题库，先获取题库列表
		await fetchSubjectsList();
		if (!bankStore.currentBankId) {
			return;
		}
	}

	bankDataLoading.value = true;
	try {
		// 获取题库详情
		const bankDetail = await getSubjectDetail(bankStore.currentBankId);
		
		// 处理题库基本信息
		currentBank.value = {
			id: bankDetail.id,
			name: bankDetail.name,
			cover_img: bankDetail.cover_img,
			price: bankDetail.price || 0,
			is_vip_free: bankDetail.is_vip_free || 0,
			student_count: bankDetail.student_count || 0,
			hasAuth: bankDetail.hasAuth || false,
			// 统计数据（需要从用户答题记录中获取，暂时设为0）
			totalCount: 0, // 总题数，需要统计所有章节的题目数
			doneCount: 0, // 已做题数
			correctCount: 0, // 正确题数
		};

		// 处理章节数据，区分历年真题和章节练习
		paperList.value = [];
		chapterList.value = [];
		
		if (bankDetail.chapters && Array.isArray(bankDetail.chapters)) {
			// 分离历年真题（type === 'year'）和章节练习（type === 'chapter'）
			const papers = [];
			const chapters = [];
			
			// 并行获取每个章节的题目数量（限制并发，避免请求过多）
			const batchSize = 5; // 每批处理5个章节
			let totalQuestionCount = 0;
			
			for (let i = 0; i < bankDetail.chapters.length; i += batchSize) {
				const batch = bankDetail.chapters.slice(i, i + batchSize);
				const chapterPromises = batch.map(async (chapter) => {
					try {
						// 获取章节下的题目列表以获取题目数量
						const questions = await getChapterQuestions(chapter.id);
						const questionCount = questions ? questions.length : 0;
						totalQuestionCount += questionCount;
						return {
							...chapter,
							questionCount,
							questions: questions || []
						};
					} catch (error) {
						console.error(`获取章节 ${chapter.id} 题目失败:`, error);
						return {
							...chapter,
							questionCount: 0,
							questions: []
						};
					}
				});
				
				const chaptersWithQuestions = await Promise.all(chapterPromises);
				
				// 分类处理
				chaptersWithQuestions.forEach((chapter) => {
					const chapterData = {
						id: chapter.id,
						name: chapter.name,
						type: chapter.type || 'chapter',
						is_free: chapter.is_free || 0,
						questionCount: chapter.questionCount || 0,
						progress: 0, // 需要从用户答题记录中获取
						status: getChapterStatus(chapter, bankDetail.hasAuth),
					};
					
					if (chapter.type === 'year') {
						// 历年真题：从名称中提取年份
						const yearMatch = chapter.name.match(/(\d{4})/);
						papers.push({
							...chapterData,
							year: yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear(),
							accuracy: '0%', // 需要从用户答题记录中获取
							status: getPaperStatus(chapter, bankDetail.hasAuth),
						});
					} else {
						// 章节练习
						chapters.push(chapterData);
					}
				});
			}
			
			// 更新总题数
			currentBank.value.totalCount = totalQuestionCount;
			
			// 按年份倒序排列历年真题
			paperList.value = papers.sort((a, b) => (b.year || 0) - (a.year || 0));
			// 按排序字段排列章节
			chapterList.value = chapters.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		}
	} catch (error) {
		console.error('获取题库数据失败:', error);
		
		// 如果是404错误或"不存在"错误，说明题库不存在，尝试获取题库列表并选择第一个
		const isNotFoundError = error.message && (
			error.message.includes('不存在') || 
			error.message.includes('404') ||
			error.message.includes('Not Found')
		);
		
		if (isNotFoundError) {
			try {
				const subjectsList = await getAllSubjects();
				if (subjectsList && subjectsList.length > 0) {
					// 检查当前题库ID是否在列表中
					const currentExists = subjectsList.some(s => s.id === bankStore.currentBankId);
					
					if (!currentExists) {
						// 当前题库不存在，清除并选择第一个
						bankStore.setCurrentBank(subjectsList[0].id);
						currentSubject.value = {
							id: subjectsList[0].id,
							name: subjectsList[0].name,
						};
						// 递归调用，重新获取数据
						return fetchBankData();
					}
				} else {
					// 没有可用题库
					uni.showToast({
						title: '暂无可用题库',
						icon: 'none',
						duration: 2000
					});
				}
			} catch (listError) {
				console.error('获取题库列表失败:', listError);
				uni.showToast({
					title: '获取题库列表失败',
					icon: 'none',
					duration: 2000
				});
			}
		} else {
			// 其他错误，显示错误提示
			uni.showToast({
				title: error.message || '获取题库数据失败',
				icon: 'none',
				duration: 2000
			});
		}
		
		// 接口失败时，清空数据
		currentBank.value = null;
		paperList.value = [];
		chapterList.value = [];
	} finally {
		bankDataLoading.value = false;
	}
};

const getPaperStatus = (paper, hasAuth) => {
	// 暂时不进行权限校验，直接解锁
	// if (paper.is_free === 1 || hasAuth) {
		// 检查进度
		const progress = paper.progress || 0;
		if (progress >= paper.questionCount) {
			return 'done';
		}
		return 'progress';
	// }
	// return 'locked';
};

const getChapterStatus = (chapter, hasAuth) => {
	// 暂时不进行权限校验，直接解锁
	// if (chapter.is_free === 1 || hasAuth) {
		const progress = chapter.progress || 0;
		if (progress >= chapter.questionCount) {
			return 'done';
		}
		return 'progress';
	// }
	// return 'locked';
};

const selectSubject = (subject) => {
	if (!subject || !subject.id) {
		uni.showToast({
			title: '题库信息不完整',
			icon: 'none'
		});
		return;
	}
	
	currentSubject.value = subject;
	showSubjectMenu.value = false;
	// 设置当前题库
	bankStore.setCurrentBank(subject.id);
	// 切换科目后重新加载数据
	fetchBankData();
};

const handleFunction = (type) => {
	const routeMap = {
		exam: () => {
			if (!bankStore.currentBankId) {
				uni.showToast({ title: '请先选择题库', icon: 'none' });
				return;
			}
			uni.navigateTo({
				url: `/pages/answer/index?mode=exam&bankId=${bankStore.currentBankId}`,
			});
		},
		random: () => {
			if (!bankStore.currentBankId) {
				uni.showToast({ title: '请先选择题库', icon: 'none' });
				return;
			}
			uni.navigateTo({
				url: `/pages/answer/index?mode=practice&bankId=${bankStore.currentBankId}&type=random`,
			});
		},
		history: () => {
			uni.showToast({ title: '练习历史功能开发中', icon: 'none' });
		},
		wrong: () => {
			uni.navigateTo({
				url: '/pages/sub-pages/wrong/index',
			});
		},
		favorite: () => {
			uni.showToast({ title: '收藏功能开发中', icon: 'none' });
		},
		rank: () => {
			uni.navigateTo({
				url: '/pages/sub-pages/rank/index',
			});
		},
		trajectory: () => {
			uni.navigateTo({
				url: '/pages/sub-pages/trajectory/index',
			});
		},
		notes: () => {
			uni.showToast({ title: '笔记功能开发中', icon: 'none' });
		},
		reset: () => {
			uni.showModal({
				title: '提示',
				content: '确定要重置所有记录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.showToast({ title: '重置成功', icon: 'success' });
					}
				},
			});
		},
	};

	const handler = routeMap[type];
	if (handler) {
		handler();
	}
};

const handlePaperClick = (paper) => {
	// 暂时不进行权限校验
	// if (paper.status === 'locked') {
	// 	// 显示购买/激活弹窗
	// 	showPaymentModal();
	// 	return;
	// }

	uni.navigateTo({
		url: `/pages/answer/index?mode=practice&paperId=${paper.id}&bankId=${bankStore.currentBankId}`,
	});
};

const handleChapterClick = (chapter) => {
	// 暂时不进行权限校验
	// if (chapter.status === 'locked') {
	// 	showPaymentModal();
	// 	return;
	// }

	uni.navigateTo({
		url: `/pages/answer/index?mode=practice&chapterId=${chapter.id}&bankId=${bankStore.currentBankId}`,
	});
};

const showPaymentModal = () => {
	uni.showModal({
		title: '提示',
		content: '该内容需要VIP权限，是否前往购买？',
		confirmText: '去购买',
		success: (res) => {
			if (res.confirm) {
				uni.navigateTo({
					url: '/pages/user/index?tab=payment',
				});
			}
		},
	});
};
</script>

<style lang="scss" scoped>
.bank-page {
	min-height: 100vh;
	background: #f5f5f5;
	display: flex;
	flex-direction: column;
	padding-bottom: 120rpx;
	box-sizing: border-box;
	overflow-x: hidden;
	width: 100%;
}

.bank-header {
	background: #ffffff;
	padding: 32rpx;
	padding-top: calc(var(--status-bar-height) + 32rpx);
	position: sticky;
	top: 0;
	z-index: 20;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	width: 100%;
	box-sizing: border-box;
}

.header-selector {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	cursor: pointer;
	width: 100%;
	box-sizing: border-box;
}

.selector-text {
	font-size: 36rpx;
	font-weight: 700;
	color: #1f2937;
}

.selector-arrow {
	font-size: 24rpx;
	color: #6b7280;
	transition: transform 0.3s ease;
	
	&.arrow-up {
		transform: rotate(180deg);
	}
}

.subject-dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: #ffffff;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	border-radius: 0 0 24rpx 24rpx;
	overflow: hidden;
	animation: slideDown 0.3s ease;
	width: 100%;
	box-sizing: border-box;
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.dropdown-item {
	padding: 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 2rpx solid #f3f4f6;
	
	&:last-child {
		border-bottom: none;
	}
	
	&.active {
		background: #dbeafe;
		color: #2563eb;
	}
	
	&:active {
		background: #f9fafb;
	}
}

.dropdown-text {
	font-size: 32rpx;
	color: #374151;
}

.dropdown-check {
	font-size: 32rpx;
	color: #2563eb;
	font-weight: 700;
}

.page-content {
	flex: 1;
	padding: 32rpx;
	width: 100%;
	box-sizing: border-box;
}

/* 统计卡片 */
.stats-card {
	background: #2563eb;
	color: #ffffff;
	padding: 40rpx;
	border-radius: 32rpx;
	margin-bottom: 32rpx;
	box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.3);
	width: 100%;
	box-sizing: border-box;
}

.stats-left,
.stats-right {
	margin-bottom: 32rpx;
	width: 100%;
	box-sizing: border-box;
}

.stats-label {
	display: block;
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
	margin-bottom: 16rpx;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.stats-value {
	font-size: 72rpx;
	font-weight: 700;
	font-family: 'DIN', Arial, sans-serif;
	line-height: 1;
	width: 100%;
	box-sizing: border-box;
	word-break: break-all;
}

.stats-label-small {
	display: block;
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
	margin-bottom: 8rpx;
	text-align: right;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.stats-value-small {
	font-size: 36rpx;
	font-weight: 500;
	text-align: right;
	width: 100%;
	box-sizing: border-box;
	word-break: break-all;
}

.stats-total {
	opacity: 0.7;
	font-size: 28rpx;
}

.stats-progress {
	width: 100%;
	height: 8rpx;
	background: rgba(59, 130, 246, 0.3);
	border-radius: 4rpx;
	overflow: hidden;
}

.progress-bar {
	height: 100%;
	background: #ffffff;
	border-radius: 4rpx;
	transition: width 0.3s ease;
}

/* 8宫格功能 */
.function-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16rpx;
	padding: 24rpx;
	background: #ffffff;
	border-radius: 24rpx;
	margin-bottom: 32rpx;
	width: 100%;
	box-sizing: border-box;
}

.grid-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	transition: all 0.3s ease;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	
	&:active {
		opacity: 0.7;
		transform: scale(0.95);
	}
}

.grid-icon-wrapper {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f3f4f6;
	
	&.icon-0 { background: #dbeafe; }
	&.icon-1 { background: #d1fae5; }
	&.icon-2 { background: #fef3c7; }
	&.icon-3 { background: #fee2e2; }
	&.icon-4 { background: #fef3c7; }
	&.icon-5 { background: #f3e8ff; }
	&.icon-6 { background: #e0e7ff; }
	&.icon-7 { background: #f3f4f6; }
}

.grid-icon {
	font-size: 40rpx;
}

.grid-text {
	font-size: 24rpx;
	color: #6b7280;
	text-align: center;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	box-sizing: border-box;
}

/* 历年真题 */
.paper-section {
	margin-bottom: 48rpx;
	width: 100%;
	box-sizing: border-box;
}

.section-title-small {
	font-size: 28rpx;
	color: #6b7280;
	font-weight: 500;
	margin-bottom: 24rpx;
	display: block;
	width: 100%;
	box-sizing: border-box;
}

.paper-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	width: 100%;
	box-sizing: border-box;
}

.paper-item {
	background: #ffffff;
	padding: 32rpx;
	border-radius: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	border: 2rpx solid #f3f4f6;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all 0.3s ease;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	
	&:active {
		transform: scale(0.99);
		background: #f9fafb;
	}
}

.paper-left {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.paper-icon-wrapper {
	width: 96rpx;
	height: 96rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
	background: #dbeafe;
	
	&.locked {
		background: #f3f4f6;
	}
}

.paper-icon {
	font-size: 40rpx;
}

.paper-info {
	flex: 1;
	min-width: 0;
}

.paper-name {
	font-size: 32rpx;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 12rpx;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
	box-sizing: border-box;
}

.paper-meta {
	font-size: 24rpx;
	color: #9ca3af;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
	box-sizing: border-box;
}

.paper-arrow {
	font-size: 48rpx;
	color: #d1d5db;
	font-weight: 300;
	flex-shrink: 0;
	margin-left: 16rpx;
}

.chapter-section {
	margin-bottom: 48rpx;
	width: 100%;
	box-sizing: border-box;
}

.chapter-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	width: 100%;
	box-sizing: border-box;
}

.chapter-item {
	background: #ffffff;
	padding: 32rpx;
	border-radius: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	border: 2rpx solid #f3f4f6;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all 0.3s ease;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	
	&:active {
		transform: scale(0.99);
		background: #f9fafb;
	}
}

.chapter-info {
	flex: 1;
	min-width: 0;
}

.chapter-name {
	font-size: 32rpx;
	font-weight: 500;
	color: #1f2937;
	margin-bottom: 8rpx;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
	box-sizing: border-box;
}

.chapter-meta {
	font-size: 24rpx;
	color: #9ca3af;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
	box-sizing: border-box;
}

.chapter-status {
	display: flex;
	align-items: center;
}

/* 加载和空状态 */
.loading-container,
.empty-container {
	padding: 80rpx 32rpx;
	text-align: center;
	width: 100%;
	box-sizing: border-box;
}

.loading-text,
.empty-text {
	font-size: 28rpx;
	color: #9ca3af;
}
</style>
