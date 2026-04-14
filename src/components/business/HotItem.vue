<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { TransitionPresets, useTransition } from '@vueuse/core'
import { getPlatformBrand, withAlpha, type ResolvedTheme } from '../../constants/brand'
import type { NormalizedHotItem } from '../../types/hot'
import { formatDateTime, formatHotValue } from '../../utils/format'

const props = withDefaults(
  defineProps<{
    item: NormalizedHotItem
    showPlatform?: boolean
    theme?: ResolvedTheme
    isFavorite?: boolean
    highlightKeyword?: string
  }>(),
  {
    showPlatform: false,
    theme: 'light',
    isFavorite: false,
    highlightKeyword: '',
  },
)

const emit = defineEmits<{
  (e: 'toggle-favorite', item: NormalizedHotItem): void
  (e: 'copy-feedback', payload: { success: boolean; message: string }): void
}>()

const animatedSource = ref(props.item.hot ?? 0)

const animatedHot = useTransition(animatedSource, {
  duration: 300,
  transition: TransitionPresets.easeOutCubic,
})

watch(
  () => props.item.hot,
  (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      animatedSource.value = value
    }
  },
  { immediate: true },
)

const hotText = computed(() => {
  if (typeof props.item.hot === 'number' && Number.isFinite(props.item.hot)) {
    return formatHotValue(Math.round(animatedHot.value))
  }
  return props.item.hotText || '--'
})

const brand = computed(() => getPlatformBrand(props.item.platform, props.theme))

const itemStyle = computed(() => ({
  '--item-brand': brand.value.primary,
  '--item-brand-soft': withAlpha(brand.value.primary, 0.05),
  '--item-brand-line': withAlpha(brand.value.primary, 1),
}))

const rankClass = computed(() => {
  if (props.item.rank === 1) {
    return 'rank-top-1'
  }

  if (props.item.rank === 2) {
    return 'rank-top-2'
  }

  if (props.item.rank === 3) {
    return 'rank-top-3'
  }

  return 'rank-normal'
})

const rankCrown = computed(() => {
  if (props.item.rank <= 3) {
    return '♛'
  }

  return ''
})

const hotLevel = computed(() => {
  const value = props.item.hot ?? 0
  if (value > 500_000) {
    return 'super'
  }
  if (value >= 100_000) {
    return 'high'
  }
  if (value >= 10_000) {
    return 'medium'
  }
  return 'low'
})

const hotLevelClass = computed(() => `hot-${hotLevel.value}`)
const showFire = computed(() => hotLevel.value === 'super')
const copyState = ref<'idle' | 'done' | 'error'>('idle')
let copyTimer: number | null = null

const copyText = computed(() => {
  const platformTitle = `${props.item.platformName}热搜`
  const urlText = props.item.url || '无链接'
  return `【${platformTitle}】${props.item.title} 热度 ${hotText.value}：${urlText}`
})

const copyLabel = computed(() => {
  if (copyState.value === 'done') {
    return '已复制'
  }

  if (copyState.value === 'error') {
    return '复制失败'
  }

  return '复制'
})

const favoriteLabel = computed(() => (props.isFavorite ? '已收藏' : '收藏'))

interface TextSegment {
  text: string
  highlight: boolean
}

const highlightTokens = computed(() => {
  const raw = props.highlightKeyword.trim().toLowerCase()
  if (!raw) {
    return [] as string[]
  }

  const parts = raw
    .split(/[\s,，、;；|]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const unique = Array.from(new Set(parts))
  return unique.sort((left, right) => right.length - left.length)
})

const splitHighlightSegments = (text: string, keywords: string[]): TextSegment[] => {
  if (!text) {
    return [{ text: '', highlight: false }]
  }

  if (keywords.length === 0) {
    return [{ text, highlight: false }]
  }

  const lowerText = text.toLowerCase()
  const ranges: Array<{ start: number; end: number }> = []

  keywords.forEach((keyword) => {
    if (!keyword) {
      return
    }

    let fromIndex = 0
    while (fromIndex < lowerText.length) {
      const foundIndex = lowerText.indexOf(keyword, fromIndex)
      if (foundIndex < 0) {
        break
      }

      ranges.push({
        start: foundIndex,
        end: foundIndex + keyword.length,
      })

      fromIndex = foundIndex + keyword.length
    }
  })

  if (ranges.length === 0) {
    return [{ text, highlight: false }]
  }

  ranges.sort((left, right) => (left.start === right.start ? right.end - left.end : left.start - right.start))

  const merged: Array<{ start: number; end: number }> = []
  ranges.forEach((range) => {
    const last = merged[merged.length - 1]
    if (!last || range.start > last.end) {
      merged.push({ ...range })
      return
    }

    if (range.end > last.end) {
      last.end = range.end
    }
  })

  const segments: TextSegment[] = []
  let cursor = 0
  merged.forEach((range) => {
    if (range.start > cursor) {
      segments.push({
        text: text.slice(cursor, range.start),
        highlight: false,
      })
    }

    segments.push({
      text: text.slice(range.start, range.end),
      highlight: true,
    })

    cursor = range.end
  })

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      highlight: false,
    })
  }

  return segments
}

const highlightedTitleSegments = computed(() => splitHighlightSegments(props.item.title, highlightTokens.value))
const highlightedDescSegments = computed(() => splitHighlightSegments(props.item.desc, highlightTokens.value))
const highlightedPlatformSegments = computed(() => splitHighlightSegments(props.item.platformName, highlightTokens.value))

const fallbackCopyText = (text: string): boolean => {
  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()

  let succeeded = false
  try {
    succeeded = document.execCommand('copy')
  } catch {
    succeeded = false
  }

  document.body.removeChild(textarea)
  return succeeded
}

const resetCopyStateWithDelay = () => {
  if (copyTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(copyTimer)
  }

  if (typeof window !== 'undefined') {
    copyTimer = window.setTimeout(() => {
      copyState.value = 'idle'
      copyTimer = null
    }, 1400)
  }
}

const handleCopy = async () => {
  const text = copyText.value

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      copyState.value = 'done'
      emit('copy-feedback', { success: true, message: '已复制到剪贴板' })
      resetCopyStateWithDelay()
      return
    }

    const succeeded = fallbackCopyText(text)
    copyState.value = succeeded ? 'done' : 'error'
    emit('copy-feedback', { success: succeeded, message: succeeded ? '已复制到剪贴板' : '复制失败，请重试' })
  } catch {
    const succeeded = fallbackCopyText(text)
    copyState.value = succeeded ? 'done' : 'error'
    emit('copy-feedback', { success: succeeded, message: succeeded ? '已复制到剪贴板' : '复制失败，请重试' })
  }

  resetCopyStateWithDelay()
}

const handleToggleFavorite = () => {
  emit('toggle-favorite', props.item)
}

const publishTimeText = computed(() => {
  if (props.item.hasPublishedTime) {
    if (props.item.publishedText) {
      return `发布 ${props.item.publishedText}`
    }

    if (props.item.publishedAt) {
      return `发布 ${formatDateTime(props.item.publishedAt)}`
    }
  }

  return ''
})

const showPublishTime = computed(() => Boolean(publishTimeText.value))
</script>

<template>
  <article class="hot-item" :style="itemStyle">
    <span class="rank" :class="rankClass">
      <span v-if="rankCrown" class="rank-crown" aria-hidden="true">{{ rankCrown }}</span>
      <span class="rank-num">{{ String(item.rank).padStart(2, '0') }}</span>
    </span>

    <div class="main-content">
      <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="title">
        <template v-for="(segment, index) in highlightedTitleSegments" :key="`title-${index}`">
          <span :class="{ 'hl-keyword': segment.highlight }">{{ segment.text }}</span>
        </template>
      </a>
      <span v-else class="title no-link">
        <template v-for="(segment, index) in highlightedTitleSegments" :key="`title-no-link-${index}`">
          <span :class="{ 'hl-keyword': segment.highlight }">{{ segment.text }}</span>
        </template>
      </span>

      <div v-if="item.desc || showPublishTime" class="meta-row">
        <p v-if="item.desc" class="desc">
          <template v-for="(segment, index) in highlightedDescSegments" :key="`desc-${index}`">
            <span :class="{ 'hl-keyword': segment.highlight }">{{ segment.text }}</span>
          </template>
        </p>
        <span v-if="showPublishTime" class="time-meta">{{ publishTimeText }}</span>
      </div>
      <span v-if="showPlatform" class="platform-tag">
        <template v-for="(segment, index) in highlightedPlatformSegments" :key="`platform-${index}`">
          <span :class="{ 'hl-keyword': segment.highlight }">{{ segment.text }}</span>
        </template>
      </span>
    </div>

    <div class="right-actions">
      <span class="hot-tag" :class="hotLevelClass">
        <span v-if="showFire" class="fire-icon" aria-hidden="true">🔥</span>
        {{ hotText }}
      </span>
      <button type="button" class="copy-btn" :class="`is-${copyState}`" @click="handleCopy">{{ copyLabel }}</button>
      <button type="button" class="favorite-btn" :class="{ active: isFavorite }" @click="handleToggleFavorite">
        {{ favoriteLabel }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.hot-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--panel-bg);
  box-shadow: var(--shadow-card);
  transition: border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease);
  position: relative;
  overflow: visible;
}

.hot-item::before,
.hot-item::after {
  content: '';
  position: absolute;
  top: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(232, 63, 55, 0.14);
  box-shadow: 0 0 0 1px rgba(232, 63, 55, 0.1);
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
  pointer-events: none;
}

.hot-item::before {
  left: 8px;
}

.hot-item::after {
  left: 24px;
}

.hot-item:hover {
  transform: translateX(3px) translateY(-1px);
  border-color: rgba(232, 63, 55, 0.32);
  background: #fffaf2;
  box-shadow: var(--shadow-card-hover);
}

.hot-item:hover::before,
.hot-item:hover::after {
  opacity: 1;
  transform: translateY(0);
}

.rank {
  width: 24px;
  min-height: 24px;
  border-radius: 8px;
  display: inline-grid;
  place-items: center;
  color: inherit;
  font-weight: 700;
  font-size: 12px;
  line-height: 1;
  padding-top: 1px;
  position: relative;
}

.rank-num {
  transform: translateY(1px);
}

.rank-crown {
  position: absolute;
  left: 50%;
  top: -11px;
  transform: translateX(-50%);
  font-size: 10px;
  line-height: 1;
}

.rank-top-1 {
  color: #7b4d05;
  background: linear-gradient(150deg, #ffe97c, #ffc800);
  box-shadow: 0 6px 12px rgba(255, 200, 0, 0.35);
}

.rank-top-1 .rank-crown {
  color: #f0ae00;
}

.rank-top-2 {
  color: #4e5665;
  background: linear-gradient(150deg, #edf0f8, #cfd7e7);
  box-shadow: 0 6px 10px rgba(140, 148, 167, 0.28);
}

.rank-top-2 .rank-crown {
  color: #9aa3b8;
}

.rank-top-3 {
  color: #7a4426;
  background: linear-gradient(150deg, #e9b893, #c6855a);
  box-shadow: 0 6px 10px rgba(169, 101, 60, 0.3);
}

.rank-top-3 .rank-crown {
  color: #b0673d;
}

.rank-normal {
  color: #ffffff;
  background: linear-gradient(150deg, #d19f7f, #be7b54);
}

.main-content {
  min-width: 0;
}

.title {
  color: var(--text-main);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title:hover {
  color: var(--item-brand);
}

.title.no-link {
  color: var(--text-secondary);
  cursor: not-allowed;
}

.hl-keyword {
  border-radius: 3px;
  background: color-mix(in srgb, var(--item-brand) 24%, #fff6bf);
  padding: 0 1px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.desc {
  font-size: 12px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.meta-row {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.time-meta {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 11px;
  white-space: nowrap;
}

.platform-tag {
  margin-top: 4px;
  display: inline-flex;
  border-radius: 999px;
  background: rgba(232, 63, 55, 0.1);
  color: var(--item-brand);
  font-size: 10px;
  padding: 2px 6px;
}

.hot-tag {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  min-width: 64px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.right-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.copy-btn {
  border: 1px solid rgba(232, 63, 55, 0.2);
  background: #fffefb;
  color: #8f6a53;
  border-radius: 999px;
  height: 24px;
  min-width: 46px;
  padding: 0 8px;
  font-size: 12px;
  cursor: pointer;
  transition: color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease);
}

.copy-btn:hover,
.copy-btn:focus-visible {
  color: #c03931;
  border-color: rgba(232, 63, 55, 0.4);
  background: color-mix(in srgb, #ffc800 16%, #ffffff);
  box-shadow: 0 0 0 2px rgba(232, 63, 55, 0.16);
  transform: translateY(-1px);
}

.copy-btn:active {
  transform: translateY(0);
}

.copy-btn.is-done {
  border-color: rgba(28, 169, 107, 0.42);
  color: #1a8c57;
  background: rgba(28, 169, 107, 0.1);
}

.copy-btn.is-error {
  border-color: rgba(232, 63, 55, 0.52);
  color: #c5352d;
  background: rgba(232, 63, 55, 0.1);
}

.favorite-btn {
  border: 1px solid rgba(232, 63, 55, 0.2);
  background: #fffefb;
  color: #8f6a53;
  border-radius: 999px;
  height: 24px;
  min-width: 54px;
  padding: 0 8px;
  font-size: 12px;
  cursor: pointer;
  transition: color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease);
}

.favorite-btn:hover,
.favorite-btn:focus-visible {
  color: #c03931;
  border-color: rgba(232, 63, 55, 0.4);
  background: color-mix(in srgb, #ffc800 16%, #ffffff);
  box-shadow: 0 0 0 2px rgba(232, 63, 55, 0.16);
  transform: translateY(-1px);
}

.favorite-btn:active {
  transform: translateY(0);
}

.favorite-btn.active {
  border-color: rgba(232, 63, 55, 0.42);
  color: #b7342d;
  background: color-mix(in srgb, #ffc800 20%, #fff7e8);
}

.hot-low {
  background: #f4dfca;
  color: #8a5f42;
}

.hot-medium {
  background: #ffe496;
  color: #7b5c21;
}

.hot-high {
  background: #ffb33f;
  color: #5d3d08;
}

.hot-super {
  background: #e83f37;
  color: #ffffff;
}

.fire-icon {
  font-size: 10px;
}

@media (max-width: 760px) {
  .hot-item {
    grid-template-columns: 24px minmax(0, 1fr);
    grid-template-rows: auto auto;
    gap: 10px;
  }

  .right-actions {
    justify-self: end;
    grid-column: 2;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .meta-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}

:global([data-theme='dark']) .hot-low {
  background: rgba(255, 200, 122, 0.32);
  color: #ffe8cf;
}

:global([data-theme='dark']) .hot-medium {
  background: rgba(255, 200, 0, 0.55);
  color: #3c2411;
}

:global([data-theme='dark']) .hot-high {
  background: #ffb33f;
  color: #3a240f;
}

:global([data-theme='dark']) .hot-super {
  background: #f06259;
}

:global([data-theme='dark']) .hot-item {
  background: color-mix(in srgb, var(--panel-bg) 96%, transparent);
  border-color: rgba(255, 200, 122, 0.24);
}

:global([data-theme='dark']) .hot-item:hover {
  background: color-mix(in srgb, var(--panel-soft) 86%, transparent);
  border-color: rgba(255, 200, 0, 0.36);
}

:global([data-theme='dark']) .hl-keyword {
  background: color-mix(in srgb, var(--item-brand) 30%, rgba(255, 255, 255, 0.16));
}
</style>
