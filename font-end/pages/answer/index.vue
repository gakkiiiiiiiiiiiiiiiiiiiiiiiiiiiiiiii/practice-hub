<template>
	<view class="answer-page" :class="{ 'night-mode': nightMode }">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar">
			<view class="navbar-left" @click="handleBack">
				<app-icon name="arrow-right" :size="24" color="#FFFFFF" style="transform: rotate(180deg)" />
			</view>
			<view class="navbar-center">
				<text class="navbar-title">{{ pageTitle }}</text>
				<!-- 模拟考试倒计时 -->
				<text v-if="mode === 'exam' && examTimeLeft > 0" class="exam-timer">{{ formatExamTime }}</text>
				<!-- 练习模式打卡状态 -->
				<view v-if="mode === 'practice' && !fromWrong && !fromCollection && !fromNotes" class="checkin-status-bar">
					<text class="checkin-status-text">
						{{ checkinStatus?.hasCheckedIn ? '已打卡' : `学习 ${formatStudyDuration} / ${checkinStatus?.requiredMinutes || 0} 分钟` }}
					</text>
				</view>
			</view>
			<view class="navbar-right">
				<!-- 模拟考试模式下显示交卷按钮 -->
				<view v-if="mode === 'exam' && !showResult" class="navbar-submit-btn" @click="handleSubmit">
					<text class="submit-text">交卷</text>
				</view>
				<view v-else class="navbar-icon-group">
					<view class="navbar-icon-btn" @click="toggleViewMode">
						<text class="icon-dots">⋯</text>
					</view>
					<view class="navbar-icon-btn" @click="toggleViewMode">
						<view class="icon-circle"></view>
					</view>
				</view>
			</view>
		</view>

		<!-- 题目滑动区 -->
		<swiper
			ref="questionSwiper"
			class="question-swiper"
			:class="{ 'detail-mode': fromWrong || fromCollection || fromNotes }"
			:current="currentIndex"
			@change="handleSwiperChange"
			:duration="300"
			:circular="false"
		>
			<swiper-item v-for="(question, index) in questionList" :key="question.id || index" class="swiper-item">
				<view class="question-wrapper">
					<!-- 题目内容 -->
					<question-card
						:question="question"
						:question-index="index"
						:total-count="questionList.length"
						:selected-answers="getSelectedAnswersForQuestion(question.id, question)"
						:show-result="
							fromWrong || fromCollection ? true : mode === 'exam' ? showResult : submittedQuestions.has(question.id)
						"
						:show-analysis="
							fromWrong || fromCollection || fromNotes
								? true
								: mode === 'exam'
								? showResult && showAnalysis
								: submittedQuestions.has(question.id)
						"
					:mode="mode"
					:night-mode="nightMode"
					:font-size="fontSize"
						:show-submit-btn="
							fromWrong || fromCollection || fromNotes ? false : mode === 'exam' ? false : !submittedQuestions.has(question.id)
						"
						:is-disabled="
							fromWrong || fromCollection || fromNotes ? true : mode === 'exam' ? showResult : submittedQuestions.has(question.id)
						"
						:from-wrong="fromWrong"
						:from-collection="fromCollection"
						:from-notes="fromNotes"
						@select="handleAnswerSelect"
						@submit="handleSubmitAnswer"
						@reset="handleResetAnswer"
						@self-assess="handleSelfAssessment"
						@show-settings="showSettings = true"
					/>
					<!-- 调试信息 -->
					<!-- <view style="position: fixed; top: 100px; left: 0; background: rgba(0,0,0,0.7); color: white; padding: 10px; z-index: 9999; font-size: 24rpx;">
						<div>题目索引: {{ index }}</div>
						<div>题目ID: {{ question.id }}</div>
						<div>题目类型: {{ question.type }}</div>
						<div>当前索引: {{ currentIndex }}</div>
						<div>selectedAnswers: {{ JSON.stringify(getSelectedAnswers(question.id)) }}</div>
					</view> -->
				</view>
			</swiper-item>
		</swiper>

		<!-- 底部状态栏 -->
		<view class="bottom-status-bar" v-if="!fromWrong && !fromCollection && !fromNotes">
			<view class="status-left">
				<view class="status-item correct">
					<app-icon name="correct" :size="24" color="#2ecc71" />
					<text class="status-count">{{ correctCount }}</text>
				</view>
				<view class="status-item wrong">
					<app-icon name="error" :size="24" color="#e74c3c" />
					<text class="status-count">{{ wrongCount }}</text>
				</view>
			</view>
			<view class="status-center" @click="showAnswerSheet = true">
				<app-icon name="answer-sheet" :size="28" color="#666" />
				<text class="status-center-text">{{ currentIndex + 1 }}/{{ questionList.length }}</text>
			</view>
			<view class="status-right-group">
				<view class="status-right" @click="showNoteDialog = true">
					<app-icon :name="currentNote ? 'edit-fill' : 'edit'" :size="24" color="#666" />
					<text class="status-text">笔记</text>
				</view>
				<view class="status-right" @click="toggleFavorite">
					<app-icon :name="isFavorite ? 'star-fill' : 'star'" :size="24" color="#666" />
					<text class="status-text">收藏</text>
				</view>
				<!-- 打卡按钮 -->
				<view 
					class="status-right checkin-btn" 
					:class="{ 'checkin-disabled': checkinStatus?.hasCheckedIn || !canCheckin }"
					@click="handleCheckin"
				>
					<app-icon 
						:name="checkinStatus?.hasCheckedIn ? 'check-circle-fill' : 'check-circle'" 
						:size="24" 
						:color="checkinStatus?.hasCheckedIn ? '#2ecc71' : (canCheckin ? '#17c3a2' : '#999')" 
					/>
					<text class="status-text">{{ checkinStatus?.hasCheckedIn ? '已打卡' : '打卡' }}</text>
				</view>
			</view>
		</view>

		<!-- 笔记编辑弹窗 -->
		<view class="note-dialog-mask" v-if="showNoteDialog" @click="showNoteDialog = false">
			<view class="note-dialog" @click.stop>
				<view class="note-dialog-header">
					<text class="note-dialog-title">我的笔记</text>
					<view class="note-dialog-close" @click="showNoteDialog = false">
						<app-icon name="close" :size="24" color="#666" />
					</view>
				</view>
				<view class="note-dialog-content">
					<textarea
						class="note-textarea"
						v-model="noteContent"
						placeholder="在此记录你的学习笔记..."
						maxlength="2000"
						:auto-height="true"
					/>
					<view class="note-char-count">{{ noteContent.length }}/2000</view>
				</view>
				<view class="note-dialog-footer">
					<button class="note-btn cancel-btn" @click="showNoteDialog = false">取消</button>
					<button class="note-btn save-btn" @click="handleSaveNote" :loading="savingNote">保存</button>
				</view>
			</view>
		</view>

		<!-- 题目报错链接 -->
		<view class="error-report-link" v-if="!fromWrong && !fromCollection && !fromNotes" @click="handleErrorReport">
			<text>①题目报错</text>
		</view>

		<!-- 草稿纸 -->
		<!-- <draft-board v-model:visible="draftBoardVisible" @close="draftBoardVisible = false" /> -->

		<!-- 题目导航网格弹窗 -->
		<view class="answer-sheet-mask" v-if="showAnswerSheet" @click="showAnswerSheet = false" @touchmove.stop.prevent>
			<view class="answer-sheet-popup" @click.stop @touchmove.stop.prevent>
				<view class="popup-header">
					<view class="popup-close-btn" @click="showAnswerSheet = false">
						<app-icon name="close" :size="28" color="#666" />
					</view>
				</view>
				<scroll-view 
					class="answer-sheet-scroll" 
					scroll-y
					@touchmove.stop
				>
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
				</scroll-view>
			</view>
		</view>

		<!-- 设置页面（全屏） -->
		<view class="settings-page" v-if="showSettings" @click.self="showSettings = false">
			<view class="settings-page-content" @click.stop>
				<view class="settings-header">
					<view class="settings-back" @click="showSettings = false">
						<app-icon name="arrow-right" :size="24" color="#333" style="transform: rotate(180deg)" />
					</view>
					<text class="settings-title">研兔刷题</text>
					<view class="settings-view-toggle">
						<view class="view-toggle-item" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
							<text class="toggle-dots">⋯</text>
						</view>
						<view class="view-toggle-item" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'">
							<view class="toggle-circle"></view>
						</view>
					</view>
				</view>
				<view class="settings-list">
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">夜间模式</text>
							<text class="setting-desc">刷题页面</text>
						</view>
						<switch :checked="nightMode" @change="toggleNightMode" color="#17C3A2" />
					</view>
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">答对自动下一题</text>
							<text class="setting-desc">练习模式</text>
						</view>
						<switch :checked="autoNextOnCorrect" @change="toggleAutoNextOnCorrect" color="#17C3A2" />
					</view>
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">答完自动下一题</text>
							<text class="setting-desc">考试模式</text>
						</view>
						<switch :checked="autoNextOnAnswer" @change="toggleAutoNextOnAnswer" color="#17C3A2" />
					</view>
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">答对自动移除错题集</text>
						</view>
						<switch :checked="autoRemoveWrong" @change="toggleAutoRemoveWrong" color="#17C3A2" />
					</view>
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">答题音效</text>
						</view>
						<switch :checked="answerSound" @change="toggleAnswerSound" color="#17C3A2" />
					</view>
					<view class="setting-row">
						<view class="setting-info">
							<text class="setting-label">字体大小</text>
						</view>
						<view class="font-size-options">
							<text
								v-for="size in fontSizeOptions"
								:key="size.value"
								class="font-size-option"
								:class="{ active: fontSize === size.value }"
								@click="setFontSize(size.value)"
							>
								{{ size.label }}
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { formatCountdown } from '@/utils/date';
import { useBankStore } from '@/store/bank';
import { useUserStore } from '@/store/user';
import {
	getChapterQuestions,
	getCourseQuestions,
	getQuestionDetail,
	submitAnswer,
	batchSubmit,
	toggleCollection,
	getAnswerRecords,
	getCollectionList,
	createOrUpdateNote,
	getNoteByQuestionId,
	submitExam,
	getTodayCheckinStatus,
	getCheckinMinutes,
	checkin,
} from '@/api/index';
import QuestionCard from '@/components/question-card/question-card.vue';
import DraftBoard from '@/components/draft-board/draft-board.vue';
import AppIcon from '@/components/app-icon/app-icon.vue';
import {
	getDailyOnlineSeconds,
} from '@/utils/daily-online';

const bankStore = useBankStore();
const userStore = useUserStore();

// 路由参数
const mode = ref('practice'); // practice, exam
const paperId = ref(null);
const chapterId = ref(null);
const bankId = ref(bankStore.currentBankId);
const practiceType = ref('sequential'); // sequential, random
const questionId = ref(null); // 单个题目ID（用于从错题集或收藏或笔记跳转）
const fromWrong = ref(false); // 是否来自错题集
const fromCollection = ref(false); // 是否来自收藏
const fromNotes = ref(false); // 是否来自笔记
const examConfigId = ref(null); // 考试配置ID
const examData = ref(null); // 考试数据（题目列表等）
const examStartTime = ref(null); // 考试开始时间

// 在 onLoad 中获取页面参数
  onLoad((options) => {
	console.log('刷题页面 onLoad 参数:', options);

	// 设置模式
	if (options.mode) {
		mode.value = options.mode;
	}

	// 设置练习类型（顺序练习或随机练习）
	if (options.type === 'random') {
		practiceType.value = 'random';
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
	if (options.questionId) {
		questionId.value = parseInt(options.questionId);
	}
	if (options.from === 'wrong') {
		fromWrong.value = true;
	}
	if (options.from === 'collection') {
		fromCollection.value = true;
	}
	if (options.from === 'notes') {
		fromNotes.value = true;
	}

	// 考试模式参数
	if (options.examConfigId) {
		examConfigId.value = parseInt(options.examConfigId);
	}
	// 优先从本地存储读取考试数据（避免 URL 参数长度限制）
	if (options.examDataKey) {
		try {
			// 解码 URL 参数（如果被编码了）
			const decodedKey = decodeURIComponent(options.examDataKey);
			console.log('原始 key:', options.examDataKey);
			console.log('解码后的 key:', decodedKey);
			console.log('尝试从本地存储读取考试数据，key:', decodedKey);
			const storedData = uni.getStorageSync(decodedKey);
			console.log('读取到的存储数据:', storedData);
			console.log('存储数据类型:', typeof storedData);
			console.log('是否有 questions:', storedData?.questions ? true : false);
			console.log('questions 类型:', Array.isArray(storedData?.questions));

			if (storedData) {
				examData.value = storedData;
				examStartTime.value = new Date().toISOString(); // 记录开始时间
				console.log('成功读取考试数据，examData.value:', examData.value);
				// 读取后删除存储（避免占用空间）
				uni.removeStorageSync(decodedKey);
			} else {
				console.error('从本地存储读取考试数据失败，key:', decodedKey);
				const storageInfo = uni.getStorageInfoSync();
				console.error('所有存储的 key:', storageInfo.keys);
				console.error('存储大小:', storageInfo.currentSize, '/', storageInfo.limitSize);
			}
		} catch (e) {
			console.error('读取考试数据失败:', e);
			console.error('错误详情:', e.message, e.stack);
		}
	} else if (options.examData) {
		// 兼容旧的 URL 参数方式（如果数据较小）
		try {
			examData.value = JSON.parse(decodeURIComponent(options.examData));
			examStartTime.value = new Date().toISOString(); // 记录开始时间
		} catch (e) {
			console.error('解析考试数据失败:', e);
		}
	}

	console.log('解析后的参数:', {
		mode: mode.value,
		chapterId: chapterId.value,
		paperId: paperId.value,
		bankId: bankId.value,
		practiceType: practiceType.value,
		questionId: questionId.value,
		fromWrong: fromWrong.value,
		fromCollection: fromCollection.value,
		examConfigId: examConfigId.value,
		examData: examData.value,
	});
});

// 状态
const questionList = ref([]);
const answerRecordsMap = ref(new Map()); // 答题记录映射：questionId -> { is_correct, user_option, text_answer, image_answer }
const currentIndex = ref(0);
const answers = ref({}); // { questionId: ['A'] or ['A', 'B'] }
const showResult = ref(false);
const showAnalysis = ref(false); // 只有在提交答案后才显示解析
const draftBoardVisible = ref(false);
const showAnswerSheet = ref(false);
const showSettings = ref(false);
const isFavorite = ref(false);
const showNoteDialog = ref(false);
const noteContent = ref('');
const currentNote = ref(null);
const savingNote = ref(false);
const examTimeLeft = ref(0); // 考试剩余时间（秒）
let examTimer = null;

// 记录已提交的题目ID（用于控制解析显示）
const submittedQuestions = ref(new Set());

// 打卡相关状态
const studyDuration = ref(0); // 学习时长（秒）
const checkinStatus = ref(null); // 打卡状态 { hasCheckedIn: boolean, requiredMinutes: number }
const checkinLoading = ref(false);
let studyTimer = null; // 学习时长定时器

// 设置
const fontSize = ref(bankStore.settings.fontSize || 'medium');
const nightMode = ref(bankStore.settings.nightMode || false);
const autoNextOnCorrect = ref(bankStore.settings.autoNextOnCorrect !== false); // 默认开启
const autoNextOnAnswer = ref(bankStore.settings.autoNextOnAnswer !== false); // 默认开启
const autoShowAnalysis = ref(bankStore.settings.autoShowAnalysis || false); // 默认关闭
const autoRemoveWrong = ref(bankStore.settings.autoRemoveWrong || false);
const answerSound = ref(bankStore.settings.answerSound || false);
const viewMode = ref('list'); // list 或 card

// 页面标题
const pageTitle = computed(() => {
	if (fromWrong.value) {
		return '错题详情';
	}
	if (fromCollection.value) {
		return '收藏详情';
	}
	if (fromNotes.value) {
		return '笔记详情';
	}
	if (mode.value === 'exam') {
		return '模拟考试';
	}
	if (practiceType.value === 'random') {
		return '随机练习';
	}
	return '顺序练习';
});

// 当前题目
const currentQuestion = computed(() => {
	return questionList.value[currentIndex.value];
});

// 统计正确和错误数量
const correctCount = computed(() => {
	return questionList.value.filter((q) => {
		const record = answerRecordsMap.value.get(q.id);
		if (record && record.is_correct === true) {
			return true;
		}
		// 兼容旧逻辑
		return q.isCorrect === true;
	}).length;
});

const wrongCount = computed(() => {
	return questionList.value.filter((q) => {
		const record = answerRecordsMap.value.get(q.id);
		if (record && record.is_correct === false) {
			return true;
		}
		// 兼容旧逻辑
		return q.isCorrect === false;
	}).length;
});

const fontSizeOptions = [
	{ label: 'A较小', value: 'small' },
	{ label: 'A标准', value: 'medium' },
	{ label: 'A较大', value: 'large' },
	{ label: 'A特大', value: 'xlarge' },
];

// 虚拟列表：只渲染当前、前一个、后一个
const visibleQuestions = computed(() => {
	const start = Math.max(0, currentIndex.value - 1);
	const end = Math.min(questionList.value.length, currentIndex.value + 2);
	return questionList.value.slice(start, end);
});

onMounted(async () => {
	await loadQuestions();
	if (mode.value === 'exam' && examData.value) {
		startExamTimer();
	}
	// 初始化打卡功能（仅练习模式）
	if (mode.value === 'practice' && !fromWrong.value && !fromCollection.value && !fromNotes.value) {
		await initCheckin();
		startStudyTimer();
	}
	// loadProgress();
});

onUnmounted(() => {
	saveProgress();
	if (examTimer) {
		clearInterval(examTimer);
	}
	if (studyTimer) {
		clearInterval(studyTimer);
	}
});

// 移除 uni-popup 相关的 ref 和 watch

// 监听 currentIndex 变化，确保 swiper 同步
const questionSwiper = ref(null);
watch(currentIndex, async (newIndex) => {
	// swiper 会自动响应 current 属性的变化
	saveProgress();
	// 切换题目时，检查收藏状态和笔记
	await checkFavoriteStatus();
	await loadCurrentNote();
});

const loadQuestions = async () => {
	try {
		let questions = [];
		const targetChapterId = chapterId.value || paperId.value;

		// 模拟考试：使用考试数据中的题目
		if (mode.value === 'exam') {
			if (examData.value && examData.value.questions && Array.isArray(examData.value.questions)) {
				// 使用考试数据中的题目
				questions = examData.value.questions;
				console.log('加载考试题目，数量:', questions.length);
			} else {
				console.error('考试数据格式错误:', {
					examData: examData.value,
					hasQuestions: examData.value?.questions ? true : false,
					isArray: Array.isArray(examData.value?.questions),
				});
				uni.showToast({
					title: '考试数据加载失败',
					icon: 'none',
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
				return;
			}
		}
		// 从错题集、收藏或笔记跳转：加载单个题目
		else if (questionId.value && (fromWrong.value || fromCollection.value || fromNotes.value)) {
			try {
				const res = await getQuestionDetail(questionId.value);
				console.log('从错题集加载题目详情，API响应:', res);

				// 处理API响应格式
				let q = null;
				if (res && res.data) {
					q = res.data;
				} else if (res && !res.data && res.id) {
					q = res;
				} else if (Array.isArray(res) && res.length > 0) {
					q = res[0];
				}

				if (!q) {
					console.error('题目数据为空:', res);
					uni.showToast({
						title: '题目不存在',
						icon: 'none',
					});
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
					return;
				}

				console.log('解析后的题目数据:', q);
				console.log('题目stem:', q.stem);

				// 转换为题目列表格式（注意：这里使用数字类型，后续会统一转换）
				questions = [
					{
						id: q.id,
						type: q.type, // 保持数字类型，后续统一转换
						stem: q.stem || q.content || '', // 优先使用 stem，如果没有则使用 content
						options: q.options || [],
						answer: q.answer || [],
						analysis: q.analysis || '',
						parent_id: q.parent_id || 0,
						chapter_id: q.chapter_id || 0,
					},
				];

				console.log('转换后的questions:', questions);
			} catch (error) {
				console.error('加载题目详情失败:', error);
				uni.showToast({
					title: error.message || '加载题目失败',
					icon: 'none',
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
				return;
			}
		}
		// 随机练习：从题库中随机选择题目
		else if (practiceType.value === 'random') {
			if (!bankId.value) {
				uni.showToast({
					title: '请先选择题库',
					icon: 'none',
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
				return;
			}

			// 从题库中随机选择题目（不限制数量，全部随机）
			questions = await getCourseQuestions(bankId.value, {
				random: true,
			});

			if (!questions || questions.length === 0) {
				uni.showToast({
					title: '题库暂无题目',
					icon: 'none',
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
				return;
			}
		}
		// 顺序练习：从指定章节获取题目
		else {
			if (!targetChapterId) {
				console.error('缺少章节ID或试卷ID:', {
					chapterId: chapterId.value,
					paperId: paperId.value,
					mode: mode.value,
					bankId: bankId.value,
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
		}

		// 获取用户答题记录（如果已登录）
		// 注意：模拟考试和随机练习不加载答题记录，因为每次都是新的练习
		// 从错题集跳转时，需要单独加载该题目的答题记录
		const token = uni.getStorageSync('auth_token');
		if (
			token &&
			mode.value !== 'exam' &&
			practiceType.value !== 'random' &&
			!fromWrong.value &&
			!fromCollection.value &&
			!fromNotes.value
		) {
			try {
				const targetId = chapterId.value || paperId.value;
				const records = await getAnswerRecords({ chapterId: targetId });
				// 构建答题记录映射
				answerRecordsMap.value.clear();
				records.forEach((record) => {
					const questionId = record.question_id;
					// 检查是否有有效答案
					const hasValidAnswer =
						(record.user_option && Array.isArray(record.user_option) && record.user_option.length > 0) ||
						(record.text_answer && record.text_answer.trim() !== '') ||
						(record.image_answer && record.image_answer.trim() !== '');

					// 只有存在有效答案时才添加到答题记录映射和标记为已提交
					if (hasValidAnswer) {
						// 处理 user_option，确保是数组且过滤空值
						let userOption = record.user_option;
						if (Array.isArray(userOption)) {
							// 过滤掉空值
							userOption = userOption.filter((a) => a !== null && a !== undefined && String(a).trim() !== '');
						} else {
							userOption = [];
						}

						// 获取题目类型，用于规范化答案格式
						const question = questions.find((q) => q.id === questionId);
						let questionType = 'single';
						if (question) {
							if (question.type === 2) {
								questionType = 'multiple';
							} else if (question.type === 3) {
								questionType = 'judge';
							} else if (question.type === 4) {
								questionType = 'fill';
							} else if (question.type === 5) {
								questionType = 'reading';
							} else if (question.type === 6) {
								questionType = 'short';
							}
						}

						// 规范化答案格式：选择题转换为大写，填空题和简答题保持原样
						let normalizedUserOption = userOption;
						if (
							questionType !== 'fill' &&
							questionType !== 'short' &&
							Array.isArray(userOption) &&
							userOption.length > 0
						) {
							// 选择题：转换为大写并过滤无效选项
							normalizedUserOption = userOption
								.map((a) => String(a).toUpperCase().trim())
								.filter((a) => /^[A-Z]$/.test(a)); // 只保留单个字母选项
						}

						answerRecordsMap.value.set(questionId, {
							is_correct: record.is_correct,
							user_option: normalizedUserOption,
							text_answer: record.text_answer,
							image_answer: record.image_answer,
						});

						// 将已提交的答案回显到 answers.value 中
						if (normalizedUserOption && Array.isArray(normalizedUserOption) && normalizedUserOption.length > 0) {
							// 选项类型题目（单选、多选、判断、填空）
							// 确保只保存有效的答案选项
							answers.value[questionId] = [...normalizedUserOption];
							submittedQuestions.value.add(questionId);
							console.log(
								`题目 ${questionId} (${questionType}) 的答案回显:`,
								normalizedUserOption,
								'原始:',
								userOption
							);
						} else if (record.text_answer && record.text_answer.trim() !== '') {
							// 简答题文本答案
							answers.value[questionId] = {
								type: 'text',
								text: record.text_answer,
								selfAssessment: record.is_correct === 1 ? 'correct' : record.is_correct === 0 ? 'wrong' : null,
							};
							submittedQuestions.value.add(questionId);
						}
					}
				});
			} catch (error) {
				console.error('获取答题记录失败:', error);
				// 不阻止加载题目，继续执行
			}
		}

		// 转换题目数据格式：后端格式 -> 前端格式
		// 题目类型：1-单选, 2-多选, 3-判断, 4-填空, 5-阅读理解, 6-简答题
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
			} else if (q.type === 6) {
				questionType = 'short';
			}

		// 转换选项数据
		let options = (q.options || []).map((opt, idx) => ({
			key: opt.label || String.fromCharCode(65 + idx), // A, B, C, D
			content: opt.text || opt.content || '',
		}));

		// 判断题如果没有选项，添加默认选项（正确/错误）
		if (questionType === 'judge' && (!options || options.length === 0 || options.every(opt => !opt.content))) {
			options = [
				{ key: 'A', content: '正确' },
				{ key: 'B', content: '错误' },
			];
		}

		const questionData = {
			id: q.id,
			type: questionType,
			content: q.stem || q.content || '', // 优先使用 stem，如果没有则使用 content
			options: options,
			correctAnswer: q.answer || [], // 题目列表接口可能不返回答案，需要提交后获取
			explanation: q.analysis || '', // 题目列表接口可能不返回解析，需要提交后获取
			parent_id: q.parent_id || 0, // 阅读理解父题ID
			// 保留原始数据
			_raw: q,
		};

			// 调试：从错题集或笔记跳转时，检查题目内容
			if (fromWrong.value || fromNotes.value) {
				console.log('转换后的题目数据:', questionData);
				console.log('题目content:', questionData.content);
				console.log('题目content类型:', typeof questionData.content);
				console.log('题目content长度:', questionData.content?.length || 0);
				console.log('题目stem (原始):', q.stem);
				console.log('题目stem类型:', typeof q.stem);
				console.log('题目stem长度:', q.stem?.length || 0);
			}

			return questionData;
		});

		// 加载题目后，检查收藏状态
		await checkFavoriteStatus();

		// 从笔记跳转时，加载笔记内容
		if (fromNotes.value && questionId.value) {
			await loadCurrentNote();
			// 将笔记内容添加到题目对象中
			if (currentNote.value && questionList.value.length > 0) {
				const question = questionList.value[0];
				if (question) {
					question.userNote = currentNote.value.content || '';
				}
			}
		}

		// 从错题集、收藏或笔记跳转时，加载该题目的答题记录
		if ((fromWrong.value || fromCollection.value || fromNotes.value) && questionId.value && token) {
			try {
				const records = await getAnswerRecords({ questionIds: [questionId.value] });
				if (records && records.length > 0) {
					const record = records[0];
					const hasValidAnswer =
						(record.user_option && Array.isArray(record.user_option) && record.user_option.length > 0) ||
						(record.text_answer && record.text_answer.trim() !== '') ||
						(record.image_answer && record.image_answer.trim() !== '');

					if (hasValidAnswer) {
						// 处理 user_option
						let userOption = record.user_option;
						if (Array.isArray(userOption)) {
							userOption = userOption.filter((a) => a !== null && a !== undefined && String(a).trim() !== '');
						} else {
							userOption = [];
						}

						// 获取题目类型
						const question = questionList.value.find((q) => q.id === questionId.value);
						let questionType = question?.type || 'single';

						// 规范化答案格式
						let normalizedUserOption = userOption;
						if (
							questionType !== 'fill' &&
							questionType !== 'short' &&
							Array.isArray(userOption) &&
							userOption.length > 0
						) {
							normalizedUserOption = userOption
								.map((a) => String(a).toUpperCase().trim())
								.filter((a) => /^[A-Z]$/.test(a));
						}

						answerRecordsMap.value.set(questionId.value, {
							is_correct: record.is_correct,
							user_option: normalizedUserOption,
							text_answer: record.text_answer,
							image_answer: record.image_answer,
						});

						// 回显答案
						if (normalizedUserOption && Array.isArray(normalizedUserOption) && normalizedUserOption.length > 0) {
							answers.value[questionId.value] = [...normalizedUserOption];
							submittedQuestions.value.add(questionId.value);
						} else if (record.text_answer && record.text_answer.trim() !== '') {
							answers.value[questionId.value] = {
								type: 'text',
								text: record.text_answer,
								selfAssessment: record.is_correct === 1 ? 'correct' : record.is_correct === 0 ? 'wrong' : null,
							};
							submittedQuestions.value.add(questionId.value);
						}
					}
				}
			} catch (error) {
				console.error('获取错题答题记录失败:', error);
				// 不阻止加载，继续执行
			}
		}

		// 注意：不预加载题目详情，因为：
		// 1. 题目详情接口需要登录认证
		// 2. 解析信息在提交答案后会返回
		// 3. 避免不必要的401错误

		// 加载进度后，清理已提交题目的答案（如果题目已提交，答案应该从后端获取，而不是本地存储）
		// 只保留未提交题目的答案
		if (answers.value) {
			const questionIds = new Set(questionList.value.map((q) => q.id));
			const cleanedAnswers = {};
			for (const [questionId, answer] of Object.entries(answers.value)) {
				const qId = parseInt(questionId);
				const question = questionList.value.find((q) => q.id === qId);
				// 只保留未提交题目的答案
				if (question && !submittedQuestions.value.has(qId)) {
					// 检查答案是否有效（不是空数组或空字符串）
					if (Array.isArray(answer) && answer.length > 0) {
						// 过滤掉空字符串
						const validAnswers = answer.filter((a) => a && String(a).trim() !== '');
						if (validAnswers.length > 0) {
							cleanedAnswers[questionId] = validAnswers;
						}
					} else if (typeof answer === 'object' && answer !== null) {
						// 简答题：只保留文本答案
						if (answer.type === 'text' && answer.text && answer.text.trim()) {
							cleanedAnswers[questionId] = answer;
						}
					}
				}
			}
			answers.value = cleanedAnswers;
		}
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
	if (saved && saved.answers) {
		// 只加载未提交题目的答案，避免覆盖已提交的答案
		const progressAnswers = saved.answers || {};
		for (const [questionId, answer] of Object.entries(progressAnswers)) {
			const qId = parseInt(questionId);
			// 如果题目未提交，才加载本地保存的答案
			if (!submittedQuestions.value.has(qId)) {
				// 检查答案是否有效
				if (Array.isArray(answer) && answer.length > 0) {
					const validAnswers = answer.filter((a) => a !== null && a !== undefined && String(a).trim() !== '');
					if (validAnswers.length > 0) {
						answers.value[qId] = validAnswers;
					}
				} else if (typeof answer === 'object' && answer !== null) {
					// 简答题：只保留文本答案
					if (answer.type === 'text' && answer.text && answer.text.trim()) {
						answers.value[qId] = answer;
					}
				}
			}
		}
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

// 为模板提供的函数，确保使用正确的题目信息
const getSelectedAnswersForQuestion = (questionId, questionObj) => {
	if (!questionId || !questionObj) {
		console.warn('getSelectedAnswersForQuestion: 参数无效', { questionId, questionObj });
		return [];
	}
	const result = getSelectedAnswers(questionId, questionObj);
	console.log(`getSelectedAnswersForQuestion: 题目ID ${questionId}, 返回答案:`, result);
	return result;
};

const getSelectedAnswers = (questionId, questionObj = null) => {
	// 确保 questionId 是数字类型
	if (!questionId) {
		console.warn('getSelectedAnswers: questionId 为空', questionId);
		return [];
	}

	const qId = typeof questionId === 'number' ? questionId : parseInt(questionId);
	if (isNaN(qId)) {
		console.warn('getSelectedAnswers: questionId 不是有效数字', questionId);
		return [];
	}

	// 获取题目对象，用于判断题目类型
	// 优先使用传入的 questionObj，如果没有则从列表中查找
	const question = questionObj || questionList.value.find((q) => q.id === qId);
	const questionType = question ? question.type : null;

	// 调试日志：检查当前题目和 questionId 的对应关系
	const currentQuestion = questionList.value[currentIndex.value];
	if (currentQuestion && qId === currentQuestion.id) {
		console.log(
			`getSelectedAnswers 调用: 当前索引 ${currentIndex.value}, 当前题目ID ${
				currentQuestion.id
			}, 传入questionId ${qId}, 是否匹配 ${currentQuestion.id === qId}, 题目类型: ${questionType}`
		);
	}

	// 如果题目已提交，优先从答题记录中获取答案
	if (submittedQuestions.value.has(qId)) {
		const record = answerRecordsMap.value.get(qId);
		console.log(`题目 ${qId} 已提交，从答题记录获取答案:`, {
			record,
			user_option: record?.user_option,
			questionType,
		});
		if (record) {
			// 根据题目类型返回对应的答案
			if (record.user_option && Array.isArray(record.user_option) && record.user_option.length > 0) {
				// 填空题：返回文本字符串数组，不过滤为字母选项
				if (questionType === 'fill') {
					const filtered = record.user_option.filter((a) => {
						if (a === null || a === undefined) return false;
						const str = String(a).trim();
						return str !== ''; // 填空题：只过滤空值，保留所有非空字符串
					});
					if (filtered.length > 0) {
						const result = filtered.map((a) => String(a).trim());
						console.log(`题目 ${qId} (填空题) 从答题记录获取答案:`, result);
						return result;
					}
				} else {
					// 选项类型题目（单选、多选、判断）：只保留有效的选项（A、B、C等）
					console.log(`题目 ${qId} (选择题) 原始答案:`, record.user_option);
					const filtered = record.user_option.filter((a) => {
						if (a === null || a === undefined) return false;
						const str = String(a).trim();
						const isValid = str !== '' && /^[A-Z]$/i.test(str);
						console.log(`题目 ${qId} 答案过滤:`, { 原始值: a, 字符串: str, 是否有效: isValid });
						return isValid; // 只保留单个字母选项
					});
					if (filtered.length > 0) {
						// 确保返回的是字符串数组，并且都是大写
						const normalized = filtered.map((a) => String(a).toUpperCase().trim());
						console.log(`题目 ${qId} (选择题) 从答题记录获取答案:`, normalized, '原始:', record.user_option);
						return normalized;
					} else {
						console.warn(`题目 ${qId} (选择题) 过滤后没有有效答案，原始答案:`, record.user_option);
					}
				}
			} else if (record.text_answer && record.text_answer.trim() !== '') {
				// 简答题文本答案
				return {
					type: 'text',
					text: record.text_answer,
				};
			} else if (record.image_answer && record.image_answer.trim() !== '') {
				// 简答题图片答案
				return {
					type: 'image',
					images: [record.image_answer],
				};
			}
		}
		// 如果已提交但没有有效答案，返回空
		console.warn(`题目 ${qId} 已提交但没有有效答案记录`);
		return [];
	}

	// 如果题目未提交，从 answers.value 中获取（用户正在输入的答案）
	const answer = answers.value[qId];
	// 如果答案不存在，返回空数组
	if (!answer) {
		return [];
	}
	// 如果是数组，根据题目类型过滤
	if (Array.isArray(answer)) {
		if (answer.length === 0) {
			return [];
		}
		// 填空题：只过滤空值，保留所有非空字符串
		if (questionType === 'fill') {
			const filtered = answer.filter((a) => {
				if (a === null || a === undefined) return false;
				const str = String(a).trim();
				return str !== ''; // 填空题：只过滤空值
			});
			if (filtered.length > 0) {
				console.log(`题目 ${qId} (填空题) 从本地答案获取:`, filtered);
				return filtered.map((a) => String(a).trim());
			}
			return [];
		} else {
			// 选择题（单选、多选、判断）：只保留字母选项
			const filtered = answer.filter((a) => {
				if (a === null || a === undefined) return false;
				const str = String(a).trim();
				return str !== '' && /^[A-Z]$/i.test(str); // 只保留单个字母选项
			});
			if (filtered.length > 0) {
				// 确保返回的是字符串数组，并且都是大写
				return filtered.map((a) => String(a).toUpperCase().trim());
			}
			return [];
		}
	}
	// 如果是对象（简答题），检查是否有有效内容
	if (typeof answer === 'object' && answer !== null) {
		if (answer.type === 'text' && answer.text && answer.text.trim()) {
			return answer;
		}
	}
	return [];
};

const handleAnswerSelect = async (answer) => {
	const question = questionList.value[currentIndex.value];
	if (!question) return;

	// 如果题目已提交，不允许修改答案
	if (submittedQuestions.value.has(question.id)) {
		uni.showToast({
			title: '已提交题目，请点击"重新答题"修改',
			icon: 'none',
		});
		return;
	}

	// 简答题：answer 是对象 { type: 'text'|'image', text?: string, images?: string[] }
	if (question.type === 'short') {
		answers.value[question.id] = answer;
		// 不再自动提交，需要点击"提交并查看结果"按钮
	} else if (question.type === 'fill') {
		// 填空题：answer 是数组
		answers.value[question.id] = Array.isArray(answer) ? [...answer] : [answer];
		// 不再自动提交，需要点击"提交并查看结果"按钮
	} else {
		// 单选题、多选题、判断题：answer 是选项key（如 'A'）
		// 确保 optionKey 是大写，与 getSelectedAnswers 返回的格式一致
		const optionKey = String(answer).toUpperCase().trim();

		// 对于未提交的题目，直接从 answers.value 获取当前答案（避免从已提交记录中获取）
		let currentAnswers = [];
		if (answers.value[question.id] && Array.isArray(answers.value[question.id])) {
			// 过滤并规范化当前答案
			currentAnswers = answers.value[question.id]
				.filter((a) => a !== null && a !== undefined && String(a).trim() !== '')
				.map((a) => String(a).toUpperCase().trim())
				.filter((a) => /^[A-Z]$/.test(a)); // 只保留单个字母选项
		}

		if (question.type === 'multiple') {
			// 多选题：切换选中状态
			const index = currentAnswers.indexOf(optionKey);
			if (index > -1) {
				// 已选中，移除
				currentAnswers.splice(index, 1);
			} else {
				// 未选中，添加
				currentAnswers.push(optionKey);
			}
			// 确保数组中的选项都是大写且唯一
			const uniqueAnswers = [...new Set(currentAnswers)].sort();
			answers.value[question.id] = uniqueAnswers;
			console.log(`多选题 ${question.id} 选择选项:`, {
				选项key: optionKey,
				当前答案: currentAnswers,
				更新后答案: uniqueAnswers,
			});
		} else {
			// 单选题、判断题：直接替换
			answers.value[question.id] = [optionKey];
			
			// 如果开启了自动显示解析，且是单选题或判断题，自动提交
			if (autoShowAnalysis.value && (question.type === 'single' || question.type === 'judge')) {
				// 延迟一下，确保答案已保存
				setTimeout(() => {
					handleSubmitAnswer();
				}, 300);
			}
		}
	}

	saveProgress();
};

const checkAnswer = async (question) => {
	if (!question || !question.id) return;

	try {
		const selectedAnswers = getSelectedAnswers(question.id, question);

		// 简答题：不需要在这里处理，由 handleSelfAssessment 处理
		if (question.type === 'short') {
			return;
		}

		// 填空题：检查是否所有空都已填写
		if (question.type === 'fill') {
			console.log('填空题提交检查:', {
				questionId: question.id,
				selectedAnswers,
				answersValue: answers.value[question.id],
			});
			if (!selectedAnswers || selectedAnswers.length === 0) {
				uni.showToast({
					title: '请填写答案',
					icon: 'none',
				});
				return; // 未填写答案，不提交
			}
			// 过滤掉空字符串
			const filledAnswers = selectedAnswers.filter((ans) => ans && ans.trim() !== '');
			if (filledAnswers.length === 0) {
				uni.showToast({
					title: '请填写答案',
					icon: 'none',
				});
				return; // 所有空都未填写，不提交
			}
			console.log('填空题提交答案:', filledAnswers);
		} else {
			if (!selectedAnswers || selectedAnswers.length === 0) {
				uni.showToast({
					title: '请选择答案',
					icon: 'none',
				});
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

			// 更新答题记录映射
			answerRecordsMap.value.set(question.id, {
				is_correct: result.is_correct,
				user_option: selectedAnswers,
				text_answer: null,
				image_answer: null,
			});

			// 标记题目已提交，显示解析
			submittedQuestions.value.add(question.id);
			showResult.value = true;
			showAnalysis.value = true;
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
	const question = questionList.value.find((q) => q.id === questionId);

	if (index === currentIndex.value) {
		classes.push('current');
	}

	// 检查题目是否已提交（已提交的题目才显示已作答状态）
	if (question && submittedQuestions.value.has(questionId)) {
		classes.push('answered');
		// 根据 is_correct 添加样式
		if (question.is_correct === true) {
			classes.push('correct');
		} else if (question.is_correct === false) {
			classes.push('wrong');
		}
	} else {
		// 检查是否有有效答案（过滤空答案）
		const selectedAnswers = getSelectedAnswers(questionId, question);
		if (selectedAnswers && selectedAnswers.length > 0) {
			// 对于填空题和简答题，需要检查答案是否为空
			if (question && question.type === 'fill') {
				const validAnswers = selectedAnswers.filter((ans) => ans && ans.trim() !== '');
				if (validAnswers.length > 0) {
					classes.push('answered');
				}
			} else if (question && question.type === 'short') {
				// 简答题：检查是否有文本或图片
				if (typeof selectedAnswers === 'object' && selectedAnswers.type) {
					if (selectedAnswers.type === 'text' && selectedAnswers.text && selectedAnswers.text.trim()) {
						classes.push('answered');
					} else if (selectedAnswers.type === 'image' && selectedAnswers.images && selectedAnswers.images.length > 0) {
						classes.push('answered');
					}
				}
			} else {
				// 单选题、多选题、判断题：有选项就标记为已作答
				classes.push('answered');
			}
		}
	}

	return classes.join(' ');
};

// 检查当前题目的收藏状态
const checkFavoriteStatus = async () => {
	const question = questionList.value[currentIndex.value];
	if (!question || !question.id) {
		isFavorite.value = false;
		return;
	}

	const token = uni.getStorageSync('auth_token');
	if (!token) {
		isFavorite.value = false;
		return;
	}

	try {
		const collections = await getCollectionList({ question_ids: [question.id] });
		isFavorite.value = collections && collections.length > 0 && collections.some((c) => c.question_id === question.id);
	} catch (error) {
		console.error('检查收藏状态失败:', error);
		isFavorite.value = false;
	}
};

// 切换收藏状态
const toggleFavorite = async () => {
	const question = questionList.value[currentIndex.value];
	if (!question || !question.id) return;

	const token = uni.getStorageSync('auth_token');
	if (!token) {
		uni.showModal({
			title: '提示',
			content: '请先登录',
			showCancel: false,
			confirmText: '去登录',
			success: (res) => {
				if (res.confirm) {
					uni.reLaunch({
						url: '/pages/login/index',
					});
				}
			},
		});
		return;
	}

	try {
		const result = await toggleCollection({
			question_id: question.id,
		});

		// 根据 API 返回结果更新状态
		if (result && result.is_collected !== undefined) {
			isFavorite.value = result.is_collected;
		} else {
			// 如果没有返回结果，切换状态
			isFavorite.value = !isFavorite.value;
		}

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

// 加载当前题目的笔记
const loadCurrentNote = async () => {
	const question = questionList.value[currentIndex.value];
	if (!question || !question.id) {
		currentNote.value = null;
		noteContent.value = '';
		return;
	}

	const token = uni.getStorageSync('auth_token');
	if (!token) {
		currentNote.value = null;
		noteContent.value = '';
		return;
	}

	try {
		const res = await getNoteByQuestionId(question.id);
		let note = null;
		if (res && res.data) {
			note = res.data;
		} else if (res && res.id) {
			note = res;
		}

		if (note) {
			currentNote.value = note;
			noteContent.value = note.content || '';
		} else {
			currentNote.value = null;
			noteContent.value = '';
		}
	} catch (error) {
		console.error('加载笔记失败:', error);
		currentNote.value = null;
		noteContent.value = '';
	}
};

// 打开笔记弹窗
watch(showNoteDialog, (newVal) => {
	if (newVal) {
		loadCurrentNote();
	}
});

// 保存笔记
const handleSaveNote = async () => {
	const question = questionList.value[currentIndex.value];
	if (!question || !question.id) {
		uni.showToast({
			title: '题目信息不完整',
			icon: 'none',
		});
		return;
	}

	const token = uni.getStorageSync('auth_token');
	if (!token) {
		uni.showModal({
			title: '提示',
			content: '请先登录',
			showCancel: false,
			confirmText: '去登录',
			success: (res) => {
				if (res.confirm) {
					uni.reLaunch({
						url: '/pages/login/index',
					});
				}
			},
		});
		return;
	}

	if (!noteContent.value || !noteContent.value.trim()) {
		uni.showToast({
			title: '请输入笔记内容',
			icon: 'none',
		});
		return;
	}

	savingNote.value = true;
	try {
		const result = await createOrUpdateNote({
			question_id: question.id,
			content: noteContent.value.trim(),
		});

		// 更新当前笔记
		if (result && result.data) {
			currentNote.value = result.data;
		} else if (result && result.id) {
			currentNote.value = result;
		}

		uni.showToast({
			title: '保存成功',
			icon: 'success',
		});

		// 关闭弹窗
		setTimeout(() => {
			showNoteDialog.value = false;
		}, 1000);
	} catch (error) {
		console.error('保存笔记失败:', error);
		uni.showToast({
			title: error.message || '保存失败',
			icon: 'none',
		});
	} finally {
		savingNote.value = false;
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
	if (!examData.value || !examData.value.duration) {
		examTimeLeft.value = 60 * 60; // 默认1小时
	} else {
		examTimeLeft.value = examData.value.duration * 60; // 转换为秒
	}
	examTimer = setInterval(() => {
		examTimeLeft.value--;
		if (examTimeLeft.value <= 0) {
			clearInterval(examTimer);
			// 时间到自动交卷
			handleSubmit();
		}
	}, 1000);
};

// 格式化考试剩余时间
const formatExamTime = computed(() => {
	return formatCountdown(examTimeLeft.value);
});

// 格式化学习时长（分钟）
const formatStudyDuration = computed(() => {
	const minutes = Math.floor(studyDuration.value / 60);
	return minutes;
});

// 是否可以打卡
const canCheckin = computed(() => {
	if (!checkinStatus.value) return false;
	if (checkinStatus.value.hasCheckedIn) return false;
	const currentMinutes = Math.floor(studyDuration.value / 60);
	return currentMinutes >= checkinStatus.value.requiredMinutes;
});

// 初始化打卡状态
const initCheckin = async () => {
	try {
		const res = await getTodayCheckinStatus();
		checkinStatus.value = res || {};
		if (!checkinStatus.value?.hasCheckedIn) {
			studyDuration.value = getDailyOnlineSeconds(userStore.userInfo?.id);
		}
	} catch (error) {
		console.error('获取打卡状态失败:', error);
		checkinStatus.value = {
			hasCheckedIn: false,
			requiredMinutes: 30,
		};
		studyDuration.value = getDailyOnlineSeconds(userStore.userInfo?.id);
	}
};

// 刷新在线时长显示
const startStudyTimer = () => {
	if (studyTimer) {
		clearInterval(studyTimer);
	}
	studyTimer = setInterval(() => {
		if (!checkinStatus.value?.hasCheckedIn) {
			studyDuration.value = getDailyOnlineSeconds(userStore.userInfo?.id);
		}
	}, 1000);
};

// 打卡
const handleCheckin = async () => {
	if (checkinStatus.value?.hasCheckedIn) {
		uni.showToast({
			title: '今天已经打卡过了',
			icon: 'none',
		});
		return;
	}

	if (!canCheckin.value) {
		const currentMinutes = Math.floor(studyDuration.value / 60);
		uni.showToast({
			title: `学习时长不足，需要${checkinStatus.value?.requiredMinutes || 0}分钟，当前${currentMinutes}分钟`,
			icon: 'none',
			duration: 2000,
		});
		return;
	}

	checkinLoading.value = true;
	try {
		const questionCount = questionList.value.length;
		const res = await checkin({
			studyDuration: getDailyOnlineSeconds(userStore.userInfo?.id) || studyDuration.value,
			questionCount: questionCount,
		});
		
		// 更新打卡状态
		checkinStatus.value = {
			...checkinStatus.value,
			hasCheckedIn: true,
		};

		const pointsEarned = Number(res?.pointsEarned || 0);
		uni.showToast({
			title: pointsEarned > 0 ? `打卡成功，+${pointsEarned}积分` : '打卡成功！',
			icon: 'success',
		});
	} catch (error) {
		console.error('打卡失败:', error);
		uni.showToast({
			title: error?.message || '打卡失败',
			icon: 'none',
		});
	} finally {
		checkinLoading.value = false;
	}
};

const handleSubmit = async () => {
	if (mode.value !== 'exam') return;

	// 检查是否有未答题的题目
	const answeredCount = Object.keys(answers.value).filter((qId) => {
		const answer = answers.value[qId];
		if (Array.isArray(answer)) {
			return answer.length > 0 && answer.some((a) => a && String(a).trim() !== '');
		}
		if (typeof answer === 'object' && answer !== null) {
			if (answer.type === 'text') {
				return answer.text && answer.text.trim() !== '';
			}
			if (answer.type === 'image') {
				return answer.images && answer.images.length > 0;
			}
		}
		return false;
	}).length;

	const totalCount = questionList.value.length;
	const unansweredCount = totalCount - answeredCount;

	let confirmContent = '确定要交卷吗？交卷后将无法修改答案。';
	if (unansweredCount > 0) {
		confirmContent = `还有 ${unansweredCount} 道题未作答，确定要交卷吗？交卷后将无法修改答案。`;
	}

	uni.showModal({
		title: '确认交卷',
		content: confirmContent,
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({ title: '提交中...' });

					// 停止倒计时
					if (examTimer) {
						clearInterval(examTimer);
						examTimer = null;
					}

					// 准备用户答案（格式：{ questionId: answer }）
					const userAnswers = {};
					for (const [questionId, answer] of Object.entries(answers.value)) {
						const qId = parseInt(questionId);
						if (Array.isArray(answer) && answer.length > 0) {
							userAnswers[qId] = answer;
						} else if (typeof answer === 'object' && answer !== null) {
							if (answer.type === 'text' && answer.text) {
								userAnswers[qId] = answer.text;
							} else if (answer.type === 'image' && answer.images && answer.images.length > 0) {
								userAnswers[qId] = answer.images.join(',');
							}
						}
					}

					// 提交考试
					const result = await submitExam({
						exam_config_id: examConfigId.value,
						user_answers: userAnswers,
						start_time: examStartTime.value,
					});

					uni.hideLoading();

					// 跳转到考试结果页面
					uni.redirectTo({
						url: `/pages/exam/result?recordId=${result.exam_record_id}`,
					});
				} catch (error) {
					uni.hideLoading();
					console.error('交卷失败:', error);
					uni.showToast({
						title: error.msg || error.message || '交卷失败，请重试',
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

const toggleAutoNextOnCorrect = (e) => {
	autoNextOnCorrect.value = e.detail.value;
	bankStore.updateSettings({ autoNextOnCorrect: e.detail.value });
};

const toggleAutoNextOnAnswer = (e) => {
	autoNextOnAnswer.value = e.detail.value;
	bankStore.updateSettings({ autoNextOnAnswer: e.detail.value });
};

const toggleAutoRemoveWrong = (e) => {
	autoRemoveWrong.value = e.detail.value;
	bankStore.updateSettings({ autoRemoveWrong: e.detail.value });
};

const toggleAnswerSound = (e) => {
	answerSound.value = e.detail.value;
	bankStore.updateSettings({ answerSound: e.detail.value });
};

// 监听设置变化，实时更新
watch(() => bankStore.settings, (newSettings) => {
	fontSize.value = newSettings.fontSize || 'medium';
	nightMode.value = newSettings.nightMode || false;
	autoNextOnCorrect.value = newSettings.autoNextOnCorrect !== false;
	autoNextOnAnswer.value = newSettings.autoNextOnAnswer !== false;
	autoShowAnalysis.value = newSettings.autoShowAnalysis || false;
	autoRemoveWrong.value = newSettings.autoRemoveWrong || false;
	answerSound.value = newSettings.answerSound || false;
}, { deep: true });

const toggleViewMode = () => {
	// 切换视图模式（如果需要）
	viewMode.value = viewMode.value === 'list' ? 'card' : 'list';
};

// 获取题目类型文本
const getQuestionTypeText = (type) => {
	const typeMap = {
		single: '单选题',
		multiple: '多选题',
		judge: '判断题',
		fill: '填空题',
		reading: '阅读理解',
		short: '简答题',
	};
	return typeMap[type] || '题目';
};

// 获取题目类型样式类
const getQuestionTypeClass = (type) => {
	return `type-${type}`;
};

// 提交答案并查看结果
const handleSubmitAnswer = async () => {
	const question = currentQuestion.value;
	if (!question) return;

	// 模拟考试模式下不允许单独提交答案，只能交卷
	if (mode.value === 'exam') {
		uni.showToast({
			title: '模拟考试模式下请点击"交卷"按钮统一提交',
			icon: 'none',
		});
		return;
	}

	await checkAnswer(question);

	// 如果开启了自动下一题，且答对了，自动跳转
	if (autoNextOnCorrect.value && question.isCorrect && currentIndex.value < questionList.value.length - 1) {
		setTimeout(() => {
			currentIndex.value++;
		}, 1000);
	}
};

// 处理简答题自评
const handleSelfAssessment = async (answer) => {
	const question = currentQuestion.value;
	if (!question || question.type !== 'short') return;

	try {
		// 保存答案
		answers.value[question.id] = answer;

		// 提交答案到后端（使用自评结果作为 is_correct）
		const isCorrect = answer.selfAssessment === 'correct' ? 1 : 0;

		const result = await submitAnswer({
			qid: question.id,
			text_answer: answer.text || '',
			is_correct: isCorrect, // 使用自评结果
		});

		// 更新题目状态
		if (result) {
			question.isCorrect = answer.selfAssessment === 'correct';
			question.correctAnswer = result.answer || question.correctAnswer;
			question.explanation = result.analysis || question.explanation;

			// 更新答题记录映射
			answerRecordsMap.value.set(question.id, {
				is_correct: isCorrect,
				user_option: null,
				text_answer: answer.text || null,
				image_answer: null,
			});

			// 标记题目已提交，显示重新答题按钮
			submittedQuestions.value.add(question.id);
			showResult.value = true;
			showAnalysis.value = true;

			uni.showToast({
				title: answer.selfAssessment === 'correct' ? '已标记为答对' : '已标记为答错',
				icon: 'success',
			});

			saveProgress();
		}
	} catch (error) {
		console.error('提交自评结果失败:', error);
		uni.showToast({
			title: error.message || '提交失败，请重试',
			icon: 'none',
		});
	}
};

// 重新答题
const handleResetAnswer = (questionId) => {
	const question = questionList.value.find((q) => q.id === questionId);
	if (!question) return;

	// 清除答案（本地输入和答题记录）
	delete answers.value[questionId];

	// 清除答题记录映射中的记录
	answerRecordsMap.value.delete(questionId);

	// 移除已提交标记
	submittedQuestions.value.delete(questionId);

	// 重置题目状态
	question.isCorrect = undefined;
	question.is_correct = undefined;
	question.is_answered = false;

	// 清除解析信息（可选，如果需要保留解析可以注释掉）
	// question.correctAnswer = undefined;
	// question.explanation = undefined;

	// 强制触发响应式更新，确保组件重新渲染
	answers.value = { ...answers.value };

	saveProgress();

	uni.showToast({
		title: '已重置答案',
		icon: 'success',
		duration: 1500,
	});
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.answer-page {
	@include flex(column, flex-start, stretch, 0);
	height: 100vh;
	background-color: $bg-primary;
	font-family: $font-family-base;

	&.night-mode {
		background-color: #1a1a1a;
		color: #e0e0e0;
		
		.custom-navbar {
			background-color: #1a1a1a;
			color: #e0e0e0;
		}
		
		.bottom-status-bar {
			background-color: #2a2a2a;
			border-top-color: #3a3a3a;
			color: #e0e0e0;
		}
	}
}

.custom-navbar {
	@include flex(row, space-between, center, 0);
	padding: $space-4 $space-8;
	padding-top: calc(var(--status-bar-height) + $space-4);
	height: calc(var(--status-bar-height) + 88rpx);
	@include gradient(135deg, #17c3a2, #14a085);
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: $z-sticky;
	box-shadow: $shadow-lg;
	border-bottom: none;
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);
	transition: box-shadow $transition-base;
}

.navbar-left {
	display: flex;
	align-items: center;
	cursor: pointer;
	padding: $space-2;
	border-radius: $radius-md;
	transition: all $transition-fast;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	&:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.15);
	}
}

.navbar-center {
	flex: 1;
	@include flex(column, center, center, 0);
}

.checkin-status-bar {
	margin-top: 4rpx;
}

.checkin-status-text {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.9);
	font-weight: 500;
}

.navbar-title {
	@include text(md, bold, inverse);
	color: #ffffff; // 白色文字
	max-width: 300rpx;
	@include truncate;

	.night-mode & {
		color: #e0e0e0;
	}
}

.exam-timer {
	@include text(xs, semibold, error);
	background-color: rgba($color-error, 0.2);
	padding: $space-2 $space-4;
	border-radius: $radius-full;
	margin-top: $space-2;
	color: #fff;
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	animation: pulse 2s infinite;
}

.navbar-right {
	@include flex(row, flex-start, center, $space-4);
}

.navbar-submit-btn {
	@include button-success;
	padding: $space-2 $space-6;
	border-radius: $radius-full;
	transition: all $transition-base;
	cursor: pointer;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transform: translate(-50%, -50%);
		transition: width 0.3s, height 0.3s;
	}

	&:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);

		&::before {
			width: 200%;
			height: 200%;
		}
	}

	&:active {
		transform: scale(0.95) translateY(0);
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
	}

	.submit-text {
		@include text(sm, semibold, inverse);
		color: $text-inverse;
		position: relative;
		z-index: 1;
	}
}

.navbar-icon-group {
	display: flex;
	gap: 20rpx;
}

.navbar-icon-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	border-radius: $radius-md;
	transition: all $transition-fast;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.1);
	}

	&:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.15);
	}
}

.icon-dots {
	font-size: 32rpx;
	color: #ffffff; // 白色图标
	line-height: 1;
}

.icon-circle {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background-color: #ffffff; // 白色圆圈
	border: 2rpx solid #ffffff;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #17c3a2; // 青色内点
	}
}

.question-swiper {
	flex: 1;
	margin-top: calc(var(--status-bar-height) + 88rpx + 80rpx);
	margin-bottom: 160rpx;
	animation: fadeIn 0.4s ease-out;

	// 错题详情和收藏详情页面，调整边距
	&.detail-mode {
		margin-bottom: 0;
		margin-top: calc(var(--status-bar-height) + 88rpx);
		padding-top: $space-12;
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.swiper-item {
	height: 100%;
	overflow-y: auto;
}

.question-wrapper {
	width: 100%;
	padding: $space-4 $space-8;
	box-sizing: border-box;
}

.bottom-status-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	@include flex(row, space-between, center, 0);
	padding: $space-6 $space-8;
	padding-bottom: calc($space-6 + env(safe-area-inset-bottom));
	background-color: #ffffff;
	border-top: 1rpx solid $border-light;
	z-index: $z-sticky;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);
	transition: box-shadow $transition-base;
}

.status-left {
	display: flex;
	align-items: center;
	gap: $space-6;
}

.status-item {
	display: flex;
	align-items: center;
	gap: $space-2;
	padding: $space-2 $space-4;
	border-radius: $radius-md;
	transition: all $transition-fast;
	cursor: pointer;

	&:hover {
		background: rgba(0, 0, 0, 0.03);
		transform: translateY(-2rpx);
	}

	&:active {
		transform: scale(0.95) translateY(0);
	}

	&.correct {
		:deep(.app-icon) {
			color: #10b981;
			transition: transform $transition-fast;
		}
		.status-count {
			color: #10b981;
			font-weight: $font-weight-medium;
		}

		&:hover {
			background: rgba(16, 185, 129, 0.08);

			:deep(.app-icon) {
				transform: scale(1.1);
			}
		}
	}

	&.wrong {
		:deep(.app-icon) {
			color: #ef4444;
			transition: transform $transition-fast;
		}
		.status-count {
			color: #ef4444;
			font-weight: $font-weight-medium;
		}

		&:hover {
			background: rgba(239, 68, 68, 0.08);

			:deep(.app-icon) {
				transform: scale(1.1);
			}
		}
	}
}

.status-count {
	font-size: $font-size-sm;
	font-weight: $font-weight-medium;
}

.status-center {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $space-1;
	padding: $space-2 $space-4;
	border-radius: $radius-md;
	transition: all $transition-fast;
	cursor: pointer;

	&:hover {
		background: rgba($color-primary, 0.08);
		transform: scale(1.05);

		:deep(.app-icon) {
			transform: scale(1.1);
			color: $color-primary;
		}
	}

	&:active {
		transform: scale(0.95);
	}

	:deep(.app-icon) {
		transition: all $transition-fast;
	}

	.status-center-text {
		@include text(xs, normal, primary);
		color: $text-primary;
		font-size: $font-size-xs;
		transition: color $transition-fast;
	}

	&:hover .status-center-text {
		color: $color-primary;
		font-weight: $font-weight-medium;
	}
}

.status-right-group {
	display: flex;
	align-items: center;
	gap: $space-4;
}

.status-right {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
	cursor: pointer;
	padding: $space-2 $space-4;
	border-radius: $radius-md;
	transition: all $transition-fast;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba($color-primary, 0.08);
		border-radius: $radius-md;
		opacity: 0;
		transition: opacity $transition-fast;
	}

	&:hover {
		transform: translateY(-2rpx);

		&::before {
			opacity: 1;
		}

		:deep(.app-icon) {
			transform: scale(1.15);
			color: $color-primary;
		}

		.status-text {
			color: $color-primary;
			font-weight: $font-weight-medium;
		}
	}

	&:active {
		transform: scale(0.95) translateY(0);
	}

	:deep(.app-icon) {
		transition: all $transition-fast;
	}

	.status-text {
		transition: all $transition-fast;
	}
}

.checkin-btn {
	&.checkin-disabled {
		opacity: 0.5;
		cursor: not-allowed;
		
		&:hover {
			transform: translateY(0);
			
			&::before {
				opacity: 0;
			}
			
			:deep(.app-icon) {
				transform: scale(1);
				color: #999;
			}
			
			.status-text {
				color: $text-secondary;
				font-weight: normal;
			}
		}
		
		&:active {
			transform: scale(1);
		}
	}
}

.status-text {
	@include text(xs, normal, secondary);
	color: $text-secondary;
	font-size: $font-size-xs;
}

.status-left {
	display: flex;
	align-items: center;
	gap: 24rpx;
}

.status-item {
	display: flex;
	align-items: center;
	gap: 8rpx;

	&.correct {
		color: #2ecc71;
	}

	&.wrong {
		color: #e74c3c;
	}
}

.status-count {
	font-size: 28rpx;
	font-weight: 500;
}

.status-center {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.error-report-link {
	position: fixed;
	bottom: 100rpx;
	left: 50%;
	transform: translateX(-50%);
	@include text(xs, normal, tertiary);
	color: $text-tertiary;
	text-decoration: none;
	z-index: 98;
	padding: $space-2 $space-4;
	border-radius: $radius-full;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	cursor: pointer;
	transition: all $transition-fast;

	&:hover {
		background: rgba(255, 255, 255, 1);
		transform: translateX(-50%) translateY(-2rpx);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		color: $color-primary;
	}

	&:active {
		transform: translateX(-50%) scale(0.95);
	}

	text {
		font-size: $font-size-xs;
	}
}

.answer-sheet-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	animation: fadeIn 0.3s ease-out;
	backdrop-filter: blur(4rpx);
	-webkit-backdrop-filter: blur(4rpx);
}

.answer-sheet-popup {
	width: 100%;
	background-color: $white;
	border-radius: 24rpx 24rpx 0 0;
	height: 80vh;
	display: flex;
	flex-direction: column;
	animation: slideUp 0.3s ease-out;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.15);
	overflow: hidden; // 防止内容溢出

	.popup-header {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 32rpx;
		padding-bottom: 24rpx;
		border-bottom: 1px solid #f0f0f0;
		flex-shrink: 0;
		height: auto;
	}

	.popup-close-btn {
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border-radius: $radius-md;
		transition: all $transition-fast;

		&:hover {
			background: rgba(0, 0, 0, 0.05);
			transform: scale(1.1);
		}

		&:active {
			transform: scale(0.95);
		}
	}
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.settings-page {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	animation: fadeIn 0.3s ease-out;
	backdrop-filter: blur(4rpx);
	-webkit-backdrop-filter: blur(4rpx);
}

.settings-page-content {
	width: 100%;
	height: 100%;
	background-color: $white;
	display: flex;
	flex-direction: column;
	animation: slideUp 0.3s ease-out;
}

.settings-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 32rpx;
	padding-top: calc(var(--status-bar-height) + 24rpx);
	background-color: #17c3a2;
	color: #fff;
}

.settings-back {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	border-radius: $radius-md;
	transition: all $transition-fast;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	&:active {
		transform: scale(0.95);
	}
}

.settings-title {
	flex: 1;
	text-align: center;
	font-size: 36rpx;
	font-weight: 600;
	color: #fff;
}

.settings-view-toggle {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.view-toggle-item {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8rpx;
	background-color: rgba(255, 255, 255, 0.2);
	cursor: pointer;
	transition: all $transition-fast;

	&:hover {
		background-color: rgba(255, 255, 255, 0.3);
		transform: scale(1.1);
	}

	&.active {
		background-color: rgba(255, 255, 255, 0.4);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}

	&:active {
		transform: scale(0.95);
	}
}

.toggle-dots {
	font-size: 24rpx;
	color: #fff;
	line-height: 1;
}

.toggle-circle {
	width: 20rpx;
	height: 20rpx;
	border-radius: 50%;
	background-color: #fff;
}

.settings-list {
	flex: 1;
	padding: 32rpx;
	overflow-y: auto;
}

.setting-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx 0;
	border-bottom: 1px solid #f0f0f0;
	transition: background-color $transition-fast;

	&:hover {
		background-color: rgba(0, 0, 0, 0.02);
	}

	&:last-child {
		border-bottom: none;
	}
}

.setting-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	flex: 1;
}

.setting-label {
	font-size: 32rpx;
	color: #333;
	font-weight: 500;
}

.setting-desc {
	font-size: 24rpx;
	color: #999;
}

.font-size-options {
	display: flex;
	gap: 16rpx;
}

.font-size-option {
	padding: 8rpx 16rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 8rpx;
	font-size: 28rpx;
	color: #666;
	cursor: pointer;
	transition: all $transition-fast;

	&:hover {
		border-color: #17c3a2;
		background-color: rgba(23, 195, 162, 0.05);
		transform: translateY(-2rpx);
	}

	&.active {
		border-color: #17c3a2;
		color: #17c3a2;
		background-color: rgba(23, 195, 162, 0.1);
		box-shadow: 0 2rpx 8rpx rgba(23, 195, 162, 0.2);
		font-weight: $font-weight-medium;
	}

	&:active {
		transform: scale(0.95) translateY(0);
	}
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 32rpx;
	padding-bottom: 24rpx;
	border-bottom: 1px solid #f0f0f0;
}

.popup-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333;
}

.popup-close-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.answer-sheet-scroll {
	flex: 1;
	height: calc(80vh - 120rpx); // 80vh 减去 header 高度（约 120rpx）
	width: 100%;
}

.answer-sheet-grid {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 16rpx;
	padding: 32rpx;
	padding-top: 24rpx;
	padding-bottom: 32rpx;
}

.sheet-item {
	width: 100%;
	aspect-ratio: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f5f5f5;
	border: 2rpx solid #e0e0e0;
	border-radius: 50%;
	font-size: 28rpx;
	color: #666;
	transition: all $transition-base;
	cursor: pointer;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba($color-primary, 0.1);
		transform: translate(-50%, -50%);
		transition: width 0.3s, height 0.3s;
	}

	&:hover {
		transform: scale(1.1);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

		&::before {
			width: 200%;
			height: 200%;
		}
	}

	&.current {
		border-color: #17c3a2;
		border-width: 3rpx;
		background-color: #fff;
		color: #17c3a2;
		font-weight: 600;
		box-shadow: 0 4rpx 12rpx rgba(23, 195, 162, 0.3);
		animation: pulse-border 2s infinite;
	}

	&.answered {
		background-color: rgba(23, 195, 162, 0.1);
		border-color: rgba(23, 195, 162, 0.3);
	}

	&.correct {
		background-color: rgba(46, 204, 113, 0.15);
		border-color: #2ecc71;
		color: #2ecc71;
		font-weight: 600;
		box-shadow: 0 2rpx 8rpx rgba(46, 204, 113, 0.2);
	}

	&.wrong {
		background-color: rgba(231, 76, 60, 0.15);
		border-color: #e74c3c;
		color: #e74c3c;
		font-weight: 600;
		box-shadow: 0 2rpx 8rpx rgba(231, 76, 60, 0.2);
	}

	&:active {
		transform: scale(0.9);
	}
}

@keyframes pulse-border {
	0%, 100% {
		box-shadow: 0 4rpx 12rpx rgba(23, 195, 162, 0.3);
	}
	50% {
		box-shadow: 0 4rpx 16rpx rgba(23, 195, 162, 0.5);
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

/* 笔记弹窗样式 */
.note-dialog-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: fadeIn 0.3s;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.note-dialog {
	width: 90%;
	max-width: 600rpx;
	background-color: #fff;
	border-radius: 24rpx;
	overflow: hidden;
	animation: slideUp 0.3s ease-out;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}

@keyframes slideUp {
	from {
		transform: translateY(100rpx);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.note-dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.note-dialog-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333;
}

.note-dialog-close {
	padding: 8rpx;
	cursor: pointer;
	border-radius: $radius-md;
	transition: all $transition-fast;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
		transform: scale(1.1);
	}

	&:active {
		transform: scale(0.95);
	}
}

.note-dialog-content {
	padding: 32rpx;
}

.note-textarea {
	width: 100%;
	min-height: 300rpx;
	padding: 24rpx;
	border: 1rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	line-height: 1.6;
	color: #333;
	background-color: #f9f9f9;
	transition: all $transition-fast;

	&:focus {
		outline: none;
		border-color: #17c3a2;
		background-color: #fff;
		box-shadow: 0 0 0 3rpx rgba(23, 195, 162, 0.1);
	}
}

.note-char-count {
	text-align: right;
	margin-top: 16rpx;
	font-size: 24rpx;
	color: #999;
}

.note-dialog-footer {
	display: flex;
	gap: 24rpx;
	padding: 32rpx;
	border-top: 1rpx solid #f0f0f0;
}

.note-btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	text-align: center;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: 500;
	border: none;
	cursor: pointer;
	transition: all $transition-base;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transform: translate(-50%, -50%);
		transition: width 0.3s, height 0.3s;
	}

	&.cancel-btn {
		background-color: #f5f5f5;
		color: #666;

		&:hover {
			background-color: #e8e8e8;
			transform: translateY(-2rpx);
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		}

		&:active {
			transform: scale(0.95) translateY(0);
		}
	}

	&.save-btn {
		background-color: #17c3a2;
		color: #fff;
		box-shadow: 0 2rpx 8rpx rgba(23, 195, 162, 0.3);

		&:hover {
			background-color: #14a085;
			transform: translateY(-2rpx);
			box-shadow: 0 4rpx 12rpx rgba(23, 195, 162, 0.4);

			&::before {
				width: 200%;
				height: 200%;
			}
		}

		&:active {
			transform: scale(0.95) translateY(0);
			box-shadow: 0 2rpx 6rpx rgba(23, 195, 162, 0.3);
		}
	}
}
</style>
