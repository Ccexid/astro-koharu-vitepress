import { listBangumiFollows } from '@/api/bilibili'
import type { BangumiFollowStatus, BangumiItem, BangumiMediaType, BangumiResponse } from '@/api/bilibili'

const UPSTREAM_PAGE_SIZE = 30
export const BANGUMI_PAGE_SIZE = 10

export type BangumiCategoryFilter = BangumiMediaType | 'all'

export interface BangumiPageParams {
  vmid: string | number
  followStatus: BangumiFollowStatus
  category: BangumiCategoryFilter
  page: number
  pageSize?: number
}

export interface BangumiPage extends BangumiResponse {
  totalPages: number
}

interface TypeRange {
  type: BangumiMediaType
  start: number
  end: number
  firstPage: BangumiResponse
  firstPageNumber: number
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`)
  }
}

async function collectRange(
  params: Pick<BangumiPageParams, 'vmid' | 'followStatus'>,
  range: TypeRange,
  signal?: AbortSignal,
): Promise<BangumiItem[]> {
  const items: BangumiItem[] = []
  let cursor = range.start

  while (cursor < range.end) {
    const pageNumber = Math.floor(cursor / UPSTREAM_PAGE_SIZE) + 1
    const response =
      pageNumber === range.firstPageNumber
        ? range.firstPage
        : await listBangumiFollows(
            {
              ...params,
              type: range.type,
              page: pageNumber,
              pageSize: UPSTREAM_PAGE_SIZE,
            },
            { signal },
          )
    const pageOffset = cursor % UPSTREAM_PAGE_SIZE
    const available = response.list.length - pageOffset
    if (available <= 0) {
      throw new Error('追番列表分页数据不连续，请稍后重试。')
    }

    const count = Math.min(range.end - cursor, available)
    items.push(...response.list.slice(pageOffset, pageOffset + count))
    cursor += count
  }

  return items
}

/** Maps the UI's 10-item pages onto Bilibili's 30-item pages. */
export async function listBangumiPage(
  params: BangumiPageParams,
  options: { signal?: AbortSignal } = {},
): Promise<BangumiPage> {
  const pageSize = params.pageSize ?? BANGUMI_PAGE_SIZE
  assertPositiveInteger(params.page, 'page')
  assertPositiveInteger(pageSize, 'pageSize')

  const start = (params.page - 1) * pageSize
  const end = start + pageSize
  const types: BangumiMediaType[] = params.category === 'all' ? [1, 2] : [params.category]
  const firstPages = await Promise.all(
    types.map((type) =>
      listBangumiFollows(
        { vmid: params.vmid, type, followStatus: params.followStatus, page: 1, pageSize: UPSTREAM_PAGE_SIZE },
        options,
      ),
    ),
  )
  const total = firstPages.reduce((sum, response) => sum + response.total, 0)
  const visibleEnd = Math.min(end, total)
  const list: BangumiItem[] = []
  let typeStart = 0

  for (const [index, type] of types.entries()) {
    const firstPage = firstPages[index]!
    const typeEnd = typeStart + firstPage.total
    const rangeStart = Math.max(start, typeStart)
    const rangeEnd = Math.min(visibleEnd, typeEnd)

    if (rangeStart < rangeEnd) {
      const firstPageNumber = Math.floor((rangeStart - typeStart) / UPSTREAM_PAGE_SIZE) + 1
      let rangeFirstPage = firstPage
      if (firstPageNumber > 1) {
        rangeFirstPage = await listBangumiFollows(
          {
            vmid: params.vmid,
            type,
            followStatus: params.followStatus,
            page: firstPageNumber,
            pageSize: UPSTREAM_PAGE_SIZE,
          },
          options,
        )
      }

      list.push(
        ...(await collectRange(
          params,
          {
            type,
            start: rangeStart - typeStart,
            end: rangeEnd - typeStart,
            firstPage: rangeFirstPage,
            firstPageNumber,
          },
          options.signal,
        )),
      )
    }

    typeStart = typeEnd
  }

  return {
    list,
    total,
    page: params.page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
