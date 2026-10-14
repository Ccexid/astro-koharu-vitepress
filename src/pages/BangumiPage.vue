<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import BangumiFilters from '@/components/bangumi/BangumiFilters.vue'
import BangumiResults from '@/components/bangumi/BangumiResults.vue'
import { BANGUMI_PAGE_SIZE, listBangumiPage, type BangumiCategoryFilter } from '@/services/bangumi'
import type { BangumiFollowStatus, BangumiItem } from '@/api/bilibili'

const vmid = ref<string | number>(import.meta.env.VITE_API_BILIBILI_UID)
const followStatus = ref<BangumiFollowStatus>(2)
const category = ref<BangumiCategoryFilter>('all')
const items = ref<BangumiItem[]>([])
const total = ref(0)
const loadedPage = ref(0)
const totalPages = ref(0)
const isInitialLoading = ref(true)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const loadMoreError = ref('')

const hasMore = computed(() => loadedPage.value < totalPages.value)

let activeController: AbortController | undefined
let requestId = 0

async function loadPage(page: number, mode: 'initial' | 'more'): Promise<void> {
  if (mode === 'more' && (isInitialLoading.value || isLoadingMore.value || !hasMore.value)) return

  activeController?.abort()
  const controller = new AbortController()
  activeController = controller
  const currentRequest = ++requestId

  if (mode === 'initial') {
    isInitialLoading.value = true
    errorMessage.value = ''
  } else {
    isLoadingMore.value = true
    loadMoreError.value = ''
  }

  try {
    if (!vmid.value || !String(vmid.value).trim()) {
      throw new Error('请在环境变量 VITE_API_BILIBILI_UID 中配置 Bilibili 用户 ID。')
    }

    const response = await listBangumiPage(
      {
        vmid: vmid.value,
        followStatus: followStatus.value,
        category: category.value,
        page,
        pageSize: BANGUMI_PAGE_SIZE,
      },
      { signal: controller.signal },
    )

    if (currentRequest !== requestId) return
    items.value = page === 1 ? response.list : [...items.value, ...response.list]
    total.value = response.total
    loadedPage.value = page
    totalPages.value = response.totalPages
  } catch (error) {
    if (controller.signal.aborted || currentRequest !== requestId) return
    if (mode === 'initial') {
      errorMessage.value = getErrorMessage(error)
    } else {
      loadMoreError.value = getErrorMessage(error)
    }
  } finally {
    if (currentRequest !== requestId) return
    if (mode === 'initial') {
      isInitialLoading.value = false
    } else {
      isLoadingMore.value = false
    }
  }
}

function loadFirstPage(): void {
  void loadPage(1, 'initial')
}

function loadNextPage(): void {
  void loadPage(loadedPage.value + 1, 'more')
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('HTTP 403')) {
    return 'Bilibili 拒绝了这次请求，请检查代理设置或稍后重试。'
  }
  if (error instanceof Error && error.message) return error.message
  return '追番列表暂时无法读取，请稍后重试。'
}

watch(
  [followStatus, category],
  () => {
    activeController?.abort()
    items.value = []
    total.value = 0
    loadedPage.value = 0
    totalPages.value = 0
    isInitialLoading.value = true
    isLoadingMore.value = false
    errorMessage.value = ''
    loadMoreError.value = ''
    loadFirstPage()
  },
  { immediate: true },
)

onBeforeUnmount(() => activeController?.abort())
</script>

<template>
  <PageHeading title="追番记录" eyebrow="BANGUMI" description="把想看的故事收好，也记下正在追的每一集。" />

  <section class="bangumi-page" aria-label="追番列表" :aria-busy="isInitialLoading || isLoadingMore">
    <BangumiFilters
      :category="category"
      :follow-status="followStatus"
      @update:category="category = $event"
      @update:follow-status="followStatus = $event"
    />

    <BangumiResults
      :items="items"
      :total="total"
      :is-loading="isInitialLoading"
      :is-loading-more="isLoadingMore"
      :error-message="errorMessage"
      :load-more-error="loadMoreError"
      :has-more="hasMore"
      @retry="loadFirstPage"
      @load-more="loadNextPage"
      @retry-load-more="loadNextPage"
    />
  </section>
</template>
