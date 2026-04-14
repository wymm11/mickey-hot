<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    loading?: boolean
    placeholder?: string
    focusColor?: string
  }>(),
  {
    loading: false,
    placeholder: '搜索全网话题（跨平台聚合）',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const clearInput = () => {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="search-wrap" :style="{ '--focus-color': focusColor || 'var(--brand-blue)' }">
    <span class="search-icon" aria-hidden="true">⌕</span>
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      spellcheck="false"
      @input="onInput"
    />

    <button v-if="modelValue" class="clear-btn" type="button" @click="clearInput">清空</button>
    <span v-if="loading" class="loading-dot" aria-label="searching" />
  </div>
</template>

<style scoped>
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid rgba(232, 63, 55, 0.2);
  border-radius: 999px;
  height: 40px;
  padding: 0 10px 0 34px;
  background: rgba(255, 255, 255, 0.9);
  transition: border-color var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease);
}

.search-wrap:focus-within {
  border-color: var(--focus-color);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--focus-color) 18%, transparent);
}

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #a27f65;
  font-size: 0.84rem;
}

.search-wrap input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-main);
  font-size: 14px;
}

.clear-btn {
  border: none;
  background: transparent;
  color: #a07d64;
  cursor: pointer;
  font-size: 12px;
  transition: color var(--motion-duration) var(--motion-ease);
}

.clear-btn:hover {
  color: #c63a31;
}

.loading-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(232, 63, 55, 0.2);
  border-top-color: #e83f37;
  animation: rotate 0.8s linear infinite;
}

:global([data-theme='dark']) .search-wrap {
  background: color-mix(in srgb, var(--panel-soft) 84%, transparent);
  border-color: rgba(255, 200, 0, 0.28);
}

:global([data-theme='dark']) .search-icon,
:global([data-theme='dark']) .clear-btn {
  color: var(--text-muted);
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
