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
              @click.stop="handleApplyAfterSale(order)"
            >
              申请售后
            </button>
            <button
              v-if="order.status === 'after_sale'"
              class="action-btn"
              @click.stop="handleDetail(order)"
            >
              查看详情
            </button>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 订单详情弹窗 -->
    <view v-if="showDetailModal" class="modal-mask" @click="showDetailModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">订单详情</text>
          <view class="modal-close" @click="showDetailModal = false">
            <text>×</text>
          </view>
        </view>
        <view class="modal-body" v-if="detailOrder">
          <view class="detail-item">
            <text class="detail-label">订单号</text>
            <text class="detail-value">{{ detailOrder.orderNo }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">购买内容</text>
            <text class="detail-value">{{ detailOrder.productName }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">实付金额</text>
            <text class="detail-value price">¥{{ detailOrder.amount }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">订单状态</text>
            <text class="detail-value">{{ getStatusText(detailOrder.status) }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">下单时间</text>
            <text class="detail-value">{{ formatTime(detailOrder.createTime) }}</text>
          </view>
          <view v-if="detailOrder.status === 'after_sale' || detailOrder.afterSale" class="after-sale-block">
            <text class="after-sale-title">售后信息</text>
            <view class="detail-item">
              <text class="detail-label">微信联系方式</text>
              <text class="detail-value">{{ detailOrder.afterSale?.wechatContact || '-' }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">售后原因</text>
              <text class="detail-value">{{ detailOrder.afterSale?.reason || '-' }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">详细描述</text>
              <text class="detail-value multiline">{{ detailOrder.afterSale?.description || '-' }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">申请时间</text>
              <text class="detail-value">
                {{ detailOrder.afterSale?.createTime ? formatTime(detailOrder.afterSale.createTime) : '-' }}
              </text>
            </view>
            <view v-if="detailOrder.afterSale?.adminReply" class="detail-item">
              <text class="detail-label">处理回复</text>
              <text class="detail-value multiline">{{ detailOrder.afterSale.adminReply }}</text>
            </view>
          </view>
        </view>
        <view class="modal-footer single">
          <button class="modal-btn submit-btn" @click="showDetailModal = false">知道了</button>
        </view>
      </view>
    </view>

    <!-- 申请售后弹窗 -->
    <view v-if="showAfterSaleModal" class="modal-mask" @click="showAfterSaleModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">申请售后</text>
          <view class="modal-close" @click="showAfterSaleModal = false">
            <text>×</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">微信联系方式 *</text>
            <input
              class="form-input"
              v-model="afterSaleForm.wechat_contact"
              placeholder="请输入微信号或手机号，方便客服联系"
              maxlength="64"
            />
          </view>
          <view class="form-item">
            <text class="form-label">售后原因 *</text>
            <input
              class="form-input"
              v-model="afterSaleForm.reason"
              placeholder="请输入售后原因"
              maxlength="500"
            />
          </view>
          <view class="form-item">
            <text class="form-label">详细描述</text>
            <textarea
              class="form-textarea"
              v-model="afterSaleForm.description"
              placeholder="请详细描述售后原因（选填）"
              maxlength="1000"
            />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @click="showAfterSaleModal = false">取消</button>
          <button class="modal-btn submit-btn" @click="handleSubmitAfterSale" :loading="submitting">提交</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '@/utils/request'
import { formatDate } from '@/utils/date'
import { createAfterSale } from '@/api/index'
import {
  blockVirtualPaymentIfNotReady,
  formatVirtualPaymentFailMessage,
  invokeVirtualPayment,
} from '@/utils/virtual-payment'

const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
const options = currentPage.options || {}
const status = options.status || 'all'

const currentTab = ref(status)
const orderList = ref([])
const showAfterSaleModal = ref(false)
const showDetailModal = ref(false)
const detailOrder = ref(null)
const currentOrder = ref(null)
const submitting = ref(false)
const afterSaleForm = ref({
  wechat_contact: '',
  reason: '',
  description: '',
})

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: 'pending' },
  { label: '支付完成', value: 'paid' },
  { label: '售后', value: 'after_sale' }
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
    const res = await get('/app/order/list', params)
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
    paid: '支付完成',
    after_sale: '售后',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const formatTime = (time) => {
  return formatDate(time, 'YYYY-MM-DD HH:mm')
}

const handleOrderClick = (order) => {
  if (order.status === 'after_sale') {
    handleDetail(order)
  }
}

const handlePay = async (order) => {
  try {
    // 调用支付接口
    const payRes = await post(`/app/order/${order.id}/pay`)
    const payParams = payRes?.payment_params || payRes
    if (!payParams) {
      loadOrders()
      return
    }

    if (blockVirtualPaymentIfNotReady(payRes)) {
      return
    }
    await invokeVirtualPayment(payParams)
    await post('/app/order/pay/confirm', {
      order_no: payRes?.order_no || order.orderNo
    })

    uni.showToast({
      title: '支付成功',
      icon: 'success'
    })

    // 刷新订单列表
    loadOrders()
  } catch (error) {
    const msg = formatVirtualPaymentFailMessage(error)
    if (!msg.includes('取消')) {
      uni.showToast({
        title: msg,
        icon: 'none',
        duration: msg.includes('10 分钟') ? 3500 : 2000,
      })
    }
  }
}

const handleDetail = (order) => {
  detailOrder.value = order
  showDetailModal.value = true
}

const handleApplyAfterSale = (order) => {
  currentOrder.value = order
  afterSaleForm.value = {
    wechat_contact: '',
    reason: '',
    description: '',
  }
  showAfterSaleModal.value = true
}

const handleSubmitAfterSale = async () => {
  if (!afterSaleForm.value.wechat_contact?.trim()) {
    uni.showToast({
      title: '请输入微信联系方式',
      icon: 'none',
    })
    return
  }

  if (!afterSaleForm.value.reason?.trim()) {
    uni.showToast({
      title: '请输入售后原因',
      icon: 'none',
    })
    return
  }

  if (!currentOrder.value) return

  submitting.value = true
  try {
    await createAfterSale({
      order_id: currentOrder.value.id,
      wechat_contact: afterSaleForm.value.wechat_contact.trim(),
      reason: afterSaleForm.value.reason.trim(),
      description: afterSaleForm.value.description?.trim() || '',
    })

    uni.showToast({
      title: '申请已提交',
      icon: 'success'
    })

    showAfterSaleModal.value = false
    // 刷新订单列表
    loadOrders()
  } catch (error) {
    console.error('申请售后失败:', error)
    uni.showToast({
      title: error.message || '申请失败，请重试',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

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
  box-sizing: border-box;
  width: 100%;
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
  box-sizing: border-box;
  width: 100%;
  margin-bottom: $spacing-md;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: $spacing-md;
}

.order-id {
  font-size: $font-size-sm;
  color: $text-color-secondary;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-status {
  flex-shrink: 0;
  font-size: $font-size-sm;
  padding: 6rpx 14rpx;
  border-radius: 6rpx;
  line-height: 1.3;
  
  &.pending {
    color: $warning-color;
    background-color: rgba(243, 156, 18, 0.1);
  }
  
  &.paid {
    color: $success-color;
    background-color: rgba(46, 204, 113, 0.1);
  }
  
  &.after_sale {
    color: $text-color-secondary;
    background-color: rgba(153, 153, 153, 0.1);
  }
}

.order-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: $spacing-md;
}

.order-name {
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-color;
  flex: 1;
  min-width: 0;
  line-height: 1.45;
  word-break: break-word;
}

.order-price {
  flex-shrink: 0;
  max-width: 180rpx;
  text-align: right;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $primary-color;
  font-family: 'DIN', Arial, sans-serif;
  line-height: 1.35;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.order-time {
  font-size: $font-size-sm;
  color: $text-color-secondary;
  flex: 1;
  min-width: 0;
}

.order-actions {
  display: flex;
  flex-shrink: 0;
  gap: $spacing-sm;
}

.action-btn {
  padding: $spacing-xs $spacing-md;
  margin: 0;
  background-color: #f5f5f5;
  color: $text-color;
  border-radius: $button-radius;
  font-size: $font-size-sm;
  border: none;
  line-height: 1.5;

  &::after {
    border: 0;
  }
  
  &.pay-btn {
    background-color: $primary-color;
    color: $white;
  }
}

/* 申请售后弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 90%;
  max-width: 600rpx;
  background-color: $white;
  border-radius: 24rpx;
  overflow: hidden;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  box-sizing: border-box;
  width: 100%;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-color;
}

.modal-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 32rpx;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.form-item {
  margin-bottom: 32rpx;
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: $text-color;
  margin-bottom: 16rpx;
}

.form-input {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 24rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
  box-sizing: border-box;
}

.form-textarea {
  display: block;
  width: 100%;
  max-width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  gap: 24rpx;
  padding: 32rpx;
  border-top: 1rpx solid #f0f0f0;
  box-sizing: border-box;
  width: 100%;

  &.single {
    padding-top: 24rpx;
  }
}

.detail-item {
  margin-bottom: 24rpx;
}

.detail-label {
  display: block;
  font-size: 24rpx;
  color: #9ca3af;
  margin-bottom: 8rpx;
}

.detail-value {
  display: block;
  font-size: 28rpx;
  color: #111827;
  line-height: 1.6;
  word-break: break-all;

  &.price {
    color: $primary-color;
    font-weight: 600;
  }

  &.multiline {
    white-space: pre-wrap;
  }
}

.after-sale-block {
  margin-top: 8rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.after-sale-title {
  display: block;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

.modal-btn {
  flex: 1;
  min-width: 0;
  height: 88rpx;
  line-height: 88rpx;
  margin: 0;
  padding: 0;
  text-align: center;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;

  &::after {
    border: none;
  }

  &.cancel-btn {
    background-color: #f5f5f5;
    color: #666;
  }

  &.submit-btn {
    background-color: $primary-color;
    color: $white;
  }
}
</style>
