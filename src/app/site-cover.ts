import type { InjectionKey } from 'vue'
import { siteConfig } from '@/config/site'
export type SiteCoverKind = 'home' | 'page' | 'article' | 'not-found'
export interface SiteCover {
  kind: SiteCoverKind
  title: string
  description?: string
  compact?: boolean
  image?: string
  imageAlt?: string
  metadata?: string[]
  sections?: Array<{ id: string; title: string; level?: number }>
}
export interface SiteCoverController {
  set(owner: string, cover: SiteCover): void
  clear(owner: string): void
}
export const siteCoverKey: InjectionKey<SiteCoverController> = Symbol('site-cover')
export function defaultSiteCover(path: string): SiteCover {
  const page = siteConfig.pageTitles[path as keyof typeof siteConfig.pageTitles]
  if (path === '/') return { kind: 'home', title: page.coverTitle, description: siteConfig.tagline }
  if (page)
    return {
      kind: 'page',
      title: page.coverTitle,
      compact: 'compact' in page ? page.compact : undefined,
    }
  if (path.startsWith('/posts/')) return { kind: 'article', title: '正在打开文章…' }
  if (path.startsWith('/categories/') || path.startsWith('/tags/'))
    return { kind: 'page', title: '正在打开…' }
  return { kind: 'not-found', title: siteConfig.notFound.coverTitle }
}
