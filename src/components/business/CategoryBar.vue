<script setup lang="ts">
import type { ResolvedTheme } from '../../constants/brand'
import type { PlatformCategory } from '../../types/hot'

withDefaults(
  defineProps<{
    categories: Array<{ key: PlatformCategory; label: string }>
    modelValue: PlatformCategory
    theme?: ResolvedTheme
  }>(),
  {
    theme: 'light',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: PlatformCategory): void
}>()

const onSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value as PlatformCategory)
}
</script>

<template>
  <div class="category-bar">
    <div class="category-select-wrap">
      <select :value="modelValue" @change="onSelectChange">
        <option v-for="item in categories" :key="item.key" :value="item.key">{{ item.label }}</option>
      </select>
    </div>

    <div class="category-grid" role="tablist" aria-label="platform-category">
      <button
        v-for="item in categories"
        :key="item.key"
        type="button"
        class="category-btn"
        :class="{ active: modelValue === item.key }"
        @click="emit('update:modelValue', item.key)"
      >
        <span class="category-label">{{ item.label }}</span>
        <span class="category-line" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-bar {
  min-width: 0;
}

.category-select-wrap {
  display: none;
}

.category-select-wrap select {
  width: 100%;
  min-height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--panel-bg);
  color: var(--text-main);
  padding: 0 10px;
  font-size: 12px;
}

.category-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px;
  border-radius: var(--radius-card);
  background: linear-gradient(135deg, #fffdf8, #fff4e4);
  border: 1px solid rgba(232, 63, 55, 0.15);
}

.category-btn {
  position: relative;
  border: 1px solid rgba(232, 63, 55, 0.15);
  border-radius: 999px;
  background: #ffffff;
  min-height: 32px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--motion-duration) var(--motion-ease), color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease);
}

.category-label {
  color: #7c5f4c;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.category-line {
  display: none;
}

.category-btn:hover {
  border-color: rgba(232, 63, 55, 0.35);
  background: color-mix(in srgb, #ffc800 16%, #ffffff);
  transform: translateY(-1px);
}

.category-btn:hover .category-label,
.category-btn.active .category-label {
  color: #b4382f;
}

.category-btn.active {
  border-color: transparent;
  background: linear-gradient(135deg, #e83f37, #ff9f17);
  box-shadow: 0 10px 18px rgba(232, 63, 55, 0.2);
}

.category-btn.active .category-label {
  color: #ffffff;
}

.category-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(232, 63, 55, 0.15);
}

:global([data-theme='dark']) .category-grid {
  background: linear-gradient(130deg, rgba(68, 32, 38, 0.9), rgba(52, 20, 25, 0.9));
  border-color: rgba(255, 200, 0, 0.2);
}

:global([data-theme='dark']) .category-btn {
  border-color: rgba(255, 200, 0, 0.18);
  background: rgba(255, 255, 255, 0.03);
}

:global([data-theme='dark']) .category-label {
  color: var(--text-secondary);
}

:global([data-theme='dark']) .category-btn.active {
  background: linear-gradient(135deg, #e83f37, #ffc800);
}

@media (max-width: 1200px) {
  .category-grid {
    gap: 8px;
  }
}

@media (max-width: 900px) {
  .category-select-wrap {
    display: block;
  }

  .category-grid {
    display: none;
  }
}
</style>
