import { describe, expect, it } from 'vitest'
import { getPost, listPosts } from '../src/services/posts'

describe('mock post service', () => {
  it('lists posts without exposing mutable fixture data', async () => {
    const first = await listPosts()
    first[0]!.body.push('changed')
    expect((await listPosts())[0]!.body).not.toContain('changed')
  })

  it('returns a post by slug or null when missing', async () => {
    expect((await getPost('welcome'))?.title).toBe('欢迎来到 Koharu')
    expect(await getPost('missing')).toBeNull()
  })
})
