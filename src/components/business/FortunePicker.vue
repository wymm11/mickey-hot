<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  buildFortuneResult,
  CONSTELLATION_LIST,
  findConstellationByName,
  type ConstellationItem,
  type FortuneResult,
} from '../../constants/fortune'
import type { NormalizedHotItem } from '../../types/hot'
import { formatHotValue } from '../../utils/format'

const props = withDefaults(
  defineProps<{
    open: boolean
    sourceNews?: NormalizedHotItem[]
  }>(),
  {
    sourceNews: () => [],
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

type FortuneStatus = 'idle' | 'rolling' | 'result'

const FORTUNE_FAVORITE_STORAGE_KEY = 'miqi-favorite-constellations-v1'

const status = ref<FortuneStatus>('idle')
const selectedConstellationName = ref(CONSTELLATION_LIST[0]?.name || '')
const fortuneResult = ref<FortuneResult | null>(null)
const shareState = ref<'idle' | 'done' | 'error'>('idle')
const drawNonce = ref(0)
const favoriteConstellations = ref<string[]>([])

let rollingTimer: number | null = null
let shareResetTimer: number | null = null

const rollingSymbols = ['✦', '✧', '✶', '✷', '✹', '✺']

const todayText = computed(() => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const selectedConstellation = computed<ConstellationItem | null>(() => {
  if (!selectedConstellationName.value) {
    return null
  }

  return findConstellationByName(selectedConstellationName.value) || null
})

const panelThemeStyle = computed<Record<string, string>>(() => {
  const color = selectedConstellation.value?.color || '#7c6cf0'
  return {
    '--fortune-theme': color,
    '--fortune-red': '#e83f37',
    '--fortune-yellow': '#ffc800',
  }
})

const favoriteConstellationSet = computed(() => new Set(favoriteConstellations.value))

const isSelectedFavorite = computed(() => {
  if (!selectedConstellation.value) {
    return false
  }

  return favoriteConstellationSet.value.has(selectedConstellation.value.name)
})

const measureButtonText = computed(() => {
  if (status.value === 'rolling') {
    return '测算中...'
  }

  return '测算今日运势'
})

const shareButtonText = computed(() => {
  if (shareState.value === 'done') {
    return '已复制'
  }

  if (shareState.value === 'error') {
    return '复制失败'
  }

  return '一键复制文案'
})

const ensureSelectedConstellation = (): ConstellationItem | null => {
  if (selectedConstellation.value) {
    return selectedConstellation.value
  }

  const fallback = CONSTELLATION_LIST[0]
  if (!fallback) {
    return null
  }

  selectedConstellationName.value = fallback.name
  return fallback
}

const clearRollingTimer = () => {
  if (typeof window === 'undefined') {
    rollingTimer = null
    return
  }

  if (rollingTimer !== null) {
    window.clearTimeout(rollingTimer)
    rollingTimer = null
  }
}

const clearShareTimer = () => {
  if (typeof window === 'undefined') {
    shareResetTimer = null
    return
  }

  if (shareResetTimer !== null) {
    window.clearTimeout(shareResetTimer)
    shareResetTimer = null
  }
}

const persistFavoriteConstellations = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(FORTUNE_FAVORITE_STORAGE_KEY, JSON.stringify(favoriteConstellations.value))
}

const restoreFavoriteConstellations = () => {
  if (typeof window === 'undefined') {
    favoriteConstellations.value = []
    return
  }

  const raw = window.localStorage.getItem(FORTUNE_FAVORITE_STORAGE_KEY)
  if (!raw) {
    favoriteConstellations.value = []
    return
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      favoriteConstellations.value = []
      return
    }

    const validSet = new Set(CONSTELLATION_LIST.map((item) => item.name))
    favoriteConstellations.value = parsed.filter((item): item is string => typeof item === 'string' && validSet.has(item))
  } catch {
    favoriteConstellations.value = []
  }
}

const closePicker = () => {
  emit('close')
}

const onMaskClick = (event: MouseEvent) => {
  if (event.target !== event.currentTarget) {
    return
  }

  closePicker()
}

const selectConstellation = (name: string) => {
  selectedConstellationName.value = name

  if (status.value === 'result') {
    status.value = 'idle'
  }
}

const startMeasure = () => {
  if (status.value === 'rolling') {
    return
  }

  const target = ensureSelectedConstellation()
  if (!target) {
    return
  }

  clearRollingTimer()
  status.value = 'rolling'
  shareState.value = 'idle'

  if (typeof window === 'undefined') {
    drawNonce.value += 1
    fortuneResult.value = buildFortuneResult(target, props.sourceNews, new Date(), String(drawNonce.value))
    status.value = 'result'
    return
  }

  rollingTimer = window.setTimeout(() => {
    drawNonce.value += 1
    fortuneResult.value = buildFortuneResult(target, props.sourceNews, new Date(), String(drawNonce.value))
    status.value = 'result'
    rollingTimer = null
  }, 1280)
}

const resetShareStateDelay = () => {
  clearShareTimer()

  if (typeof window === 'undefined') {
    shareState.value = 'idle'
    return
  }

  shareResetTimer = window.setTimeout(() => {
    shareState.value = 'idle'
    shareResetTimer = null
  }, 1200)
}

const handleShare = async () => {
  const result = fortuneResult.value
  const constellation = selectedConstellation.value
  if (!result || !constellation) {
    return
  }

  const text = [
    `今日运势｜${constellation.name}（${todayText.value}）`,
    `综合：${result.general}｜爱情：${result.love}星｜事业：${result.career}星｜财运：${result.wealth}星`,
    `宜：${result.suitable.join(' / ')}`,
    `忌：${result.unsuitable.join(' / ')}`,
    `毒舌点评：${result.roast}`,
    `专属热点：${result.customNews[0]?.title || '暂无'}`,
  ].join('\n')

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      shareState.value = 'done'
      resetShareStateDelay()
      return
    }

    shareState.value = 'error'
  } catch {
    shareState.value = 'error'
  }

  resetShareStateDelay()
}

const formatHot = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '--'
  }

  return formatHotValue(value)
}

const handleToggleFavoriteConstellation = () => {
  const selected = selectedConstellation.value
  if (!selected) {
    return
  }

  const currentSet = new Set(favoriteConstellationSet.value)
  if (currentSet.has(selected.name)) {
    currentSet.delete(selected.name)
  } else {
    currentSet.add(selected.name)
  }

  favoriteConstellations.value = Array.from(currentSet)
  persistFavoriteConstellations()
}

onMounted(() => {
  restoreFavoriteConstellations()
})

watch(
  () => props.open,
  (open) => {
    if (open) {
      if (!selectedConstellationName.value) {
        selectedConstellationName.value = CONSTELLATION_LIST[0]?.name || ''
      }
      status.value = 'idle'
      shareState.value = 'idle'
      return
    }

    clearRollingTimer()
    clearShareTimer()
    shareState.value = 'idle'
  },
)

watch(
  () => selectedConstellationName.value,
  () => {
    if (!props.open) {
      return
    }

    if (status.value === 'rolling') {
      return
    }

    if (status.value === 'result') {
      status.value = 'idle'
    }
  },
)

onUnmounted(() => {
  clearRollingTimer()
  clearShareTimer()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fortune-fade">
      <div v-if="open" class="fortune-overlay" @click="onMaskClick">
        <section class="fortune-panel" :style="panelThemeStyle" role="dialog" aria-modal="true" aria-label="今日运势测算器">
          <header class="fortune-header">
            <div>
              <h2>米奇今日运势</h2>
              <p>星星牌组测算 · 红黄幸运能量</p>
            </div>
            <button type="button" class="close-btn" aria-label="关闭" @click="closePicker">✕</button>
          </header>

          <main class="fortune-main">
            <section class="fortune-selector" aria-label="星座选择">
              <div class="selected-sign-row" v-if="selectedConstellation">
                <span class="selected-sign-chip" :style="{ '--const-color': selectedConstellation.color }">
                  <span class="selected-sign-icon" aria-hidden="true">{{ selectedConstellation.icon }}</span>
                  <span>{{ selectedConstellation.name }}</span>
                </span>
                <span class="selected-sign-tip">{{ selectedConstellation.dates }} · {{ selectedConstellation.trait }}</span>
              </div>

              <div class="constellation-grid" role="listbox" aria-label="星座选择列表">
                <button
                  v-for="item in CONSTELLATION_LIST"
                  :key="item.name"
                  type="button"
                  class="constellation-btn"
                  :class="{ active: selectedConstellationName === item.name }"
                  :style="{ '--const-color': item.color }"
                  @click="selectConstellation(item.name)"
                >
                  <span class="constellation-icon" aria-hidden="true">{{ item.icon }}</span>
                  <span class="constellation-name">{{ item.name }}</span>
                </button>
              </div>
            </section>

            <section v-if="status === 'rolling'" class="state-rolling" role="status" aria-live="polite">
              <div class="star-loader" aria-hidden="true">
                <span class="loader-ring ring-a" />
                <span class="loader-ring ring-b" />
                <span class="loader-core">✦</span>
                <span
                  v-for="(symbol, index) in rollingSymbols"
                  :key="`${symbol}-${index}`"
                  class="loader-star"
                  :style="{ '--star-delay': `${index * 0.12}s` }"
                >
                  {{ symbol }}
                </span>
              </div>
              <p>米奇星星牌正在旋转，测算你今天的运势关键词...</p>
            </section>

            <section v-else-if="status === 'result' && selectedConstellation && fortuneResult" class="state-result">
              <header class="result-head">
                <div class="sign-badge" :style="{ '--const-color': selectedConstellation.color }">
                  <span class="sign-icon" aria-hidden="true">{{ selectedConstellation.icon }}</span>
                </div>
                <div>
                  <h3>{{ selectedConstellation.name }} · {{ todayText }}</h3>
                  <p>{{ selectedConstellation.dates }} · {{ selectedConstellation.trait }}</p>
                </div>
                <div class="result-actions-inline">
                  <span class="general-level">{{ fortuneResult.general }}</span>
                  <button
                    type="button"
                    class="favorite-sign-btn"
                    :class="{ active: isSelectedFavorite }"
                    @click="handleToggleFavoriteConstellation"
                  >
                    {{ isSelectedFavorite ? '★ 已收藏' : '☆ 收藏星座' }}
                  </button>
                </div>
              </header>

              <section class="fortune-card-grid">
                <article class="fortune-card general-card">
                  <h4>综合运势</h4>
                  <p class="general-value">{{ fortuneResult.general }}</p>
                  <p class="general-desc">{{ fortuneResult.desc }}</p>
                </article>

                <article class="fortune-card score-card">
                  <h4>爱情</h4>
                  <div class="star-row">
                    <span v-for="index in 5" :key="`love-${index}`" :class="{ active: index <= fortuneResult.love }">★</span>
                  </div>
                </article>

                <article class="fortune-card score-card">
                  <h4>事业</h4>
                  <div class="star-row">
                    <span v-for="index in 5" :key="`career-${index}`" :class="{ active: index <= fortuneResult.career }">★</span>
                  </div>
                </article>

                <article class="fortune-card score-card">
                  <h4>财运</h4>
                  <div class="star-row">
                    <span v-for="index in 5" :key="`wealth-${index}`" :class="{ active: index <= fortuneResult.wealth }">★</span>
                  </div>
                </article>

                <article class="fortune-card advice-card">
                  <h4>宜 & 忌</h4>
                  <div class="advice-columns">
                    <div>
                      <strong>宜</strong>
                      <ul>
                        <li v-for="item in fortuneResult.suitable" :key="`good-${item}`">✅ {{ item }}</li>
                      </ul>
                    </div>
                    <div>
                      <strong>忌</strong>
                      <ul>
                        <li v-for="item in fortuneResult.unsuitable" :key="`bad-${item}`">❌ {{ item }}</li>
                      </ul>
                    </div>
                  </div>
                </article>
              </section>

              <article class="roast-card">🫠 {{ fortuneResult.roast }}</article>

              <section class="custom-news">
                <h4>今日专属热点</h4>
                <ul>
                  <li v-for="(item, index) in fortuneResult.customNews" :key="`${item.title}-${index}`">
                    <span class="news-icon" aria-hidden="true">{{ item.icon }}</span>
                    <div class="news-content">
                      <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="news-title">
                        {{ item.title }}
                      </a>
                      <span v-else class="news-title">{{ item.title }}</span>
                      <div class="news-meta">
                        <span>{{ item.source }}</span>
                        <span>热度 {{ item.hotText || formatHot(item.hot) }}</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </section>
            </section>

            <section v-else class="state-idle">
              <div class="idle-icon" aria-hidden="true">✨</div>
              <p>点击上方 12 星座图标，立即开启米奇今日运势。</p>
            </section>
          </main>

          <footer class="fortune-actions">
            <button
              v-if="status !== 'result'"
              type="button"
              class="measure-btn"
              :disabled="status === 'rolling'"
              @click="startMeasure"
            >
              {{ measureButtonText }}
            </button>
            <button
              v-else
              type="button"
              class="remeasure-btn"
              @click="startMeasure"
            >
              ↻ 重新测算
            </button>
            <button
              type="button"
              class="share-btn"
              :disabled="!fortuneResult || status === 'rolling'"
              @click="handleShare"
            >
              📋 {{ shareButtonText }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fortune-overlay {
  position: fixed;
  inset: 0;
  z-index: 125;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  background: rgba(20, 24, 33, 0.4);
  backdrop-filter: blur(4px);
  padding: 20px;
}

.fortune-panel {
  --fortune-theme: #e83f37;
  width: min(860px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--fortune-red) 34%, #f2d7c7);
  background: linear-gradient(
    150deg,
    #fffdf8 0%,
    color-mix(in srgb, var(--fortune-yellow) 14%, #fff4ee) 52%,
    #fff8ef 100%
  );
  box-shadow: 0 14px 34px rgba(17, 24, 39, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: background 0.25s ease-out, border-color 0.25s ease-out;
}

.fortune-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 18px 10px;
}

.fortune-header h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: linear-gradient(90deg, #e83f37 0%, #ff8e2b 54%, #ffc800 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-family: 'YouYuan', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.fortune-header p {
  margin: 2px 0 0;
  font-size: 0.74rem;
  color: #9c775f;
}

.close-btn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(232, 63, 55, 0.32);
  background: rgba(255, 255, 255, 0.88);
  color: #c33931;
  font-size: 0.94rem;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.close-btn:hover {
  transform: rotate(8deg);
  filter: brightness(0.9);
}

.fortune-main {
  flex: 1 1 auto;
  min-height: 360px;
  padding: 10px 18px 12px;
  border-radius: 12px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.68), rgba(255, 242, 214, 0.7) 46%, rgba(255, 248, 241, 0.78));
}

.fortune-selector {
  display: grid;
  gap: 8px;
}

.selected-sign-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.selected-sign-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--const-color) 42%, #e3d9f5);
  background: color-mix(in srgb, var(--const-color) 10%, #ffffff);
  color: color-mix(in srgb, var(--const-color) 78%, #5b356e);
  font-size: 0.78rem;
  font-weight: 700;
  min-height: 34px;
  padding: 0 10px;
}

.selected-sign-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid color-mix(in srgb, var(--const-color) 42%, #ece6f6);
}

.selected-sign-tip {
  font-size: 0.72rem;
  color: #8b8194;
}

.constellation-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.constellation-btn {
  border: 1px solid rgba(156, 120, 184, 0.26);
  background: rgba(255, 255, 255, 0.86);
  border-radius: 999px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: transform 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out;
}

.constellation-btn:hover {
  transform: translateY(-1px) scale(1.02);
  border-color: color-mix(in srgb, var(--const-color) 64%, #b38ad4);
}

.constellation-btn.active {
  border-color: transparent;
  background: linear-gradient(135deg, #e83f37, #ff9a18);
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(232, 63, 55, 0.22);
}

.constellation-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  font-size: 0.9rem;
  line-height: 1;
  background: color-mix(in srgb, var(--const-color) 18%, #ffffff);
  color: color-mix(in srgb, var(--const-color) 76%, #5b356e);
  position: relative;
}

.constellation-icon::before,
.constellation-icon::after {
  content: '';
  position: absolute;
  top: -5px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--const-color) 36%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--const-color) 48%, #ece6f6);
}

.constellation-icon::before {
  left: 1px;
}

.constellation-icon::after {
  right: 1px;
}

.constellation-btn.active .constellation-icon {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.constellation-name {
  font-size: 0.74rem;
  font-weight: 600;
}

.state-idle {
  min-height: 260px;
  display: grid;
  place-items: center;
  gap: 8px;
  color: #8b96a8;
}

.idle-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.45rem;
  background: color-mix(in srgb, var(--fortune-theme) 18%, #fff0e8);
  color: color-mix(in srgb, var(--fortune-theme) 82%, #7a4b28);
  animation: idle-float 2.4s ease-in-out infinite;
}

.state-rolling {
  min-height: 300px;
  display: grid;
  place-items: center;
  gap: 12px;
}

.star-loader {
  width: 172px;
  height: 172px;
  border-radius: 50%;
  position: relative;
  display: grid;
  place-items: center;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.88) 0%, rgba(255, 243, 236, 0.68) 72%);
}

.loader-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--fortune-theme) 56%, #f1b38f);
}

.ring-a {
  inset: 0;
  animation: loader-rotate 3.2s linear infinite;
}

.ring-b {
  inset: 16px;
  animation: loader-rotate 2.2s linear infinite reverse;
}

.loader-core {
  font-size: 2rem;
  color: #e83f37;
  animation: star-pulse 1.2s ease-in-out infinite;
}

.loader-star {
  position: absolute;
  color: color-mix(in srgb, var(--fortune-red) 84%, #ff9a2e);
  font-size: 0.82rem;
  opacity: 0.82;
  animation: orbit-pulse 1.5s ease-in-out infinite;
  animation-delay: var(--star-delay);
}

.loader-star:nth-child(4) {
  top: 10px;
  left: 50%;
}

.loader-star:nth-child(5) {
  right: 16px;
  top: 42px;
}

.loader-star:nth-child(6) {
  right: 34px;
  bottom: 20px;
}

.loader-star:nth-child(7) {
  left: 30px;
  bottom: 26px;
}

.loader-star:nth-child(8) {
  left: 16px;
  top: 44px;
}

.loader-star:nth-child(9) {
  top: 24px;
  right: 50px;
}

.state-rolling p {
  margin: 0;
  font-size: 0.82rem;
  color: #8f7b9c;
}

.state-result {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.result-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
}

.sign-badge {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--const-color) 58%, rgba(255, 255, 255, 0.8));
  background: color-mix(in srgb, var(--const-color) 16%, #ffffff);
}

.sign-icon {
  color: color-mix(in srgb, var(--const-color) 74%, #5b356e);
  font-size: 1.2rem;
}

.result-head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  background: linear-gradient(90deg, #e83f37, #ff9a18 56%, #ffc800);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.result-head p {
  margin: 2px 0 0;
  font-size: 0.74rem;
  color: #7b8798;
}

.result-actions-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.general-level {
  border-radius: 999px;
  border: 1px solid rgba(232, 63, 55, 0.24);
  background: color-mix(in srgb, #ffc800 18%, #fff2df);
  color: #b83830;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
}

.favorite-sign-btn {
  border: 1px solid rgba(232, 63, 55, 0.26);
  background: rgba(255, 255, 255, 0.9);
  color: #b33c32;
  border-radius: 12px;
  min-height: 30px;
  padding: 0 10px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.favorite-sign-btn:hover {
  transform: translateY(-1px);
}

.favorite-sign-btn.active {
  border-color: transparent;
  background: linear-gradient(135deg, #e83f37, #ffc800);
  color: #ffffff;
}

.fortune-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.fortune-card {
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--fortune-theme) 18%, #f2dcc8);
  background: rgba(255, 255, 255, 0.82);
  padding: 10px;
}

.fortune-card h4 {
  margin: 0 0 8px;
  font-size: 0.76rem;
  color: #af3f35;
}

.general-card {
  grid-column: span 2;
}

.general-value {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #c03d32;
}

.general-desc {
  margin: 6px 0 0;
  font-size: 0.76rem;
  color: #596577;
  line-height: 1.6;
}

.score-card {
  display: grid;
  align-content: start;
  gap: 6px;
}

.star-row {
  display: inline-flex;
  gap: 3px;
}

.star-row span {
  color: #d3d7de;
  font-size: 0.92rem;
}

.star-row span.active {
  color: #ffbf00;
}

.advice-card {
  grid-column: span 2;
}

.advice-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.advice-columns strong {
  display: inline-block;
  margin-bottom: 4px;
  font-size: 0.74rem;
  color: #7d5760;
}

.advice-columns ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 5px;
}

.advice-columns li {
  font-size: 0.74rem;
  color: #586476;
}

.roast-card {
  margin: 0;
  border-radius: 12px;
  border: 1px solid rgba(245, 63, 63, 0.2);
  background: rgba(255, 241, 235, 0.86);
  color: #9e4f26;
  font-size: 0.78rem;
  line-height: 1.6;
  padding: 10px 12px;
}

.custom-news {
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--fortune-theme) 20%, #f2dcc8);
  background: rgba(255, 255, 255, 0.84);
  padding: 10px;
}

.custom-news h4 {
  margin: 0 0 8px;
  font-size: 0.8rem;
  color: #af3e35;
}

.custom-news ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.custom-news li {
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--fortune-theme) 16%, #efd4c2);
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
}

.news-icon {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: inline-grid;
  place-items: center;
  background: color-mix(in srgb, var(--fortune-theme) 14%, #fff4ec);
}

.news-content {
  min-width: 0;
}

.news-title {
  font-size: 0.76rem;
  line-height: 1.45;
  color: #2d3644;
  text-decoration: none;
}

.news-title:hover {
  color: #c03c33;
}

.news-meta {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.68rem;
  color: #8a96a8;
}

.fortune-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 18px 16px;
}

.measure-btn,
.remeasure-btn,
.share-btn {
  border: 1px solid transparent;
  border-radius: 12px;
  min-height: 42px;
  padding: 0 14px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease-out, filter 0.2s ease-out, opacity 0.2s ease-out;
}

.measure-btn,
.remeasure-btn {
  color: #ffffff;
  background: linear-gradient(135deg, #e83f37, #ff9a18);
  box-shadow: 0 8px 18px rgba(232, 63, 55, 0.24);
}

.share-btn {
  color: #7d4f2d;
  border-color: rgba(232, 63, 55, 0.22);
  background: linear-gradient(135deg, #fff6e9, #ffefcf);
}

.measure-btn:hover:not(:disabled),
.remeasure-btn:hover:not(:disabled),
.share-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.measure-btn:disabled,
.remeasure-btn:disabled,
.share-btn:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.fortune-fade-enter-active,
.fortune-fade-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.fortune-fade-enter-from,
.fortune-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes loader-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbit-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@keyframes star-pulse {
  0%,
  100% {
    transform: scale(0.92);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes idle-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@media (max-width: 980px) {
  .constellation-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .fortune-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .general-card,
  .advice-card {
    grid-column: span 2;
  }

  .result-head {
    grid-template-columns: auto 1fr;
  }

  .result-actions-inline {
    grid-column: 1 / -1;
    justify-content: flex-start;
    margin-top: 2px;
  }

  .selected-sign-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}

@media (max-width: 920px) {
  .fortune-overlay {
    padding: 0;
    align-items: stretch;
    overflow: hidden;
  }

  .fortune-panel {
    width: 100vw;
    max-height: 100dvh;
    min-height: 100dvh;
    border-radius: 0;
    border: none;
  }

  .fortune-main {
    min-height: 0;
    border-radius: 0;
  }

  .constellation-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .fortune-card-grid {
    grid-template-columns: 1fr;
  }

  .general-card,
  .advice-card {
    grid-column: auto;
  }

  .advice-columns {
    grid-template-columns: 1fr;
  }

  .fortune-actions {
    position: sticky;
    bottom: 0;
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(6px);
    border-top: 1px solid rgba(232, 63, 55, 0.22);
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  }

  .measure-btn,
  .remeasure-btn,
  .share-btn {
    flex: 1;
    min-height: 48px;
    font-size: 0.9rem;
  }
}

:global([data-theme='dark']) .fortune-panel {
  border-color: rgba(255, 200, 122, 0.26);
  background: linear-gradient(140deg, rgba(68, 32, 38, 0.95), rgba(52, 20, 25, 0.95));
}

:global([data-theme='dark']) .fortune-main {
  background: linear-gradient(160deg, rgba(63, 25, 31, 0.72), rgba(53, 22, 27, 0.78));
}
</style>
