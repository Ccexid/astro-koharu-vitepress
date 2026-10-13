import { friends } from '../data/friends'
import { posts } from '../data/posts'
import type { ArchiveYear, Friend, Post, TaxonomyItem } from '../types/post'

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

function taxonomyFromPosts(
  select: (post: Post) => Array<{ name: string; slug: string }>,
): TaxonomyItem[] {
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

export async function listCategories(): Promise<TaxonomyItem[]> {
  return taxonomyFromPosts((post) => [post.category])
}

export async function getCategory(slug: string): Promise<TaxonomyItem | null> {
  return (await listCategories()).find((category) => category.slug === slug) ?? null
}

export async function listPostsByCategory(slug: string): Promise<Post[]> {
  return sortedPosts(posts.filter((post) => post.category.slug === slug)).map(clonePost)
}

export async function listTags(): Promise<TaxonomyItem[]> {
  return taxonomyFromPosts((post) => post.tags)
}

export async function getTag(slug: string): Promise<TaxonomyItem | null> {
  return (await listTags()).find((tag) => tag.slug === slug) ?? null
}

export async function listPostsByTag(slug: string): Promise<Post[]> {
  return sortedPosts(posts.filter((post) => post.tags.some((tag) => tag.slug === slug))).map(
    clonePost,
  )
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
