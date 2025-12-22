<template>
  <path
    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
    :stroke="color"
    stroke-width="2"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <circle
    cx="12"
    cy="7"
    r="4"
    :stroke="color"
    stroke-width="2"
    fill="none"
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

