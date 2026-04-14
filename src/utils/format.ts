export function toNumericHot(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const pureNumber = Number(value)
    if (Number.isFinite(pureNumber)) {
      return pureNumber
    }

    const matched = value.replace(/,/g, '').match(/\d+(\.\d+)?/)
    if (!matched) {
      return null
    }

    const numeric = Number(matched[0])
    return Number.isFinite(numeric) ? numeric : null
  }

  return null
}

export function formatHotValue(value: unknown): string {
  const numeric = toNumericHot(value)
  if (numeric === null) {
    return typeof value === 'string' && value.trim() ? value.trim() : '--'
  }

  if (numeric < 10_000) {
    return `${numeric}`
  }

  if (numeric < 100_000_000) {
    return `${(numeric / 10_000).toFixed(1).replace(/\.0$/, '')}万`
  }

  return `${(numeric / 100_000_000).toFixed(1).replace(/\.0$/, '')}亿`
}

export function formatDateTime(timestamp: number | null): string {
  if (!timestamp) {
    return '--'
  }

  const date = new Date(timestamp)
  const pad = (num: number): string => `${num}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function parsePossibleTimestamp(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) {
      return null
    }

    if (value < 10_000_000_000) {
      return Math.round(value * 1000)
    }

    return Math.round(value)
  }

  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) {
      return null
    }

    if (/^\d{10,13}$/.test(text)) {
      const numeric = Number(text)
      return parsePossibleTimestamp(numeric)
    }

    // Handle common backend format: YYYY-MM-DD HH:mm:ss
    const normalizedText = text.replace(/\//g, '-').replace('T', ' ').replace(/\.\d+Z?$/, '')
    const matched = normalizedText.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
    )
    if (matched) {
      const year = Number(matched[1])
      const month = Number(matched[2])
      const day = Number(matched[3])
      const hour = Number(matched[4] ?? '0')
      const minute = Number(matched[5] ?? '0')
      const second = Number(matched[6] ?? '0')

      const parsedFromParts = new Date(year, month - 1, day, hour, minute, second).getTime()
      if (!Number.isNaN(parsedFromParts)) {
        return parsedFromParts
      }
    }

    const parsed = Date.parse(text)
    if (Number.isNaN(parsed)) {
      return null
    }

    return parsed
  }

  return null
}

export function formatDateTimeCompact(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return '--'
  }

  const date = new Date(timestamp)
  const pad = (num: number): string => `${num}`.padStart(2, '0')
  const current = new Date()

  const sameYear = date.getFullYear() === current.getFullYear()
  if (sameYear) {
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase()
}
