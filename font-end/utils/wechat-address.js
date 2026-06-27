export const PAPER_EXAM_CONTENT_TYPE = 'paper_exam';

export const isPaperExamCourse = (course) =>
	(course?.content_type || course?.contentType || '') === PAPER_EXAM_CONTENT_TYPE;

export const formatCourseTypeLabel = (contentType) => {
	if (contentType === 'file') return '资料课程';
	if (contentType === PAPER_EXAM_CONTENT_TYPE) return '纸质真题';
	return '题库课程';
};

export const normalizeWechatAddress = (address = {}) => {
	const province = String(address.provinceName || address.province || '').trim();
	const city = String(address.cityName || address.city || '').trim();
	const district = String(address.countyName || address.district || '').trim();
	const detail = String(address.detailInfo || address.detail || '').trim();
	return {
		name: String(address.userName || address.name || '').trim(),
		phone: String(address.telNumber || address.phone || '').trim(),
		province,
		city,
		district,
		detail,
		postalCode: String(address.postalCode || '').trim(),
		nationalCode: String(address.nationalCode || '').trim(),
		fullAddress: [province, city, district, detail].filter(Boolean).join(''),
		raw: address,
	};
};

export const chooseWechatShippingAddress = () => {
	// #ifdef MP-WEIXIN
	return new Promise((resolve, reject) => {
		const chooseAddress = typeof wx !== 'undefined' && wx.chooseAddress ? wx.chooseAddress : uni.chooseAddress;
		if (!chooseAddress) {
			reject(new Error('当前微信版本不支持选择收货地址'));
			return;
		}
		chooseAddress({
			success: (res) => {
				const address = normalizeWechatAddress(res);
				if (!address.name || !address.phone || !address.province || !address.city || !address.district || !address.detail) {
					reject(new Error('收货地址不完整，请重新选择'));
					return;
				}
				resolve(address);
			},
			fail: (err) => {
				reject(new Error(err?.errMsg?.includes('cancel') ? '未选择收货地址' : '请选择微信收货地址'));
			},
		});
	});
	// #endif
	// #ifndef MP-WEIXIN
	return Promise.reject(new Error('请在微信小程序中选择收货地址'));
	// #endif
};
