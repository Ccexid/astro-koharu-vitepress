<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import BangumiFilters from '@/components/bangumi/BangumiFilters.vue'
import BangumiPagination from '@/components/bangumi/BangumiPagination.vue'
import BangumiResults from '@/components/bangumi/BangumiResults.vue'
import {
  BANGUMI_PAGE_SIZE,
  listBangumiPage,
  type BangumiCategoryFilter,
  type BangumiPage,
} from '@/services/bangumi'
import type { BangumiFollowStatus } from '@/api/bilibili'

const vmid = ref<string | number>(import.meta.env.VITE_API_BILIBILI_UID)
const followStatus = ref<BangumiFollowStatus>(2)
const category = ref<BangumiCategoryFilter>('all')
const currentPage = ref(1)
const result = ref<BangumiPage>()
const isLoading = ref(true)
const errorMessage = ref('')

let activeController: AbortController | undefined
let requestId = 0

async function loadPage(): Promise<void> {
  activeController?.abort()
  const controller = new AbortController()
  activeController = controller
  const currentRequest = ++requestId
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (!vmid.value || !String(vmid.value).trim()) {
      throw new Error('请在环境变量 VITE_API_BILIBILI_UID 中配置 Bilibili 用户 ID。')
    }

    const response = await listBangumiPage(
      {
        vmid: vmid.value,
        followStatus: followStatus.value,
        category: category.value,
        page: currentPage.value,
        pageSize: BANGUMI_PAGE_SIZE,
      },
      { signal: controller.signal },
    )

    if (currentRequest !== requestId) return
    if (response.totalPages > 0 && currentPage.value > response.totalPages) {
      currentPage.value = response.totalPages
      return
    }
    result.value = response
  } catch (error) {
    if (controller.signal.aborted || currentRequest !== requestId) return
    errorMessage.value = getErrorMessage(error)
  } finally {
    if (currentRequest === requestId) isLoading.value = false
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('HTTP 403')) {
    return 'Bilibili 拒绝了这次请求，请检查代理设置或稍后重试。'
  }
  if (error instanceof Error && error.message) return error.message
  return '追番列表暂时无法读取，请稍后重试。'
}

watch(
  [followStatus, category, currentPage],
  ([nextStatus, nextCategory, nextPage], [previousStatus, previousCategory]) => {
    if ((nextStatus !== previousStatus || nextCategory !== previousCategory) && nextPage !== 1) {
      currentPage.value = 1
      return
    }
    void loadPage()
  },
  { immediate: true },
)

onBeforeUnmount(() => activeController?.abort())
</script>

<template>
  <PageHeading title="追番记录" eyebrow="BANGUMI" description="把想看的故事收好，也记下正在追的每一集。" />

  <section class="bangumi-page" aria-label="追番列表" :aria-busy="isLoading">
    <BangumiFilters
      :category="category"
      :follow-status="followStatus"
      @update:category="category = $event"
      @update:follow-status="followStatus = $event"
    />

    <BangumiResults
      :result="result"
      :is-loading="isLoading"
      :error-message="errorMessage"
      :page-size="BANGUMI_PAGE_SIZE"
      @retry="loadPage"
    />

    <BangumiPagination
      v-if="result && result.list.length > 0 && result.totalPages > 1 && !isLoading && !errorMessage"
      :current-page="currentPage"
      :total-pages="result.totalPages"
      :is-loading="isLoading"
      @change="currentPage = $event"
    />
  </section>
</template>
