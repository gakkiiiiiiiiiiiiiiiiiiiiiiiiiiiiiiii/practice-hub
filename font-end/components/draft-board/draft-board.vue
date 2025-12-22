<template>
  <view class="draft-board-container" v-if="visible" @touchmove.prevent>
    <view class="draft-header">
      <view class="header-left">
        <text class="header-title">草稿纸</text>
      </view>
      <view class="header-right">
        <view class="tool-btn" @click="toggleEraser">
          <app-icon :name="isEraser ? 'draft' : 'eraser'" :size="32" class="tool-icon" />
          <text class="tool-text">{{ isEraser ? '画笔' : '橡皮' }}</text>
        </view>
        <view class="tool-btn" @click="clearCanvas">
          <app-icon name="clear" :size="32" class="tool-icon" />
          <text class="tool-text">清空</text>
        </view>
        <view class="tool-btn" @click="minimize">
          <app-icon name="minimize" :size="32" class="tool-icon" />
        </view>
        <view class="tool-btn" @click="close">
          <app-icon name="close" :size="32" class="tool-icon" />
        </view>
      </view>
    </view>
    
    <canvas
      id="draftCanvas"
      type="2d"
      class="draft-canvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    ></canvas>
  </view>
  
  <view class="draft-minimized" v-else @click="show">
    <app-icon name="draft" :size="48" color="#ffffff" class="minimized-icon" />
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/app-icon/app-icon.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close'])

const canvasWidth = ref(0)
const canvasHeight = ref(0)
const ctx = ref(null)
const isEraser = ref(false)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (ctx.value) {
    ctx.value = null
  }
})

const initCanvas = () => {
  const systemInfo = uni.getSystemInfoSync()
  canvasWidth.value = systemInfo.windowWidth
  canvasHeight.value = systemInfo.windowHeight - 100 // 减去头部高度
  
  // #ifdef MP-WEIXIN
  const query = uni.createSelectorQuery()
  query.select('#draftCanvas').fields({ node: true, size: true }).exec((res) => {
    if (res[0]) {
      const canvas = res[0].node
      ctx.value = canvas.getContext('2d')
      
      // 设置画布实际像素
      const dpr = systemInfo.pixelRatio
      canvas.width = canvasWidth.value * dpr
      canvas.height = canvasHeight.value * dpr
      ctx.value.scale(dpr, dpr)
      
      // 设置画笔样式
      ctx.value.strokeStyle = '#333333'
      ctx.value.lineWidth = 3
      ctx.value.lineCap = 'round'
      ctx.value.lineJoin = 'round'
    }
  })
  // #endif
  
  // #ifdef H5
  const canvas = document.getElementById('draftCanvas')
  if (canvas) {
    ctx.value = canvas.getContext('2d')
    canvas.width = canvasWidth.value
    canvas.height = canvasHeight.value
    
    // 设置画笔样式
    ctx.value.strokeStyle = '#333333'
    ctx.value.lineWidth = 3
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
  }
  // #endif
}

const handleTouchStart = (e) => {
  if (!ctx.value) return
  
  isDrawing.value = true
  const touch = e.touches[0] || e.changedTouches[0]
  lastX.value = touch.x || touch.clientX
  lastY.value = touch.y || touch.clientY
  
  ctx.value.beginPath()
  ctx.value.moveTo(lastX.value, lastY.value)
}

const handleTouchMove = (e) => {
  if (!isDrawing.value || !ctx.value) return
  
  e.preventDefault()
  const touch = e.touches[0] || e.changedTouches[0]
  const currentX = touch.x || touch.clientX
  const currentY = touch.y || touch.clientY
  
  if (isEraser.value) {
    // 橡皮擦模式：清除区域
    ctx.value.globalCompositeOperation = 'destination-out'
    ctx.value.lineWidth = 20
  } else {
    // 画笔模式
    ctx.value.globalCompositeOperation = 'source-over'
    ctx.value.lineWidth = 3
  }
  
  ctx.value.lineTo(currentX, currentY)
  ctx.value.stroke()
  
  lastX.value = currentX
  lastY.value = currentY
}

const handleTouchEnd = () => {
  if (!ctx.value) return
  isDrawing.value = false
  ctx.value.closePath()
}

const toggleEraser = () => {
  isEraser.value = !isEraser.value
}

const clearCanvas = () => {
  if (!ctx.value) return
  uni.showModal({
    title: '提示',
    content: '确定要清空草稿纸吗？',
    success: (res) => {
      if (res.confirm) {
        ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
      }
    }
  })
}

const minimize = () => {
  emit('update:visible', false)
}

const show = () => {
  emit('update:visible', true)
}

const close = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
.draft-board-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f5f5;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.draft-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background-color: $white;
  border-bottom: 1px solid $border-color;
}

.header-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-color;
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xs;
  min-width: 60rpx;
}

.tool-icon {
  margin-bottom: 4rpx;
}

.tool-text {
  font-size: $font-size-xs;
  color: $text-color-secondary;
}

.draft-canvas {
  flex: 1;
  background-color: $white;
  touch-action: none;
}

.draft-minimized {
  position: fixed;
  right: $spacing-lg;
  bottom: 120rpx;
  width: 96rpx;
  height: 96rpx;
  background-color: $primary-color;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  z-index: 999;
}

.minimized-icon {
  /* 图标大小由组件控制 */
}
</style>

