/**
 * 从可用优惠券中选取面额最高的一张
 * @param {Array<{ id: number|string, amount: number }>} usableCoupons
 */
export const pickBestUsableCouponId = (usableCoupons) => {
	if (!Array.isArray(usableCoupons) || usableCoupons.length === 0) {
		return null;
	}
	const best = usableCoupons.reduce((current, item) => {
		return Number(item.amount || 0) > Number(current.amount || 0) ? item : current;
	}, usableCoupons[0]);
	return best?.id ?? null;
};

/**
 * 自动选中已满足门槛的最优优惠券
 * - 当前选中仍可用：保持不变
 * - 当前选中失效：改选面额最大的可用券
 * - 用户主动选择「不使用」：保持不选
 * - 未选中且未主动拒绝：自动选面额最大的可用券
 */
export const applyAutoCouponSelection = (selectedCouponIdRef, usableCoupons, options = {}) => {
	const { userOptOutRef } = options;
	const list = Array.isArray(usableCoupons) ? usableCoupons : [];

	const isCurrentValid =
		selectedCouponIdRef.value != null &&
		list.some((item) => item.id === selectedCouponIdRef.value);

	if (isCurrentValid) {
		return;
	}

	if (selectedCouponIdRef.value != null) {
		selectedCouponIdRef.value = pickBestUsableCouponId(list);
		if (userOptOutRef) {
			userOptOutRef.value = false;
		}
		return;
	}

	if (userOptOutRef?.value) {
		selectedCouponIdRef.value = null;
		return;
	}

	selectedCouponIdRef.value = pickBestUsableCouponId(list);
};
