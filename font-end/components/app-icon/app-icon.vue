<template>
	<view class="app-icon" :class="customClass" :style="iconStyle" @click="handleClick">
		<!-- #ifdef MP-WEIXIN -->
		<!-- 微信小程序使用 image 标签渲染 SVG -->
		<image
			v-if="svgDataUrl"
			:src="svgDataUrl"
			:style="{ width: iconSize, height: iconSize, display: 'block' }"
			mode="aspectFit"
		/>
		<!-- #endif -->

		<!-- #ifndef MP-WEIXIN -->
		<!-- 其他平台使用内联 SVG -->
		<svg
			:style="{ width: iconSize, height: iconSize }"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				v-if="iconPaths && iconPaths[iconName]"
				:d="iconPaths[iconName]"
				:fill="fillColor"
				:stroke="strokeColor || 'none'"
				:stroke-width="strokeWidth || (strokeColor ? 2 : 0)"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<!-- #endif -->
	</view>
</template>

<script setup>
import { computed } from 'vue';
import { iconPaths } from './icon-paths.js';

const props = defineProps({
	name: {
		type: String,
		required: true,
	},
	size: {
		type: [Number, String],
		default: 24,
	},
	color: {
		type: String,
		default: '',
	},
	strokeColor: {
		type: String,
		default: '',
	},
	strokeWidth: {
		type: [Number, String],
		default: 0,
	},
	customClass: {
		type: String,
		default: '',
	},
});

const emit = defineEmits(['click']);

// 解构 props 以避免 TypeScript 警告
const iconName = computed(() => props.name);

const iconSize = computed(() => {
	// 如果是数字，默认使用 rpx（uni-app 推荐）
	if (typeof props.size === 'number') {
		return `${props.size}rpx`;
	}
	return props.size;
});

const fillColor = computed(() => {
	return props.strokeColor ? 'none' : props.color || 'currentColor';
});

// 为微信小程序生成 SVG Data URL
const svgDataUrl = computed(() => {
	// #ifdef MP-WEIXIN
	if (!iconPaths || !iconPaths[iconName.value]) {
		console.warn('图标路径不存在:', iconName.value);
		return '';
	}

	const pathData = iconPaths[iconName.value];
	const fill = fillColor.value === 'currentColor' ? '#666666' : fillColor.value;
	const stroke = props.strokeColor || 'none';
	const strokeWidth = props.strokeWidth || (props.strokeColor ? 2 : 0);

	// 构建 SVG 字符串
	const svgContent = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

	// 使用 URI 编码（微信小程序支持）
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
	// #endif

	// #ifndef MP-WEIXIN
	return '';
	// #endif
});

const iconStyle = computed(() => {
	const style = {};
	style.width = iconSize.value;
	style.height = iconSize.value;
	return style;
});

const handleClick = (e) => {
	emit('click', e);
};
</script>

<style lang="scss" scoped>
.app-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	vertical-align: middle;
	flex-shrink: 0;

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	image {
		display: block;
	}
}
</style>
