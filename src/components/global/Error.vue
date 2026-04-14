<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    message?: string
    corsHint?: boolean
    timeoutHint?: boolean
  }>(),
  {
    message: '数据加载失败，请重试',
    corsHint: false,
    timeoutHint: false,
  },
)

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="error-wrap" role="alert">
    <h3>请求异常</h3>
    <p class="error-message">{{ props.message }}</p>
    <p v-if="props.timeoutHint" class="error-hint">接口请求已超时，请检查服务是否正常运行。</p>
    <p v-if="props.corsHint" class="error-hint">检测到可能的跨域限制，请确认 DailyHotApi 已允许当前来源访问。</p>
    <button class="retry-btn" type="button" @click="emit('retry')">重试</button>
  </div>
</template>

<style scoped>
.error-wrap {
  padding: 20px 16px;
  border-radius: var(--radius-card);
  border: 1px solid rgba(232, 63, 55, 0.34);
  background: var(--panel-bg);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-wrap h3 {
  margin: 0;
  color: #c0362f;
  font-weight: 500;
  font-size: 16px;
}

.error-message {
  margin: 0;
  color: var(--text-main);
  font-size: 14px;
}

.error-hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.retry-btn {
  align-self: flex-start;
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  height: 32px;
  padding: 0 12px;
  color: var(--text-secondary);
  background: var(--panel-bg);
  cursor: pointer;
  transition: color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease);
}

.retry-btn:hover {
  color: #bc342d;
  border-color: rgba(232, 63, 55, 0.4);
  background: color-mix(in srgb, #ffc800 14%, #ffffff);
}

.retry-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(232, 63, 55, 0.16);
}

:global([data-theme='dark']) .error-wrap {
  background: var(--panel-bg);
}
</style>
