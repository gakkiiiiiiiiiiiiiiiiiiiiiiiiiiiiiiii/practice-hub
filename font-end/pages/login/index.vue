<template>
  <view class="login-page">
    <view class="login-container">
      <view class="login-header">
        <text class="login-title">欢迎使用</text>
        <text class="login-subtitle">考研刷题小程序</text>
      </view>

      <view class="login-content">
        <!-- 微信登录 -->
        <button class="login-btn wx-login" open-type="getUserInfo" @getuserinfo="handleWxLogin">
          <text class="btn-icon">💬</text>
          <text class="btn-text">微信一键登录</text>
        </button>

        <!-- 手机号登录 -->
        <view class="login-form" v-if="showPhoneLogin">
          <input
            class="form-input"
            type="number"
            placeholder="请输入手机号"
            v-model="phone"
            maxlength="11"
          />
          <input
            class="form-input"
            type="number"
            placeholder="请输入验证码"
            v-model="code"
            maxlength="6"
          />
          <view class="code-row">
            <input class="form-input code-input" v-model="code" />
            <button class="code-btn" :disabled="codeCountdown > 0" @click="sendCode">
              {{ codeCountdown > 0 ? `${codeCountdown}秒` : '获取验证码' }}
            </button>
          </view>
          <button class="login-btn phone-login" @click="handlePhoneLogin">
            <text class="btn-text">登录</text>
          </button>
        </view>

        <!-- 切换登录方式 -->
        <view class="login-switch">
          <text class="switch-text" @click="showPhoneLogin = !showPhoneLogin">
            {{ showPhoneLogin ? '使用微信登录' : '使用手机号登录' }}
          </text>
        </view>

        <!-- 协议 -->
        <view class="login-agreement">
          <checkbox-group @change="handleAgreementChange">
            <label class="agreement-item">
              <checkbox value="agree" :checked="agreed" />
              <text class="agreement-text">
                我已阅读并同意
                <text class="agreement-link" @click.stop="showAgreement('privacy')">《隐私政策》</text>
                和
                <text class="agreement-link" @click.stop="showAgreement('terms')">《用户协议》</text>
              </text>
            </label>
          </checkbox-group>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import { appLogin } from '@/api/index'

const userStore = useUserStore()

const showPhoneLogin = ref(false)
const phone = ref('')
const code = ref('')
const codeCountdown = ref(0)
const agreed = ref(false)

let countdownTimer = null

const handleWxLogin = async (e) => {
  if (!agreed.value) {
    uni.showToast({
      title: '请先同意用户协议',
      icon: 'none'
    })
    return
  }

  try {
    uni.showLoading({ title: '登录中...' })
    
    // 获取微信登录凭证 code
    const loginRes = await uni.login({ provider: 'weixin' })
    
    if (!loginRes.code) {
      throw new Error('获取微信登录凭证失败')
    }
    
    // 调用后端登录接口
    const res = await appLogin({ code: loginRes.code })
    
    // 保存 token 和用户信息
    if (res.token) {
      uni.setStorageSync('auth_token', res.token)
    }
    if (res.user) {
      uni.setStorageSync('user_info', res.user)
      userStore.setUserInfo(res.user)
    }
    
    uni.hideLoading()
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })
    
    // 返回上一页或跳转到首页
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
  }
}

const sendCode = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
    return
  }

  try {
    // 调用发送验证码接口
    // await post('/auth/send-code', { phone: phone.value })
    
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    })
    
    // 开始倒计时
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)
  } catch (error) {
    uni.showToast({
      title: '发送失败，请重试',
      icon: 'none'
    })
  }
}

const handlePhoneLogin = async () => {
  if (!agreed.value) {
    uni.showToast({
      title: '请先同意用户协议',
      icon: 'none'
    })
    return
  }

  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
    return
  }

  if (!code.value || code.value.length !== 6) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none'
    })
    return
  }

  try {
    uni.showLoading({ title: '登录中...' })
    
    await userStore.login({
      phone: phone.value,
      code: code.value
    })
    
    uni.hideLoading()
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })
    
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
  }
}

const handleAgreementChange = (e) => {
  agreed.value = e.detail.value.includes('agree')
}

const showAgreement = (type) => {
  const title = type === 'privacy' ? '隐私政策' : '用户协议'
  uni.showModal({
    title,
    content: '这里是协议内容...',
    showCancel: false
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $page-padding;
}

.login-container {
  width: 100%;
  max-width: 600rpx;
  background-color: $white;
  border-radius: $card-radius;
  padding: $spacing-xl;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.login-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: $text-color;
  margin-bottom: $spacing-sm;
}

.login-subtitle {
  display: block;
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.login-content {
  margin-bottom: $spacing-lg;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  border-radius: $button-radius;
  font-size: $font-size-base;
  font-weight: 500;
  border: none;
  margin-bottom: $spacing-md;
  
  &.wx-login {
    background-color: #07c160;
    color: $white;
  }
  
  &.phone-login {
    background-color: $primary-color;
    color: $white;
  }
}

.btn-icon {
  font-size: 40rpx;
}

.btn-text {
  font-size: $font-size-base;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
}

.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 $spacing-md;
  background-color: #f5f5f5;
  border-radius: $button-radius;
  font-size: $font-size-base;
  color: $text-color;
  border: 2rpx solid transparent;
  
  &:focus {
    border-color: $primary-color;
    background-color: $white;
  }
}

.code-row {
  display: flex;
  gap: $spacing-md;
}

.code-input {
  flex: 1;
}

.code-btn {
  width: 200rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background-color: $primary-color;
  color: $white;
  border-radius: $button-radius;
  font-size: $font-size-sm;
  border: none;
  
  &[disabled] {
    background-color: $border-color;
    color: $text-color-disabled;
  }
}

.login-switch {
  text-align: center;
  margin-bottom: $spacing-lg;
}

.switch-text {
  font-size: $font-size-sm;
  color: $primary-color;
  text-decoration: underline;
}

.login-agreement {
  margin-top: $spacing-xl;
}

.agreement-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-xs;
}

.agreement-text {
  font-size: $font-size-xs;
  color: $text-color-secondary;
  line-height: 1.6;
  flex: 1;
}

.agreement-link {
  color: $primary-color;
}
</style>

