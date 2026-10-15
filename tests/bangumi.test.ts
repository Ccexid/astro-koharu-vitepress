import { afterEach, describe, expect, it, vi } from 'vitest'
import { listBangumiCollection } from '../src/services/bangumi'
function rawItem(id: number, overrides: Record<string, unknown> = {}) {
  return {
    subject_id: id,
    type: 3,
    rate: 8,
    ep_status: 4,
    subject: {
      id,
      name: 'Original',
      name_cn: '作品 ' + id,
      score: 7.4,
      date: '2024-01-01',
      images: { common: 'https://lain.bgm.tv/cover.jpg' },
    },
    ...overrides,
  }
}
afterEach(() => vi.unstubAllGlobals())
describe('Bangumi public collection adapter', () => {
  it('reads only the requested offset and preserves personal ratings', async () => {
    const mock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      const offset = Number(url.searchParams.get('offset'))
      return Response.json({
        data: Array.from({ length: offset === 0 ? 24 : 1 }, (_, i) => rawItem(offset + i + 1)),
        total: 25,
      })
    })
    vi.stubGlobal('fetch', mock)
    const first = await listBangumiCollection({ userId: 'a name', subjectType: 2 })
    const next = await listBangumiCollection({ userId: 'a name', subjectType: 2, offset: 24 })
    expect(first.items).toHaveLength(24)
    expect(next.items.map((item) => item.id)).toEqual([25])
    expect(first.items[0]).toMatchObject({ title: '作品 1', score: 8, ownScore: true, status: 3 })
    const urls = mock.mock.calls.map(([input]) => new URL(String(input)))
    expect(urls[0]!.pathname).toBe('/v0/users/a%20name/collections')
    expect(urls.map((url) => url.searchParams.get('offset'))).toEqual(['0', '24'])
    expect(urls[0]!.searchParams.has('type')).toBe(false)
  })
  it('sends subject and state filters and falls back to community rating', async () => {
    const mock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json({ data: [rawItem(2, { rate: 0 })], total: 1 }),
    )
    vi.stubGlobal('fetch', mock)
    const result = await listBangumiCollection({ userId: 'cosine', subjectType: 4, status: 4 })
    expect(result.items[0]).toMatchObject({ score: 7.4, ownScore: false })
    const url = new URL(String(mock.mock.calls[0]![0]))
    expect(url.searchParams.get('subject_type')).toBe('4')
    expect(url.searchParams.get('type')).toBe('4')
  })
  it('rejects malformed and failed responses and invalid ranges', async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: null, total: 3 }))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
    vi.stubGlobal('fetch', mock)
    await expect(listBangumiCollection({ userId: 'cosine', subjectType: 2 })).rejects.toThrow('无法识别')
    await expect(listBangumiCollection({ userId: 'missing', subjectType: 2 })).rejects.toThrow('找不到')
    await expect(listBangumiCollection({ userId: 'cosine', subjectType: 2, offset: -1 })).rejects.toThrow(
      RangeError,
    )
    expect(mock).toHaveBeenCalledTimes(2)
  })
  it('forwards cancellation without requesting a token', async () => {
    const controller = new AbortController()
    const mock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal).toBeDefined()
      expect(init?.headers).toBeUndefined()
      controller.abort()
      expect(init?.signal?.aborted).toBe(true)
      throw new DOMException('cancelled', 'AbortError')
    })
    vi.stubGlobal('fetch', mock)
    await expect(
      listBangumiCollection({ userId: 'cosine', subjectType: 2 }, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
