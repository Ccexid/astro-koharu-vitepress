import type { ArticleDocument, ArticleDraft, ArticleHeading, ArticleMark, ArticleNode } from '@/types/article'
import type { Post, PostSection } from '@/types/post'
import { createClientId } from '@/utils/id'

const blocks = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'taskList',
  'codeBlock',
  'image',
  'horizontalRule',
  'table',
  'callout',
]
const types = new Set([
  'doc',
  'text',
  'hardBreak',
  'listItem',
  'taskItem',
  'tableRow',
  'tableCell',
  'tableHeader',
  ...blocks,
])
const markTypes = new Set(['bold', 'italic', 'underline', 'strike', 'highlight', 'code', 'link'])
export const calloutKinds = ['info', 'success', 'warning', 'error'] as const
export const codeLanguages = [
  'plaintext',
  'javascript',
  'typescript',
  'json',
  'css',
  'html',
  'python',
  'bash',
] as const
const textNode = (text: string): ArticleNode => ({ type: 'text', text })
const paragraph = (text: string): ArticleNode => ({
  type: 'paragraph',
  content: text ? [textNode(text)] : [],
})

export function safeArticleUrl(value: unknown, image = false): string {
  if (typeof value !== 'string' || !value || /[\\\u0000-\u0020\u007f]/.test(value)) return ''
  if (value.startsWith('/') && !value.startsWith('//')) return value
  if (!image && value.startsWith('#')) return value
  try {
    return (image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:']).includes(
      new URL(value).protocol,
    )
      ? value
      : ''
  } catch {
    return ''
  }
}

function string(value: unknown, max = 10000): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function boundedInteger(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : fallback
}

/** Validate the supported JSON schema, discard arbitrary HTML attributes and assign stable unique anchors. */
export function normalizeArticleDocument(value: unknown): ArticleDocument {
  let count = 0
  let textLength = 0
  const ids = new Set<string>()
  function visit(input: unknown, depth: number): ArticleNode {
    if (++count > 20000 || depth > 24) throw new Error('正文过长或嵌套过深。')
    if (!input || typeof input !== 'object') throw new Error('正文节点格式不正确。')
    const raw = input as Record<string, unknown>
    const type = string(raw.type)
    if (!types.has(type) || (type === 'doc' && depth > 0))
      throw new Error(`不支持的正文节点：${type || '空节点'}`)
    const node: ArticleNode = { type }
    const attrs = raw.attrs && typeof raw.attrs === 'object' ? (raw.attrs as Record<string, unknown>) : {}
    if (type === 'text') {
      if (typeof raw.text !== 'string' || !raw.text.length || raw.text.length > 200000)
        throw new Error('文本节点格式不正确或过长。')
      textLength += raw.text.length
      if (textLength > 1_000_000) throw new Error('正文总文字量过大。')
      node.text = raw.text
      if (raw.marks !== undefined && !Array.isArray(raw.marks)) throw new Error('文字格式不正确。')
      const seenMarks = new Set<string>()
      node.marks = (raw.marks as Array<Record<string, unknown>> | undefined)?.map((mark) => {
        if (!mark || !markTypes.has(string(mark.type)) || seenMarks.has(string(mark.type)))
          throw new Error('不支持或重复的文字格式。')
        seenMarks.add(string(mark.type))
        const result: ArticleMark = { type: mark.type as ArticleMark['type'] }
        if (result.type === 'link') {
          const href = safeArticleUrl((mark.attrs as Record<string, unknown> | undefined)?.href)
          if (!href) throw new Error('链接地址不安全或格式不正确。')
          result.attrs = { href }
        }
        return result
      })
      return node
    }
    if (raw.content !== undefined && !Array.isArray(raw.content)) throw new Error('正文内容必须为节点数组。')
    if (Array.isArray(raw.content)) node.content = raw.content.map((child) => visit(child, depth + 1))
    const children = node.content || []
    let allowed: string[] = []
    if (['doc', 'blockquote', 'callout', 'listItem', 'taskItem', 'tableCell', 'tableHeader'].includes(type))
      allowed = blocks
    if (['paragraph', 'heading'].includes(type)) allowed = ['text', 'hardBreak']
    if (type === 'codeBlock') allowed = ['text']
    if (['bulletList', 'orderedList'].includes(type)) allowed = ['listItem']
    if (type === 'taskList') allowed = ['taskItem']
    if (type === 'table') allowed = ['tableRow']
    if (type === 'tableRow') allowed = ['tableCell', 'tableHeader']
    if (children.some((child) => !allowed.includes(child.type)))
      throw new Error(`节点 ${type} 包含不支持的内容。`)
    if (['bulletList', 'orderedList', 'taskList', 'table', 'tableRow'].includes(type) && !children.length)
      throw new Error(`${type} 不能为空。`)
    if (['listItem', 'taskItem'].includes(type) && children[0]?.type !== 'paragraph')
      throw new Error('列表项必须以段落开始。')
    if (['blockquote', 'callout'].includes(type) && !children.length) node.content = [paragraph('')]
    if (type === 'codeBlock' && children.some((child) => child.marks?.length))
      throw new Error('代码块不能包含额外文字格式。')
    if (['paragraph', 'heading'].includes(type)) {
      node.attrs = {
        textAlign: ['left', 'center', 'right'].includes(String(attrs.textAlign)) ? attrs.textAlign : 'left',
      }
    }
    if (type === 'heading') {
      const level = Number(attrs.level)
      if (![2, 3, 4].includes(level)) throw new Error('正文标题只支持 H2、H3、H4。')
      const original = string(attrs.id, 120)
      const base = /^[\p{L}\p{N}_-]+$/u.test(original) ? original : `section-${count}`
      let id = base
      let suffix = 2
      while (ids.has(id)) id = `${base}-${suffix++}`
      ids.add(id)
      node.attrs = { ...node.attrs, level, id }
    }
    if (type === 'orderedList') node.attrs = { start: boundedInteger(attrs.start ?? 1, 1, 10000, 1) }
    if (type === 'taskItem') node.attrs = { checked: attrs.checked === true }
    if (type === 'callout')
      node.attrs = {
        kind: calloutKinds.includes(attrs.kind as (typeof calloutKinds)[number]) ? attrs.kind : 'info',
      }
    if (type === 'codeBlock')
      node.attrs = {
        language: codeLanguages.includes(attrs.language as (typeof codeLanguages)[number])
          ? attrs.language
          : 'plaintext',
      }
    if (type === 'image') {
      const src = safeArticleUrl(attrs.src, true)
      if (!src) throw new Error('图片必须使用 http(s) 地址或站内路径。')
      node.attrs = {
        src,
        alt: string(attrs.alt, 300),
        title: string(attrs.title, 300),
        caption: string(attrs.caption, 500),
      }
    }
    if (['tableCell', 'tableHeader'].includes(type)) {
      const width = attrs.colwidth
      node.attrs = {
        colspan: boundedInteger(attrs.colspan ?? 1, 1, 20, 1),
        rowspan: boundedInteger(attrs.rowspan ?? 1, 1, 20, 1),
        colwidth: Array.isArray(width)
          ? width.slice(0, 20).map((item) => boundedInteger(item, 40, 1200, 100))
          : null,
      }
      if (!children.length) node.content = [paragraph('')]
    }
    return node
  }
  const doc = visit(value, 0)
  if (doc.type !== 'doc') throw new Error('正文根节点必须为 doc。')
  if (!doc.content?.length) doc.content = [paragraph('')]
  return doc as ArticleDocument
}

export function legacySectionsToDocument(sections: PostSection[]): ArticleDocument {
  return normalizeArticleDocument({
    type: 'doc',
    content: sections.flatMap((section) => [
      { type: 'heading', attrs: { level: 2, id: section.id }, content: [textNode(section.title)] },
      ...section.paragraphs.map(paragraph),
      ...(section.quote ? [{ type: 'blockquote', content: [paragraph(section.quote)] }] : []),
      ...(section.list?.length
        ? [
            {
              type: 'bulletList',
              content: section.list.map((text) => ({ type: 'listItem', content: [paragraph(text)] })),
            },
          ]
        : []),
    ]),
  })
}

export function postDocument(post: Post): ArticleDocument {
  return post.content ? normalizeArticleDocument(post.content) : legacySectionsToDocument(post.sections)
}

export function articleText(node: ArticleNode): string {
  if (node.type === 'text') return node.text || ''
  if (node.type === 'hardBreak') return '\n'
  if (node.type === 'image') return ''
  return (node.content || [])
    .map(articleText)
    .join(['paragraph', 'heading', 'codeBlock'].includes(node.type) ? '' : '\n')
}

export function articleStats(doc: ArticleDocument) {
  const text = articleText(doc)
  const wordCount = (
    text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[\p{L}\p{N}]+/gu) || []
  ).length
  return { wordCount, readingMinutes: Math.max(1, Math.ceil(wordCount / 300)) }
}

export function articleHeadings(doc: ArticleDocument): ArticleHeading[] {
  const headings: ArticleHeading[] = []
  function walk(node: ArticleNode) {
    if (node.type === 'heading')
      headings.push({
        id: String(node.attrs?.id),
        title: articleText(node),
        level: Number(node.attrs?.level),
      })
    node.content?.forEach(walk)
  }
  walk(doc)
  return headings
}

export function draftFromPost(post: Post): ArticleDraft {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    category: { ...post.category },
    tags: post.tags.map((tag) => ({ ...tag })),
    cover: post.cover,
    coverAlt: post.coverAlt,
    pinned: !!post.pinned,
    contentVersion: 1,
    content: postDocument(post),
    updatedAt: new Date().toISOString(),
  }
}

export function normalizeDraft(input: unknown, incomplete = false): ArticleDraft {
  if (!input || typeof input !== 'object') throw new Error('文章文件格式不正确。')
  const raw = input as Record<string, unknown>
  if (raw.contentVersion !== 1) throw new Error('不支持的正文版本。')
  const title = string(raw.title, 160).trim()
  const slug = string(raw.slug, 120).trim()
  const id = string(raw.id, 160).trim()
  if (!id || (!incomplete && (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))))
    throw new Error('请填写标题和有效的英文 slug（小写字母、数字、连字符）。')
  const publishedAt = string(raw.publishedAt)
  const date = new Date(`${publishedAt}T00:00:00Z`)
  if (
    !incomplete &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== publishedAt)
  )
    throw new Error('文章日期无效。')
  const category = raw.category as Record<string, unknown> | undefined
  function taxonomy(item: unknown) {
    const value = item as Record<string, unknown> | undefined
    const name = string(value?.name, 50).trim()
    const slug = string(value?.slug, 120).trim()
    if (!incomplete && (!name || !/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(slug)))
      throw new Error('分类或标签格式不正确。')
    return { name, slug }
  }
  if (!Array.isArray(raw.tags) || raw.tags.length > 30) throw new Error('标签格式不正确或数量超过 30 个。')
  const cover = string(raw.cover, 2048)
  if (cover && !safeArticleUrl(cover, true)) throw new Error('封面地址不安全。')
  return {
    id,
    slug,
    title,
    excerpt: string(raw.excerpt, 500),
    publishedAt,
    category: taxonomy(category),
    tags: raw.tags.map(taxonomy),
    cover,
    coverAlt: string(raw.coverAlt, 300),
    pinned: raw.pinned === true,
    contentVersion: 1,
    content: normalizeArticleDocument(raw.content),
    updatedAt:
      typeof raw.updatedAt === 'string' && Number.isFinite(Date.parse(raw.updatedAt))
        ? raw.updatedAt
        : new Date().toISOString(),
  }
}

export function emptyDraft(): ArticleDraft {
  return {
    id: createClientId(),
    slug: '',
    title: '',
    excerpt: '',
    publishedAt: new Date().toLocaleDateString('sv-SE'),
    category: { name: '随笔', slug: 'essays' },
    tags: [],
    cover: '',
    coverAlt: '',
    pinned: false,
    contentVersion: 1,
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    updatedAt: new Date().toISOString(),
  }
}

/** Adapter for JSON files explicitly added to the repository and redeployed. */
export function postFromDraft(input: unknown): Post {
  const draft = normalizeDraft(input)
  return { ...draft, sections: [], readingMinutes: articleStats(draft.content).readingMinutes }
}
