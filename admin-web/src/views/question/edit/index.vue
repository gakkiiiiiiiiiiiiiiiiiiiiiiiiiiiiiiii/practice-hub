<template>
	<div class="question-edit">
		<!-- 返回按钮 -->
		<div class="page-header">
			<a-button type="text" @click="handleCancel" class="back-btn">
				<template #icon><arrow-left-outlined /></template>
				返回
			</a-button>
		</div>

		<a-card :bordered="false" class="edit-card">
			<template #title>
				<div class="card-title">
					<span class="title-text">{{ isEdit ? '编辑题目' : '新增题目' }}</span>
					<a-tag v-if="formState.type" color="blue" class="type-tag">
						{{ getTypeName(formState.type) }}
					</a-tag>
					<a-tag v-if="selectedSubjectId && selectedChapterId" color="green" class="location-tag">
						{{ getSubjectName(selectedSubjectId) }} / {{ getChapterName(selectedChapterId) }}
					</a-tag>
				</div>
			</template>

			<a-form
				ref="formRef"
				:model="formState"
				:rules="rules"
				:label-col="{ span: 4 }"
				:wrapper-col="{ span: 20 }"
				class="question-form"
			>
				<!-- 基本信息 -->
				<a-divider orientation="left" class="section-divider">
					<span class="section-title">基本信息</span>
				</a-divider>

				<a-form-item label="科目" name="subjectId">
					<a-select
						v-model:value="selectedSubjectId"
						placeholder="请选择科目"
						@change="handleSubjectChange"
						:loading="!subjectList.length"
						show-search
						:filter-option="filterOption"
					>
						<a-select-option v-for="subject in subjectList" :key="subject.id" :value="subject.id">
							{{ subject.name }}
						</a-select-option>
					</a-select>
				</a-form-item>

				<a-form-item label="章节" name="chapter_id">
					<a-select
						v-model:value="selectedChapterId"
						placeholder="请先选择科目"
						:disabled="!selectedSubjectId"
						@change="handleChapterChange"
						:loading="selectedSubjectId && !chapterList.length"
						show-search
						:filter-option="filterOption"
					>
						<a-select-option v-for="chapter in chapterList" :key="chapter.id" :value="chapter.id">
							{{ chapter.name }}
						</a-select-option>
					</a-select>
					<div v-if="!selectedSubjectId" class="form-tip">请先选择科目</div>
				</a-form-item>

				<a-form-item label="题型" name="type">
					<a-radio-group v-model:value="formState.type" button-style="solid" class="type-radio-group">
						<a-radio-button :value="1">
							<span class="type-item">单选题</span>
						</a-radio-button>
						<a-radio-button :value="2">
							<span class="type-item">多选题</span>
						</a-radio-button>
						<a-radio-button :value="3">
							<span class="type-item">判断题</span>
						</a-radio-button>
						<a-radio-button :value="4">
							<span class="type-item">填空题</span>
						</a-radio-button>
						<a-radio-button :value="5">
							<span class="type-item">阅读理解</span>
						</a-radio-button>
					</a-radio-group>
				</a-form-item>

				<!-- 题目内容 -->
				<a-divider orientation="left" class="section-divider">
					<span class="section-title">题目内容</span>
				</a-divider>

				<a-form-item label="题干" name="stem">
					<div class="editor-wrapper">
						<WangEditor v-model="formState.stem" placeholder="请输入题干内容" />
						<div class="editor-tip">支持富文本编辑，可插入图片、公式等</div>
					</div>
				</a-form-item>

				<a-form-item v-if="formState.type !== 4" label="选项">
					<div class="options-container">
						<div class="options-header">
							<span class="options-count">共 {{ formState.options.length }} 个选项</span>
						</div>
						<a-alert
							v-if="formState.type === 3"
							message="判断题固定为两个选项：正确/错误"
							type="info"
							show-icon
							:closable="false"
							style="margin-bottom: 16px"
						/>
						<!-- 判断题：固定两个选项（正确/错误） -->
						<template v-if="formState.type === 3">
							<div v-for="(option, index) in formState.options" :key="index" class="option-item option-item-disabled">
								<div style="flex: 1">
									<a-input v-model:value="option.text" :placeholder="index === 0 ? '正确' : '错误'" :disabled="true" />
								</div>
							</div>
						</template>
						<!-- 其他题型：可编辑选项 -->
						<template v-else>
							<div v-for="(option, index) in formState.options" :key="index" class="option-item">
								<div class="option-label">
									{{ getOptionLabel(index) }}
								</div>
								<div style="flex: 1">
									<OptionEditor v-model="option.text" />
								</div>
								<a-popconfirm
									title="确定要删除这个选项吗？"
									@confirm="removeOption(index)"
									:disabled="formState.options.length <= 2"
								>
									<a-button type="link" danger :disabled="formState.options.length <= 2" class="option-delete-btn">
										删除
									</a-button>
								</a-popconfirm>
							</div>
							<a-button
								type="dashed"
								block
								@click="addOption"
								class="add-option-btn"
								:disabled="formState.options.length >= 10"
							>
								<template #icon><plus-outlined /></template>
								添加选项
								<span v-if="formState.options.length >= 10" class="option-limit-tip">（最多10个选项）</span>
							</a-button>
						</template>
					</div>
				</a-form-item>

				<a-form-item label="正确答案" name="answer">
					<!-- 填空题：文本输入 -->
					<a-input
						v-if="formState.type === 4"
						v-model:value="answerInput"
						placeholder="请输入正确答案"
						@change="handleAnswerChange"
						class="answer-input"
					/>
					<!-- 单选题：单选框 -->
					<a-radio-group
						v-else-if="formState.type === 1"
						v-model:value="answerInput"
						@change="handleAnswerChange"
						class="answer-radio-group"
					>
						<a-radio
							v-for="(option, index) in formState.options"
							:key="index"
							:value="getOptionLabel(index)"
							class="answer-radio"
						>
							<span class="answer-label">{{ getOptionLabel(index) }}</span>
						</a-radio>
					</a-radio-group>
					<!-- 判断题：单选框（只显示正确/错误，不显示A/B） -->
					<a-radio-group
						v-else-if="formState.type === 3"
						v-model:value="answerInput"
						@change="handleAnswerChange"
						class="answer-radio-group"
					>
						<a-radio
							v-for="(option, index) in formState.options"
							:key="index"
							:value="getOptionLabel(index)"
							class="answer-radio"
						>
							<span class="answer-label">{{ option.text || (index === 0 ? '正确' : '错误') }}</span>
						</a-radio>
					</a-radio-group>
					<!-- 多选题：多选框 -->
					<a-checkbox-group
						v-else-if="formState.type === 2"
						v-model:value="answerArray"
						@change="handleAnswerArrayChange"
						class="answer-checkbox-group"
					>
						<a-checkbox
							v-for="(option, index) in formState.options"
							:key="index"
							:value="getOptionLabel(index)"
							class="answer-checkbox"
						>
							<span class="answer-label">{{ getOptionLabel(index) }}</span>
						</a-checkbox>
					</a-checkbox-group>
					<!-- 阅读理解：文本输入（暂时） -->
					<a-input
						v-else
						v-model:value="answerInput"
						placeholder="请输入正确答案（如：A 或 A,B）"
						@change="handleAnswerChange"
						class="answer-input"
					/>
					<div v-if="formState.type === 2" class="form-tip">多选题可以选择多个答案</div>
				</a-form-item>

				<!-- 解析说明 -->
				<a-divider orientation="left" class="section-divider">
					<span class="section-title">解析说明</span>
				</a-divider>

				<a-form-item label="解析" name="analysis">
					<div class="editor-wrapper">
						<WangEditor v-model="formState.analysis" placeholder="请输入解析内容（可选）" />
						<div class="editor-tip">详细解析有助于学生理解题目</div>
					</div>
				</a-form-item>

				<a-form-item label="AI解析" name="aiAnalysis">
					<a-textarea
						v-model:value="formState.aiAnalysis"
						:rows="4"
						placeholder="AI生成的解析内容（预留字段）"
						:disabled="true"
						class="ai-analysis-input"
					/>
					<div class="form-tip">此字段由AI自动生成，暂不支持手动编辑</div>
				</a-form-item>
			</a-form>

			<a-divider />

			<div class="footer-toolbar">
				<a-space size="large">
					<a-button size="large" @click="handleCancel">取消</a-button>
					<a-button type="primary" size="large" :loading="loading" @click="handleSubmit">
						<template #icon v-if="!loading">
							<check-outlined />
						</template>
						{{ loading ? '保存中...' : '保存' }}
					</a-button>
				</a-space>
			</div>
		</a-card>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { PlusOutlined, CheckOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue';
import WangEditor from '@/components/WangEditor/index.vue';
import OptionEditor from '@/components/OptionEditor/index.vue';
import { getQuestionDetail, createQuestion, updateQuestion, getSubjectList, getChapterList } from '@/api/question';

const router = useRouter();
const route = useRoute();

const formRef = ref();
const loading = ref(false);
const subjectList = ref([]);
const chapterList = ref([]);

const questionId = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!questionId.value);

const formState = ref({
	chapter_id: undefined,
	type: 1, // 1=单选, 2=多选, 3=判断, 4=填空, 5=阅读理解
	stem: '',
	options: [
		{ label: 'A', text: '' },
		{ label: 'B', text: '' },
	],
	answer: [] as string[],
	analysis: '',
});

// 初始化选项（根据题型）
const initOptions = () => {
	if (formState.value.type === 3) {
		// 判断题：固定为"正确"和"错误"
		formState.value.options = [
			{ label: 'A', text: '正确' },
			{ label: 'B', text: '错误' },
		];
	} else if (formState.value.type !== 4) {
		// 其他题型（非填空题）：至少两个选项
		if (formState.value.options.length < 2) {
			formState.value.options = [
				{ label: 'A', text: '' },
				{ label: 'B', text: '' },
			];
		}
	}
};

// 用于显示和编辑答案的输入框（字符串格式）
const answerInput = ref('');
// 多选题的答案数组
const answerArray = ref<string[]>([]);
// 保存待回显的答案数据
const pendingAnswerData = ref<string[]>([]);

// 科目和章节ID（用于前端选择，提交时需要转换为 chapter_id）
const selectedSubjectId = ref<number | undefined>(undefined);
const selectedChapterId = ref<number | undefined>(undefined);

const rules = {
	chapter_id: [{ required: true, message: '请选择章节', trigger: 'change' }],
	type: [{ required: true, message: '请选择题型', trigger: 'change' }],
	stem: [{ required: true, message: '请输入题干', trigger: 'blur' }],
	answer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }],
};

const fetchSubjects = async () => {
	try {
		const res = await getSubjectList();
		// 后端返回的是数组，不是分页对象
		subjectList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取科目列表失败:', error);
	}
};

const fetchChapters = async (subjectId: number) => {
	try {
		const res = await getChapterList({
			subjectId,
		});
		// 后端返回的是数组，不是分页对象
		chapterList.value = Array.isArray(res.data) ? res.data : res.data.list || [];
	} catch (error) {
		console.error('获取章节列表失败:', error);
		chapterList.value = [];
	}
};

const fetchQuestionDetail = async () => {
	if (!questionId.value) return;

	try {
		const res = await getQuestionDetail(Number(questionId.value));
		const data = res.data;

		console.log('题目详情数据:', data);

		// 先设置题型，这样后续的选项处理才能正确
		if (data.type) {
			formState.value.type = data.type;
		}

		// 后端返回的字段结构：
		// - id, chapter_id, parent_id, type, stem, answer, analysis, difficulty
		// - options: [{label: string, text: string}] (已格式化)
		// - chapter: {id, name}
		// - subject: {id, name} (直接在 result 下，不在 chapter 下)

		// 处理章节和科目信息
		if (data.chapter_id) {
			formState.value.chapter_id = data.chapter_id;
			selectedChapterId.value = data.chapter_id;

			// 从 subject 字段获取科目ID（新接口结构）
			const subjectId = data.subject?.id;
			if (subjectId) {
				selectedSubjectId.value = subjectId;
				// 先加载章节列表，确保下拉框有数据
				await fetchChapters(subjectId);
			}
		}

		// 处理选项数据，确保标签按A、B、C、D顺序
		// 后端已经返回格式化的 options: [{label: string, text: string}]
		let options: any[] = [];
		if (data.type === 3) {
			// 判断题：固定为"正确"和"错误"
			options = [
				{ label: 'A', text: '正确' },
				{ label: 'B', text: '错误' },
			];
		} else if (data.type !== 4 && data.options && Array.isArray(data.options) && data.options.length > 0) {
			// 后端返回的选项已经是正确格式，但需要确保标签按A、B、C、D顺序重新生成
			options = data.options.map((opt: any, index: number) => ({
				label: getOptionLabel(index),
				text: opt.text || opt.content || '',
			}));
		} else if (data.type !== 4) {
			// 如果没有选项且不是填空题，创建默认的两个选项
			options = [
				{ label: 'A', text: '' },
				{ label: 'B', text: '' },
			];
		}

		// 处理答案数据
		let answerData: string[] = [];
		if (Array.isArray(data.answer)) {
			// 填空题不需要转换为大写，其他题型需要
			if (data.type === 4) {
				answerData = data.answer.map((a: any) => String(a).trim());
			} else {
				answerData = data.answer.map((a: any) => String(a).trim().toUpperCase());
			}
		} else if (data.answer) {
			// 如果是字符串，尝试解析
			if (typeof data.answer === 'string') {
				// 填空题不需要转换为大写，其他题型需要
				if (data.type === 4) {
					answerData = data.answer
						.split(',')
						.map((a: string) => a.trim())
						.filter((a: string) => a);
				} else {
					answerData = data.answer
						.split(',')
						.map((a: string) => a.trim().toUpperCase())
						.filter((a: string) => a);
				}
			} else {
				// 填空题不需要转换为大写，其他题型需要
				if (data.type === 4) {
					answerData = [String(data.answer).trim()];
				} else {
					answerData = [String(data.answer).trim().toUpperCase()];
				}
			}
		}

		console.log('原始答案数据:', data.answer);
		console.log('处理后的答案数据:', answerData);
		console.log('选项数据:', options);

		// 更新表单状态（使用 Object.assign 确保响应式更新）
		Object.assign(formState.value, {
			chapter_id: data.chapter_id,
			type: data.type,
			stem: data.stem || '',
			options: options,
			answer: answerData,
			analysis: data.analysis || '',
		});

		// 保存待回显的答案数据
		pendingAnswerData.value = [...answerData];

		// 设置答案的函数
		const setAnswerValue = () => {
			if (pendingAnswerData.value.length === 0) return;

			// 填空题不需要等待选项，直接设置答案
			if (formState.value.type === 4) {
				// 填空题：直接显示文本，保持原样（不转大写）
				answerInput.value = pendingAnswerData.value.join(',') || '';
				pendingAnswerData.value = []; // 清空待回显数据
				console.log('填空题答案已设置:', answerInput.value);
				return;
			}

			// 其他题型需要等待选项渲染完成
			if (formState.value.options.length === 0) {
				console.log('选项还未加载，等待...');
				return;
			}

			// 获取有效的选项标签
			const validLabels = formState.value.options.map((opt: any, index: number) => getOptionLabel(index));
			console.log('有效选项标签:', validLabels);
			console.log('待回显答案数据:', pendingAnswerData.value);

			// 根据题型设置答案显示
			if (formState.value.type === 2) {
				// 多选题：使用数组
				// 确保答案值在选项标签范围内，并转换为大写
				const validAnswers = pendingAnswerData.value
					.map((ans: string) => String(ans).trim().toUpperCase())
					.filter((ans: string) => validLabels.includes(ans));
				console.log('多选题有效答案:', validAnswers);
				if (validAnswers.length > 0) {
					answerArray.value = [...validAnswers]; // 创建新数组确保响应式
					answerInput.value = validAnswers.join(',');
					pendingAnswerData.value = []; // 清空待回显数据
				}
			} else {
				// 单选题、判断题：显示第一个答案
				// 确保答案值在选项标签范围内，并转换为大写
				const firstAnswer = pendingAnswerData.value[0] ? String(pendingAnswerData.value[0]).trim().toUpperCase() : '';
				console.log('单选题/判断题答案:', firstAnswer);
				console.log('是否在有效标签中:', validLabels.includes(firstAnswer));
				if (validLabels.includes(firstAnswer)) {
					answerInput.value = firstAnswer;
					pendingAnswerData.value = []; // 清空待回显数据
				}
			}

			console.log('最终答案输入值:', answerInput.value);
			console.log('最终答案数组值:', answerArray.value);
		};

		// 填空题直接设置答案，不需要等待选项渲染
		if (formState.value.type === 4) {
			setAnswerValue();
		} else {
			// 其他题型需要等待选项渲染完成
			await nextTick();
			setAnswerValue();

			// 再等待一次，确保选项完全渲染（如果第一次设置失败）
			await nextTick();
			setAnswerValue();
		}
	} catch (error) {
		console.error('获取题目详情失败:', error);
		message.error('获取题目详情失败');
	}
};

const handleSubjectChange = async (subjectId: number) => {
	selectedChapterId.value = undefined;
	formState.value.chapter_id = undefined;
	if (subjectId) {
		await fetchChapters(subjectId);
	}
};

const handleChapterChange = (chapterId: number) => {
	formState.value.chapter_id = chapterId;
};

const handleAnswerChange = (e: any) => {
	let value = '';
	if (e && e.target) {
		// 输入框的 change 事件
		value = e.target.value || '';
	} else {
		// 单选框的 change 事件，直接是值
		value = e || '';
	}

	// 将字符串转换为数组
	if (formState.value.type === 4) {
		// 填空题：答案可以是任意文本
		formState.value.answer = value ? [value] : [];
	} else {
		// 单选题、判断题：单个答案
		formState.value.answer = value ? [value] : [];
	}
};

// 多选题答案变化处理
const handleAnswerArrayChange = (values: string[]) => {
	answerArray.value = values;
	formState.value.answer = values;
	// 同步到 answerInput（用于显示）
	answerInput.value = values.join(',');
};

// 获取题型名称
const getTypeName = (type: number): string => {
	const typeMap: Record<number, string> = {
		1: '单选题',
		2: '多选题',
		3: '判断题',
		4: '填空题',
		5: '阅读理解',
	};
	return typeMap[type] || '未知';
};

// 获取科目名称
const getSubjectName = (subjectId: number): string => {
	const subject = subjectList.value.find((s: any) => s.id === subjectId);
	return subject?.name || '';
};

// 获取章节名称
const getChapterName = (chapterId: number): string => {
	const chapter = chapterList.value.find((c: any) => c.id === chapterId);
	return chapter?.name || '';
};

// 搜索过滤函数
const filterOption = (input: string, option: any) => {
	return option.children[0].children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 获取选项标签（A、B、C、D...）
const getOptionLabel = (index: number): string => {
	const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
	return labels[index] || String.fromCharCode(65 + index); // 如果超过J，使用ASCII码继续
};

// 重新生成所有选项的标签（确保按A、B、C、D顺序）
const regenerateOptionLabels = () => {
	formState.value.options.forEach((option: any, index: number) => {
		option.label = getOptionLabel(index);
	});
};

const addOption = () => {
	// 判断题不允许添加选项
	if (formState.value.type === 3) {
		return;
	}

	const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
	if (formState.value.options.length < labels.length) {
		const nextLabel = labels[formState.value.options.length];
		formState.value.options.push({ label: nextLabel, text: '' });
	} else {
		// 如果超过J，使用ASCII码继续生成
		const nextLabel = String.fromCharCode(65 + formState.value.options.length);
		formState.value.options.push({ label: nextLabel, text: '' });
	}
};

const removeOption = (index: number) => {
	// 判断题不允许删除选项
	if (formState.value.type === 3) {
		return;
	}

	formState.value.options.splice(index, 1);
	// 删除后重新生成标签，确保顺序正确
	regenerateOptionLabels();
};

const handleCancel = () => {
	router.back();
};

const handleSubmit = async () => {
	try {
		await formRef.value?.validate();

		// 手动验证选项
		if (formState.value.type !== 4) {
			if (!formState.value.options || formState.value.options.length < 2) {
				message.error('至少需要2个选项');
				return;
			}
			// 检查选项内容是否为空
			const hasEmptyOption = formState.value.options.some((opt: any) => !opt.text || opt.text.trim() === '');
			if (hasEmptyOption) {
				message.error('选项内容不能为空');
				return;
			}
		}

		// 验证答案
		if (!formState.value.answer || formState.value.answer.length === 0) {
			message.error('请选择正确答案');
			return;
		}

		// 验证答案是否在选项范围内（非填空题）
		if (formState.value.type !== 4) {
			const validLabels = formState.value.options.map((opt: any, index: number) => getOptionLabel(index));
			const invalidAnswers = formState.value.answer.filter((ans: string) => !validLabels.includes(ans));
			if (invalidAnswers.length > 0) {
				message.error(`答案 ${invalidAnswers.join(',')} 不在选项范围内`);
				return;
			}
		}

		loading.value = true;

		// 构建符合后端 DTO 的数据
		const data: any = {
			chapter_id: formState.value.chapter_id,
			type: formState.value.type,
			stem: formState.value.stem,
			answer: formState.value.answer,
		};

		// 选项：填空题不需要选项
		if (formState.value.type !== 4) {
			// 确保标签是按A、B、C、D顺序生成的
			regenerateOptionLabels();
			// 将选项中的 content 字段转换为 text 字段
			data.options = formState.value.options.map((opt: any) => ({
				label: opt.label,
				text: opt.text || opt.content || '',
			}));
		}

		// 解析（可选）
		if (formState.value.analysis) {
			data.analysis = formState.value.analysis;
		}

		if (isEdit.value) {
			await updateQuestion(Number(questionId.value), data);
			message.success('更新成功');
		} else {
			await createQuestion(data);
			message.success('创建成功');
		}

		router.push('/question/list');
	} catch (error: any) {
		if (error?.errorFields) {
			return;
		}
		message.error(error?.message || '操作失败');
	} finally {
		loading.value = false;
	}
};

// 监听选项变化，如果有待回显的答案，则设置答案
watch(
	() => formState.value.options,
	() => {
		if (pendingAnswerData.value.length > 0) {
			nextTick(() => {
				if (formState.value.type === 2) {
					// 多选题：需要转换为大写
					const validLabels = formState.value.options.map((opt: any, index: number) => getOptionLabel(index));
					const validAnswers = pendingAnswerData.value
						.map((ans: string) => String(ans).trim().toUpperCase())
						.filter((ans: string) => validLabels.includes(ans));
					if (validAnswers.length > 0) {
						answerArray.value = [...validAnswers];
						answerInput.value = validAnswers.join(',');
						pendingAnswerData.value = [];
					}
				} else if (formState.value.type === 4) {
					// 填空题：不需要转换为大写，保持原样
					answerInput.value = pendingAnswerData.value.join(',') || '';
					pendingAnswerData.value = [];
				} else if (formState.value.options.length > 0) {
					// 单选题、判断题：需要转换为大写
					const validLabels = formState.value.options.map((opt: any, index: number) => getOptionLabel(index));
					const firstAnswer = pendingAnswerData.value[0] ? String(pendingAnswerData.value[0]).trim().toUpperCase() : '';
					if (validLabels.includes(firstAnswer)) {
						answerInput.value = firstAnswer;
						pendingAnswerData.value = [];
					}
				}
			});
		}
	},
	{ deep: true }
);

// 监听题型变化，重置答案
watch(
	() => formState.value.type,
	(newType) => {
		// 切换题型时，清空答案
		formState.value.answer = [];
		answerInput.value = '';
		answerArray.value = [];
		pendingAnswerData.value = [];

		// 如果是填空题，不需要选项
		if (newType === 4) {
			// 填空题不需要选项
		} else if (newType === 3) {
			// 判断题：固定两个选项（正确/错误）
			formState.value.options = [
				{ label: 'A', text: '正确' },
				{ label: 'B', text: '错误' },
			];
		} else if (newType === 1 || newType === 2) {
			// 单选题、多选题：确保至少有两个选项
			if (formState.value.options.length < 2) {
				formState.value.options = [
					{ label: 'A', text: '' },
					{ label: 'B', text: '' },
				];
			}
		}
	}
);

onMounted(async () => {
	await fetchSubjects();
	// 初始化选项
	initOptions();
	if (isEdit.value) {
		await fetchQuestionDetail();
	}
});
</script>

<style scoped lang="scss">
.question-edit {
	padding: 24px;
	background: #f5f5f5;
	min-height: calc(100vh - 64px);

	.page-header {
		margin-bottom: 16px;

		.back-btn {
			padding: 0;
			height: auto;
			font-size: 14px;
			color: #1890ff;
			display: inline-flex;
			align-items: center;
			gap: 4px;
			transition: all 0.3s;

			&:hover {
				color: #40a9ff;
				transform: translateX(-2px);
			}
		}
	}

	.edit-card {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		overflow: hidden;

		:deep(.ant-card-head) {
			border-bottom: 1px solid #f0f0f0;
			padding: 16px 24px;
		}

		:deep(.ant-card-body) {
			padding: 24px;
		}
	}

	.card-title {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;

		.title-text {
			font-size: 18px;
			font-weight: 600;
			color: #262626;
		}

		.type-tag {
			font-size: 13px;
		}

		.location-tag {
			font-size: 12px;
			margin-left: 8px;
		}
	}

	.section-divider {
		margin: 32px 0 24px;
		border-color: #e8e8e8;

		.section-title {
			font-size: 14px;
			font-weight: 600;
			color: #595959;
			padding: 0 8px;
		}
	}

	.question-form {
		:deep(.ant-form-item) {
			margin-bottom: 24px;
		}

		:deep(.ant-form-item-label) {
			font-weight: 500;
		}
	}

	.type-radio-group {
		width: 100%;

		:deep(.ant-radio-button-wrapper) {
			flex: 1;
			text-align: center;
			border-radius: 4px;
			margin-right: 8px;
			transition: all 0.3s;

			&:last-child {
				margin-right: 0;
			}

			&:hover {
				transform: translateY(-2px);
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			}
		}

		.type-item {
			display: inline-block;
			padding: 4px 0;
		}
	}

	.form-tip {
		margin-top: 8px;
		font-size: 12px;
		color: #999;
	}

	.options-container {
		width: 100%;
		background: #fafafa;
		padding: 16px;
		border-radius: 6px;
		border: 1px solid #e8e8e8;

		.options-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16px;
			padding-bottom: 12px;
			border-bottom: 1px solid #e8e8e8;

			.options-count {
				font-size: 13px;
				color: #8c8c8c;
				font-weight: 500;
			}
		}
	}

	.option-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 16px;
		padding: 12px;
		background: #fff;
		border-radius: 6px;
		border: 1px solid #e8e8e8;
		transition: all 0.3s;

		&:hover {
			border-color: #1890ff;
			box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
		}

		&:last-child {
			margin-bottom: 0;
		}

		&.option-item-disabled {
			background: #f5f5f5;
			border-color: #d9d9d9;

			&:hover {
				border-color: #d9d9d9;
				box-shadow: none;
			}
		}

		.option-label {
			width: 48px;
			height: 48px;
			line-height: 48px;
			text-align: center;
			font-weight: 600;
			font-size: 16px;
			color: #1890ff;
			background: #e6f7ff;
			border-radius: 6px;
			margin-right: 16px;
			flex-shrink: 0;
			border: 2px solid #91d5ff;
		}

		.option-delete-btn {
			margin-left: 12px;
			flex-shrink: 0;
		}
	}

	.add-option-btn {
		margin-top: 16px;
		height: 40px;
		border-style: dashed;
		border-color: #1890ff;
		color: #1890ff;
		transition: all 0.3s;

		&:hover {
			border-color: #40a9ff;
			color: #40a9ff;
			transform: translateY(-2px);
			box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
		}

		&:disabled {
			border-color: #d9d9d9;
			color: #bfbfbf;
		}

		.option-limit-tip {
			margin-left: 8px;
			font-size: 12px;
			color: #999;
		}
	}

	.answer-radio-group,
	.answer-checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		padding: 16px;
		background: #fafafa;
		border-radius: 6px;
		border: 1px solid #e8e8e8;
	}

	.answer-radio,
	.answer-checkbox {
		margin: 0 !important;
		padding: 8px 16px;
		background: #fff;
		border-radius: 6px;
		border: 2px solid #e8e8e8;
		transition: all 0.3s;

		&:hover {
			border-color: #1890ff;
			transform: translateY(-2px);
			box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
		}

		&.ant-radio-checked,
		&.ant-checkbox-checked {
			border-color: #1890ff;
			background: #e6f7ff;
		}

		.answer-label {
			font-weight: 600;
			font-size: 16px;
			color: #1890ff;
		}
	}

	.answer-input {
		width: 100%;
	}

	.editor-wrapper {
		width: 100%;

		.editor-tip {
			margin-top: 8px;
			font-size: 12px;
			color: #8c8c8c;
			display: flex;
			align-items: center;
			gap: 4px;

			&::before {
				content: '💡';
				font-size: 14px;
			}
		}
	}

	.ai-analysis-input {
		background: #f5f5f5;
	}

	.footer-toolbar {
		display: flex;
		justify-content: flex-end;
		padding: 24px 0 0;
		border-top: 1px solid #f0f0f0;
		margin-top: 24px;
	}
}

// 响应式设计
@media (max-width: 768px) {
	.question-edit {
		padding: 16px;

		.question-form {
			:deep(.ant-form-item-label) {
				padding-bottom: 8px;
			}
		}

		.type-radio-group {
			:deep(.ant-radio-button-wrapper) {
				font-size: 12px;
				padding: 4px 8px;
			}
		}

		.option-item {
			flex-direction: column;
			align-items: stretch;

			.option-label {
				width: 100%;
				height: 36px;
				line-height: 36px;
				margin-right: 0;
				margin-bottom: 12px;
			}
		}
	}
}
</style>
