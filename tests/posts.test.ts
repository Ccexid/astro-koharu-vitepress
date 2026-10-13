import { describe, expect, it } from 'vitest'
import {
  getCategory,
  getPost,
  getTag,
  listArchives,
  listCategories,
  listFriends,
  listPosts,
  listPostsByCategory,
  listPostsByTag,
  listTags,
} from '../src/services/posts'

describe('mock post service', () => {
  it('lists posts without exposing mutable fixture data', async () => {
    const first = await listPosts()
    first[0]!.sections[0]!.paragraphs.push('changed')
    first[0]!.tags[0]!.name = 'changed'
    expect((await listPosts())[0]!.sections[0]!.paragraphs).not.toContain('changed')
    expect((await listPosts())[0]!.tags[0]!.name).not.toBe('changed')
    expect(first.map((post) => post.publishedAt)).toEqual(
      [...first.map((post) => post.publishedAt)].sort().reverse(),
    )
  })

  it('returns a post by slug or null when missing', async () => {
    expect((await getPost('a-note-for-spring'))?.title).toBe('给春天留一页空白')
    expect(await getPost('missing')).toBeNull()
  })

  it('derives category and tag counts from posts', async () => {
    const categories = await listCategories()
    const tags = await listTags()
    expect(categories.find((item) => item.slug === 'life')?.count).toBe(2)
    expect(tags.find((item) => item.slug === 'everyday')?.count).toBe(4)
    expect((await getCategory('life'))?.name).toBe('生活')
    expect(await getCategory('missing')).toBeNull()
    expect((await getTag('writing'))?.name).toBe('写作')
    expect(await getTag('missing')).toBeNull()
  })

  it('filters related posts by stable slug', async () => {
    expect((await listPostsByCategory('craft')).map((post) => post.slug)).toEqual([
      'keep-a-gentle-notebook',
      'photos-without-a-plan',
    ])
    expect((await listPostsByTag('vue')).map((post) => post.slug)).toEqual([
      'routes-with-vue-router',
    ])
    expect(await listPostsByCategory('missing')).toEqual([])
    expect(await listPostsByTag('missing')).toEqual([])
  })

  it('groups archives in reverse date order and keeps friends isolated', async () => {
    const archives = await listArchives()
    expect(archives.map((group) => group.year)).toEqual([2026, 2025])
    expect(archives[0]!.months.map((group) => group.month)).toEqual([10, 9, 8, 7, 6, 4])
    const friends = await listFriends()
    friends[0]!.name = 'changed'
    expect((await listFriends())[0]!.name).not.toBe('changed')
  })
})
