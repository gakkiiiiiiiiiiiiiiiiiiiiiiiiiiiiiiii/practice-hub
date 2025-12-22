<template>
  <view class="rank-page">
    <view class="rank-header">
      <text class="header-title">排行榜</text>
      <view class="rank-tabs">
        <text
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: currentTab === tab.value }"
          @click="switchTab(tab.value)"
        >
          {{ tab.label }}
        </text>
      </view>
    </view>

    <scroll-view class="rank-list" scroll-y>
      <view class="rank-top3">
        <view
          v-for="(item, index) in top3List"
          :key="item.id"
          class="top3-item"
          :class="`rank-${index + 1}`"
        >
          <view class="top3-avatar">
            <image :src="item.avatar || defaultAvatar" mode="aspectFill"></image>
            <text class="rank-badge">{{ index + 1 }}</text>
          </view>
          <text class="top3-name">{{ item.nickname }}</text>
          <text class="top3-score">{{ item.score }}分</text>
        </view>
      </view>

      <view class="rank-others">
        <view
          v-for="(item, index) in otherList"
          :key="item.id"
          class="rank-item"
          :class="{ 'my-rank': item.isMe }"
        >
          <text class="rank-number">{{ index + 4 }}</text>
          <image class="rank-avatar" :src="item.avatar || defaultAvatar" mode="aspectFill"></image>
          <view class="rank-info">
            <text class="rank-name">{{ item.nickname }}</text>
            <text class="rank-meta">{{ item.bankName }}</text>
          </view>
          <text class="rank-score">{{ item.score }}分</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get } from '@/utils/request'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const currentTab = ref('total') // total, week, month
const rankList = ref([])
const defaultAvatar = '/static/default-avatar.png'

const tabs = [
  { label: '总榜', value: 'total' },
  { label: '周榜', value: 'week' },
  { label: '月榜', value: 'month' }
]

const top3List = computed(() => {
  return rankList.value.slice(0, 3)
})

const otherList = computed(() => {
  return rankList.value.slice(3)
})

onMounted(() => {
  loadRankList()
})

const switchTab = (tab) => {
  currentTab.value = tab
  loadRankList()
}

const loadRankList = async () => {
  try {
    const res = await get('/rank/list', { type: currentTab.value })
    rankList.value = res.map((item, index) => ({
      ...item,
      isMe: item.userId === userStore.userInfo?.id
    }))
  } catch (error) {
    console.error('获取排行榜失败:', error)
    // Mock 数据
    rankList.value = []
  }
}
</script>

<style lang="scss" scoped>
.rank-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.rank-header {
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

.rank-tabs {
  display: flex;
  gap: $spacing-md;
}

.tab-item {
  padding: $spacing-xs $spacing-md;
  font-size: $font-size-sm;
  color: $text-color-secondary;
  border-radius: $button-radius;
  
  &.active {
    background-color: $primary-color;
    color: $white;
  }
}

.rank-list {
  padding: $spacing-lg $page-padding;
  min-height: calc(100vh - 200rpx);
}

.rank-top3 {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  padding: $spacing-xl 0;
  margin-bottom: $spacing-lg;
}

.top3-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  
  &.rank-1 {
    order: 2;
    
    .top3-avatar {
      width: 120rpx;
      height: 120rpx;
    }
  }
  
  &.rank-2 {
    order: 1;
    
    .top3-avatar {
      width: 100rpx;
      height: 100rpx;
    }
  }
  
  &.rank-3 {
    order: 3;
    
    .top3-avatar {
      width: 100rpx;
      height: 100rpx;
    }
  }
}

.top3-avatar {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid $primary-color;
  
  image {
    width: 100%;
    height: 100%;
  }
}

.rank-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  background-color: $primary-color;
  color: $white;
  border-radius: 50%;
  font-size: $font-size-xs;
  font-weight: 600;
}

.top3-name {
  font-size: $font-size-sm;
  color: $text-color;
  font-weight: 500;
}

.top3-score {
  font-size: $font-size-base;
  font-weight: 600;
  color: $primary-color;
  font-family: 'DIN', Arial, sans-serif;
}

.rank-others {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background-color: $white;
  border-radius: $card-radius;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  &.my-rank {
    background-color: rgba(231, 76, 60, 0.1);
    border: 2rpx solid $primary-color;
  }
}

.rank-number {
  width: 48rpx;
  text-align: center;
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-color-secondary;
  font-family: 'DIN', Arial, sans-serif;
}

.rank-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 2rpx solid $border-color;
}

.rank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.rank-name {
  font-size: $font-size-base;
  color: $text-color;
  font-weight: 500;
}

.rank-meta {
  font-size: $font-size-sm;
  color: $text-color-secondary;
}

.rank-score {
  font-size: $font-size-base;
  font-weight: 600;
  color: $primary-color;
  font-family: 'DIN', Arial, sans-serif;
}
</style>

