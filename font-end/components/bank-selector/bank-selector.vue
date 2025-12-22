<template>
  <view class="bank-selector">
    <view class="selector-trigger" @click="showPicker = true">
      <text class="current-bank">{{ currentBankName || '请选择题库' }}</text>
      <text class="icon-arrow">▼</text>
    </view>
    
    <uni-popup ref="popup" type="bottom" :safe-area="false">
      <view class="picker-popup">
        <view class="picker-header">
          <text class="picker-title">选择题库</text>
          <text class="picker-close" @click="closePicker">✕</text>
        </view>
        <scroll-view class="picker-content" scroll-y>
          <view
            v-for="bank in bankList"
            :key="bank.id"
            class="picker-item"
            :class="{ active: bank.id === currentBankId }"
            @click="selectBank(bank)"
          >
            <view class="item-info">
              <text class="item-name">{{ bank.name }}</text>
              <text class="item-desc" v-if="bank.description">{{ bank.description }}</text>
            </view>
            <view class="item-badge" v-if="bank.id === currentBankId">✓</view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBankStore } from '@/store/bank'

const bankStore = useBankStore()
const popup = ref(null)
const showPicker = ref(false)

const currentBankId = computed(() => bankStore.currentBankId)
const bankList = computed(() => bankStore.bankList)
const currentBankName = computed(() => {
  const bank = bankList.value.find(b => b.id === currentBankId.value)
  return bank?.name || ''
})

watch(showPicker, (val) => {
  if (val) {
    popup.value?.open()
  } else {
    popup.value?.close()
  }
})

const selectBank = (bank) => {
  bankStore.setCurrentBank(bank.id)
  closePicker()
  // 触发事件通知父组件
  uni.$emit('bank-changed', bank.id)
}

const closePicker = () => {
  showPicker.value = false
}
</script>

<style lang="scss" scoped>
.bank-selector {
  width: 100%;
}

.selector-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  background-color: $white;
  border: 2rpx solid $border-color;
  border-radius: $button-radius;
  min-height: 72rpx;
}

.current-bank {
  font-size: $font-size-base;
  color: $text-color;
  flex: 1;
}

.icon-arrow {
  font-size: $font-size-sm;
  color: $text-color-secondary;
  transition: transform 0.3s;
}

.picker-popup {
  background-color: $white;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.picker-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-color;
}

.picker-close {
  font-size: 40rpx;
  color: $text-color-secondary;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-content {
  flex: 1;
  max-height: calc(70vh - 100rpx);
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  transition: background-color 0.3s;
  
  &:active {
    background-color: #f5f5f5;
  }
  
  &.active {
    background-color: rgba(231, 76, 60, 0.05);
  }
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: $font-size-base;
  color: $text-color;
  margin-bottom: $spacing-xs;
}

.item-desc {
  font-size: $font-size-sm;
  color: $text-color-secondary;
}

.item-badge {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary-color;
  font-size: 32rpx;
  font-weight: bold;
}
</style>

