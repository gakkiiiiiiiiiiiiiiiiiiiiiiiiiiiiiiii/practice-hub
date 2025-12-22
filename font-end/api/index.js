/**
 * API 服务封装
 * 统一管理所有接口调用
 */
import { get, post, put, del } from '@/utils/request';

// ==================== 认证相关 ====================
/**
 * 小程序端 - 微信一键登录
 * @param {Object} data - { code: string }
 */
export const appLogin = (data) => {
  return post('/auth/app/login', data);
};

// ==================== 用户相关 ====================
/**
 * 获取个人信息
 */
export const getUserInfo = () => {
  return get('/app/user/info');
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

/**
 * 获取推荐版块列表（包含题库详情）
 * @returns {Promise<Array>} 返回所有启用的推荐分类及其下的题库列表
 * @example
 * [
 *   {
 *     id: 1,
 *     name: '热门公共课',
 *     items: [
 *       { id: 1, name: '数学', cover_img: '...', price: 99.99, ... }
 *     ]
 *   },
 *   {
 *     id: 2,
 *     name: '专业课精选',
 *     items: [...]
 *   }
 * ]
 */
export const getRecommendCategories = () => {
  return get('/app/recommend/categories');
};

// ==================== 题库相关 ====================
/**
 * 获取所有题库列表
 */
export const getAllSubjects = () => {
  return get('/app/subjects');
};

/**
 * 获取题库详情
 * @param {number} id - 题库ID
 */
export const getSubjectDetail = (id) => {
  return get(`/app/subjects/${id}/detail`);
};

// ==================== 题目相关 ====================
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
 * @param {Object} data - { subjectId: number, months: number }
 */
export const createOrder = (data) => {
  return post('/app/order/create', data);
};

// ==================== 激活码相关 ====================
/**
 * 使用激活码
 * @param {Object} data - { code: string }
 */
export const redeemCode = (data) => {
  return post('/app/code/redeem', data);
};

// ==================== 错题本相关 ====================
/**
 * 获取错题列表
 */
export const getWrongBookList = () => {
  return get('/app/wrong_book');
};

/**
 * 斩题（移除错题）
 * @param {Object} data - { questionId: number }
 */
export const removeWrongQuestion = (data) => {
  return post('/app/wrong_book/remove', data);
};

// ==================== 收藏相关 ====================
/**
 * 收藏/取消收藏
 * @param {Object} data - { questionId: number }
 */
export const toggleCollection = (data) => {
  return post('/app/favorite/toggle', data);
};

