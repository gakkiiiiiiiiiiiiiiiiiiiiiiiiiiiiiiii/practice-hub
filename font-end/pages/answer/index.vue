<template>
	<view class="answer-page" :class="{ 'night-mode': nightMode }">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar">
			<view class="navbar-left" @click="handleBack">
				<text class="navbar-icon">←</text>
			</view>
			<view class="navbar-center">
				<text class="navbar-title">{{ mode === 'exam' ? '模拟考试' : '练习模式' }}</text>
				<text class="navbar-countdown" v-if="mode === 'exam' && examTimeLeft > 0">
					{{ formatCountdown(examTimeLeft) }}
				</text>
			</view>
			<view class="navbar-right">
				<text class="navbar-icon" @click="showAnswerSheet = true">答题卡</text>
				<text class="navbar-icon" @click="showSettings = true">设置</text>
			</view>
		</view>

		<!-- 题目滑动区 -->
		<swiper class="question-swiper" :current="currentIndex" @change="handleSwiperChange" :duration="300">
			<swiper-item v-for="(question, index) in visibleQuestions" :key="question.id || index" class="swiper-item">
				<question-card
					:question="question"
					:question-index="index"
					:total-count="questionList.length"
					:selected-answers="getSelectedAnswers(question.id)"
					:show-result="showResult"
					:show-analysis="showAnalysis && (mode === 'practice' || showResult)"
					:mode="mode"
					:night-mode="nightMode"
					@select="handleAnswerSelect"
				/>
			</swiper-item>
		</swiper>

		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<view class="bar-left">
				<view class="action-btn" @click="toggleFavorite">
					<app-icon :name="isFavorite ? 'star-fill' : 'star'" :size="32" class="action-icon" />
				</view>
				<view class="action-btn" @click="handleErrorReport">
					<app-icon name="report" :size="32" class="action-icon" />
				</view>
				<view class="action-btn" @click="toggleDraftBoard">
					<app-icon name="draft" :size="32" class="action-icon" />
				</view>
			</view>
			<view class="bar-center">
				<view class="nav-btn" @click="handlePrev" :class="{ disabled: currentIndex === 0 }">
					<text>上一题</text>
				</view>
				<view class="nav-btn" @click="handleNext" :class="{ disabled: currentIndex === questionList.length - 1 }">
					<text>下一题</text>
				</view>
			</view>
			<view class="bar-right">
				<view class="submit-btn" v-if="mode === 'exam'" @click="handleSubmit">
					<text>交卷</text>
				</view>
			</view>
		</view>

		<!-- 草稿纸 -->
		<draft-board v-model:visible="draftBoardVisible" @close="draftBoardVisible = false" />

		<!-- 答题卡弹窗 -->
		<uni-popup ref="answerSheetPopup" type="bottom" :safe-area="false">
			<view class="answer-sheet-popup">
				<view class="popup-header">
					<text class="popup-title">答题卡</text>
					<app-icon name="close" :size="24" class="popup-close" @click="showAnswerSheet = false" />
				</view>
				<view class="answer-sheet-grid">
					<view
						v-for="(question, index) in questionList"
						:key="question.id"
						class="sheet-item"
						:class="getSheetItemClass(question.id, index)"
						@click="handleSheetItemClick(index)"
					>
						{{ index + 1 }}
					</view>
				</view>
			</view>
		</uni-popup>

		<!-- 设置弹窗 -->
		<uni-popup ref="settingsPopup" type="center" :safe-area="false">
			<view class="settings-popup">
				<view class="popup-header">
					<text class="popup-title">设置</text>
					<text class="popup-close" @click="showSettings = false">✕</text>
				</view>
				<view class="settings-content">
					<view class="setting-item">
						<text class="setting-label">字号</text>
						<view class="setting-options">
							<text
								v-for="size in fontSizeOptions"
								:key="size.value"
								class="setting-option"
								:class="{ active: fontSize === size.value }"
								@click="setFontSize(size.value)"
							>
								{{ size.label }}
							</text>
						</view>
					</view>
					<view class="setting-item">
						<text class="setting-label">夜间模式</text>
						<switch :checked="nightMode" @change="toggleNightMode" />
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { formatCountdown } from '@/utils/date';
import { useBankStore } from '@/store/bank';
import { getChapterQuestions, getQuestionDetail, submitAnswer, batchSubmit, toggleCollection } from '@/api/index';
import QuestionCard from '@/components/question-card/question-card.vue';
import DraftBoard from '@/components/draft-board/draft-board.vue';
import AppIcon from '@/components/app-icon/app-icon.vue';

const bankStore = useBankStore();

// 路由参数
const mode = ref('practice'); // practice, exam
const paperId = ref(null);
const chapterId = ref(null);
const bankId = ref(bankStore.currentBankId);

// 在 onLoad 中获取页面参数
onLoad((options) => {
	console.log('刷题页面 onLoad 参数:', options);
	
	// 设置模式
	if (options.mode) {
		mode.value = options.mode;
	}
	
	// 将字符串参数转换为数字
	if (options.paperId) {
		paperId.value = parseInt(options.paperId);
	}
	if (options.chapterId) {
		chapterId.value = parseInt(options.chapterId);
	}
	if (options.bankId) {
		bankId.value = parseInt(options.bankId);
	} else if (bankStore.currentBankId) {
		bankId.value = bankStore.currentBankId;
	}
	
	console.log('解析后的参数:', {
		mode: mode.value,
		chapterId: chapterId.value,
		paperId: paperId.value,
		bankId: bankId.value,
	});
});

// 状态
const questionList = ref([]);
const currentIndex = ref(0);
const answers = ref({}); // { questionId: ['A'] or ['A', 'B'] }
const showResult = ref(false);
const showAnalysis = ref(mode.value === 'practice');
const draftBoardVisible = ref(false);
const showAnswerSheet = ref(false);
const showSettings = ref(false);
const isFavorite = ref(false);
const examTimeLeft = ref(0); // 考试剩余时间（秒）
let examTimer = null;

// 设置
const fontSize = ref(bankStore.settings.fontSize);
const nightMode = ref(bankStore.settings.nightMode);

const fontSizeOptions = [
	{ label: '小', value: 'small' },
	{ label: '中', value: 'medium' },
	{ label: '大', value: 'large' },
];

// 虚拟列表：只渲染当前、前一个、后一个
const visibleQuestions = computed(() => {
	const start = Math.max(0, currentIndex.value - 1);
	const end = Math.min(questionList.value.length, currentIndex.value + 2);
	return questionList.value.slice(start, end);
});

onMounted(() => {
	loadQuestions();
	if (mode.value === 'exam') {
		startExamTimer();
	}
	loadProgress();
});

onUnmounted(() => {
	saveProgress();
	if (examTimer) {
		clearInterval(examTimer);
	}
});

const answerSheetPopup = ref(null);
const settingsPopup = ref(null);

watch(showAnswerSheet, (val) => {
	if (val && answerSheetPopup.value) {
		answerSheetPopup.value.open();
	} else if (!val && answerSheetPopup.value) {
		answerSheetPopup.value.close();
	}
});

watch(showSettings, (val) => {
	if (val && settingsPopup.value) {
		settingsPopup.value.open();
	} else if (!val && settingsPopup.value) {
		settingsPopup.value.close();
	}
});

const loadQuestions = async () => {
	try {
		let questions = [];
		const targetChapterId = chapterId.value || paperId.value;
		
		if (!targetChapterId) {
			// 随机练习：暂时不支持，需要后端提供接口
			console.error('缺少章节ID或试卷ID:', { 
				chapterId: chapterId.value, 
				paperId: paperId.value,
				mode: mode.value,
				bankId: bankId.value
			});
			uni.showToast({
				title: '请选择章节或试卷',
				icon: 'none',
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
			return;
		}
		
		// 获取章节下的题目列表（paperId 实际上也是章节ID，type === 'year'）
		questions = await getChapterQuestions(targetChapterId);
		
		if (!questions || questions.length === 0) {
			uni.showToast({
				title: '暂无题目',
				icon: 'none',
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
			return;
		}
		
		// 转换题目数据格式：后端格式 -> 前端格式
		// 题目类型：1-单选, 2-多选, 3-判断, 4-填空, 5-阅读理解
		questionList.value = questions.map((q) => {
			let questionType = 'single';
			if (q.type === 2) {
				questionType = 'multiple';
			} else if (q.type === 3) {
				questionType = 'judge';
			} else if (q.type === 4) {
				questionType = 'fill';
			} else if (q.type === 5) {
				questionType = 'reading';
			}
			
			return {
				id: q.id,
				type: questionType,
				content: q.stem || '',
				options: (q.options || []).map((opt, idx) => ({
					key: opt.label || String.fromCharCode(65 + idx), // A, B, C, D
					content: opt.text || opt.content || '',
				})),
				correctAnswer: q.answer || [], // 题目列表接口可能不返回答案，需要提交后获取
				explanation: q.analysis || '', // 题目列表接口可能不返回解析，需要提交后获取
				parent_id: q.parent_id || 0, // 阅读理解父题ID
				// 保留原始数据
				_raw: q,
			};
		});
		
		// 注意：不预加载题目详情，因为：
		// 1. 题目详情接口需要登录认证
		// 2. 解析信息在提交答案后会返回
		// 3. 避免不必要的401错误
	} catch (error) {
		console.error('加载题目失败:', error);
		uni.showToast({
			title: error.message || '加载题目失败',
			icon: 'none',
		});
		setTimeout(() => {
			uni.navigateBack();
		}, 1500);
	}
};

// 加载单题详情（包含解析）
// 暂时不进行权限校验
const loadQuestionDetail = async (questionId) => {
	try {
		// 暂时不检查登录状态
		// const token = uni.getStorageSync('auth_token');
		// if (!token) {
		//   console.log('未登录，跳过加载题目详情');
		//   return;
		// }
		
		const detail = await getQuestionDetail(questionId);
		// 更新题目列表中的解析信息
		const question = questionList.value.find((q) => q.id === questionId);
		if (question) {
			question.explanation = detail.analysis || question.explanation;
			question.correctAnswer = detail.answer || question.correctAnswer;
		}
	} catch (error) {
		console.error('加载题目详情失败:', error);
		// 不显示错误，解析信息会在提交答案后返回
	}
};

const loadProgress = () => {
	const key = `progress_${bankId.value}_${paperId.value || chapterId.value || 'random'}`;
	const saved = uni.getStorageSync(key);
	if (saved) {
		answers.value = saved.answers || {};
		currentIndex.value = saved.currentIndex || 0;
	}
};

const saveProgress = () => {
	const key = `progress_${bankId.value}_${paperId.value || chapterId.value || 'random'}`;
	uni.setStorageSync(key, {
		answers: answers.value,
		currentIndex: currentIndex.value,
		timestamp: Date.now(),
	});
};

const getSelectedAnswers = (questionId) => {
	return answers.value[questionId] || [];
};

const handleAnswerSelect = async (answer) => {
	const question = questionList.value[currentIndex.value];
	if (!question) return;

	// 填空题：answer 是数组
	if (question.type === 'fill') {
		answers.value[question.id] = Array.isArray(answer) ? [...answer] : [answer];
		// 填空题提交答案（练习模式）
		if (mode.value === 'practice') {
			await checkAnswer(question);
		}
	} else {
		// 单选题、多选题、判断题：answer 是选项key（如 'A'）
		const optionKey = answer;
		const currentAnswers = getSelectedAnswers(question.id);

		if (question.type === 'multiple') {
			// 多选题：切换选中状态
			const index = currentAnswers.indexOf(optionKey);
			if (index > -1) {
				currentAnswers.splice(index, 1);
			} else {
				currentAnswers.push(optionKey);
			}
			answers.value[question.id] = [...currentAnswers];
		} else {
			// 单选题、判断题：直接替换
			answers.value[question.id] = [optionKey];
			
			// 单选题、判断题选择后立即提交（练习模式）
			if (mode.value === 'practice') {
				await checkAnswer(question);
			}
		}
	}

	saveProgress();
};

const checkAnswer = async (question) => {
	if (!question || !question.id) return;
	
	try {
		const selectedAnswers = getSelectedAnswers(question.id);
		
		// 填空题：检查是否所有空都已填写
		if (question.type === 'fill') {
			if (!selectedAnswers || selectedAnswers.length === 0) {
				return; // 未填写答案，不提交
			}
			// 过滤掉空字符串
			const filledAnswers = selectedAnswers.filter(ans => ans && ans.trim() !== '');
			if (filledAnswers.length === 0) {
				return; // 所有空都未填写，不提交
			}
		} else {
			if (!selectedAnswers || selectedAnswers.length === 0) {
				return; // 未选择答案，不提交
			}
		}
		
		// 提交答案到后端
		const result = await submitAnswer({
			qid: question.id,
			options: selectedAnswers,
		});
		
		// 更新题目状态
		if (result) {
			question.isCorrect = result.is_correct;
			question.correctAnswer = result.answer || question.correctAnswer;
			question.explanation = result.analysis || question.explanation;
			
			// 练习模式下立即显示结果
			if (mode.value === 'practice') {
				showResult.value = true;
				showAnalysis.value = true;
			}
		}
	} catch (error) {
		console.error('提交答案失败:', error);
		// 不显示错误提示，避免打断用户答题流程
	}
};

const handleSwiperChange = (e) => {
	currentIndex.value = e.detail.current;
	saveProgress();
};

const handlePrev = () => {
	if (currentIndex.value > 0) {
		currentIndex.value--;
	}
};

const handleNext = () => {
	if (currentIndex.value < questionList.value.length - 1) {
		currentIndex.value++;
	}
};

const handleSheetItemClick = (index) => {
	currentIndex.value = index;
	showAnswerSheet.value = false;
};

const getSheetItemClass = (questionId, index) => {
	const classes = [];
	if (index === currentIndex.value) {
		classes.push('current');
	}
	if (getSelectedAnswers(questionId).length > 0) {
		classes.push('answered');
	}
	return classes.join(' ');
};

const toggleFavorite = async () => {
	const question = questionList.value[currentIndex.value];
	if (!question || !question.id) return;
	
	try {
		await toggleCollection({
			questionId: question.id,
		});
		isFavorite.value = !isFavorite.value;
		uni.showToast({
			title: isFavorite.value ? '已收藏' : '已取消收藏',
			icon: 'success',
		});
	} catch (error) {
		console.error('收藏操作失败:', error);
		uni.showToast({
			title: error.message || '操作失败',
			icon: 'none',
		});
	}
};

const handleErrorReport = () => {
	uni.showModal({
		title: '纠错',
		content: '是否报告此题有误？',
		success: (res) => {
			if (res.confirm) {
				// 调用纠错接口
				uni.showToast({
					title: '感谢您的反馈',
					icon: 'success',
				});
			}
		},
	});
};

const toggleDraftBoard = () => {
	draftBoardVisible.value = !draftBoardVisible.value;
};

const handleBack = () => {
	if (mode.value === 'exam' && !showResult.value) {
		uni.showModal({
			title: '提示',
			content: '考试进行中，确定要退出吗？',
			success: (res) => {
				if (res.confirm) {
					uni.navigateBack();
				}
			},
		});
	} else {
		uni.navigateBack();
	}
};

const startExamTimer = () => {
	examTimeLeft.value = 180 * 60; // 3小时，单位：秒
	examTimer = setInterval(() => {
		examTimeLeft.value--;
		if (examTimeLeft.value <= 0) {
			clearInterval(examTimer);
			handleSubmit();
		}
	}, 1000);
};

const handleSubmit = async () => {
	if (mode.value !== 'exam') return;

	uni.showModal({
		title: '确认交卷',
		content: '确定要交卷吗？交卷后将无法修改答案。',
		success: async (res) => {
			if (res.confirm) {
				try {
					// 批量提交答案
					const answerList = Object.keys(answers.value).map((questionId) => ({
						qid: parseInt(questionId),
						options: answers.value[questionId] || [],
					}));
					
					const result = await batchSubmit({
						answers: answerList,
					});

					// 更新题目状态
					if (result && result.results) {
						result.results.forEach((item) => {
							const question = questionList.value.find((q) => q.id === item.qid);
							if (question) {
								question.isCorrect = item.is_correct;
								question.correctAnswer = item.answer || question.correctAnswer;
								question.explanation = item.analysis || question.explanation;
							}
						});
					}

					showResult.value = true;
					showAnalysis.value = true;

					if (examTimer) {
						clearInterval(examTimer);
					}

					uni.showToast({
						title: '交卷成功',
						icon: 'success',
					});
				} catch (error) {
					console.error('交卷失败:', error);
					uni.showToast({
						title: error.message || '交卷失败，请重试',
						icon: 'none',
					});
				}
			}
		},
	});
};

const setFontSize = (size) => {
	fontSize.value = size;
	bankStore.updateSettings({ fontSize: size });
};

const toggleNightMode = (e) => {
	nightMode.value = e.detail.value;
	bankStore.updateSettings({ nightMode: e.detail.value });
};
</script>

<style lang="scss" scoped>
.answer-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: $white;

	&.night-mode {
		background-color: #1a1a1a;
	}
}

.custom-navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx $page-padding;
	padding-top: calc(var(--status-bar-height) + 20rpx);
	height: calc(var(--status-bar-height) + 88rpx);
	background-color: $white;
	border-bottom: 1px solid $border-color;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
}

.navbar-left,
.navbar-right {
	display: flex;
	align-items: center;
	gap: $spacing-md;
}

.navbar-center {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.navbar-title {
	font-size: $font-size-base;
	font-weight: 600;
	color: $text-color;
}

.navbar-countdown {
	font-size: $font-size-sm;
	color: $primary-color;
	font-family: 'DIN', Arial, sans-serif;
	margin-top: 4rpx;
}

.navbar-icon {
	font-size: $font-size-base;
	color: $text-color;
	padding: $spacing-xs;
}

.question-swiper {
	flex: 1;
	margin-top: calc(var(--status-bar-height) + 88rpx);
	margin-bottom: 120rpx;
}

.swiper-item {
	height: 100%;
	overflow-y: auto;
}

.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-md $page-padding;
	padding-bottom: calc($spacing-md + env(safe-area-inset-bottom));
	background-color: $white;
	border-top: 1px solid $border-color;
	z-index: 99;
}

.bar-left {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.action-btn {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background-color: #f5f5f5;
}

.action-icon {
	font-size: 32rpx;
}

.bar-center {
	display: flex;
	align-items: center;
	gap: $spacing-md;
}

.nav-btn {
	padding: $spacing-sm $spacing-lg;
	background-color: $primary-color;
	color: $white;
	border-radius: $button-radius;
	font-size: $font-size-base;

	&.disabled {
		background-color: $border-color;
		color: $text-color-disabled;
	}
}

.submit-btn {
	padding: $spacing-sm $spacing-lg;
	background-color: $error-color;
	color: $white;
	border-radius: $button-radius;
	font-size: $font-size-base;
	font-weight: 600;
}

.answer-sheet-popup,
.settings-popup {
	background-color: $white;
	border-radius: 24rpx 24rpx 0 0;
	max-height: 70vh;
	padding: $spacing-lg;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-lg;
}

.popup-title {
	font-size: $font-size-lg;
	font-weight: 600;
	color: $text-color;
}

.popup-close {
	font-size: 40rpx;
	color: $text-color-secondary;
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.answer-sheet-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: $spacing-md;
}

.sheet-item {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f5f5f5;
	border-radius: $button-radius;
	font-size: $font-size-base;
	color: $text-color;

	&.current {
		background-color: $primary-color;
		color: $white;
	}

	&.answered {
		background-color: rgba(231, 76, 60, 0.2);
	}
}

.settings-content {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.setting-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.setting-label {
	font-size: $font-size-base;
	color: $text-color;
}

.setting-options {
	display: flex;
	gap: $spacing-md;
}

.setting-option {
	padding: $spacing-xs $spacing-md;
	border: 2rpx solid $border-color;
	border-radius: $button-radius;
	font-size: $font-size-sm;
	color: $text-color;

	&.active {
		border-color: $primary-color;
		color: $primary-color;
		background-color: rgba(231, 76, 60, 0.1);
	}
}
</style>
