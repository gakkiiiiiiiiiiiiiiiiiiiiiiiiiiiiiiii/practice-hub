/**
 * 题库状态管理
 */
import { defineStore } from 'pinia'
import { getAllSubjects, getSubjectDetail } from '@/api/index'
import { useUserStore } from './user'

export const useBankStore = defineStore('bank', {
  state: () => {
    const savedBankId = uni.getStorageSync('current_bank_id')
    return {
      currentBankId: savedBankId || null, // 当前选中的题库ID
      bankList: [], // 题库列表
      currentBank: null, // 当前题库详情
      settings: {
        fontSize: uni.getStorageSync('font_size') || 'medium', // small, medium, large
        nightMode: uni.getStorageSync('night_mode') === 'true' || false
      }
    }
  },

  getters: {
    /**
     * 获取当前题库权限
     */
    currentPermission: (state) => {
      const userStore = useUserStore()
      if (!state.currentBankId) return 'None'
      return userStore.getPermission(state.currentBankId)
    },

    /**
     * 是否有当前题库权限
     */
    hasCurrentPermission: (state) => {
      const userStore = useUserStore()
      if (!state.currentBankId) return false
      return userStore.hasPermission(state.currentBankId)
    }
  },

  actions: {
    /**
     * 设置当前题库
     */
    setCurrentBank(bankId) {
      this.currentBankId = bankId
      uni.setStorageSync('current_bank_id', bankId)
      // 不在这里自动获取详情，让页面自己控制
      // 这样可以避免404错误影响设置操作
      this.currentBank = null
    },

    /**
     * 获取题库列表
     */
    async fetchBankList() {
      try {
        const res = await getAllSubjects()
        this.bankList = res || []
        return res
      } catch (error) {
        throw error
      }
    },

    /**
     * 获取题库详情
     */
    async fetchBankDetail(bankId) {
      try {
        const res = await getSubjectDetail(bankId)
        this.currentBank = res
        return res
      } catch (error) {
        throw error
      }
    },

    /**
     * 获取所有题库（别名，保持兼容性）
     */
    async fetchSubjects() {
      return this.fetchBankList()
    },

    /**
     * 更新设置
     */
    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
      if (settings.fontSize) {
        uni.setStorageSync('font_size', settings.fontSize)
      }
      if (settings.nightMode !== undefined) {
        uni.setStorageSync('night_mode', String(settings.nightMode))
      }
    }
  }
})

