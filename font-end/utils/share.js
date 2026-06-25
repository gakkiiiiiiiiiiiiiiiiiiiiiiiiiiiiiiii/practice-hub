const DEFAULT_TITLE = '研刷通｜考研刷题与课程资料';
const DEFAULT_PATH = '/pages/index/index';
/** 微信分享封面须为真实 PNG/JPG（5:4），不可用 SVG 伪装 */
const DEFAULT_IMAGE_URL = '/static/share-cover.png';
const REFERRAL_IMAGE_URL = '/static/invite-share-cover.png';

export function enableWeChatShareMenu() {
	// #ifdef MP-WEIXIN
	if (typeof wx !== 'undefined' && typeof wx.showShareMenu === 'function') {
		wx.showShareMenu({
			withShareTicket: true,
			menus: ['shareAppMessage', 'shareTimeline'],
		});
	}
	// #endif
}

export function buildSharePath(path = DEFAULT_PATH, query = {}) {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const queryString = Object.entries(query)
		.filter(([, value]) => value !== undefined && value !== null && value !== '')
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join('&');
	return queryString ? `${normalizedPath}?${queryString}` : normalizedPath;
}

export function getDefaultShare(overrides = {}) {
	const share = {
		title: overrides.title || DEFAULT_TITLE,
		path: overrides.path || DEFAULT_PATH,
		imageUrl: overrides.imageUrl || DEFAULT_IMAGE_URL,
	};
	if (!share.imageUrl) {
		delete share.imageUrl;
	}
	return share;
}

export function getReferralShare(userId) {
	return getDefaultShare({
		title: '邀请好友得优惠券｜研刷通',
		path: buildSharePath('/pages/index/index', userId ? { referral_uid: userId } : {}),
		imageUrl: REFERRAL_IMAGE_URL,
	});
}

export function toTimelineShare(share) {
	const [path, query = ''] = String(share.path || DEFAULT_PATH).split('?');
	return {
		title: share.title || DEFAULT_TITLE,
		query,
		imageUrl: share.imageUrl || DEFAULT_IMAGE_URL,
		path,
	};
}
