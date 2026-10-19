import { afterEach, describe, expect, it, vi } from 'vitest'
import { listBangumiCollection, getSubjectCounts, getStatusCounts } from '../src/services/bangumi'
import { useFetchAxiosAdapter } from './helpers/fetch-axios-adapter'

useFetchAxiosAdapter()
afterEach(() => vi.unstubAllGlobals())
describe('Bangumi.tv alongside Bilibili', () => {
  it('reads the Bangumi account and maps watching/watched without Bilibili requests', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      expect(url.origin).toBe('https://api.bgm.tv')
      return Response.json({
        total: 50,
        data: [
          {
            subject_id: 17,
            type: Number(url.searchParams.get('type')) || 2,
            rate: 9,
            subject: {
              name: 'Original',
              name_cn: '条目',
              score: 7.5,
              images: { common: 'https://lain.bgm.tv/poster.jpg' },
            },
          },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const query = { source: 'bangumi' as const, userId: 'ccexid', subjectType: 2 as const }
    const watching = await listBangumiCollection({ ...query, status: 2, offset: 24 })
    expect(watching.items[0]).toMatchObject({
      source: 'bangumi',
      status: 2,
      score: 9,
      ownScore: true,
      url: 'https://bgm.tv/subject/17',
    })
    expect(new URL(String(fetchMock.mock.calls[0]![0])).searchParams.get('type')).toBe('3')
    expect(new URL(String(fetchMock.mock.calls[0]![0])).searchParams.get('offset')).toBe('24')
    const watched = await listBangumiCollection({ ...query, status: 3 })
    expect(watched.items[0]?.status).toBe(3)
    expect(new URL(String(fetchMock.mock.calls[1]![0])).searchParams.get('type')).toBe('2')
    await listBangumiCollection({ ...query, status: 'all' })
    expect(new URL(String(fetchMock.mock.calls[2]![0])).searchParams.has('type')).toBe(false)
  })
  it('loads five media and six filter counts using the selected provider', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ data: [], total: 0 })),
    )
    expect(await getSubjectCounts('demo', undefined, 'bangumi')).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 6: 0 })
    expect(await getStatusCounts('demo', 2, undefined, 'bangumi')).toEqual({
      all: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    })
  })
  it('keeps errors source-specific rather than returning a false empty state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    )
    await expect(
      listBangumiCollection({ source: 'bangumi', userId: 'missing', subjectType: 2 }),
    ).rejects.toThrow('Bangumi')
    await expect(listBangumiCollection({ source: 'bangumi', userId: '', subjectType: 2 })).rejects.toThrow(
      'VITE_BANGUMI_USER_ID',
    )
  })
})
