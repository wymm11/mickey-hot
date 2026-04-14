import type { NormalizedHotItem } from '../types/hot'

export interface ConstellationItem {
  name: string
  icon: string
  dates: string
  trait: string
  color: string
  keywords: string[]
}

export interface FortuneCustomNews {
  icon: string
  title: string
  source: string
  hot: number
  hotText?: string
  url?: string
}

export interface FortuneResult {
  general: '大吉' | '吉' | '平' | '凶' | '大凶'
  love: number
  wealth: number
  career: number
  suitable: string[]
  unsuitable: string[]
  desc: string
  roast: string
  customNews: FortuneCustomNews[]
}

export const CONSTELLATION_LIST: ConstellationItem[] = [
  {
    name: '白羊座',
    icon: '♈',
    dates: '3.21-4.19',
    trait: '热情/冲动/勇敢',
    color: '#f53f3f',
    keywords: ['创业', '突破', '行动', '勇气', '挑战'],
  },
  {
    name: '金牛座',
    icon: '♉',
    dates: '4.20-5.20',
    trait: '稳重/务实/理财',
    color: '#ff9d4d',
    keywords: ['理财', '存款', '消费', '稳健', '资产'],
  },
  {
    name: '双子座',
    icon: '♊',
    dates: '5.21-6.21',
    trait: '灵活/沟通/好奇',
    color: '#00b42a',
    keywords: ['沟通', '社交', '新鲜', '话题', '传播'],
  },
  {
    name: '巨蟹座',
    icon: '♋',
    dates: '6.22-7.22',
    trait: '温柔/顾家/敏感',
    color: '#4080ff',
    keywords: ['家庭', '情感', '疗愈', '亲子', '生活'],
  },
  {
    name: '狮子座',
    icon: '♌',
    dates: '7.23-8.22',
    trait: '自信/大方/领导力',
    color: '#ffd700',
    keywords: ['领导', '舞台', '表现', '荣誉', '焦点'],
  },
  {
    name: '处女座',
    icon: '♍',
    dates: '8.23-9.22',
    trait: '细致/完美/理性',
    color: '#87e8de',
    keywords: ['效率', '细节', '方法', '复盘', '工具'],
  },
  {
    name: '天秤座',
    icon: '♎',
    dates: '9.23-10.23',
    trait: '平衡/优雅/社交',
    color: '#722ed1',
    keywords: ['平衡', '审美', '社交', '合作', '关系'],
  },
  {
    name: '天蝎座',
    icon: '♏',
    dates: '10.24-11.22',
    trait: '神秘/执着/洞察力',
    color: '#6b7785',
    keywords: ['洞察', '深度', '策略', '调查', '真相'],
  },
  {
    name: '射手座',
    icon: '♐',
    dates: '11.23-12.21',
    trait: '自由/乐观/冒险',
    color: '#fb7299',
    keywords: ['旅行', '远方', '冒险', '探索', '乐观'],
  },
  {
    name: '摩羯座',
    icon: '♑',
    dates: '12.22-1.19',
    trait: '坚韧/自律/野心',
    color: '#1d2129',
    keywords: ['职业', '成长', '规划', '目标', '执行'],
  },
  {
    name: '水瓶座',
    icon: '♒',
    dates: '1.20-2.18',
    trait: '创新/独立/理性',
    color: '#00a8e8',
    keywords: ['科技', '创新', '趋势', '独立', '灵感'],
  },
  {
    name: '双鱼座',
    icon: '♓',
    dates: '2.19-3.20',
    trait: '浪漫/感性/幻想',
    color: '#fe2c55',
    keywords: ['浪漫', '艺术', '情绪', '故事', '治愈'],
  },
]

const SUITABLE_POOL = ['社交', '学习', '复盘', '沟通', '出行', '整理计划', '表达想法', '运动', '清理待办']
const UNSUITABLE_POOL = ['冲动消费', '熬夜', '争执', '拖延', '钻牛角尖', '情绪化决策', '过量咖啡']

const NEWS_FALLBACK_POOL: FortuneCustomNews[] = [
  {
    icon: '🧠',
    title: '情绪稳定和高效沟通，正在成为今年最强职场能力',
    source: '今日热榜',
    hot: 68000,
  },
  {
    icon: '💰',
    title: '年轻人开始重视长期规划，理性消费话题持续升温',
    source: '今日热榜',
    hot: 72000,
  },
  {
    icon: '🧳',
    title: '春日短途旅行热度走高，周边游迎来新一轮增长',
    source: '今日热榜',
    hot: 64000,
  },
  {
    icon: '🚀',
    title: 'AI 与创意结合带来新机会，跨界协作频繁刷屏',
    source: '今日热榜',
    hot: 91000,
  },
  {
    icon: '🌿',
    title: '高质量社交与身心健康，成为本周热门关键词',
    source: '今日热榜',
    hot: 59000,
  },
]

const NEWS_ICON_RULES: Array<{ icon: string; keywords: string[] }> = [
  { icon: '💼', keywords: ['职场', '职业', '工作', '事业', '就业', '管理'] },
  { icon: '💘', keywords: ['爱情', '恋爱', '告白', 'cp', '婚恋', '约会'] },
  { icon: '💰', keywords: ['理财', '股', '基金', '投资', '消费', '经济', '存款'] },
  { icon: '🚀', keywords: ['科技', 'ai', '创新', '算法', '芯片', '互联网'] },
  { icon: '🎨', keywords: ['艺术', '音乐', '电影', '设计', '创意', '演出'] },
  { icon: '🧳', keywords: ['旅行', '出行', '景点', '航班', '酒店', '远方'] },
  { icon: '🧠', keywords: ['学习', '知识', '沟通', '表达', '心理', '情绪'] },
  { icon: '🌿', keywords: ['健康', '运动', '养生', '生活', '治愈'] },
]

const toDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildSeed = (text: string): number => {
  let seed = 0
  for (let index = 0; index < text.length; index += 1) {
    seed = (seed << 5) - seed + text.charCodeAt(index)
    seed |= 0
  }
  return Math.abs(seed) + 1
}

const createSeededRandom = (seed: number) => {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

const clampStar = (value: number): number => Math.max(1, Math.min(5, value))

const sampleDistinct = (pool: string[], count: number, random: () => number): string[] => {
  const cloned = [...pool]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const temp = cloned[index]
    cloned[index] = cloned[swapIndex]
    cloned[swapIndex] = temp
  }
  return cloned.slice(0, count)
}

const shuffleWithRandom = <T,>(items: T[], random: () => number): T[] => {
  const cloned = [...items]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const temp = cloned[index]
    cloned[index] = cloned[swapIndex]
    cloned[swapIndex] = temp
  }
  return cloned
}

const resolveGeneralLevel = (score: number): FortuneResult['general'] => {
  if (score >= 4.4) {
    return '大吉'
  }
  if (score >= 3.6) {
    return '吉'
  }
  if (score >= 2.8) {
    return '平'
  }
  if (score >= 2.0) {
    return '凶'
  }
  return '大凶'
}

const getTopDimension = (love: number, wealth: number, career: number): string => {
  const max = Math.max(love, wealth, career)
  if (max === career) {
    return '事业'
  }
  if (max === love) {
    return '爱情'
  }
  return '财运'
}

const resolveNewsIcon = (title: string, source: string): string => {
  const text = `${title} ${source}`.toLowerCase()

  const matched = NEWS_ICON_RULES.find((rule) => {
    return rule.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
  })

  return matched?.icon || '📰'
}

const buildRoast = (
  constellationName: string,
  trait: string,
  general: FortuneResult['general'],
  topDimension: string,
): string => {
  const traitTag = trait.split('/')[0] || '气场'

  const roastPool: Record<FortuneResult['general'], string[]> = {
    大吉: [
      `${constellationName}今天是开挂模式，${topDimension}都在给你让路，低调点别人会以为你开了外挂。`,
      `${traitTag}拉满的一天，建议把拖延甩给昨天，今天你属于“出手就有回响”。`,
    ],
    吉: [
      `${constellationName}状态在线，${topDimension}有加成，别再假装摆烂了，机会都快把你名字喊破音了。`,
      `${traitTag}本来就不弱，今天再认真一点，你会让质疑者安静到只剩点头。`,
    ],
    平: [
      `${constellationName}今天属于稳住就赢，别硬凹高光，先把基础分拿满。`,
      `${traitTag}有点想躺平也正常，但别躺太久，不然好运会以为你不在家。`,
    ],
    凶: [
      `${constellationName}今天容易心急翻车，嘴上说佛系，内心像在打电竞决赛。`,
      `${traitTag}请先别和世界硬刚，先补觉再补刀，胜率会高很多。`,
    ],
    大凶: [
      `${constellationName}今天建议把脾气和冲动一起静音，不然你和麻烦会双向奔赴。`,
      `${traitTag}有点“我命由我不由天”，但今天先由闹钟和待办吧，能少踩很多坑。`,
    ],
  }

  const candidate = roastPool[general]
  const index = buildSeed(`${constellationName}-${general}-${topDimension}`) % candidate.length
  return candidate[index]
}

const buildDesc = (
  constellationName: string,
  general: FortuneResult['general'],
  topDimension: string,
  suitable: string[],
  unsuitable: string[],
): string => {
  return `今日${constellationName}整体运势为${general}，${topDimension}表现更亮眼，适合主动推进关键事项。建议优先安排「${suitable[0]}、${suitable[1]}」，并尽量避免「${unsuitable[0]}、${unsuitable[1]}」，节奏会更顺。`
}

const normalizeText = (text: string): string => text.trim().toLowerCase()

const pickCustomNews = (
  constellation: ConstellationItem,
  sourceNews: NormalizedHotItem[],
  random: () => number,
): FortuneCustomNews[] => {
  const keywordPool = [...constellation.keywords, ...constellation.trait.split('/')]
  const normalizedKeywords = keywordPool.map((item) => normalizeText(item)).filter(Boolean)

  const sortedNews = [...sourceNews].sort((left, right) => (right.hot ?? 0) - (left.hot ?? 0))
  const matched = sortedNews.filter((item) => {
    const titleText = normalizeText(item.title)
    const descText = normalizeText(item.desc)
    return normalizedKeywords.some((keyword) => titleText.includes(keyword) || descText.includes(keyword))
  })

  const prioritizedItems = matched.length > 0 ? [...matched, ...sortedNews] : sortedNews

  const mergedPool: FortuneCustomNews[] = []
  const seenTitle = new Set<string>()

  prioritizedItems.forEach((item) => {
    if (!item.title || seenTitle.has(item.title)) {
      return
    }

    seenTitle.add(item.title)
    mergedPool.push({
      icon: resolveNewsIcon(item.title, item.platformName),
      title: item.title,
      source: item.platformName,
      hot: item.hot ?? 0,
      hotText: item.hotText || undefined,
      url: item.url,
    })
  })

  const candidateWindow = mergedPool.slice(0, Math.min(12, mergedPool.length))
  const result = shuffleWithRandom(candidateWindow, random).slice(0, 3)
  if (result.length >= 3) {
    return result
  }

  const fallback = shuffleWithRandom(NEWS_FALLBACK_POOL, random)

  for (const item of fallback) {
    if (result.length >= 3) {
      break
    }

    if (seenTitle.has(item.title)) {
      continue
    }

    seenTitle.add(item.title)
    result.push(item)
  }

  return result.slice(0, 3)
}

export const findConstellationByName = (name: string): ConstellationItem | undefined => {
  return CONSTELLATION_LIST.find((item) => item.name === name)
}

export const filterConstellations = (keyword: string): ConstellationItem[] => {
  const normalizedKeyword = normalizeText(keyword)
  if (!normalizedKeyword) {
    return CONSTELLATION_LIST
  }

  return CONSTELLATION_LIST.filter((item) => {
    const nameText = normalizeText(item.name)
    const dateText = normalizeText(item.dates)
    const traitText = normalizeText(item.trait)
    return nameText.includes(normalizedKeyword) || dateText.includes(normalizedKeyword) || traitText.includes(normalizedKeyword)
  })
}

export const buildFortuneResult = (
  constellation: ConstellationItem,
  sourceNews: NormalizedHotItem[],
  date = new Date(),
  seedSuffix = '',
): FortuneResult => {
  const dateKey = toDateKey(date)
  const seed = buildSeed(`${constellation.name}-${dateKey}-${seedSuffix}`)
  const random = createSeededRandom(seed)
  const dailySeed = buildSeed(`${constellation.name}-${dateKey}-daily-news`)
  const dailyRandom = createSeededRandom(dailySeed)

  const love = clampStar(1 + Math.floor(random() * 5))
  const wealth = clampStar(1 + Math.floor(random() * 5))
  const career = clampStar(1 + Math.floor(random() * 5))
  const averageScore = (love + wealth + career) / 3
  const general = resolveGeneralLevel(averageScore)

  const suitable = sampleDistinct(SUITABLE_POOL, 3, random)
  const unsuitable = sampleDistinct(UNSUITABLE_POOL, 3, random)
  const topDimension = getTopDimension(love, wealth, career)

  return {
    general,
    love,
    wealth,
    career,
    suitable,
    unsuitable,
    desc: buildDesc(constellation.name, general, topDimension, suitable, unsuitable),
    roast: buildRoast(constellation.name, constellation.trait, general, topDimension),
    customNews: pickCustomNews(constellation, sourceNews, dailyRandom),
  }
}
