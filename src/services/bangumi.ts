import { BILIBILI_PAGE_SIZE, fetchBilibiliPage } from '@/api/bilibili'
import { fetchBangumiPage } from '@/api/bangumi'
import {
  subjectTypes,
  bangumiSubjectTypes,
  bangumiStatuses,
  type CollectionSource,
  type CollectionPage,
  type CollectionItem,
  type CollectionStatus,
  type SubjectType,
} from '@/types/bangumi'
export const BANGUMI_BATCH_SIZE = 24
export interface CollectionQuery {
  source?: CollectionSource
  userId: string
  subjectType: SubjectType
  status?: CollectionStatus | 'all'
  offset?: number
  limit?: number
}
const statuses: CollectionStatus[] = [2, 1, 3]
export async function listBangumiCollection(
  query: CollectionQuery,
  options: { signal?: AbortSignal } = {},
): Promise<CollectionPage> {
  if (query.source === 'bangumi') return fetchBangumiPage(query, options.signal)
  const { offset = 0, limit = BANGUMI_BATCH_SIZE } = query
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 30)
    throw new RangeError('无效的追番读取范围。')
  const selected = query.status === undefined || query.status === 'all' ? statuses : [query.status]
  // Concatenate state ranges consistently: watching, wish, watched. Read only the required windows.
  const firstPages = await Promise.all(
    selected.map((status) => fetchBilibiliPage({ ...query, status, page: 1 }, options.signal)),
  )
  const total = firstPages.reduce((sum, page) => sum + page.total, 0)
  const items: CollectionItem[] = []
  let stateOffset = 0
  for (const [index, status] of selected.entries()) {
    const first = firstPages[index]!
    const end = Math.min(offset + limit - stateOffset, first.total)
    let start = Math.max(0, offset - stateOffset)
    while (start < end) {
      const pageNumber = Math.floor(start / BILIBILI_PAGE_SIZE) + 1
      const result =
        pageNumber === 1
          ? first
          : await fetchBilibiliPage({ ...query, status, page: pageNumber }, options.signal)
      const chunk = result.items.slice(
        start % BILIBILI_PAGE_SIZE,
        Math.min(BILIBILI_PAGE_SIZE, (start % BILIBILI_PAGE_SIZE) + end - start),
      )
      if (!chunk.length) throw new Error('追番数据暂时不连续，请重试。')
      items.push(...chunk)
      start += chunk.length
    }
    stateOffset += first.total
  }
  return { items, total, offset, limit }
}
export async function getSubjectCounts(
  userId: string,
  signal?: AbortSignal,
  source: CollectionSource = 'bilibili',
): Promise<Record<number, number>> {
  if (source === 'bangumi') {
    const entries = await Promise.all(
      bangumiSubjectTypes.map(async ({ value }) => {
        const page = await fetchBangumiPage({ userId, subjectType: value, limit: 1 }, signal)
        return [value, page.total] as const
      }),
    )
    return Object.fromEntries(entries)
  }
  const results = await Promise.all(
    subjectTypes.map(async ({ value }) => {
      const counts = await getStatusCounts(userId, value, signal)
      return [value, counts.all!] as const
    }),
  )
  return Object.fromEntries(results)
}
export async function getStatusCounts(
  userId: string,
  subjectType: SubjectType,
  signal?: AbortSignal,
  source: CollectionSource = 'bilibili',
): Promise<Record<string, number>> {
  if (source === 'bangumi') {
    const entries = await Promise.all(
      bangumiStatuses.map(async ({ value }) => {
        const page = await fetchBangumiPage({ userId, subjectType, status: value, limit: 1 }, signal)
        return [value, page.total] as const
      }),
    )
    return Object.fromEntries(entries)
  }
  const results = await Promise.all(
    statuses.map(async (value) => {
      const page = await fetchBilibiliPage({ userId, subjectType, status: value }, signal)
      return [value, page.total] as const
    }),
  )
  return { ...Object.fromEntries(results), all: results.reduce((sum, [, total]) => sum + total, 0) }
}
