<template>
  <path
    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
    :fill="color"
    stroke="none"
  />
  <circle
    cx="12"
    cy="7"
    r="4"
    :fill="color"
    stroke="none"
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

