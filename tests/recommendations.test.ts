import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPostRecommendations, listPosts } from '../src/services/posts'

afterEach(() => vi.restoreAllMocks())

describe('post recommendations', () => {
  it.each([undefined, 'missing'])('splits all available posts without duplicates for %s', async (slug) => {
    const posts = await listPosts()
    const result = await getPostRecommendations(slug)
    const ids = [...result.random, ...result.secondary].map((post) => post.id)
    expect(result.hasRelated).toBe(false)
    expect(result.random).toHaveLength(4)
    expect(result.secondary).toHaveLength(3)
    expect(new Set(ids).size).toBe(posts.length)
    expect(new Set(ids)).toEqual(new Set(posts.map((post) => post.id)))
  })

  it('prioritizes related content and excludes both the current article and cross-column duplicates', async () => {
    const result = await getPostRecommendations('a-note-for-spring')
    const posts = [...result.random, ...result.secondary]
    expect(result.hasRelated).toBe(true)
    expect(result.secondary[0]?.slug).toBe('reading-between-days')
    expect(posts.some((post) => post.slug === 'a-note-for-spring')).toBe(false)
    expect(new Set(posts.map((post) => post.id)).size).toBe(posts.length)
  })

  it('falls back to random reading when an article has no matching topics', async () => {
    const result = await getPostRecommendations('routes-with-vue-router')
    expect(result.hasRelated).toBe(false)
    expect(result.random).toHaveLength(3)
    expect(result.secondary).toHaveLength(3)
    expect(
      [...result.random, ...result.secondary].some((post) => post.slug === 'routes-with-vue-router'),
    ).toBe(false)
  })

  it('reshuffles recommendations without changing the source order or content', async () => {
    const before = await listPosts()
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = await getPostRecommendations()
    random.mockReturnValue(0.999)
    const second = await getPostRecommendations()
    expect(first.random.map((post) => post.id)).not.toEqual(second.random.map((post) => post.id))
    first.random[0]!.title = 'changed'
    expect(await listPosts()).toEqual(before)
  })
})
