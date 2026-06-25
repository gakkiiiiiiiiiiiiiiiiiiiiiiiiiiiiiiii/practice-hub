const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event) => {
  console.log('微信支付结果回调:', {
    returnCode: event.returnCode || event.return_code,
    resultCode: event.resultCode || event.result_code,
    outTradeNo: event.outTradeNo || event.out_trade_no,
    totalFee: event.totalFee || event.total_fee,
  });

  return {
    errcode: 0,
  };
};
