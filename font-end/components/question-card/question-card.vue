<template>
	<view class="question-card" :class="{ 'night-mode': nightMode }">
		<!-- 题号 -->
		<view class="question-header">
			<text class="question-number">{{ questionIndex + 1 }} / {{ totalCount }}</text>
			<text class="question-type">{{ questionTypeText }}</text>
		</view>

		<!-- 题干 -->
		<view class="question-body">
			<rich-text :nodes="question.content" class="question-content"></rich-text>
		</view>

		<!-- 选项（单选题、多选题、判断题） -->
		<view class="question-options" v-if="question.type !== 'fill'">
			<view
				v-for="(option, index) in question.options"
				:key="index"
				class="option-item"
				:class="getOptionClass(option, index)"
				@click="handleOptionClick(option, index)"
			>
				<view class="option-label">{{ getOptionLabel(index) }}</view>
				<view class="option-content">
					<rich-text :nodes="option.content"></rich-text>
				</view>
				<view class="option-icon" v-if="showResult">
					<app-icon v-if="isCorrectOption(option, index)" name="correct" :size="32" color="#2ecc71" />
					<app-icon v-if="isWrongOption(option, index)" name="error" :size="32" color="#e74c3c" />
				</view>
			</view>
		</view>

		<!-- 填空题输入框 -->
		<view class="fill-blank-answers" v-if="question.type === 'fill'">
			<view
				v-for="(blank, index) in fillBlankCount"
				:key="index"
				class="fill-blank-item"
			>
				<text class="blank-label">第{{ index + 1 }}空：</text>
				<input
					class="blank-input"
					:class="{ 'correct': isFillBlankCorrect(index), 'wrong': isFillBlankWrong(index) }"
					v-model="fillBlankAnswers[index]"
					placeholder="请输入答案"
					:disabled="mode === 'exam' && showResult"
					@input="handleFillBlankInput(index, $event)"
				/>
				<view class="blank-icon" v-if="showResult">
					<app-icon v-if="isFillBlankCorrect(index)" name="correct" :size="32" color="#2ecc71" />
					<app-icon v-if="isFillBlankWrong(index)" name="error" :size="32" color="#e74c3c" />
				</view>
			</view>
		</view>

		<!-- 解析区 -->
		<view class="question-analysis" v-if="showAnalysis">
			<view class="analysis-header">解析</view>
			<view class="analysis-content">
				<view class="analysis-answer">
					<text class="label">正确答案：</text>
					<text class="value">{{ formatAnswer(question.correctAnswer) }}</text>
				</view>
				<view class="analysis-point" v-if="question.point">
					<text class="label">考点：</text>
					<text class="value">{{ question.point }}</text>
				</view>
				<view class="analysis-explanation" v-if="question.explanation">
					<rich-text :nodes="question.explanation"></rich-text>
				</view>
				<view class="analysis-note" v-if="question.userNote">
					<text class="label">我的笔记：</text>
					<text class="value">{{ question.userNote }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import AppIcon from '@/components/app-icon/app-icon.vue';

const props = defineProps({
	question: {
		type: Object,
		required: true,
	},
	questionIndex: {
		type: Number,
		default: 0,
	},
	totalCount: {
		type: Number,
		default: 0,
	},
	selectedAnswers: {
		type: Array,
		default: () => [],
	},
	showResult: {
		type: Boolean,
		default: false,
	},
	showAnalysis: {
		type: Boolean,
		default: false,
	},
	mode: {
		type: String,
		default: 'practice', // practice, exam
		validator: (val) => ['practice', 'exam'].includes(val),
	},
	nightMode: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['select']);

const questionTypeText = computed(() => {
	const typeMap = {
		single: '单选题',
		multiple: '多选题',
		judge: '判断题',
		fill: '填空题',
		reading: '阅读理解',
	};
	return typeMap[props.question.type] || '单选题';
});

// 填空题答案
const fillBlankAnswers = ref([]);
const fillBlankCount = computed(() => {
	if (props.question.type !== 'fill') return 0;
	// 根据正确答案数量确定填空数量
	const correctAnswers = Array.isArray(props.question.correctAnswer) 
		? props.question.correctAnswer 
		: [props.question.correctAnswer];
	return Math.max(correctAnswers.length, 1); // 至少1个空
});

// 初始化填空题答案
watch(() => props.selectedAnswers, (newVal) => {
	if (props.question.type === 'fill') {
		fillBlankAnswers.value = Array.isArray(newVal) ? [...newVal] : (newVal ? [newVal] : []);
		// 确保数组长度匹配
		while (fillBlankAnswers.value.length < fillBlankCount.value) {
			fillBlankAnswers.value.push('');
		}
	}
}, { immediate: true });

const getOptionLabel = (index) => {
	return String.fromCharCode(65 + index); // A, B, C, D...
};

const getOptionClass = (option, index) => {
	const classes = [];
	const optionKey = getOptionLabel(index);

	// 选中状态
	if (props.selectedAnswers.includes(optionKey)) {
		classes.push('selected');
	}

	// 显示结果时的样式
	if (props.showResult) {
		if (isCorrectOption(option, index)) {
			classes.push('correct');
		}
		if (isWrongOption(option, index)) {
			classes.push('wrong');
		}
	}

	return classes.join(' ');
};

const isCorrectOption = (option, index) => {
	const optionKey = getOptionLabel(index);
	const correctAnswers = normalizeAnswer(props.question.correctAnswer);
	
	// 判断题特殊处理：答案可能是 "正确"/"错误" 或 "A"/"B"
	if (props.question.type === 'judge') {
		const optionText = (option.content || '').toLowerCase();
		const isCorrectOption = optionText.includes('正确') || optionText.includes('对') || optionText === 'true' || optionText === '1';
		const isWrongOption = optionText.includes('错误') || optionText.includes('错') || optionText === 'false' || optionText === '0';
		
		// 检查正确答案
		for (const ans of correctAnswers) {
			const ansLower = String(ans).toLowerCase();
			// 如果答案是 "正确"、"对"、"true"、"1" 等，且当前选项是正确选项
			if ((ansLower.includes('正确') || ansLower.includes('对') || ansLower === 'true' || ansLower === '1' || ansLower === 'a') && isCorrectOption) {
				return true;
			}
			// 如果答案是 "错误"、"错"、"false"、"0" 等，且当前选项是错误选项
			if ((ansLower.includes('错误') || ansLower.includes('错') || ansLower === 'false' || ansLower === '0' || ansLower === 'b') && isWrongOption) {
				return true;
			}
			// 如果答案是选项key（A/B）
			if (ansLower === optionKey.toLowerCase()) {
				return true;
			}
		}
		return false;
	}
	
	return correctAnswers.some(ans => {
		const ansStr = String(ans).toUpperCase();
		return ansStr === optionKey || ansStr === optionKey.toLowerCase();
	});
};

const isWrongOption = (option, index) => {
	const optionKey = getOptionLabel(index);
	return props.selectedAnswers.includes(optionKey) && !isCorrectOption(option, index);
};

// 规范化答案格式
const normalizeAnswer = (answer) => {
	if (!answer) return [];
	if (Array.isArray(answer)) {
		return answer.map(a => String(a));
	}
	return [String(answer)];
};

// 填空题判断
const isFillBlankCorrect = (index) => {
	if (!props.showResult || !props.question.correctAnswer) return false;
	const correctAnswers = normalizeAnswer(props.question.correctAnswer);
	const userAnswer = fillBlankAnswers.value[index] || '';
	const correctAnswer = correctAnswers[index] || '';
	return userAnswer.trim() === correctAnswer.trim();
};

const isFillBlankWrong = (index) => {
	if (!props.showResult || !props.question.correctAnswer) return false;
	const userAnswer = fillBlankAnswers.value[index] || '';
	return userAnswer.trim() !== '' && !isFillBlankCorrect(index);
};

const formatAnswer = (answer) => {
	if (!answer) return '暂无答案';
	
	const normalized = normalizeAnswer(answer);
	
	// 判断题特殊处理
	if (props.question.type === 'judge') {
		return normalized.map(ans => {
			const ansLower = String(ans).toLowerCase();
			if (ansLower.includes('正确') || ansLower.includes('对') || ansLower === 'true' || ansLower === '1' || ansLower === 'a') {
				return '正确';
			}
			if (ansLower.includes('错误') || ansLower.includes('错') || ansLower === 'false' || ansLower === '0' || ansLower === 'b') {
				return '错误';
			}
			return ans;
		}).join('、');
	}
	
	// 填空题
	if (props.question.type === 'fill') {
		return normalized.map((ans, idx) => `第${idx + 1}空：${ans}`).join('；');
	}
	
	// 其他题型
	return normalized.sort().join('、');
};

const handleOptionClick = (option, index) => {
	if (props.mode === 'exam' && props.showResult) {
		return; // 考试模式已交卷，不允许修改
	}

	const optionKey = getOptionLabel(index);
	emit('select', optionKey);
};

const handleFillBlankInput = (index, event) => {
	const value = event.detail.value || '';
	fillBlankAnswers.value[index] = value;
	// 发送填空题答案（数组格式）
	emit('select', fillBlankAnswers.value);
};
</script>

<style lang="scss" scoped>
.question-card {
	padding: $spacing-lg;
	background-color: $white;
	min-height: 100vh;

	&.night-mode {
		background-color: #1a1a1a;
		color: #e0e0e0;
	}
}

.question-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: $spacing-md;
	border-bottom: 1px solid $border-color;
	margin-bottom: $spacing-lg;
}

.question-number {
	font-size: $font-size-base;
	color: $text-color-secondary;
	font-weight: 500;
}

.question-type {
	font-size: $font-size-sm;
	color: $primary-color;
	background-color: rgba(231, 76, 60, 0.1);
	padding: 4rpx 12rpx;
	border-radius: 4rpx;
}

.question-body {
	margin-bottom: $spacing-xl;
}

.question-content {
	font-size: $font-size-lg;
	line-height: 1.8;
	color: $text-color;
}

.question-options {
	margin-bottom: $spacing-xl;
}

.option-item {
	display: flex;
	align-items: flex-start;
	padding: $spacing-md;
	margin-bottom: $spacing-md;
	border: 2rpx solid $border-color;
	border-radius: $button-radius;
	background-color: $white;
	transition: all 0.3s;

	&.selected {
		border-color: $primary-color;
		background-color: rgba(231, 76, 60, 0.05);
	}

	&.correct {
		border-color: $success-color;
		background-color: rgba(46, 204, 113, 0.1);
	}

	&.wrong {
		border-color: $error-color;
		background-color: rgba(231, 76, 60, 0.1);
	}
}

.option-label {
	width: 48rpx;
	height: 48rpx;
	line-height: 48rpx;
	text-align: center;
	border-radius: 50%;
	background-color: #f5f5f5;
	color: $text-color;
	font-weight: 500;
	margin-right: $spacing-md;
	flex-shrink: 0;
}

.option-item.selected .option-label {
	background-color: $primary-color;
	color: $white;
}

.option-item.correct .option-label {
	background-color: $success-color;
	color: $white;
}

.option-content {
	flex: 1;
	font-size: $font-size-base;
	line-height: 1.6;
}

.option-icon {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.icon-correct {
	color: $success-color;
	font-size: 32rpx;
	font-weight: bold;
}

.icon-wrong {
	color: $error-color;
	font-size: 32rpx;
	font-weight: bold;
}

.question-analysis {
	margin-top: $spacing-xl;
	padding: $spacing-lg;
	background-color: #f9f9f9;
	border-radius: $card-radius;
}

.analysis-header {
	font-size: $font-size-lg;
	font-weight: 600;
	color: $text-color;
	margin-bottom: $spacing-md;
	padding-bottom: $spacing-sm;
	border-bottom: 1px solid $border-color;
}

.analysis-content {
	font-size: $font-size-base;
	line-height: 1.8;
}

.analysis-answer,
.analysis-point {
	margin-bottom: $spacing-md;
}

.label {
	color: $text-color-secondary;
	margin-right: $spacing-xs;
}

.value {
	color: $text-color;
	font-weight: 500;
}

.analysis-explanation {
	margin-top: $spacing-md;
	padding-top: $spacing-md;
	border-top: 1px solid $border-color;
}

.analysis-note {
	margin-top: $spacing-md;
	padding: $spacing-md;
	background-color: #fff9e6;
	border-radius: $button-radius;
	border-left: 4rpx solid $warning-color;
}

/* 填空题样式 */
.fill-blank-answers {
	margin-bottom: $spacing-xl;
}

.fill-blank-item {
	display: flex;
	align-items: center;
	margin-bottom: $spacing-md;
	padding: $spacing-md;
	border: 2rpx solid $border-color;
	border-radius: $button-radius;
	background-color: $white;
}

.blank-label {
	font-size: $font-size-base;
	color: $text-color;
	margin-right: $spacing-md;
	flex-shrink: 0;
	min-width: 120rpx;
}

.blank-input {
	flex: 1;
	font-size: $font-size-base;
	padding: $spacing-sm $spacing-md;
	border: 2rpx solid $border-color;
	border-radius: $button-radius;
	background-color: #f9f9f9;
	
	&.correct {
		border-color: $success-color;
		background-color: rgba(46, 204, 113, 0.1);
	}
	
	&.wrong {
		border-color: $error-color;
		background-color: rgba(231, 76, 60, 0.1);
	}
}

.blank-icon {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	margin-left: $spacing-md;
}
</style>
