import { getApiBaseUrl } from '../config/apiConfig'
import { PLATFORM_MAP } from '../constants/platforms'
import type { HotApiResponse, NormalizedHotItem, RawHotItem } from '../types/hot'
import { formatDateTime, formatHotValue, parsePossibleTimestamp, toNumericHot } from '../utils/format'
import http from './http'

export interface HotListParams {
  limit?: number
  cache?: boolean
  rss?: boolean
  page?: number
}

interface HotApiRouteItem {
  name?: string
  path?: string
}

interface HotApiRoutesResponse {
  code?: number
  routes?: HotApiRouteItem[]
  data?: HotApiRouteItem[]
  message?: string
  msg?: string
}

function resolvePublishedInfo(item: RawHotItem): {
  publishedAt: number | null
  publishedText: string
  hasPublishedTime: boolean
} {
  const raw = item as Record<string, unknown>

  const publishTimeText = typeof raw.publishTime === 'string' ? raw.publishTime.trim() : ''
  if (publishTimeText) {
    const parsed = parsePossibleTimestamp(publishTimeText)
    if (parsed && parsed <= Date.now() + 24 * 60 * 60 * 1000) {
      return {
        publishedAt: parsed,
        publishedText: publishTimeText,
        hasPublishedTime: true,
      }
    }
  }

  if (raw.timestamp !== undefined) {
    const parsedTimestamp = parsePossibleTimestamp(raw.timestamp)
    if (parsedTimestamp && parsedTimestamp <= Date.now() + 24 * 60 * 60 * 1000) {
      return {
        publishedAt: parsedTimestamp,
        publishedText: formatDateTime(parsedTimestamp),
        hasPublishedTime: true,
      }
    }
  }

  return {
    publishedAt: null,
    publishedText: '',
    hasPublishedTime: false,
  }
}

function normalizeHotItem(platform: string, item: RawHotItem, index: number): NormalizedHotItem {
  const platformName = PLATFORM_MAP[platform]?.name || platform
  const hot = toNumericHot(item.hot)
  const fallbackId = `${platform}-${index + 1}-${item.title}`
  const fetchedAt = Date.now()
  const publishedInfo = resolvePublishedInfo(item)

  return {
    id: `${item.id ?? fallbackId}`,
    title: item.title,
    desc: item.desc || '',
    url: item.url || '',
    hot,
    hotText: formatHotValue(item.hot),
    platform,
    platformName,
    rank: index + 1,
    fetchedAt,
    publishedAt: publishedInfo.publishedAt,
    publishedText: publishedInfo.publishedText,
    hasPublishedTime: publishedInfo.hasPublishedTime,
  }
}

export async function fetchPlatformHotList(
  platform: string,
  params: HotListParams = {},
  timeoutMs?: number,
): Promise<NormalizedHotItem[]> {
  const response = await http.get<HotApiResponse>(`/${platform}`, {
    params,
    timeout: timeoutMs,
  })

  const payload = response.data
  if (!payload || payload.code !== 200 || !Array.isArray(payload.data)) {
    throw new Error(payload?.message || payload?.msg || '接口返回数据异常')
  }

  return payload.data.map((item, index) => normalizeHotItem(platform, item, index))
}

export async function fetchAvailablePlatformKeys(): Promise<string[]> {
  const response = await http.get<HotApiRoutesResponse>('/all')
  const payload = response.data

  const routes = Array.isArray(payload?.routes)
    ? payload.routes
    : Array.isArray(payload?.data)
      ? payload.data
      : []

  return routes
    .map((item) => (typeof item.name === 'string' ? item.name.trim() : ''))
    .filter((item): item is string => Boolean(item))
}

export function buildRssUrl(platform: string): string {
  const baseUrl = getApiBaseUrl()
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const url = new URL(normalizedBase)
  const cleanPath = url.pathname.replace(/\/$/, '')
  url.pathname = `${cleanPath}/${platform}`
  url.searchParams.set('rss', 'true')
  return url.toString()
}
