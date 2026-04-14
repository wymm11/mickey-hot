export type PlatformCategory = 'general' | 'entertainment' | 'tech' | 'game'

export interface PlatformInfo {
  key: string
  name: string
  category: PlatformCategory
  description?: string
}

export interface RawHotItem {
  id?: string | number
  title: string
  desc?: string
  url?: string
  hot?: number | string | null
  timestamp?: number | string
  publishTime?: string
  [key: string]: unknown
}

export interface HotApiResponse {
  code: number
  data: RawHotItem[]
  message?: string
  msg?: string
}

export interface NormalizedHotItem {
  id: string
  title: string
  desc: string
  url: string
  hot: number | null
  hotText: string
  platform: string
  platformName: string
  rank: number
  fetchedAt: number
  publishedAt?: number | null
  publishedText?: string
  hasPublishedTime?: boolean
}

export interface FavoritedHotItem extends NormalizedHotItem {
  favoritedAt: number
}

export interface CacheRecord {
  platform: string
  data: NormalizedHotItem[]
  updatedAt: number
  requestedLimit: number
}

export interface RequestErrorInfo {
  message: string
  isCorsLikely: boolean
  isTimeout: boolean
  status?: number
}
