import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'daily-hot-theme-mode'

export const useUiStore = defineStore('ui', () => {
  const themeMode = ref<ThemeMode>('system')
  const systemDark = ref(false)
  const initialized = ref(false)

  let mediaQuery: MediaQueryList | null = null

  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (themeMode.value === 'system') {
      return systemDark.value ? 'dark' : 'light'
    }
    return themeMode.value
  })

  const applyThemeToDocument = () => {
    if (typeof document === 'undefined') {
      return
    }
    document.documentElement.setAttribute('data-theme', resolvedTheme.value)
  }

  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    systemDark.value = event.matches
    if (themeMode.value === 'system') {
      applyThemeToDocument()
    }
  }

  const initializeTheme = () => {
    if (initialized.value || typeof window === 'undefined') {
      return
    }

    const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
      themeMode.value = savedMode
    }

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    applyThemeToDocument()
    initialized.value = true
  }

  const setThemeMode = (nextMode: ThemeMode) => {
    themeMode.value = nextMode
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextMode)
    }
    applyThemeToDocument()
  }

  const toggleTheme = () => {
    const nextMode = resolvedTheme.value === 'dark' ? 'light' : 'dark'
    setThemeMode(nextMode)
  }

  return {
    themeMode,
    resolvedTheme,
    initializeTheme,
    setThemeMode,
    toggleTheme,
  }
})
