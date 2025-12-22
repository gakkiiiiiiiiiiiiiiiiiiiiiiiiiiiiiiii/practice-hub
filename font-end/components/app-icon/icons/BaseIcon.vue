<template>
	<path
		:d="path"
		:fill="color"
		:stroke="stroke"
		:stroke-width="strokeWidth"
		:fill-rule="fillRule"
		:stroke-linecap="strokeLinecap"
		:stroke-linejoin="strokeLinejoin"
	/>
</template>

<script setup>
defineProps({
	color: {
		type: String,
		default: 'currentColor',
	},
	stroke: {
		type: String,
		default: 'none',
	},
	strokeWidth: {
		type: [Number, String],
		default: 0,
	},
	fillRule: {
		type: String,
		default: 'evenodd',
	},
	strokeLinecap: {
		type: String,
		default: 'round',
	},
	strokeLinejoin: {
		type: String,
		default: 'round',
	},
	path: {
		type: String,
		required: true,
	},
});
</script>
