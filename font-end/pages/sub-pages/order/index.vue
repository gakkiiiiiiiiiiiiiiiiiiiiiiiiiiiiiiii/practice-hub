<template>
  <view class="order-page">
    <view class="order-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <scroll-view class="order-list" scroll-y>
      <view v-if="orderList.length === 0" class="empty-state">
        <text class="empty-text">暂无订单</text>
      </view>
      <view
        v-for="order in orderList"
        :key="order.id"
        class="order-item"
        @click="handleOrderClick(order)"
      >
        <view class="order-header">
          <text class="order-id">订单号：{{ order.orderNo }}</text>
          <text class="order-status" :class="order.status">{{ getStatusText(order.status) }}</text>
        </view>
        <view class="order-content">
          <text class="order-name">{{ order.productName }}</text>
          <text class="order-price">¥{{ order.amount }}</text>
        </view>
        <view class="order-footer">
          <text class="order-time">{{ formatTime(order.createTime) }}</text>
          <view class="order-actions">
            <button
              v-if="order.status === 'pending'"
              class="action-btn pay-btn"
              @click.stop="handlePay(order)"
            >
              去支付
            </button>
            <button
              v-if="order.status === 'paid'"
              class="action-btn"
              @click.stop="handleDetail(order)"
            >
              查看详情
            </button>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '@/utils/request'
import { formatDate } from '@/utils/date'

const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
const options = currentPage.options || {}
const status = options.status || 'all'

const currentTab = ref(status)
const orderList = ref([])

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: 'pending' },
  { label: '已完成', value: 'paid' },
  { label: '已退款', value: 'refund' }
]

onMounted(() => {
  loadOrders()
})

const switchTab = (tab) => {
  currentTab.value = tab
  loadOrders()
}

const loadOrders = async () => {
  try {
    const params = currentTab.value === 'all' ? {} : { status: currentTab.value }
    const res = await get('/order/list', params)
    orderList.value = res
  } catch (error) {
    console.error('获取订单列表失败:', error)
    // Mock 数据
    orderList.value = []
  }
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待支付',
    paid: '已完成',
    refund: '已退款',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const formatTime = (time) => {
  return formatDate(time, 'YYYY-MM-DD HH:mm')
}

const handleOrderClick = (order) => {
  // 跳转到订单详情
}

const handlePay = async (order) => {
  try {
    // 调用支付接口
    const payParams = await post(`/order/${order.id}/pay`)
    
    // 调用微信支付
    await uni.requestPayment({
      ...payParams
    })
    
    uni.showToast({
      title: '支付成功',
      icon: 'success'
    })
    
    // 刷新订单列表
    loadOrders()
  } catch (error) {
    if (error.errMsg && !error.errMsg.includes('cancel')) {
      uni.showToast({
        title: '支付失败',
        icon: 'none'
      })
    }
  }
}

const handleDetail = (order) => {
  // 跳转到订单详情页
}
</script>

<style lang="scss" scoped>
.order-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.order-tabs {
  display: flex;
  background-color: $white;
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  padding: $spacing-md;
  text-align: center;
  border-bottom: 4rpx solid transparent;
  
  &.active {
    border-bottom-color: $primary-color;
    
    .tab-text {
      color: $primary-color;
      font-weight: 600;
    }
  }
}

.tab-text {
  font-size: $font-size-base;
  color: $text-color;
}

.order-list {
  padding: $spacing-md $page-padding;
  min-height: calc(100vh - 100rpx);
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

.order-item {
  background-color: $white;
  border-radius: $card-radius;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.order-id {
  font-size: $font-size-sm;
  color: $text-color-secondary;
}

.order-status {
  font-size: $font-size-sm;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  
  &.pending {
    color: $warning-color;
    background-color: rgba(243, 156, 18, 0.1);
  }
  
  &.paid {
    color: $success-color;
    background-color: rgba(46, 204, 113, 0.1);
  }
  
  &.refund {
    color: $text-color-secondary;
    background-color: rgba(153, 153, 153, 0.1);
  }
}

.order-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.order-name {
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-color;
  flex: 1;
}

.order-price {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $primary-color;
  font-family: 'DIN', Arial, sans-serif;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-time {
  font-size: $font-size-sm;
  color: $text-color-secondary;
}

.order-actions {
  display: flex;
  gap: $spacing-sm;
}

.action-btn {
  padding: $spacing-xs $spacing-md;
  background-color: #f5f5f5;
  color: $text-color;
  border-radius: $button-radius;
  font-size: $font-size-sm;
  border: none;
  
  &.pay-btn {
    background-color: $primary-color;
    color: $white;
  }
}
</style>

