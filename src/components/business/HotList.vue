<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import type { ResolvedTheme } from '../../constants/brand'
import type { NormalizedHotItem } from '../../types/hot'
import HotItem from './HotItem.vue'

const props = withDefaults(
  defineProps<{
    items: NormalizedHotItem[]
    hasMore: boolean
    loadingMore: boolean
    showPlatform?: boolean
    theme?: ResolvedTheme
    favoriteKeys?: string[]
    highlightKeyword?: string
  }>(),
  {
    showPlatform: false,
    theme: 'light',
    favoriteKeys: () => [],
    highlightKeyword: '',
  },
)

const emit = defineEmits<{
  (e: 'load-more'): void
  (e: 'refresh'): void
  (e: 'toggle-favorite', item: NormalizedHotItem): void
  (e: 'copy-feedback', payload: { success: boolean; message: string }): void
}>()

const listRef = ref<HTMLDivElement | null>(null)
const sentinelRef = ref<HTMLDivElement | null>(null)

const touching = ref(false)
const pullDistance = ref(0)
const shouldRefresh = ref(false)
const touchStartY = ref(0)

let observer: IntersectionObserver | null = null

const useVirtualList = computed(() => props.items.length > 50)
const favoriteKeySet = computed(() => new Set(props.favoriteKeys))
const itemFavoriteKey = (item: NormalizedHotItem) => `${item.platform}:${item.id}`

const bindObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  if (!listRef.value || !sentinelRef.value) {
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (!entry?.isIntersecting) {
        return
      }
      if (props.hasMore && !props.loadingMore) {
        emit('load-more')
      }
    },
    {
      root: listRef.value,
      threshold: 0.35,
    },
  )

  observer.observe(sentinelRef.value)
}

const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia('(max-width: 900px)').matches
}

const onTouchStart = (event: TouchEvent) => {
  if (!isMobileViewport() || !listRef.value || listRef.value.scrollTop > 0) {
    return
  }

  touching.value = true
  touchStartY.value = event.touches[0].clientY
}

const onTouchMove = (event: TouchEvent) => {
  if (!touching.value) {
    return
  }

  const delta = event.touches[0].clientY - touchStartY.value
  if (delta <= 0) {
    pullDistance.value = 0
    shouldRefresh.value = false
    return
  }

  pullDistance.value = Math.min(88, delta * 0.5)
  shouldRefresh.value = pullDistance.value > 60

  if (pullDistance.value > 0) {
    event.preventDefault()
  }
}

const resetPullState = () => {
  touching.value = false
  shouldRefresh.value = false
  pullDistance.value = 0
}

const onTouchEnd = () => {
  if (!touching.value) {
    return
  }

  const needRefresh = shouldRefresh.value
  resetPullState()
  if (needRefresh) {
    emit('refresh')
  }
}

onMounted(() => {
  nextTick(bindObserver)
})

onUnmounted(() => {
  observer?.disconnect()
})

watch(
  () => [props.items.length, props.loadingMore, props.hasMore],
  () => {
    nextTick(bindObserver)
  },
)

watch([listRef, sentinelRef], () => {
  nextTick(bindObserver)
})
</script>

<template>
  <div
    ref="listRef"
    class="hot-list-shell"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div class="pull-indicator" :class="{ ready: shouldRefresh }" :style="{ height: `${pullDistance}px` }">
      <span>{{ shouldRefresh ? '松开立即刷新' : '下拉刷新当前平台' }}</span>
    </div>

    <RecycleScroller
      v-if="useVirtualList"
      class="virtual-list"
      :items="items"
      :item-size="106"
      key-field="id"
      :buffer="100"
    >
      <template #default="{ item }">
        <HotItem
          :item="item"
          :show-platform="showPlatform"
          :theme="theme"
          :is-favorite="favoriteKeySet.has(itemFavoriteKey(item))"
          :highlight-keyword="highlightKeyword"
          @toggle-favorite="emit('toggle-favorite', $event)"
          @copy-feedback="emit('copy-feedback', $event)"
        />
      </template>
    </RecycleScroller>

    <TransitionGroup v-else name="fade-slide" tag="div" class="normal-list">
      <HotItem
        v-for="item in items"
        :key="`${item.platform}-${item.id}-${item.rank}`"
        :item="item"
        :show-platform="showPlatform"
        :theme="theme"
        :is-favorite="favoriteKeySet.has(itemFavoriteKey(item))"
        :highlight-keyword="highlightKeyword"
        @toggle-favorite="emit('toggle-favorite', $event)"
        @copy-feedback="emit('copy-feedback', $event)"
      />
    </TransitionGroup>

    <div ref="sentinelRef" class="list-sentinel">
      <span v-if="loadingMore">正在加载更多...</span>
      <span v-else-if="hasMore">继续下滑加载更多</span>
      <span v-else>已加载全部内容</span>
    </div>
  </div>
</template>

<style scoped>
.hot-list-shell {
  position: relative;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--panel-bg);
  max-height: min(72vh, 780px);
  overflow: auto;
  padding: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.pull-indicator {
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  font-size: 12px;
  transition: height 0.3s ease-out, color 0.3s ease-out;
  overflow: hidden;
}

.pull-indicator.ready {
  color: #b8382f;
}

.normal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.virtual-list {
  min-height: 300px;
}

.list-sentinel {
  text-align: center;
  padding: 10px 0 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.list-sentinel span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(232, 63, 55, 0.2);
  background: color-mix(in srgb, #ffc800 12%, #ffffff);
}

:global([data-theme='dark']) .hot-list-shell {
  border-color: rgba(255, 200, 122, 0.24);
}

:global([data-theme='dark']) .list-sentinel span {
  border-color: rgba(255, 200, 122, 0.3);
  background: rgba(255, 200, 0, 0.12);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease-out;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .hot-list-shell {
    max-height: calc(100vh - 300px);
  }
}
</style>
