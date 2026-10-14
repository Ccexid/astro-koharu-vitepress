import { afterEach, describe, expect, it, vi } from 'vitest'
import { BilibiliApiError, listBangumiFollows } from '../src/api/bilibili'

const params = { vmid: '19580033', type: 1, followStatus: 2 } as const
const item = {
  season_id: 43145,
  title: '蓝色监狱',
  cover: 'https://i0.hdslb.com/cover.png',
  url: 'https://www.bilibili.com/bangumi/play/ss43145',
  follow_status: 2,
  total_count: 24,
  progress: '',
  rating: { score: 9.2, count: 100 },
  new_ep: { index_show: '全24话' },
  season_type: 1,
  evaluate: '一支足球队伍的故事',
  publish: { release_date: '2022-10-08' },
  styles: ['热血', '运动'],
  stat: { follow: 200, view: 3000, danmaku: 40, reply: 50, coin: 60, likes: 70, favorite: 80 },
}

function mockResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(body, { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('Bilibili follow list API', () => {
  it('requests the proxy with the upstream query names and maps validated fields', async () => {
    const fetchMock = mockResponse({
      code: 0,
      message: 'OK',
      data: { list: [item], total: 1, pn: 2, ps: 15 },
    })
    const page = await listBangumiFollows({ ...params, page: 2, pageSize: 15 })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/bili/x/space/bangumi/follow/list?vmid=19580033&type=1&follow_status=2&pn=2&ps=15')
    expect(init).toMatchObject({ credentials: 'omit' })
    expect(page).toEqual({
      list: [
        {
          id: '43145',
          title: '蓝色监狱',
          cover: item.cover,
          url: item.url,
          status: 2,
          category: 1,
          total: 24,
          progress: undefined,
          latestEpisode: '全24话',
          score: 9.2,
          desc: '一支足球队伍的故事',
          airDate: '2022-10-08',
          type: '热血 / 运动',
          follow: 200,
          view: 3000,
          danmaku: 40,
          reply: 50,
          coin: 60,
          likes: 70,
          favorite: 80,
        },
      ],
      total: 1,
      page: 2,
      pageSize: 15,
    })
  })

  it('handles empty pages and nullable optional details', async () => {
    mockResponse({ code: 0, data: { list: [], total: 0, pn: 1, ps: 30 } })
    expect((await listBangumiFollows(params)).list).toEqual([])

    mockResponse({
      code: 0,
      data: { list: [{ ...item, rating: null, new_ep: null }], total: 1, pn: 1, ps: 30 },
    })
    expect((await listBangumiFollows(params)).list[0]?.score).toBeUndefined()
  })

  it('treats Bilibili unknown episode-count sentinel as an omitted total', async () => {
    mockResponse({
      code: 0,
      data: { list: [{ ...item, total_count: -1 }], total: 1, pn: 1, ps: 30 },
    })

    await expect(listBangumiFollows(params)).resolves.toMatchObject({ list: [{ total: undefined }] })
  })

  it('distinguishes HTTP and business errors', async () => {
    mockResponse({ message: 'forbidden' }, 403)
    await expect(listBangumiFollows(params)).rejects.toMatchObject({ kind: 'http', status: 403 })

    mockResponse({ code: -400, message: 'invalid params', data: null })
    await expect(listBangumiFollows(params)).rejects.toMatchObject({ kind: 'api', code: -400 })
  })

  it('rejects HTML and malformed payloads rather than returning incorrectly typed data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<!doctype html>')))
    await expect(listBangumiFollows(params)).rejects.toMatchObject({ kind: 'invalid-response' })

    mockResponse({
      code: 0,
      data: { list: [{ ...item, rating: { score: '9.2', count: 100 } }], total: 1, pn: 1, ps: 30 },
    })
    await expect(listBangumiFollows(params)).rejects.toThrow(BilibiliApiError)
  })

  it('rejects invalid pagination before making a request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(listBangumiFollows({ ...params, page: 0 })).rejects.toThrow(RangeError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses the requested status and type when optional upstream fields are absent', async () => {
    mockResponse({
      code: 0,
      data: {
        list: [{ season_id: 43145, title: '蓝色监狱', cover: item.cover, url: item.url }],
        total: 1,
        pn: 1,
        ps: 30,
      },
    })
    await expect(listBangumiFollows(params)).resolves.toMatchObject({
      list: [{ id: '43145', status: 2, category: 1 }],
    })
  })

  it('keeps the latest aired episode separate from watched progress', async () => {
    mockResponse({
      code: 0,
      data: {
        list: [{ ...item, progress: '看到第8话' }],
        total: 1,
        pn: 1,
        ps: 30,
      },
    })
    await expect(listBangumiFollows(params)).resolves.toMatchObject({
      list: [{ progress: 8, latestEpisode: '全24话' }],
    })
  })
})
