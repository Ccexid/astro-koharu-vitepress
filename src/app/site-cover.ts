import type { InjectionKey } from 'vue'

export type SiteCoverKind = 'home' | 'page' | 'article' | 'not-found'

export interface SiteCover {
  kind: SiteCoverKind
  title: string
  eyebrow?: string
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
  if (path === '/') {
    return {
      kind: 'home',
      eyebrow: 'A LITTLE JOURNAL OF EVERYDAY LIFE',
      title: 'Koharu',
      description: '把日常，寫成輕輕落下的花瓣',
    }
  }

  if (path === '/posts') return { kind: 'page', eyebrow: 'POSTS', title: '所有文章' }
  if (path === '/categories') return { kind: 'page', eyebrow: 'CATEGORIES', title: '文章分类' }
  if (path.startsWith('/categories/')) return { kind: 'page', eyebrow: 'CATEGORY', title: '分类文章' }
  if (path === '/tags') return { kind: 'page', eyebrow: 'TAGS', title: '文章标签' }
  if (path.startsWith('/tags/')) return { kind: 'page', eyebrow: 'TAG', title: '标签文章' }
  if (path === '/archives') return { kind: 'page', eyebrow: 'ARCHIVES', title: '时光归档' }
  if (path === '/friends') return { kind: 'page', eyebrow: 'FRIENDS', title: '友人来信' }
  if (path === '/about') return { kind: 'page', eyebrow: 'ABOUT', title: '关于这片小花园' }
  if (path === '/bangumi') return { kind: 'page', eyebrow: 'BANGUMI', title: '追番记录' }
  if (path.startsWith('/posts/')) return { kind: 'article', eyebrow: 'POST', title: '文章' }

  return { kind: 'not-found', eyebrow: '404', title: '这条小路还没有被写下' }
}
