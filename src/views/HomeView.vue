<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import CategoryBar from '../components/business/CategoryBar.vue'
import { getPlatformBrand, withAlpha } from '../constants/brand'
import EmptyState from '../components/global/Empty.vue'
import ErrorState from '../components/global/Error.vue'
import FooterBar from '../components/global/Footer.vue'
import HeaderBar from '../components/global/Header.vue'
import LoadingState from '../components/global/Loading.vue'
import { useHotStore } from '../stores/hot'
import { useUiStore } from '../stores/ui'
import type { NormalizedHotItem, PlatformCategory } from '../types/hot'
import { formatDateTime } from '../utils/format'

const PlatformTab = defineAsyncComponent(() => import('../components/business/PlatformTab.vue'))
const HotList = defineAsyncComponent(() => import('../components/business/HotList.vue'))
const LunchPicker = defineAsyncComponent(() => import('../components/business/LunchPicker.vue'))
const FortunePicker = defineAsyncComponent(() => import('../components/business/FortunePicker.vue'))

const hotStore = useHotStore()
const uiStore = useUiStore()

const searchInput = ref('')
const lunchPickerOpen = ref(false)
const fortunePickerOpen = ref(false)
const randomJumping = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')
const toastTone = ref<'success' | 'error' | 'info'>('info')
const toastKind = ref<'copy' | 'favorite' | 'refresh' | 'general'>('general')

let toastTimer: number | null = null

const limitOptions = [20, 30, 50, 80]
const sortOptions = [{ label: '热度从高到低', value: 'hot-desc' as const }]
const randomButtonText = computed(() => (randomJumping.value ? '处理中...' : '随便看点'))
const toastIcon = computed(() => {
  if (toastTone.value === 'error') {
    return '⚠'
  }

  if (toastKind.value === 'copy') {
    return '📋'
  }

  if (toastKind.value === 'favorite') {
    return '⭐'
  }

  if (toastKind.value === 'refresh') {
    return '🔄'
  }

  return '✅'
})

const lastUpdateText = computed(() => formatDateTime(hotStore.updatedAt))
const currentPlatformBrand = computed(() => getPlatformBrand(hotStore.currentPlatform, uiStore.resolvedTheme))
const headerPlatformName = computed(() => (hotStore.isFavoritesMode ? '我的收藏' : hotStore.currentPlatformName))
const pageStyle = computed(() => ({
  '--current-platform-color': currentPlatformBrand.value.primary,
  '--current-platform-soft': withAlpha(currentPlatformBrand.value.primary, 0.08),
}))

const resultTitle = computed(() => {
  if (hotStore.isFavoritesMode) {
    return '我的收藏'
  }

  if (hotStore.isSearchMode) {
    return `全网搜索：${searchInput.value || hotStore.searchKeyword}`
  }
  return `${hotStore.currentPlatformName} 热点`
})

const panelMetaText = computed(() => {
  if (hotStore.isFavoritesMode) {
    return `已收藏 ${hotStore.favoriteCount} 条`
  }

  if (hotStore.isSearchMode) {
    return `全网相关内容 ${hotStore.displayItems.length} 条`
  }

  return `更新时间：${lastUpdateText.value}`
})

const stateIsLoading = computed(() => !hotStore.isFavoritesMode && hotStore.loading && hotStore.displayItems.length === 0)
const stateHasError = computed(() => !hotStore.isFavoritesMode && Boolean(hotStore.error) && hotStore.displayItems.length === 0)
const stateIsEmpty = computed(() => !hotStore.loading && !hotStore.error && hotStore.displayItems.length === 0)

const debouncedSwitchPlatform = useDebounceFn((platform: string) => {
  void hotStore.setPlatform(platform)
}, 300)

const debouncedSearch = useDebounceFn((keyword: string) => {
  hotStore.setSearchKeyword(keyword)
}, 300)

const handleSearchChange = (value: string) => {
  searchInput.value = value
  debouncedSearch(value)
}

const handlePlatformChange = (platform: string) => {
  debouncedSwitchPlatform(platform)
}

const handlePlatformReorder = (orderedKeys: string[]) => {
  hotStore.setCategoryPlatformOrder(hotStore.currentCategory, orderedKeys)
}

const handleCategoryChange = (category: PlatformCategory) => {
  hotStore.setCategory(category)
}

const handleThemeToggle = () => {
  uiStore.toggleTheme()
}

const handleOpenLunchPicker = () => {
  lunchPickerOpen.value = true
}

const handleCloseLunchPicker = () => {
  lunchPickerOpen.value = false
}

const handleOpenFortunePicker = () => {
  fortunePickerOpen.value = true
}

const handleCloseFortunePicker = () => {
  fortunePickerOpen.value = false
}

const handleHelp = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.alert('使用说明：\n1. 顶部可搜索全网热点\n2. 可在顶部进入我的收藏\n3. 每条新闻右侧可收藏并长期保存')
}

const handleToggleFavorites = () => {
  hotStore.toggleFavoritesMode()
}

const handleExitFavorites = () => {
  hotStore.setFavoritesMode(false)
}

const handleToggleFavorite = (item: NormalizedHotItem) => {
  const favorited = hotStore.toggleFavorite(item)
  showToast(favorited ? '已加入收藏' : '已取消收藏', favorited ? 'success' : 'info', 'favorite')
}

const handleRandomHotspot = async () => {
  if (randomJumping.value) {
    return
  }

  const popup = typeof window !== 'undefined' ? window.open('', '_blank') : null
  if (popup) {
    popup.opener = null
    popup.document.title = '正在为你随机热点...'
  }

  randomJumping.value = true
  const randomItem = await hotStore.pickRandomHotItem()
  randomJumping.value = false

  if (typeof window === 'undefined') {
    if (popup && !popup.closed) {
      popup.close()
    }
    return
  }

  if (!randomItem?.url) {
    if (popup && !popup.closed) {
      popup.close()
    }
    window.alert('暂时没有可跳转的热点，稍后再试。')
    return
  }

  if (popup && !popup.closed) {
    popup.location.href = randomItem.url
  } else {
    window.open(randomItem.url, '_blank', 'noopener,noreferrer')
  }
}

const handleRefresh = async () => {
  await hotStore.refreshCurrentPlatform()
  if (hotStore.error) {
    showToast('刷新失败，请稍后重试', 'error', 'refresh')
    return
  }

  showToast('热点已刷新', 'success', 'refresh')
}

const handleRetry = () => {
  void hotStore.retryCurrentPlatform()
}

const handleLoadMore = () => {
  if (hotStore.isFavoritesMode || hotStore.isSearchMode) {
    return
  }

  void hotStore.loadMore()
}

const handleLimitChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  void hotStore.setLimit(Number(target.value))
}

const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  hotStore.setSortMode(target.value as 'hot-desc')
}

const handleBaseUrlChange = async (baseUrl: string) => {
  const succeeded = await hotStore.setApiBaseUrl(baseUrl)
  if (!succeeded && typeof window !== 'undefined') {
    window.alert('接口地址格式错误，请输入 http:// 或 https:// 开头的地址。')
  }
}

const handleCopyFeedback = (payload: { success: boolean; message: string }) => {
  showToast(payload.message, payload.success ? 'success' : 'error', 'copy')
}

const clearToastTimer = () => {
  if (typeof window === 'undefined') {
    toastTimer = null
    return
  }

  if (toastTimer !== null) {
    window.clearTimeout(toastTimer)
    toastTimer = null
  }
}

const showToast = (
  message: string,
  tone: 'success' | 'error' | 'info' = 'info',
  kind: 'copy' | 'favorite' | 'refresh' | 'general' = 'general',
) => {
  toastMessage.value = message
  toastTone.value = tone
  toastKind.value = kind
  toastVisible.value = true

  clearToastTimer()
  if (typeof window === 'undefined') {
    return
  }

  toastTimer = window.setTimeout(() => {
    toastVisible.value = false
    toastTimer = null
  }, 1200)
}

onMounted(async () => {
  uiStore.initializeTheme()
  searchInput.value = hotStore.searchKeyword
  await hotStore.initialize()
})

onUnmounted(() => {
  clearToastTimer()
})
</script>

<template>
  <div class="home-page" :style="pageStyle">
    <HeaderBar
      :search="searchInput"
      :theme="uiStore.resolvedTheme"
      :refreshing="hotStore.loading"
      :searching="hotStore.searchLoading"
      :platform-name="headerPlatformName"
      :platform-color="currentPlatformBrand.primary"
      :favorites-mode="hotStore.isFavoritesMode"
      :favorite-count="hotStore.favoriteCount"
      @update:search="handleSearchChange"
      @refresh="handleRefresh"
      @toggle-favorites="handleToggleFavorites"
      @open-fortune="handleOpenFortunePicker"
      @open-lunch="handleOpenLunchPicker"
      @toggle-theme="handleThemeToggle"
      @help="handleHelp"
    />

    <main class="home-main">
      <section class="panel-card category-top-board">
        <div class="category-board-head">
          <div class="category-board-title">
            <h2>热点分类</h2>
          </div>
        </div>

        <div class="category-board-body">
          <CategoryBar
            class="category-main"
            :categories="hotStore.categoryOptions"
            :model-value="hotStore.currentCategory"
            :theme="uiStore.resolvedTheme"
            @update:model-value="handleCategoryChange"
          />

          <aside class="random-panel" aria-live="polite">
            <div class="random-entry-wrap">
              <button
                type="button"
                class="random-panel-btn"
                :disabled="randomJumping"
                :title="randomJumping ? '正在为你抽取热点' : '随机看一个热点'"
                :aria-label="randomJumping ? '正在抽取热点' : '随机看一个热点'"
                @click="handleRandomHotspot"
              >
                <span class="dice-icon" aria-hidden="true">🎲</span>
                <span>{{ randomButtonText }}</span>
              </button>
              <span class="random-tip" aria-hidden="true">随机看一个热点</span>
            </div>
          </aside>
        </div>
      </section>

      <section class="layout-grid">
        <section class="panel-card center-card">
          <div class="center-top">
            <div class="title-block">
              <h2>{{ resultTitle }}</h2>
              <p class="meta-text">
                {{ panelMetaText }}
                <span v-if="hotStore.searchLoading && !hotStore.isFavoritesMode" class="searching-badge">全网检索中...</span>
              </p>
            </div>

            <div v-if="!hotStore.isFavoritesMode" class="control-wrap">
              <label class="control-item">
                <span>排序</span>
                <select :value="hotStore.sortMode" @change="handleSortChange">
                  <option v-for="item in sortOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
              </label>

              <label class="control-item">
                <span>条数</span>
                <select :value="hotStore.limitOption" @change="handleLimitChange">
                  <option v-for="item in limitOptions" :key="item" :value="item">{{ item }}</option>
                </select>
              </label>
            </div>

            <div v-else class="favorites-actions">
              <button type="button" class="exit-favorites-btn" @click="handleExitFavorites">退出收藏，回到新闻首页</button>
            </div>
          </div>

          <PlatformTab
            v-if="!hotStore.isFavoritesMode"
            :platforms="hotStore.categoryPlatforms"
            :model-value="hotStore.currentPlatform"
            :theme="uiStore.resolvedTheme"
            :disabled="hotStore.loading"
            @update:model-value="handlePlatformChange"
            @reorder="handlePlatformReorder"
          />

          <Transition name="platform-fade" mode="out-in">
            <div :key="hotStore.isFavoritesMode ? `favorites-${hotStore.searchKeyword || 'all'}` : `${hotStore.currentPlatform}-${hotStore.searchKeyword || 'all'}`">
              <div v-if="stateIsLoading" class="state-panel">
                <LoadingState :rows="10" />
              </div>

              <div v-else-if="stateHasError" class="state-panel">
                <ErrorState
                  :message="hotStore.error?.message"
                  :cors-hint="hotStore.error?.isCorsLikely"
                  :timeout-hint="hotStore.error?.isTimeout"
                  @retry="handleRetry"
                />
              </div>

              <div v-else-if="stateIsEmpty" class="state-panel">
                <EmptyState
                  :title="hotStore.isFavoritesMode ? '还没有收藏内容' : hotStore.isSearchMode ? '未找到匹配热点' : '暂无热点数据'"
                  :description="hotStore.isFavoritesMode ? '点击每条新闻后的收藏按钮，即可保存到这里。' : hotStore.isSearchMode ? '当前为全网热榜聚合检索（非全文检索），可尝试同义词/中文关键词或稍后重试。' : '当前平台暂无可展示内容。'"
                />
              </div>

              <HotList
                v-else
                :items="hotStore.displayItems"
                :has-more="hotStore.isFavoritesMode || hotStore.isSearchMode ? false : hotStore.hasMore"
                :loading-more="hotStore.isFavoritesMode || hotStore.isSearchMode ? false : hotStore.loadingMore"
                :theme="uiStore.resolvedTheme"
                :show-platform="hotStore.isFavoritesMode || hotStore.isSearchMode"
                :favorite-keys="hotStore.favoriteKeys"
                :highlight-keyword="hotStore.searchKeyword"
                @load-more="handleLoadMore"
                @refresh="handleRefresh"
                @toggle-favorite="handleToggleFavorite"
                @copy-feedback="handleCopyFeedback"
              />
            </div>
          </Transition>
        </section>
      </section>
    </main>

    <Transition name="toast-fade">
      <div v-if="toastVisible" class="global-toast" :class="`is-${toastTone}`" role="status" aria-live="polite">
        <span class="toast-icon" aria-hidden="true">{{ toastIcon }}</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>

    <FooterBar :base-url="hotStore.apiBaseUrl" @update-base-url="handleBaseUrlChange" />
    <FortunePicker :open="fortunePickerOpen" :source-news="hotStore.displayItems" @close="handleCloseFortunePicker" />
    <LunchPicker :open="lunchPickerOpen" @close="handleCloseLunchPicker" />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  padding-bottom: 18px;
  position: relative;
  overflow-x: clip;
}

.home-page::before,
.home-page::after {
  content: '';
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  z-index: 0;
}

.home-page::before {
  width: 10px;
  height: 10px;
  top: 106px;
  right: 46px;
  background: rgba(232, 63, 55, 0.24);
  box-shadow: 14px 0 0 rgba(255, 200, 0, 0.34);
}

.home-page::after {
  width: 96px;
  height: 96px;
  left: -34px;
  top: 240px;
  background: radial-gradient(circle, rgba(255, 200, 0, 0.16) 0%, rgba(255, 200, 0, 0) 72%);
}

.home-main {
  width: min(1240px, calc(100% - 30px));
  margin: 0 auto;
  padding: 24px 0 0;
  position: relative;
  z-index: 1;
}

.category-top-board {
  margin-bottom: 24px;
  padding: 16px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: linear-gradient(120deg, #fffdf8, #fff5e6 42%, #fff8f1);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.category-top-board::before,
.category-top-board::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.category-top-board::before {
  width: 22px;
  height: 22px;
  top: -8px;
  right: 52px;
  background: rgba(232, 63, 55, 0.16);
}

.category-top-board::after {
  width: 22px;
  height: 22px;
  top: -8px;
  right: 18px;
  background: rgba(232, 63, 55, 0.16);
}

.category-board-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.category-board-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.category-board-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

.category-board-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.category-main {
  min-width: 0;
  align-self: center;
}

.random-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.random-entry-wrap {
  position: relative;
  display: inline-flex;
}

.random-panel-btn {
  height: 34px;
  border: 1px solid rgba(232, 63, 55, 0.3);
  border-radius: 999px;
  background: linear-gradient(135deg, #e83f37, #ff9d17);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
  transition: transform var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease);
}

.random-panel-btn:hover:not(:disabled) {
  transform: scale(1.02);
  border-color: rgba(232, 63, 55, 0.54);
  box-shadow: 0 8px 16px rgba(232, 63, 55, 0.26);
  filter: brightness(1.02);
  color: #ffffff;
}

.random-panel-btn:disabled {
  opacity: 0.68;
  cursor: wait;
}

.dice-icon {
  font-size: 15px;
  line-height: 1;
}

.random-tip {
  position: absolute;
  left: 50%;
  top: calc(100% + 6px);
  transform: translateX(-50%) translateY(-4px);
  border: 1px solid rgba(232, 63, 55, 0.3);
  border-radius: 999px;
  background: #ffffff;
  color: #a0473b;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  padding: 5px 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease);
}

.random-entry-wrap:hover .random-tip,
.random-entry-wrap:focus-within .random-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.layout-grid {
  min-width: 0;
}

.panel-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--panel-bg);
  box-shadow: var(--shadow-card);
  padding: 18px;
}

.panel-card h2,
.panel-card h3 {
  margin: 0 0 12px;
  color: var(--text-main);
  font-weight: 700;
  font-size: 18px;
}

.center-card {
  min-width: 0;
  border-color: var(--color-border);
}

.center-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.center-top h2 {
  margin-bottom: 0;
  font-size: 18px;
  font-weight: 600;
}

.title-block {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.meta-text {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.searching-badge {
  display: inline-flex;
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, #ffc800 28%, #fff4de);
  color: #b63a31;
  font-size: 10px;
  border: 1px solid rgba(232, 63, 55, 0.2);
}

.control-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorites-actions {
  display: flex;
  align-items: center;
}

.exit-favorites-btn {
  border: 1px solid var(--color-border);
  background: var(--panel-bg);
  color: var(--text-secondary);
  border-radius: 12px;
  min-height: 32px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease);
}

.exit-favorites-btn:hover {
  border-color: rgba(232, 63, 55, 0.46);
  color: #b83830;
  background: color-mix(in srgb, #ffc800 14%, #ffffff);
}

.control-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.control-item select {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  min-height: 32px;
  padding: 0 10px;
  background: var(--panel-bg);
  color: var(--text-main);
  font-size: 12px;
}

.control-item select:focus-visible,
.exit-favorites-btn:focus-visible,
.random-panel-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(232, 63, 55, 0.16);
}

.state-panel {
  margin-top: 12px;
}

.platform-fade-enter-active,
.platform-fade-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.platform-fade-enter-from,
.platform-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.platform-fade-enter-from {
  background: linear-gradient(0deg, var(--current-platform-soft), transparent 60%);
}

.global-toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 180;
  min-height: 36px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: #fffbf5;
  color: var(--text-main);
  padding: 0 12px 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 24px rgba(29, 33, 41, 0.18);
  font-size: 12px;
  font-weight: 500;
}

.toast-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  font-size: 11px;
  line-height: 1;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.toast-text {
  line-height: 1;
}

.global-toast.is-success {
  border-color: rgba(28, 169, 107, 0.32);
  color: #1d7f56;
  background: #effcf6;
}

.global-toast.is-error {
  border-color: rgba(232, 63, 55, 0.42);
  color: #bf3029;
  background: #fff2ee;
}

.global-toast.is-info {
  border-color: rgba(232, 63, 55, 0.3);
  color: #ab3d34;
  background: #fff7ea;
}

:global([data-theme='dark']) .category-top-board {
  background: linear-gradient(130deg, rgba(68, 32, 38, 0.86), rgba(56, 23, 29, 0.9));
}

:global([data-theme='dark']) .random-panel-btn {
  color: #301b0d;
  background: linear-gradient(135deg, #ffc800, #ff9d17);
  border-color: rgba(255, 200, 0, 0.5);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@media (max-width: 1200px) {
  .home-main {
    width: min(100%, calc(100% - 22px));
  }
}

@media (max-width: 900px) {
  .home-main {
    padding-top: 16px;
  }

  .category-board-body {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .category-board-head {
    margin-bottom: 6px;
  }

  .category-top-board {
    margin-bottom: 16px;
    padding: 12px;
  }

  .random-panel {
    width: fit-content;
    min-height: 36px;
  }

  .random-tip {
    display: none;
  }

  .center-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .title-block {
    text-align: left;
  }

  .control-wrap {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
