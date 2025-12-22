<template>
  <view class="activation-page">
    <view class="activation-container">
      <view class="activation-header">
        <text class="header-title">激活码兑换</text>
        <text class="header-desc">请输入您的激活码，解锁更多题库内容</text>
      </view>

      <view class="activation-form">
        <input
          class="activation-input"
          type="text"
          placeholder="请输入激活码"
          v-model="activationCode"
          maxlength="20"
        />
        <button class="activation-btn" :disabled="!activationCode || loading" @click="handleActivate">
          {{ loading ? '激活中...' : '立即激活' }}
        </button>
      </view>

      <view class="activation-tips">
        <text class="tips-title">使用说明：</text>
        <text class="tips-item">1. 激活码由字母和数字组成，不区分大小写</text>
        <text class="tips-item">2. 每个激活码仅可使用一次</text>
        <text class="tips-item">3. 激活成功后，相关题库将立即解锁</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import { useBankStore } from '@/store/bank'
import { redeemCode } from '@/api/index'

const userStore = useUserStore()
const bankStore = useBankStore()

const activationCode = ref('')
const loading = ref(false)

const handleActivate = async () => {
  if (!activationCode.value.trim()) {
    uni.showToast({
      title: '请输入激活码',
      icon: 'none'
    })
    return
  }

  try {
    loading.value = true
    const res = await redeemCode({
      code: activationCode.value.trim().toUpperCase()
    })

    // 更新用户权限和题库信息
    if (res.subjectId) {
      // 激活成功后，刷新题库列表
      bankStore.fetchSubjects()
    }

    uni.showToast({
      title: res.message || '激活成功',
      icon: 'success'
    })

    // 清空输入框
    activationCode.value = ''

    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.showToast({
      title: error.message || '激活失败，请检查激活码',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.activation-page {
  min-height: 100vh;
  background-color: $bg-color;
  padding: $spacing-xl $page-padding;
}

.activation-container {
  background-color: $white;
  border-radius: $card-radius;
  padding: $spacing-xl;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.activation-header {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.header-title {
  display: block;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-color;
  margin-bottom: $spacing-sm;
}

.header-desc {
  display: block;
  font-size: $font-size-sm;
  color: $text-color-secondary;
  line-height: 1.6;
}

.activation-form {
  margin-bottom: $spacing-xl;
}

.activation-input {
  width: 100%;
  height: 96rpx;
  padding: 0 $spacing-md;
  background-color: #f5f5f5;
  border-radius: $button-radius;
  font-size: $font-size-lg;
  color: $text-color;
  text-align: center;
  letter-spacing: 4rpx;
  font-weight: 600;
  margin-bottom: $spacing-lg;
  border: 2rpx solid transparent;
  
  &:focus {
    border-color: $primary-color;
    background-color: $white;
  }
}

.activation-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background-color: $primary-color;
  color: $white;
  border-radius: $button-radius;
  font-size: $font-size-base;
  font-weight: 600;
  border: none;
  
  &[disabled] {
    background-color: $border-color;
    color: $text-color-disabled;
  }
}

.activation-tips {
  padding: $spacing-lg;
  background-color: #f9f9f9;
  border-radius: $button-radius;
}

.tips-title {
  display: block;
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-color;
  margin-bottom: $spacing-md;
}

.tips-item {
  display: block;
  font-size: $font-size-sm;
  color: $text-color-secondary;
  line-height: 1.8;
  margin-bottom: $spacing-xs;
}
</style>

