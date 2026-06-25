<template>
	<view class="question-card" :class="{ 'night-mode': nightMode, [`font-size-${fontSize}`]: true }">
		<!-- 题目头部：类型标签和进度 -->
		<view class="question-header-bar" v-if="!fromWrong && !fromCollection && !fromNotes">
			<view class="question-type-tag" :class="getQuestionTypeClass(question?.type)">
				{{ questionTypeText }}
			</view>
			<view class="question-progress-info">
				<text class="progress-text">{{ questionIndex + 1 }}/{{ totalCount }}</text>
				<view class="settings-icon-btn" @click="handleShowSettings">
					<app-icon name="settings" :size="24" color="#666" />
				</view>
			</view>
		</view>
		
		<!-- 从笔记跳转时显示题目类型标签（与正常模式样式一致） -->
		<view class="question-header-bar-simple" v-if="fromNotes">
			<view class="question-type-tag" :class="getQuestionTypeClass(question?.type)">
				{{ questionTypeText }}
			</view>
		</view>

		<!-- 题干 -->
		<view class="question-body">
			<!-- 调试信息（临时启用，调整位置避免遮挡） -->
			<!-- <view
				v-if="fromWrong"
				style="
					position: fixed;
					bottom: 100px;
					left: 0;
					background: rgba(0, 0, 0, 0.8);
					color: white;
					padding: 10px;
					z-index: 9999;
					font-size: 24rpx;
					max-width: 80%;
				"
			>
				<text style="display: block; margin-bottom: 5px">题目ID: {{ question?.id }}</text>
				<text style="display: block; margin-bottom: 5px">题目类型: {{ question?.type }}</text>
				<text style="display: block; margin-bottom: 5px">题目content: {{ question?.content }}</text>
				<text style="display: block; margin-bottom: 5px">题目content类型: {{ typeof question?.content }}</text>
				<text style="display: block; margin-bottom: 5px">题目content长度: {{ question?.content?.length || 0 }}</text>
				<text style="display: block; margin-bottom: 5px">题目stem (原始): {{ question?._raw?.stem }}</text>
			</view> -->
			<!-- 如果内容包含 HTML 标签（如图片），使用自定义渲染 -->
			<view
				v-if="question && question.content && String(question.content).trim() && hasHtmlContent(question.content)"
				class="question-content-html"
			>
				<view
					v-for="(part, index) in parseHtmlContent(question.content)"
					:key="index"
					class="html-content-part"
				>
					<!-- 图片部分 -->
					<image
						v-if="part.type === 'image'"
						:src="part.src"
						mode="widthFix"
						class="question-image"
						@click="previewImage(part.src, getImageUrls(question.content))"
					/>
					<!-- 文本部分 -->
					<rich-text v-else :nodes="part.content" class="question-content-text-part"></rich-text>
				</view>
			</view>
			<!-- 纯文本内容使用 view 组件显示 -->
			<view v-else-if="question && question.content && String(question.content).trim()" class="question-content-text">
				{{ stripHtmlTags(question.content) }}
			</view>
			<view v-else class="question-content-empty">
				<text>题目内容加载中...</text>
				<text
					v-if="question && !question.content"
					style="display: block; margin-top: 10px; font-size: 24rpx; color: #999"
					>(content为空)</text
				>
				<text
					v-if="question && question.content && !String(question.content).trim()"
					style="display: block; margin-top: 10px; font-size: 24rpx; color: #999"
					>(content为空白字符)</text
				>
			</view>
		</view>

		<!-- 选项（单选题、多选题、判断题）- 错题详情和收藏详情页面不显示，笔记详情页面显示但禁用 -->
		<view
			class="question-options"
			v-if="!fromWrong && !fromCollection && question.type !== 'fill' && question.type !== 'short'"
		>
			<view
				v-for="(option, index) in question.options"
				:key="index"
				class="option-item"
				:class="[getOptionClass(option, index), { disabled: isDisabled }]"
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

		<!-- 简答题输入（仅文本）- 错题详情和收藏详情页面不显示，笔记详情页面显示但禁用 -->
		<view class="short-answer-answers" v-if="!fromWrong && !fromCollection && question.type === 'short'">
			<!-- 文本答案输入 -->
			<view class="text-answer-section">
				<textarea
					class="short-answer-textarea"
					v-model="shortAnswerText"
					placeholder="在此输入你的思考 (输入仅供记录,点击下方按钮查看答案自测)"
					:disabled="showReferenceAnswer || (mode === 'exam' && showResult) || isDisabled"
					@input="handleShortAnswerInput"
				/>
			</view>
			<!-- 查看参考答案按钮 -->
			<view class="view-answer-section" v-if="!showReferenceAnswer && !showResult">
				<button class="view-answer-btn" @click="showReferenceAnswer = true">查看参考答案</button>
			</view>
			<!-- 参考答案卡片 -->
			<view class="reference-answer-card" v-if="showReferenceAnswer">
				<view class="reference-answer-header">参考答案：</view>
				<view class="reference-answer-content">{{ formatAnswer(question.correctAnswer) }}</view>
				<!-- 自评按钮 -->
				<view class="self-assessment-buttons">
					<button
						class="assessment-btn correct-btn"
						:class="{ active: userSelfAssessment === 'correct' }"
						@click="handleSelfAssessment('correct')"
					>
						<app-icon name="correct" :size="32" color="#fff" />
						<text>我答对了</text>
					</button>
					<button
						class="assessment-btn wrong-btn"
						:class="{ active: userSelfAssessment === 'wrong' }"
						@click="handleSelfAssessment('wrong')"
					>
						<app-icon name="error" :size="32" color="#fff" />
						<text>我答错了</text>
					</button>
				</view>
			</view>
		</view>

		<!-- 填空题输入框（根据正确答案数量固定）- 错题详情和收藏详情页面不显示，笔记详情页面显示但禁用 -->
		<view class="fill-blank-answers" v-if="!fromWrong && !fromCollection && question.type === 'fill'">
			<view v-for="(blank, index) in fillBlankCount" :key="index" class="fill-blank-item">
				<text class="blank-label">答案{{ index + 1 }}：</text>
				<input
					class="blank-input"
					:class="{ correct: isFillBlankCorrect(index), wrong: isFillBlankWrong(index) }"
					v-model="fillBlankAnswers[index]"
					placeholder="请输入答案"
					:disabled="(mode === 'exam' && showResult) || isDisabled"
					@input="handleFillBlankInput(index, $event)"
				/>
				<view class="blank-icon" v-if="showResult">
					<app-icon v-if="isFillBlankCorrect(index)" name="correct" :size="32" color="#2ecc71" />
					<app-icon v-if="isFillBlankWrong(index)" name="error" :size="32" color="#e74c3c" />
				</view>
			</view>
		</view>

		<!-- 提交按钮和重新答题按钮 - 错题详情和笔记详情页面不显示 -->
		<view
			class="submit-section"
			v-if="!fromWrong && !fromCollection && !fromNotes && showSubmitBtn && !showResult && question.type !== 'short'"
		>
			<button class="submit-btn" @click="handleSubmit">提交并查看结果</button>
		</view>
		<view class="reset-section" v-if="!fromWrong && !fromCollection && !fromNotes && showResult && !showSubmitBtn">
			<button class="reset-btn" @click="handleReset">重新答题</button>
		</view>

		<!-- 解析区（错题详情和收藏详情页面始终显示，其他情况按原逻辑） -->
		<view
			class="question-analysis"
			v-if="fromWrong || fromCollection || fromNotes || showAnalysis || (question.type === 'short' && showReferenceAnswer)"
		>
			<view class="analysis-header">解析</view>
			<view class="analysis-content">
				<view class="analysis-answer">
					<text class="label">正确答案：</text>
					<text class="value">{{ formatAnswer(question.correctAnswer) }}</text>
				</view>
				<view class="analysis-point" v-if="question.point && !fromWrong && !fromCollection && !fromNotes">
					<text class="label">考点：</text>
					<text class="value">{{ question.point }}</text>
				</view>
				<view class="analysis-explanation" v-if="question.explanation">
					<rich-text :nodes="question.explanation"></rich-text>
				</view>
				<view class="analysis-note" v-if="question.userNote && (!fromWrong && !fromCollection || fromNotes)">
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
	fontSize: {
		type: String,
		default: 'medium', // small, medium, large, xlarge
	},
	showSubmitBtn: {
		type: Boolean,
		default: false,
	},
	isDisabled: {
		type: Boolean,
		default: false,
	},
	fromWrong: {
		type: Boolean,
		default: false,
	},
	fromCollection: {
		type: Boolean,
		default: false,
	},
	fromNotes: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['select', 'submit', 'reset', 'self-assess', 'show-settings']);

const handleSubmit = () => {
	emit('submit');
};

const handleReset = () => {
	// 重置简答题状态
	if (props.question.type === 'short') {
		shortAnswerText.value = '';
		showReferenceAnswer.value = false;
		userSelfAssessment.value = null;
	}
	emit('reset', props.question.id);
};

const handleShowSettings = () => {
	emit('show-settings');
};

const questionTypeText = computed(() => {
	const typeMap = {
		single: '单选题',
		multiple: '多选题',
		judge: '判断题',
		fill: '填空题',
		reading: '阅读理解',
		short: '简答题',
	};
	return typeMap[props.question.type] || '单选题';
});

// 检测内容是否包含 HTML 标签（如图片、链接等）
const hasHtmlContent = (content) => {
	if (!content) return false;
	const htmlString = String(content);
	// 检测是否包含常见的 HTML 标签，特别是图片标签
	return /<img|<a|<p|<div|<span|<br|<strong|<em|<ul|<ol|<li|<table|<tr|<td|<th/i.test(htmlString);
};

// 解析 HTML 内容，提取图片和其他内容
const parseHtmlContent = (html) => {
	if (!html) return [];
	const htmlString = String(html);
	const parts = [];
	let lastIndex = 0;
	
	// 匹配所有图片标签（包括自闭合标签）
	const imgRegex = /<img[^>]*\/?>/gi;
	let match;
	
	while ((match = imgRegex.exec(htmlString)) !== null) {
		// 添加图片前的文本内容
		if (match.index > lastIndex) {
			const textBefore = htmlString.substring(lastIndex, match.index);
			if (textBefore.trim()) {
				parts.push({
					type: 'text',
					content: textBefore,
				});
			}
		}
		
		// 提取图片 src（支持单引号、双引号和无引号）
		const imgTag = match[0];
		const srcMatch = imgTag.match(/src\s*=\s*["']([^"']+)["']|src\s*=\s*([^\s>]+)/i);
		const src = srcMatch ? (srcMatch[1] || srcMatch[2]) : '';
		
		if (src) {
			parts.push({
				type: 'image',
				src: src,
			});
		}
		
		lastIndex = match.index + match[0].length;
	}
	
	// 添加最后剩余的文本内容
	if (lastIndex < htmlString.length) {
		const textAfter = htmlString.substring(lastIndex);
		if (textAfter.trim()) {
			parts.push({
				type: 'text',
				content: textAfter,
			});
		}
	}
	
	// 如果没有图片，返回整个内容作为文本
	if (parts.length === 0) {
		parts.push({
			type: 'text',
			content: htmlString,
		});
	}
	
	return parts;
};

// 获取 HTML 中所有图片的 URL
const getImageUrls = (html) => {
	if (!html) return [];
	const htmlString = String(html);
	const urls = [];
	const imgRegex = /<img[^>]*\/?>/gi;
	let match;
	
	while ((match = imgRegex.exec(htmlString)) !== null) {
		const imgTag = match[0];
		// 支持单引号、双引号和无引号
		const srcMatch = imgTag.match(/src\s*=\s*["']([^"']+)["']|src\s*=\s*([^\s>]+)/i);
		if (srcMatch && (srcMatch[1] || srcMatch[2])) {
			urls.push(srcMatch[1] || srcMatch[2]);
		}
	}
	
	return urls;
};

// 预览图片
const previewImage = (current, urls) => {
	if (!urls || urls.length === 0) {
		urls = [current];
	}
	uni.previewImage({
		current: current,
		urls: urls,
		fail: (err) => {
			console.error('预览图片失败:', err);
			uni.showToast({
				title: '图片加载失败',
				icon: 'none',
			});
		},
	});
};

// 去除 HTML 标签，提取纯文本（作为 rich-text 的备用方案）
const stripHtmlTags = (html) => {
	if (!html) return '';
	// 在 uni-app 中，使用正则表达式去除 HTML 标签
	return String(html)
		.replace(/<[^>]+>/g, '') // 去除所有 HTML 标签
		.replace(/&nbsp;/g, ' ') // 替换 &nbsp; 为空格
		.replace(/&lt;/g, '<') // 替换 &lt; 为 <
		.replace(/&gt;/g, '>') // 替换 &gt; 为 >
		.replace(/&amp;/g, '&') // 替换 &amp; 为 &
		.replace(/&quot;/g, '"') // 替换 &quot; 为 "
		.trim();
};

// 简答题答案
const shortAnswerText = ref('');
const showReferenceAnswer = ref(false); // 是否显示参考答案
const userSelfAssessment = ref(null); // 用户自评：'correct' 或 'wrong'

// 填空题答案
const fillBlankAnswers = ref([]);
const fillBlankCount = computed(() => {
	if (props.question.type !== 'fill') return 0;
	// 填空题根据正确答案数量固定，不允许添加更多
	const correctAnswers = Array.isArray(props.question.correctAnswer)
		? props.question.correctAnswer
		: props.question.correctAnswer
		? [props.question.correctAnswer]
		: [];
	// 如果正确答案为空，至少显示1个输入框
	return Math.max(correctAnswers.length, 1);
});

// 初始化简答题答案
watch(
	() => props.selectedAnswers,
	(newVal) => {
		if (props.question.type === 'short') {
			// 如果 newVal 不存在或为空，清空答案
			if (!newVal || (typeof newVal === 'object' && !newVal.type)) {
				shortAnswerText.value = '';
				showReferenceAnswer.value = false;
				userSelfAssessment.value = null;
			} else if (newVal && typeof newVal === 'object' && newVal.type === 'text') {
				shortAnswerText.value = newVal.text || '';
				// 如果已有自评结果，显示参考答案
				if (newVal.selfAssessment) {
					showReferenceAnswer.value = true;
					userSelfAssessment.value = newVal.selfAssessment;
				}
			}
		}
	},
	{ immediate: true }
);

// 监听题目变化，重置状态
watch(
	() => props.question.id,
	() => {
		if (props.question.type === 'short') {
			shortAnswerText.value = '';
			showReferenceAnswer.value = false;
			userSelfAssessment.value = null;
		}
	}
);

// 初始化填空题答案
watch(
	() => props.selectedAnswers,
	(newVal) => {
		if (props.question.type === 'fill') {
			// 如果 newVal 是空数组或不存在，清空所有答案
			if (!newVal || (Array.isArray(newVal) && newVal.length === 0)) {
				fillBlankAnswers.value = [];
			} else {
				fillBlankAnswers.value = Array.isArray(newVal) ? [...newVal] : [newVal];
			}
			// 确保数组长度匹配正确答案数量
			while (fillBlankAnswers.value.length < fillBlankCount.value) {
				fillBlankAnswers.value.push('');
			}
			// 如果用户答案数量超过正确答案数量，截断到正确答案数量
			if (fillBlankAnswers.value.length > fillBlankCount.value) {
				fillBlankAnswers.value = fillBlankAnswers.value.slice(0, fillBlankCount.value);
			}
		}
	},
	{ immediate: true }
);

// 监听 fillBlankCount 变化，动态调整输入框数量
watch(
	() => fillBlankCount.value,
	(newCount) => {
		if (props.question.type === 'fill') {
			// 如果当前答案数量少于正确答案数量，补充空字符串
			while (fillBlankAnswers.value.length < newCount) {
				fillBlankAnswers.value.push('');
			}
			// 如果当前答案数量超过正确答案数量，截断到正确答案数量
			if (fillBlankAnswers.value.length > newCount) {
				fillBlankAnswers.value = fillBlankAnswers.value.slice(0, newCount);
			}
		}
	}
);

// 监听 selectedAnswers 的变化，用于调试
watch(
	() => props.selectedAnswers,
	(newVal, oldVal) => {
		console.log(`[题目${props.question.id}] selectedAnswers 变化:`, {
			旧值: oldVal,
			新值: newVal,
			新值内容: JSON.stringify(newVal),
			题目ID: props.question.id,
			题目类型: props.question.type,
			题目索引: props.questionIndex,
		});
	},
	{ immediate: true, deep: true }
);

const getOptionLabel = (index) => {
	return String.fromCharCode(65 + index); // A, B, C, D...
};

const getOptionClass = (option, index) => {
	const classes = [];
	const optionKey = getOptionLabel(index);

	// 选中状态：确保 selectedAnswers 是数组，并且进行严格的字符串比较
	if (Array.isArray(props.selectedAnswers) && props.selectedAnswers.length > 0) {
		// 将选项key和答案都转换为大写进行比较，确保大小写一致
		const upperOptionKey = optionKey.toUpperCase();
		const isSelected = props.selectedAnswers.some((ans) => {
			if (ans === null || ans === undefined) return false;
			const ansStr = String(ans).toUpperCase().trim();
			const matches = ansStr === upperOptionKey;
			// 详细调试日志：显示每个答案的比较过程（对所有题目都输出）
			console.log(`[题目${props.question.id}] 选项 ${optionKey} 比较:`, {
				选项key: optionKey,
				答案值: ans,
				答案字符串: ansStr,
				选项key大写: upperOptionKey,
				是否匹配: matches,
				selectedAnswers: props.selectedAnswers,
			});
			return matches;
		});
		if (isSelected) {
			classes.push('selected');
			// 调试日志：显示被选中的选项（对所有题目都输出）
			console.log(`[题目${props.question.id}] 选项 ${optionKey} 被标记为选中`, {
				选项key: optionKey,
				selectedAnswers: props.selectedAnswers,
				selectedAnswers内容: JSON.stringify(props.selectedAnswers),
				是否匹配: isSelected,
				题目ID: props.question.id,
				题目类型: props.question.type,
				题目索引: props.questionIndex,
			});
		}
	} else {
		// 调试日志：显示 selectedAnswers 为空或不是数组的情况（对所有题目都输出）
		if (index === 0) {
			console.log(`[题目${props.question.id}] 选项 ${optionKey} selectedAnswers 为空或无效:`, {
				选项key: optionKey,
				selectedAnswers: props.selectedAnswers,
				isArray: Array.isArray(props.selectedAnswers),
				题目ID: props.question.id,
				题目索引: props.questionIndex,
			});
		}
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

	// 检查选项是否是正确答案
	const isCorrectAnswer = correctAnswers.some((ans) => {
		const ansStr = String(ans).toUpperCase();
		return ansStr === optionKey || ansStr === optionKey.toLowerCase();
	});

	// 如果不是正确答案，直接返回 false
	if (!isCorrectAnswer) {
		return false;
	}

	// 判断题特殊处理：答案可能是 "正确"/"错误" 或 "A"/"B"
	if (props.question.type === 'judge') {
		const optionText = (option.content || '').toLowerCase();
		const isCorrectOptionText =
			optionText.includes('正确') || optionText.includes('对') || optionText === 'true' || optionText === '1';
		const isWrongOptionText =
			optionText.includes('错误') || optionText.includes('错') || optionText === 'false' || optionText === '0';

		// 检查正确答案
		for (const ans of correctAnswers) {
			const ansLower = String(ans).toLowerCase();
			// 如果答案是 "正确"、"对"、"true"、"1" 等，且当前选项是正确选项
			if (
				(ansLower.includes('正确') ||
					ansLower.includes('对') ||
					ansLower === 'true' ||
					ansLower === '1' ||
					ansLower === 'a') &&
				isCorrectOptionText
			) {
				// 对于判断题，如果选项是正确答案，还需要检查用户是否选择了它
				if (!Array.isArray(props.selectedAnswers) || props.selectedAnswers.length === 0) {
					return false;
				}
				const isSelected = props.selectedAnswers.some((selectedAns) => {
					if (selectedAns === null || selectedAns === undefined) return false;
					return String(selectedAns).toUpperCase().trim() === optionKey.toUpperCase();
				});
				return isSelected;
			}
			// 如果答案是 "错误"、"错"、"false"、"0" 等，且当前选项是错误选项
			if (
				(ansLower.includes('错误') ||
					ansLower.includes('错') ||
					ansLower === 'false' ||
					ansLower === '0' ||
					ansLower === 'b') &&
				isWrongOptionText
			) {
				// 对于判断题，如果选项是正确答案，还需要检查用户是否选择了它
				if (!Array.isArray(props.selectedAnswers) || props.selectedAnswers.length === 0) {
					return false;
				}
				const isSelected = props.selectedAnswers.some((selectedAns) => {
					if (selectedAns === null || selectedAns === undefined) return false;
					return String(selectedAns).toUpperCase().trim() === optionKey.toUpperCase();
				});
				return isSelected;
			}
			// 如果答案是选项key（A/B）
			if (ansLower === optionKey.toLowerCase()) {
				// 对于判断题，如果选项是正确答案，还需要检查用户是否选择了它
				if (!Array.isArray(props.selectedAnswers) || props.selectedAnswers.length === 0) {
					return false;
				}
				const isSelected = props.selectedAnswers.some((selectedAns) => {
					if (selectedAns === null || selectedAns === undefined) return false;
					return String(selectedAns).toUpperCase().trim() === optionKey.toUpperCase();
				});
				return isSelected;
			}
		}
		return false;
	}

	// 对于多选题，需要同时检查：
	// 1. 选项是否是正确答案（已检查）
	// 2. 用户是否选择了这个选项
	if (props.question.type === 'multiple') {
		if (!Array.isArray(props.selectedAnswers) || props.selectedAnswers.length === 0) {
			return false;
		}
		// 检查用户是否选择了这个选项
		const isSelected = props.selectedAnswers.some((selectedAns) => {
			if (selectedAns === null || selectedAns === undefined) return false;
			return String(selectedAns).toUpperCase().trim() === optionKey.toUpperCase();
		});
		// 只有用户选择了正确答案，才显示 correct
		return isSelected;
	}

	// 对于单选题，如果选项是正确答案，还需要检查用户是否选择了它
	if (props.question.type === 'single') {
		if (!Array.isArray(props.selectedAnswers) || props.selectedAnswers.length === 0) {
			return false;
		}
		const isSelected = props.selectedAnswers.some((selectedAns) => {
			if (selectedAns === null || selectedAns === undefined) return false;
			return String(selectedAns).toUpperCase().trim() === optionKey.toUpperCase();
		});
		return isSelected;
	}

	// 其他类型（如填空题、简答题），保持原有逻辑
	return isCorrectAnswer;
};

const isWrongOption = (option, index) => {
	const optionKey = getOptionLabel(index);
	if (!Array.isArray(props.selectedAnswers)) return false;
	// 将选项key和答案都转换为大写进行比较
	const upperOptionKey = optionKey.toUpperCase();
	const isSelected = props.selectedAnswers.some((ans) => {
		if (ans === null || ans === undefined) return false;
		return String(ans).toUpperCase().trim() === upperOptionKey;
	});
	return isSelected && !isCorrectOption(option, index);
};

// 规范化答案格式
const normalizeAnswer = (answer) => {
	if (!answer) return [];
	if (Array.isArray(answer)) {
		return answer.map((a) => String(a));
	}
	return [String(answer)];
};

// 填空题判断（支持任意个答案，只要用户答案包含所有正确答案即可）
const isFillBlankCorrect = (index) => {
	if (!props.showResult || !props.question.correctAnswer) return false;
	const correctAnswers = normalizeAnswer(props.question.correctAnswer);
	const userAnswer = fillBlankAnswers.value[index] || '';
	// 检查用户答案是否在正确答案列表中（不区分大小写，去除空格）
	const normalizedUser = userAnswer.trim().toLowerCase();
	return correctAnswers.some((correct) => normalizedUser === String(correct).trim().toLowerCase());
};

const isFillBlankWrong = (index) => {
	if (!props.showResult || !props.question.correctAnswer) return false;
	const userAnswer = fillBlankAnswers.value[index] || '';
	return userAnswer.trim() !== '' && !isFillBlankCorrect(index);
};

// 获取题目类型样式类
const getQuestionTypeClass = (type) => {
	const typeMap = {
		single: 'type-single',
		multiple: 'type-multiple',
		judge: 'type-judge',
		fill: 'type-fill',
		reading: 'type-reading',
		short: 'type-short',
	};
	return typeMap[type] || 'type-single';
};

const formatAnswer = (answer) => {
	if (!answer) return '暂无答案';

	const normalized = normalizeAnswer(answer);

	// 判断题特殊处理
	if (props.question.type === 'judge') {
		return normalized
			.map((ans) => {
				const ansLower = String(ans).toLowerCase();
				if (
					ansLower.includes('正确') ||
					ansLower.includes('对') ||
					ansLower === 'true' ||
					ansLower === '1' ||
					ansLower === 'a'
				) {
					return '正确';
				}
				if (
					ansLower.includes('错误') ||
					ansLower.includes('错') ||
					ansLower === 'false' ||
					ansLower === '0' ||
					ansLower === 'b'
				) {
					return '错误';
				}
				return ans;
			})
			.join('、');
	}

	// 简答题
	if (props.question.type === 'short') {
		// 处理数组格式的答案（后端返回的格式）
		if (Array.isArray(answer)) {
			if (answer.length === 0) {
				return '暂无答案';
			}
			// 将数组中的答案用顿号连接
			return answer.filter((ans) => ans !== null && ans !== undefined && String(ans).trim() !== '').join('、');
		}
		// 处理对象格式的答案（用户输入的格式）
		if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
			if (answer.type === 'text') {
				return answer.text || '暂无答案';
			} else if (answer.type === 'image') {
				return `已上传${answer.images?.length || 0}张图片`;
			}
		}
		// 处理字符串格式的答案
		if (typeof answer === 'string' && answer.trim() !== '') {
			return answer.trim();
		}
		return '暂无答案';
	}

	// 填空题
	if (props.question.type === 'fill') {
		return normalized.map((ans, idx) => `答案${idx + 1}：${ans}`).join('；');
	}

	// 其他题型
	return normalized.sort().join('、');
};

const handleOptionClick = (option, index) => {
	if (props.isDisabled) return; // 已提交的题目不允许修改
	if (props.mode === 'exam' && props.showResult) {
		return; // 考试模式已交卷，不允许修改
	}

	const optionKey = getOptionLabel(index);
	emit('select', optionKey);
};

// 简答题文本输入
const handleShortAnswerInput = () => {
	if (props.question.type === 'short') {
		emit('select', {
			type: 'text',
			text: shortAnswerText.value,
			selfAssessment: userSelfAssessment.value,
		});
	}
};

// 处理用户自评
const handleSelfAssessment = async (assessment) => {
	userSelfAssessment.value = assessment;
	// 发送自评结果，触发提交
	emit('self-assess', {
		type: 'text',
		text: shortAnswerText.value,
		selfAssessment: assessment,
	});
};

const handleFillBlankInput = (index, event) => {
	const value = event.detail.value || '';
	fillBlankAnswers.value[index] = value;
	// 发送填空题答案（数组格式，过滤空值）
	const validAnswers = fillBlankAnswers.value.filter((ans) => ans && ans.trim() !== '');
	emit('select', validAnswers);
};
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.question-card {
	padding: $space-4 $space-6;
	background-color: $bg-primary;
	min-height: 100vh;
	font-family: $font-family-base;
	box-sizing: border-box;

	&.night-mode {
		background-color: #1a1a1a;
		color: #e0e0e0;
		
		.question-content,
		.question-content-text,
		.option-content,
		.analysis-content,
		.reference-answer-content,
		.question-number,
		.progress-text {
			color: #e0e0e0;
		}
		
		.question-analysis {
			background-color: #2a2a2a;
		}
		
		.option-item {
			background-color: #2a2a2a;
			border-color: #3a3a3a;
			color: #e0e0e0;
			
			&.selected {
				background-color: rgba(23, 195, 162, 0.2);
				border-color: #17c3a2;
			}
		}
		
		.blank-input {
			background-color: #2a2a2a;
			border-color: #3a3a3a;
			color: #e0e0e0;
		}
		
		.analysis-header {
			color: #e0e0e0;
		}
	}
	
	// 字体大小样式
	&.font-size-small {
		.question-content,
		.question-content-text {
			font-size: 26rpx !important;
		}
		.option-content {
			font-size: 26rpx !important;
		}
		.analysis-content {
			font-size: 24rpx !important;
		}
	}
	
	&.font-size-medium {
		.question-content,
		.question-content-text {
			font-size: 30rpx !important;
		}
		.option-content {
			font-size: 30rpx !important;
		}
		.analysis-content {
			font-size: 28rpx !important;
		}
	}
	
	&.font-size-large {
		.question-content,
		.question-content-text {
			font-size: 34rpx !important;
		}
		.option-content {
			font-size: 34rpx !important;
		}
		.analysis-content {
			font-size: 32rpx !important;
		}
	}
	
	&.font-size-xlarge {
		.question-content,
		.question-content-text {
			font-size: 38rpx !important;
		}
		.option-content {
			font-size: 38rpx !important;
		}
		.analysis-content {
			font-size: 36rpx !important;
		}
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

.question-header-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $space-6;
	padding: $space-4 0;
}

.question-header-bar-simple {
	display: flex;
	align-items: center;
	margin-bottom: $space-6;
	padding: $space-4 0;
}

.question-type-tag {
	padding: $space-2 $space-4;
	border-radius: $radius-md;
	@include text(xs, medium, inverse);
	color: #ffffff;
	background-color: #10b981; // 绿色背景
	display: inline-block;

	&.type-single {
		background-color: #10b981; // 绿色
	}

	&.type-multiple {
		background-color: $color-primary;
	}

	&.type-judge {
		background-color: $color-secondary;
	}

	&.type-fill {
		background-color: $color-warning;
	}

	&.type-reading {
		background-color: $color-error;
	}

	&.type-short {
		background-color: $color-warning-dark;
	}
}

.question-progress-info {
	@include flex(row, flex-start, center, $space-4);
}

.progress-text {
	@include text(sm, normal, primary);
	color: $text-primary;
	font-weight: $font-weight-medium;
}

.settings-icon-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;

	:deep(.app-icon) {
		color: $text-secondary;
	}
}

.night-mode .question-type-tag-inline {
	&.type-single {
		background-color: rgba(23, 195, 162, 0.2);
		color: #17c3a2;
	}

	&.type-multiple {
		background-color: rgba(52, 152, 219, 0.2);
		color: #3498db;
	}

	&.type-judge {
		background-color: rgba(155, 89, 182, 0.2);
		color: #9b59b6;
	}

	&.type-fill {
		background-color: rgba(241, 196, 15, 0.2);
		color: #f1c40f;
	}

	&.type-reading {
		background-color: rgba(231, 76, 60, 0.2);
		color: #e74c3c;
	}

	&.type-short {
		background-color: rgba(230, 126, 34, 0.2);
		color: #e67e22;
	}
}

.question-body {
	margin-bottom: $space-8;
	padding: $space-2 0;
	margin-top: $space-2;

	&.from-detail {
		margin-top: 0;
		padding-top: 0;
	}
}

.question-content-text,
.question-content {
	@include text(md, normal, primary);
	line-height: $line-height-relaxed;
	word-wrap: break-word;
	word-break: break-all;
	min-height: 48rpx;
	font-size: 30rpx; // 默认大小，会被字体大小类覆盖
}

// HTML 内容容器
.question-content-html {
	width: 100%;
	box-sizing: border-box;
}

.html-content-part {
	width: 100%;
	box-sizing: border-box;
	margin-bottom: $space-2;
	
	&:last-child {
		margin-bottom: 0;
	}
}

// 题目中的图片样式
.question-image {
	width: 100%;
	height: auto;
	display: block;
	margin: $space-4 auto;
	border-radius: $radius-md;
	cursor: pointer;
	transition: opacity $transition-fast;
	
	&:active {
		opacity: 0.8;
	}
}

.question-content-text-part {
	@include text(md, normal, primary);
	line-height: $line-height-relaxed;
	word-wrap: break-word;
	word-break: break-all;
	font-size: 30rpx;
}

.question-content-empty {
	@include text(base, normal, tertiary);
	font-style: italic;
	padding: $space-6;
	text-align: center;
}

.question-options {
	margin-bottom: $space-8;
}

.option-item {
	display: flex;
	align-items: center;
	padding: $space-4 $space-5;
	margin-bottom: $space-3;
	border: 2rpx solid $color-neutral-200;
	border-radius: $radius-lg;
	background-color: $bg-primary;
	transition: all $transition-fast;
	min-height: 100rpx;
	cursor: pointer;

	&:active {
		transform: scale(0.99);
		background-color: $color-neutral-50;
	}

	&.selected {
		border-color: $color-primary;
		background-color: rgba($color-primary, 0.05);

		.option-label {
			background-color: $color-primary;
			color: $text-inverse;
		}
	}

	&.correct {
		border-color: $color-success;
		background-color: rgba($color-success, 0.08);

		.option-label {
			background-color: $color-success;
			color: $text-inverse;
		}
	}

	&.wrong {
		border-color: $color-error;
		background-color: rgba($color-error, 0.08);

		.option-label {
			background-color: $color-error;
			color: $text-inverse;
		}
	}

	&.disabled {
		opacity: 0.7;
		pointer-events: none;
	}
}

.option-label {
	width: 56rpx;
	height: 56rpx;
	line-height: 56rpx;
	text-align: center;
	border-radius: $radius-md;
	background-color: $color-neutral-100;
	color: $text-secondary;
	font-weight: $font-weight-semibold;
	font-size: $font-size-base;
	margin-right: $space-4;
	flex-shrink: 0;
	transition: all $transition-fast;
}

.option-content {
	flex: 1;
	font-size: 30rpx;
	line-height: 1.6;
	color: #333;
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

.add-answer-btn {
	margin-top: $spacing-md;
	text-align: center;
}

.add-btn {
	padding: $spacing-sm $spacing-lg;
	background-color: #f0f0f0;
	border: 2rpx dashed $border-color;
	border-radius: $button-radius;
	color: $text-color-secondary;
	font-size: $font-size-sm;

	&:active {
		background-color: #e0e0e0;
	}
}

/* 提交按钮样式 */
.submit-section {
	margin-top: 48rpx;
	margin-bottom: 32rpx;
}

.submit-btn {
	width: 100%;
	padding: 24rpx;
	background-color: #17c3a2;
	color: #fff;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: 500;
	border: none;

	&:active {
		background-color: #15b08f;
	}
}

.reset-section {
	margin-top: 48rpx;
	margin-bottom: 32rpx;
}

.reset-btn {
	width: 100%;
	padding: 24rpx;
	background-color: #f0f0f0;
	color: #666;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: 500;
	border: 2rpx solid #e0e0e0;

	&:active {
		background-color: #e0e0e0;
	}
}

/* 简答题样式 */
.short-answer-answers {
	margin-bottom: $spacing-xl;
}

.text-answer-section {
	width: 100%;
	margin-bottom: 24rpx;
}

.short-answer-textarea {
	width: 100%;
	min-height: 300rpx;
	padding: 24rpx;
	border: 2rpx solid #e5e7eb;
	border-radius: 12rpx;
	font-size: 28rpx;
	line-height: 1.6;
	color: #333;
	background-color: #fff;
	box-sizing: border-box;

	&::placeholder {
		color: #9ca3af;
	}

	&:disabled {
		background-color: #f9fafb;
		color: #6b7280;
	}
}

.view-answer-section {
	margin-top: 24rpx;
}

.view-answer-btn {
	width: 100%;
	height: 88rpx;
	background-color: #3b82f6;
	color: #fff;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: 500;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;

	&:active {
		background-color: #2563eb;
	}
}

.reference-answer-card {
	margin-top: 32rpx;
	padding: 32rpx;
	background-color: #fff;
	border-radius: 12rpx;
	border: 2rpx solid #e5e7eb;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.reference-answer-header {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 16rpx;
}

.reference-answer-content {
	font-size: 28rpx;
	line-height: 1.8;
	color: #4b5563;
	margin-bottom: 24rpx;
	padding: 16rpx;
	background-color: #f9fafb;
	border-radius: 8rpx;
}

.self-assessment-buttons {
	display: flex;
	gap: 16rpx;
	margin-top: 24rpx;
}

.assessment-btn {
	flex: 1;
	height: 80rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	transition: all 0.2s;

	&.correct-btn {
		background-color: #d1fae5;
		color: #065f46;

		&.active {
			background-color: #10b981;
			color: #fff;
		}

		&:active {
			background-color: #059669;
		}
	}

	&.wrong-btn {
		background-color: #fee2e2;
		color: #991b1b;

		&.active {
			background-color: #ef4444;
			color: #fff;
		}

		&:active {
			background-color: #dc2626;
		}
	}

	text {
		font-size: 28rpx;
		font-weight: 500;
	}
}
</style>
