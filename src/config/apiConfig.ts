const API_BASE_URL_STORAGE_KEY = 'daily-hot-api-base-url'
const ENV_BASE_URL = import.meta.env.VITE_DAILY_HOT_API_BASE_URL as string | undefined
const FALLBACK_BASE_URL = 'http://localhost:6688'

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return normalizeBaseUrl(ENV_BASE_URL || FALLBACK_BASE_URL)
  }

  const stored = window.localStorage.getItem(API_BASE_URL_STORAGE_KEY)
  if (stored && stored.trim()) {
    return normalizeBaseUrl(stored)
  }

  return normalizeBaseUrl(ENV_BASE_URL || FALLBACK_BASE_URL)
}

export function setApiBaseUrl(baseUrl: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalizeBaseUrl(baseUrl))
}

export function getApiBaseUrlStorageKey(): string {
  return API_BASE_URL_STORAGE_KEY
}
