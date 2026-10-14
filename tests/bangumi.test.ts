import { afterEach, describe, expect, it, vi } from 'vitest'
import { listBangumiPage } from '../src/services/bangumi'

function makeItem(type: number, index: number) {
  return {
    season_id: type * 1000 + index,
    title: `作品 ${type}-${index}`,
    cover: `https://example.com/${type}-${index}.jpg`,
    url: `https://www.bilibili.com/bangumi/play/ss${type * 1000 + index}`,
    season_type: type,
  }
}

function installBilibiliMock(countByType: Record<number, number>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'https://local.test')
    const type = Number(url.searchParams.get('type'))
    const page = Number(url.searchParams.get('pn'))
    const pageSize = Number(url.searchParams.get('ps'))
    const total = countByType[type] ?? 0
    const start = (page - 1) * pageSize
    const list = Array.from({ length: Math.max(0, Math.min(pageSize, total - start)) }, (_, offset) =>
      makeItem(type, start + offset + 1),
    )

    return Response.json({ code: 0, data: { list, total, pn: page, ps: pageSize } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('Bangumi page service', () => {
  it('maps 10-item UI pages onto Bilibili 30-item pages', async () => {
    const fetchMock = installBilibiliMock({ 1: 37 })

    const firstPage = await listBangumiPage({ vmid: '19580033', followStatus: 2, category: 1, page: 1 })
    const secondPage = await listBangumiPage({ vmid: '19580033', followStatus: 2, category: 1, page: 2 })
    const fourthPage = await listBangumiPage({ vmid: '19580033', followStatus: 2, category: 1, page: 4 })

    expect(firstPage.list.map((item) => item.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => String(1001 + index)),
    )
    expect(secondPage.list.map((item) => item.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => String(1011 + index)),
    )
    expect(fourthPage).toMatchObject({ total: 37, page: 4, pageSize: 10, totalPages: 4 })
    expect(fourthPage.list).toHaveLength(7)
    expect(fourthPage.list[0]?.id).toBe('1031')
    expect(
      fetchMock.mock.calls.some(
        ([input]) => new URL(String(input), 'https://local.test').searchParams.get('pn') === '2',
      ),
    ).toBe(true)
  })

  it('combines categories into 10-item pages and crosses the category boundary correctly', async () => {
    installBilibiliMock({ 1: 8, 2: 33 })

    const firstPage = await listBangumiPage({ vmid: '19580033', followStatus: 2, category: 'all', page: 1 })
    const secondPage = await listBangumiPage({ vmid: '19580033', followStatus: 2, category: 'all', page: 2 })
    const fourthPage = await listBangumiPage({ vmid: '19580033', followStatus: 2, category: 'all', page: 4 })

    expect(firstPage.list.map((item) => item.id)).toEqual([
      '1001',
      '1002',
      '1003',
      '1004',
      '1005',
      '1006',
      '1007',
      '1008',
      '2001',
      '2002',
    ])
    expect(secondPage.list.map((item) => item.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => String(2003 + index)),
    )
    expect(fourthPage.list.map((item) => item.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => String(2023 + index)),
    )
    expect(fourthPage).toMatchObject({ total: 41, page: 4, totalPages: 5 })
  })

  it('rejects invalid UI pagination before issuing requests', async () => {
    const fetchMock = installBilibiliMock({ 1: 1 })

    await expect(
      listBangumiPage({ vmid: '19580033', followStatus: 2, category: 1, page: 0 }),
    ).rejects.toThrow(RangeError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
