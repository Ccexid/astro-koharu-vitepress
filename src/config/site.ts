import { Archive, BookOpen, FolderOpen, Hash, Info, Link, Tv } from 'lucide-vue-next'
import { Home } from '@meteor-icons/vue'
const home = { label: '首页', to: '/', icon: Home }
const articleItems = [
  { label: '所有文章', to: '/posts', icon: BookOpen },
  { label: '分类', to: '/categories', icon: FolderOpen },
  { label: '标签', to: '/tags', icon: Hash },
  { label: '归档', to: '/archives', icon: Archive },
]
const primaryItems = [
  { label: '友链', to: '/friends', icon: Link },
  { label: '关于', to: '/about', icon: Info },
  { label: '追番', to: '/bangumi', icon: Tv },
]

export const siteConfig = {
  name: 'Koharu',
  author: 'Ccexid',
  tagline: '把日常，写成轻轻落下的花瓣',
  profileDescription: '记录美好生活。',
  copyrightSince: 2026,
  pageTitles: {
    '/': { documentTitle: 'Hi！Wrold', coverTitle: 'Hi！Wrold' },
    '/posts': { documentTitle: '所有文章', coverTitle: '所有文章' },
    '/editor': { documentTitle: '本地文章编辑', coverTitle: '写作手记', compact: true },
    '/categories': { documentTitle: '文章分类', coverTitle: '所有分类' },
    '/tags': { documentTitle: '文章标签', coverTitle: '所有标签' },
    '/archives': { documentTitle: '时光归档', coverTitle: '归档' },
    '/bangumi': { documentTitle: '追番记录', coverTitle: '追番' },
    '/friends': { documentTitle: '友人来信', coverTitle: '友情链接' },
    '/about': { documentTitle: '关于', coverTitle: '关于我', compact: false },
  },
  notFound: { documentTitle: '页面不存在', coverTitle: '404' },
  navigation: {
    ariaLabel: '主导航',
    home,
    articles: { label: '文章', icon: BookOpen, items: articleItems },
    primary: primaryItems,
    sidebar: [home, ...articleItems, ...primaryItems],
  },
} as const

export function isNavigationActive(path: string, destination: string): boolean {
  return destination === '/' ? path === '/' : path === destination || path.startsWith(`${destination}/`)
}
