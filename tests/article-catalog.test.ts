import { describe, expect, it } from 'vitest'
import { checkArticles } from '../scripts/articles'
import { posts } from '../src/data/posts'
import { getPost, listArchives, listPosts, listPostsByCategory, listPostsByTag } from '../src/services/posts'

describe('Vite JSON discovery and typed article services', () => {
  it('uses exactly the same catalog in the CLI and the application', async () => {
    expect(posts).toEqual((await checkArticles()).posts)
    const listed = await listPosts()
    expect(new Set(listed.map((post) => post.id))).toEqual(new Set(posts.map((post) => post.id)))
    const archives = (await listArchives()).flatMap((year) => year.months.flatMap((month) => month.posts))
    for (const post of posts) {
      expect((await getPost(post.slug))?.id).toBe(post.id)
      expect((await listPostsByCategory(post.category.slug)).map((item) => item.id)).toContain(post.id)
      for (const tag of post.tags)
        expect((await listPostsByTag(tag.slug)).map((item) => item.id)).toContain(post.id)
      expect(archives.map((item) => item.id)).toContain(post.id)
    }
  })
})
