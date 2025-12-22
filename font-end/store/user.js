/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { getUserInfo, updateUserProfile } from '@/api/index'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('auth_token') || '',
    userInfo: uni.getStorageSync('user_info') || null,
    isVip: false,
    permissions: {} // 格式: { bankId: 'Trial' | 'VIP' | 'None' }
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    hasPermission: (state) => (bankId) => {
      const permission = state.permissions[bankId]
      return permission === 'VIP' || permission === 'Trial'
    },
    getPermission: (state) => (bankId) => {
      return state.permissions[bankId] || 'None'
    }
  },

  actions: {
    /**
     * 登录
     */
    async login(loginData) {
      try {
        const res = await post('/auth/login', loginData)
        this.setToken(res.token)
        this.setUserInfo(res.userInfo)
        this.setVipStatus(res.isVip)
        this.setPermissions(res.permissions || {})
        return res
      } catch (error) {
        throw error
      }
    },

    /**
     * 微信登录
     */
    async wxLogin() {
      try {
        // 获取微信登录凭证
        const loginRes = await uni.login({ provider: 'weixin' })
        const userProfile = await uni.getUserProfile({ desc: '用于完善用户资料' })
        
        const res = await post('/auth/wx-login', {
          code: loginRes.code,
          userInfo: userProfile.userInfo
        })
        
        this.setToken(res.token)
        this.setUserInfo(res.userInfo)
        this.setVipStatus(res.isVip)
        this.setPermissions(res.permissions || {})
        return res
      } catch (error) {
        throw error
      }
    },

    /**
     * 设置 Token
     */
    setToken(token) {
      this.token = token
      uni.setStorageSync('auth_token', token)
    },

    /**
     * 设置用户信息
     */
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      uni.setStorageSync('user_info', userInfo)
    },

    /**
     * 设置 VIP 状态
     */
    setVipStatus(isVip) {
      this.isVip = isVip
    },

    /**
     * 设置权限
     */
    setPermissions(permissions) {
      this.permissions = permissions
    },

    /**
     * 更新权限（激活码兑换后调用）
     */
    updatePermission(bankId, permission) {
      this.permissions[bankId] = permission
    },

    /**
     * 退出登录
     */
    logout() {
      this.token = ''
      this.userInfo = null
      this.isVip = false
      this.permissions = {}
      uni.removeStorageSync('auth_token')
      uni.removeStorageSync('user_info')
      uni.reLaunch({
        url: '/pages/login/index'
      })
    },

    /**
     * 获取用户信息
     */
    async fetchUserInfo() {
      try {
        const res = await getUserInfo()
        this.setUserInfo(res)
        this.setVipStatus(res.isVip || false)
        this.setPermissions(res.permissions || {})
        return res
      } catch (error) {
        throw error
      }
    }
  }
})

