import { articleText, normalizeDraft, postFromDraft } from './article-content'
import { parseArticleFile } from './article-drafts'
import type { ArticleDraft, ArticleNode } from '@/types/article'
import type { Post, TaxonomyRef } from '@/types/post'

/** Publishing is stricter than saving/exporting an unfinished local draft. */
export function parsePublishedArticle(text: string, categories: readonly TaxonomyRef[]): ArticleDraft {
  const draft = normalizeDraft(parseArticleFile(text))
  // Do not silently truncate identifiers or required metadata at the publication boundary.
  const raw = JSON.parse(text) as Record<string, unknown>
  if (typeof raw.updatedAt !== 'string' || !Number.isFinite(Date.parse(raw.updatedAt)))
    throw new Error('updatedAt 必须为有效的更新时间。')
  for (const [field, max] of [
    ['id', 160],
    ['slug', 120],
    ['title', 160],
    ['excerpt', 500],
  ] as const) {
    const value = raw[field]
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.length > max ||
      /[\u0000-\u001f\u007f]/.test(value)
    )
      throw new Error(`${field} 必须为非空文字，最多 ${max} 字符，且不能包含控制字符。`)
  }
  const category = categories.find((item) => item.slug === draft.category.slug)
  if (!category || category.name !== draft.category.name)
    throw new Error('分类名称与 slug 必须匹配 src/data/categories.ts 中的目录；新分类请先加入目录。')
  function hasImage(node: ArticleNode): boolean {
    return node.type === 'image' || !!node.content?.some(hasImage)
  }
  if (!articleText(draft.content).trim() && !hasImage(draft.content))
    throw new Error('正文不能为空，请至少填写文字或图片。')
  return draft
}

/** JSON may replace a demonstration article by ID; two JSON files may never share an ID. */
export function collectPublishedPosts(
  base: readonly Post[],
  files: Record<string, string>,
  categories: readonly TaxonomyRef[],
): Post[] {
  const byId = new Map(base.map((post) => [post.id, post]))
  const sources = new Map<string, string>()
  if (byId.size !== base.length) throw new Error('示例文章存在重复 ID。')
  for (const path of Object.keys(files).sort()) {
    try {
      const draft = parsePublishedArticle(files[path]!, categories)
      const previous = sources.get(draft.id)
      if (previous) throw new Error(`文章 ID ${draft.id} 与 ${previous} 重复。`)
      sources.set(draft.id, path)
      byId.set(draft.id, postFromDraft(draft))
    } catch (reason) {
      throw new Error(`${path}: ${reason instanceof Error ? reason.message : String(reason)}`)
    }
  }
  const slugs = new Map<string, string>()
  for (const post of byId.values()) {
    const previous = slugs.get(post.slug)
    if (previous)
      throw new Error(`slug ${post.slug} 重复：${previous} 与 ${sources.get(post.id) ?? post.id}。`)
    slugs.set(post.slug, sources.get(post.id) ?? post.id)
  }
  return [...byId.values()]
}
