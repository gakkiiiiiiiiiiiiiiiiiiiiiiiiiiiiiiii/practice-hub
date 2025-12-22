<template>
  <view class="wrong-page">
    <view class="wrong-header">
      <text class="header-title">错题集</text>
      <text class="header-count">共 {{ wrongList.length }} 题</text>
    </view>

    <scroll-view class="wrong-list" scroll-y>
      <view v-if="wrongList.length === 0" class="empty-state">
        <text class="empty-text">暂无错题</text>
      </view>
      <view
        v-for="item in wrongList"
        :key="item.id"
        class="wrong-item"
        @click="handleReview(item)"
      >
        <view class="item-content">
          <text class="item-title">{{ item.questionContent }}</text>
          <text class="item-meta">{{ item.bankName }} · {{ item.paperName }}</text>
        </view>
        <view class="item-actions">
          <text class="action-icon">→</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/utils/request'

const wrongList = ref([])

onMounted(() => {
  loadWrongList()
})

const loadWrongList = async () => {
  try {
    const res = await get('/wrong/list')
    wrongList.value = res
  } catch (error) {
    console.error('获取错题列表失败:', error)
    // Mock 数据
    wrongList.value = []
  }
}

const handleReview = (item) => {
  uni.navigateTo({
    url: `/pages/answer/index?mode=practice&questionId=${item.questionId}&from=wrong`
  })
}
</script>

<style lang="scss" scoped>
.wrong-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.wrong-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg $page-padding;
  background-color: $white;
  border-bottom: 1px solid $border-color;
}

.header-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-color;
}

.header-count {
  font-size: $font-size-sm;
  color: $text-color-secondary;
}

.wrong-list {
  padding: $spacing-md $page-padding;
  min-height: calc(100vh - 120rpx);
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

.wrong-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  background-color: $white;
  border-radius: $card-radius;
  margin-bottom: $spacing-md;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.item-title {
  font-size: $font-size-base;
  color: $text-color;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-meta {
  font-size: $font-size-sm;
  color: $text-color-secondary;
}

.item-actions {
  margin-left: $spacing-md;
}

.action-icon {
  font-size: $font-size-lg;
  color: $text-color-secondary;
}
</style>

