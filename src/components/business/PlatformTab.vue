<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { ResolvedTheme } from '../../constants/brand'
import type { PlatformInfo } from '../../types/hot'

const props = withDefaults(
  defineProps<{
    platforms: PlatformInfo[]
    modelValue: string
    theme?: ResolvedTheme
    disabled?: boolean
  }>(),
  {
    theme: 'light',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'reorder', orderedKeys: string[]): void
}>()

const scrollerRef = ref<HTMLDivElement | null>(null)
const localPlatforms = ref<PlatformInfo[]>([])
const isDragging = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const indicatorStyle = ref({
  width: '0px',
  transform: 'translateX(0px)',
  opacity: '0',
  background: 'transparent',
})

const buttonRefs = new Map<string, HTMLButtonElement>()

const setButtonRef = (key: string, element: unknown) => {
  if (element instanceof HTMLButtonElement) {
    buttonRefs.set(key, element)
  } else {
    buttonRefs.delete(key)
  }
}

const getOrderedButtons = () => {
  return localPlatforms.value
    .map((item) => buttonRefs.get(item.key))
    .filter((button): button is HTMLButtonElement => Boolean(button))
}

const getVisibleBoundaryIndices = (buttons: HTMLButtonElement[], scroller: HTMLDivElement) => {
  const leftEdge = scroller.scrollLeft
  const rightEdge = leftEdge + scroller.clientWidth

  let firstVisible = -1
  let lastVisible = -1

  buttons.forEach((button, index) => {
    const left = button.offsetLeft
    const right = left + button.offsetWidth
    const fullyVisible = left >= leftEdge + 1 && right <= rightEdge - 1

    if (fullyVisible) {
      if (firstVisible === -1) {
        firstVisible = index
      }
      lastVisible = index
    }
  })

  if (firstVisible !== -1 && lastVisible !== -1) {
    return { firstVisible, lastVisible }
  }

  buttons.forEach((button, index) => {
    const left = button.offsetLeft
    const right = left + button.offsetWidth
    const intersects = right > leftEdge + 1 && left < rightEdge - 1

    if (intersects) {
      if (firstVisible === -1) {
        firstVisible = index
      }
      lastVisible = index
    }
  })

  if (firstVisible === -1 || lastVisible === -1) {
    return null
  }

  return { firstVisible, lastVisible }
}

const scrollToButton = (button: HTMLButtonElement, align: 'start' | 'end') => {
  const scroller = scrollerRef.value
  if (!scroller) {
    return
  }

  const nextLeft = align === 'start'
    ? Math.max(0, button.offsetLeft - 6)
    : Math.max(0, button.offsetLeft + button.offsetWidth - scroller.clientWidth + 6)

  scroller.scrollTo({ left: nextLeft, behavior: 'smooth' })
}

const handleEdgeAutoScroll = (platformKey: string) => {
  const scroller = scrollerRef.value
  if (!scroller) {
    return
  }

  const buttons = getOrderedButtons()
  if (buttons.length === 0 || scroller.scrollWidth <= scroller.clientWidth + 2) {
    return
  }

  const clickedIndex = localPlatforms.value.findIndex((item) => item.key === platformKey)
  if (clickedIndex < 0) {
    return
  }

  const boundaries = getVisibleBoundaryIndices(buttons, scroller)
  if (!boundaries) {
    return
  }

  const { firstVisible, lastVisible } = boundaries
  if (clickedIndex === lastVisible && lastVisible < buttons.length - 1) {
    scrollToButton(buttons[lastVisible + 1], 'start')
    return
  }

  if (clickedIndex === firstVisible && firstVisible > 0) {
    scrollToButton(buttons[firstVisible - 1], 'end')
    return
  }

  const clickedButton = buttons[clickedIndex]
  if (!clickedButton) {
    return
  }

  const leftEdge = scroller.scrollLeft
  const rightEdge = leftEdge + scroller.clientWidth
  const buttonLeft = clickedButton.offsetLeft
  const buttonRight = buttonLeft + clickedButton.offsetWidth

  if (buttonLeft < leftEdge + 1) {
    scrollToButton(clickedButton, 'start')
    return
  }

  if (buttonRight > rightEdge - 1) {
    scrollToButton(clickedButton, 'end')
  }
}

const onTabClick = (platformKey: string) => {
  emit('update:modelValue', platformKey)
  handleEdgeAutoScroll(platformKey)
}

const updateIndicator = () => {
  const activeButton = buttonRefs.get(props.modelValue)
  if (!activeButton) {
    indicatorStyle.value = {
      width: '0px',
      transform: 'translateX(0px)',
      opacity: '0',
      background: 'transparent',
    }
    return
  }

  indicatorStyle.value = {
    width: `${Math.max(activeButton.clientWidth - 24, 30)}px`,
    transform: `translateX(${activeButton.offsetLeft + 12}px)`,
    opacity: '1',
    background: 'var(--brand-blue)',
  }
}

const getSelectStyle = () => {
  return {
    borderColor: 'var(--color-border)',
    boxShadow: 'none',
  }
}

const onSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

const onScroll = () => {
  updateIndicator()
  updateScrollEdges()
}

const updateScrollEdges = () => {
  const scroller = scrollerRef.value
  if (!scroller) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }

  const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  canScrollLeft.value = scroller.scrollLeft > 2
  canScrollRight.value = scroller.scrollLeft < maxScrollLeft - 2
}

const handleArrowScroll = (direction: 'left' | 'right') => {
  const scroller = scrollerRef.value
  if (!scroller) {
    return
  }

  const offset = Math.max(120, Math.floor(scroller.clientWidth * 0.45))
  const nextLeft = direction === 'left' ? scroller.scrollLeft - offset : scroller.scrollLeft + offset
  scroller.scrollTo({ left: nextLeft, behavior: 'smooth' })
}

const onWindowResize = () => {
  updateIndicator()
  updateScrollEdges()
}

const onDragEnd = () => {
  isDragging.value = false

  const orderedKeys = localPlatforms.value.map((item) => item.key)
  const previousKeys = props.platforms.map((item) => item.key)
  if (orderedKeys.join('|') !== previousKeys.join('|')) {
    emit('reorder', orderedKeys)
  }

  nextTick(updateIndicator)
}

const onDragStart = () => {
  isDragging.value = true
}

onMounted(() => {
  nextTick(updateIndicator)
  nextTick(updateScrollEdges)
  scrollerRef.value?.addEventListener('scroll', onScroll, { passive: true })
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onWindowResize)
  }
})

onUnmounted(() => {
  scrollerRef.value?.removeEventListener('scroll', onScroll)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowResize)
  }
})

watch(
  () => props.modelValue,
  () => {
    nextTick(updateIndicator)
    nextTick(updateScrollEdges)
  },
  { immediate: true },
)

watch(
  () => props.platforms,
  (platforms) => {
    localPlatforms.value = [...platforms]
    nextTick(updateIndicator)
    nextTick(updateScrollEdges)
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <div class="platform-tab-wrap">
    <div class="platform-select-wrap">
      <select :value="modelValue" :style="getSelectStyle()" :disabled="disabled" @change="onSelectChange">
        <option v-for="item in localPlatforms" :key="item.key" :value="item.key">{{ item.name }}</option>
      </select>
    </div>

    <div
      ref="scrollerRef"
      class="tab-scroll-wrap"
      :class="{ 'is-dragging': isDragging }"
      role="tablist"
      aria-label="platform-tabs"
    >
      <button
        type="button"
        class="tab-arrow left"
        :class="{ 'can-show': canScrollLeft }"
        aria-label="向左滚动平台"
        @click="handleArrowScroll('left')"
      >
        ‹
      </button>

      <button
        type="button"
        class="tab-arrow right"
        :class="{ 'can-show': canScrollRight }"
        aria-label="向右滚动平台"
        @click="handleArrowScroll('right')"
      >
        ›
      </button>

      <draggable
        v-model="localPlatforms"
        item-key="key"
        class="tab-scroll"
        tag="div"
        :disabled="disabled"
        :animation="200"
        handle=".drag-handle"
        drag-class="tab-dragging"
        ghost-class="tab-ghost"
        chosen-class="tab-chosen"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element: item }">
          <button
            :ref="(element) => setButtonRef(item.key, element)"
            type="button"
            class="tab-btn"
            :class="{ active: modelValue === item.key }"
            :disabled="disabled"
            @click="onTabClick(item.key)"
          >
            <span class="drag-handle" aria-hidden="true" title="拖拽排序">⋮⋮</span>
            {{ item.name }}
          </button>
        </template>
      </draggable>
      <div class="tab-indicator" :style="indicatorStyle" aria-hidden="true" />
    </div>

    <p class="tab-tip">小提示：按住标签前的小点可拖动调整顺序</p>
  </div>
</template>

<style scoped>
.platform-tab-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.platform-select-wrap {
  display: none;
}

.platform-select-wrap select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--panel-bg);
  color: var(--text-main);
  min-height: 32px;
  padding: 0 10px;
  font-size: 12px;
}

.tab-scroll-wrap {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 30px;
  scrollbar-width: thin;
  background: linear-gradient(135deg, #fffdf8, #fff5e8);
  transition: border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease);
}

.tab-scroll-wrap.is-dragging {
  border-color: rgba(232, 63, 55, 0.5);
  background: color-mix(in srgb, #ffc800 14%, #ffffff);
  box-shadow: 0 0 0 3px rgba(232, 63, 55, 0.12);
}

.tab-scroll {
  display: flex;
  gap: 4px;
  min-width: max-content;
}

.tab-arrow {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: 22px;
  border: 1px solid rgba(232, 63, 55, 0.2);
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel-bg) 92%, #ffffff);
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-duration) var(--motion-ease), color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease);
  z-index: 3;
}

.tab-arrow.left {
  left: 4px;
}

.tab-arrow.right {
  right: 4px;
}

.tab-scroll-wrap:hover .tab-arrow.can-show {
  opacity: 1;
  pointer-events: auto;
}

.tab-arrow:hover {
  color: #b8342d;
  border-color: rgba(232, 63, 55, 0.46);
  background: color-mix(in srgb, #ffc800 14%, #ffffff);
}

.tab-btn {
  flex: 0 0 auto;
  border: 1px solid rgba(232, 63, 55, 0.12);
  background: transparent;
  color: #755a48;
  border-radius: 999px;
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
  transition: color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease);
  position: relative;
  z-index: 1;
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
  color: #d9a489;
  cursor: grab;
  font-size: 10px;
  letter-spacing: -1px;
}

.tab-btn:active .drag-handle {
  cursor: grabbing;
}

.tab-btn:hover:not(:disabled) {
  color: #b7352f;
  border-color: rgba(232, 63, 55, 0.36);
  background: color-mix(in srgb, #ffc800 14%, #ffffff);
}

.tab-btn.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #dc5448, #f2b341);
  font-weight: 600;
  box-shadow: 0 7px 14px rgba(196, 88, 55, 0.2);
}

.tab-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(232, 63, 55, 0.15);
}

.tab-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.tab-indicator {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  border-radius: 1px;
  background: #e83f37;
  transition: transform var(--motion-duration) var(--motion-ease), width var(--motion-duration) var(--motion-ease), opacity var(--motion-duration) var(--motion-ease);
}

.tab-tip {
  margin: 0;
  font-size: 10px;
  line-height: 1.2;
  color: #9a7c67;
  opacity: 1;
}

.tab-ghost {
  opacity: 0.3;
  transform: scale(0.98);
}

.tab-chosen {
  border-color: rgba(232, 63, 55, 0.45);
  box-shadow: 0 8px 18px rgba(232, 63, 55, 0.18);
  transform: translateY(-1px);
  cursor: grabbing;
}

.tab-dragging {
  border-color: rgba(232, 63, 55, 0.55);
  box-shadow: 0 12px 22px rgba(232, 63, 55, 0.2);
  cursor: grabbing;
}

:global([data-theme='dark']) .tab-btn {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 200, 0, 0.16);
}

:global([data-theme='dark']) .tab-btn:hover:not(:disabled),
:global([data-theme='dark']) .tab-btn.active {
  background: linear-gradient(135deg, #e83f37, #ffc800);
  color: #2e1b0e;
}

:global([data-theme='dark']) .tab-scroll-wrap {
  background: linear-gradient(135deg, rgba(68, 32, 38, 0.92), rgba(52, 20, 25, 0.9));
}

@media (max-width: 760px) {
  .platform-select-wrap {
    display: block;
  }

  .tab-scroll-wrap {
    display: none;
  }

  .tab-tip {
    display: none;
  }
}
</style>
