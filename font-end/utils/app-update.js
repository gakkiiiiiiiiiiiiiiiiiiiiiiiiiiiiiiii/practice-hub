import { getMiniappVersion } from '@/api/index';

const LOCAL_VERSION = '1.4.0';
let serverCheckPromise = null;
let outdatedPromptVisible = false;
let updateReadyPromptVisible = false;

export function compareVersion(left, right) {
	const parseParts = (value) =>
		String(value || '0')
			.trim()
			.replace(/^v/i, '')
			.split('.')
			.map((part) => {
				const matched = part.match(/^\d+/);
				return matched ? Number(matched[0]) : 0;
			});

	const leftParts = parseParts(left);
	const rightParts = parseParts(right);
	const maxLength = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < maxLength; index += 1) {
		const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
		if (diff > 0) return 1;
		if (diff < 0) return -1;
	}
	return 0;
}

export function getClientVersion() {
	// #ifdef MP-WEIXIN
	try {
		const accountInfo = uni.getAccountInfoSync?.();
		const miniProgram = accountInfo?.miniProgram;
		if (miniProgram?.envVersion === 'develop') {
			return LOCAL_VERSION;
		}
		if (miniProgram?.version) {
			return miniProgram.version;
		}
	} catch (error) {
		console.warn('读取小程序版本失败:', error);
	}
	// #endif

	return LOCAL_VERSION;
}

function promptReenterMiniProgram(content) {
	if (outdatedPromptVisible) return;
	outdatedPromptVisible = true;
	uni.showModal({
		title: '版本更新提示',
		content: content || '当前版本较旧，请完全退出小程序后重新进入，以加载最新版本。',
		showCancel: false,
		confirmText: '我知道了',
		complete: () => {
			outdatedPromptVisible = false;
		},
	});
}

function promptApplyUpdate(updateManager) {
	if (updateReadyPromptVisible) return;
	updateReadyPromptVisible = true;
	uni.showModal({
		title: '发现新版本',
		content: '新版本已准备好，请重启小程序后继续使用。',
		confirmText: '立即重启',
		showCancel: false,
		success: (result) => {
			if (result.confirm && updateManager?.applyUpdate) {
				updateManager.applyUpdate();
			}
		},
		complete: () => {
			updateReadyPromptVisible = false;
		},
	});
}

export function initWechatAutoUpdate() {
	// #ifdef MP-WEIXIN
	if (typeof wx === 'undefined' || typeof wx.getUpdateManager !== 'function') {
		return;
	}

	const updateManager = wx.getUpdateManager();
	if (!updateManager) return;

	updateManager.onUpdateReady(() => {
		promptApplyUpdate(updateManager);
	});

	updateManager.onUpdateFailed(() => {
		promptReenterMiniProgram('新版本下载失败，请关闭小程序后重新进入，或稍后再试。');
	});
	// #endif
}

async function checkServerVersionPolicy() {
	const currentVersion = getClientVersion();
	if (!currentVersion) return;

	let policy = null;
	try {
		policy = await getMiniappVersion();
	} catch (error) {
		console.warn('获取小程序版本策略失败:', error);
		return;
	}

	const minVersion = String(policy?.minVersion || '').trim();
	if (!minVersion) return;

	if (compareVersion(currentVersion, minVersion) >= 0) {
		return;
	}

	const latestVersion = String(policy?.latestVersion || minVersion).trim();
	const tip = String(policy?.tip || '').trim();
	const message = tip
		? `${tip}\n\n当前版本：${currentVersion}\n最新版本：${latestVersion}`
		: `当前版本：${currentVersion}\n最新版本：${latestVersion}\n请完全退出小程序后重新进入。`;

	promptReenterMiniProgram(message);
}

export function checkAppVersionUpdate(options = {}) {
	const { force = false } = options;

	if (!force && serverCheckPromise) {
		return serverCheckPromise;
	}

	serverCheckPromise = Promise.resolve()
		.then(() => {
			initWechatAutoUpdate();
			return checkServerVersionPolicy();
		})
		.finally(() => {
			if (!force) {
				setTimeout(() => {
					serverCheckPromise = null;
				}, 3000);
			}
		});

	return serverCheckPromise;
}
