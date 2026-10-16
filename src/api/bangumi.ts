import type { CollectionItem, CollectionPage, CollectionStatus, SubjectType } from '@/types/bangumi'
import { fetchJson } from '@/api/fetch-json'

export interface BangumiQuery {
  userId: string
  subjectType: SubjectType
  status?: CollectionStatus | 'all'
  offset?: number
  limit?: number
}
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
const apiStatus = { 1: 1, 2: 3, 3: 2, 4: 4, 5: 5 } as const
const uiStatus = { 1: 1, 2: 3, 3: 2, 4: 4, 5: 5 } as const
function normalize(value: unknown, subjectType: SubjectType): CollectionItem {
  const raw = record(value),
    subject = record(raw.subject),
    images = record(subject.images)
  const id = Number(raw.subject_id ?? subject.id)
  const state = Number(raw.type)
  if (!Number.isSafeInteger(id) || id < 1 || ![1, 2, 3, 4, 5].includes(state))
    throw new Error('Bangumi 条目数据不完整。')
  const rate = typeof raw.rate === 'number' && raw.rate > 0 ? raw.rate : null
  const score = typeof subject.score === 'number' && subject.score > 0 ? subject.score : null
  let image = ''
  try {
    const url = new URL(String(images.common || images.medium || images.large || ''))
    if (url.protocol === 'https:') image = url.href
  } catch {
    /* Missing artwork uses the shared poster fallback. */
  }
  return {
    id,
    source: 'bangumi',
    url: `https://bgm.tv/subject/${id}`,
    title: String(subject.name_cn || subject.name || '未命名条目'),
    originalTitle: String(subject.name || ''),
    image,
    date: typeof subject.date === 'string' ? subject.date : '',
    score: rate ?? score,
    ownScore: rate !== null,
    status: uiStatus[state as keyof typeof uiStatus],
    subjectType,
    episodes: typeof raw.ep_status === 'number' ? raw.ep_status : 0,
  }
}
export async function fetchBangumiPage(query: BangumiQuery, signal?: AbortSignal): Promise<CollectionPage> {
  const { userId, subjectType, status = 'all', offset = 0, limit = 24 } = query
  if (!userId.trim()) throw new Error('请配置 Bangumi 用户名（VITE_BANGUMI_USER_ID）。')
  if (
    ![1, 2, 3, 4, 6].includes(subjectType) ||
    (status !== 'all' && ![1, 2, 3, 4, 5].includes(status)) ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 50
  )
    throw new RangeError('无效的 Bangumi 读取参数。')
  const url = new URL('https://api.bgm.tv/v0/users/' + encodeURIComponent(userId.trim()) + '/collections')
  url.searchParams.set('subject_type', String(subjectType))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(limit))
  if (status !== 'all') url.searchParams.set('type', String(apiStatus[status]))
  const payload = record(
    await fetchJson<unknown>(url, {
      signal,
      serviceName: 'Bangumi',
    }),
  )
  if (!Array.isArray(payload.data) || !Number.isSafeInteger(payload.total) || Number(payload.total) < 0)
    throw new Error('Bangumi 返回了无法识别的数据。')
  return {
    items: payload.data.map((item) => normalize(item, subjectType)),
    total: Number(payload.total),
    offset,
    limit,
  }
}
