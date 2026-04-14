<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import SearchBar from '../business/SearchBar.vue'

const props = defineProps<{
  search: string
  theme: 'light' | 'dark'
  refreshing: boolean
  searching: boolean
  platformName: string
  platformColor: string
  favoritesMode: boolean
  favoriteCount: number
}>()

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'refresh'): void
  (e: 'toggle-favorites'): void
  (e: 'open-fortune'): void
  (e: 'open-lunch'): void
  (e: 'toggle-theme'): void
  (e: 'help'): void
}>()

const fortuneClicked = ref(false)
let fortuneTimer: number | null = null

const handleOpenFortune = () => {
  emit('open-fortune')
  fortuneClicked.value = true

  if (typeof window === 'undefined') {
    fortuneClicked.value = false
    return
  }

  if (fortuneTimer !== null) {
    window.clearTimeout(fortuneTimer)
  }

  fortuneTimer = window.setTimeout(() => {
    fortuneClicked.value = false
    fortuneTimer = null
  }, 220)
}

onUnmounted(() => {
  if (typeof window !== 'undefined' && fortuneTimer !== null) {
    window.clearTimeout(fortuneTimer)
  }
})

</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <div class="brand-wrap">
        <span class="brand-icon" aria-hidden="true">
          <img class="brand-avatar" src="/c95f4f17468ea9399e713d009e587f67.jpg" alt="米奇妙妙屋头像" />
        </span>
        <span class="mini-ear-icon" aria-hidden="true">◎</span>
        <div class="brand-text">
          <h1>米奇妙妙屋 · 全网热榜</h1>
          <p>{{ platformName }} · 聚合追踪</p>
        </div>
      </div>

      <SearchBar
        class="header-search"
        :model-value="props.search"
        :loading="props.searching"
        :focus-color="props.platformColor"
        @update:model-value="emit('update:search', $event)"
      />

      <div class="header-actions">
        <button type="button" class="action-btn" @click="emit('toggle-theme')">
          <span class="btn-icon" aria-hidden="true">◐</span>
          <span>{{ props.theme === 'dark' ? '浅色' : '深色' }}</span>
        </button>

        <button type="button" class="action-btn" :disabled="props.refreshing" @click="emit('refresh')">
          <span class="btn-icon" aria-hidden="true">↻</span>
          <span>{{ props.refreshing ? '刷新中' : '刷新' }}</span>
        </button>

        <button
          type="button"
          class="action-btn"
          :class="{ 'is-active': props.favoritesMode }"
          @click="emit('toggle-favorites')"
        >
          <span class="btn-icon" aria-hidden="true">★</span>
          <span>收藏{{ props.favoriteCount > 0 ? ` ${props.favoriteCount}` : '' }}</span>
        </button>

        <button type="button" class="action-btn" @click="emit('help')">
          <span class="btn-icon" aria-hidden="true">?</span>
          <span>帮助</span>
        </button>

        <div class="fortune-entry-wrap" :class="{ 'is-clicked': fortuneClicked }">
          <button
            type="button"
            class="entry-icon-btn fortune-entry-btn"
            :class="{ 'is-clicked': fortuneClicked }"
            aria-label="米奇今日运势"
            @click="handleOpenFortune"
          >
            <span class="fortune-icon" aria-hidden="true">✦</span>
          </button>
          <span class="fortune-tip" aria-hidden="true">米奇今日运势</span>
        </div>

        <div class="lunch-entry-wrap">
          <button type="button" class="entry-icon-btn lunch-entry-btn" aria-label="米奇今天吃啥" @click="emit('open-lunch')">
            <span class="lunch-icon" aria-hidden="true">🍱</span>
          </button>
          <span class="lunch-tip" aria-hidden="true">米奇今天吃啥？</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  border-bottom: 1px solid var(--color-divider);
  background:
    radial-gradient(circle at 28px 14px, rgba(232, 63, 55, 0.07) 0 6px, rgba(232, 63, 55, 0) 7px),
    radial-gradient(circle at 42px 14px, rgba(232, 63, 55, 0.07) 0 6px, rgba(232, 63, 55, 0) 7px),
    radial-gradient(circle at 35px 23px, rgba(232, 63, 55, 0.07) 0 8px, rgba(232, 63, 55, 0) 9px),
    linear-gradient(180deg, rgba(255, 253, 249, 0.97), rgba(255, 248, 240, 0.97));
  backdrop-filter: blur(8px);
}

.header-inner {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  height: 64px;
  display: grid;
  grid-template-columns: auto minmax(260px, 500px) auto;
  gap: 16px;
  align-items: center;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: block;
  overflow: hidden;
  border: 1px solid rgba(232, 63, 55, 0.24);
  position: relative;
  box-shadow: 0 8px 16px rgba(232, 63, 55, 0.18);
}

.brand-icon::before,
.brand-icon::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2b2520;
  top: -5px;
}

.brand-icon::before {
  left: -1px;
}

.brand-icon::after {
  right: -1px;
}

.brand-avatar {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
}

.mini-ear-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  font-size: 11px;
  color: #b35344;
  border: 1px solid rgba(232, 63, 55, 0.28);
  background: linear-gradient(135deg, rgba(255, 200, 0, 0.34), rgba(232, 63, 55, 0.1));
  box-shadow: 0 6px 12px rgba(232, 63, 55, 0.12);
}

.brand-text h1 {
  margin: 0;
  color: #2d2520;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #896f5f;
}

.header-search {
  min-width: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.lunch-entry-wrap {
  position: relative;
  display: inline-flex;
}

.fortune-entry-wrap {
  position: relative;
  display: inline-flex;
}

.entry-icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(232, 63, 55, 0.24);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(232, 63, 55, 0.2);
  background: rgba(255, 255, 255, 0.92);
  color: #775843;
  border-radius: 12px;
  height: 36px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease);
}

.action-btn:hover:not(:disabled) {
  border-color: rgba(232, 63, 55, 0.44);
  color: #bc342d;
  background: color-mix(in srgb, #ffc800 16%, #ffffff);
  transform: scale(1.02);
  box-shadow: 0 10px 18px rgba(232, 63, 55, 0.12);
}

.action-btn:disabled {
  opacity: 0.66;
  cursor: not-allowed;
}

.action-btn:focus-visible,
.lunch-entry-btn:focus-visible,
.fortune-entry-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(232, 63, 55, 0.16);
}

.action-btn.is-active {
  border-color: rgba(232, 63, 55, 0.46);
  color: #b5302a;
  background: color-mix(in srgb, #ffc800 20%, #fff6e5);
}

.fortune-entry-btn {
  border-color: rgba(232, 63, 55, 0.34);
  color: #a03c35;
  background: color-mix(in srgb, #ffc800 22%, #ffffff);
}

.fortune-entry-btn:hover {
  border-color: rgba(232, 63, 55, 0.62);
  background: color-mix(in srgb, #ffc800 34%, #ffffff);
  color: #8f2f2a;
  transform: scale(1.02);
  box-shadow: 0 10px 20px rgba(232, 63, 55, 0.15);
}

.fortune-entry-btn.is-clicked {
  animation: fortune-shake 0.2s ease-out;
}

.fortune-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  color: #ffffff;
  font-size: 14px;
  line-height: 1;
  background: linear-gradient(135deg, #e83f37, #ff9300);
  box-shadow: 0 5px 10px rgba(232, 63, 55, 0.24);
  transform: rotate(0deg) scale(1);
  transition: transform var(--motion-duration) var(--motion-ease);
}

.fortune-entry-btn:hover .fortune-icon {
  transform: rotate(15deg) scale(1.17);
}

.fortune-tip {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  transform: translateY(-4px);
  border: 1px solid rgba(232, 63, 55, 0.42);
  border-radius: 10px;
  background: #ffffff;
  color: #a53d36;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  padding: 6px 8px;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 10px 20px rgba(232, 63, 55, 0.16);
  transition: opacity var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease);
  font-family: 'YouYuan', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.fortune-entry-wrap:hover .fortune-tip,
.fortune-entry-wrap:focus-within .fortune-tip {
  opacity: 1;
  transform: translateY(0);
}

.fortune-entry-wrap.is-clicked .fortune-tip {
  opacity: 0;
  transform: translateY(-4px);
}

.lunch-entry-btn {
  border-color: rgba(232, 63, 55, 0.34);
  color: #9a4029;
  background: color-mix(in srgb, #ffc800 20%, #fff7eb);
}

.lunch-entry-btn:hover {
  border-color: rgba(232, 63, 55, 0.72);
  background: color-mix(in srgb, #ffc800 34%, #ffffff);
  color: #93361f;
  transform: scale(1.02);
  box-shadow: 0 10px 20px rgba(232, 63, 55, 0.15);
}

.lunch-icon {
  display: inline-grid;
  place-items: center;
  font-size: 18px;
  line-height: 1;
  transform: translateY(-0.5px);
  transition: transform var(--motion-duration) var(--motion-ease);
}

.lunch-entry-btn:hover .lunch-icon {
  transform: translateY(-1px) scale(1.05);
}

.lunch-tip {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  transform: translateY(-4px);
  border: 1px solid rgba(232, 63, 55, 0.32);
  border-radius: 999px;
  background: #fff6e6;
  color: #b63a34;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  padding: 4px 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease);
}

.lunch-entry-wrap:hover .lunch-tip,
.lunch-entry-wrap:focus-within .lunch-tip {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fortune-shake {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(5deg);
  }
  75% {
    transform: rotate(-4deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.btn-icon {
  display: inline-grid;
  place-items: center;
  width: 14px;
  color: currentColor;
}

:global([data-theme='dark']) .site-header {
  background:
    radial-gradient(circle at 28px 14px, rgba(255, 200, 0, 0.13) 0 6px, rgba(255, 200, 0, 0) 7px),
    radial-gradient(circle at 42px 14px, rgba(255, 200, 0, 0.13) 0 6px, rgba(255, 200, 0, 0) 7px),
    radial-gradient(circle at 35px 23px, rgba(255, 200, 0, 0.13) 0 8px, rgba(255, 200, 0, 0) 9px),
    linear-gradient(180deg, rgba(56, 23, 29, 0.95), rgba(43, 16, 20, 0.95));
  border-bottom-color: var(--color-divider);
}

:global([data-theme='dark']) .action-btn,
:global([data-theme='dark']) .lunch-entry-btn,
:global([data-theme='dark']) .fortune-entry-btn {
  background: color-mix(in srgb, var(--panel-soft) 84%, transparent);
  color: var(--text-secondary);
}

:global([data-theme='dark']) .brand-text h1 {
  color: #ffeed9;
}

:global([data-theme='dark']) .brand-text p {
  color: #d7b79f;
}

:global([data-theme='dark']) .mini-ear-icon {
  color: #ffd369;
  border-color: rgba(255, 200, 0, 0.36);
  background: rgba(255, 200, 0, 0.14);
}

@media (max-width: 980px) {
  .header-inner {
    width: min(100%, calc(100% - 24px));
    height: auto;
    min-height: 64px;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'brand actions'
      'search search';
    gap: 8px 10px;
    padding: 10px 0;
  }

  .brand-wrap {
    grid-area: brand;
  }

  .header-search {
    grid-area: search;
  }

  .header-actions {
    grid-area: actions;
    justify-content: flex-end;
  }

  .brand-text p {
    display: none;
  }

  .mini-ear-icon {
    display: none;
  }

  .action-btn {
    padding: 0 8px;
  }

  .action-btn span:last-child {
    display: none;
  }

  .lunch-tip {
    display: none;
  }

  .fortune-tip {
    display: none;
  }
}
</style>
