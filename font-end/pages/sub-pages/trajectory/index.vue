<template>
  <view class="trajectory-page">
    <view class="trajectory-header">
      <text class="header-title">学习轨迹</text>
      <view class="time-filter">
        <text
          v-for="filter in timeFilters"
          :key="filter.value"
          class="filter-item"
          :class="{ active: currentFilter === filter.value }"
          @click="switchFilter(filter.value)"
        >
          {{ filter.label }}
        </text>
      </view>
    </view>

    <scroll-view class="trajectory-list" scroll-y>
      <view v-if="trajectoryList.length === 0" class="empty-state">
        <text class="empty-text">暂无学习记录</text>
      </view>
      <view
        v-for="item in trajectoryList"
        :key="item.id"
        class="trajectory-item"
      >
        <view class="item-time">
          <text class="time-date">{{ formatDate(item.date, 'MM-DD') }}</text>
          <text class="time-week">{{ getWeekDay(item.date) }}</text>
        </view>
        <view class="item-content">
          <text class="content-title">{{ item.action }}</text>
          <text class="content-desc">{{ item.description }}</text>
          <text class="content-meta">{{ formatTime(item.createTime) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/utils/request'
import { formatDate } from '@/utils/date'

const currentFilter = ref('week') // week, month, all
const trajectoryList = ref([])

const timeFilters = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '全部', value: 'all' }
]

onMounted(() => {
  loadTrajectory()
})

const switchFilter = (filter) => {
  currentFilter.value = filter
  loadTrajectory()
}

const loadTrajectory = async () => {
  try {
    const res = await get('/trajectory/list', { period: currentFilter.value })
    trajectoryList.value = res
  } catch (error) {
    console.error('获取学习轨迹失败:', error)
    // Mock 数据
    trajectoryList.value = []
  }
}

const getWeekDay = (date) => {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const d = new Date(date)
  return `周${weekDays[d.getDay()]}`
}

const formatTime = (time) => {
  return formatDate(time, 'HH:mm')
}
</script>

<style lang="scss" scoped>
.trajectory-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.trajectory-header {
  padding: $spacing-lg $page-padding;
  background-color: $white;
  border-bottom: 1px solid $border-color;
}

.header-title {
  display: block;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-color;
  margin-bottom: $spacing-md;
}

.time-filter {
  display: flex;
  gap: $spacing-md;
}

.filter-item {
  padding: $spacing-xs $spacing-md;
  font-size: $font-size-sm;
  color: $text-color-secondary;
  border-radius: $button-radius;
  background-color: #f5f5f5;
  
  &.active {
    background-color: $primary-color;
    color: $white;
  }
}

.trajectory-list {
  padding: $spacing-md $page-padding;
  min-height: calc(100vh - 200rpx);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl * 2;
}

.empty-text {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.trajectory-item {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  background-color: $white;
  border-radius: $card-radius;
  margin-bottom: $spacing-md;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.item-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120rpx;
  padding-right: $spacing-md;
  border-right: 1px solid $border-color;
}

.time-date {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-color;
  font-family: 'DIN', Arial, sans-serif;
}

.time-week {
  font-size: $font-size-xs;
  color: $text-color-secondary;
  margin-top: $spacing-xs;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.content-title {
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-color;
}

.content-desc {
  font-size: $font-size-sm;
  color: $text-color-secondary;
  line-height: 1.6;
}

.content-meta {
  font-size: $font-size-xs;
  color: $text-color-disabled;
}
</style>

