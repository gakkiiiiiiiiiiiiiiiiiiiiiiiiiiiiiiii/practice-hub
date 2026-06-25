import { getImageUrl } from '@/utils/image';

const decodeHtmlEntities = (html) => {
	let decoded = String(html || '');

	for (let i = 0; i < 3; i += 1) {
		const previous = decoded;
		decoded = decoded
			.replace(/&nbsp;/gi, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;|&apos;/g, "'")
			.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
			.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

		if (decoded === previous) break;
	}

	return decoded;
};

/**
 * 将富文本 HTML 转为微信小程序 rich-text 可解析的格式
 * 微信 rich-text 不支持 h1-h6 等标签，含这些标签时可能整段显示为源码
 */
export function formatHtmlForMpRichText(html) {
	if (!html) return '';

	let content = decodeHtmlEntities(html).trim();
	if (!content) return '';

	const headingSizes = {
		1: '36rpx',
		2: '32rpx',
		3: '30rpx',
		4: '28rpx',
		5: '26rpx',
		6: '24rpx',
	};

	content = content.replace(/<h([1-6])(\s[^>]*)?>/gi, (_, level, attrs = '') => {
		const fontSize = headingSizes[level] || '30rpx';
		return `<div${attrs} style="font-size:${fontSize};font-weight:600;line-height:1.5;margin:12rpx 0;">`;
	});
	content = content.replace(/<\/h[1-6]>/gi, '</div>');

	content = content.replace(/<\/?(iframe|video|audio|script|style)[^>]*>/gi, '');

	content = content.replace(/<img([^>]*?)src=["']([^"']+)["']/gi, (match, attrs, src) => {
		const resolved = getImageUrl(src);
		return `<img${attrs}src="${resolved}"`;
	});

	return content;
}
