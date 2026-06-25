const crypto = require('crypto');
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

function getSecret() {
  return process.env.AppKey || process.env.WECHAT_PAY_APPKEY || process.env.JWT_SECRET || 'default_secret';
}

function signProof(payload) {
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payloadBase64)
    .digest('base64url');
  return `${payloadBase64}.${signature}`;
}

exports.main = async (event) => {
  const orderNo = event?.orderNo;
  const subMchId = event?.subMchId || process.env.WECHAT_PAY_MCH_ID || process.env.MCH_ID || '1111726570';

  if (!orderNo) {
    return { code: 400, msg: '订单号不能为空' };
  }

  try {
    const result = await cloud.cloudPay.queryOrder({
      subMchId,
      outTradeNo: orderNo,
      nonceStr: crypto.randomBytes(16).toString('hex'),
    });
    const tradeState = result.tradeState || result.trade_state || result.resultCode || result.result_code;
    if (tradeState !== 'SUCCESS') {
      return { code: 400, msg: '微信支付结果未完成', tradeState };
    }

    const proof = {
      orderNo,
      tradeState,
      totalFee: Number(result.totalFee ?? result.total_fee ?? result.cashFee ?? result.cash_fee ?? 0),
      transactionId: result.transactionId || result.transaction_id || '',
      issuedAt: Date.now(),
    };

    return {
      code: 200,
      msg: 'success',
      pay_proof: signProof(proof),
    };
  } catch (error) {
    console.error('微信支付查询失败:', error);
    return { code: 500, msg: error.message || '微信支付查询失败' };
  }
};
