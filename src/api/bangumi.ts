import type { CollectionItem, CollectionPage, CollectionStatus, SubjectType } from '@/types/bangumi'
export interface CollectionQuery {
  userId: string
  subjectType: SubjectType
  status?: CollectionStatus | 'all'
  offset?: number
  limit?: number
}
const API_BASE = 'https://api.bgm.tv/v0'
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
function positiveId(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) throw new Error('收藏条目数据不完整。')
  return Number(value)
}
function imageUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}
function normalizeItem(value: unknown, subjectType: SubjectType): CollectionItem {
  const item = record(value)
  const subject = record(item.subject)
  const images = record(subject.images)
  const rate = typeof item.rate === 'number' && item.rate > 0 ? item.rate : 0
  const score = typeof subject.score === 'number' && subject.score > 0 ? subject.score : null
  if (![1, 2, 3, 4, 5].includes(Number(item.type))) throw new Error('收藏状态数据不完整。')
  return {
    id: positiveId(item.subject_id ?? subject.id),
    title: String(subject.name_cn || subject.name || '未命名条目'),
    originalTitle: String(subject.name || ''),
    image: imageUrl(images.common || images.medium || images.large),
    date: typeof subject.date === 'string' ? subject.date : '',
    score: rate || score,
    ownScore: rate > 0,
    status: Number(item.type) as CollectionStatus,
    subjectType,
    episodes: typeof item.ep_status === 'number' ? item.ep_status : 0,
  }
}
export async function fetchCollectionPage(
  query: CollectionQuery,
  signal?: AbortSignal,
): Promise<CollectionPage> {
  const { userId, subjectType, status = 'all', limit = 24, offset = 0 } = query
  if (!userId.trim()) throw new Error('请配置 Bangumi 用户名。')
  if (![1, 2, 3, 4, 6].includes(subjectType)) throw new RangeError('无效的媒介类型。')
  if (status !== 'all' && ![1, 2, 3, 4, 5].includes(status)) throw new RangeError('无效的收藏状态。')
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50)
    throw new RangeError('无效的收藏读取范围。')
  const url = new URL(API_BASE + '/users/' + encodeURIComponent(userId.trim()) + '/collections')
  url.searchParams.set('subject_type', String(subjectType))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  if (status !== 'all') url.searchParams.set('type', String(status))
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  })
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? '找不到这个 Bangumi 用户或公开收藏。'
        : 'Bangumi 暂时无法读取（HTTP ' + response.status + '），请稍后重试。',
    )
  const payload = record(await response.json())
  if (!Array.isArray(payload.data) || !Number.isSafeInteger(payload.total) || Number(payload.total) < 0)
    throw new Error('Bangumi 返回了无法识别的数据。')
  return {
    items: payload.data.map((value) => normalizeItem(value, subjectType)),
    total: Number(payload.total),
    limit,
    offset,
  }
}
