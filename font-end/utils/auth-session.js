const LOGIN_PAGE = '/pages/login/index';

let redirectingToLogin = false;

export function isOnLoginPage() {
	const pages = getCurrentPages();
	const route = pages[pages.length - 1]?.route || '';
	return route.includes('pages/login/index');
}

export function clearAuthSession() {
	uni.removeStorageSync('auth_token');
	uni.removeStorageSync('user_info');
}

export async function resetUserStoreSession() {
	try {
		const { useUserStore } = await import('@/store/user');
		const store = useUserStore();
		store.$patch({
			token: '',
			userInfo: null,
			hasPackage: false,
			permissions: {},
		});
	} catch (error) {
		console.warn('重置用户状态失败:', error);
	}
}

/**
 * 401 时清理登录态并跳转登录页
 */
export function handleUnauthorized(message = '请先登录') {
	clearAuthSession();
	resetUserStoreSession();

	if (isOnLoginPage()) {
		return;
	}
	if (redirectingToLogin) {
		return;
	}

	redirectingToLogin = true;
	uni.showToast({
		title: message,
		icon: 'none',
		duration: 1800,
	});

	setTimeout(() => {
		uni.navigateTo({
			url: LOGIN_PAGE,
			fail: () => {
				uni.reLaunch({ url: LOGIN_PAGE });
			},
			complete: () => {
				setTimeout(() => {
					redirectingToLogin = false;
				}, 500);
			},
		});
	}, 400);
}
