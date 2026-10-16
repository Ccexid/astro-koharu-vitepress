import { computed, onScopeDispose, ref, watch } from 'vue'
import {
  BANGUMI_BATCH_SIZE,
  getStatusCounts,
  getSubjectCounts,
  listBangumiCollection,
} from '@/services/bangumi'
import type { CollectionItem, CollectionStatus, SubjectType, CollectionSource } from '@/types/bangumi'
export function useBangumiCollection(userId: string, source: CollectionSource = 'bilibili') {
  const subjectType = ref<SubjectType>(source === 'bangumi' ? 2 : 1)
  const status = ref<CollectionStatus | 'all'>('all')
  const items = ref<CollectionItem[]>([])
  const total = ref(0)
  const offset = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')
  const moreError = ref('')
  const typeCounts = ref<Record<number, number>>({})
  const statusCounts = ref<Record<string, number>>({})
  const countsError = ref('')
  const hasMore = computed(() => offset.value < total.value)
  let request = 0
  let controller: AbortController | undefined
  let statusController: AbortController | undefined
  const typesController = new AbortController()
  function message(cause: unknown): string {
    if (cause instanceof Error && cause.name === 'TimeoutError') return '读取超时，请重试。'
    if (cause instanceof TypeError)
      return `无法连接${source === 'bangumi' ? ' Bangumi' : '哔哩哔哩'}，请检查网络后重试。`
    return cause instanceof Error ? cause.message : '收藏暂时无法读取，请重试。'
  }
  async function load(more = false) {
    if (more && (loading.value || loadingMore.value || !hasMore.value)) return
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal
    const id = ++request
    const nextOffset = more ? offset.value : 0
    if (more) {
      loadingMore.value = true
      moreError.value = ''
    } else {
      loading.value = true
      error.value = ''
      moreError.value = ''
      items.value = []
      offset.value = 0
      total.value = 0
    }
    try {
      const page = await listBangumiCollection(
        {
          source,
          userId,
          subjectType: subjectType.value,
          status: status.value,
          offset: nextOffset,
          limit: BANGUMI_BATCH_SIZE,
        },
        { signal },
      )
      if (signal.aborted || id !== request) return
      if (!page.items.length && nextOffset < page.total) throw new Error('收藏数据暂时不连续，请重试。')
      const merged = more ? [...items.value, ...page.items] : page.items
      items.value = [...new Map(merged.map((item) => [item.id, item])).values()]
      total.value = page.total
      offset.value = nextOffset + page.items.length
    } catch (cause) {
      if (!signal.aborted && id === request) {
        if (more) moreError.value = message(cause)
        else error.value = message(cause)
      }
    } finally {
      if (id === request) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }
  async function loadCounts() {
    countsError.value = ''
    try {
      typeCounts.value = await getSubjectCounts(userId, typesController.signal, source)
    } catch (cause) {
      if (!typesController.signal.aborted) countsError.value = message(cause)
    }
  }
  async function loadStatusCounts() {
    statusController?.abort()
    statusController = new AbortController()
    const signal = statusController.signal
    statusCounts.value = {}
    try {
      const counts = await getStatusCounts(userId, subjectType.value, signal, source)
      if (!signal.aborted) statusCounts.value = counts
    } catch (cause) {
      if (!signal.aborted) countsError.value = message(cause)
    }
  }
  watch(
    subjectType,
    () => {
      status.value = 'all'
      void loadStatusCounts()
    },
    { immediate: true, flush: 'sync' },
  )
  watch(
    [subjectType, status],
    () => {
      void load()
    },
    { immediate: true },
  )
  void loadCounts()
  onScopeDispose(() => {
    controller?.abort()
    statusController?.abort()
    typesController.abort()
    request++
  })
  async function retryCounts() {
    await Promise.all([loadCounts(), loadStatusCounts()])
  }
  return {
    subjectType,
    status,
    items,
    total,
    loading,
    loadingMore,
    error,
    moreError,
    typeCounts,
    statusCounts,
    countsError,
    hasMore,
    load,
    retryCounts,
  }
}
