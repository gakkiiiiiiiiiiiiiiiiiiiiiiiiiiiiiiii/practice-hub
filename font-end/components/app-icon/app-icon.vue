<template>
	<view class="app-icon" :class="customClass" :style="iconStyle" @click="handleClick">
		<svg
			:style="{ width: iconSize, height: iconSize }"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
      <path
        v-if="iconPaths && iconPaths[name]"
        :d="iconPaths[name]"
        :fill="color || 'currentColor'"
        :stroke="strokeColor || 'none'"
        :stroke-width="strokeWidth || 0"
      />
		</svg>
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

const iconSize = computed(() => {
	// 如果是数字，默认使用 rpx（uni-app 推荐）
	if (typeof props.size === 'number') {
		return `${props.size}rpx`;
	}
	return props.size;
});

const iconStyle = computed(() => {
	const style = {};
	style.width = iconSize.value;
	style.height = iconSize.value;
	if (props.color && !props.strokeColor) {
		style.color = props.color;
	}
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
}
</style>
