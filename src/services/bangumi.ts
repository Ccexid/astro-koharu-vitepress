import { fetchCollectionPage, type CollectionQuery } from '@/api/bangumi'
import { collectionStatuses, subjectTypes, type CollectionPage, type SubjectType } from '@/types/bangumi'
export const BANGUMI_BATCH_SIZE = 24
export function listBangumiCollection(
  query: CollectionQuery,
  options: { signal?: AbortSignal } = {},
): Promise<CollectionPage> {
  return fetchCollectionPage({ ...query, limit: query.limit ?? BANGUMI_BATCH_SIZE }, options.signal)
}
export async function getSubjectCounts(
  userId: string,
  signal?: AbortSignal,
): Promise<Record<number, number>> {
  const results = await Promise.all(
    subjectTypes.map(async ({ value }) => {
      const page = await fetchCollectionPage({ userId, subjectType: value, limit: 1 }, signal)
      return [value, page.total] as const
    }),
  )
  return Object.fromEntries(results)
}
export async function getStatusCounts(
  userId: string,
  subjectType: SubjectType,
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const results = await Promise.all(
    collectionStatuses.map(async ({ value }) => {
      const page = await fetchCollectionPage({ userId, subjectType, status: value, limit: 1 }, signal)
      return [value, page.total] as const
    }),
  )
  return Object.fromEntries(results)
}
