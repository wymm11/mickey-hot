<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  FOOD_LIST,
  FOOD_MEAL_CATEGORY_OPTIONS,
  FOOD_PRICE_RANGE_OPTIONS,
  FOOD_SPICY_OPTIONS,
  FOOD_TYPE_OPTIONS,
  type FoodItem,
  type FoodMealCategory,
  type FoodPriceRangeKey,
  type FoodSpicyLevel,
  type FoodType,
} from '../../constants/foods'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

type PickerStatus = 'idle' | 'rolling' | 'result'

const LUNCH_RECENT_STORAGE_KEY = 'miqi-lunch-recent-v2'

const TYPE_TAG_MAP: Record<FoodType, string[]> = {
  地域美食: ['地道风味', '烟火气', '香味暴击'],
  荤素套餐: ['营养均衡', '一餐搞定', '下饭担当'],
  连锁品牌: ['出餐稳定', '不用纠结', '经典耐吃'],
  轻食素食: ['轻负担', '清爽不腻', '能量在线'],
}

const floatingSnackEmojis = ['🍔', '🍜', '🍕', '🍣', '🍟', '🍙']

const status = ref<PickerStatus>('idle')
const selectedType = ref<'all' | FoodType>('all')
const selectedSpicy = ref<'all' | FoodSpicyLevel>('all')
const selectedMealCategory = ref<'all' | FoodMealCategory>('all')
const selectedPriceRange = ref<FoodPriceRangeKey>('all')

const currentFood = ref<FoodItem | null>(null)
const rollingFoods = ref<FoodItem[]>([])
const rollingProgress = ref(0)
const imageFailed = ref(false)
const copyState = ref<'idle' | 'done' | 'error'>('idle')
const pickedHistory = ref<string[]>([])
const recentPickedIds = ref<string[]>([])

let rollingTimer: number | null = null
let copyResetTimer: number | null = null

const isDefaultFilter = computed(() => {
  return (
    selectedType.value === 'all' &&
    selectedSpicy.value === 'all' &&
    selectedMealCategory.value === 'all' &&
    selectedPriceRange.value === 'all'
  )
})

const inPriceRange = (price: number, rangeKey: FoodPriceRangeKey) => {
  if (rangeKey === '0-25') {
    return price <= 25
  }

  if (rangeKey === '25-45') {
    return price > 25 && price <= 45
  }

  if (rangeKey === '45+') {
    return price > 45
  }

  return true
}

const strictFilteredFoods = computed(() => {
  return FOOD_LIST.filter((item) => {
    if (selectedType.value !== 'all' && item.type !== selectedType.value) {
      return false
    }

    if (selectedSpicy.value !== 'all' && item.spicyLevel !== selectedSpicy.value) {
      return false
    }

    if (selectedMealCategory.value !== 'all' && item.mealCategory !== selectedMealCategory.value) {
      return false
    }

    if (!inPriceRange(item.price, selectedPriceRange.value)) {
      return false
    }

    return true
  })
})

const getMatchScore = (item: FoodItem) => {
  let score = 0

  if (selectedType.value !== 'all' && item.type === selectedType.value) {
    score += 4
  }

  if (selectedSpicy.value !== 'all' && item.spicyLevel === selectedSpicy.value) {
    score += 2
  }

  if (selectedMealCategory.value !== 'all' && item.mealCategory === selectedMealCategory.value) {
    score += 2
  }

  if (selectedPriceRange.value !== 'all' && inPriceRange(item.price, selectedPriceRange.value)) {
    score += 1
  }

  return score
}

const drawPool = computed(() => {
  if (strictFilteredFoods.value.length > 0) {
    return strictFilteredFoods.value
  }

  if (isDefaultFilter.value) {
    return FOOD_LIST
  }

  const scoredPool = FOOD_LIST.map((item) => ({
    item,
    score: getMatchScore(item),
  })).filter((entry) => entry.score > 0)

  if (scoredPool.length === 0) {
    return FOOD_LIST
  }

  const maxScore = scoredPool.reduce((highest, entry) => {
    return Math.max(highest, entry.score)
  }, 0)

  return scoredPool.filter((entry) => entry.score === maxScore).map((entry) => entry.item)
})

const hasStrictMatch = computed(() => strictFilteredFoods.value.length > 0)
const hasAnyDrawCandidate = computed(() => drawPool.value.length > 0)
const showRelaxedHint = computed(() => {
  return !isDefaultFilter.value && !hasStrictMatch.value && hasAnyDrawCandidate.value
})

const recentFoods = computed(() => {
  return recentPickedIds.value
    .map((id) => FOOD_LIST.find((item) => item.id === id))
    .filter((item): item is FoodItem => Boolean(item))
})

const takeRandomItems = <T,>(items: T[], count: number): T[] => {
  if (items.length <= count) {
    return [...items]
  }

  const cloned = [...items]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = cloned[index]
    cloned[index] = cloned[swapIndex]
    cloned[swapIndex] = temp
  }

  return cloned.slice(0, count)
}

const rotateFoods = (items: FoodItem[], offset: number): FoodItem[] => {
  if (items.length === 0) {
    return []
  }

  const safeOffset = ((offset % items.length) + items.length) % items.length
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)]
}

const randomFrom = <T,>(items: T[]): T | null => {
  if (items.length === 0) {
    return null
  }

  const index = Math.floor(Math.random() * items.length)
  return items[index]
}

const rollingRows = computed(() => {
  const baseSource = rollingFoods.value.length > 0 ? rollingFoods.value : takeRandomItems(drawPool.value.length > 0 ? drawPool.value : FOOD_LIST, 12)
  if (baseSource.length === 0) {
    return [] as FoodItem[][]
  }

  const denseBase = baseSource.length >= 10 ? baseSource : [...baseSource, ...baseSource, ...baseSource].slice(0, 10)
  const secondBase = rotateFoods(denseBase, Math.max(1, Math.floor(denseBase.length / 3)))
  const thirdBase = rotateFoods(denseBase, Math.max(2, Math.floor(denseBase.length / 2)))

  return [
    [...denseBase, ...denseBase],
    [...secondBase, ...secondBase],
    [...thirdBase, ...thirdBase],
  ]
})

const rollingBoardStyle = computed<Record<string, string>>(() => {
  const baseDuration = 1.25 + rollingProgress.value * 2.45
  return {
    '--roll-duration-1': `${baseDuration.toFixed(2)}s`,
    '--roll-duration-2': `${(baseDuration * 1.18).toFixed(2)}s`,
    '--roll-duration-3': `${(baseDuration * 0.9).toFixed(2)}s`,
  }
})

const drawButtonText = computed(() => {
  if (status.value === 'rolling') {
    return '热滚抽奖中...'
  }

  if (status.value === 'result') {
    return '再抽一轮'
  }

  return '开始抽奖'
})

const swapButtonText = computed(() => {
  if (status.value === 'rolling') {
    return '翻锅中...'
  }

  return '换一个'
})

const copyButtonText = computed(() => {
  if (copyState.value === 'done') {
    return '已复制'
  }

  if (copyState.value === 'error') {
    return '复制失败'
  }

  return '复制推荐'
})

const idlePreviewFoods = computed(() => {
  const pool = drawPool.value.length > 0 ? drawPool.value : FOOD_LIST
  return takeRandomItems(pool, 6)
})

const resultTags = computed(() => {
  if (!currentFood.value) {
    return [] as string[]
  }

  return [
    currentFood.value.category,
    currentFood.value.spicyLevel === '辣' ? '辣口' : '不辣',
    currentFood.value.mealCategory,
    `￥${currentFood.value.price}`,
    ...TYPE_TAG_MAP[currentFood.value.type],
  ].slice(0, 5)
})

const relatedFoods = computed(() => {
  if (!currentFood.value) {
    return [] as FoodItem[]
  }

  const pool = drawPool.value.length > 0 ? drawPool.value : FOOD_LIST
  const similar = pool.filter((item) => {
    if (item.id === currentFood.value?.id) {
      return false
    }

    return (
      item.category === currentFood.value?.category ||
      item.type === currentFood.value?.type ||
      item.mealCategory === currentFood.value?.mealCategory
    )
  })

  const fallback = pool.filter((item) => item.id !== currentFood.value?.id)
  return takeRandomItems(similar.length > 0 ? similar : fallback, 3)
})

const roastLine = computed(() => {
  if (!currentFood.value) {
    return ''
  }

  const roastPool = [
    `你以为在控卡，结果看见${currentFood.value.name}就直接破防，嘴比计划诚实。`,
    `${currentFood.value.name}今天出场像主角，别装了，你的胃已经投票通过。`,
    `还在纠结？你都点开抽奖了，${currentFood.value.name}已经是命中注定。`,
    `${currentFood.value.spicyLevel === '辣' ? '辣度拉满' : '温柔路线'}，但快乐值依然超标，别再假装理性。`,
    `今日预算看起来很克制，直到你遇见${currentFood.value.name}。`,
  ]

  const idSeed = Number(currentFood.value.id.replace('food-', '')) || 0
  return roastPool[idSeed % roastPool.length]
})

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

const clearCopyTimer = () => {
  if (typeof window === 'undefined') {
    copyResetTimer = null
    return
  }

  if (copyResetTimer !== null) {
    window.clearTimeout(copyResetTimer)
    copyResetTimer = null
  }
}

const persistRecentFoods = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LUNCH_RECENT_STORAGE_KEY, JSON.stringify(recentPickedIds.value))
}

const restoreRecentFoods = () => {
  if (typeof window === 'undefined') {
    recentPickedIds.value = []
    return
  }

  const raw = window.localStorage.getItem(LUNCH_RECENT_STORAGE_KEY)
  if (!raw) {
    recentPickedIds.value = []
    return
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      recentPickedIds.value = []
      return
    }

    const validSet = new Set(FOOD_LIST.map((item) => item.id))
    recentPickedIds.value = parsed
      .filter((item): item is string => typeof item === 'string' && validSet.has(item))
      .slice(0, 8)
  } catch {
    recentPickedIds.value = []
  }
}

const appendRecentFood = (food: FoodItem) => {
  const merged = [food.id, ...recentPickedIds.value.filter((id) => id !== food.id)].slice(0, 8)
  recentPickedIds.value = merged
  persistRecentFoods()
}

const pickFood = (): FoodItem | null => {
  const pool = drawPool.value
  if (pool.length === 0) {
    return null
  }

  const unseenPool = pool.filter((item) => !pickedHistory.value.includes(item.id))
  const source = unseenPool.length > 0 ? unseenPool : pool
  const picked = randomFrom(source)
  if (!picked) {
    return null
  }

  pickedHistory.value = [...pickedHistory.value.slice(-150), picked.id]
  appendRecentFood(picked)
  return picked
}

const refreshRollingFoods = () => {
  const pool = drawPool.value.length > 0 ? drawPool.value : FOOD_LIST
  if (pool.length === 0) {
    rollingFoods.value = []
    return
  }

  const nextFoods: FoodItem[] = []
  for (let index = 0; index < 18; index += 1) {
    const picked = randomFrom(pool)
    if (picked) {
      nextFoods.push(picked)
    }
  }

  rollingFoods.value = nextFoods
}

const finalizeDraw = () => {
  clearRollingTimer()
  const picked = pickFood()
  currentFood.value = picked
  imageFailed.value = false
  rollingProgress.value = 1
  status.value = picked ? 'result' : 'idle'
}

const runRollingStep = (step: number, maxSteps: number) => {
  const pool = drawPool.value
  if (pool.length === 0) {
    status.value = 'idle'
    clearRollingTimer()
    return
  }

  const picked = randomFrom(pool)
  if (picked) {
    rollingFoods.value = [...rollingFoods.value.slice(1), picked]
  }

  rollingProgress.value = Math.min(1, step / maxSteps)

  if (step >= maxSteps) {
    if (typeof window === 'undefined') {
      finalizeDraw()
      return
    }

    rollingTimer = window.setTimeout(() => {
      finalizeDraw()
    }, 120)
    return
  }

  const progress = step / maxSteps
  const delay = Math.round(42 + progress * progress * 220)

  if (typeof window === 'undefined') {
    runRollingStep(step + 1, maxSteps)
    return
  }

  rollingTimer = window.setTimeout(() => {
    runRollingStep(step + 1, maxSteps)
  }, delay)
}

const startDraw = () => {
  if (status.value === 'rolling' || !hasAnyDrawCandidate.value) {
    return
  }

  clearRollingTimer()
  refreshRollingFoods()
  rollingProgress.value = 0
  status.value = 'rolling'
  copyState.value = 'idle'

  runRollingStep(0, 24)
}

const useRecentFood = (item: FoodItem) => {
  if (status.value === 'rolling') {
    return
  }

  currentFood.value = item
  imageFailed.value = false
  status.value = 'result'
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

const handleCopy = async () => {
  if (!currentFood.value) {
    return
  }

  const text = [
    `今日午饭推荐：${currentFood.value.name} ${currentFood.value.icon}`,
    `口味：${currentFood.value.spicyLevel}｜餐型：${currentFood.value.mealCategory}｜预计价格：￥${currentFood.value.price}`,
    currentFood.value.desc,
    `毒舌点评：${roastLine.value}`,
  ].join('\n')

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      copyState.value = 'done'
    } else {
      copyState.value = 'error'
    }
  } catch {
    copyState.value = 'error'
  }

  clearCopyTimer()
  if (typeof window !== 'undefined') {
    copyResetTimer = window.setTimeout(() => {
      copyState.value = 'idle'
      copyResetTimer = null
    }, 1200)
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      status.value = currentFood.value ? 'result' : 'idle'
      copyState.value = 'idle'
      imageFailed.value = false
      rollingProgress.value = 0
      refreshRollingFoods()
      return
    }

    clearRollingTimer()
    clearCopyTimer()
  },
)

watch(
  () => [selectedType.value, selectedSpicy.value, selectedMealCategory.value, selectedPriceRange.value],
  () => {
    if (!props.open) {
      return
    }

    if (status.value === 'rolling') {
      clearRollingTimer()
    }

    status.value = 'idle'
    currentFood.value = null
    imageFailed.value = false
    rollingProgress.value = 0
    refreshRollingFoods()
  },
)

onMounted(() => {
  restoreRecentFoods()
})

onUnmounted(() => {
  clearRollingTimer()
  clearCopyTimer()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lunch-fade">
      <div v-if="open" class="lunch-overlay" @click="onMaskClick">
        <section class="lunch-panel" role="dialog" aria-modal="true" aria-label="中午吃什么推荐器">
          <header class="lunch-header">
            <div>
              <h2>米奇今天吃啥？</h2>
              <p>红黄灵感转盘 · 选中今天最对味的一餐</p>
            </div>
            <button type="button" class="close-btn" aria-label="关闭" @click="closePicker">✕</button>
          </header>

          <section class="filter-panel" aria-label="午餐筛选">
            <div class="filter-row">
              <span class="filter-label">类型</span>
              <div class="chip-wrap">
                <button
                  v-for="item in FOOD_TYPE_OPTIONS"
                  :key="item.key"
                  type="button"
                  class="type-chip"
                  :class="{ active: selectedType === item.key }"
                  @click="selectedType = item.key"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <div class="filter-row">
              <span class="filter-label">辣度</span>
              <div class="chip-wrap">
                <button
                  v-for="item in FOOD_SPICY_OPTIONS"
                  :key="item.key"
                  type="button"
                  class="type-chip"
                  :class="{ active: selectedSpicy === item.key }"
                  @click="selectedSpicy = item.key"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <div class="filter-row">
              <span class="filter-label">餐型</span>
              <div class="chip-wrap">
                <button
                  v-for="item in FOOD_MEAL_CATEGORY_OPTIONS"
                  :key="item.key"
                  type="button"
                  class="type-chip"
                  :class="{ active: selectedMealCategory === item.key }"
                  @click="selectedMealCategory = item.key"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <div class="filter-row">
              <span class="filter-label">预算</span>
              <div class="chip-wrap">
                <button
                  v-for="item in FOOD_PRICE_RANGE_OPTIONS"
                  :key="item.key"
                  type="button"
                  class="type-chip"
                  :class="{ active: selectedPriceRange === item.key }"
                  @click="selectedPriceRange = item.key"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <p v-if="showRelaxedHint" class="empty-filter-tip">当前组合暂无严格匹配，已按最接近口味放宽筛选，可直接抽奖。</p>
          </section>

          <main class="lunch-main">
            <div v-if="status === 'idle'" class="state-idle">
              <div class="idle-scene" aria-hidden="true">
                <span class="idle-cloud cloud-left" />
                <span class="idle-cloud cloud-right" />
                <span class="idle-spark sparkle-a">✦</span>
                <span class="idle-spark sparkle-b">✦</span>
                <span class="idle-spark sparkle-c">✦</span>

                <div class="empty-plate">
                  <span class="plate-rim" />
                  <span class="plate-core" />
                  <span class="plate-eye eye-left" />
                  <span class="plate-eye eye-right" />
                  <span class="plate-blush blush-left" />
                  <span class="plate-blush blush-right" />
                  <span class="plate-smile" />
                  <span class="plate-spoon" />
                  <span class="plate-chopstick" />
                </div>

                <div class="idle-food-icons">
                  <span>🍅</span>
                  <span>🍖</span>
                  <span>🍜</span>
                  <span>🥗</span>
                </div>
              </div>

              <p class="idle-caption">点击下方按钮，抽取今日干饭灵感～</p>

              <div class="idle-suggestions">
                <span v-for="item in idlePreviewFoods" :key="`idle-${item.id}`" class="idle-chip">{{ item.icon }} {{ item.name }}</span>
              </div>

              <section v-if="recentFoods.length > 0" class="recent-board">
                <h4>最近吃过</h4>
                <div class="recent-chip-list">
                  <button
                    v-for="item in recentFoods"
                    :key="`recent-${item.id}`"
                    type="button"
                    class="recent-chip"
                    @click="useRecentFood(item)"
                  >
                    {{ item.icon }} {{ item.name }}
                  </button>
                </div>
              </section>
            </div>

            <div v-else-if="status === 'rolling'" class="state-rolling">
              <p class="rolling-tip">米奇手套正在点选，马上为你定格今日菜单...</p>
              <span class="glove-pointer" aria-hidden="true">🧤</span>
              <div class="rolling-mask left" aria-hidden="true" />
              <div class="rolling-mask right" aria-hidden="true" />

              <div class="rolling-board" :style="rollingBoardStyle" role="status" aria-live="polite">
                <div
                  v-for="(rowItems, rowIndex) in rollingRows"
                  :key="`row-${rowIndex}`"
                  class="rolling-row"
                  :class="`row-${rowIndex + 1}`"
                >
                  <div class="rolling-track">
                    <article
                      v-for="(item, index) in rowItems"
                      :key="`${item.id}-${rowIndex}-${index}`"
                      class="rolling-item"
                    >
                      <div class="rolling-image-wrap">
                        <img :src="item.img" :alt="item.name" loading="lazy" />
                        <span class="rolling-icon" aria-hidden="true">{{ item.icon }}</span>
                      </div>
                      <span class="rolling-item-name">{{ item.name }}</span>
                    </article>
                  </div>
                </div>
              </div>

              <div class="rolling-progress">
                <span class="progress-bar" :style="{ width: `${Math.round(rollingProgress * 100)}%` }" />
              </div>

              <div class="rolling-floats" aria-hidden="true">
                <span
                  v-for="(emoji, index) in floatingSnackEmojis"
                  :key="`float-${emoji}-${index}`"
                  :style="{ animationDelay: `${index * 0.35}s` }"
                >
                  {{ emoji }}
                </span>
              </div>
            </div>

            <div v-else-if="currentFood" class="state-result">
              <article class="result-card">
                <div class="steam-sticker" aria-hidden="true">♨️</div>

                <div class="result-layout">
                  <div class="food-image-wrap">
                    <img
                      v-if="!imageFailed"
                      :src="currentFood.img"
                      :alt="currentFood.name"
                      loading="lazy"
                      @error="imageFailed = true"
                    />
                    <div v-else class="food-fallback">
                      <span class="fallback-emoji">{{ currentFood.icon }}</span>
                      <strong>{{ currentFood.name }}</strong>
                      <span class="fallback-meta">{{ currentFood.category }} · {{ currentFood.type }}</span>
                    </div>
                  </div>

                  <aside class="result-side">
                    <div class="taste-tags">
                      <span v-for="tag in resultTags" :key="tag" class="taste-chip">{{ tag }}</span>
                    </div>

                    <div class="food-info">
                      <h3>{{ currentFood.name }}</h3>
                      <p>{{ currentFood.desc }}</p>
                      <span class="food-meta">{{ currentFood.type }} · {{ currentFood.category }} · 预算约￥{{ currentFood.price }}</span>
                    </div>

                    <p class="roast-line">🫠 {{ roastLine }}</p>

                    <div class="related-box">
                      <h4>顺手再看</h4>
                      <ul>
                        <li v-for="item in relatedFoods" :key="`related-${item.id}`">{{ item.icon }} {{ item.name }}</li>
                      </ul>
                    </div>
                  </aside>
                </div>
              </article>
            </div>
          </main>

          <footer class="lunch-actions">
            <button type="button" class="draw-btn" :disabled="status === 'rolling' || !hasAnyDrawCandidate" @click="startDraw">{{ drawButtonText }}</button>
            <button
              type="button"
              class="swap-btn"
              :disabled="status === 'rolling' || !currentFood || !hasAnyDrawCandidate"
              @click="startDraw"
            >
              🎲 {{ swapButtonText }}
            </button>
            <button type="button" class="copy-btn" :disabled="!currentFood || status === 'rolling'" @click="handleCopy">
              📋 {{ copyButtonText }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lunch-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 24, 33, 0.42);
  backdrop-filter: blur(4px);
  padding: 20px;
  overflow-y: auto;
}

.lunch-panel {
  width: min(820px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  max-height: calc(100dvh - 24px);
  border-radius: 16px;
  border: 1px solid rgba(232, 63, 55, 0.26);
  background: linear-gradient(140deg, #fffdf8 0%, #fff4e5 44%, #fff8ef 100%);
  box-shadow: 0 14px 34px rgba(17, 24, 39, 0.18);
  overflow-y: auto;
}

.lunch-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 18px 8px;
}

.lunch-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: linear-gradient(90deg, #e83f37 0%, #ff8c2a 54%, #ffc800 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-family: 'YouYuan', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.lunch-header p {
  margin: 2px 0 0;
  font-size: 0.74rem;
  color: #9f6f53;
}

.close-btn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(232, 63, 55, 0.34);
  background: rgba(255, 255, 255, 0.88);
  color: #d14037;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.close-btn:hover {
  color: #bf332b;
  border-color: rgba(232, 63, 55, 0.66);
  transform: rotate(8deg);
}

.filter-panel {
  display: grid;
  gap: 7px;
  padding: 0 18px 8px;
}

.filter-row {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 10px;
  align-items: center;
}

.filter-label {
  font-size: 0.74rem;
  color: #aa6f3c;
  font-weight: 700;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.type-chip {
  border: 1px solid rgba(255, 157, 77, 0.34);
  background: rgba(255, 255, 255, 0.88);
  color: #9a5c2a;
  border-radius: 999px;
  min-height: 31px;
  padding: 0 12px;
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.type-chip:hover {
  background: rgba(255, 231, 204, 0.92);
  transform: translateY(-1px);
}

.type-chip.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(130deg, #e83f37, #ff9a16);
  box-shadow: 0 8px 16px rgba(232, 63, 55, 0.24);
}

.empty-filter-tip {
  margin: 2px 0 0;
  font-size: 0.72rem;
  color: #be5f32;
}

.lunch-main {
  min-height: 392px;
  padding: 10px 18px 12px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.62), rgba(255, 240, 225, 0.54) 46%, rgba(255, 230, 220, 0.52));
}

.lunch-main::before,
.lunch-main::after {
  content: '';
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
}

.lunch-main::before {
  width: 240px;
  height: 240px;
  top: -136px;
  left: -96px;
  background: radial-gradient(circle, rgba(255, 157, 77, 0.2) 0%, rgba(255, 157, 77, 0) 72%);
}

.lunch-main::after {
  width: 220px;
  height: 220px;
  right: -100px;
  bottom: -126px;
  background: radial-gradient(circle, rgba(245, 63, 63, 0.14) 0%, rgba(245, 63, 63, 0) 72%);
}

.state-idle {
  position: relative;
  z-index: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.idle-scene {
  position: relative;
  width: min(520px, 100%);
  min-height: 238px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-plate {
  width: 208px;
  height: 208px;
  position: relative;
  animation: plate-bob 2.8s ease-in-out infinite;
}

.plate-rim {
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  border: 8px solid #ffd3ac;
  background: radial-gradient(circle at 35% 28%, #fffefb 0%, #fff3e4 65%, #ffe4c5 100%);
  box-shadow: 0 14px 22px rgba(255, 157, 77, 0.2);
}

.plate-core {
  position: absolute;
  inset: 16%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 26%, #ffffff 0%, #fff8ef 54%, #ffedd5 100%);
  border: 2px solid rgba(255, 157, 77, 0.35);
}

.plate-eye,
.plate-blush,
.plate-smile {
  position: absolute;
  z-index: 3;
}

.plate-eye {
  top: 42%;
  width: 8%;
  height: 11%;
  border-radius: 999px;
  background: #a7632f;
}

.eye-left {
  left: 40%;
}

.eye-right {
  left: 52%;
}

.plate-blush {
  top: 54%;
  width: 11%;
  height: 6%;
  border-radius: 999px;
  background: rgba(245, 63, 63, 0.22);
}

.blush-left {
  left: 29%;
}

.blush-right {
  left: 60%;
}

.plate-smile {
  top: 58%;
  left: 45%;
  width: 10%;
  height: 6%;
  border-bottom: 3px solid #cb8a4c;
  border-radius: 0 0 999px 999px;
}

.plate-spoon,
.plate-chopstick {
  position: absolute;
  border-radius: 999px;
  background: linear-gradient(180deg, #d9a16a, #b8793f);
  z-index: 0;
}

.plate-spoon {
  width: 6px;
  height: 94px;
  right: 8%;
  top: 18%;
  transform: rotate(24deg);
}

.plate-spoon::before {
  content: '';
  position: absolute;
  top: -14px;
  left: -5px;
  width: 16px;
  height: 20px;
  border-radius: 10px 10px 12px 12px;
  background: linear-gradient(180deg, #f7c690, #d99852);
}

.plate-chopstick {
  width: 5px;
  height: 100px;
  left: 10%;
  top: 17%;
  transform: rotate(-22deg);
}

.idle-caption {
  font-size: 0.82rem;
  color: #9b7d63;
}

.idle-food-icons {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.idle-food-icons span {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 157, 77, 0.22);
  box-shadow: 0 6px 12px rgba(255, 157, 77, 0.15);
  animation: food-icon-bounce 2.4s ease-in-out infinite;
}

.idle-food-icons span:nth-child(2) {
  animation-delay: 0.2s;
}

.idle-food-icons span:nth-child(3) {
  animation-delay: 0.4s;
}

.idle-food-icons span:nth-child(4) {
  animation-delay: 0.6s;
}

.idle-cloud {
  position: absolute;
  width: 88px;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  z-index: 0;
}

.idle-cloud::before,
.idle-cloud::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
}

.idle-cloud::before {
  width: 28px;
  height: 28px;
  left: 10px;
  top: -10px;
}

.idle-cloud::after {
  width: 22px;
  height: 22px;
  right: 12px;
  top: -6px;
}

.cloud-left {
  left: 14%;
  top: 16%;
  animation: cloud-drift 4.4s ease-in-out infinite;
}

.cloud-right {
  right: 14%;
  top: 22%;
  animation: cloud-drift 5.1s ease-in-out infinite reverse;
}

.idle-spark {
  position: absolute;
  color: #ff9d4d;
  font-size: 1rem;
  opacity: 0.7;
  animation: sparkle-twinkle 1.8s ease-in-out infinite;
}

.sparkle-a {
  left: 24%;
  top: 30%;
}

.sparkle-b {
  right: 24%;
  top: 34%;
  animation-delay: 0.5s;
}

.sparkle-c {
  right: 34%;
  top: 18%;
  animation-delay: 0.9s;
}

.idle-suggestions {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: 560px;
}

.idle-chip {
  border-radius: 999px;
  border: 1px solid rgba(255, 157, 77, 0.25);
  background: rgba(255, 255, 255, 0.82);
  color: #91562b;
  padding: 4px 10px;
  font-size: 0.72rem;
}

.recent-board {
  margin-top: 4px;
  width: min(560px, 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 157, 77, 0.26);
  background: rgba(255, 255, 255, 0.72);
  padding: 10px;
}

.recent-board h4 {
  margin: 0 0 8px;
  font-size: 0.76rem;
  color: #9e6332;
}

.recent-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.recent-chip {
  border: 1px solid rgba(255, 157, 77, 0.34);
  background: #ffffff;
  color: #8f5326;
  border-radius: 999px;
  min-height: 28px;
  padding: 0 10px;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.recent-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(245, 63, 63, 0.42);
  color: #b13f20;
}

.state-rolling {
  z-index: 1;
  min-height: 360px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(232, 63, 55, 0.2);
  background: linear-gradient(100deg, rgba(255, 246, 232, 0.92), rgba(255, 255, 255, 0.82), rgba(255, 238, 210, 0.85));
  padding: 44px 12px 12px;
  display: grid;
  align-items: center;
}

.rolling-tip {
  position: absolute;
  left: 50%;
  top: 10px;
  transform: translateX(-50%);
  z-index: 4;
  border-radius: 999px;
  border: 1px solid rgba(232, 63, 55, 0.22);
  background: rgba(255, 255, 255, 0.8);
  color: #a45a3b;
  font-size: 0.72rem;
  padding: 4px 10px;
  white-space: nowrap;
}

.glove-pointer {
  position: absolute;
  right: 24px;
  top: 8px;
  z-index: 4;
  font-size: 1.02rem;
  filter: drop-shadow(0 4px 6px rgba(232, 63, 55, 0.22));
  animation: glove-tap 0.9s ease-in-out infinite;
}

.rolling-board {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 8px;
}

.rolling-row {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255, 157, 77, 0.18);
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(2px);
}

.rolling-track {
  display: flex;
  gap: 10px;
  width: max-content;
  padding: 8px;
  align-items: center;
}

.row-1 .rolling-track {
  animation: food-marquee-left var(--roll-duration-1, 2.4s) linear infinite;
}

.row-2 .rolling-track {
  animation: food-marquee-right var(--roll-duration-2, 2.9s) linear infinite;
}

.row-3 .rolling-track {
  animation: food-marquee-left var(--roll-duration-3, 2.1s) linear infinite;
}

.rolling-item {
  width: 146px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(232, 63, 55, 0.18);
  box-shadow: 0 8px 16px rgba(232, 63, 55, 0.12);
  overflow: hidden;
  position: relative;
}

.rolling-item::before,
.rolling-item::after {
  content: '';
  position: absolute;
  top: -7px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(232, 63, 55, 0.13);
}

.rolling-item::before {
  left: 10px;
}

.rolling-item::after {
  left: 24px;
}

.rolling-image-wrap {
  position: relative;
}

.rolling-item img {
  width: 100%;
  aspect-ratio: 4 / 2.8;
  object-fit: cover;
  display: block;
  filter: saturate(1.12) contrast(1.06);
}

.rolling-icon {
  position: absolute;
  left: 6px;
  top: 6px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 157, 77, 0.26);
}

.rolling-item-name {
  display: block;
  padding: 6px 8px;
  font-size: 0.7rem;
  color: #4a5568;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rolling-progress {
  margin-top: 8px;
  width: 100%;
  max-width: 320px;
  margin-inline: auto;
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(255, 157, 77, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 3;
}

.progress-bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #e83f37, #ffc800);
  transition: width 0.18s linear;
}

.rolling-floats {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.rolling-floats span {
  position: absolute;
  bottom: -16px;
  font-size: 1.02rem;
  opacity: 0.46;
  animation: float-snack 4.2s ease-in infinite;
}

.rolling-floats span:nth-child(1) {
  left: 8%;
}

.rolling-floats span:nth-child(2) {
  left: 23%;
}

.rolling-floats span:nth-child(3) {
  left: 41%;
}

.rolling-floats span:nth-child(4) {
  left: 59%;
}

.rolling-floats span:nth-child(5) {
  left: 76%;
}

.rolling-floats span:nth-child(6) {
  left: 90%;
}

.rolling-mask {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 72px;
  z-index: 3;
  pointer-events: none;
}

.rolling-mask.left {
  left: 0;
  background: linear-gradient(90deg, #fffbf2 10%, rgba(255, 251, 242, 0));
}

.rolling-mask.right {
  right: 0;
  background: linear-gradient(270deg, #ffe8de 10%, rgba(255, 232, 222, 0));
}

.state-result {
  z-index: 1;
  min-height: 360px;
  display: grid;
  place-items: center;
}

.result-card {
  position: relative;
  width: min(670px, 100%);
  border-radius: 12px;
  padding: 14px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(31, 41, 55, 0.16);
  border: 1px solid rgba(255, 157, 77, 0.2);
  animation: result-pop 0.35s ease-out;
}

.steam-sticker {
  position: absolute;
  right: 10px;
  top: -10px;
  font-size: 1.42rem;
  animation: steam-rise 1.6s ease-in-out infinite;
}

.result-layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 12px;
  align-items: stretch;
}

.food-image-wrap {
  border-radius: 12px;
  overflow: hidden;
  background: #fff4e6;
  min-height: 252px;
  position: relative;
}

.food-image-wrap::before,
.food-image-wrap::after {
  content: '';
  position: absolute;
  top: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  z-index: 3;
  background: rgba(232, 63, 55, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.food-image-wrap::before {
  left: 8px;
}

.food-image-wrap::after {
  left: 24px;
}

.food-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.food-fallback {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1rem;
  color: #9a5c2a;
  background: linear-gradient(140deg, #ffe5cc, #fff0f0 52%, #ffe4d6);
}

.fallback-emoji {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 2.8rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 157, 77, 0.32);
  box-shadow: 0 10px 18px rgba(255, 157, 77, 0.2);
}

.food-fallback strong {
  font-size: 1.34rem;
}

.food-fallback .fallback-meta {
  font-size: 0.82rem;
  color: #a16c3c;
}

.result-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.taste-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.taste-chip {
  border-radius: 999px;
  border: 1px solid rgba(245, 63, 63, 0.2);
  background: rgba(255, 157, 77, 0.14);
  color: #b76127;
  padding: 3px 9px;
  font-size: 0.68rem;
}

.food-info {
  border-radius: 12px;
  border: 1px solid rgba(255, 157, 77, 0.2);
  background: linear-gradient(140deg, rgba(255, 157, 77, 0.08), rgba(255, 255, 255, 0.94));
  padding: 10px;
}

.food-info h3 {
  margin: 0;
  color: #1d2129;
  font-size: 1.05rem;
  font-weight: 700;
}

.food-info p {
  margin: 6px 0 0;
  color: #7b8999;
  font-size: 0.82rem;
}

.food-meta {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #fff4e8;
  color: #c67b3d;
  padding: 3px 9px;
  font-size: 0.72rem;
}

.roast-line {
  margin: 0;
  border-radius: 12px;
  border: 1px solid rgba(245, 63, 63, 0.2);
  background: rgba(255, 241, 235, 0.82);
  color: #9e4f26;
  font-size: 0.76rem;
  line-height: 1.55;
  padding: 8px 10px;
}

.related-box {
  border-radius: 12px;
  border: 1px solid rgba(255, 157, 77, 0.24);
  background: rgba(255, 248, 240, 0.78);
  padding: 8px 10px;
}

.related-box h4 {
  margin: 0 0 6px;
  font-size: 0.76rem;
  color: #9d5b2a;
}

.related-box ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
}

.related-box li {
  font-size: 0.72rem;
  color: #4e5a6c;
}

.lunch-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 2px 18px 16px;
}

.draw-btn,
.swap-btn,
.copy-btn {
  min-width: 134px;
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, filter 0.2s ease-out;
}

.draw-btn {
  background: linear-gradient(135deg, #e83f37, #ff9c1c);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(232, 63, 55, 0.26);
}

.swap-btn {
  background: linear-gradient(135deg, #ffc800, #ffd85a);
  color: #6f4509;
  border-color: rgba(232, 63, 55, 0.2);
}

.copy-btn {
  background: linear-gradient(135deg, #fff9ef, #fff3de);
  color: #8a4f23;
  border-color: rgba(232, 63, 55, 0.2);
}

.draw-btn:hover:not(:disabled),
.swap-btn:hover:not(:disabled),
.copy-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.draw-btn:disabled,
.swap-btn:disabled,
.copy-btn:disabled {
  opacity: 0.56;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.lunch-fade-enter-active,
.lunch-fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.lunch-fade-enter-from,
.lunch-fade-leave-to {
  opacity: 0;
}

@keyframes food-marquee-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes food-marquee-right {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes float-snack {
  0% {
    transform: translateY(0) scale(0.9);
    opacity: 0;
  }
  18% {
    opacity: 0.55;
  }
  100% {
    transform: translateY(-320px) scale(1.12);
    opacity: 0;
  }
}

@keyframes plate-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes sparkle-twinkle {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.85) rotate(0deg);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.15) rotate(8deg);
  }
}

@keyframes cloud-drift {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
}

@keyframes food-icon-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes result-pop {
  0% {
    transform: scale(0.92);
    opacity: 0;
  }
  60% {
    transform: scale(1.04);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

@keyframes steam-rise {
  0% {
    transform: translateY(8px) scale(0.9);
    opacity: 0.35;
  }
  50% {
    transform: translateY(-4px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateY(-12px) scale(0.95);
    opacity: 0.38;
  }
}

@keyframes glove-tap {
  0%,
  100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  50% {
    transform: translateX(-5px) translateY(2px) rotate(-9deg);
  }
}

@media (max-width: 920px) {
  .lunch-overlay {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
    background: rgba(20, 24, 33, 0.58);
  }

  .lunch-panel {
    width: 100vw;
    height: 100dvh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    border: none;
  }

  .lunch-main {
    flex: 1;
    min-height: 0;
  }

  .state-idle,
  .state-rolling,
  .state-result {
    min-height: 100%;
  }

  .filter-row {
    grid-template-columns: 38px 1fr;
    gap: 8px;
  }

  .result-layout {
    grid-template-columns: 1fr;
  }

  .food-image-wrap {
    min-height: 216px;
  }

  .rolling-tip {
    font-size: 0.68rem;
    max-width: calc(100% - 24px);
    text-align: center;
    white-space: normal;
  }

  .state-rolling {
    padding: 44px 8px 10px;
  }

  .rolling-board {
    gap: 7px;
  }

  .rolling-item {
    width: 126px;
  }

  .rolling-item-name {
    font-size: 0.66rem;
  }

  .rolling-floats {
    display: none;
  }

  .lunch-actions {
    gap: 8px;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(6px);
    border-top: 1px solid rgba(255, 157, 77, 0.2);
  }

  .draw-btn,
  .swap-btn,
  .copy-btn {
    flex: 1;
    min-height: 48px;
    font-size: 0.9rem;
  }
}
</style>
