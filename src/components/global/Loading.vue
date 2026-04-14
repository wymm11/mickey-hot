<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    rows?: number
  }>(),
  {
    rows: 8,
  },
)

const widths = computed(() =>
  Array.from({ length: props.rows }, (_, index) => `${92 - (index % 4) * 10}%`),
)
</script>

<template>
  <div class="loading-skeleton" aria-label="loading">
    <div v-for="(width, index) in widths" :key="index" class="skeleton-row" :style="{ width }" />
  </div>
</template>

<style scoped>
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 0;
}

.skeleton-row {
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    rgba(241, 215, 193, 0.72) 25%,
    rgba(255, 248, 240, 0.98) 42%,
    rgba(241, 215, 193, 0.72) 62%
  );
  background-size: 220% 100%;
  animation: shimmer 1.2s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

:global([data-theme='dark']) .skeleton-row {
  background: linear-gradient(
    90deg,
    rgba(102, 48, 56, 0.55) 25%,
    rgba(128, 62, 71, 0.35) 42%,
    rgba(102, 48, 56, 0.55) 62%
  );
}
</style>
