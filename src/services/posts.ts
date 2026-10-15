import { friends, friendGroups } from '@/data/friends'
import { posts } from '@/data/posts'
import { categoryCatalog } from '@/data/categories'
import type { ArchiveYear, Friend, FriendGroup, Post, PostRecommendations, TaxonomyItem } from '@/types/post'

function clonePost(post: Post): Post {
  return {
    ...post,
    category: { ...post.category },
    tags: post.tags.map((tag) => ({ ...tag })),
    sections: post.sections.map((section) => ({
      ...section,
      paragraphs: [...section.paragraphs],
      list: section.list ? [...section.list] : undefined,
    })),
  }
}

function sortedPosts(source: Post[]): Post[] {
  return [...source].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
}

function taxonomyFromPosts(select: (post: Post) => Array<{ name: string; slug: string }>): TaxonomyItem[] {
  const counts = new Map<string, TaxonomyItem>()

  for (const post of posts) {
    for (const item of select(post)) {
      const current = counts.get(item.slug)
      if (current) {
        current.count += 1
      } else {
        counts.set(item.slug, { ...item, count: 1 })
      }
    }
  }

  return [...counts.values()].sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
}

export async function listPosts(): Promise<Post[]> {
  return sortedPosts(posts).map(clonePost)
}

export async function getPost(slug: string): Promise<Post | null> {
  const post = posts.find((item) => item.slug === slug)
  return post ? clonePost(post) : null
}

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[other]] = [result[other]!, result[index]!]
  }
  return result
}

export async function getPostRecommendations(articleSlug?: string): Promise<PostRecommendations> {
  const entries = await listPosts()
  const current = entries.find((post) => post.slug === articleSlug)
  const pool = entries.filter((post) => post.slug !== articleSlug)
  const leftCount = Math.min(5, Math.ceil(pool.length / 2))
  const rightCount = Math.min(5, Math.floor(pool.length / 2))
  const currentTags = new Set(current?.tags.map((tag) => tag.slug))

  // Local content has no generated similarity index; category and tag matches provide related reading.
  const related = current
    ? pool
        .map((post) => ({
          post,
          score:
            (post.category.slug === current.category.slug
              ? 3
              : post.category.slug.split('/')[0] === current.category.slug.split('/')[0]
                ? 1
                : 0) +
            post.tags.filter((tag) => currentTags.has(tag.slug)).length * 2,
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, rightCount)
        .map(({ post }) => post)
    : []
  const relatedIds = new Set(related.map((post) => post.id))
  const random = shuffled(pool.filter((post) => !relatedIds.has(post.id))).slice(0, leftCount)
  const selectedIds = new Set(random.map((post) => post.id))
  return {
    random,
    secondary: related.length
      ? related
      : shuffled(pool.filter((post) => !selectedIds.has(post.id))).slice(0, rightCount),
    hasRelated: related.length > 0,
  }
}

export async function listCategories(): Promise<TaxonomyItem[]> {
  return categoryCatalog
    .map((category) => ({
      ...category,
      count: posts.filter(
        (post) => post.category.slug === category.slug || post.category.slug.startsWith(category.slug + '/'),
      ).length,
    }))
    .filter((category) => category.count > 0)
}

export async function getCategory(slug: string): Promise<TaxonomyItem | null> {
  return (await listCategories()).find((category) => category.slug === slug) ?? null
}

export async function listPostsByCategory(slug: string): Promise<Post[]> {
  return sortedPosts(
    posts.filter((post) => post.category.slug === slug || post.category.slug.startsWith(slug + '/')),
  ).map(clonePost)
}

export async function listTags(): Promise<TaxonomyItem[]> {
  return taxonomyFromPosts((post) => post.tags)
}

export async function getTag(slug: string): Promise<TaxonomyItem | null> {
  return (await listTags()).find((tag) => tag.slug === slug) ?? null
}

export async function listPostsByTag(slug: string): Promise<Post[]> {
  return sortedPosts(posts.filter((post) => post.tags.some((tag) => tag.slug === slug))).map(clonePost)
}

export async function listArchives(): Promise<ArchiveYear[]> {
  const grouped = new Map<number, Map<number, Post[]>>()

  for (const post of sortedPosts(posts)) {
    const date = new Date(`${post.publishedAt}T00:00:00`)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const months = grouped.get(year) ?? new Map<number, Post[]>()
    const monthPosts = months.get(month) ?? []
    monthPosts.push(clonePost(post))
    months.set(month, monthPosts)
    grouped.set(year, months)
  }

  return [...grouped.entries()]
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort(([monthA], [monthB]) => monthB - monthA)
        .map(([month, monthPosts]) => ({ month, posts: monthPosts })),
    }))
}

export async function listFriends(): Promise<Friend[]> {
  return friends.map((friend) => ({ ...friend }))
}

export async function listCategoryTree(): Promise<TaxonomyItem[]> {
  const categories = await listCategories()
  const childrenOf = (parent: string): TaxonomyItem[] =>
    categories
      .filter((item) =>
        item.slug.includes('/') ? item.slug.slice(0, item.slug.lastIndexOf('/')) === parent : !parent,
      )
      .map((item) => ({ ...item, children: childrenOf(item.slug) }))
  return childrenOf('')
}

export async function getCategoryTrail(slug: string): Promise<TaxonomyItem[]> {
  const categories = await listCategories()
  return categories
    .filter((item) => item.slug === slug || slug.startsWith(item.slug + '/'))
    .sort((a, b) => a.slug.length - b.slug.length)
}

export async function listFriendGroups(): Promise<FriendGroup[]> {
  return friendGroups.map((group) => ({ ...group }))
}
