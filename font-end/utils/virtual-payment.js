/**
 * 微信虚拟支付（代币 short_series_coin）
 */

export const formatVirtualPaymentFailMessage = (error, fallback = '支付失败，请稍后重试') => {
	const errCode = error?.errCode ?? error?.errno;
	const raw = String(error?.errMsg || error?.message || error?.msg || '');
	if (errCode === -2 || raw.includes('cancel') || raw.includes('取消')) {
		return '已取消支付';
	}
	if (/IOS_ORDER_PRICE_TOO_LOW/i.test(raw)) {
		return 'iPhone/iPad 端 Apple 支付最低 1 元，请调整课程或代理商售价后重试';
	}
	if (raw.includes('requestVirtualPayment:fail')) {
		return '微信虚拟支付拉起失败，请稍后重试';
	}
	return raw || fallback;
};

/** 代币模式下无需道具同步等待，保留兼容旧接口 */
export const blockVirtualPaymentIfNotReady = () => false;

export const invokeVirtualPayment = (paymentParams) =>
	new Promise((resolve, reject) => {
		const paymentApi =
			typeof wx !== 'undefined' && wx.requestVirtualPayment
				? wx.requestVirtualPayment
				: uni.requestVirtualPayment;
		if (!paymentApi) {
			reject(new Error('当前环境暂不支持微信虚拟支付'));
			return;
		}
		paymentApi({
			signData: String(paymentParams.signData || ''),
			mode: paymentParams.mode || 'short_series_coin',
			paySig: paymentParams.paySig,
			signature: paymentParams.signature,
			success: resolve,
			fail: reject,
		});
	});
