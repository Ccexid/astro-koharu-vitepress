import type { InjectionKey } from 'vue'
export type SiteCoverKind = 'home' | 'page' | 'article' | 'not-found'
export interface SiteCover {
  kind: SiteCoverKind
  title: string
  description?: string
  image?: string
  imageAlt?: string
  metadata?: string[]
  sections?: Array<{ id: string; title: string }>
}
export interface SiteCoverController {
  set(owner: string, cover: SiteCover): void
  clear(owner: string): void
}
export const siteCoverKey: InjectionKey<SiteCoverController> = Symbol('site-cover')
export function defaultSiteCover(path: string): SiteCover {
  if (path === '/') return { kind: 'home', title: '一封春日来信', description: '把日常，写成轻轻落下的花瓣' }
  const titles: Record<string, string> = {
    '/posts': '所有文章',
    '/categories': '所有分类',
    '/tags': '所有标签',
    '/archives': '归档',
    '/friends': '友情链接',
    '/about': '关于我',
    '/bangumi': '追番',
  }
  if (titles[path]) return { kind: 'page', title: titles[path] }
  if (path.startsWith('/posts/')) return { kind: 'article', title: '正在打开文章…' }
  if (path.startsWith('/categories/') || path.startsWith('/tags/'))
    return { kind: 'page', title: '正在打开…' }
  return { kind: 'not-found', title: '404' }
}
