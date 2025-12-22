<template>
	<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" :stroke="color" stroke-width="2" fill="none" />
	<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" :fill="color" stroke="none" />
</template>

<script setup>
defineProps({
	color: {
		type: String,
		default: 'currentColor',
	},
});
</script>
