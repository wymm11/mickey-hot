<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: '暂无热点数据',
    description: '请切换平台或稍后再试。',
  },
)
</script>

<template>
  <div class="empty-wrap">
    <img class="empty-illustration" src="/c95f4f17468ea9399e713d009e587f67.jpg" alt="米奇形象插画" loading="lazy" />
    <div class="empty-icon" aria-hidden="true">○</div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
</template>

<style scoped>
.empty-wrap {
  padding: 36px 16px;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--panel-bg);
  box-shadow: var(--shadow-card);
}

.empty-illustration {
  width: min(260px, 76%);
  display: block;
  margin: 0 auto 12px;
  border-radius: 16px;
  border: 1px solid rgba(232, 63, 55, 0.2);
  box-shadow: 0 12px 24px rgba(17, 24, 39, 0.12);
}

.empty-icon {
  width: 28px;
  height: 28px;
  margin: 0 auto 10px;
  border-radius: 10px;
  border: 1px solid rgba(232, 63, 55, 0.34);
  color: #bb3b33;
  display: grid;
  place-items: center;
  font-size: 10px;
  background: color-mix(in srgb, #ffc800 16%, #ffffff);
}

.empty-wrap h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: var(--text-main);
  font-weight: 500;
}

.empty-wrap p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

@media (max-width: 900px) {
  .empty-illustration {
    width: min(220px, 88%);
  }
}
</style>
