/**
 * API 服务封装
 * 统一管理所有接口调用
 */
import { get, post, put, del } from '@/utils/request';
import { getApiPrefix } from '@/utils/api-base';

const buildUploadUrl = (path) => {
	const prefix = getApiPrefix().replace(/\/+$/, '');
	const apiPath = `/${String(path || '').replace(/^\/+/, '').replace(/^api\/+/, '')}`;
	return `${prefix}${apiPath}`;
};

const getFileNameFromPathForUpload = (filePath, fallback = 'avatar.jpg') => {
	const name =
		String(filePath || '')
			.split(/[/\\]/)
			.pop()
			?.split('?')[0] || fallback;
	return /\.(jpe?g|png|gif|webp)$/i.test(name) ? name : fallback;
};

/**
 * 小程序图片上传：使用微信云存储直传。
 * 这条链路不使用 uni.uploadFile，因此不依赖 uploadFile 合法域名配置。
 */
const uploadImageMpCloudStorage = (filePath) =>
	new Promise((resolve, reject) => {
		if (typeof wx === 'undefined' || !wx.cloud?.uploadFile) {
			reject(new Error('微信云存储不可用，请稍后重试'));
			return;
		}
		const fileName = getFileNameFromPathForUpload(filePath);
		const ext = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)?.[0] || '.jpg';
		const user = uni.getStorageSync('user_info') || {};
		const userId = user?.id || user?.userId || 'user';
		const cloudPath = `avatars/${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
		wx.cloud.uploadFile({
			cloudPath,
			filePath,
			success: (res) => {
				if (!res?.fileID) {
					reject(new Error('云存储未返回文件ID'));
					return;
				}
				resolve({
					url: res.fileID,
					imageUrl: res.fileID,
					fileID: res.fileID,
					cloudPath,
				});
			},
			fail: (err) => {
				console.error('云存储上传失败:', err);
				reject(new Error(err.errMsg || err.message || '头像上传失败'));
			},
		});
	});

/** H5 / App 等：经业务服务端 multipart 上传 */
const uploadImageViaServer = (filePath) => {
	return new Promise((resolve, reject) => {
		let url = '';
		try {
			url = buildUploadUrl('/app/upload/image');
		} catch (error) {
			reject(error);
			return;
		}

		const token = uni.getStorageSync('auth_token') || '';
		const uploadHeaders = {
			Authorization: `Bearer ${token}`,
		};

		uni.uploadFile({
			url,
			filePath,
			name: 'file',
			header: uploadHeaders,
			success: (res) => {
				try {
					const raw = res.data;
					const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
					const code = data.code ?? data.statusCode;
					if (code === 200 || code === 0 || code === 201) {
						resolve(data.data || data);
						return;
					}
					reject(new Error(data.message || data.msg || '上传失败'));
				} catch (error) {
					console.error('解析上传响应失败:', error, res.data);
					reject(new Error('解析响应失败'));
				}
			},
			fail: (err) => {
				console.error('经服务端上传失败:', err);
				reject(new Error(err.errMsg || '上传失败'));
			},
		});
	});
};

// ==================== 分销相关 ====================
/**
 * 申请成为分销用户
 */
export const applyDistributor = () => {
	return post('/app/distributor/apply');
};

/**
 * 获取分销用户信息
 */
export const getDistributorInfo = () => {
	return get('/app/distributor/info');
};

/**
 * 生成专属小程序二维码
 */
export const generateQRCode = (params = {}) => {
	return get('/app/distributor/qr-code', params);
};

/**
 * 获取分销统计数据
 */
export const getDistributorStats = () => {
	return get('/app/distributor/stats');
};

/**
 * 绑定上级分销商
 * @param {string} distributorCode - 分销商编号
 */
export const bindDistributionRelation = (distributorCode) => {
	return post('/app/distributor/bind', { distributor_code: distributorCode });
};

/**
 * 购买激活码（分销商）
 * @param {Object} data - { course_id: number, count: number }
 */
export const buyActivationCodes = (data) => {
	return post('/app/distributor/buy-codes', data);
};

/**
 * 小程序管理员生成激活码
 * @param {Object} data - { course_id: number, count: number }
 */
export const generateAdminActivationCodes = (data) => {
	return post('/app/distributor/admin/generate-codes', data);
};

/**
 * 禁用已激活激活码，并撤销对应课程权限
 * @param {number} id 激活码ID
 */
export const invalidateActivationCode = (id) => {
	return post(`/app/distributor/codes/${id}/invalidate`);
};

/**
 * 小程序超管录入纸质真题发货信息
 */
export const shipPaperExamOrder = (orderId, data) => {
	return post(`/app/order/${orderId}/ship`, data);
};

/**
 * 查询纸质真题订单物流信息
 */
export const queryOrderLogistics = (orderId) => {
	return get(`/app/order/${orderId}/logistics`);
};

/**
 * 获取分销商购买的激活码列表
 * @param {Object} params - { page?: number, pageSize?: number, batch_id?: string, status?: number }
 */
export const getDistributorCodes = (params = {}) => {
	return get('/app/distributor/codes', params);
};

// ==================== 反馈相关 ====================
/**
 * 创建反馈
 * @param {Object} data - { type: 'bug'|'style'|'feature', description: string, images?: string[] }
 */
export const createFeedback = (data) => {
	return post('/app/feedback', data);
};

/**
 * 获取我的反馈列表
 * @param {Object} params - { page?: number, pageSize?: number }
 */
export const getMyFeedbackList = (params) => {
	return get('/app/feedback', params);
};

/**
 * 获取反馈详情
 * @param {number} id - 反馈ID
 */
export const getFeedbackDetail = (id) => {
	return get(`/app/feedback/${id}`);
};

// ==================== 认证相关 ====================
/**
 * 小程序端 - 微信一键登录
 * @param {Object} data - { code: string, distributor_code?: string }
 */
export const appLogin = (data) => {
	return post('/auth/app/login', data);
};

/**
 * 小程序端 - 手机号快捷登录
 * @param {Object} data - { loginCode: string, phoneCode: string, distributor_code?: string, nickname?: string }
 */
export const appPhoneLogin = (data) => {
	return post('/auth/app/phone-login', data);
};

/**
 * 小程序端 - 账号注册
 * @param {Object} data - { username, password, nickname?, device_id, device_name?, platform? }
 */
export const appRegister = (data) => {
	return post('/auth/app/register', data);
};

/**
 * 小程序端 - 账号密码登录
 * @param {Object} data - { username, password, device_id, device_name?, platform? }
 */
export const appPasswordLogin = (data) => {
	return post('/auth/app/password-login', data);
};

/**
 * 小程序端 - 退出登录
 */
export const appLogout = () => {
	return post('/auth/app/logout', {});
};

// ==================== 用户相关 ====================
/**
 * 获取个人信息
 */
export const getUserInfo = () => {
	return get('/app/user/info');
};

/**
 * 获取今日打卡状态
 */
export const getTodayCheckinStatus = () => {
	return get('/app/user/checkin/status');
};

/**
 * 获取打卡所需时间（分钟）
 */
export const getCheckinMinutes = () => {
	return get('/app/user/checkin/minutes');
};

/**
 * 打卡
 * @param {Object} data - { studyDuration: number, questionCount: number }
 */
export const checkin = (data) => {
	return post('/app/user/checkin', data);
};

/**
 * 获取打卡记录列表
 * @param {Object} params - { page?: number, pageSize?: number }
 */
export const getCheckinList = (params = {}) => {
	return get('/app/user/checkin/list', params);
};

/**
 * 更新个人信息
 * @param {Object} data - { nickname?: string, avatar?: string }
 */
export const updateUserProfile = (data) => {
	return put('/app/user/profile', data);
};

/**
 * 绑定手机号
 * @param {Object} data - { phone: string, code: string }
 */
export const bindPhone = (data) => {
	return post('/app/user/bind_phone', data);
};

/**
 * 上传图片
 * @param {string} filePath - 图片本地路径
 * @returns {Promise<{url: string}>}
 */
export const uploadImage = (filePath) => {
	// #ifdef MP-WEIXIN
	return uploadImageMpCloudStorage(filePath);
	// #endif
	// #ifndef MP-WEIXIN
	return uploadImageViaServer(filePath);
	// #endif
};

/**
 * 小程序超管获取课程文件云存储路径
 * @param {string} fileName - 原始文件名
 */
export const getAppCourseFileCloudPath = (fileName) => {
	return post('/app/upload/course-file-cloud-path', { fileName });
};

/**
 * 小程序超管创建文件类课程
 * @param {Object} data - 文件课程信息
 */
export const createAppFileCourse = (data) => {
	return post('/app/course-admin/file-course', data);
};

// ==================== 首页相关 ====================
/**
 * 获取首页配置
 * @returns {Promise<Object>} 返回倒计时日期、Banner 列表等配置
 * @example
 * {
 *   countdown_date: '2024-12-23',
 *   banners: [
 *     { id: 1, image: '...', link: '...' }
 *   ]
 * }
 */
export const getHomeConfig = () => {
	return get('/app/home/config');
};

/** 获取小程序最低版本要求 */
export const getMiniappVersion = () => {
	return get('/app/home/version');
};

/**
 * 获取每日励志语录
 * @returns {Promise<Object>} 返回每日励志语录
 * @example
 * {
 *   quote: '宝剑锋从磨砺出，梅花香自苦寒来。'
 * }
 */
export const getDailyQuote = () => {
	return get('/app/home/quote');
};

export const getFaqList = () => {
	return get('/app/home/faqs');
};

/**
 * 获取推荐版块列表（包含题库详情）
 * @returns {Promise<Array>} 返回基于课程分类的层级结构
 * @example
 * [
 *   {
 *     name: '考研政治',
 *     subCategories: [
 *       {
 *         name: '真题',
 *         courses: [
 *           { id: 1, name: '2024年政治真题', cover_img: '...', price: 99.99, ... }
 *         ]
 *       },
 *       {
 *         name: '模拟题',
 *         courses: [...]
 *       }
 *     ]
 *   },
 *   {
 *     name: '考研英语',
 *     subCategories: [...]
 *   }
 * ]
 */
export const getRecommendCategories = (params = {}) => {
	return get('/app/recommend/categories', params);
};

// ==================== 课程相关 ====================
/**
 * 获取所有课程列表
 * @param {Object} params - { keyword?: string, category?: string, subCategory?: string, sortBy?: string }
 */
export const getAllCourses = (params = {}) => {
	return get('/app/courses', params);
};

export const getCourseTypes = () => {
	return get('/app/course-types');
};

/**
 * 获取课程详情
 * @param {number} id - 课程ID
 */
export const getCourseDetail = (id) => {
	return get(`/app/courses/${id}/detail`);
};

/**
 * 获取课程 PDF 内嵌预览凭证（用于图片预览）
 * @param {number} courseId - 课程ID
 * @returns {Promise<{ ticket: string, viewerUrl: string }>}
 */
export const getCoursePreviewTicket = (courseId, fileId) => {
	const query = fileId ? `?fileId=${encodeURIComponent(fileId)}` : '';
	return post(`/app/courses/${courseId}/preview-ticket${query}`, {});
};

/**
 * 获取课程文档预览地址（用于 doc/docx 等非 PDF 文件的小程序内预览）
 * @param {number} courseId - 课程ID
 * @param {string} [ticket] - 预览凭证
 * @returns {Promise<{ url: string, fileType: string, fileName: string }>}
 */
export const getCourseDocumentPreviewUrl = (courseId, ticket, fileId) => {
	const params = {};
	if (ticket) params.ticket = ticket;
	if (fileId) params.fileId = fileId;
	return get(`/app/courses/${courseId}/document-preview-url`, params);
};

/**
 * 获取课程文件预览页数（图片预览用）
 * @param {number} courseId - 课程ID
 * @param {string} [ticket] - 预览凭证
 * @returns {Promise<{ totalPages: number, cacheVersion: string }>}
 */
export const getCoursePreviewPagesInfo = (courseId, ticket, fileId) => {
	const params = {};
	if (ticket) params.ticket = ticket;
	if (fileId) params.fileId = fileId;
	return get(`/app/courses/${courseId}/preview-pages-info`, params);
};

/**
 * 获取文件课程阅读进度
 * @param {number} courseId - 课程ID
 */
export const getFileCourseReadingProgress = (courseId, fileId) => {
	const params = fileId ? { fileId } : {};
	return get(`/app/courses/${courseId}/file-reading-progress`, params);
};

/**
 * 上报文件课程阅读进度
 * @param {number} courseId - 课程ID
 * @param {Object} data - { currentPage: number, totalPages: number, durationSeconds: number }
 */
export const reportFileCourseReadingProgress = (courseId, data) => {
	const payload = { ...data };
	if (data?.fileId != null) {
		payload.fileId = data.fileId;
	}
	return post(`/app/courses/${courseId}/file-reading-progress`, payload);
};

/**
 * 获取课程相关推荐
 * @param {number} courseId - 课程ID（可选）
 * @returns {Promise<Array>} 返回推荐的课程列表
 */
export const getCourseRecommendations = (courseId) => {
	const params = courseId ? { courseId } : {};
	return get('/app/courses/recommendations', params);
};

/**
 * 获取课程分类树（包含课程列表）
 * @returns {Promise<Array>} 返回分类树结构，包含每个二级分类下的课程列表
 */
export const getCourseCategories = () => {
	return get('/app/courses/categories');
};

// ==================== 题库相关（兼容旧接口，已废弃） ====================
/**
 * @deprecated 请使用 getAllCourses
 * 获取所有题库列表
 */
export const getAllSubjects = () => {
	return getAllCourses();
};

/**
 * @deprecated 请使用 getCourseDetail
 * 获取题库详情
 * @param {number} id - 题库ID
 */
export const getSubjectDetail = (id) => {
	return getCourseDetail(id);
};

// ==================== 题目相关 ====================
/**
 * 获取课程下的题目列表（用于随机练习和模拟考试）
 * @param {number} id - 课程ID
 * @param {Object} params - 查询参数
 * @param {number} params.count - 需要返回的题目数量（可选，用于模拟考试）
 * @param {boolean} params.random - 是否随机排序（可选，默认false）
 */
export const getCourseQuestions = (id, params = {}) => {
	return get(`/app/questions/courses/${id}/questions`, params);
};

/**
 * 获取章节下的题目列表
 * @param {number} id - 章节ID
 */
export const getChapterQuestions = (id) => {
	return get(`/app/questions/chapters/${id}/questions`);
};

/**
 * 获取单题详情
 * @param {number} id - 题目ID
 */
export const getQuestionDetail = (id) => {
	return get(`/app/questions/${id}`);
};

/**
 * 获取用户答题记录
 * @param {Object} params - 查询参数
 * @param {number} params.chapterId - 章节ID（可选）
 * @param {number[]} params.questionIds - 题目ID列表（可选）
 */
export const getAnswerRecords = (params = {}) => {
	// 直接传递查询参数对象，而不是包装在 { params: {...} } 中
	return get('/app/questions/answer-records', params);
};

/**
 * 提交答案
 * @param {Object} data - { questionId: number, answer: string | string[] }
 */
export const submitAnswer = (data) => {
	return post('/app/questions/submit', data);
};

/**
 * 批量提交（试卷模式）
 * @param {Object} data - { answers: Array<{ questionId: number, answer: string | string[] }> }
 */
export const batchSubmit = (data) => {
	return post('/app/questions/batch_submit', data);
};

// ==================== 订单相关 ====================
/**
 * 创建预支付订单
 * @param {Object} data - { course_id: number }
 */
export const createOrder = (data) => {
	return post('/app/order/create', data, { timeout: 30000 });
};

/**
 * 购物车合单下单
 * @param {Object} data - { course_ids: number[], coupon_id?: number }
 */
export const createCartOrder = (data) => {
	return post('/app/order/create-cart', data, { timeout: 30000 });
};

/**
 * 确认微信虚拟支付完成
 * @param {Object} data - { order_no: string }
 */
export const confirmWechatPayment = (data) => {
	return post('/app/order/pay/confirm', data);
};

// ==================== 营销 / 拉新 ====================
export const getReferralConfig = () => get('/app/marketing/referral/config');

export const getReferralStats = () => get('/app/marketing/referral/stats');

export const getMyCoupons = (params) => get('/app/marketing/coupons', params);

// ==================== 套餐 ====================
export const getPackageSections = () => get('/app/package/sections');

export const getPackageSectionDetail = (id) => get(`/app/package/sections/${id}`);

export const getMyPackageSubscriptions = () => get('/app/package/subscriptions');

// ==================== 激活码相关 ====================
/**
 * 预览激活码对应课程
 * @param {Object} data - { code: string }
 */
export const previewRedeemCode = (data) => {
	return post('/app/code/preview', data);
};

/**
 * 使用激活码
 * @param {Object} data - { code: string }
 */
export const redeemCode = (data) => {
	return post('/app/code/redeem', data);
};

// ==================== 订单相关 ====================
/**
 * 获取订单统计数量
 * @returns {Promise<Object>} 返回订单统计 { pending: number, paid: number, after_sale: number }
 */
export const getOrderCounts = () => {
	return get('/app/order/counts');
};

// ==================== 积分相关 ====================
export const getPointsConfig = () => get('/app/marketing/points/config');
export const getPointsBalance = () => get('/app/marketing/points/balance');
export const getPointsLogs = (params) => get('/app/marketing/points/logs', params);
export const exchangePointsCoupon = (data = {}) => post('/app/marketing/points/exchange', data);

// ==================== 售后相关 ====================
/**
 * 创建售后申请
 * @param {Object} data - { order_id: number, reason: string, description?: string }
 */
export const createAfterSale = (data) => {
	return post('/app/after-sale/create', data);
};

/**
 * 获取用户的售后申请列表
 */
export const getAfterSaleList = () => {
	return get('/app/after-sale/list');
};

// ==================== 错题本相关 ====================
/**
 * 获取错题列表
 * @param {Object} params - 查询参数
 * @param {number} params.course_id - 课程ID（可选，用于筛选）
 */
export const getWrongBookList = (params = {}) => {
	return get('/app/wrong_book', params);
};

/**
 * 斩题（移除错题）
 * @param {Object} data - { id: number } - 错题本记录ID
 */
export const removeWrongQuestion = (data) => {
	return post('/app/wrong_book/remove', data);
};

// ==================== 收藏相关 ====================
/**
 * 收藏/取消收藏
 * @param {Object} data - { question_id: number }
 */
export const toggleCollection = (data) => {
	return post('/app/favorite/toggle', data);
};

/**
 * 检查题目是否已收藏
 * @param {number} questionId - 题目ID
 */
export const checkCollection = async (questionId) => {
	try {
		// 通过批量查询收藏列表来检查单个题目是否收藏
		const collections = await getCollectionList({ question_ids: [questionId] });
		return collections && collections.length > 0 && collections.some((c) => c.question_id === questionId);
	} catch (error) {
		console.error('检查收藏状态失败:', error);
		return false;
	}
};

/**
 * 获取收藏列表
 * @param {Object} params - { question_ids?: number[] }
 */
export const getCollectionList = (params) => {
	return get('/app/favorite/list', params);
};

// ==================== 笔记相关 ====================
/**
 * 创建或更新笔记
 * @param {Object} data - { question_id: number, content: string }
 */
export const createOrUpdateNote = (data) => {
	return post('/app/note/create-or-update', data);
};

/**
 * 获取笔记列表
 * @param {Object} params - { question_ids?: number[] }
 */
export const getNoteList = (params) => {
	return get('/app/note/list', params);
};

/**
 * 根据题目ID获取笔记
 * @param {number} questionId - 题目ID
 */
export const getNoteByQuestionId = (questionId) => {
	return get(`/app/note/by-question/${questionId}`);
};

/**
 * 删除笔记
 * @param {number} id - 笔记ID
 */
export const deleteNote = (id) => {
	return del(`/app/note/${id}`);
};

// ==================== 模拟考试相关 ====================
/**
 * 获取课程的考试配置列表
 * @param {number} courseId - 课程ID
 */
export const getExamConfigs = (courseId) => {
	return get(`/app/exam/config/${courseId}`);
};

/**
 * 获取考试配置详情
 * @param {number} id - 考试配置ID
 */
export const getExamConfigDetail = (id) => {
	return get(`/app/exam/config/detail/${id}`);
};

/**
 * 开始考试
 * @param {Object} data - { exam_config_id: number }
 */
export const startExam = (data) => {
	return post('/app/exam/start', data);
};

/**
 * 提交考试
 * @param {Object} data - { exam_config_id: number, user_answers: Object, start_time: string }
 */
export const submitExam = (data) => {
	return post('/app/exam/submit', data);
};

/**
 * 获取考试记录列表
 * @param {Object} params - { examConfigId?: number }
 */
export const getExamRecords = (params = {}) => {
	return get('/app/exam/records', params);
};

/**
 * 获取考试记录详情
 * @param {number} id - 考试记录ID
 */
export const getExamRecordDetail = (id) => {
	return get(`/app/exam/records/${id}`);
};
