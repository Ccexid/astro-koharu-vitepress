import type { CollectionItem, CollectionStatus, SubjectType } from '@/types/bangumi'
import { get } from '@/api/http'
import { apiConfig } from '@/config/api'

export interface BilibiliQuery {
  userId: string
  subjectType: SubjectType
  status: CollectionStatus
  page?: number
}
export const BILIBILI_PAGE_SIZE = 30

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
function webUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  try {
    const url = new URL(value.startsWith('//') ? 'https:' + value : value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href.replace(/^http:/, 'https:') : ''
  } catch {
    return ''
  }
}
function normalizeItem(value: unknown, query: BilibiliQuery): CollectionItem {
  const raw = record(value)
  const id = Number(raw.season_id ?? raw.media_id)
  if (!Number.isSafeInteger(id) || id < 1 || typeof raw.title !== 'string')
    throw new Error('哔哩哔哩条目数据不完整。')
  const rating = record(raw.rating).score
  const published = record(raw.publish).pub_time
  // Only the explicit watch-progress field describes the user's progress.
  const progress =
    typeof raw.progress === 'string'
      ? raw.progress.match(/(?:看到第|已看(?:至)?第?)\s*(\d+)/)?.[1]
      : undefined
  const url = webUrl(raw.url)
  return {
    id,
    source: 'bilibili',
    url:
      url && new URL(url).hostname.endsWith('.bilibili.com')
        ? url
        : `https://www.bilibili.com/bangumi/play/ss${id}`,
    title: raw.title,
    originalTitle: typeof raw.original_title === 'string' ? raw.original_title : raw.title,
    image: webUrl(raw.cover),
    date: typeof published === 'string' ? published.slice(0, 10) : '',
    score: typeof rating === 'number' && rating > 0 ? rating : null,
    ownScore: false,
    status: query.status,
    subjectType: query.subjectType,
    episodes: progress ? Number(progress) : 0,
  }
}

export async function fetchBilibiliPage(
  query: BilibiliQuery,
  signal?: AbortSignal,
): Promise<{ items: CollectionItem[]; total: number }> {
  const page = query.page ?? 1
  if (!/^\d+$/.test(query.userId) || !/[1-9]/.test(query.userId))
    throw new Error('请配置有效的哔哩哔哩 UID（VITE_API_BILIBILI_UID）。')
  if (
    ![1, 2].includes(query.subjectType) ||
    ![1, 2, 3].includes(query.status) ||
    !Number.isSafeInteger(page) ||
    page < 1
  )
    throw new RangeError('无效的追番读取参数。')
  const params = new URLSearchParams({
    vmid: query.userId,
    type: String(query.subjectType),
    follow_status: String(query.status),
    pn: String(page),
    ps: String(BILIBILI_PAGE_SIZE),
  })
  const payload = record(
    await get<unknown>(apiConfig.routes.bilibiliFollow + '?' + params, {
      signal,
      serviceName: '哔哩哔哩',
    }),
  )
  if (payload.code !== 0)
    throw new Error(`哔哩哔哩返回错误（${String(payload.code ?? '未知')}），请稍后重试。`)
  const data = record(payload.data)
  if (!Array.isArray(data.list) || !Number.isSafeInteger(data.total) || Number(data.total) < 0)
    throw new Error('哔哩哔哩返回了无法识别的数据。')
  return { items: data.list.map((item) => normalizeItem(item, query)), total: Number(data.total) }
}
