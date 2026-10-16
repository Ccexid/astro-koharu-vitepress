export interface ArticleMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'highlight' | 'code' | 'link'
  attrs?: Record<string, unknown>
}

export interface ArticleNode {
  type: string
  attrs?: Record<string, unknown>
  text?: string
  marks?: ArticleMark[]
  content?: ArticleNode[]
}

export interface ArticleDocument extends ArticleNode {
  type: 'doc'
  content: ArticleNode[]
}

export interface ArticleHeading {
  id: string
  title: string
  level: number
}

export interface ArticleDraft {
  id: string
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  category: { name: string; slug: string }
  tags: Array<{ name: string; slug: string }>
  cover: string
  coverAlt: string
  pinned: boolean
  contentVersion: 1
  content: ArticleDocument
  updatedAt: string
}
