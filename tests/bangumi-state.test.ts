import { effectScope, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
const services = vi.hoisted(() => ({ list: vi.fn(), types: vi.fn(), statuses: vi.fn() }))
vi.mock('../src/services/bangumi', () => ({
  BANGUMI_BATCH_SIZE: 24,
  listBangumiCollection: services.list,
  getSubjectCounts: services.types,
  getStatusCounts: services.statuses,
}))
import { useBangumiCollection } from '../src/composables/useBangumiCollection'
function item(id: number) {
  return {
    id,
    url: 'https://www.bilibili.com/bangumi/play/ss' + id,
    title: '作品 ' + id,
    originalTitle: '',
    image: '',
    date: '',
    score: null,
    ownScore: false,
    status: 3 as const,
    subjectType: 2 as const,
    episodes: 0,
  }
}
async function settle() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
afterEach(() => vi.resetAllMocks())
describe('collection filters and incremental loading', () => {
  it('cancels a removed provider panel and uses the other account without mixing responses', async () => {
    services.types.mockResolvedValue({ 2: 1 })
    services.statuses.mockResolvedValue({ all: 1 })
    let resolveOld!: (value: unknown) => void
    let oldSignal!: AbortSignal
    services.list
      .mockImplementationOnce((_query: unknown, options: { signal: AbortSignal }) => {
        oldSignal = options.signal
        return new Promise((resolve) => {
          resolveOld = resolve
        })
      })
      .mockResolvedValueOnce({
        items: [{ ...item(77), source: 'bangumi', url: 'https://bgm.tv/subject/77' }],
        total: 1,
        offset: 0,
        limit: 24,
      })
    const firstScope = effectScope()
    const first = firstScope.run(() => useBangumiCollection('19580033', 'bilibili'))!
    firstScope.stop()
    expect(oldSignal.aborted).toBe(true)
    const secondScope = effectScope()
    const second = secondScope.run(() => useBangumiCollection('ccexid', 'bangumi'))!
    await settle()
    resolveOld({ items: [item(99)], total: 1, offset: 0, limit: 24 })
    await settle()
    expect(first.items.value).toEqual([])
    expect(second.items.value.map((entry) => entry.id)).toEqual([77])
    expect(services.list.mock.calls[1]![0]).toMatchObject({
      source: 'bangumi',
      userId: 'ccexid',
      subjectType: 2,
      status: 'all',
    })
    expect(services.types).toHaveBeenLastCalledWith('ccexid', expect.any(AbortSignal), 'bangumi')
    secondScope.stop()
  })
  it('ignores stale filter results, cancels them and appends without duplicate subjects', async () => {
    services.types.mockResolvedValue({ 2: 25 })
    services.statuses.mockResolvedValue({ all: 25, 3: 25 })
    let resolveOld!: (value: unknown) => void
    let oldSignal: AbortSignal | undefined
    services.list
      .mockImplementationOnce((_query: unknown, options: { signal: AbortSignal }) => {
        oldSignal = options.signal
        return new Promise((resolve) => {
          resolveOld = resolve
        })
      })
      .mockResolvedValueOnce({ items: [item(2)], total: 3, offset: 0, limit: 24 })
      .mockResolvedValueOnce({ items: [item(2), item(3)], total: 3, offset: 1, limit: 24 })
    const scope = effectScope()
    const collection = scope.run(() => useBangumiCollection('demo'))!
    collection.status.value = 3
    await settle()
    expect(oldSignal?.aborted).toBe(true)
    resolveOld({ items: [item(99)], total: 1, offset: 0, limit: 24 })
    await settle()
    expect(collection.items.value.map((entry) => entry.id)).toEqual([2])
    await collection.load(true)
    expect(collection.items.value.map((entry) => entry.id)).toEqual([2, 3])
    expect(collection.hasMore.value).toBe(false)
    expect(services.list.mock.calls[2]![0]).toMatchObject({ offset: 1, status: 3 })
    scope.stop()
  })
  it('keeps existing items after load-more failure and retries the same offset', async () => {
    services.types.mockResolvedValue({ 2: 2 })
    services.statuses.mockResolvedValue({ all: 2 })
    services.list
      .mockResolvedValueOnce({ items: [item(1)], total: 2, offset: 0, limit: 24 })
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce({ items: [item(2)], total: 2, offset: 1, limit: 24 })
    const scope = effectScope()
    const collection = scope.run(() => useBangumiCollection('demo'))!
    await settle()
    await collection.load(true)
    expect(collection.items.value.map((entry) => entry.id)).toEqual([1])
    expect(collection.moreError.value).toBe('temporary')
    await collection.load(true)
    expect(collection.items.value.map((entry) => entry.id)).toEqual([1, 2])
    expect(collection.moreError.value).toBe('')
    expect(services.list.mock.calls.slice(1).map((call) => call[0].offset)).toEqual([1, 1])
    scope.stop()
  })
})
