<template>
  <path
    d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"
    :stroke="color"
    stroke-width="2"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <line
    x1="9"
    y1="12"
    x2="15"
    y2="12"
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
  />
</template>

<script setup>
defineProps({
  color: {
    type: String,
    default: 'currentColor'
  }
})
</script>

