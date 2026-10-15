import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBilibiliPage } from '../src/api/bilibili'
import { getStatusCounts, getSubjectCounts, listBangumiCollection } from '../src/services/bangumi'

function rawItem(id: number) {
  return {
    season_id: id,
    title: '作品 ' + id,
    cover: '//i0.hdslb.com/cover.jpg',
    rating: { score: 8.2 },
    publish: { pub_time: '2024-01-01 12:00:00' },
    new_ep: { index_show: '全24话' },
  }
}
function installMock(counts: Record<string, number>) {
  const mock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://local.test')
    const type = Number(url.searchParams.get('type'))
    const state = Number(url.searchParams.get('follow_status'))
    const page = Number(url.searchParams.get('pn'))
    const size = Number(url.searchParams.get('ps'))
    const total = counts[`${type}-${state}`] ?? 0
    const start = (page - 1) * size
    return Response.json({
      code: 0,
      data: {
        total,
        list: Array.from({ length: Math.max(0, Math.min(size, total - start)) }, (_, i) =>
          rawItem(type * 10000 + state * 1000 + start + i + 1),
        ),
      },
    })
  })
  vi.stubGlobal('fetch', mock)
  return mock
}
afterEach(() => vi.unstubAllGlobals())
describe('Bilibili collection adapter', () => {
  it('uses the same-origin proxy and maps Bilibili states and URLs', async () => {
    const mock = installMock({ '1-2': 1 })
    const result = await fetchBilibiliPage({ userId: '19580033', subjectType: 1, status: 2 })
    const url = new URL(String(mock.mock.calls[0]![0]), 'http://local.test')
    expect(url.pathname).toBe('/bili/x/space/bangumi/follow/list')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      vmid: '19580033',
      type: '1',
      follow_status: '2',
      pn: '1',
      ps: '30',
    })
    expect(result.items[0]).toMatchObject({
      id: 12001,
      status: 2,
      image: 'https://i0.hdslb.com/cover.jpg',
      url: 'https://www.bilibili.com/bangumi/play/ss12001',
      score: 8.2,
      ownScore: false,
      episodes: 0,
    })
  })
  it('maps a 24-item append across the upstream 30-item boundary without gaps', async () => {
    const mock = installMock({ '1-2': 55 })
    const first = await listBangumiCollection({ userId: '19580033', subjectType: 1, status: 2 })
    const next = await listBangumiCollection({ userId: '19580033', subjectType: 1, status: 2, offset: 24 })
    expect(first.items.map((item) => item.id)).toEqual(Array.from({ length: 24 }, (_, i) => 12001 + i))
    expect(next.items.map((item) => item.id)).toEqual(Array.from({ length: 24 }, (_, i) => 12025 + i))
    expect(next.total).toBe(55)
    expect(
      mock.mock.calls.some(
        ([url]) => new URL(String(url), 'http://local.test').searchParams.get('pn') === '2',
      ),
    ).toBe(true)
  })
  it('keeps all-state ranges and type/state counts coherent', async () => {
    installMock({ '1-2': 3, '1-1': 2, '1-3': 4, '2-2': 7 })
    const page = await listBangumiCollection({
      userId: '19580033',
      subjectType: 1,
      status: 'all',
      offset: 2,
      limit: 5,
    })
    expect(page.items.map((item) => item.id)).toEqual([12003, 11001, 11002, 13001, 13002])
    expect(page.total).toBe(9)
    expect(await getStatusCounts('19580033', 1)).toEqual({ all: 9, 1: 2, 2: 3, 3: 4 })
    expect(await getSubjectCounts('19580033')).toEqual({ 1: 9, 2: 7 })
  })
  it('distinguishes API errors and malformed payloads from an empty list', async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ code: -403, message: 'private' }))
      .mockResolvedValueOnce(Response.json({ code: 0, data: { total: 1, list: null } }))
      .mockResolvedValueOnce(new Response('', { status: 502 }))
    vi.stubGlobal('fetch', mock)
    const query = { userId: '19580033', subjectType: 1 as const, status: 2 as const }
    await expect(fetchBilibiliPage(query)).rejects.toThrow('-403')
    await expect(fetchBilibiliPage(query)).rejects.toThrow('无法识别')
    await expect(fetchBilibiliPage(query)).rejects.toThrow('502')
    await expect(listBangumiCollection({ ...query, offset: -1 })).rejects.toThrow(RangeError)
    await expect(fetchBilibiliPage({ ...query, userId: '' })).rejects.toThrow('UID')
    expect(mock).toHaveBeenCalledTimes(3)
  })
  it('forwards cancellation and only parses explicit watch progress', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(init?.signal).toBeDefined()
        return Response.json({
          code: 0,
          data: { total: 1, list: [{ ...rawItem(1), progress: '看到第5话', url: 'javascript:alert(1)' }] },
        })
      }),
    )
    const query = { userId: '19580033', subjectType: 1 as const, status: 2 as const }
    expect((await fetchBilibiliPage(query, controller.signal)).items[0]).toMatchObject({
      episodes: 5,
      url: 'https://www.bilibili.com/bangumi/play/ss1',
    })
    controller.abort()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        init?.signal?.throwIfAborted()
        throw new Error('unreachable')
      }),
    )
    await expect(fetchBilibiliPage(query, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })
})
