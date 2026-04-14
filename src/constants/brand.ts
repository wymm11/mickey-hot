import type { PlatformCategory } from '../types/hot'

export type ResolvedTheme = 'light' | 'dark'

interface PlatformBrandDef {
  primary: string
  secondary?: string
  hover?: string
  darkPrimary?: string
  darkSecondary?: string
  darkHover?: string
}

interface CategoryBrandDef {
  light: string
  dark: string
}

export interface PlatformBrand {
  primary: string
  secondary: string
  hover: string
}

const DEFAULT_BRAND: PlatformBrandDef = {
  primary: '#4080ff',
  secondary: '#69b1ff',
  hover: '#69b1ff',
  darkPrimary: '#5b8cff',
  darkSecondary: '#80a7ff',
  darkHover: '#80a7ff',
}

const PLATFORM_BRAND_MAP: Record<string, PlatformBrandDef> = {
  weibo: {
    primary: '#e6162d',
    hover: '#f93648',
    darkPrimary: '#c41e3a',
    darkHover: '#d9485f',
  },
  douyin: {
    primary: '#000000',
    secondary: '#25c6fe',
    darkPrimary: '#1f2937',
    darkSecondary: '#38bdf8',
  },
  bilibili: {
    primary: '#fb7299',
    secondary: '#00a1d6',
    darkPrimary: '#d96888',
    darkSecondary: '#38bdf8',
  },
  'bilibili-hot-search': {
    primary: '#fb7299',
    secondary: '#00a1d6',
    darkPrimary: '#d96888',
    darkSecondary: '#38bdf8',
  },
  'bilibili-ranking': {
    primary: '#fb7299',
    secondary: '#00a1d6',
    darkPrimary: '#d96888',
    darkSecondary: '#38bdf8',
  },
  zhihu: {
    primary: '#0f88eb',
    hover: '#1b95e0',
    darkPrimary: '#2f7fb8',
    darkHover: '#4a94cb',
  },
  baidu: {
    primary: '#2d7dd2',
    darkPrimary: '#4276ad',
  },
  'ifeng-news': {
    primary: '#7c3aed',
    hover: '#8f5af0',
    darkPrimary: '#8b5fcf',
    darkHover: '#9f79d7',
  },
  'sina-news': {
    primary: '#ef4444',
    hover: '#f25f5f',
    darkPrimary: '#c45151',
    darkHover: '#cf6a6a',
  },
  'sohu-news': {
    primary: '#f97316',
    hover: '#fb8f43',
    darkPrimary: '#cb7b41',
    darkHover: '#d69060',
  },
  juejin: {
    primary: '#e16259',
    darkPrimary: '#b8574f',
  },
  '36kr': {
    primary: '#2185ff',
    darkPrimary: '#3e7fc4',
  },
  hupu: {
    primary: '#e83538',
    darkPrimary: '#bf3f42',
  },
  xiaohongshu: {
    primary: '#fe2c55',
    darkPrimary: '#cf3e60',
  },
  github: {
    primary: '#24292e',
    darkPrimary: '#4b5563',
  },
  hellogithub: {
    primary: '#24292e',
    darkPrimary: '#4b5563',
  },
}

const CATEGORY_BRAND_MAP: Record<PlatformCategory, CategoryBrandDef> = {
  general: { light: '#4080ff', dark: '#5b8cff' },
  entertainment: { light: '#fb7299', dark: '#d96888' },
  tech: { light: '#00a8e8', dark: '#2ea8cf' },
  game: { light: '#722ed1', dark: '#8a63d2' },
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0')
}

export function withAlpha(hexColor: string, alpha: number): string {
  const color = hexColor.trim().replace('#', '')
  if (!/^(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/.test(color)) {
    return hexColor
  }

  const normalized = color.length === 3
    ? color
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : color

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  const safeAlpha = Math.max(0, Math.min(alpha, 1))

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`
}

export function mixWithWhite(hexColor: string, ratio = 0.2): string {
  const color = hexColor.trim().replace('#', '')
  if (!/^(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/.test(color)) {
    return hexColor
  }

  const normalized = color.length === 3
    ? color
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : color

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  const safeRatio = Math.max(0, Math.min(ratio, 1))
  const mixedRed = Math.round(red + (255 - red) * safeRatio)
  const mixedGreen = Math.round(green + (255 - green) * safeRatio)
  const mixedBlue = Math.round(blue + (255 - blue) * safeRatio)

  return `#${toHex(mixedRed)}${toHex(mixedGreen)}${toHex(mixedBlue)}`
}

export function getPlatformBrand(platform: string, theme: ResolvedTheme): PlatformBrand {
  const base = PLATFORM_BRAND_MAP[platform] || DEFAULT_BRAND
  if (theme === 'dark') {
    const primary = base.darkPrimary || base.primary
    const secondary = base.darkSecondary || base.secondary || primary
    const hover = base.darkHover || base.hover || secondary

    return { primary, secondary, hover }
  }

  const primary = base.primary
  const secondary = base.secondary || primary
  const hover = base.hover || secondary

  return { primary, secondary, hover }
}

export function getCategoryBrand(category: PlatformCategory, theme: ResolvedTheme): string {
  return theme === 'dark' ? CATEGORY_BRAND_MAP[category].dark : CATEGORY_BRAND_MAP[category].light
}
