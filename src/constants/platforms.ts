import type { PlatformCategory, PlatformInfo } from '../types/hot'

export const CATEGORY_OPTIONS: Array<{ key: PlatformCategory; label: string }> = [
  { key: 'general', label: '综合' },
  { key: 'entertainment', label: '娱乐' },
  { key: 'tech', label: '科技' },
  { key: 'game', label: '游戏' },
]

export const PLATFORM_OPTIONS: PlatformInfo[] = [
  { key: 'juejin', name: '掘金', category: 'general' },
  { key: 'github', name: 'GitHub', category: 'general' },
  { key: 'weibo', name: '微博', category: 'general' },
  { key: 'zhihu', name: '知乎', category: 'general' },
  { key: 'douyin', name: '抖音', category: 'general' },
  { key: 'baidu', name: '百度', category: 'general' },
  { key: 'bilibili', name: '哔哩哔哩', category: 'general' },
  { key: 'toutiao', name: '今日头条', category: 'general' },
  { key: 'thepaper', name: '澎湃新闻', category: 'general' },
  { key: 'qq-news', name: '腾讯新闻', category: 'general' },
  { key: 'netease-news', name: '网易新闻', category: 'general' },
  { key: 'ifeng-news', name: '凤凰网', category: 'general' },
  { key: 'sina-news', name: '新浪新闻', category: 'general' },
  { key: 'sohu-news', name: '搜狐新闻', category: 'general' },
  { key: 'hupu', name: '虎扑', category: 'general' },
  { key: 'tieba', name: '百度贴吧', category: 'general' },
  { key: '36kr', name: '36氪', category: 'general' },
  { key: 'jianshu', name: '简书', category: 'general' },
  { key: 'v2ex', name: 'V2EX', category: 'general' },
  { key: 'douban-movie', name: '豆瓣电影', category: 'entertainment' },
  { key: 'douban-tv', name: '豆瓣剧集', category: 'entertainment' },
  { key: 'douban-group', name: '豆瓣小组', category: 'entertainment' },
  { key: 'bilibili-hot-search', name: 'B站热搜', category: 'entertainment' },
  { key: 'bilibili-ranking', name: 'B站排行榜', category: 'entertainment' },
  { key: 'kuaishou', name: '快手', category: 'entertainment' },
  { key: 'xiaohongshu', name: '小红书', category: 'entertainment' },
  { key: 'acfun', name: 'AcFun', category: 'entertainment' },
  { key: 'smzdm', name: '什么值得买', category: 'entertainment' },
  { key: 'wallstreetcn', name: '华尔街见闻', category: 'tech' },
  { key: 'ithome', name: 'IT之家', category: 'tech' },
  { key: 'ifanr', name: '爱范儿', category: 'tech' },
  { key: 'sspai', name: '少数派', category: 'tech' },
  { key: 'huxiu', name: '虎嗅', category: 'tech' },
  { key: 'csdn', name: 'CSDN', category: 'tech' },
  { key: 'oschina', name: '开源中国', category: 'tech' },
  { key: 'segmentfault', name: 'SegmentFault', category: 'tech' },
  { key: 'linuxdo', name: 'LinuxDo', category: 'tech' },
  { key: 'hackernews', name: 'Hacker News', category: 'tech' },
  { key: 'leetcode-cn', name: '力扣', category: 'tech' },
  { key: 'lol', name: '英雄联盟', category: 'game' },
  { key: 'genshin', name: '原神', category: 'game' },
  { key: 'steam', name: 'Steam', category: 'game' },
  { key: 'ngabbs', name: 'NGA', category: 'game' },
  { key: 'game163', name: '网易游戏', category: 'game' },
  { key: 'game17173', name: '17173', category: 'game' },
  { key: 'lolm', name: '英雄联盟手游', category: 'game' },
  { key: 'dnf', name: 'DNF', category: 'game' },
  { key: 'switch', name: 'Switch', category: 'game' },
  { key: 'xbox', name: 'Xbox', category: 'game' },
  { key: 'playstation', name: 'PlayStation', category: 'game' },
]

export const DEFAULT_PLATFORM = 'weibo'
export const DEFAULT_CATEGORY: PlatformCategory = 'general'

export const PLATFORM_MAP = PLATFORM_OPTIONS.reduce<Record<string, PlatformInfo>>((acc, item) => {
  acc[item.key] = item
  return acc
}, {})

const categorySeed: Record<PlatformCategory, PlatformInfo[]> = {
  general: [],
  entertainment: [],
  tech: [],
  game: [],
}

export const PLATFORMS_BY_CATEGORY = PLATFORM_OPTIONS.reduce<Record<PlatformCategory, PlatformInfo[]>>((acc, item) => {
  acc[item.category].push(item)
  return acc
}, categorySeed)
