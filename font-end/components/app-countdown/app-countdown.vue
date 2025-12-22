<template>
  <view class="countdown-container" :style="containerStyle">
    <view class="countdown-label" v-if="label">{{ label }}</view>
    <view class="countdown-content" :class="size">
      <text class="countdown-text" :style="textStyle">{{ displayText }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDaysUntil } from '@/utils/date'

const props = defineProps({
  targetDate: {
    type: [String, Date],
    required: true
  },
  label: {
    type: String,
    default: '距离考研还有'
  },
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (val) => ['small', 'medium', 'large'].includes(val)
  },
  textColor: {
    type: String,
    default: '#e74c3c'
  },
  backgroundColor: {
    type: String,
    default: 'transparent'
  }
})

const days = ref(0)
let timer = null

const displayText = computed(() => {
  if (days.value > 0) {
    return `${days.value} 天`
  }
  return '已过期'
})

const containerStyle = computed(() => ({
  backgroundColor: props.backgroundColor
}))

const textStyle = computed(() => ({
  color: props.textColor,
  fontFamily: 'DIN, Arial, sans-serif'
}))

const updateCountdown = () => {
  days.value = getDaysUntil(props.targetDate)
}

onMounted(() => {
  updateCountdown()
  // 每天更新一次
  timer = setInterval(() => {
    updateCountdown()
  }, 1000 * 60 * 60) // 每小时检查一次
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style lang="scss" scoped>
.countdown-container {
  padding: 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.countdown-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20rpx;
  font-weight: 400;
  letter-spacing: 0.5rpx;
}

.countdown-content {
  font-weight: bold;
  position: relative;
  
  &.small {
    font-size: 56rpx;
  }
  
  &.medium {
    font-size: 72rpx;
  }
  
  &.large {
    font-size: 112rpx;
    line-height: 1.2;
  }
}

.countdown-text {
  font-weight: 700;
  letter-spacing: 4rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}
</style>

