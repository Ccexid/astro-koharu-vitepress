export const siteNavigation = [
  { label: '首页', to: '/' },
  { label: '文章', to: '/posts' },
  { label: '分类', to: '/categories' },
  { label: '标签', to: '/tags' },
  { label: '归档', to: '/archives' },
  { label: '追番', to: '/bangumi' },
  { label: '友链', to: '/friends' },
  { label: '关于', to: '/about' },
] as const

export function isNavigationActive(path: string, destination: string): boolean {
  return destination === '/' ? path === '/' : path === destination || path.startsWith(`${destination}/`)
}
