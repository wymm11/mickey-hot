import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  CATEGORY_OPTIONS,
  DEFAULT_CATEGORY,
  DEFAULT_PLATFORM,
  PLATFORM_MAP,
  PLATFORM_OPTIONS,
  PLATFORMS_BY_CATEGORY,
} from '../constants/platforms'
import { getApiBaseUrl, normalizeBaseUrl, setApiBaseUrl as persistApiBaseUrl } from '../config/apiConfig'
import { buildRssUrl, fetchAvailablePlatformKeys, fetchPlatformHotList } from '../services/hotApi'
import { normalizeRequestError } from '../services/http'
import type {
  CacheRecord,
  FavoritedHotItem,
  NormalizedHotItem,
  PlatformCategory,
  PlatformInfo,
  RequestErrorInfo,
} from '../types/hot'
import { normalizeKeyword } from '../utils/format'

const CACHE_STORAGE_KEY = 'daily-hot-cache-v1'
const PLATFORM_ORDER_STORAGE_KEY = 'daily-hot-platform-order-v1'
const FAVORITES_STORAGE_KEY = 'daily-hot-favorites-v1'
const CACHE_TTL_MS = 30 * 60 * 1000
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 200
const SEARCH_FAST_CONCURRENCY = 6
const SEARCH_DEEP_CONCURRENCY = 3
const SEARCH_FAST_LIMIT = 40
const SEARCH_DEEP_LIMIT = MAX_LIMIT
const SEARCH_FAST_TIMEOUT_MS = 1800
const SEARCH_DEEP_TIMEOUT_MS = 3200
const RANDOM_PICK_CONCURRENCY = 6
const RANDOM_PICK_MAX_BATCHES = 3
const RANDOM_PICK_LIMIT = 12
const RANDOM_PICK_TIMEOUT_MS = 3000
const CATEGORY_KEYS: PlatformCategory[] = ['general', 'entertainment', 'tech', 'game']
const ALL_PLATFORM_KEYS = PLATFORM_OPTIONS.map((item) => item.key)
const ALL_PLATFORM_KEY_SET = new Set(ALL_PLATFORM_KEYS)

type SortMode = 'hot-desc'

interface RequestOptions {
  limit?: number
  force?: boolean
  silent?: boolean
  loadingMore?: boolean
  forSearch?: boolean
  token?: number
  timeoutMs?: number
}

function isCacheFresh(record: CacheRecord | undefined, limit: number): boolean {
  if (!record) {
    return false
  }
  const isNotExpired = Date.now() - record.updatedAt <= CACHE_TTL_MS
  return isNotExpired && record.data.length >= limit
}

function sortByHotDesc(items: NormalizedHotItem[]): NormalizedHotItem[] {
  return [...items].sort((a, b) => {
    const right = b.hot ?? -1
    const left = a.hot ?? -1
    return right - left
  })
}

function withRank(items: NormalizedHotItem[]): NormalizedHotItem[] {
  return items.map((item, index) => ({
    ...item,
    rank: index + 1,
  }))
}

function sanitizeCategoryOrder(category: PlatformCategory, orderKeys: string[]): string[] {
  const availableKeys = (PLATFORMS_BY_CATEGORY[category] || []).map((item) => item.key)
  const availableSet = new Set(availableKeys)
  const unique: string[] = []

  orderKeys.forEach((key) => {
    if (availableSet.has(key) && !unique.includes(key)) {
      unique.push(key)
    }
  })

  return unique
}

function sortPlatformsByOrder(platforms: PlatformInfo[], orderKeys: string[] | undefined): PlatformInfo[] {
  if (!orderKeys || orderKeys.length === 0) {
    return [...platforms]
  }

  const byKey = new Map(platforms.map((item) => [item.key, item]))
  const ordered: PlatformInfo[] = []

  orderKeys.forEach((key) => {
    const matched = byKey.get(key)
    if (matched) {
      ordered.push(matched)
      byKey.delete(key)
    }
  })

  platforms.forEach((item) => {
    if (byKey.has(item.key)) {
      ordered.push(item)
      byKey.delete(item.key)
    }
  })

  return ordered
}

function pickRandomItem<T>(items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined
  }

  const index = Math.floor(Math.random() * items.length)
  return items[index]
}

function shuffleArray<T>(items: T[]): T[] {
  const cloned = [...items]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = cloned[index]
    cloned[index] = cloned[swapIndex]
    cloned[swapIndex] = temp
  }

  return cloned
}

function buildSearchTokens(keyword: string): string[] {
  const normalized = normalizeKeyword(keyword)
  if (!normalized) {
    return []
  }

  const parts = normalized
    .split(/[\s,，。;；、|/\\]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const merged = parts.length <= 1 ? parts : [normalized, ...parts]
  return [...new Set(merged)]
}

function isSearchMatched(tokens: string[], title: string, desc: string, platform: string): boolean {
  if (tokens.length === 0) {
    return false
  }

  return tokens.some((token) => {
    return title.includes(token) || desc.includes(token) || platform.includes(token)
  })
}

export const useHotStore = defineStore('hot', () => {
  const currentCategory = ref<PlatformCategory>(DEFAULT_CATEGORY)
  const currentPlatform = ref(DEFAULT_PLATFORM)
  const sortMode = ref<SortMode>('hot-desc')
  const limitOption = ref(DEFAULT_LIMIT)
  const loadedLimit = ref(DEFAULT_LIMIT)

  const loading = ref(false)
  const loadingMore = ref(false)
  const searchLoading = ref(false)
  const error = ref<RequestErrorInfo | null>(null)
  const updatedAt = ref<number | null>(null)
  const hasMore = ref(true)

  const cacheMap = ref<Record<string, CacheRecord>>({})
  const currentItems = ref<NormalizedHotItem[]>([])
  const searchKeyword = ref('')
  const searchResults = ref<NormalizedHotItem[]>([])
  const apiBaseUrl = ref(getApiBaseUrl())
  const platformOrderMap = ref<Partial<Record<PlatformCategory, string[]>>>({})
  const availablePlatformKeys = ref<string[]>([...ALL_PLATFORM_KEYS])
  const favoritesMap = ref<Record<string, FavoritedHotItem>>({})
  const favoritesMode = ref(false)

  const initialized = ref(false)
  let requestToken = 0
  let searchToken = 0

  const categoryOptions = CATEGORY_OPTIONS
  const availablePlatformSet = computed(() => new Set(availablePlatformKeys.value))
  const platformCount = computed(() => availablePlatformKeys.value.length)
  const isFavoritesMode = computed(() => favoritesMode.value)
  const favoriteCount = computed(() => Object.keys(favoritesMap.value).length)
  const favoriteKeys = computed(() => Object.keys(favoritesMap.value))

  const favoriteItems = computed<NormalizedHotItem[]>(() => {
    const ordered = Object.values(favoritesMap.value).sort((left, right) => right.favoritedAt - left.favoritedAt)
    const keyword = normalizeKeyword(searchKeyword.value)
    if (!keyword) {
      return withRank(ordered)
    }

    const filtered = ordered.filter((item) => {
      const titleText = normalizeKeyword(item.title)
      const descText = normalizeKeyword(item.desc)
      const platformText = normalizeKeyword(item.platformName)
      return titleText.includes(keyword) || descText.includes(keyword) || platformText.includes(keyword)
    })

    return withRank(filtered)
  })

  const setAvailablePlatforms = (platformKeys: string[]) => {
    const normalized = [...new Set(platformKeys)].filter((key) => ALL_PLATFORM_KEY_SET.has(key))
    availablePlatformKeys.value = normalized.length > 0 ? normalized : [...ALL_PLATFORM_KEYS]
  }

  const syncAvailablePlatforms = async () => {
    try {
      const platformKeys = await fetchAvailablePlatformKeys()
      if (platformKeys.length > 0) {
        setAvailablePlatforms(platformKeys)
      }
    } catch {
      // Keep current availability snapshot when /all is temporarily unavailable.
    }
  }

  const getOrderedCategoryPlatforms = (category: PlatformCategory): PlatformInfo[] => {
    const basePlatforms = PLATFORMS_BY_CATEGORY[category] || []
    const orderKeys = platformOrderMap.value[category]
    const orderedPlatforms = sortPlatformsByOrder(basePlatforms, orderKeys)
    const availableSet = availablePlatformSet.value
    return orderedPlatforms.filter((item) => availableSet.has(item.key))
  }

  const resolveFallbackPlatform = (preferredCategory?: PlatformCategory): PlatformInfo | undefined => {
    if (preferredCategory) {
      const preferredPlatforms = getOrderedCategoryPlatforms(preferredCategory)
      if (preferredPlatforms.length > 0) {
        return preferredPlatforms[0]
      }
    }

    for (const category of CATEGORY_KEYS) {
      const categoryPlatforms = getOrderedCategoryPlatforms(category)
      if (categoryPlatforms.length > 0) {
        return categoryPlatforms[0]
      }
    }

    return undefined
  }

  const currentPlatformName = computed(() => PLATFORM_MAP[currentPlatform.value]?.name || currentPlatform.value)
  const categoryPlatforms = computed(() => getOrderedCategoryPlatforms(currentCategory.value))
  const cachePlatformCount = computed(() => Object.keys(cacheMap.value).length)
  const isSearchMode = computed(() => Boolean(searchKeyword.value))

  const displayItems = computed<NormalizedHotItem[]>(() => {
    if (isFavoritesMode.value) {
      return favoriteItems.value
    }

    const source = isSearchMode.value ? searchResults.value : currentItems.value
    const sorted = sortMode.value === 'hot-desc' ? sortByHotDesc(source) : [...source]
    return withRank(sorted)
  })

  const rssUrl = computed(() => buildRssUrl(currentPlatform.value))

  const persistCache = () => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheMap.value))
  }

  const restoreCache = () => {
    if (typeof window === 'undefined') {
      cacheMap.value = {}
      return
    }

    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) {
      cacheMap.value = {}
      return
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, CacheRecord>
      const now = Date.now()
      const nextCache: Record<string, CacheRecord> = {}

      Object.values(parsed).forEach((record) => {
        if (!record || !record.platform || !Array.isArray(record.data)) {
          return
        }
        if (now - record.updatedAt > CACHE_TTL_MS) {
          return
        }

        nextCache[record.platform] = {
          platform: record.platform,
          data: record.data,
          updatedAt: record.updatedAt,
          requestedLimit: record.requestedLimit || record.data.length,
        }
      })

      cacheMap.value = nextCache
    } catch {
      cacheMap.value = {}
    }
  }

  const persistPlatformOrder = () => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(PLATFORM_ORDER_STORAGE_KEY, JSON.stringify(platformOrderMap.value))
  }

  const restorePlatformOrder = () => {
    if (typeof window === 'undefined') {
      platformOrderMap.value = {}
      return
    }

    const raw = window.localStorage.getItem(PLATFORM_ORDER_STORAGE_KEY)
    if (!raw) {
      platformOrderMap.value = {}
      return
    }

    try {
      const parsed = JSON.parse(raw) as Partial<Record<PlatformCategory, string[]>>
      const nextOrder: Partial<Record<PlatformCategory, string[]>> = {}

      CATEGORY_KEYS.forEach((category) => {
        const values = parsed[category]
        if (!Array.isArray(values)) {
          return
        }

        nextOrder[category] = sanitizeCategoryOrder(category, values)
      })

      platformOrderMap.value = nextOrder
    } catch {
      platformOrderMap.value = {}
    }
  }

  const persistFavorites = () => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesMap.value))
  }

  const restoreFavorites = () => {
    if (typeof window === 'undefined') {
      favoritesMap.value = {}
      return
    }

    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) {
      favoritesMap.value = {}
      return
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, FavoritedHotItem>
      const nextFavorites: Record<string, FavoritedHotItem> = {}

      Object.entries(parsed).forEach(([key, item]) => {
        if (!item || typeof item !== 'object') {
          return
        }

        if (!item.id || !item.title || !item.platform) {
          return
        }

        nextFavorites[key] = {
          ...item,
          favoritedAt: typeof item.favoritedAt === 'number' ? item.favoritedAt : Date.now(),
        }
      })

      favoritesMap.value = nextFavorites
    } catch {
      favoritesMap.value = {}
    }
  }

  const buildFavoriteKey = (item: Pick<NormalizedHotItem, 'platform' | 'id'>) => `${item.platform}:${item.id}`

  const isFavorite = (item: Pick<NormalizedHotItem, 'platform' | 'id'>): boolean => {
    return Boolean(favoritesMap.value[buildFavoriteKey(item)])
  }

  const toggleFavorite = (item: NormalizedHotItem): boolean => {
    const favoriteKey = buildFavoriteKey(item)
    const existed = Boolean(favoritesMap.value[favoriteKey])

    if (existed) {
      const nextFavorites = { ...favoritesMap.value }
      delete nextFavorites[favoriteKey]
      favoritesMap.value = nextFavorites
      persistFavorites()
      return false
    }

    favoritesMap.value = {
      ...favoritesMap.value,
      [favoriteKey]: {
        ...item,
        favoritedAt: Date.now(),
      },
    }
    persistFavorites()
    return true
  }

  const setFavoritesMode = (enabled: boolean) => {
    if (favoritesMode.value === enabled) {
      return
    }

    favoritesMode.value = enabled
    if (enabled) {
      searchLoading.value = false
      return
    }

    if (searchKeyword.value) {
      setSearchKeyword(searchKeyword.value)
    }
  }

  const toggleFavoritesMode = () => {
    setFavoritesMode(!favoritesMode.value)
  }

  const requestPlatformData = async (platform: string, options: RequestOptions = {}): Promise<NormalizedHotItem[]> => {
    const requestLimit = Math.min(options.limit ?? loadedLimit.value, MAX_LIMIT)
    const cached = cacheMap.value[platform]
    const isLatestRequest = options.token === undefined || options.token === requestToken

    if (!options.force && isCacheFresh(cached, requestLimit)) {
      const sliced = cached.data.slice(0, requestLimit)
      if (!options.forSearch && platform === currentPlatform.value && isLatestRequest) {
        currentItems.value = sliced
        updatedAt.value = cached.updatedAt
        hasMore.value = cached.data.length >= requestLimit
        error.value = null
      }
      return sliced
    }

    if (!options.silent && !options.forSearch) {
      if (options.loadingMore) {
        loadingMore.value = true
      } else {
        loading.value = true
      }
      error.value = null
    }

    try {
      const fetched = await fetchPlatformHotList(platform, {
        limit: requestLimit,
        cache: options.force ? false : undefined,
      }, options.timeoutMs)

      const normalized = withRank(fetched)
      const currentTime = Date.now()

      cacheMap.value = {
        ...cacheMap.value,
        [platform]: {
          platform,
          data: normalized,
          updatedAt: currentTime,
          requestedLimit: requestLimit,
        },
      }

      persistCache()

      if (!options.forSearch && platform === currentPlatform.value && isLatestRequest) {
        currentItems.value = normalized
        updatedAt.value = currentTime
        hasMore.value = normalized.length >= requestLimit
        error.value = null
      }

      return normalized
    } catch (err) {
      const requestError = normalizeRequestError(err)

      if (requestError.status === 404) {
        availablePlatformKeys.value = availablePlatformKeys.value.filter((key) => key !== platform)
      }

      if (!options.forSearch && platform === currentPlatform.value && isLatestRequest) {
        error.value = requestError
      }
      throw err
    } finally {
      if (!options.silent && !options.forSearch) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  const updateSearchResults = (keyword: string) => {
    const tokens = buildSearchTokens(keyword)
    if (tokens.length === 0) {
      searchResults.value = []
      return
    }

    const uniqueMap = new Map<string, NormalizedHotItem>()

    Object.values(cacheMap.value).forEach((record) => {
      record.data.forEach((item) => {
        const titleText = normalizeKeyword(item.title)
        const descText = normalizeKeyword(item.desc)
        const platformText = normalizeKeyword(item.platformName)
        if (!isSearchMatched(tokens, titleText, descText, platformText)) {
          return
        }

        const itemKey = `${item.platform}:${item.id}`
        if (!uniqueMap.has(itemKey)) {
          uniqueMap.set(itemKey, item)
        }
      })
    })

    searchResults.value = withRank(sortByHotDesc(Array.from(uniqueMap.values())))
  }

  const hydrateSearchData = async (keyword: string, token: number) => {
    const fastTargets = availablePlatformKeys.value.filter((platformKey) => {
      return !isCacheFresh(cacheMap.value[platformKey], SEARCH_FAST_LIMIT)
    })

    for (let index = 0; index < fastTargets.length; index += SEARCH_FAST_CONCURRENCY) {
      if (token !== searchToken) {
        return
      }

      const batch = fastTargets.slice(index, index + SEARCH_FAST_CONCURRENCY)
      await Promise.allSettled(
        batch.map((platform) =>
          requestPlatformData(platform, {
            limit: SEARCH_FAST_LIMIT,
            silent: true,
            forSearch: true,
            timeoutMs: SEARCH_FAST_TIMEOUT_MS,
          }),
        ),
      )

      if (token !== searchToken) {
        return
      }

      updateSearchResults(keyword)
    }

    if (token === searchToken) {
      searchLoading.value = false
    }

    const deepTargets = availablePlatformKeys.value.filter((platformKey) => {
      return !isCacheFresh(cacheMap.value[platformKey], SEARCH_DEEP_LIMIT)
    })

    for (let index = 0; index < deepTargets.length; index += SEARCH_DEEP_CONCURRENCY) {
      if (token !== searchToken) {
        return
      }

      const batch = deepTargets.slice(index, index + SEARCH_DEEP_CONCURRENCY)
      await Promise.allSettled(
        batch.map((platform) =>
          requestPlatformData(platform, {
            limit: SEARCH_DEEP_LIMIT,
            silent: true,
            forSearch: true,
            timeoutMs: SEARCH_DEEP_TIMEOUT_MS,
          }),
        ),
      )

      if (token !== searchToken) {
        return
      }

      updateSearchResults(keyword)
    }
  }

  const initialize = async () => {
    if (initialized.value) {
      return
    }

    restoreCache()
    restorePlatformOrder()
    restoreFavorites()
    apiBaseUrl.value = getApiBaseUrl()
    await syncAvailablePlatforms()

    const fallback = resolveFallbackPlatform(currentCategory.value)
    if (!fallback) {
      currentItems.value = []
      updatedAt.value = null
      hasMore.value = false
      error.value = {
        message: '当前接口暂无可用平台，请切换接口地址后重试。',
        isCorsLikely: false,
        isTimeout: false,
      }
      initialized.value = true
      return
    }

    if (!availablePlatformSet.value.has(currentPlatform.value)) {
      currentPlatform.value = fallback.key
    }

    const currentInfo = PLATFORM_MAP[currentPlatform.value]
    currentCategory.value = currentInfo?.category || fallback.category

    requestToken += 1
    try {
      await requestPlatformData(currentPlatform.value, {
        limit: loadedLimit.value,
        token: requestToken,
      })
    } catch {
      // requestPlatformData will set store error state.
    }

    initialized.value = true
  }

  const setCategory = (category: PlatformCategory) => {
    if (category === currentCategory.value) {
      return
    }

    currentCategory.value = category
    const firstPlatform = getOrderedCategoryPlatforms(category)[0]
    if (!firstPlatform) {
      currentItems.value = []
      updatedAt.value = null
      hasMore.value = false
      error.value = null
      return
    }

    if (firstPlatform.key !== currentPlatform.value) {
      void setPlatform(firstPlatform.key)
    }
  }

  const setCategoryPlatformOrder = (category: PlatformCategory, orderKeys: string[]) => {
    const normalized = sanitizeCategoryOrder(category, orderKeys)

    platformOrderMap.value = {
      ...platformOrderMap.value,
      [category]: normalized,
    }

    persistPlatformOrder()
  }

  const setPlatform = async (platform: string, options: { force?: boolean } = {}) => {
    if (!platform || !availablePlatformSet.value.has(platform)) {
      return
    }

    const unchanged = platform === currentPlatform.value
    if (unchanged && !options.force && currentItems.value.length > 0) {
      return
    }

    currentPlatform.value = platform
    const info = PLATFORM_MAP[platform]
    if (info) {
      currentCategory.value = info.category
    }

    loadedLimit.value = limitOption.value

    const targetCache = cacheMap.value[platform]
    const canUseFreshCache = !options.force && isCacheFresh(targetCache, loadedLimit.value)
    if (!canUseFreshCache) {
      currentItems.value = []
      updatedAt.value = null
      error.value = null
      hasMore.value = true
      loading.value = true
    }

    requestToken += 1
    try {
      await requestPlatformData(platform, {
        force: options.force,
        limit: loadedLimit.value,
        token: requestToken,
      })
    } catch (err) {
      const requestError = normalizeRequestError(err)
      if (requestError.status !== 404) {
        return
      }

      const fallback = resolveFallbackPlatform(currentCategory.value)
      if (!fallback || fallback.key === currentPlatform.value) {
        return
      }

      currentPlatform.value = fallback.key
      currentCategory.value = fallback.category
      requestToken += 1

      try {
        await requestPlatformData(fallback.key, {
          limit: loadedLimit.value,
          token: requestToken,
        })
      } catch {
        // requestPlatformData will set store erro
        // r state.
      }
    }
  }

  const retryCurrentPlatform = async () => {
    if (!availablePlatformSet.value.has(currentPlatform.value)) {
      const fallback = resolveFallbackPlatform(currentCategory.value)
      if (!fallback) {
        return
      }

      currentPlatform.value = fallback.key
      currentCategory.value = fallback.category
    }

    requestToken += 1
    try {
      await requestPlatformData(currentPlatform.value, {
        limit: loadedLimit.value,
        force: true,
        token: requestToken,
      })
    } catch {
      // requestPlatformData will set store error state.
    }
  }

  const refreshCurrentPlatform = async () => {
    await retryCurrentPlatform()
  }

  const loadMore = async () => {
    if (loading.value || loadingMore.value || !hasMore.value || isSearchMode.value || isFavoritesMode.value) {
      return
    }

    const previousLimit = loadedLimit.value
    loadedLimit.value = Math.min(MAX_LIMIT, loadedLimit.value + limitOption.value)
    if (loadedLimit.value === previousLimit) {
      hasMore.value = false
      return
    }

    requestToken += 1
    try {
      await requestPlatformData(currentPlatform.value, {
        limit: loadedLimit.value,
        loadingMore: true,
        token: requestToken,
      })
    } catch {
      loadedLimit.value = previousLimit
    }
  }

  const setLimit = async (nextLimit: number) => {
    const safeLimit = Number.isFinite(nextLimit) ? Math.max(10, Math.min(100, Math.round(nextLimit))) : DEFAULT_LIMIT
    limitOption.value = safeLimit
    loadedLimit.value = safeLimit

    requestToken += 1
    try {
      await requestPlatformData(currentPlatform.value, {
        limit: loadedLimit.value,
        token: requestToken,
      })
    } catch {
      // requestPlatformData will set store error state.
    }

    if (searchKeyword.value) {
      setSearchKeyword(searchKeyword.value)
    }
  }

  const setSortMode = (mode: SortMode) => {
    sortMode.value = mode
  }

  const setSearchKeyword = (keyword: string) => {
    const trimmed = keyword.trim()
    searchKeyword.value = trimmed
    searchToken += 1

    if (!trimmed) {
      searchResults.value = []
      searchLoading.value = false
      return
    }

    if (favoritesMode.value) {
      searchResults.value = []
      searchLoading.value = false
      return
    }

    updateSearchResults(trimmed)

    const needFastHydration = availablePlatformKeys.value.some((platformKey) => {
      return !isCacheFresh(cacheMap.value[platformKey], SEARCH_FAST_LIMIT)
    })
    searchLoading.value = needFastHydration

    const token = searchToken
    void hydrateSearchData(trimmed, token)
  }

  const setApiBaseUrl = async (nextBaseUrl: string): Promise<boolean> => {
    const normalized = normalizeBaseUrl(nextBaseUrl)
    if (!/^https?:\/\/.+/.test(normalized)) {
      return false
    }

    persistApiBaseUrl(normalized)
    apiBaseUrl.value = normalized
    await syncAvailablePlatforms()

    if (!availablePlatformSet.value.has(currentPlatform.value)) {
      const fallback = resolveFallbackPlatform(currentCategory.value)
      if (!fallback) {
        currentItems.value = []
        updatedAt.value = null
        hasMore.value = false
        error.value = {
          message: '当前接口暂无可用平台，请确认接口地址后重试。',
          isCorsLikely: false,
          isTimeout: false,
        }
        return true
      }

      currentPlatform.value = fallback.key
      currentCategory.value = fallback.category
    }

    await refreshCurrentPlatform()
    if (searchKeyword.value) {
      setSearchKeyword(searchKeyword.value)
    }

    return true
  }

  const pickRandomHotItem = async (): Promise<NormalizedHotItem | null> => {
    const candidates = shuffleArray(availablePlatformKeys.value)
    if (candidates.length === 0) {
      return null
    }

    const cachedPool = candidates.flatMap((platformKey) => {
      const cached = cacheMap.value[platformKey]
      if (!cached?.data?.length) {
        return []
      }

      return cached.data.filter((item) => Boolean(item.url))
    })

    const cachedCandidate = pickRandomItem(cachedPool)
    if (cachedCandidate) {
      return cachedCandidate
    }

    let batchCount = 0

    for (let index = 0; index < candidates.length; index += RANDOM_PICK_CONCURRENCY) {
      if (batchCount >= RANDOM_PICK_MAX_BATCHES) {
        break
      }

      const batch = candidates.slice(index, index + RANDOM_PICK_CONCURRENCY)
      const settled = await Promise.allSettled(
        batch.map((platformKey) =>
          requestPlatformData(platformKey, {
            limit: RANDOM_PICK_LIMIT,
            silent: true,
            forSearch: true,
            timeoutMs: RANDOM_PICK_TIMEOUT_MS,
          }),
        ),
      )

      const batchPool: NormalizedHotItem[] = []
      settled.forEach((result) => {
        if (result.status === 'fulfilled') {
          batchPool.push(...result.value.filter((item) => Boolean(item.url)))
        }
      })

      const batchCandidate = pickRandomItem(batchPool)
      if (batchCandidate) {
        return batchCandidate
      }

      batchCount += 1
    }

    const fallbackPool = Object.values(cacheMap.value).flatMap((record) => record.data.filter((item) => Boolean(item.url)))
    return pickRandomItem(fallbackPool) || null
  }

  return {
    currentCategory,
    currentPlatform,
    currentPlatformName,
    categoryOptions,
    categoryPlatforms,
    platformCount,
    favoriteCount,
    favoriteKeys,
    cachePlatformCount,
    limitOption,
    loading,
    loadingMore,
    searchLoading,
    error,
    updatedAt,
    hasMore,
    sortMode,
    searchKeyword,
    isSearchMode,
    isFavoritesMode,
    displayItems,
    rssUrl,
    apiBaseUrl,
    initialize,
    setCategory,
    setCategoryPlatformOrder,
    setPlatform,
    retryCurrentPlatform,
    refreshCurrentPlatform,
    loadMore,
    setLimit,
    setSortMode,
    setSearchKeyword,
    setApiBaseUrl,
    isFavorite,
    toggleFavorite,
    setFavoritesMode,
    toggleFavoritesMode,
    pickRandomHotItem,
  }
})
