const crypto = require('crypto');
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

function getSecret() {
  return process.env.AppKey || process.env.WECHAT_PAY_APPKEY || process.env.JWT_SECRET || 'default_secret';
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(stableStringify(payload))
    .digest('base64url');
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

exports.main = async (event) => {
  const { sign, ...payload } = event || {};

  if (!sign || sign !== signPayload(payload)) {
    return { code: 400, msg: '支付请求签名无效' };
  }

  if (!payload.expiresAt || Date.now() > Number(payload.expiresAt)) {
    return { code: 400, msg: '支付请求已过期，请重新下单' };
  }

  try {
    const result = await cloud.cloudPay.unifiedOrder({
      body: payload.body,
      outTradeNo: payload.outTradeNo,
      spbillCreateIp: payload.spbillCreateIp || '127.0.0.1',
      subMchId: payload.subMchId,
      subAppid: payload.subAppid,
      subOpenid: payload.subOpenid,
      totalFee: Number(payload.totalFee),
      feeType: payload.feeType || 'CNY',
      tradeType: payload.tradeType || 'JSAPI',
      nonceStr: payload.nonceStr,
      attach: payload.attach,
      envId: payload.envId,
      functionName: payload.functionName,
    });

    if (!result || !result.payment) {
      return { code: 400, msg: result?.returnMsg || result?.errMsg || '微信支付统一下单失败' };
    }

    return {
      code: 200,
      msg: 'success',
      payment: result.payment,
      prepay_id: result.prepayId || result.prepay_id || '',
    };
  } catch (error) {
    console.error('微信支付统一下单失败:', error);
    return { code: 500, msg: error.message || '微信支付统一下单失败' };
  }
};
