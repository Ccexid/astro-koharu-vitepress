export interface TaxonomyRef {
  name: string
  slug: string
}

export interface PostSection {
  id: string
  title: string
  paragraphs: string[]
  quote?: string
  list?: string[]
}

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  category: TaxonomyRef
  tags: TaxonomyRef[]
  readingMinutes: number
  cover: string
  coverAlt: string
  pinned?: boolean
  sections: PostSection[]
}

export interface TaxonomyItem extends TaxonomyRef {
  count: number
  children?: TaxonomyItem[]
}

export interface Friend {
  name: string
  url: string
  description: string
  initial: string
  owner: string
  group: string
  color: string
}

export interface ArchiveMonth {
  month: number
  posts: Post[]
}

export interface ArchiveYear {
  year: number
  months: ArchiveMonth[]
}

export interface FriendGroup {
  id: string
  title: string
  description: string
}
